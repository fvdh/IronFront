// Simulation cost in a busy battle: two armies of mixed units attack-moving into each other.
// Not a strict benchmark (CI machines vary) — the budget is generous; run with PERF=1 for a breakdown.
import { describe, expect, it } from 'vitest';
import { spawnUnit } from '../core/entities';
import { tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { UNITS } from '../data/units';
import { separate } from '../systems/movement';
import { commandMove } from '../systems/orders';
import { terrainPassable } from '../world/map';

declare const process: { env: Record<string, string | undefined> };

describe('performance', () => {
  it('ticks a 300-unit battle well within the frame budget', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, seed: 7, mapSize: 'large' });
    for (const p of s.players) p.passive = true; // isolate the battle from AI economy decisions
    const { w, h } = s.map;
    const cx = w / 2, cy = h / 2;
    const defs = (f: string) => Object.keys(UNITS).filter((d) => UNITS[d].factions.includes(f as never) && !UNITS[d].harvester);
    const armies: number[][] = [[], []];
    for (const owner of [0, 1]) {
      const pool = defs(s.players[owner].faction);
      for (let k = 0; armies[owner].length < 150 && k < 5000; k++) {
        const x = cx + (owner ? 8 : -8) + ((k % 15) - 7) * 0.7, y = cy + (Math.floor(k / 15) - 5) * 0.7;
        const i = Math.floor(y) * w + Math.floor(x);
        if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1 || !terrainPassable(s.map, i)) continue;
        armies[owner].push(spawnUnit(s, pool[k % pool.length], owner, x, y).id);
      }
    }
    commandMove(s, 0, armies[0], cx + 8, cy, true);
    commandMove(s, 1, armies[1], cx - 8, cy, true);
    for (let k = 0; k < 30; k++) tick(s); // warm up (JIT, first paths)

    const N = 300;
    let sep = 0;
    const t0 = performance.now();
    for (let k = 0; k < N; k++) tick(s);
    const total = performance.now() - t0;
    for (let k = 0; k < 50; k++) { const t = performance.now(); separate(s); sep += performance.now() - t; }
    const units = s.entities.filter((e) => e.kind === 'unit').length;
    if (process.env.PERF) console.log(`[perf] ${armies[0].length + armies[1].length} units spawned, ${units} alive after ${N} ticks: ${(total / N).toFixed(3)} ms/tick, separate() ${(sep / 50).toFixed(3)} ms`);
    expect(total / N).toBeLessThan(16); // a tick must leave room for rendering (30 ticks/s at 1×, 60 at 2×)
  });
});
