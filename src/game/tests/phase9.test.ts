import { describe, expect, it } from 'vitest';
import { spawnBuilding, spawnUnit } from '../core/entities';
import { deserialize, serialize } from '../core/save';
import { tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { TICK_RATE } from '../data/config';
import { UNITS } from '../data/units';
import { WEAPONS } from '../data/weapons';
import { commandAbility } from '../systems/abilities';
import { canHit, disguisedFrom, held, scanTarget, weaponOf } from '../systems/combat';
import { commandAttack, commandEnter, commandMove } from '../systems/orders';
import { catalog, enqueue } from '../systems/production';
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

describe('phase 9: vehicles & air', () => {
  it('amphibious transport crosses water that stops ground units', () => {
    const s = flat();
    for (let y = 0; y < s.map.h; y++) for (let x = 24; x < 28; x++) s.map.terrain[y * s.map.w + x] = T.Water;
    const a = spawnUnit(s, 'amphib', 0, 20.5, 20.5), tank = spawnUnit(s, 'tank_allies', 0, 20.5, 22.5);
    const inf = spawnUnit(s, 'rifle', 0, 19.5, 20.5);
    commandEnter(s, 0, [inf.id], a.id);
    run(s, 2);
    expect(inf.inside).toBe(a.id);
    commandMove(s, 0, [a.id], 31.5, 20.5);
    commandMove(s, 0, [tank.id], 31.5, 22.5);
    run(s, 15);
    expect(a.x).toBeGreaterThan(30);
    expect(tank.x).toBeLessThan(24);
    commandAbility(s, 0, [a.id]);
    expect(inf.inside).toBeUndefined();
    expect(inf.x).toBeGreaterThan(28);
  });

  it('IFV takes its weapon from the passenger', () => {
    const s = flat();
    const ifv = spawnUnit(s, 'ifv', 0, 20.5, 20.5);
    expect(weaponOf(ifv)).toBe(WEAPONS.ifvRocket);
    const r = spawnUnit(s, 'rifle', 0, 19.5, 20.5);
    commandEnter(s, 0, [r.id], ifv.id);
    run(s, 2);
    expect(weaponOf(ifv)).toBe(WEAPONS.ifvMg);
    commandAbility(s, 0, [ifv.id]);
    expect(weaponOf(ifv)).toBe(WEAPONS.ifvRocket);
  });

  it('Leech Drone kills infantry and eats vehicles from the inside until a repair depot gets it out', () => {
    const s = flat();
    const d = spawnUnit(s, 'leechdrone', 1, 20.5, 20.5);
    const inf = spawnUnit(s, 'rifle', 0, 21.3, 20.5);
    s.players[0].passive = true;
    commandAttack(s, 1, [d.id], inf.id);
    run(s, 1.5);
    expect(alive(s, inf.id)).toBe(false);
    const t = spawnUnit(s, 'tank_allies', 0, 21.5, 20.5);
    t.order = { type: 'idle', tx: t.x, ty: t.y, targetId: 0 };
    commandAttack(s, 1, [d.id], t.id);
    run(s, 2);
    expect(alive(s, d.id)).toBe(false);
    expect(t.leechBy).toBe(1);
    run(s, 3);
    expect(t.hp).toBeLessThan(UNITS.tank_allies.hp - 80);
    const depot = spawnBuilding(s, 'depot', 0, 22, 18);
    t.x = t.px = depot.x + 0.5; t.y = t.py = depot.y + 2.5;
    run(s, 0.5);
    expect(t.leechBy).toBeUndefined();
  });

  it('Siege Rotor: helicopter gun in the air, long-range artillery after landing (then a ground target)', () => {
    const s = flat();
    const r = spawnUnit(s, 'siegerotor', 1, 20.5, 20.5);
    expect(canHit(WEAPONS.cannon, r)).toBe(false);
    expect(weaponOf(r)).toBe(WEAPONS.rotorGun);
    commandAbility(s, 1, [r.id]);
    expect(r.deployed).toBe(true);
    expect(weaponOf(r)).toBe(WEAPONS.siegeShell);
    expect(canHit(WEAPONS.cannon, r)).toBe(true);
    commandMove(s, 1, [r.id], 25.5, 20.5);
    expect(r.deployed).toBe(false);
  });

  it('Hivemind holds three units, overloads with a fourth', () => {
    const s = flat();
    const h = spawnUnit(s, 'hivemind', 1, 20.5, 20.5);
    s.players[0].passive = true;
    const ts = [0, 1, 2, 3, 4].map((k) => spawnUnit(s, 'miner', 0, 23.5, 17.5 + k * 1.5)); // unarmed: nobody shoots back
    for (const t of ts) t.order = { type: 'idle', tx: t.x, ty: t.y, targetId: 0 };
    for (const t of ts) { commandAttack(s, 1, [h.id], t.id); run(s, 4); } // each: 1.3 s cooldown + a 2.4 s beam (1400-credit hauler)
    expect(held(s, h)).toBe(4);
    const hp = h.hp;
    run(s, 3);
    expect(h.hp).toBeLessThan(hp);
  });

  it('a broken control beam starts over (driving out of range is a real escape)', () => {
    const s = flat();
    s.players[0].passive = true;
    const m = spawnUnit(s, 'mentalist', 1, 20.5, 20.5);
    const t = spawnUnit(s, 'miner', 0, 24.5, 20.5); // 1400 credits: a 2.4 s beam
    t.order = { type: 'idle', tx: t.x, ty: t.y, targetId: 0 };
    commandAttack(s, 1, [m.id], t.id);
    run(s, 2);
    expect(t.owner).toBe(0);
    t.x += 8; run(s, 0.5); t.x -= 8; // out of range for half a second, then back
    run(s, 1.5);
    expect(t.owner).toBe(0); // the 2 s it already had are gone
    run(s, 1.5);
    expect(t.owner).toBe(1);
  });

  it('Delirium gas makes enemies turn on their own side', () => {
    const s = flat();
    const dd = spawnUnit(s, 'deliriumdrone', 1, 20.5, 20.5);
    const a = spawnUnit(s, 'tank_allies', 0, 22.5, 20.5), b = spawnUnit(s, 'tank_allies', 0, 23.5, 21.5);
    commandAttack(s, 1, [dd.id], a.id);
    run(s, 2);
    expect(a.berserkUntil!).toBeGreaterThan(s.tick);
    dd.hp = 0;
    run(s, 5);
    expect(a.hp < UNITS.tank_allies.hp - 30 || b.hp < UNITS.tank_allies.hp - 30).toBe(true); // they shot each other
  });

  it('Hover Disc drains refineries and blacks out power plants', () => {
    const s = flat();
    const disc = spawnUnit(s, 'disc', 1, 20.5, 20.5);
    const ref = spawnBuilding(s, 'refinery', 0, 22, 19);
    ref.seenBy = 0xff;
    s.players[0].credits = 1000;
    const before = s.players[1].credits;
    commandAttack(s, 1, [disc.id], ref.id);
    run(s, 3);
    expect(s.players[1].credits).toBeGreaterThan(before);
    expect(s.players[0].credits).toBeLessThan(1000);
    const pw = spawnBuilding(s, 'power', 0, 18, 18);
    pw.seenBy = 0xff;
    commandAttack(s, 1, [disc.id], pw.id);
    run(s, 2);
    expect(s.players[0].powerMade).toBe(0); // blackout
  });

  it('Shroud Tank looks like a tree to the enemy while still and silent; dogs see through it', () => {
    const s = flat();
    const m = spawnUnit(s, 'shroudtank', 0, 20.5, 20.5);
    run(s, 1.5);
    expect(disguisedFrom(s, m, 1)).toBe(true);
    const enemy = spawnUnit(s, 'tank_soviets', 1, 25.5, 20.5);
    s.players[0].passive = true;
    expect(scanTarget(s, enemy, 8)).toBeUndefined();
    commandMove(s, 0, [m.id], 18.5, 20.5);
    run(s, 0.3);
    expect(disguisedFrom(s, m, 1)).toBe(false);
  });

  it('Thrall Hauler comes with thralls that mine for it once it is rigged', () => {
    const s = flat();
    for (let y = 30; y < 34; y++) for (let x = 30; x < 34; x++) s.map.ore[y * s.map.w + x] = 300;
    s.players[0].faction = 'psi';
    const h = spawnUnit(s, 'thrallhauler', 0, 28.5, 31.5);
    const thralls = s.entities.filter((e) => e.def === 'thrall' && e.master === h.id);
    expect(thralls).toHaveLength(3);
    h.order = { type: 'idle', tx: h.x, ty: h.y, targetId: 0 }; h.cargo = 0;
    commandAbility(s, 0, [h.id]);
    expect(h.deployed).toBe(true);
    const before = s.players[0].credits;
    run(s, 40);
    expect(s.players[0].credits).toBeGreaterThan(before + 100);
    h.hp = 0;
    run(s, 0.1);
    expect(thralls.every((t) => !t.master)).toBe(true); // freed
    expect(catalog(s, 0, 'infantry')).not.toContain('thrall');
    expect(enqueue(s, 0, 'thrall')).toBe('locked');
  });

  it('Psi refineries come with a Thrall Hauler, other factions with an Ore Hauler', () => {
    const s = flat();
    s.players[1].faction = 'psi';
    const a = spawnBuilding(s, 'refinery', 0, 10, 10, 0.99), b = spawnBuilding(s, 'refinery', 1, 30, 30, 0.99);
    run(s, 0.2);
    expect(s.entities.some((e) => e.owner === 0 && e.def === 'miner')).toBe(true);
    expect(s.entities.some((e) => e.owner === 1 && e.def === 'thrallhauler')).toBe(true);
    expect(a.built + b.built).toBe(2);
  });

  it('Talon drops one heavy bomb and rearms', () => {
    const s = flat();
    const c = s.entities.find((e) => e.owner === 0 && e.def === 'cy')!;
    const af = spawnBuilding(s, 'airfield', 0, c.x + 6, c.y);
    const t = spawnUnit(s, 'talon', 0, af.x + 0.75, af.y + 0.75);
    const target = spawnBuilding(s, 'power', 1, c.x + 6, c.y + 10);
    target.seenBy = 0xff;
    commandAttack(s, 0, [t.id], target.id);
    run(s, 8);
    expect(target.hp).toBeLessThan(750 - 400);
    run(s, 10);
    expect(t.landed).toBe(true); // flew home and rearmed
    expect(t.ammo).toBe(1);
  });

  it('infantry boards a transport parked on a tile it cannot walk on (rock edge)', () => {
    const s = flat();
    s.map.terrain[60 * s.map.w + 12] = T.Rock;
    const ifv = spawnUnit(s, 'ifv', 0, 12.5, 60.5), r = spawnUnit(s, 'rifle', 0, 10.5, 60.5);
    commandEnter(s, 0, [r.id], ifv.id);
    run(s, 4);
    expect(r.inside).toBe(ifv.id);
  });

  it('save/load keeps leech, berserk, thrall and deploy state identical', () => {
    const s = flat();
    const h = spawnUnit(s, 'thrallhauler', 0, 28.5, 31.5);
    commandAbility(s, 0, [h.id]);
    const t = spawnUnit(s, 'tank_allies', 0, 20.5, 20.5);
    t.leechBy = 1; t.berserkUntil = s.tick + 200;
    const r = spawnUnit(s, 'siegerotor', 1, 30.5, 20.5);
    commandAbility(s, 1, [r.id]);
    const copy = deserialize(serialize(s));
    run(s, 5); run(copy, 5);
    expect(serialize(copy)).toBe(serialize(s));
  });
});
