import { BUILDINGS } from '../data/buildings';
import { DIFFICULTY, TICK_RATE } from '../data/config';
import { UNITS } from '../data/units';
import { FACTIONS } from '../data/factions';
import { centerX, centerY, distTo, ownBuildings } from '../core/entities';
import type { AIState, Entity, GameState } from '../types';
import { startPositions } from '../world/mapgen';
import { nextRandom, regions, T, terrainPassable } from '../world/map';
import { canSee, weaponOf } from './combat';
import { findOre } from './economy';
import { cancel, canPlace, capLeft, categoryOf, enqueue, forFaction, missingRequirements, place } from './production';
import { commandAbility } from './abilities';
import { firePower, isReady } from './powers';
import { POWERS } from '../data/powers';
import { isMoving } from './movement';
import { commandAttack, commandCapture, commandEnter, commandMove, sellBuilding, toggleRepair } from './orders';
import { WEAPONS } from '../data/weapons';

// The AI only uses information the fog allows: visible units, remembered buildings and
// public map knowledge (terrain, ore, possible start locations).

export function createAI(player: number, difficulty: keyof typeof DIFFICULTY): AIState {
  return { player, nextThink: 0, attackWave: 0, nextAttack: DIFFICULTY[difficulty].firstAttack * TICK_RATE, attacking: [], lastPlace: 0 };
}

const count = (s: GameState, owner: number, def: string) => s.entities.filter((e) => e.owner === owner && e.def === def && e.hp > 0).length;
const queued = (s: GameState, owner: number, def: string) => {
  const p = s.players[owner];
  return p.queues[categoryOf(def)].filter((q) => q.def === def).length + (p.ready === def ? 1 : 0);
};
const total = (s: GameState, owner: number, def: string) => count(s, owner, def) + queued(s, owner, def);

export function aiTick(s: GameState, ai: AIState) {
  const p = s.players[ai.player];
  if (p.defeated || p.passive || s.tick < ai.nextThink) return;
  const cfg = DIFFICULTY[ai.difficulty ?? s.settings.difficulty];
  ai.nextThink = s.tick + cfg.think;
  const me = ai.player;

  if (p.ready) placeReady(s, ai);
  crawlers(s, ai);
  planBuilding(s, me, cfg);
  planUnits(s, me, cfg);
  repair(s, ai);
  powers(s, ai);
  support(s, ai);
  defend(s, ai, cfg);
  attack(s, ai, cfg);
}

