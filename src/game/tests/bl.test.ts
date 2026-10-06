// Fun Pass menu BL: checks on the interventions themselves (plan/fun-pass-plan.md, BL1–BL5).
import { describe, expect, it } from 'vitest';
import { spawnUnit } from '../core/entities';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { WEAPONS } from '../data/weapons';
import { versusOf } from '../systems/combat';

describe('BL2: anti-air against heavy aircraft', () => {
  it('versusAir only applies to flying targets', () => {
    const s = createGame({ ...DEFAULT_SETTINGS });
    const airship = spawnUnit(s, 'airship', 1, 20, 20), tank = spawnUnit(s, 'tank_soviets', 1, 24, 20);
    expect(versusOf(WEAPONS.gatling, airship)).toBe(0.8);
    expect(versusOf(WEAPONS.gatling, tank)).toBe(0.3); // the ground fight is unchanged
    expect(versusOf(WEAPONS.flakGun, airship)).toBe(WEAPONS.flakGun.versus.heavy); // no override: armour table
  });
});
