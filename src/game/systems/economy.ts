import { BUILDINGS } from '../data/buildings';
import { emit } from '../core/events';
import { GEM_MULTIPLIER, HARVEST_BITE, HARVEST_INTERVAL, ORE_REGROW_AMOUNT, ORE_MINE_OUTPUT, ORE_REGROW_INTERVAL, ORE_SPREAD_CHANCE, ORE_TILE_MAX, UNLOAD_BITE, UNLOAD_INTERVAL } from '../data/config';
import { UNITS } from '../data/units';
import { blocked, ownBuildings, exitRow } from '../core/entities';
import type { Entity, GameState } from '../types';
import { idx, nextRandom, regions, T } from '../world/map';
import { isMoving, moveStep, requestMove } from './movement';

/** Refinery docking point: the tile just below the footprint's middle. */
export function dockOf(r: Entity): [number, number] {
  if (r.kind === 'unit') return [r.x, r.y]; // deployed Thrall Hauler
  const d = BUILDINGS[r.def];
  return [r.x + Math.floor(d.w / 2) + 0.5, exitRow(r)[0] + 0.5];
}

/** Nearest ore tile to (x,y), skipping tiles other harvesters are heading to when possible. */
export function findOre(s: GameState, x: number, y: number, self?: Entity, maxR = 40): number {
  const m = s.map;
  const claimed = new Set<number>();
  for (const e of s.entities) if (e !== self && e.kind === 'unit' && e.hstate !== 'seek' && UNITS[e.def].harvester) claimed.add(idx(m, Math.floor(e.gx), Math.floor(e.gy)));
  // Only ore in the harvester's own terrain region is reachable (no hopeless trips across rivers or into rock pockets).
  const reg = regions(m), home = reg[idx(m, Math.min(m.w - 1, Math.max(0, Math.floor(x))), Math.min(m.h - 1, Math.max(0, Math.floor(y))))];
  let best = -1, bestD = Infinity, fallback = -1, fallbackD = Infinity;
  const x0 = Math.max(0, Math.floor(x - maxR)), x1 = Math.min(m.w - 1, Math.floor(x + maxR));
  const y0 = Math.max(0, Math.floor(y - maxR)), y1 = Math.min(m.h - 1, Math.floor(y + maxR));
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++) {
      const i = ty * m.w + tx;
      if (m.ore[i] === 0 || blocked(s, i) || i === self?.badOre || (home >= 0 && reg[i] !== home)) continue;
      const d = (tx + 0.5 - x) ** 2 + (ty + 0.5 - y) ** 2;
      if (claimed.has(i)) { if (d < fallbackD) { fallbackD = d; fallback = i; } }
      else if (d < bestD) { bestD = d; best = i; }
    }
  return best >= 0 ? best : fallback;
}

export function nearestRefinery(s: GameState, e: Entity): Entity | undefined {
  if (e.master) { const m = s.rt.byId.get(e.master); return m?.deployed ? m : undefined; } // thralls only serve their hauler
  let best: Entity | undefined, bestD = Infinity;
  for (const r of ownBuildings(s, e.owner, 'refinery')) {
    const [dx, dy] = dockOf(r);
    const d = Math.hypot(dx - e.x, dy - e.y);
    if (d < bestD) { bestD = d; best = r; }
  }
  return best;
}