function planBuilding(s: GameState, me: number, cfg: (typeof DIFFICULTY)[keyof typeof DIFFICULTY]) {
  const p = s.players[me];
  if (p.queues.building.length || p.ready) return;
  const margin = p.powerMade - p.powerUsed;
  const r = FACTIONS[p.faction].roster, [def1, def2] = r.defenses;
  const air = seenAir(s, me);
  const want = (def: string, n: number) => total(s, me, def) < n;
  // Dynamic priority list: power first when short, economy, production, defense, extras.
  const order: [string, boolean][] = [
    ['power', margin < 30 || want('power', 1)],
    ['refinery', want('refinery', 1)],
    ['barracks', want('barracks', 1)],
    ['factory', want('factory', 1)],
    ['refinery', want('refinery', cfg.refineries)],
    ['radar', want('radar', 1) && p.credits > 1000],
    ['navalyard', want('navalyard', 1) && !!r.navy && count(s, me, 'radar') > 0 && cfg.towers > 1 && s.tick % (cfg.think * 10) < cfg.think && !!bestSpot(s, me, 'navalyard')], // sea maps: a harbour once radar stands
    [def1, want(def1, cfg.towers) && p.credits > 1200],
    ['lab', want('lab', 1) && cfg.towers > 1],
    ['airfield', forFaction('airfield', p.faction) && want('airfield', 1) && count(s, me, 'radar') > 0 && cfg.towers > 1 && p.credits > 1200],
    [def2, want(def2, cfg.towers - 1) && p.credits > 1800],
    ['psibeacon', forFaction('psibeacon', p.faction) && want('psibeacon', 1) && count(s, me, 'radar') > 0 && p.credits > 800 && s.tick > 5 * 60 * TICK_RATE],
    ['depot', want('depot', 1) && cfg.towers > 1 && p.credits > 1500],
    [r.aaDef ?? '', !!r.aaDef && air > 0 && want(r.aaDef, Math.min(cfg.towers, 1 + Math.floor(air / 3)))],
    ['assembly', forFaction('assembly', p.faction) && want('assembly', 1) && count(s, me, 'lab') > 0 && p.credits > 1000],
    ['vats', forFaction('vats', p.faction) && want('vats', 1) && count(s, me, 'lab') > 0],
    ...superweapons(s, me).map((def): [string, boolean] => [def, cfg.towers > 1 && want(def, 1) && count(s, me, 'lab') > 0 && s.tick > 6 * 60 * TICK_RATE]), // mid-game: the queue pays as it goes
    ['factory', want('factory', cfg.factories) && p.credits > 2500],
    ['power', margin < 80 && p.credits > 1500 && total(s, me, 'power') < 8],
  ];
  for (const [def, ok] of order) {
    if (!ok || !def || missingRequirements(s, me, def).length) continue;
    const needed = def === 'power' ? 0 : -BUILDINGS[def].power;
    if (def !== 'power' && margin - needed < 0 && total(s, me, 'power') < 6) { enqueue(s, me, 'power'); return; }
    enqueue(s, me, def);
    return;
  }
}

