import type { GameMap } from '../types';

export const T = { Grass: 0, Sand: 1, Water: 2, Rock: 3, Road: 4, Tree: 5, Bridge: 6 } as const;

/** Flat colour per terrain type (minimap, map previews). */
export const TERRAIN_MINIMAP = ['#4d7433', '#bfa064', '#2a5a80', '#77746a', '#6e655a', '#2f5222', '#8a6a3e'];
export const TERRAIN_NAMES = ['grass', 'sand', 'water', 'rock', 'road', 'tree', 'bridge'];
const PASSABLE = [true, true, false, false, true, false, true];
// Movement layers: amphibious = land + water, water = water + under bridges.
export type MoveKind = 'ground' | 'amphibious' | 'water';
const PASS: Record<MoveKind, boolean[]> = {
  ground: PASSABLE,
  amphibious: [true, true, true, false, true, false, true],
  water: [false, false, true, false, false, false, true],
};
const BUILDABLE = [true, true, false, false, true, false, false];

export const idx = (m: GameMap, x: number, y: number) => y * m.w + x;
export const inBounds = (m: GameMap, x: number, y: number) => x >= 0 && y >= 0 && x < m.w && y < m.h;
export const terrainPassable = (m: GameMap, i: number, mv: MoveKind = 'ground') => PASS[mv][m.terrain[i]];
export const terrainBuildable = (m: GameMap, i: number) => BUILDABLE[m.terrain[i]] && m.ore[i] === 0;

export function createMap(w: number, h: number, name: string): GameMap {
  const n = w * h;
  return { w, h, name, terrain: new Uint8Array(n), ore: new Uint16Array(n), gem: new Uint8Array(n), deco: new Uint8Array(n), oreSources: [] };
}

// mulberry32 — deterministic PRNG shared by map generation and simulation.
export function nextRandom(state: { rng: number }): number {
  let t = (state.rng = (state.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const regionCache = new WeakMap<GameMap, { rev: number; r: Partial<Record<MoveKind, Int32Array>> }>();
/** Connected areas of passable terrain per movement layer (4-neighbour flood fill), cached per map until its terrain changes (`rev`). */
export function regions(m: GameMap, mv: MoveKind = 'ground'): Int32Array {
  let entry = regionCache.get(m);
  if (!entry || entry.rev !== (m.rev ?? 0)) { entry = { rev: m.rev ?? 0, r: {} }; regionCache.set(m, entry); }
  const cache = entry.r;
  let r = cache[mv];
  if (r) return r;
  r = new Int32Array(m.w * m.h).fill(-1);
  const stack: number[] = [];
  for (let start = 0, label = 0; start < r.length; start++) {
    if (r[start] !== -1 || !terrainPassable(m, start, mv)) continue;
    r[start] = label; stack.push(start);
    while (stack.length) {
      const i = stack.pop()!, x = i % m.w, y = (i / m.w) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < m.w - 1 ? i + 1 : -1, y > 0 ? i - m.w : -1, y < m.h - 1 ? i + m.w : -1])
        if (j >= 0 && r[j] === -1 && terrainPassable(m, j, mv)) { r[j] = label; stack.push(j); }
    }
    label++;
  }
  cache[mv] = r;
  return r;
}
