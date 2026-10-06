import { describe, expect, it } from 'vitest';
import { spawnBuilding, spawnUnit } from '../core/entities';
import { tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { TICK_RATE } from '../data/config';
import { UNITS } from '../data/units';
import { WEAPONS } from '../data/weapons';
import { commandAbility } from '../systems/abilities';
import { canHit, damage, disguisedFrom, scanTarget } from '../systems/combat';
import { commandAttack, commandCapture, commandMove } from '../systems/orders';
import { enqueue } from '../systems/production';
import type { GameState } from '../types';
import { T } from '../world/map';

const run = (s: GameState, seconds: number) => { for (let k = 0; k < seconds * TICK_RATE; k++) tick(s); };
const flat = () => {
  const s = createGame({ ...DEFAULT_SETTINGS, seed: 7 });
  s.players[1].passive = true;
  s.map.terrain.fill(T.Grass);
  s.map.ore.fill(0);
  for (const p of s.players) { p.visible.fill(1); p.explored.fill(1); }
  return s;
};
const alive = (s: GameState, id: number) => (s.rt.byId.get(id)?.hp ?? 0) > 0;

describe('phase 8: infantry & heroes', () => {
  it('heroes are limited to one per player', () => {
    const s = flat();
    const c = s.entities.find((e) => e.owner === 0 && e.def === 'cy')!;
    for (const [def, x] of [['power', 4], ['barracks', 7], ['factory', 10], ['radar', 14], ['lab', 17], ['power', 21]] as const) spawnBuilding(s, def, 0, c.x + x, c.y);
    s.players[0].credits = 99999;
    expect(enqueue(s, 0, 'nova')).toBe('ok');
    expect(enqueue(s, 0, 'nova')).toBe('limit');
    run(s, 25);
    expect(s.entities.filter((e) => e.def === 'nova')).toHaveLength(1);
    expect(enqueue(s, 0, 'nova')).toBe('limit');
    s.entities.find((e) => e.def === 'nova')!.hp = 0;
    run(s, 0.1);
    expect(enqueue(s, 0, 'nova')).toBe('ok'); // rebuildable after death
  });

  it('Nova kills infantry in one shot and blows up buildings with C4, but ignores tanks', () => {
    const s = flat();
    const n = spawnUnit(s, 'nova', 0, 20.5, 20.5);
    const inf = spawnUnit(s, 'rifle', 1, 24.5, 20.5);
    run(s, 1.5);
    expect(alive(s, inf.id)).toBe(false);
    expect(weaponOk('novaPistols', spawnUnit(s, 'tank_soviets', 1, 40, 40))).toBe(false);
    const b = spawnBuilding(s, 'power', 1, 26, 26);
    b.seenBy = 0xff;
    commandAttack(s, 0, [n.id], b.id);
    run(s, 8);
    expect(alive(s, b.id)).toBe(false);
  });

  it('Grom designates a building and the airstrike flattens it', () => {
    const s = flat();
    const g = spawnUnit(s, 'grom', 0, 20.5, 20.5);
    const b = spawnBuilding(s, 'barracks', 1, 25, 20);
    b.seenBy = 0xff;
    commandAttack(s, 0, [g.id], b.id);
    let strike = false;
    for (let k = 0; k < 20 * TICK_RATE; k++) { tick(s); strike ||= s.projectiles.some((p) => p.weapon === 'airstrike'); } // two designations (14 s apart)
    expect(strike).toBe(true);
    expect(alive(s, b.id)).toBe(false);
  });

  it('phase beam freezes the target (untouchable by others) and erases it', () => {
    const s = flat();
    const ph = spawnUnit(s, 'phasetrooper', 0, 20.5, 20.5);
    const t = spawnUnit(s, 'tank_soviets', 1, 24.5, 20.5);
    commandAttack(s, 0, [ph.id], t.id);
    run(s, 1);
    expect(t.phased).toBeGreaterThan(0);
    expect(t.frozenUntil!).toBeGreaterThan(s.tick);
    const hp = t.hp;
    damage(s, t, 100, 0);
    expect(t.hp).toBe(hp); // out of time: nothing else hurts it
    expect(canHit(WEAPONS.cannon, t)).toBe(false);
    run(s, 20);
    expect(alive(s, t.id)).toBe(false);
    expect(s.players[0].stats.kills).toBe(1);
  });

  it('a phased target that escapes the beam returns unharmed', () => {
    const s = flat();
    const ph = spawnUnit(s, 'phasetrooper', 0, 20.5, 20.5);
    const t = spawnUnit(s, 'tank_soviets', 1, 24.5, 20.5);
    commandAttack(s, 0, [ph.id], t.id);
    run(s, 1);
    ph.hp = 0;
    run(s, 2);
    expect(t.phased ?? 0).toBe(0);
    expect(t.hp).toBe(UNITS.tank_soviets.hp);
  });

  it('Phase Trooper teleports instead of walking', () => {
    const s = flat();
    const ph = spawnUnit(s, 'phasetrooper', 0, 10.5, 10.5);
    commandMove(s, 0, [ph.id], 30.5, 10.5);
    run(s, 0.2);
    expect(ph.x).toBeCloseTo(30.5, 1);
    expect(ph.frozenUntil!).toBeGreaterThan(s.tick);
  });

  it('Sapper plants a time bomb that blows up target and bystanders', () => {
    const s = flat();
    const sp = spawnUnit(s, 'sapper', 0, 20.5, 20.5);
    const t = spawnUnit(s, 'tank_soviets', 1, 22.5, 20.5);
    const near = spawnUnit(s, 'rifle', 1, 23.3, 20.5);
    commandAttack(s, 0, [sp.id], t.id);
    run(s, 2);
    expect(t.bombAt).toBeGreaterThan(s.tick);
    commandMove(s, 0, [sp.id], 10.5, 20.5);
    run(s, 6);
    expect(alive(s, near.id)).toBe(false);
    expect(t.hp).toBeLessThan(UNITS.tank_soviets.hp * 0.2);
  });

  it('deployed Blight Trooper irradiates nearby enemy infantry, not vehicles', () => {
    const s = flat();
    const b = spawnUnit(s, 'blight', 0, 20.5, 20.5);
    commandAbility(s, 0, [b.id]);
    expect(b.deployed).toBe(true);
    const inf = spawnUnit(s, 'initiate', 1, 22.3, 20.5), tank = spawnUnit(s, 'tank_psi', 1, 20.5, 22.3);
    s.players[0].passive = true;
    run(s, 3);
    expect(alive(s, inf.id)).toBe(false);
    expect(tank.hp).toBeGreaterThan(UNITS.tank_psi.hp - 25); // only the odd rifle shot, no radiation
  });

  it('Toxin Sniper kills leave a poison cloud', () => {
    const s = flat();
    spawnUnit(s, 'toxin', 0, 20.5, 20.5);
    spawnUnit(s, 'rifle', 1, 27.5, 20.5);
    run(s, 3);
    expect(s.hazards?.length).toBe(1);
    const late = spawnUnit(s, 'rifle', 1, 27.5, 20.7);
    late.order = { type: 'idle', tx: 27.5, ty: 20.7, targetId: 0 };
    s.entities.find((e) => e.def === 'toxin')!.hp = 0; // only the cloud may hurt it now
    run(s, 2);
    expect(late.hp).toBeLessThan(UNITS.rifle.hp);
  });

  it('Oracle takes enemy buildings after an unbroken 5 s beam (not CY or superweapons); psi storm wipes infantry', () => {
    const s = flat();
    const o = spawnUnit(s, 'oracle', 0, 20.5, 20.5);
    const b = spawnBuilding(s, 'power', 1, 24, 20);
    b.seenBy = 0xff;
    commandAttack(s, 0, [o.id], b.id);
    run(s, 3);
    expect(b.owner).toBe(1); // the beam has to hold for 5 s
    expect(o.chargeOn).toBe(b.id);
    damage(s, o, 5, 1); // a hit breaks it
    expect(o.chargeOn).toBe(0);
    run(s, 6);
    expect(b.owner).toBe(0);
    // Construction Yards and superweapons can't be taken.
    expect(canHit(WEAPONS.oracleTakeover, spawnBuilding(s, 'cy', 1, 30, 30))).toBe(false);
    expect(canHit(WEAPONS.oracleTakeover, spawnBuilding(s, 'phasegate', 1, 35, 30))).toBe(false);
    const inf = [0, 1, 2].map((k) => spawnUnit(s, 'rifle', 1, 19.5 + k, 22.5));
    expect(commandAbility(s, 0, [o.id])).toBe(1);
    expect(commandAbility(s, 0, [o.id])).toBe(0); // cooldown
    run(s, 0.1);
    expect(inf.every((u) => !alive(s, u.id))).toBe(true);
    // Heroes can't be mind controlled.
    expect(canHit(WEAPONS.mindControl, spawnUnit(s, 'nova', 1, 30, 30))).toBe(false);
  });

  it('Infiltrator: enemies see one of their own and hold fire; dogs see through; refinery loses half its money', () => {
    const s = flat();
    const spy = spawnUnit(s, 'infiltrator', 0, 20.5, 20.5);
    const guard = spawnUnit(s, 'rifle', 1, 22.5, 20.5);
    expect(disguisedFrom(s, spy, 1)).toBe(true);
    expect(scanTarget(s, guard, 6)).toBeUndefined();
    const dog = spawnUnit(s, 'dog', 1, 22.5, 21.5);
    expect(disguisedFrom(s, spy, 1)).toBe(false);
    expect(scanTarget(s, dog, 6)?.id).toBe(spy.id);
    dog.hp = 0; guard.hp = 0;
    run(s, 0.1);
    const ref = spawnBuilding(s, 'refinery', 1, 24, 24);
    ref.seenBy = 0xff;
    s.players[1].credits = 4000;
    const before = s.players[0].credits;
    expect(commandCapture(s, 0, [spy.id], ref.id)).toBe(1);
    run(s, 6);
    expect(s.players[1].credits).toBe(2000);
    expect(s.players[0].credits).toBe(before + 2000);
    expect(alive(s, spy.id)).toBe(false);
    expect(ref.owner).toBe(1);
  });

  it('infiltrated power plant blacks out the base; infiltrated barracks makes veterans', () => {
    const s = flat();
    const pw = spawnBuilding(s, 'power', 1, 24, 24);
    const bar = spawnBuilding(s, 'barracks', 1, 28, 24);
    pw.seenBy = bar.seenBy = 0xff;
    const a = spawnUnit(s, 'infiltrator', 0, 22.5, 24.5), b = spawnUnit(s, 'infiltrator', 0, 27.5, 23.5);
    commandCapture(s, 0, [a.id], pw.id);
    commandCapture(s, 0, [b.id], bar.id);
    run(s, 4);
    expect(s.players[1].powerMade).toBe(0);
    expect(s.players[0].vet?.infantry).toBe(true);
    run(s, 45);
    expect(s.players[1].powerMade).toBeGreaterThan(0);
  });

  it('Skyjumper flies: only anti-air reaches it', () => {
    const s = flat();
    const j = spawnUnit(s, 'skyjumper', 1, 20, 20);
    expect(canHit(WEAPONS.rifle, j)).toBe(false);
    expect(canHit(WEAPONS.flakRifle, j)).toBe(true);
  });
});

function weaponOk(w: string, t: Parameters<typeof canHit>[1]) { return canHit(WEAPONS[w], t); }