function planUnits(s: GameState, me: number, cfg: (typeof DIFFICULTY)[keyof typeof DIFFICULTY]) {
  const p = s.players[me];
  const refs = count(s, me, 'refinery');
  const harv = FACTIONS[p.faction].harvester;
  // No harvester left: everything else waits (refunded) until a new one is paid for, or the economy never recovers.
  if (refs && !s.entities.some((e) => e.owner === me && e.hp > 0 && e.def === harv)) {
    for (const cat of ['infantry', 'vehicle', 'building'] as const) for (const q of [...p.queues[cat]]) if (q.def !== harv && q.def !== 'factory') cancel(s, me, q.def);
    if (!total(s, me, harv) && !missingRequirements(s, me, harv).length) enqueue(s, me, harv);
    // Broke as well: sell something non-essential (defenses and tech first) to pay for it.
    const need = count(s, me, 'factory') ? UNITS[harv].cost - (p.queues.vehicle[0]?.spent ?? 0) : BUILDINGS.factory.cost - (p.queues.building[0]?.spent ?? 0);
    const short = need - p.credits;
    if (short > 0 && s.tick % (cfg.think * 4) < cfg.think) {
      const keep = new Set(['cy', 'refinery', 'factory']);
      const spare = ownBuildings(s, me).filter((b) => !keep.has(b.def) && (b.def !== 'power' || p.powerMade - BUILDINGS.power.power >= p.powerUsed)).sort((a, b) => (BUILDINGS[a.def].weapon ? 0 : 1) - (BUILDINGS[b.def].weapon ? 0 : 1) || BUILDINGS[b.def].cost - BUILDINGS[a.def].cost)[0];
      if (spare) sellBuilding(s, me, spare.id);
    }
    return;
  }
  if (refs && total(s, me, harv) < refs * cfg.minersPerRef && !missingRequirements(s, me, harv).length && !p.queues.vehicle.length) {
    enqueue(s, me, harv);
    return;
  }
  // Keep a cash buffer for the economy before spending on the army.
  // Economy first: save for the second refinery before spending on the army.
  // Then the tech tier: hold back while the Tech Center is under construction.
  // ...but only once a minimal defence force (one attack wave) stands, or an early rush wins.
  const reserve = army(s, me).length < cfg.attackBase ? 0 : !count(s, me, 'factory') ? 1500 : total(s, me, 'refinery') < cfg.refineries ? BUILDINGS.refinery.cost : queued(s, me, 'lab') ? 800 : 0;
  if (p.credits < reserve) return;
  // Counter what we have seen: rockets vs armour, jeeps vs infantry, heavies once radar is up.
  let armour = 0, infantry = 0, air = 0;
  for (const e of s.entities) {
    if (e.owner === me || e.kind !== 'unit' || !canSee(s, me, e)) continue;
    if (UNITS[e.def].air) air++;
    else if (UNITS[e.def].armor === 'heavy') armour++; else if (UNITS[e.def].category === 'infantry') infantry++;
  }
  const roll = nextRandom(s) * 4;
  const tank = FACTIONS[p.faction].mainTank, r = FACTIONS[p.faction].roster;
  const can = (def: string) => !missingRequirements(s, me, def).length && capLeft(s, me, def) > 0;
  // Anti-air keeps pace with the enemy air force we have seen.
  const aaNeed = air * 2 > s.entities.filter((e) => e.owner === me && e.kind === 'unit' && weaponOf(e)?.aa).length;
  let vehicle = tank;
  if (aaNeed && can(r.aa)) vehicle = r.aa;
  else if (can(r.tech) && roll < 1.1) vehicle = r.tech;
  else if (can(r.air) && roll >= 1.1 && roll < 1.5) vehicle = r.air;
  else if (r.support && can(r.support) && roll >= 1.5 && roll < 1.9) vehicle = r.support;
  else if (infantry > armour || roll >= 3) vehicle = r.raider;
  if (r.vextras && roll >= 3.6) { const x = r.vextras[Math.floor(nextRandom(s) * r.vextras.length)]; if (can(x)) vehicle = x; }
  if (r.navy && count(s, me, 'navalyard') && nextRandom(s) < 0.3) { const x = r.navy[Math.floor(nextRandom(s) * r.navy.length)]; if (can(x)) vehicle = x; }
  if (p.queues.vehicle.length < 2 && can(vehicle)) enqueue(s, me, vehicle);
  let inf = armour > infantry || roll >= 2 ? r.infAT : r.infAI;
  if (r.special && can(r.special) && roll >= 1.9 && roll < 2.4) inf = r.special;
  else if (r.extras && roll >= 2.4 && roll < 2.9) { const x = r.extras[Math.floor(nextRandom(s) * r.extras.length)]; if (can(x)) inf = x; } // heroes are capped by enqueue
  if (p.queues.infantry.length < 1 && can(inf) && (p.credits > 1000 || !can(tank))) enqueue(s, me, inf);
}

const superweapons = (s: GameState, me: number) =>
  s.settings.superweapons === false ? [] : Object.values(BUILDINGS).filter((b) => b.superweapon && forFaction(b.id, s.players[me].faction)).map((b) => b.id);

/** Fire charged superweapons: area attacks at the richest known enemy spot, stasis/phase gate to help the attack wave. */
function powers(s: GameState, ai: AIState) {
  const me = ai.player;
  for (const b of ownBuildings(s, me)) {
    const pw = BUILDINGS[b.def].superweapon;
    if (!pw || !isReady(b)) continue;
    const wave = ai.attacking.map((id) => s.rt.byId.get(id)!).filter((u) => u && UNITS[u.def].category === 'vehicle' && !UNITS[u.def].air);
    const mid = wave.length >= 4 ? [wave.reduce((a, u) => a + u.x, 0) / wave.length, wave.reduce((a, u) => a + u.y, 0) / wave.length] : null;
    if (pw === 'stasis') { if (mid && s.entities.some((e) => e.owner !== me && e.owner !== s.neutral && e.hp > 0 && canSee(s, me, e) && Math.hypot(centerX(e) - mid[0], centerY(e) - mid[1]) < 7)) firePower(s, me, b.id, mid[0], mid[1]); continue; }
    if (pw === 'phasegate') {
      const t = pickTarget(s, me);
      if (mid && t && Math.hypot(t[0] - mid[0], t[1] - mid[1]) > 15) { const k = 5 / Math.hypot(t[0] - mid[0], t[1] - mid[1]); firePower(s, me, b.id, mid[0], mid[1], t[0] - (t[0] - mid[0]) * k, t[1] - (t[1] - mid[1]) * k); }
      continue;
    }
    const best = bestStrike(s, me, POWERS[pw].radius, pw === 'mutagen' ? (e) => e.kind === 'unit' && UNITS[e.def].category === 'infantry' && !UNITS[e.def].hero : pw === 'dominion' ? (e) => !(e.kind === 'unit' && UNITS[e.def].hero) : () => true);
    if (best) firePower(s, me, b.id, best[0], best[1]);
  }
}

