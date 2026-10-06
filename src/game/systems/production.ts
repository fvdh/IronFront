import { BUILDINGS } from '../data/buildings';
import { emit } from '../core/events';
import { logDecision } from './telemetry';
import { BUILD_RADIUS, DIFFICULTY, LOW_POWER_PRODUCTION, QUEUE_LIMIT, SANDBOX_BUILD_SPEED, TICK_RATE } from '../data/config';
import { UNITS } from '../data/units';
import { FACTIONS } from '../data/factions';
import { centerX, centerY, exitRow, freeSpot, ownBuildings, spawnBuilding, spawnUnit } from '../core/entities';
import type { Category, Entity, FactionId, GameState } from '../types';
import { idx, inBounds, T, terrainBuildable } from '../world/map';
import { dockOf, isLowPower } from './economy';
import { requestMove } from './movement';

const BUILD_UP_TICKS = TICK_RATE * 1.5;

export const categoryOf = (def: string): Category => (BUILDINGS[def] ? 'building' : UNITS[def].category);
export const costOf = (def: string) => (BUILDINGS[def] ?? UNITS[def]).cost;
export const timeOf = (def: string) => (BUILDINGS[def] ?? UNITS[def]).time;
const discounted = (s: GameState, owner: number) => s.entities.some((e) => e.owner === owner && e.hp > 0 && e.built >= 1 && e.kind === 'building' && BUILDINGS[e.def].vehicleDiscount);
/** What `owner` pays for `def` (Assembly Plant: vehicles 25% off). */
export const priceOf = (s: GameState, owner: number, def: string) => costOf(def) * (UNITS[def]?.category === 'vehicle' && discounted(s, owner) ? 0.75 : 1);
const requiresOf = (def: string) => (BUILDINGS[def] ?? UNITS[def]).requires;
export const forFaction = (def: string, f: FactionId) => (BUILDINGS[def] ? BUILDINGS[def].factions ?? [f] : UNITS[def].factions).includes(f);
export const PRODUCER: Record<Category, string> = { building: 'cy', infantry: 'barracks', vehicle: 'factory' };

export function hasBuilding(s: GameState, owner: number, def: string) {
  return s.entities.some((e) => e.owner === owner && e.kind === 'building' && e.def === def && e.hp > 0 && e.built >= 1);
}

/** Buildable defs for the sidebar, in display order. */
export function catalog(s: GameState, owner: number, cat: Category): string[] {
  const f = s.players[owner].faction;
  if (cat === 'building') return Object.values(BUILDINGS).filter((b) => b.buildable && forFaction(b.id, f) && (!b.superweapon || s.settings.superweapons !== false)).map((b) => b.id);
  return Object.values(UNITS).filter((u) => u.category === cat && !u.hidden && forFaction(u.id, f)).map((u) => u.id);
}

/** Missing prerequisites (empty = available). Sandbox skips tech requirements but still needs a producer. */
export function missingRequirements(s: GameState, owner: number, def: string): string[] {
  const cat = categoryOf(def);
  const reqs = s.settings.mode === 'sandbox' ? [PRODUCER[cat]] : [...new Set([PRODUCER[cat], ...requiresOf(def)])];
  return reqs.filter((r) => !hasBuilding(s, owner, r));
}

export type QueueResult = 'ok' | 'locked' | 'full' | 'faction' | 'limit';

const alive = (s: GameState, owner: number, pred: (def: string) => boolean) =>
  s.entities.filter((e) => e.owner === owner && e.hp > 0 && pred(e.def)).length +
  Object.values(s.players[owner].queues).flat().filter((q) => pred(q.def)).length;

/** Remaining build cap for `def` (heroes and one-off buildings: `limit`; aircraft: free landing pads), or Infinity. */
export function capLeft(s: GameState, owner: number, def: string): number {
  const u = UNITS[def];
  if (!u) return BUILDINGS[def]?.limit ? BUILDINGS[def].limit! - alive(s, owner, (d) => d === def) - (s.players[owner].ready === def ? 1 : 0) : Infinity;
  let left = u.limit ? u.limit - alive(s, owner, (d) => d === def) : Infinity;
  if (u.ammo) {
    const pads = ownBuildings(s, owner, u.from ?? '', false).reduce((n, b) => n + (BUILDINGS[b.def].pads ?? 0), 0);
    left = Math.min(left, pads - alive(s, owner, (d) => !!UNITS[d]?.ammo));
  }
  return left;
}

