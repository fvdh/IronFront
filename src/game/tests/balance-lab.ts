// Balance lab (plan/balans-plan.md, B1): an empty arena, equal-budget duels and scenarios with a target band.
// Used by tests/duels.test.ts (report) and tests/balance-scenarios.test.ts (asserted bands).
import { rebuildRuntime, spawnBuilding, spawnUnit } from '../core/entities';
import { tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { TICK_RATE } from '../data/config';
import { UNITS } from '../data/units';
import { BUILDINGS } from '../data/buildings';
import { FACTIONS } from '../data/factions';
import { WEAPONS } from '../data/weapons';
import { commandAttack, commandMove } from '../systems/orders';
import { weaponFor } from '../systems/combat';
import { centerX, centerY } from '../core/entities';
import type { Entity, FactionId, GameState } from '../types';
import { T } from '../world/map';

/** Land and air fighters: everything with a weapon that isn't a ship, a harvester or a helper. */
export const FIGHTERS = Object.values(UNITS).filter((u) => u.weapon && !u.hidden && u.move !== 'water' && !u.harvester).map((u) => u.id);
/** Ships: everything armed that sails (the sea matrix, Fun Pass 20.3). */
export const SHIPS = Object.values(UNITS).filter((u) => u.weapon && !u.hidden && u.move === 'water').map((u) => u.id);

/** Until one side has nothing left (and leeches, time bombs and phase beams have done their work) or `secs` pass.
 *  Sandbox mode: no victory check, so a side with no units does not take its leeches and bombs down with it. */
function run(s: GameState, A: Entity[], B: Entity[], secs: number) {
  const alive = (xs: Entity[], owner: number) => xs.some((e) => e.hp > 0 && e.owner === owner && !(e.phased ?? 0));
  const pending = () => s.entities.some((e) => e.leechBy !== undefined || (e.bombAt ?? 0) > s.tick || (e.phased ?? 0) > 0);
  for (let t = 0; t < secs * TICK_RATE; t++) {
    if ((!alive(A, 0) || !alive(B, 1)) && !pending()) break;
    for (const p of s.players) p.visible.fill(1);
    tick(s);
    s.rt.events.length = 0;
  }
}

/** Flat grass field (or open water, or water west of x = 24 and land east of it), nobody on it, everything visible, no AI. */
export function arena(seed = 5, ground: 'land' | 'sea' | 'coast' = 'land'): GameState {
  const s = createGame({ ...DEFAULT_SETTINGS, mode: 'sandbox', seed, mapSize: 'small', mapPreset: 'plains', town: false, crates: false, superweapons: false });
  s.players[1].passive = false;
  s.entities = []; s.ai = [];
  s.map.terrain.fill(ground === 'sea' ? T.Water : T.Grass); s.map.ore.fill(0); s.map.gem.fill(0);
  if (ground === 'coast') for (let i = 0; i < s.map.terrain.length; i++) if (i % s.map.w < 24) s.map.terrain[i] = T.Water;
  s.map.oreSources = [];
  rebuildRuntime(s);
  for (const p of s.players) { p.credits = 0; p.explored.fill(1); }
  return s;
}

const defOf = (e: Entity) => (e.kind === 'building' ? BUILDINGS[e.def] : UNITS[e.def]);
const value = (s: GameState, owner: number, start: Entity[]) =>
  start.reduce((v, e) => v + (e.hp > 0 && e.owner === owner && !(e.phased ?? 0) ? (defOf(e).cost * e.hp) / defOf(e).hp : 0), 0);

function army(s: GameState, def: string, owner: number, budget: number, cx: number, cy: number): Entity[] {
  const d = UNITS[def], n = d.limit ? 1 : Math.max(1, Math.round(budget / d.cost));
  const cols = Math.ceil(Math.sqrt(n));
  return Array.from({ length: n }, (_, k) => spawnUnit(s, def, owner, cx + (k % cols) * 0.9 - cols * 0.45, cy + Math.floor(k / cols) * 0.9));
}

export interface Duel { a: string; b: string; eff: number; secs: number; aLeft: number; bLeft: number }

/** A vs B. Budget 3000 each; a hero side gets one hero and the other side spends the hero's price. */
export function duel(a: string, b: string): Duel {
  const s = arena(5, UNITS[a].move === 'water' ? 'sea' : 'land');
  const hero = [UNITS[a], UNITS[b]].filter((d) => d.limit).map((d) => d.cost);
  const budget = hero.length ? Math.max(...hero) : 3000;
  const mid = s.map.h / 2;
  const A = army(s, a, 0, budget, 14, mid), B = army(s, b, 1, budget, 30, mid);
  const v0 = [value(s, 0, A), value(s, 1, B)];
  commandMove(s, 0, A.map((e) => e.id), 30, mid, true);
  commandMove(s, 1, B.map((e) => e.id), 14, mid, true);
  run(s, A, B, 90);
  const left = [value(s, 0, A), value(s, 1, B)];
  const lostA = v0[0] - left[0], lostB = v0[1] - left[1];
  return { a, b, eff: (lostB + 1) / (lostA + 1), secs: Math.round(s.tick / TICK_RATE), aLeft: left[0] / v0[0], bLeft: left[1] / v0[1] };
}

// ---- scenarios with a target band (B1b). Reported now; asserted once the matching phase (B2–B4) is done.
const DEFENSES: Record<FactionId, [string, string]> = { allies: ['pillbox', 'prismtower'], soviets: ['tower', 'coil'], psi: ['gatlingtower', 'psispire'] };

/** A standard defended base for P1 around (40, 20): CY, power, barracks and the faction's two defences. */
function base(s: GameState, f: FactionId) {
  s.players[1].faction = f;
  const cy = spawnBuilding(s, 'cy', 1, 40, 18);
  spawnBuilding(s, 'power', 1, 44, 18); spawnBuilding(s, 'power', 1, 44, 21);
  spawnBuilding(s, 'barracks', 1, 40, 22);
  spawnBuilding(s, DEFENSES[f][0], 1, 37, 19); spawnBuilding(s, DEFENSES[f][1], 1, 38, 22);
  return cy;
}

export interface Scenario { name: string; want: string; got: string; ok: boolean }

function heroVsBase(hero: string | null, f: FactionId, support?: [string, number]): { cyLost: boolean; heroAlive: boolean; secs: number } {
  const s = arena();
  const cy = base(s, f);
  const h = spawnUnit(s, hero ?? support![0], 0, 26, 20);
  const ids = [h.id, ...(support ? army(s, support[0], 0, support[1], 26, 23).map((e) => e.id) : [])];
  for (const p of s.players) p.visible.fill(1);
  for (const e of s.entities) e.seenBy = 0b11; // scouted: the attack order needs a known target
  // Who can hit the CY attacks it; the rest (The Oracle: CYs are immune) attack-moves along.
  const can = ids.filter((id) => weaponFor(s.rt.byId.get(id)!, cy));
  commandAttack(s, 0, can, cy.id);
  commandMove(s, 0, ids.filter((id) => !can.includes(id)), centerX(cy), centerY(cy), true);
  let t = 0;
  for (; t < 120 * TICK_RATE && s.winner === -1; t++) {
    for (const p of s.players) p.visible.fill(1);
    tick(s); s.rt.events.length = 0;
    if (cy.hp <= 0 || cy.owner !== 1) break;
    if (h.hp <= 0 && !support) break;
  }
  return { cyLost: cy.hp <= 0 || cy.owner !== 1, heroAlive: h.hp > 0, secs: Math.round(t / TICK_RATE) };
}

export function scenarios(): Scenario[] {
  const out: Scenario[] = [];
  const heroes: [string, FactionId][] = [['nova', 'soviets'], ['grom', 'allies'], ['oracle', 'allies']];
  for (const [h, f] of heroes) {
    for (const enemy of (['allies', 'soviets', 'psi'] as FactionId[]).filter((x) => x !== UNITS[h].factions[0])) {
      const r = heroVsBase(h, enemy);
      out.push({ name: `${h} alone vs ${enemy} base`, want: 'CY survives 120 s', got: `${r.cyLost ? `CY lost after ${r.secs}s` : 'CY survives'}, hero ${r.heroAlive ? 'alive' : 'dead'}`, ok: !r.cyLost });
    }
    const sup = UNITS[h].factions[0] === 'allies' ? 'tank_allies' : UNITS[h].factions[0] === 'soviets' ? 'tank_soviets' : 'tank_psi';
    // With an escort the hero should help, not decide: at most twice as fast as the escort alone (which gets one tank more).
    const alone = heroVsBase(null, f, [sup, 3000]), r = heroVsBase(h, f, [sup, 3000]);
    const ta = alone.cyLost ? alone.secs : 120, tr = r.cyLost ? r.secs : 120;
    out.push({ name: `${h} + 3000 tanks vs ${f} base`, want: `CY falls, ≥ half the time of tanks alone (${alone.cyLost ? ta + 's' : 'survives'})`, got: r.cyLost ? `CY lost after ${tr}s` : 'CY survives', ok: r.cyLost && tr >= ta / 2 });
  }
  // Mind control against an equal budget of tanks (both directions of the band).
  for (const mc of ['mentalist', 'hivemind'])
    for (const tank of ['tank_allies', 'tank_soviets', 'heavy']) {
      const d = duel(mc, tank);
      out.push({ name: `${mc} vs ${tank} (equal budget)`, want: 'efficiency 0.3–3 (anti-tank infantry such as Rocket Troopers: 3–5)', got: `efficiency ${d.eff.toFixed(2)} in ${d.secs}s`, ok: d.eff >= 0.3 && d.eff <= 3 });
    }
  // Leech Drone on a Colossus, no depot.
  {
    const s = arena(); const c = spawnUnit(s, 'heavy', 1, 30, 20); const l = spawnUnit(s, 'leechdrone', 0, 28.8, 20); // already at its side: what happens once it is in
    for (const p of s.players) p.visible.fill(1);
    commandAttack(s, 0, [l.id], c.id);
    for (let t = 0; t < 60 * TICK_RATE && c.hp > 0; t++) { for (const p of s.players) p.visible.fill(1); tick(s); s.rt.events.length = 0; }
    out.push({ name: 'Leech Drone vs Colossus (no depot, 60 s)', want: 'Colossus survives', got: c.hp > 0 ? `Colossus at ${Math.round(c.hp)} hp` : 'Colossus eaten', ok: c.hp > 0 });
  }
  // Nova vs six Riflemen.
  {
    const d = duel('nova', 'rifle');
    out.push({ name: 'Nova vs Riflemen (1500)', want: 'Nova wins, but hurt (left < 85 %)', got: `Nova ${Math.round(d.aLeft * 100)} % left, riflemen ${Math.round(d.bLeft * 100)} %`, ok: d.bLeft === 0 && d.aLeft < 0.85 });
  }
  return out;
}


// ---- regression scenarios (Fun Pass 20.3): no pass/fail, a report of what an intervention shifts. REGRESS=1 in duels.test.ts.

export interface Regress { name: string; budget: string; winner: 'A' | 'B' | '—'; aLeft: number; bLeft: number; secs: number; ttk: number | null; note: string }

/** Power plants far behind B (x ≥ 44) until its buildings have power; not part of B's value. */
function powerUp(s: GameState) {
  let y = 2;
  const used = () => s.entities.filter((e) => e.owner === 1 && e.kind === 'building').reduce((u, e) => u + Math.max(0, -BUILDINGS[e.def].power), 0);
  const made = () => s.entities.filter((e) => e.owner === 1 && e.kind === 'building').reduce((u, e) => u + Math.max(0, BUILDINGS[e.def].power), 0);
  while (made() < used()) { spawnBuilding(s, 'power', 1, 45, y); y += 3; }
}
const ring = (n: number, cx: number, cy: number, r: number): [number, number][] => Array.from({ length: n }, (_, k) => [cx + Math.cos((k / n) * Math.PI * 2) * r, cy + Math.sin((k / n) * Math.PI * 2) * r]);
const group = (s: GameState, def: string, owner: number, n: number, cx: number, cy: number) => {
  const cols = Math.ceil(Math.sqrt(n));
  return Array.from({ length: n }, (_, k) => spawnUnit(s, def, owner, cx + (k % cols) * 0.9 - cols * 0.45, cy + Math.floor(k / cols) * 0.9 - cols * 0.45));
};

/** A attacks (a target, or B's centre); B's units hold around their own centre. Ends when a side is gone, the target falls or 90 s pass. */
function clash(s: GameState, name: string, budget: string, A: Entity[], B: Entity[], o: { target?: Entity; note?: string; bAttacks?: boolean } = {}): Regress {
  powerUp(s);
  for (const p of s.players) p.visible.fill(1);
  for (const e of s.entities) e.seenBy = 0b11;
  const mid = (xs: Entity[]) => [xs.reduce((a, e) => a + centerX(e), 0) / xs.length, xs.reduce((a, e) => a + centerY(e), 0) / xs.length];
  const [bx, by] = mid(B), [ax, ay] = mid(A);
  const units = (xs: Entity[]) => xs.filter((e) => e.kind === 'unit').map((e) => e.id);
  if (o.target) { const can = units(A).filter((id) => weaponFor(s.rt.byId.get(id)!, o.target!)); commandAttack(s, 0, can, o.target.id); commandMove(s, 0, units(A).filter((id) => !can.includes(id)), centerX(o.target), centerY(o.target), true); }
  else commandMove(s, 0, units(A), bx, by, true);
  commandMove(s, 1, units(B), o.bAttacks ? ax : bx, o.bAttacks ? ay : by, true);
  const v0 = [value(s, 0, A), value(s, 1, B)], ages: number[] = [], seen = new Set<number>();
  for (let t = 0; t < 90 * TICK_RATE; t++) {
    for (const p of s.players) p.visible.fill(1);
    tick(s); s.rt.events.length = 0;
    for (const e of [...A, ...B]) if (e.hp <= 0 && !seen.has(e.id)) { seen.add(e.id); ages.push((s.tick - (e.born ?? 0)) / TICK_RATE); }
    if (!value(s, 0, A) || !value(s, 1, B) || (o.target && o.target.hp <= 0)) break;
  }
  const aLeft = value(s, 0, A) / v0[0], bLeft = value(s, 1, B) / v0[1];
  const winner = o.target ? (o.target.hp <= 0 ? 'A' : aLeft === 0 ? 'B' : '—') : aLeft > 0 && bLeft === 0 ? 'A' : bLeft > 0 && aLeft === 0 ? 'B' : '—';
  const sorted = ages.sort((a, b) => a - b);
  return { name, budget, winner, aLeft, bLeft, secs: Math.round(s.tick / TICK_RATE), ttk: sorted.length ? sorted[sorted.length >> 1] : null, note: o.note ?? (o.target ? `target ${o.target.hp > 0 ? 'stands' : 'destroyed'}` : '') };
}

/** Anti-air options of a faction: its armed units and buildings that can hit aircraft. */
export function aaOptions(f: FactionId): string[] {
  const aa = (w?: string) => !!w && (!!WEAPONS[w]?.aa || !!WEAPONS[w]?.airOnly);
  return [
    ...Object.values(UNITS).filter((u) => u.factions.includes(f) && !u.hidden && !u.air && u.move !== 'water' && (aa(u.weapon) || aa(u.weapon2))).map((u) => u.id),
    ...Object.values(BUILDINGS).filter((b) => b.buildable && (b.factions ?? [f]).includes(f) && aa(b.weapon)).map((b) => b.id),
  ];
}

export function regressions(): Regress[] {
  const out: Regress[] = [], mid = 20;
  { const s = arena(); out.push(clash(s, '1. 10 Warden Tank vs 8 Anvil Heavy Tank', '$7.000 / $6.800', group(s, 'tank_allies', 0, 10, 14, mid), group(s, 'tank_soviets', 1, 8, 26, mid), { bAttacks: true })); }
  { const s = arena(); out.push(clash(s, '2. 5 Rocket Trooper + 10 Rifleman vs 2 Colossus Tank', '$3.500 / $3.500', [...group(s, 'rocket', 0, 5, 14, mid - 2), ...group(s, 'rifle', 0, 10, 14, mid + 2)], group(s, 'heavy', 1, 2, 26, mid), { bAttacks: true })); }
  { const s = arena(); out.push(clash(s, '3. 3 Mentalist + 2 Lash Tank vs 20 Rifleman', '$3.900 / $4.000', [...group(s, 'mentalist', 0, 3, 14, mid - 2), ...group(s, 'tank_psi', 0, 2, 14, mid + 2)], group(s, 'rifle', 1, 20, 26, mid), { bAttacks: true, note: 'plan noemt 20 Draftees; die eenheid bestaat niet, dus 20 Riflemen' })); }
  for (const [k, aa, n] of [['a', 'samsite', 3], ['b', 'flakbattery', 3], ['c', 'flakgunner', 9]] as const) {
    const s = arena(); const pp = spawnBuilding(s, 'power', 1, 33, 19);
    const B = BUILDINGS[aa] ? ring(n, 34, 20, 3).map(([x, y]) => spawnBuilding(s, aa, 1, Math.round(x), Math.round(y))) : ring(n, 34, 20, 2.5).map(([x, y]) => spawnUnit(s, aa, 1, x, y));
    out.push(clash(s, `4${k}. 4 Kestrel VTOL vs ${n} ${(BUILDINGS[aa] ?? UNITS[aa]).name} around a Power Plant`, `$4.800 / $2.700`, group(s, 'jet', 0, 4, 10, mid), B, { target: pp }));
  }
  { const s = arena(5, 'coast'); out.push(clash(s, '5. 3 Picket Destroyer vs 2 Sentry Gun + 4 Rocket Trooper on the coast', '$3.000 / $2.400', group(s, 'destroyer', 0, 3, 12, mid), [spawnBuilding(s, 'tower', 1, 27, 18), spawnBuilding(s, 'tower', 1, 27, 22), ...group(s, 'rocket', 1, 4, 29, mid)])); }
  const FS: FactionId[] = ['allies', 'soviets', 'psi'];
  const DEF: Record<FactionId, [string, string]> = { allies: ['pillbox', 'prismtower'], soviets: ['tower', 'coil'], psi: ['gatlingtower', 'psispire'] };
  for (const x of FS) for (const y of FS) {
    const s = arena(); s.players[1].faction = y; s.players[0].faction = x;
    const tank = FACTIONS[x].mainTank, B: Entity[] = [];
    let row = 12;
    for (const d of DEF[y]) { const n = Math.round(2500 / BUILDINGS[d].cost); for (let k = 0; k < n; k++) B.push(spawnBuilding(s, d, 1, 32 + (k % 2) * 2, row + Math.floor(k / 2) * 2 + (d === DEF[y][1] ? 1 : 0))); row += 8; }
    spawnBuilding(s, 'cy', 1, 38, 18);
    out.push(clash(s, `6. $10.000 ${UNITS[tank].name} (${x}) vs ${y} defences`, `$10.000 / $5.000`, group(s, tank, 0, Math.round(10000 / UNITS[tank].cost), 14, mid), B));
  }
  for (const f of FS) for (const aa of aaOptions(f)) {
    const s = arena(); s.players[1].faction = f;
    const cy = spawnBuilding(s, 'cy', 1, 33, 19), cost = (BUILDINGS[aa] ?? UNITS[aa]).cost, n = Math.max(1, Math.round(2000 / cost));
    const B = BUILDINGS[aa] ? ring(n, 34.5, 20.5, 3.2).map(([x, y]) => spawnBuilding(s, aa, 1, Math.round(x), Math.round(y))) : ring(n, 34.5, 20.5, 2.8).map(([x, y]) => spawnUnit(s, aa, 1, x, y));
    out.push(clash(s, `7. Thunderhead Airship vs ${n} ${(BUILDINGS[aa] ?? UNITS[aa]).name} (${f}) around a CY`, `$2.000 / $${n * cost}`, [spawnUnit(s, 'airship', 0, 12, mid)], B, { target: cy }));
  }
  return out;
}