/** Known enemy spot where `pred` entities worth the most stand within `r`. */
function bestStrike(s: GameState, me: number, r: number, pred: (e: Entity) => boolean): [number, number] | null {
  const foes = s.entities.filter((e) => e.owner !== me && e.owner !== s.neutral && e.hp > 0 && !e.inside && canSee(s, me, e) && pred(e) && !(e.kind === 'building' && BUILDINGS[e.def].wall));
  let best: [number, number] | null = null, bestV = 0;
  for (const c of foes) {
    const x = centerX(c), y = centerY(c);
    const v = foes.reduce((a, e) => a + (distTo(x, y, e) <= r ? (e.kind === 'unit' ? UNITS : BUILDINGS)[e.def].cost : 0), 0);
    if (v > bestV) { bestV = v; best = [x, y]; }
  }
  return bestV >= 1500 ? best : null;
}

/** Odd jobs: engineers for tech buildings and bridge huts, garrisons near home, area abilities, the island ferry. */
function support(s: GameState, ai: AIState) {
  const me = ai.player, home = s.players[me];
  const near = (e: Entity, r: number) => Math.hypot(centerX(e) - home.startX, centerY(e) - home.startY) < r;
  // Engineer jobs: a ruined bridge we know of, or a free tech building not too far from home.
  const jobs = s.entities.filter((e) => {
    if (e.kind !== 'building' || e.hp <= 0 || e.owner === me || !(e.seenBy & (1 << me))) return false;
    const d = BUILDINGS[e.def];
    if (d.repairsBridge) return !!s.rt.byId.get(e.link ?? 0)?.ruined;
    return e.owner === s.neutral && (!!d.income || !!d.heals || d.id === 'outpost') && near(e, 26);
  });
  const engineers = s.entities.filter((e) => e.owner === me && e.hp > 0 && UNITS[e.def]?.engineer);
  if (jobs.length && !engineers.length && !queued(s, me, 'engineer') && s.players[me].credits > 600 && !missingRequirements(s, me, 'engineer').length) enqueue(s, me, 'engineer');
  const reg = regions(s.map);
  for (const u of engineers) {
    if (u.order.type === 'capture') { if (u.noPath || u.repaths > 2) toIdleAI(u); continue; } // can't get there after all
    // Only jobs on its own landmass (a tile next to the building shares its region).
    const mine = jobs.filter((b) => { const d = BUILDINGS[b.def]; for (let y = b.y - 1; y <= b.y + d.h; y++) for (let x = b.x - 1; x <= b.x + d.w; x++) if (x >= 0 && y >= 0 && x < s.map.w && y < s.map.h && reg[y * s.map.w + x] === reg[Math.floor(u.y) * s.map.w + Math.floor(u.x)]) return true; return false; });
    if (!mine.length) continue;
    const t = mine.reduce((a, b) => (Math.hypot(centerX(a) - u.x, centerY(a) - u.y) < Math.hypot(centerX(b) - u.x, centerY(b) - u.y) ? a : b));
    commandCapture(s, me, [u.id], t.id);
  }
  // Garrison an empty town building close to home with idle infantry that isn't in a wave.
  if (s.tick % (TICK_RATE * 20) < 30) {
    const wave = new Set(ai.attacking);
    const idle = army(s, me).filter((u) => !wave.has(u.id) && UNITS[u.def].category === 'infantry' && !UNITS[u.def].hero && u.order.type === 'idle' && near(u, 16));
    const spot = s.entities.find((e) => e.kind === 'building' && e.owner === s.neutral && e.hp > 0 && BUILDINGS[e.def].garrison && !e.passengers?.length && near(e, 14));
    if (spot && idle.length >= 4) commandEnter(s, me, idle.slice(0, BUILDINGS[spot.def].garrison! - 1).map((u) => u.id), spot.id);
  }
  // Area abilities (psi wave/storm): fire when enough enemy infantry is in reach.
  for (const u of s.entities) {
    if (u.owner !== me || u.hp <= 0 || u.inside || (u.abCd ?? 0) > s.tick) continue;
    const ab = UNITS[u.def]?.ability, wid = ab === 'psiwave' ? 'psiWave' : ab === 'psistorm' ? 'psiStorm' : '';
    if (!wid) continue;
    const r = WEAPONS[wid].splash!;
    const foes = s.entities.filter((e) => e.owner !== me && e.owner !== s.neutral && e.kind === 'unit' && e.hp > 0 && !e.inside && UNITS[e.def].category === 'infantry' && canSee(s, me, e) && Math.hypot(e.x - u.x, e.y - u.y) <= r).length;
    if (foes >= 3) commandAbility(s, me, [u.id]);
  }
  ferry(s, ai);
}