export function enqueue(s: GameState, owner: number, def: string): QueueResult {
  const p = s.players[owner];
  if (!BUILDINGS[def] && !UNITS[def]) return 'locked';
  if (!forFaction(def, p.faction)) return 'faction';
  if ((BUILDINGS[def] && !BUILDINGS[def].buildable) || UNITS[def]?.hidden) return 'locked';
  if (BUILDINGS[def]?.superweapon && s.settings.superweapons === false) return 'locked';
  if (missingRequirements(s, owner, def).length) return 'locked';
  if (capLeft(s, owner, def) <= 0) return 'limit';
  const q = p.queues[categoryOf(def)];
  if (q.length >= QUEUE_LIMIT) return 'full';
  q.push({ def, spent: 0, progress: 0 });
  emit(s, { type: 'enqueued', owner, def });
  logDecision(s, owner, 'queue', def);
  return 'ok';
}

/** Cancel the last queued `def` (or the ready building) and refund what was spent. */
export function cancel(s: GameState, owner: number, def: string): boolean {
  const p = s.players[owner];
  if (p.ready === def) { p.credits += costOf(def); p.ready = null; return true; }
  const q = p.queues[categoryOf(def)];
  for (let k = q.length - 1; k >= 0; k--)
    if (q[k].def === def) { p.credits += q[k].spent; q.splice(k, 1); return true; }
  return false;
}

/**
 * Right-click on a cameo, genre style: the item in production goes on hold, a held item (or a ready building, or
 * a queued copy) is cancelled. Returns what happened, for the announcer.
 */
export function holdOrCancel(s: GameState, owner: number, def: string): 'hold' | 'cancel' | null {
  const p = s.players[owner];
  const head = p.queues[categoryOf(def)][0];
  const copies = p.queues[categoryOf(def)].filter((i) => i.def === def).length;
  if (p.ready !== def && head?.def === def && !head.hold && copies === 1) { head.hold = true; return 'hold'; }
  return cancel(s, owner, def) ? 'cancel' : null;
}

/** Left-click on a held cameo resumes it instead of queueing another one. */
export function resume(s: GameState, owner: number, def: string): boolean {
  const head = s.players[owner].queues[categoryOf(def)][0];
  if (head?.def !== def || !head.hold) return false;
  head.hold = false;
  return true;
}

export function productionTick(s: GameState) {
  for (const p of s.players) {
    if (p.defeated) continue;
    for (const cat of ['building', 'infantry', 'vehicle'] as Category[]) {
      const q = p.queues[cat];
      // Producer lost: refund the whole queue.
      if (q.length && !hasBuilding(s, p.id, PRODUCER[cat])) {
        for (const it of q) p.credits += it.spent;
        q.length = 0;
        if (cat === 'building' && p.ready) { p.credits += costOf(p.ready); p.ready = null; }
        continue;
      }
      const it = q[0];
      if (!it || it.hold || (cat === 'building' && p.ready)) continue;
      const total = timeOf(it.def) * TICK_RATE;
      const cost = priceOf(s, p.id, it.def);
      let speed = isLowPower(s, p.id) ? LOW_POWER_PRODUCTION : 1;
      if (cat === 'vehicle' && discounted(s, p.id)) speed *= 1.25; // Assembly Plant
      if (s.settings.mode === 'sandbox') speed *= SANDBOX_BUILD_SPEED;
      const ai = p.ai ? s.ai.find((a) => a.player === p.id) : undefined;
      if (ai) speed *= DIFFICULTY[ai.difficulty ?? s.settings.difficulty].buildSpeed;
      const step = Math.min(speed, total - it.progress);
      const pay = Math.min(cost - it.spent, (cost / total) * step);
      if (p.credits < pay) { if (s.tick % 90 === 0) emit(s, { type: 'insufficient', owner: p.id }); continue; }
      p.credits -= pay;
      it.spent += pay;
      it.progress += step;
      if (it.progress < total) continue;
      // Settle float rounding so the total paid is exactly the cost.
      const rest = cost - it.spent;
      if (rest > 1e-6) { if (p.credits < rest) continue; p.credits -= rest; it.spent = cost; }
      q.shift();
      if (cat === 'building') {
        p.ready = it.def;
        emit(s, { type: 'buildingReady', owner: p.id, def: it.def });
      } else {
        deliverUnit(s, p.id, it.def);
      }
    }
  }
}