/** Harvester state machine: seek → toOre → harvest → toRef → unload → seek. */
export function harvestTick(s: GameState, e: Entity) {
  const cap = UNITS[e.def].harvester!.capacity;
  const m = s.map;
  if (e.deployed) return; // rigged Thrall Hauler: its thralls do the work
  const boss = e.master ? s.rt.byId.get(e.master) : undefined;
  if (e.master && (!boss || boss.hp <= 0 || boss.owner !== e.owner)) e.master = undefined; // freed: works for the nearest refinery
  if (boss && e.master && !boss.deployed) {
    // Hauler on the move: tag along.
    if (Math.hypot(boss.x - e.x, boss.y - e.y) > 2.5 && (!isMoving(e) || Math.hypot(boss.x - e.gx, boss.y - e.gy) > 2)) requestMove(e, boss.x, boss.y + 0.8);
    moveStep(s, e);
    e.hstate = 'seek';
    return;
  }
  const st = moveStep(s, e);
  switch (e.hstate) {
    case 'wait':
      if (--e.hTimer <= 0) e.hstate = e.cargo >= cap ? 'toRef' : 'seek';
      return;
    case 'seek': {
      if (e.cargo >= cap) { goRefinery(s, e); return; }
      const i = boss && e.master ? findOre(s, boss.x, boss.y, e, 7) : findOre(s, e.x, e.y, e);
      if (i < 0) { if (e.cargo > 0) goRefinery(s, e); else { e.hstate = 'wait'; e.hTimer = 60; } return; }
      requestMove(e, (i % m.w) + 0.5, Math.floor(i / m.w) + 0.5);
      e.hstate = 'toOre';
      return;
    }
    case 'toOre': {
      const i = idx(m, Math.floor(e.gx), Math.floor(e.gy));
      if (m.ore[i] === 0) { e.hstate = 'seek'; return; }
      if (st === 'arrived' || (!isMoving(e) && Math.hypot(e.gx - e.x, e.gy - e.y) < 0.8)) { e.hstate = 'harvest'; e.hTimer = HARVEST_INTERVAL; }
      else if (st === 'gaveUp' || !isMoving(e)) { e.badOre = i; e.hstate = 'wait'; e.hTimer = 20; } // unreachable: skip this tile next time
      return;
    }
    case 'harvest': {
      if (--e.hTimer > 0) return;
      e.hTimer = HARVEST_INTERVAL;
      const i = idx(m, Math.floor(e.x), Math.floor(e.y));
      const take = Math.min(HARVEST_BITE, m.ore[i], cap - e.cargo);
      m.ore[i] -= take;
      e.cargo += take;
      if (m.ore[i] === 0) m.gem[i] = 0;
      if (e.cargo >= cap) goRefinery(s, e);
      else if (m.ore[i] === 0) {
        const n = findOre(s, e.x, e.y, e, 4);
        if (n >= 0) { requestMove(e, (n % m.w) + 0.5, Math.floor(n / m.w) + 0.5); e.hstate = 'toOre'; }
        else if (e.cargo > 0) goRefinery(s, e);
        else e.hstate = 'seek';
      }
      return;
    }
    case 'toRef': {
      const r = s.rt.byId.get(e.targetId);
      if (!r || r.hp <= 0) { goRefinery(s, e); return; }
      const [dx, dy] = dockOf(r);
      const dd = Math.hypot(dx - e.x, dy - e.y);
      // Docked, or wedged right next to the dock with no path (e.g. a diagonal gap between buildings).
      if (dd < 0.9 || (st === 'gaveUp' && dd < 1.6)) { e.hstate = 'unload'; e.hTimer = UNLOAD_INTERVAL; return; }
      if (st === 'gaveUp') { e.hstate = 'wait'; e.hTimer = 45; return; } // blocked in: retry later, not every tick
      if (!isMoving(e)) requestMove(e, dx, dy);
      return;
    }
    case 'unload': {
      const r = s.rt.byId.get(e.targetId);
      if (!r || r.hp <= 0) { goRefinery(s, e); return; }
      if (--e.hTimer > 0) return;
      e.hTimer = UNLOAD_INTERVAL;
      const give = Math.min(UNLOAD_BITE, e.cargo);
      e.cargo -= give;
      const p = s.players[e.owner];
      p.credits += give;
      p.stats.harvested += give;
      emit(s, { type: 'income', owner: e.owner, id: r.id, amount: give });
      if (e.cargo <= 0) e.hstate = 'seek';
      return;
    }
  }
}

