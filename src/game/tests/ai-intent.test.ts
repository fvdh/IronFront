// Fun Pass 26.A: the AI knows what it saw and searches for what it lost (plan/fun-pass-plan.md, fase 26).
// Exploit test: the player builds a second base elsewhere, sells the first and fields no army.
// The AI (which has seen the old base) must find the new base within 3 min after the old one is gone.
import { describe, expect, it } from 'vitest';

declare const process: { env: Record<string, string | undefined> };
import { spawnBuilding, spawnUnit } from '../core/entities';
import { tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { TICK_RATE } from '../data/config';
import { sellBuilding } from '../systems/orders';
import { canPlace } from '../systems/production';
import type { GameSettings, GameState } from '../types';
import { regions } from '../world/map';

const M = 60 * TICK_RATE;
const step = (s: GameState) => { tick(s); s.rt.events.length = 0; };

/** A free spot for a `def` of player 0 near (x, y), on land his own start connects to (a Base Crawler could drive there). */
function spotNear(s: GameState, def: string, x: number, y: number): [number, number] {
  const reg = regions(s.map), w = s.map.w, home = reg[Math.floor(s.players[0].startY) * w + Math.floor(s.players[0].startX)];
  for (let r = 0; r < 24; r++)
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
      if (reg[(y + dy) * w + x + dx] === home && canPlace(s, 0, def, x + dx, y + dy, { anywhere: true })) return [x + dx, y + dy];
  throw new Error('no spot');
}

function exploit(settings: Partial<GameSettings>) {
  const s = createGame({ ...DEFAULT_SETTINGS, mapSize: 'medium', aiCount: 1, difficulty: 'normal', superweapons: false, ...settings });
  const p = s.players[0], { w, h } = s.map;
  // Once the AI has seen the old base (its first wave got there), the player has a new base in a corner nobody
  // started in and sells the old one.
  const old = s.entities.filter((e) => e.owner === 0 && e.kind === 'building');
  while (s.tick < 15 * M && !old.some((b) => b.seenBy & (1 << 1))) step(s);
  // The two corners nobody started in; the first one the AI can't see right now.
  const ex = p.startX < w / 2 ? w - 12 : 8, ey = p.startY < h / 2 ? 8 : h - 12, sx = Math.floor(p.startX), sy = Math.floor(p.startY);
  const spots = [[ex, sy], [sx, ey]].map(([x, y]) => spotNear(s, 'cy', x, y));
  const at = spots.find(([x, y]) => !s.players[1].visible[y * w + x]) ?? spots[0], pw = spotNear(s, 'power', at[0] + 4, at[1]);
  const fresh = [spawnBuilding(s, 'cy', 0, at[0], at[1]), spawnBuilding(s, 'power', 0, pw[0], pw[1])];
  const seen = () => fresh.some((b) => b.seenBy & (1 << 1));
  const before = fresh.some((b) => s.players[1].visible[b.y * w + b.x] === 1);
  for (const b of old) sellBuilding(s, 0, b.id);
  const gone = s.tick;
  while (s.tick < gone + 3 * M && !seen()) step(s);
  return { knewOld: old.some((b) => b.seenBy & (1 << 1)), before, found: seen(), after: (s.tick - gone) / M, at: gone / M };
}

describe('26.A: the AI finds a moved base', () => {
  const cases = [['plains', 11], ['rivers', 12], ['highlands', 33], ['plains', 21], ['rivers', 22], ['highlands', 23], ['coast', 24], ['plains', 25]] as const;
  for (const [mapPreset, seed] of cases)
    it(`${mapPreset} ${seed}: new base found within 3 min after the old one is sold`, () => {
      const r = exploit({ mapPreset, seed });
      if (process.env.AI_INTENT_LOG) console.log("CASE", mapPreset, seed, JSON.stringify(r));
      expect(r.knewOld, 'the AI never saw the old base').toBe(true);
      expect(r.before, 'the new base is in the AI\'s sight from the start: test proves nothing').toBe(false);
      expect(r.found, `not found after ${r.after.toFixed(1)} min`).toBe(true);
    }, 120_000);
});

describe('26.A: memory only holds what the AI saw', () => {
  it('unseen → not known; seen → known; gone out of sight → assumption; looked again → dropped', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, mapSize: 'medium', mapPreset: 'plains', aiCount: 1, difficulty: 'normal', seed: 5 });
    const ai = s.ai[0], { w, h } = s.map;
    const mem = () => ai.memory!.buildings.map((b) => b.id);
    const [x, y] = spotNear(s, 'power', Math.floor(w / 2), Math.floor(h / 2));
    const b = spawnBuilding(s, 'power', 0, x, y);
    for (let k = 0; k < 2 * TICK_RATE; k++) step(s);
    expect(mem()).not.toContain(b.id);
    const eye = spawnUnit(s, 'rifle', 1, x + 3, y + 1);
    for (let k = 0; k < 2 * TICK_RATE; k++) step(s);
    expect(mem()).toContain(b.id);
    eye.hp = 0;
    for (let k = 0; k < 2 * TICK_RATE; k++) step(s);
    sellBuilding(s, 0, b.id);
    for (let k = 0; k < 3 * TICK_RATE; k++) step(s);
    expect(s.rt.byId.get(b.id)).toBeUndefined();
    expect(mem(), 'gone out of sight: still assumed').toContain(b.id);
    spawnUnit(s, 'rifle', 1, x + 3, y + 1);
    for (let k = 0; k < 2 * TICK_RATE; k++) step(s);
    expect(mem(), 'looked again: dropped').not.toContain(b.id);
  });
});