function deliverUnit(s: GameState, owner: number, def: string, copy = false) {
  const from = UNITS[def].from;
  if (from && UNITS[def].move === 'water') {
    // Ships slide out next to the Naval Yard.
    const b = ownBuildings(s, owner, from)[0];
    const spot = b && (freeSpot(s, centerX(b), centerY(b), 5, true, 'water') ?? freeSpot(s, centerX(b), centerY(b), 8, false, 'water'));
    if (!spot) { s.players[owner].credits += costOf(def); return; } // yard lost or boxed in: refund
    spawnUnit(s, def, owner, spot[0], spot[1]);
    s.players[owner].stats.unitsBuilt++;
    emit(s, { type: 'unitReady', owner, def });
    return;
  }
  if (from) {
    // Aircraft roll out onto a free landing pad.
    const u = spawnUnit(s, def, owner, 0, 0);
    if (!assignPad(s, u)) { const b = ownBuildings(s, owner, from)[0] ?? ownBuildings(s, owner, PRODUCER.vehicle)[0]; u.x = u.px = centerX(b); u.y = u.py = centerY(b); }
    else { [u.x, u.y] = padPos(s.rt.byId.get(u.pad!)!, u.padK!); u.px = u.x; u.py = u.y; u.landed = true; }
    s.players[owner].stats.unitsBuilt++;
    emit(s, { type: 'unitReady', owner, def });
    return;
  }
  const producers = ownBuildings(s, owner, PRODUCER[categoryOf(def)]);
  const b = producers[0];
  const d = BUILDINGS[b.def];
  const [row, dir] = exitRow(b);
  const spot = freeSpot(s, b.x + d.w / 2, row + 0.5, 6) ?? freeSpot(s, b.x + d.w / 2, b.y + d.h / 2, 12, false);
  if (!spot) return;
  const u = spawnUnit(s, def, owner, spot[0], spot[1]);
  u.facing = u.turret = Math.PI / 2;
  if (s.players[owner].vet?.[UNITS[def].category]) u.xp = UNITS[def].cost; // infiltrated barracks/factory
  s.players[owner].stats.unitsBuilt++;
  emit(s, { type: 'unitReady', owner, def });
  // Duplicator Vats: a free twin for every trained infantry (not heroes).
  if (!copy && UNITS[def].category === 'infantry' && !UNITS[def].limit && ownBuildings(s, owner).some((e) => BUILDINGS[e.def].duplicates)) deliverUnit(s, owner, def, true);
  // Drive to the rally point, or roll off the exit a little so the pad stays clear.
  const rally = producers.find((p) => p.rallyX >= 0);
  if (rally && !UNITS[def].harvester) {
    requestMove(u, rally.rallyX, rally.rallyY);
    u.order = { type: 'attackMove', tx: rally.rallyX, ty: rally.rallyY, targetId: 0 };
  } else if (!UNITS[def].harvester) {
    const off = freeSpot(s, spot[0], spot[1] + 2 * dir, 4);
    if (off) { requestMove(u, off[0], off[1]); u.order = { type: 'move', tx: off[0], ty: off[1], targetId: 0 }; }
  }
}

/** Tiles that must stay clear so harvesters can dock and units can leave factories. */
function reservedTiles(s: GameState): Set<number> {
  const out = new Set<number>();
  for (const e of s.entities) {
    if (e.kind !== 'building' || e.hp <= 0) continue;
    if (e.def === 'refinery') { const [x, y] = dockOf(e); out.add(idx(s.map, Math.floor(x), Math.floor(y))); }
    if (BUILDINGS[e.def].produces && e.def !== 'cy') {
      const d = BUILDINGS[e.def];
      const x = e.x + Math.floor(d.w / 2), y = exitRow(e)[0];
      if (inBounds(s.map, x, y)) out.add(idx(s.map, x, y));
    }
  }
  return out;
}

/** Landing pad k of an airfield (tile space centre). */
export const padPos = (b: Entity, k: number): [number, number] => [b.x + 0.75 + (k % 2) * 1.5, b.y + 0.75 + Math.floor(k / 2) * 1.5];

/** Claim the nearest free pad on an own pad building for an aircraft. */
export function assignPad(s: GameState, u: Entity): boolean {
  let best: [Entity, number] | null = null, bestD = Infinity;
  for (const b of ownBuildings(s, u.owner)) {
    const n = BUILDINGS[b.def].pads ?? 0;
    for (let k = 0; k < n; k++) {
      if (s.entities.some((o) => o !== u && o.hp > 0 && o.pad === b.id && o.padK === k)) continue;
      const [px, py] = padPos(b, k), d = Math.hypot(px - u.x, py - u.y);
      if (d < bestD) { bestD = d; best = [b, k]; }
    }
  }
  if (!best) { u.pad = undefined; return false; }
  u.pad = best[0].id; u.padK = best[1];
  return true;
}

