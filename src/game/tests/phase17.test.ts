import { describe, expect, it } from 'vitest';
import { spawnBuilding } from '../core/entities';
import { tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { TICK_RATE } from '../data/config';
import { canPlace, cellFree } from '../systems/production';

describe('phase 17: battlefield readability', () => {
  it('every credit a harvester delivers is reported as income at its refinery (the "+$" floater)', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, seed: 7 });
    s.players[1].passive = true;
    const cy = s.entities.find((e) => e.owner === 0 && e.def === 'cy')!;
    let ref = null;
    for (let dx = -6; dx < 7 && !ref; dx++) for (let dy = -6; dy < 7 && !ref; dy++) if (canPlace(s, 0, 'refinery', cy.x + dx, cy.y + dy)) ref = spawnBuilding(s, 'refinery', 0, cy.x + dx, cy.y + dy, 0.99);
    let income = 0;
    for (let k = 0; k < 90 * TICK_RATE; k++) {
      tick(s);
      for (const ev of s.rt.events) if (ev.type === 'income' && ev.owner === 0) { income += ev.amount; expect(s.rt.byId.get(ev.id)?.def).toBe('refinery'); }
      s.rt.events.length = 0; // the game drains events after every frame
    }
    expect(income).toBeGreaterThan(0);
    expect(income).toBe(s.players[0].stats.harvested);
  });

  it('the placement grid marks exactly the blocked cells', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, seed: 7 });
    const cy = s.entities.find((e) => e.owner === 0 && e.def === 'cy')!;
    expect(cellFree(s, 'power', cy.x, cy.y)).toBe(false); // under the CY
    expect(canPlace(s, 0, 'power', cy.x, cy.y)).toBe(false);
    let free: [number, number] | null = null;
    for (let dx = -6; dx < 7 && !free; dx++) for (let dy = -6; dy < 7 && !free; dy++) if (canPlace(s, 0, 'power', cy.x + dx, cy.y + dy)) free = [cy.x + dx, cy.y + dy];
    expect(free).toBeTruthy();
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) expect(cellFree(s, 'power', free![0] + x, free![1] + y)).toBe(true);
  });
});
