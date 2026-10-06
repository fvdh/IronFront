// Fun Pass interventions (menu BL and the defeat rule): checks on the changes themselves.
import { describe, expect, it } from 'vitest';
import { spawnUnit } from '../core/entities';
import { isDefeated } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { WEAPONS } from '../data/weapons';
import { versusOf } from '../systems/combat';

describe('BL2: anti-air against heavy aircraft', () => {
  it('versusAir only applies to flying targets', () => {
    const s = createGame({ ...DEFAULT_SETTINGS });
    const airship = spawnUnit(s, 'airship', 1, 20, 20), tank = spawnUnit(s, 'tank_soviets', 1, 24, 20);
    expect(versusOf(WEAPONS.gatling, airship)).toBe(0.8);
    expect(versusOf(WEAPONS.gatling, tank)).toBe(0.3); // the ground fight is unchanged
    expect(versusOf(WEAPONS.rocket, airship)).toBe(WEAPONS.rocket.versus.heavy); // no override: armour table
    expect(versusOf(WEAPONS.flakGun, airship)).toBe(1); // BL2 iteration 2 (Red Bloc)
    expect(versusOf(WEAPONS.flakGun, tank)).toBe(0.2);
  });
});

describe('defeat rule: no buildings and no Base Crawler = out', () => {
  it('a lone aircraft does not keep a player in; a Base Crawler does', () => {
    const s = createGame({ ...DEFAULT_SETTINGS });
    for (const e of s.entities) if (e.owner === 1) e.hp = 0;
    const ship = spawnUnit(s, 'airship', 1, 20, 20);
    expect(isDefeated(s, 1)).toBe(true);
    spawnUnit(s, 'mcv', 1, 22, 20);
    expect(isDefeated(s, 1)).toBe(false);
    expect(ship.hp).toBeGreaterThan(0);
  });
});