const toIdleAI = (u: Entity) => { u.order = { type: 'idle', tx: u.x, ty: u.y, targetId: 0 }; u.path = []; u.pathIdx = 0; u.needPath = false; };

/** No land route to the enemy (islands, a bridge down): an amphibious transport carries infantry across. */
function ferry(s: GameState, ai: AIState) {
  const me = ai.player, home = s.players[me], t = pickTarget(s, me);
  if (!t) return;
  const reg = regions(s.map), w = s.map.w;
  const at = (x: number, y: number) => reg[Math.floor(y) * w + Math.floor(x)];
  const ferries = s.entities.filter((e) => e.owner === me && e.def === 'amphib' && e.hp > 0);
  if (at(home.startX + 1, home.startY + 1) === at(t[0], t[1]) || at(t[0], t[1]) < 0) {
    for (const f of ferries) if (f.passengers?.length && !isMoving(f)) commandAbility(s, me, [f.id]); // route open again: let them out
    return;
  }
  if (!ferries.length && !total(s, me, 'amphib') && !missingRequirements(s, me, 'amphib').length) { enqueue(s, me, 'amphib'); return; }
  for (const f of ferries) {
    if (isMoving(f)) continue;
    const load = f.passengers?.length ?? 0, homeSide = at(f.x, f.y) === at(home.startX + 1, home.startY + 1) || Math.hypot(f.x - home.startX, f.y - home.startY) < 14;
    if (homeSide && load < 6) {
      const wave = new Set(ai.attacking);
      const riders = army(s, me).filter((u) => !wave.has(u.id) && UNITS[u.def].category === 'infantry' && u.order.type !== 'enter').slice(0, 8 - load);
      if (riders.length) commandEnter(s, me, riders.map((u) => u.id), f.id);
      if (load + riders.length >= 6 || s.tick % (TICK_RATE * 60) < 30) commandMove(s, me, [f.id], t[0], t[1]);
    } else if (load && !homeSide) {
      const out = [...f.passengers!];
      commandAbility(s, me, [f.id]); // unload on the far shore, then attack
      commandMove(s, me, out, t[0], t[1], true);
      ai.attacking.push(...out);
    } else if (!homeSide) commandMove(s, me, [f.id], home.startX + 1, home.startY + 1);
  }
}

