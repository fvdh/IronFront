import { describe, expect, it } from 'vitest';
import { spawnBuilding, spawnUnit } from '../core/entities';
import { deserialize, serialize } from '../core/save';
import { tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { TICK_RATE } from '../data/config';
import { UNITS } from '../data/units';
import { WEAPONS } from '../data/weapons';
import { canHit, canSee, scanTarget, submerged } from '../systems/combat';
import { commandAttack, commandMove } from '../systems/orders';
import { canPlace, enqueue } from '../systems/production';
import type { GameState } from '../types';
import { regions, T } from '../world/map';

const run = (s: GameState, seconds: number) => { for (let k = 0; k < seconds * TICK_RATE; k++) tick(s); };
/** Grass map with a sea band at x 30..44 (bases at the corners stay dry). */
const sea = () => {
  const s = createGame({ ...DEFAULT_SETTINGS, seed: 7 });
  s.players[1].passive = true;
  s.map.terrain.fill(T.Grass);
  s.map.ore.fill(0);
  for (let y = 0; y < s.map.h; y++) for (let x = 30; x < 45; x++) s.map.terrain[y * s.map.w + x] = T.Water;
  s.map.rev = 1;
  for (const p of s.players) { p.visible.fill(1); p.explored.fill(1); }
  return s;
};
const alive = (s: GameState, id: number) => (s.rt.byId.get(id)?.hp ?? 0) > 0;
const own = (s: GameState, def: string, owner: number, x: number, y: number) => { const b = spawnBuilding(s, def, owner, x, y); b.seenBy = 0xff; return b; };

describe('phase 11: navy', () => {
  it('a Naval Yard goes on open water only, within build range', () => {
    const s = sea();
    own(s, 'power', 0, 27, 20);
    expect(canPlace(s, 0, 'navalyard', 31, 20)).toBe(true);
    expect(canPlace(s, 0, 'navalyard', 26, 24)).toBe(false); // on land
    expect(canPlace(s, 0, 'navalyard', 40, 50)).toBe(false); // water, but far from the base
    expect(canPlace(s, 0, 'power', 31, 20)).toBe(false); // land buildings stay off the water
  });

  it('every base on the sea maps has a harbour spot on the shared sea', () => {
    for (const mapPreset of ['coast', 'islands'])
      for (const mapSize of ['small', 'medium', 'large'] as const) {
        const g = createGame({ ...DEFAULT_SETTINGS, seed: 4, mapPreset, mapSize, town: true });
        const r = regions(g.map, 'water');
        const seas = g.players.filter((p) => !p.neutral).map((p) => {
          const found = new Set<number>();
          for (let y = 0; y < g.map.h; y++) for (let x = 0; x < g.map.w; x++) if (canPlace(g, p.id, 'navalyard', x, y)) found.add(r[y * g.map.w + x]);
          return found;
        });
        expect(seas.every((f) => f.size > 0), `${mapPreset} ${mapSize}`).toBe(true);
        expect([...seas[0]].some((id) => seas[1].has(id)), `${mapPreset} ${mapSize}`).toBe(true);
      }
  });

  it('ships are built at the yard, launch on water and never come ashore', () => {
    const s = sea();
    own(s, 'power', 0, 26, 22); own(s, 'refinery', 0, 20, 20); own(s, 'factory', 0, 20, 26);
    own(s, 'navalyard', 0, 31, 22);
    s.players[0].credits = 5000;
    expect(enqueue(s, 0, 'destroyer')).toBe('ok');
    expect(enqueue(s, 0, 'barracuda')).toBe('faction');
    run(s, 14);
    const ship = s.entities.find((e) => e.def === 'destroyer')!;
    expect(ship).toBeDefined();
    expect(s.map.terrain[Math.floor(ship.y) * s.map.w + Math.floor(ship.x)]).toBe(T.Water);
    commandMove(s, 0, [ship.id], 20.5, 40.5); // onto land: stops at the shore
    run(s, 20);
    expect(ship.x).toBeGreaterThanOrEqual(30);
    expect(ship.y).toBeGreaterThan(30);
    const tank = spawnUnit(s, 'tank_allies', 0, 27.5, 10.5);
    commandMove(s, 0, [tank.id], 50.5, 10.5);
    run(s, 10);
    expect(tank.x).toBeLessThan(30);
  });

  it('a submerged sub is invisible until detected or it fires, and only anti-sub weapons reach it', () => {
    const s = sea();
    const sub = spawnUnit(s, 'barracuda', 1, 37.5, 20.5);
    const tank = spawnUnit(s, 'tank_allies', 0, 28.5, 20.5);
    run(s, 0.2);
    expect(canSee(s, 0, sub)).toBe(false);
    expect(canSee(s, 1, sub)).toBe(true);
    expect(canHit(WEAPONS.cannon, sub)).toBe(false);
    expect(canHit(WEAPONS.depthCharge, sub)).toBe(true);
    expect(canHit(WEAPONS.torpedo, tank)).toBe(false); // torpedoes only on the water
    const ship = spawnUnit(s, 'destroyer', 0, 35.5, 26.5);
    run(s, 0.5);
    expect(canSee(s, 0, sub)).toBe(true); // sonar in range (7)
    expect(scanTarget(s, ship, 8)?.id).toBe(sub.id);
    expect(commandAttack(s, 0, [ship.id], sub.id)).toBe(1);
    run(s, 25);
    expect(alive(s, sub.id)).toBe(false);
  });

  it('a sub hunts ships with torpedoes and surfaces when it fires', () => {
    const s = sea();
    const sub = spawnUnit(s, 'barracuda', 1, 37.5, 20.5);
    const boat = spawnUnit(s, 'destroyer', 0, 37.5, 27);
    boat.hp = 1;
    commandAttack(s, 1, [sub.id], boat.id);
    for (let k = 0; k < 12 * TICK_RATE && alive(s, boat.id); k++) tick(s);
    expect(alive(s, boat.id)).toBe(false);
    expect(submerged(s, sub)).toBe(false); // just fired: surfaced
    run(s, 2);
    expect(submerged(s, sub)).toBe(true);
  });

  it('the Kraken holds a ship fast; a Sonar Drone shakes it off', () => {
    const s = sea();
    const kraken = spawnUnit(s, 'kraken', 1, 37.5, 20.5);
    const ship = spawnUnit(s, 'destroyer', 0, 38.4, 20.5);
    ship.hp = 2000; // survive long enough to watch
    commandAttack(s, 1, [kraken.id], ship.id);
    run(s, 2);
    expect(ship.frozenUntil! > s.tick).toBe(true);
    commandMove(s, 0, [ship.id], 38.5, 50.5);
    run(s, 2);
    expect(ship.y).toBeLessThan(21.5); // held
    const drone = spawnUnit(s, 'sonardrone', 0, 36.5, 23.5);
    commandAttack(s, 0, [drone.id], kraken.id);
    run(s, 4);
    expect(kraken.frozenUntil! > s.tick).toBe(true);
    commandMove(s, 0, [ship.id], 38.5, 50.5);
    run(s, 4);
    expect(ship.y).toBeGreaterThan(23); // slipped away
  });

  it('ships fight the coast: a destroyer shells a tank on the shore, a Leviathan reaches far inland', () => {
    const s = sea();
    const ship = spawnUnit(s, 'destroyer', 0, 31.5, 20.5);
    const tank = spawnUnit(s, 'tank_soviets', 1, 26.5, 20.5);
    run(s, 15);
    expect(tank.hp).toBeLessThan(UNITS.tank_soviets.hp);
    const lev = spawnUnit(s, 'leviathan', 1, 31.5, 40.5);
    const hq = own(s, 'power', 0, 19, 40);
    commandAttack(s, 1, [lev.id], hq.id);
    run(s, 15);
    expect(hq.hp).toBeLessThan(750);
    expect(Math.hypot(lev.x - 20, lev.y - 41)).toBeGreaterThan(9); // fired from range, still at sea
    expect(ship.hp).toBeGreaterThan(0);
  });

  it('Nova swims, the Naval Yard repairs ships next to it', () => {
    const s = sea();
    const nova = spawnUnit(s, 'nova', 0, 27.5, 20.5);
    commandMove(s, 0, [nova.id], 48.5, 20.5);
    run(s, 15);
    expect(nova.x).toBeGreaterThan(46);
    const yard = own(s, 'navalyard', 0, 34, 30);
    const ship = spawnUnit(s, 'destroyer', 0, 33.5, 31.5);
    ship.hp = 100;
    run(s, 5);
    expect(ship.hp).toBeGreaterThan(150);
    expect(yard.hp).toBe(1200);
  });

  it('the AI builds a harbour and a fleet on a sea map, and the game survives save/load', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, seed: 1, mapPreset: 'coast', difficulty: 'hard', superweapons: false }); // the navy alone
    s.players[0].ai = true;
    s.ai.unshift({ player: 0, nextThink: 0, attackWave: 0, nextAttack: s.ai[0].nextAttack, attacking: [], lastPlace: 0 });
    let ships = 0;
    for (let k = 0; k < 430 * TICK_RATE; k++) {
      tick(s);
      ships += s.rt.events.filter((ev) => ev.type === 'unitReady' && UNITS[ev.def].move === 'water').length;
      s.rt.events.length = 0;
      for (const e of s.entities) if (e.kind === 'unit' && e.hp > 0 && UNITS[e.def].move === 'water') expect([T.Water, T.Bridge]).toContain(s.map.terrain[Math.floor(e.y) * s.map.w + Math.floor(e.x)]);
    }
    expect(s.entities.filter((e) => e.def === 'navalyard').length).toBeGreaterThan(0);
    expect(ships).toBeGreaterThan(0);
    const copy = deserialize(serialize(s));
    run(s, 20); run(copy, 20);
    expect(serialize(copy)).toBe(serialize(s));
  }, 120_000);
});