/** One footprint cell: on the map, the right terrain, not occupied or kept free for a dock/exit. */
export function cellFree(s: GameState, def: string, x: number, y: number, reserved = reservedTiles(s)): boolean {
  if (!inBounds(s.map, x, y)) return false;
  const i = idx(s.map, x, y);
  return (BUILDINGS[def].naval ? s.map.terrain[i] === T.Water : terrainBuildable(s.map, i)) && s.rt.grid[i] === 0 && !reserved.has(i);
}

export interface PlaceOpts { anywhere?: boolean; ignore?: number } // anywhere: skip the build radius; ignore: unit standing in the way (deploying crawler)

export function canPlace(s: GameState, owner: number, def: string, tx: number, ty: number, opts: PlaceOpts = {}): boolean {
  const d = BUILDINGS[def];
  if (!d) return false;
  const reserved = reservedTiles(s);
  for (let y = ty; y < ty + d.h; y++)
    for (let x = tx; x < tx + d.w; x++) if (!cellFree(s, def, x, y, reserved)) return false;
  // The new building's own dock/exit must open onto a free tile.
  if (def === 'refinery' || (d.produces && def !== 'cy')) {
    const ey = ty + d.h / 2 > s.map.h / 2 ? ty - 1 : ty + d.h, ex = tx + Math.floor(d.w / 2);
    if (!inBounds(s.map, ex, ey)) return false;
    const i = idx(s.map, ex, ey);
    if (!terrainBuildable(s.map, i) && s.map.terrain[i] !== T.Road && s.map.terrain[i] !== T.Bridge) return false;
    if (s.rt.grid[i] !== 0) return false;
  }
  // No units inside the footprint.
  for (const e of s.entities)
    if (e.kind === 'unit' && e.hp > 0 && e.id !== opts.ignore && !e.inside && !UNITS[e.def].air && e.x > tx - 0.2 && e.x < tx + d.w + 0.2 && e.y > ty - 0.2 && e.y < ty + d.h + 0.2) return false;
  // Must be within BUILD_RADIUS tiles of an own building.
  if (opts.anywhere) return true;
  return s.entities.some((e) => {
    if (e.owner !== owner || e.kind !== 'building' || e.hp <= 0) return false;
    const b = BUILDINGS[e.def];
    const gx = Math.max(e.x - (tx + d.w), tx - (e.x + b.w), 0);
    const gy = Math.max(e.y - (ty + d.h), ty - (e.y + b.h), 0);
    return Math.max(gx, gy) <= BUILD_RADIUS;
  });
}

/** Walls: the ready piece goes on the first tile, every further tile of the dragged line costs one more wall. */
export function placeLine(s: GameState, owner: number, tiles: [number, number][]): number {
  const p = s.players[owner];
  const def = p.ready;
  if (!def || !BUILDINGS[def].wall || !tiles.length || !place(s, owner, tiles[0][0], tiles[0][1])) return 0;
  let n = 1;
  for (const [tx, ty] of tiles.slice(1)) {
    if (p.credits < BUILDINGS[def].cost || !canPlace(s, owner, def, tx, ty)) continue;
    p.credits -= BUILDINGS[def].cost;
    spawnBuilding(s, def, owner, tx, ty, 0);
    p.stats.buildingsBuilt++;
    n++;
  }
  return n;
}

export function place(s: GameState, owner: number, tx: number, ty: number): Entity | null {
  const p = s.players[owner];
  if (!p.ready || !canPlace(s, owner, p.ready, tx, ty)) return null;
  const e = spawnBuilding(s, p.ready, owner, tx, ty, 0);
  emit(s, { type: 'placed', owner, def: p.ready, x: centerX(e), y: centerY(e) });
  logDecision(s, owner, 'place', p.ready);
  p.ready = null;
  p.stats.buildingsBuilt++;
  return e;
}

/** Build-up animation after placement; the building becomes operational at built = 1. */
export function buildUpTick(s: GameState, e: Entity) {
  if (e.built >= 1) return;
  e.built = Math.min(1, e.built + 1 / BUILD_UP_TICKS);
  if (e.built < 1) return;
  const free = BUILDINGS[e.def].freeUnit && FACTIONS[s.players[e.owner].faction].harvester; // each faction's own harvester
  if (free) {
    const [dx, dy] = dockOf(e);
    const spot = freeSpot(s, dx, dy, 6, false);
    if (spot) spawnUnit(s, free, e.owner, spot[0], spot[1]);
  }
}