const seenAir = (s: GameState, me: number) =>
  s.entities.filter((e) => e.owner !== me && e.kind === 'unit' && UNITS[e.def].air && canSee(s, me, e)).length;

/** Lost the Construction Yard: build a Base Crawler (needs factory + depot) and deploy it near home. */
function crawlers(s: GameState, ai: AIState) {
  const me = ai.player, home = s.players[me];
  if (!count(s, me, 'cy') && !total(s, me, 'mcv') && !missingRequirements(s, me, 'mcv').length) enqueue(s, me, 'mcv');
  for (const u of s.entities) {
    if (u.owner !== me || u.def !== 'mcv' || u.hp <= 0) continue;
    if (commandAbility(s, me, [u.id])) continue;
    if (isMoving(u)) continue;
    // Walk to the nearest spot near home where a yard fits.
    let best: [number, number] | null = null, bestD = Infinity;
    for (let dy = -8; dy <= 8; dy++)
      for (let dx = -8; dx <= 8; dx++) {
        const tx = Math.floor(home.startX) - 1 + dx, ty = Math.floor(home.startY) - 1 + dy;
        if (!canPlace(s, me, 'cy', tx, ty, { anywhere: true, ignore: u.id })) continue;
        const d = Math.hypot(dx, dy) + Math.hypot(tx + 1.5 - u.x, ty + 1.5 - u.y) * 0.3;
        if (d < bestD) { bestD = d; best = [tx + 1.5, ty + 1.5]; }
      }
    if (best) commandMove(s, me, [u.id], best[0], best[1]);
  }
}

function repair(s: GameState, ai: AIState) {
  const me = ai.player, p = s.players[me];
  if (p.credits < 600) return;
  for (const b of ownBuildings(s, me)) if (!b.repairing && b.hp < BUILDINGS[b.def].hp * 0.6) toggleRepair(s, me, b.id);
  // Badly damaged vehicles outside an attack wave drive to the repair depot.
  const depot = ownBuildings(s, me, 'depot')[0];
  if (!depot) return;
  const inWave = new Set(ai.attacking);
  const hurt = army(s, me).filter((u) => !inWave.has(u.id) && UNITS[u.def].category === 'vehicle' && u.hp < UNITS[u.def].hp * 0.4 && distTo(u.x, u.y, depot) > 1.3 && u.order.type !== 'move');
  if (hurt.length) commandMove(s, me, hurt.map((u) => u.id), centerX(depot), centerY(depot));
}

function placeReady(s: GameState, ai: AIState) {
  const me = ai.player, p = s.players[me];
  const spot = bestSpot(s, me, p.ready!);
  if (spot) place(s, me, spot[0], spot[1]);
  else if (BUILDINGS[p.ready!].naval) cancel(s, me, p.ready!); // the water near the base is taken: refund instead of blocking the queue
}

/** Best placement for `def` around the Construction Yard, or null. */
function bestSpot(s: GameState, me: number, def: string): [number, number] | null {
  const d = BUILDINGS[def];
  const bs = ownBuildings(s, me, undefined, false);
  if (!bs.length) return null;
  const cy = bs.find((b) => b.def === 'cy') ?? bs[0];
  const bx = centerX(cy), by = centerY(cy);
  const ore = def === 'refinery' ? findOre(s, bx, by, undefined, 20) : -1;
  const ox = ore >= 0 ? ore % s.map.w : bx, oy = ore >= 0 ? Math.floor(ore / s.map.w) : by;
  let best: [number, number] | null = null, bestScore = Infinity;
  // Scan order mirrors with the base (point-symmetric maps → identical tie-breaks for both sides).
  const k = by > s.map.h / 2 ? -1 : 1;
  for (let dy = -12; dy <= 12; dy++)
    for (let dx = -12; dx <= 12; dx++) {
      const tx = Math.floor(bx) + dx * k - (k < 0 ? d.w - 1 : 0), ty = Math.floor(by) + dy * k - (k < 0 ? d.h - 1 : 0);
      if (d.naval && (s.map.terrain[ty * s.map.w + tx] !== T.Water || !openSea(s, ty * s.map.w + tx))) continue; // not in a pond
      if (!canPlace(s, me, def, tx, ty) || !hasMargin(s, tx, ty, d.w, d.h)) continue;
      const cx = tx + d.w / 2, cyy = ty + d.h / 2;
      let score = Math.hypot(cx - bx, cyy - by);
      if (def === 'refinery') score = Math.hypot(cx - ox, cyy - oy) * 1.5 + score * 0.5;
      if (d.weapon) score = Math.abs(score - 6) + Math.hypot(cx - s.map.w / 2, cyy - s.map.h / 2) * 0.2;
      if (score < bestScore) { bestScore = score; best = [tx, ty]; }
    }
  return best;
}

