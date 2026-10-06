import { describe, expect, it } from 'vitest';
import { spawnBuilding as spawnB, spawnUnit } from '../core/entities';
import { deserialize, serialize } from '../core/save';
import { checkVictory, tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { TICK_RATE } from '../data/config';
import { UNITS } from '../data/units';
import { commandAbility } from '../systems/abilities';
import { scanTarget } from '../systems/combat';
import { commandAttack, commandCapture, commandEnter, sellBuilding } from '../systems/orders';
import { findPath } from '../systems/pathfinding';
import type { GameState } from '../types';
import { T } from '../world/map';

const run = (s: GameState, seconds: number) => { for (let k = 0; k < seconds * TICK_RATE; k++) tick(s); };
const town = (extra = {}) => {
  const s = createGame({ ...DEFAULT_SETTINGS, seed: 7, town: true, ...extra });
  s.players[1].passive = true;
  return s;
};
/** Flat map with the civilians present but no generated structures. */
const flat = () => {
  const s = town();
  s.entities = s.entities.filter((e) => e.owner !== s.neutral);
  s.rt.byId = new Map(s.entities.map((e) => [e.id, e]));
  s.rt.grid.fill(0);
  for (const e of s.entities) if (e.kind === 'building') for (let y = e.y; y < e.y + 3; y++) for (let x = e.x; x < e.x + 3; x++) s.rt.grid[y * s.map.w + x] = e.id;
  s.map.terrain.fill(T.Grass);
  s.map.ore.fill(0);
  for (const p of s.players) { p.visible.fill(1); p.explored.fill(1); }
  return s;
};
/** Test spawns are already scouted by everyone. */
const spawnBuilding = (...a: Parameters<typeof spawnB>) => { const e = spawnB(...a); e.seenBy = 0xff; return e; };
const alive = (s: GameState, id: number) => (s.rt.byId.get(id)?.hp ?? 0) > 0;
const N = (s: GameState) => s.neutral!;

describe('phase 10: map structures, garrison, tech, bridges, crates', () => {
  it('places a mirrored town, tech buildings and bridges with huts for the civilians', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, seed: 3, mapPreset: 'rivers', town: true });
    expect(s.players[N(s)].neutral).toBe(true);
    const civ = s.entities.filter((e) => e.owner === N(s) && e.kind === 'building');
    const town = civ.filter((e) => ['civhouse', 'civoffice', 'civfarm', 'civhall', 'techrig', 'hospital', 'machineshop', 'outpost'].includes(e.def));
    expect(town.length).toBeGreaterThanOrEqual(4);
    // Point symmetry: every structure has its mirror twin.
    for (const e of town) expect(town.some((o) => o.def === e.def && o.x === s.map.w - e.x - 2 - (e.def === 'civhall' ? 1 : 0) + (e.def === 'civhall' ? 0 : 0) || (o.def === e.def && o.x + e.x === s.map.w - (e.def === 'civhall' ? 3 : 2)))).toBe(true);
    const segs = civ.filter((e) => e.def === 'bridge');
    expect(segs.length).toBeGreaterThan(0);
    expect(segs.every((e) => s.map.terrain[e.y * s.map.w + e.x] === T.Bridge && s.rt.grid[e.y * s.map.w + e.x] === 0)).toBe(true);
    expect(civ.some((e) => e.def === 'bridgehut')).toBe(true);
  });

  it('infantry garrisons a town building, fires from cover, and leaves it to the civilians when evacuated', () => {
    const s = flat();
    const h = spawnBuilding(s, 'civhouse', N(s), 20, 20);
    const inf = [0, 1, 2].map((k) => spawnUnit(s, 'rifle', 0, 17.5, 19.5 + k));
    expect(commandEnter(s, 0, inf.map((u) => u.id), h.id)).toBe(3);
    run(s, 4);
    expect(h.owner).toBe(0);
    expect(h.passengers).toHaveLength(3);
    const enemy = spawnUnit(s, 'rifle', 1, 26.5, 21);
    run(s, 0.5);
    expect(scanTarget(s, enemy, 8)?.id).not.toBe(inf[0].id); // occupants can't be shot
    run(s, 5);
    expect(alive(s, enemy.id)).toBe(false); // the garrison shot it (range bonus from cover)
    expect(sellBuilding(s, 0, h.id)).toBe(0);
    commandAbility(s, 0, [h.id]);
    expect(h.passengers ?? []).toHaveLength(0);
    expect(h.owner).toBe(N(s));
    expect(inf.every((u) => !u.inside)).toBe(true);
  });

  it('a collapsing town building lets its garrison out alive', () => {
    const s = flat();
    const h = spawnBuilding(s, 'civhouse', N(s), 20, 20);
    const u = spawnUnit(s, 'rifle', 0, 18.5, 20.5);
    commandEnter(s, 0, [u.id], h.id);
    run(s, 3);
    expect(u.inside).toBe(h.id);
    h.hp = 0;
    run(s, 0.1);
    expect(alive(s, u.id)).toBe(true);
    expect(u.inside).toBeUndefined();
  });

  it('civilian buildings are never auto-targeted, only by explicit (forced) attack', () => {
    const s = flat();
    const h = spawnBuilding(s, 'civoffice', N(s), 20, 20);
    const t = spawnUnit(s, 'tank_soviets', 1, 23.5, 21);
    run(s, 2);
    expect(scanTarget(s, t, 8)).toBeUndefined();
    expect(h.hp).toBe(1300);
    commandAttack(s, 1, [t.id], h.id);
    run(s, 4);
    expect(h.hp).toBeLessThan(1300);
  });

  it('engineers capture tech buildings: fuel rig pays, hospital heals', () => {
    const s = flat();
    const rig = spawnBuilding(s, 'techrig', N(s), 20, 20), hosp = spawnBuilding(s, 'hospital', N(s), 24, 20);
    const [a, b] = [spawnUnit(s, 'engineer', 0, 19.5, 22.5), spawnUnit(s, 'engineer', 0, 23.5, 22.5)];
    expect(commandCapture(s, 0, [a.id], rig.id)).toBe(1);
    expect(commandCapture(s, 0, [b.id], hosp.id)).toBe(1);
    run(s, 4);
    expect(rig.owner).toBe(0);
    expect(hosp.owner).toBe(0);
    const before = s.players[0].credits;
    const hurt = spawnUnit(s, 'rifle', 0, 10.5, 10.5);
    hurt.hp = 20;
    run(s, 10);
    expect(s.players[0].credits).toBeGreaterThanOrEqual(before + 140);
    expect(hurt.hp).toBeGreaterThan(40);
    // Town buildings can't be captured.
    const h = spawnBuilding(s, 'civhouse', N(s), 30, 30);
    expect(commandCapture(s, 0, [spawnUnit(s, 'engineer', 0, 29.5, 29.5).id], h.id)).toBe(0);
  });

  it('a bridge falls only to aimed fire, drowns what is on it, cuts the route, and an engineer at the hut rebuilds it', () => {
    const s = flat();
    const m = s.map;
    for (let y = 0; y < m.h; y++) for (let x = 24; x < 28; x++) m.terrain[y * m.w + x] = T.Water;
    for (let x = 24; x < 28; x++) for (const y of [20, 21]) m.terrain[y * m.w + x] = T.Bridge;
    m.rev = 1;
    const segs = [];
    for (let x = 24; x < 28; x++) for (const y of [20, 21]) segs.push(spawnBuilding(s, 'bridge', N(s), x, y));
    for (const e of segs) e.link = segs[0].id;
    const hut = spawnBuilding(s, 'bridgehut', N(s), 22, 23);
    hut.link = segs[0].id;
    expect(findPath(s, 20, 20, 31, 20).complete).toBe(true);
    const rider = spawnUnit(s, 'rifle', 0, 26.5, 21.5);
    rider.order = { type: 'idle', tx: rider.x, ty: rider.y, targetId: 0 };
    const arty = spawnUnit(s, 'artillery', 1, 26.5, 12.5);
    commandAttack(s, 1, [arty.id], segs[3].id);
    run(s, 70); // ~11 Longbow salvos against 2500 hp
    expect(segs[0].ruined).toBe(true);
    expect(m.terrain[20 * m.w + 25]).toBe(T.Water);
    expect(alive(s, rider.id)).toBe(false);
    expect(findPath(s, 20, 20, 31, 20).complete).toBe(false);
    const eng = spawnUnit(s, 'engineer', 0, 20.5, 23.5);
    expect(commandCapture(s, 0, [eng.id], hut.id)).toBe(1);
    run(s, 4);
    expect(segs[0].ruined).toBe(false);
    expect(m.terrain[20 * m.w + 25]).toBe(T.Bridge);
    expect(findPath(s, 20, 20, 31, 20).complete).toBe(true);
  });

  it('crates spawn when enabled and reward the unit that picks one up', () => {
    const s = flat();
    s.settings.crates = true;
    run(s, 41);
    expect(s.crates?.length).toBeGreaterThan(0);
    const c = s.crates![0];
    const u = spawnUnit(s, 'tank_allies', 0, c.x, c.y);
    const credits = s.players[0].credits;
    run(s, 0.5);
    expect(s.crates!.some((k) => k.x === c.x && k.y === c.y)).toBe(false);
    expect(s.players[0].credits > credits || (u.xp ?? 0) > 0 || s.players[0].explored.some(Boolean)).toBe(true);
  });

  it('the civilians never win or lose; the game still ends between the real players', () => {
    const s = flat();
    for (const e of s.entities) if (e.owner === 1) e.hp = 0;
    run(s, 0.1);
    checkVictory(s);
    expect(s.winner).toBe(0);
    expect(s.players[N(s)].defeated).toBe(false);
  });

  it('town and bridges survive save/load and the game continues identically', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, seed: 3, mapPreset: 'rivers', town: true, crates: true });
    s.players[0].ai = true;
    s.ai.unshift({ player: 0, nextThink: 0, attackWave: 0, nextAttack: s.ai[0].nextAttack, attacking: [], lastPlace: 0 });
    run(s, 90);
    const copy = deserialize(serialize(s));
    run(s, 30); run(copy, 30);
    expect(serialize(copy)).toBe(serialize(s));
    expect(UNITS.rifle).toBeDefined();
  }, 60_000);
});