function goRefinery(s: GameState, e: Entity) {
  const r = nearestRefinery(s, e);
  if (!r) { e.hstate = 'wait'; e.hTimer = 90; return; }
  e.targetId = r.id;
  const [dx, dy] = dockOf(r);
  requestMove(e, dx, dy);
  e.hstate = 'toRef';
}

export function updatePower(s: GameState) {
  for (const p of s.players) {
    const wasLow = p.powerUsed > p.powerMade;
    p.powerMade = 0; p.powerUsed = 0;
    const out = (p.outage ?? 0) > s.tick; // infiltrated power plant: blackout
    for (const e of s.entities) {
      if (e.owner !== p.id || e.kind !== 'building' || e.hp <= 0 || e.built < 1) continue;
      const pw = BUILDINGS[e.def].power;
      if (pw > 0) p.powerMade += out ? 0 : pw; else p.powerUsed -= pw;
    }
    if (!wasLow && p.powerUsed > p.powerMade) emit(s, { type: 'lowPower', owner: p.id });
  }
}

export const isLowPower = (s: GameState, owner: number) => s.players[owner].powerUsed > s.players[owner].powerMade;

/** Radar coverage (minimap) needs a finished radar and enough power. */
export const hasRadar = (s: GameState, owner: number) =>
  !isLowPower(s, owner) && s.entities.some((e) => e.owner === owner && e.def === 'radar' && e.hp > 0 && e.built >= 1);

/** Ore regrowth by `settings.oreRules` (Fun Pass 20.5: the economy can be compared with nothing else changed). */
export function regrowOre(s: GameState) {
  if (s.tick % ORE_REGROW_INTERVAL !== 0) return;
  const rules = s.settings.oreRules ?? 'v12';
  if (rules !== 'v12') throw new Error(`oreRules '${rules}' does not exist yet (Fun Pass phase 23)`);
  regrowOreV12(s);
}

/** Ore patches regrow up to their tile maximum, and rich tiles slowly spread onto empty open ground. */
function regrowOreV12(s: GameState) {
  const m = s.map;
  const seeds: number[] = [];
  for (let i = 0; i < m.ore.length; i++) {
    if (m.ore[i] === 0) continue;
    const max = ORE_TILE_MAX * (m.gem[i] ? GEM_MULTIPLIER : 1);
    if (m.ore[i] < max) m.ore[i] = Math.min(max, m.ore[i] + ORE_REGROW_AMOUNT);
    if (m.ore[i] * 2 >= max && nextRandom(s) < ORE_SPREAD_CHANCE) seeds.push(i);
  }
  for (const i of seeds) {
    const x = i % m.w, y = (i / m.w) | 0, k = Math.floor(nextRandom(s) * 4);
    const nx = x + [1, -1, 0, 0][k], ny = y + [0, 0, 1, -1][k];
    if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
    const j = ny * m.w + nx, t = m.terrain[j];
    if (m.ore[j] || s.rt.grid[j] !== 0 || (t !== T.Grass && t !== T.Sand)) continue;
    m.ore[j] = ORE_REGROW_AMOUNT;
    m.gem[j] = m.gem[i];
  }
  // Ore mines feed a random tile within 2 tiles, whatever its level (up to the max).
  for (const src of m.oreSources) {
    const x = (src.i % m.w) + Math.floor(nextRandom(s) * 5) - 2, y = Math.floor(src.i / m.w) + Math.floor(nextRandom(s) * 5) - 2;
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
    const j = y * m.w + x, t = m.terrain[j];
    if (s.rt.grid[j] !== 0 || (t !== T.Grass && t !== T.Sand) || (m.ore[j] && !!m.gem[j] !== src.gem)) continue;
    const max = ORE_TILE_MAX * (src.gem ? GEM_MULTIPLIER : 1);
    m.ore[j] = Math.min(max, m.ore[j] + ORE_MINE_OUTPUT * (src.gem ? GEM_MULTIPLIER : 1));
    m.gem[j] = src.gem ? 1 : 0;
  }
}