/** Water tile connected to at least 150 tiles of water (ships built there can go somewhere). */
function openSea(s: GameState, i: number) {
  const r = regions(s.map, 'water'), id = r[i];
  let n = 0;
  for (let k = 0; k < r.length && n < 150; k++) if (r[k] === id) n++;
  return n >= 150;
}

/** Keep a one-tile gap around AI buildings so lanes stay open. */
function hasMargin(s: GameState, tx: number, ty: number, w: number, h: number) {
  for (let y = ty - 1; y <= ty + h; y++)
    for (let x = tx - 1; x <= tx + w; x++) {
      if (x < 0 || y < 0 || x >= s.map.w || y >= s.map.h) return false;
      if (s.rt.grid[y * s.map.w + x] !== 0) return false;
    }
  return true;
}

const army = (s: GameState, me: number) =>
  s.entities.filter((e) => e.owner === me && e.kind === 'unit' && e.hp > 0 && !e.inside && weaponOf(e) && !UNITS[e.def].harvester);

function defend(s: GameState, ai: AIState, cfg: (typeof DIFFICULTY)[keyof typeof DIFFICULTY]) {
  const me = ai.player;
  const base = ownBuildings(s, me, undefined, false);
  // Threat: a visible enemy unit close to any of our buildings or harvesters.
  const assets = [...base, ...s.entities.filter((e) => e.owner === me && e.kind === 'unit' && UNITS[e.def].harvester)];
  let threat: Entity | undefined;
  for (const e of s.entities) {
    if (e.owner === me || e.kind !== 'unit' || e.hp <= 0 || !canSee(s, me, e)) continue;
    if (assets.some((b) => distTo(e.x, e.y, b) < cfg.defendRadius / (b.kind === 'unit' ? 2 : 1))) { threat = e; break; }
  }
  if (!threat) return;
  const inWave = new Set(ai.attacking);
  const defenders = army(s, me).filter((u) => !inWave.has(u.id) && u.order.type !== 'attack');
  commandAttack(s, me, defenders.map((u) => u.id), threat.id);
}

