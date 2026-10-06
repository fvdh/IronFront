import { describe, expect, it } from 'vitest';
import { spawnBuilding, spawnUnit } from '../core/entities';
import { deserialize, serialize } from '../core/save';
import { isDefeated, tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { TICK_RATE } from '../data/config';
import { WEAPONS } from '../data/weapons';
import { commandAbility } from '../systems/abilities';
import { canHit, damage, scanTarget } from '../systems/combat';
import { commandAttack, commandEnter, commandMove } from '../systems/orders';
import { canPlace, enqueue, placeLine } from '../systems/production';
import type { GameState } from '../types';
import { T } from '../world/map';

const run = (s: GameState, seconds: number) => { for (let k = 0; k < seconds * TICK_RATE; k++) tick(s); };
const flat = () => {
  const s = createGame({ ...DEFAULT_SETTINGS, seed: 7 });
  s.players[1].passive = true;
  s.map.terrain.fill(T.Grass);
  s.map.ore.fill(0);
  return s;
};
const cyOf = (s: GameState, owner: number) => s.entities.find((e) => e.owner === owner && e.def === 'cy' && e.hp > 0);

describe('phase 7: abilities, transport, aircraft, walls', () => {
  it('Base Crawler deploys anywhere into a Construction Yard and packs up again', () => {
    const s = flat();
    const m = spawnUnit(s, 'mcv', 0, 30.5, 30.5);
    expect(isDefeated(s, 0)).toBe(false);
    expect(commandAbility(s, 0, [m.id])).toBe(1);
    run(s, 2);
    const yards = s.entities.filter((e) => e.owner === 0 && e.def === 'cy');
    expect(yards).toHaveLength(2);
    expect(s.rt.byId.has(m.id)).toBe(false);
    const fresh = yards.find((e) => Math.abs(e.x - 29) <= 1)!;
    // Busy yards don't pack; idle ones do.
    enqueue(s, 0, 'power');
    expect(commandAbility(s, 0, [fresh.id])).toBe(0);
    s.players[0].queues.building = [];
    expect(commandAbility(s, 0, [fresh.id])).toBe(1);
    run(s, 0.2);
    expect(s.entities.filter((e) => e.owner === 0 && e.def === 'mcv')).toHaveLength(1);
    expect(s.entities.filter((e) => e.owner === 0 && e.def === 'cy')).toHaveLength(1);
  });

  it('crawler cannot deploy on blocked ground', () => {
    const s = flat();
    const c = cyOf(s, 0)!;
    const m = spawnUnit(s, 'mcv', 0, c.x + 1.5, c.y + 3.0); // footprint would overlap the yard
    expect(commandAbility(s, 0, [m.id])).toBe(0);
  });

  it('infantry boards a transport, rides along out of reach, and unloads', () => {
    const s = flat();
    const h = spawnUnit(s, 'flakhauler', 0, 20.5, 20.5);
    const inf = [0, 1, 2].map((k) => spawnUnit(s, 'rifle', 0, 18.5 + k * 0.5, 22.5));
    expect(commandEnter(s, 0, inf.map((u) => u.id), h.id)).toBe(3);
    run(s, 4);
    expect(h.passengers).toHaveLength(3);
    expect(inf.every((u) => u.inside === h.id)).toBe(true);
    // An enemy right next to it can't see or shoot the passengers.
    const enemy = spawnUnit(s, 'rifle', 1, 21.5, 20.5);
    run(s, 0.5);
    expect(inf.map((u) => u.id)).not.toContain(scanTarget(s, enemy, 6)?.id);
    enemy.hp = 0;
    commandMove(s, 0, [h.id], 30.5, 20.5);
    run(s, 8);
    expect(inf[0].x).toBeCloseTo(h.x, 5);
    expect(commandAbility(s, 0, [h.id])).toBe(1);
    expect(h.passengers).toHaveLength(0);
    expect(inf.every((u) => !u.inside && Math.hypot(u.x - h.x, u.y - h.y) < 3)).toBe(true);
  });

  it('passengers die with their transport; a full transport refuses more', () => {
    const s = flat();
    const h = spawnUnit(s, 'flakhauler', 0, 20.5, 20.5);
    const inf = [0, 1, 2, 3, 4, 5].map((k) => spawnUnit(s, 'rifle', 0, 18.5 + k * 0.3, 22.5));
    expect(commandEnter(s, 0, inf.map((u) => u.id), h.id)).toBe(5);
    run(s, 4);
    expect(h.passengers).toHaveLength(5);
    damage(s, h, 9999, 1);
    run(s, 0.1);
    expect(s.entities.filter((e) => e.owner === 0 && e.def === 'rifle')).toHaveLength(1);
  });

  it('dug-in infantry holds position, reaches further and takes less damage', () => {
    const s = flat();
    const a = spawnUnit(s, 'rifle', 0, 20.5, 20.5), b = spawnUnit(s, 'rifle', 0, 22.5, 20.5);
    commandAbility(s, 0, [a.id]);
    expect(a.dug).toBe(true);
    damage(s, a, 50, 1); damage(s, b, 50, 1);
    expect(a.hp).toBeGreaterThan(b.hp);
    const enemy = spawnUnit(s, 'tank_soviets', 1, 20.5 + WEAPONS.rifle.range + 1, 20.5);
    run(s, 1);
    expect(a.targetId).toBe(enemy.id); // in the bonus range
    commandMove(s, 0, [a.id], 15.5, 20.5);
    expect(a.dug).toBe(false);
  });

  it('Kestrels launch from airfield pads, fire 3 salvos, return and rearm; pads cap the fleet', () => {
    const s = flat();
    const c = cyOf(s, 0)!;
    for (const [def, x] of [['factory', 6], ['radar', 10], ['airfield', 13], ['power', 17], ['power', 20]] as const) spawnBuilding(s, def, 0, c.x + x, c.y);
    s.players[0].credits = 99999;
    for (let k = 0; k < 4; k++) expect(enqueue(s, 0, 'jet')).toBe('ok');
    expect(enqueue(s, 0, 'jet')).toBe('limit');
    run(s, 60);
    const jets = s.entities.filter((e) => e.def === 'jet');
    expect(jets).toHaveLength(4);
    expect(jets.every((j) => j.landed && j.ammo === 3)).toBe(true);
    expect(new Set(jets.map((j) => j.padK)).size).toBe(4);
    const j = jets[0];
    const target = spawnBuilding(s, 'power', 1, c.x + 6, c.y + 10);
    s.players[0].visible.fill(1); target.seenBy = 0xff;
    commandAttack(s, 0, [j.id], target.id);
    run(s, 10);
    expect(target.hp).toBeLessThan(750);
    expect(['rearm', 'idle']).toContain(j.order.type);
    run(s, 15);
    expect(j.landed).toBe(true);
    expect(j.ammo).toBe(3);
  });

  it('walls: dragged line costs one wall per tile, never auto-targeted, not enough to stay alive', () => {
    const s = flat();
    const c = cyOf(s, 0)!;
    const p = s.players[0];
    p.ready = 'wall';
    const before = p.credits;
    expect(placeLine(s, 0, [0, 1, 2, 3].map((k) => [c.x + 4 + k, c.y] as [number, number]))).toBe(4);
    expect(before - p.credits).toBe(300); // the first piece was paid in the queue
    const tank = spawnUnit(s, 'tank_soviets', 1, c.x + 5.5, c.y + 2.5);
    run(s, 0.5);
    expect(scanTarget(s, tank, 6)?.def).not.toBe('wall');
    c.hp = 0;
    run(s, 1);
    expect(isDefeated(s, 0)).toBe(true);
  });

  it('anti-air defenses only hit aircraft', () => {
    const s = flat();
    const jet = spawnUnit(s, 'jet', 1, 10, 10), tank = spawnUnit(s, 'tank_soviets', 1, 10, 11);
    for (const w of ['samMissile', 'flakCannon']) {
      expect(canHit(WEAPONS[w], jet)).toBe(true);
      expect(canHit(WEAPONS[w], tank)).toBe(false);
    }
    jet.landed = true; // parked aircraft are ground targets
    expect(canHit(WEAPONS.samMissile, jet)).toBe(false);
    expect(canHit(WEAPONS.cannon, jet)).toBe(true);
  });

  it('AI rebuilds its base with a Base Crawler after losing the Construction Yard', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, seed: 5, difficulty: 'hard' });
    s.players[0].passive = true;
    run(s, 4 * 60);
    const [sx, sy] = [Math.floor(s.players[1].startX), Math.floor(s.players[1].startY)];
    spot: for (let r = 4; r < 14; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
      if (canPlace(s, 1, 'depot', sx + dx, sy + dy)) { spawnBuilding(s, 'depot', 1, sx + dx, sy + dy); break spot; }
    expect(s.entities.some((e) => e.owner === 1 && e.def === 'factory')).toBe(true);
    s.players[1].credits += 5000;
    cyOf(s, 1)!.hp = 0;
    run(s, 90);
    expect(cyOf(s, 1)).toBeDefined();
  }, 60_000);

  it('save/load keeps passengers and aircraft state', () => {
    const s = flat();
    const h = spawnUnit(s, 'flakhauler', 0, 20.5, 20.5);
    const u = spawnUnit(s, 'rifle', 0, 19.5, 20.5);
    commandEnter(s, 0, [u.id], h.id);
    run(s, 3);
    const copy = deserialize(serialize(s));
    commandMove(s, 0, [h.id], 30.5, 25.5); commandMove(copy, 0, [h.id], 30.5, 25.5);
    run(s, 5); run(copy, 5);
    expect(serialize(copy)).toBe(serialize(s));
    expect(copy.rt.byId.get(u.id)!.inside).toBe(h.id);
  });
});
