import { describe, expect, it } from 'vitest';
import { spawnBuilding, spawnUnit } from '../core/entities';
import { deserialize, serialize } from '../core/save';
import { tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { TICK_RATE } from '../data/config';
import { canSee, damage } from '../systems/combat';
import { aiTick } from '../systems/ai';
import { commandEnter } from '../systems/orders';
import { firePower, fullCharge, isReady } from '../systems/powers';
import { catalog, enqueue, priceOf } from '../systems/production';
import type { GameEvent, GameState } from '../types';
import { T } from '../world/map';

const run = (s: GameState, seconds: number) => { for (let k = 0; k < seconds * TICK_RATE; k++) tick(s); };
const flat = (extra = {}) => {
  const s = createGame({ ...DEFAULT_SETTINGS, seed: 7, ...extra });
  s.players[1].passive = true;
  s.map.terrain.fill(T.Grass);
  s.map.ore.fill(0);
  s.map.rev = 1;
  for (const p of s.players) { p.visible.fill(1); p.explored.fill(1); p.credits = 50_000; }
  return s;
};
const bld = (s: GameState, def: string, owner: number, x: number, y: number) => { const b = spawnBuilding(s, def, owner, x, y); b.seenBy = 0xff; return b; };
/** Plenty of power plus a charged superweapon. */
const armed = (s: GameState, def: string, owner = 0) => {
  for (let k = 0; k < 4; k++) bld(s, 'power', owner, owner ? 40 + k * 2 : 14 + k * 2, owner ? 40 : 14);
  const b = bld(s, def, owner, owner ? 40 : 14, owner ? 44 : 18);
  b.charge = fullCharge(def);
  return b;
};
const alive = (s: GameState, id: number) => (s.rt.byId.get(id)?.hp ?? 0) > 0;
const events = (s: GameState) => { const e: GameEvent[] = [...s.rt.events]; s.rt.events.length = 0; return e; };

describe('phase 12: superweapons & economy', () => {
  it('one superweapon each, charges only with power, warns everyone, fires only when ready; off in setup = not buildable', () => {
    const s = flat();
    for (const d of ['power', 'refinery', 'factory', 'radar', 'lab']) bld(s, d, 0, 10 + (d.length % 4) * 4, 10 + ['power', 'refinery', 'factory', 'radar', 'lab'].indexOf(d) * 4);
    expect(enqueue(s, 0, 'hammersilo')).toBe('faction');
    expect(enqueue(s, 0, 'stormengine')).toBe('ok');
    expect(enqueue(s, 0, 'stormengine')).toBe('limit');
    const sw = bld(s, 'stormengine', 0, 30, 30);
    s.players[0].queues.building = [];
    tick(s);
    expect(events(s).some((e) => e.type === 'superweapon' && e.phase === 'built')).toBe(true);
    expect(firePower(s, 0, sw.id, 50, 50)).toBe(false); // not charged
    const before = sw.charge!;
    run(s, 2); // low power (lab + storm engine): no charging
    if (s.players[0].powerUsed > s.players[0].powerMade) expect(sw.charge).toBe(before);
    for (let k = 0; k < 4; k++) bld(s, 'power', 0, 2 + k * 2, 30);
    sw.charge = fullCharge('stormengine') - 2;
    events(s);
    run(s, 0.2);
    expect(isReady(sw)).toBe(true);
    expect(events(s).some((e) => e.type === 'superweapon' && e.phase === 'ready')).toBe(true);
    const off = flat({ superweapons: false });
    expect(catalog(off, 0, 'building')).not.toContain('stormengine');
    expect(enqueue(off, 0, 'stormengine')).toBe('locked');
  });

  it('Storm Engine: ten seconds of lightning around the target, our own troops are spared', () => {
    const s = flat();
    const b = armed(s, 'stormengine');
    const foes = [0, 1, 2, 3].map((k) => bld(s, 'power', 1, 39 + (k % 2) * 2, 19 + Math.floor(k / 2) * 2));
    const mine = spawnUnit(s, 'tank_allies', 0, 41.5, 21.5);
    expect(firePower(s, 0, b.id, 41, 21)).toBe(true);
    expect(b.charge).toBe(0);
    run(s, 11);
    expect(foes.reduce((n, f) => n + (s.rt.byId.get(f.id)?.hp ?? 0), 0)).toBeLessThan(4 * 750 * 0.6);
    expect(mine.hp).toBe(300);
    expect(s.hazards!.length).toBe(0);
  });

  it('Hammer Silo flattens an area and leaves fallout that keeps killing infantry', () => {
    const s = flat({ enemyFaction: 'allies', faction: 'soviets' });
    const b = armed(s, 'hammersilo');
    const hq = bld(s, 'power', 1, 40, 40);
    const tank = spawnUnit(s, 'tank_allies', 1, 42.5, 41.5);
    expect(firePower(s, 0, b.id, 41, 41)).toBe(true);
    run(s, 1);
    expect(alive(s, hq.id)).toBe(true); // still in flight
    run(s, 8);
    expect(alive(s, hq.id)).toBe(false);
    expect(alive(s, tank.id)).toBe(false);
    const late = spawnUnit(s, 'rifle', 1, 41.5, 41.5);
    run(s, 4);
    expect(alive(s, late.id)).toBe(false);
  });

  it('Stasis Projector: vehicles and buildings untouchable for 20 s, infantry in the field dies', () => {
    const s = flat({ faction: 'soviets' });
    const b = armed(s, 'stasis');
    const tank = spawnUnit(s, 'tank_soviets', 0, 30.5, 30.5), inf = spawnUnit(s, 'rifle', 0, 31.5, 30.5);
    expect(firePower(s, 0, b.id, 30.5, 30.5)).toBe(true);
    run(s, 0.1);
    expect(alive(s, inf.id)).toBe(false);
    damage(s, tank, 1000, 1);
    expect(tank.hp).toBe(420);
    run(s, 21);
    damage(s, tank, 100, 1);
    expect(tank.hp).toBe(320);
  });

  it('Dominion Engine takes everything in the area for good, heroes excepted', () => {
    const s = flat({ faction: 'psi', enemyFaction: 'allies' });
    const b = armed(s, 'dominion');
    const t = spawnUnit(s, 'tank_allies', 1, 40.5, 40.5), hero = spawnUnit(s, 'nova', 1, 41.5, 40.5), hq = bld(s, 'power', 1, 41, 41);
    expect(firePower(s, 0, b.id, 41, 41)).toBe(true);
    expect(t.owner).toBe(0);
    expect(hq.owner).toBe(0);
    expect(hero.owner).toBe(1);
    run(s, 5);
    expect(t.owner).toBe(0);
  });

  it('Mutagen Spire turns enemy infantry into our Maulers', () => {
    const s = flat({ faction: 'psi', enemyFaction: 'soviets' });
    const b = armed(s, 'mutagen');
    const inf = [0, 1, 2].map((k) => spawnUnit(s, 'rifle', 1, 40.5 + k * 0.5, 40.5));
    const tank = spawnUnit(s, 'tank_soviets', 1, 41.5, 41.5);
    expect(firePower(s, 0, b.id, 41, 40.5)).toBe(true);
    run(s, 0.1);
    expect(inf.every((u) => !alive(s, u.id))).toBe(true);
    expect(s.entities.filter((e) => e.def === 'brute' && e.owner === 0).length).toBe(3);
    expect(tank.owner).toBe(1);
  });

  it('Phase Gate moves the vehicles in formation; infantry is lost, a Phase Trooper stays; whatever lands in the sea sinks', () => {
    const s = flat();
    for (let y = 0; y < s.map.h; y++) s.map.terrain[y * s.map.w + 50] = T.Water;
    s.map.rev = 2;
    const b = armed(s, 'phasegate');
    const a = spawnUnit(s, 'tank_allies', 0, 20.5, 40.5), c = spawnUnit(s, 'tank_allies', 0, 21.5, 41.5);
    const inf = spawnUnit(s, 'rifle', 0, 20.5, 41.5), pt = spawnUnit(s, 'phasetrooper', 0, 19.5, 40.5);
    const sink = spawnUnit(s, 'ifv', 1, 18.5, 41.5);
    expect(firePower(s, 0, b.id, 20.5, 41.5, 52.5, 41.5)).toBe(true);
    run(s, 0.1);
    expect(a.x).toBeCloseTo(52.5, 1); expect(a.y).toBeCloseTo(40.5, 1);
    expect(c.x).toBeCloseTo(53.5, 1);
    expect(alive(s, inf.id)).toBe(false);
    expect(pt.x).toBeCloseTo(19.5, 1);
    expect(alive(s, sink.id)).toBe(false); // 18.5 → 50.5: water
    expect(a.frozenUntil! > s.tick).toBe(true);
  });

  it('Assembly Plant: vehicles 25% off and faster; Duplicator Vats: infantry twice (not heroes); Reclaimer pays half', () => {
    const s = flat({ faction: 'soviets' });
    for (const [d, x] of [['power', 4], ['power', 6], ['power', 8], ['refinery', 10], ['factory', 14], ['radar', 18], ['barracks', 21]] as const) bld(s, d, 0, x, 6);
    const full = priceOf(s, 0, 'tank_soviets');
    bld(s, 'assembly', 0, 24, 6);
    expect(priceOf(s, 0, 'tank_soviets')).toBe(full * 0.75);
    expect(priceOf(s, 0, 'rifle')).toBe(200);
    const c0 = s.players[0].credits;
    enqueue(s, 0, 'tank_soviets');
    run(s, 12 / 1.25 + 0.5);
    expect(s.entities.some((e) => e.def === 'tank_soviets' && e.owner === 0)).toBe(true);
    expect(c0 - s.players[0].credits).toBeCloseTo(full * 0.75, 0);

    const p = flat({ faction: 'psi' });
    for (const [d, x] of [['power', 0], ['power', 2], ['power', 4], ['power', 6], ['power', 8], ['refinery', 10], ['barracks', 14], ['factory', 17], ['radar', 21], ['lab', 24]] as const) bld(p, d, 0, x, 6);
    bld(p, 'vats', 0, 28, 6);
    enqueue(p, 0, 'initiate');
    run(p, 6);
    expect(p.entities.filter((e) => e.def === 'initiate' && e.owner === 0).length).toBe(2);
    const rec = bld(p, 'reclaimer', 0, 20, 20);
    const t = spawnUnit(p, 'tank_psi', 0, 25.5, 21.5);
    const cr = p.players[0].credits;
    expect(commandEnter(p, 0, [t.id], rec.id)).toBe(1);
    run(p, 5);
    expect(alive(p, t.id)).toBe(false);
    expect(p.players[0].credits - cr).toBeGreaterThanOrEqual(375);
  });

  it('an Arc Trooper next to an Arc Coil keeps it firing through a blackout; a Psi Beacon spots subs', () => {
    const s = flat({ faction: 'soviets' });
    const coil = bld(s, 'coil', 0, 20, 20);
    bld(s, 'lab', 0, 10, 10); // power hog: blackout
    run(s, 0.1);
    expect(s.players[0].powerUsed).toBeGreaterThan(s.players[0].powerMade);
    const foe = spawnUnit(s, 'tank_allies', 1, 24.5, 20.5);
    run(s, 3);
    expect(foe.hp).toBe(300);
    spawnUnit(s, 'arc', 0, 21.5, 20.5);
    run(s, 4);
    expect(alive(s, foe.id)).toBe(false);
    expect(coil.hp).toBeGreaterThan(0);

    const p = flat({ faction: 'psi' });
    for (let y = 0; y < p.map.h; y++) for (let x = 30; x < 45; x++) p.map.terrain[y * p.map.w + x] = T.Water;
    p.map.rev = 3;
    const sub = spawnUnit(p, 'barracuda', 1, 31.5, 20.5);
    spawnUnit(p, 'rifle', 0, 28.5, 20.5);
    run(p, 0.5);
    expect(canSee(p, 0, sub)).toBe(false);
    bld(p, 'psibeacon', 0, 26, 19);
    run(p, 0.2);
    expect(canSee(p, 0, sub)).toBe(true);
  });

  it('the AI fires a charged superweapon at the richest spot it knows, and the game stays deterministic', () => {
    const s = flat({ faction: 'allies', enemyFaction: 'soviets' });
    s.players[1].passive = false;
    s.players[1].ai = true;
    const b = armed(s, 'hammersilo', 1);
    for (let k = 0; k < 4; k++) bld(s, 'refinery', 0, 10 + (k % 2) * 3, 30 + Math.floor(k / 2) * 3);
    const ai = s.ai.find((a) => a.player === 1)!;
    ai.nextThink = 0;
    const copy = deserialize(serialize(s));
    aiTick(s, ai);
    expect(b.charge).toBe(0);
    run(s, 10);
    expect(s.entities.filter((e) => e.def === 'refinery' && e.owner === 0 && e.hp > 0).length).toBeLessThan(4);
    run(s, 5); aiTick(copy, copy.ai.find((a) => a.player === 1)!); run(copy, 15);
    expect(serialize(copy)).toBe(serialize(s));
  });
});