function attack(s: GameState, ai: AIState, cfg: (typeof DIFFICULTY)[keyof typeof DIFFICULTY]) {
  const me = ai.player;
  ai.attacking = ai.attacking.filter((id) => (s.rt.byId.get(id)?.hp ?? 0) > 0 && s.rt.byId.get(id)!.owner === me);
  // Hard: a wave that lost half its units falls back to defend instead of bleeding out.
  if (cfg.retreat && ai.attacking.length && ai.attacking.length < (ai.waveSize ?? 0) * 0.5) {
    const home = s.players[me];
    commandMove(s, me, ai.attacking, home.startX, home.startY);
    ai.attacking = [];
  }
  // Keep the current wave pushing: re-target when idle.
  if (ai.attacking.length) {
    const idle = ai.attacking.filter((id) => s.rt.byId.get(id)!.order.type === 'idle');
    if (idle.length) {
      const t = pickTarget(s, me);
      if (t) commandMove(s, me, idle, t[0], t[1], true);
    }
  }
  if (s.tick < ai.nextAttack) return;
  const inWave = new Set(ai.attacking);
  let ready = army(s, me).filter((u) => !inWave.has(u.id));
  const need = Math.min(cfg.attackBase + ai.attackWave * cfg.attackGrow, 20); // capped: long games must still end
  // No harvester and no money: the army won't grow any more, so use what there is.
  const spent = !s.entities.some((e) => e.owner === me && e.hp > 0 && e.kind === 'unit' && UNITS[e.def].harvester) && s.players[me].credits < 500;
  const overdue = s.tick > ai.nextAttack + cfg.waveGap * TICK_RATE && ready.length >= cfg.attackBase / 2; // waited a whole extra wave: go with what there is
  if (ready.length < need && !(spent && ready.length) && !overdue) return;
  if (!cfg.fullWaves) ready = ready.slice(0, need); // easy: the rest stays home
  const t = pickTarget(s, me);
  if (!t) return;
  commandMove(s, me, ready.map((u) => u.id), t[0], t[1], true);
  ai.attacking.push(...ready.map((u) => u.id));
  ai.waveSize = ai.attacking.length;
  ai.attackWave++;
  ai.nextAttack = s.tick + cfg.waveGap * TICK_RATE;
}

/** Nearest known enemy building; otherwise scout unexplored start locations; otherwise the map centre. */
function pickTarget(s: GameState, me: number): [number, number] | null {
  const home = s.players[me];
  let best: Entity | undefined, bestD = Infinity;
  for (const e of s.entities) {
    if (e.owner === me || e.owner === s.neutral || e.kind !== 'building' || e.hp <= 0 || BUILDINGS[e.def].wall || !canSee(s, me, e)) continue;
    const d = Math.hypot(centerX(e) - home.startX, centerY(e) - home.startY);
    if (d < bestD) { bestD = d; best = e; }
  }
  if (best) return [centerX(best), centerY(best)];
  for (const e of s.entities)
    if (e.owner !== me && e.owner !== s.neutral && e.hp > 0 && !e.inside && canSee(s, me, e)) return [e.x, e.y];
  const w = s.map.w;
  const foes = s.players.filter((p) => p.id !== me && !p.neutral && !p.defeated);
  const unexplored = startPositions(w, s.map.h).filter(([x, y]) => !home.explored[(y + 1) * w + x + 1] && foes.some((p) => Math.hypot(x - p.startX, y - p.startY) < 3)); // only corners someone started in
  if (unexplored.length) {
    unexplored.sort((a, b) => Math.hypot(a[0] - home.startX, a[1] - home.startY) - Math.hypot(b[0] - home.startX, b[1] - home.startY));
    return [unexplored[0][0] + 1.5, unexplored[0][1] + 1.5];
  }
  // Nothing known: search — first around the enemy start corners (where their last buildings usually are), then the whole map.
  const corners = foes.map((p) => [p.startX, p.startY]); // who started where is public knowledge
  for (let k = 0; k < 40 && corners.length; k++) {
    const [cx, cy] = corners[Math.floor(nextRandom(s) * corners.length)];
    const x = Math.floor(cx + (nextRandom(s) - 0.5) * 20), y = Math.floor(cy + (nextRandom(s) - 0.5) * 20), i = y * w + x;
    if (x >= 0 && y >= 0 && x < w && y < s.map.h && !home.visible[i] && terrainPassable(s.map, i)) return [x + 0.5, y + 0.5];
  }
  for (let k = 0; k < 40; k++) {
    const x = Math.floor(nextRandom(s) * w), y = Math.floor(nextRandom(s) * s.map.h), i = y * w + x;
    if (!home.visible[i] && terrainPassable(s.map, i)) return [x + 0.5, y + 0.5];
  }
  return [w / 2, s.map.h / 2];
}
