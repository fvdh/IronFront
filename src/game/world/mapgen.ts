import { MAP_SIZES, ORE_TILE_MAX, GEM_MULTIPLIER } from '../data/config';
import type { GameMap, GameSettings } from '../types';
import { createMap, idx, inBounds, nextRandom, T } from './map';

export interface MapPreset { id: string; name: string; description: string; water: number; rock: number; trees: number; sand: number; river: boolean; shape?: 'coast' | 'islands' }

export const MAP_PRESETS: MapPreset[] = [
  { id: 'plains', name: 'Open Plains', description: 'Open terrain, few obstacles.', water: 0.8, rock: 0.86, trees: 0.72, sand: 0.6, river: false },
  { id: 'rivers', name: 'Twin Rivers', description: 'A river with bridges separates the bases.', water: 0.82, rock: 0.84, trees: 0.68, sand: 0.58, river: true },
  { id: 'highlands', name: 'Rocky Highlands', description: 'Rocks and forests, narrow passes.', water: 0.78, rock: 0.7, trees: 0.6, sand: 0.62, river: false },
  { id: 'coast', name: 'Inland Sea', description: 'A large inland sea with a central island reachable by bridges. Room for a fleet.', water: 0.85, rock: 0.86, trees: 0.7, sand: 0.5, river: false, shape: 'coast' },
  { id: 'islands', name: 'Archipelago', description: 'Each base on its own island; long bridges to the central island.', water: 0.9, rock: 0.88, trees: 0.68, sand: 0.45, river: false, shape: 'islands' },
  { id: 'random', name: 'Random', description: 'Randomized from the seed.', water: 0, rock: 0, trees: 0, sand: 0, river: false },
];

const RICHNESS = { low: 0.6, normal: 1, high: 1.6 };

/** Smooth value noise in [0,1]. */
function makeNoise(rng: { rng: number }, scale: number) {
  const G = 64;
  const grid = Array.from({ length: G * G }, () => nextRandom(rng));
  const at = (x: number, y: number) => grid[((y % G) + G) % G * G + (((x % G) + G) % G)];
  return (x: number, y: number) => {
    const fx = x / scale, fy = y / scale;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const sx = fx - x0, sy = fy - y0;
    const u = sx * sx * (3 - 2 * sx), v = sy * sy * (3 - 2 * sy);
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * u;
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * u;
    return a + (b - a) * v;
  };
}

export function startPositions(w: number, h: number): [number, number][] {
  const m = 9;
  return [[m, h - m - 1], [w - m - 1, m], [m, m], [w - m - 1, h - m - 1]];
}

export function generateMap(settings: Pick<GameSettings, 'mapPreset' | 'mapSize' | 'resources' | 'seed'>, players: number): GameMap {
  const size = MAP_SIZES[settings.mapSize];
  const rng = { rng: settings.seed | 0 };
  let preset = MAP_PRESETS.find((p) => p.id === settings.mapPreset) ?? MAP_PRESETS[0];
  if (preset.id === 'random') {
    preset = { ...preset, water: 0.72 + nextRandom(rng) * 0.14, rock: 0.7 + nextRandom(rng) * 0.16, trees: 0.6 + nextRandom(rng) * 0.14, sand: 0.55 + nextRandom(rng) * 0.1, river: nextRandom(rng) < 0.5 };
  }
  const map = createMap(size, size, preset.name);
  const nWater = makeNoise(rng, 9), nRock = makeNoise(rng, 5), nTree = makeNoise(rng, 4), nSand = makeNoise(rng, 7);

  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = idx(map, x, y);
      map.deco[i] = Math.floor(nextRandom(rng) * 256);
      let t: number = T.Grass;
      if (nSand(x, y) > preset.sand) t = T.Sand;
      if (nWater(x, y) > preset.water) t = T.Water;
      else if (nRock(x, y) > preset.rock) t = T.Rock;
      else if (nTree(x, y) > preset.trees && nextRandom(rng) < 0.55) t = T.Tree;
      map.terrain[i] = t;
    }

  if (preset.river) {
    // River running perpendicular to the line between the first two bases (top-left → bottom-right diagonal).
    const wobble = makeNoise(rng, 6);
    for (let k = 0; k < size; k++) {
      const off = Math.round((wobble(k, 3) - 0.5) * 8);
      for (let d = -1; d <= 1; d++) {
        const x = k + off + d, y = k;
        if (inBounds(map, x, y)) map.terrain[idx(map, x, y)] = T.Water;
        if (inBounds(map, x + 1, y)) map.terrain[idx(map, x + 1, y)] = T.Water;
      }
    }
  }

  const starts = startPositions(size, size).slice(0, players);
  const center: [number, number] = [size / 2, size / 2];
  if (preset.shape) shapeWater(map, preset.shape, size, makeNoise(rng, 6));

  // Roads from every start to the centre guarantee connectivity; water crossings become bridges.
  // Roads end on the 2×2 block around the mirror point, which is its own mirror image, so the
  // point-symmetric copy below joins both halves of every road (and bridge) seamlessly.
  const hub = Math.floor((size - 1) / 2);
  for (const [sx, sy] of starts) carveRoad(map, sx + 1, sy + 1, hub, hub);
  // Clear the start areas.
  for (const [sx, sy] of starts) stamp(map, sx + 1, sy + 1, 8, (i) => { if (map.terrain[i] !== T.Road) map.terrain[i] = T.Grass; });
  // Sea maps: every base gets a harbour basin with a channel to the sea, close enough for a Naval Yard.
  if (preset.shape) for (const [sx, sy] of starts) harbour(map, sx + 1, sy + 1, Math.atan2(center[1] - sy, center[0] - sx) + 0.6);

  const rich = RICHNESS[settings.resources];
  for (const [sx, sy] of starts) {
    // Home ore field, offset towards the map centre.
    const r = nextRandom(rng); // sea maps: keep the field clear of the harbour channel (+0.6 rad)
    const ang = Math.atan2(center[1] - sy, center[0] - sx) + (preset.shape ? -0.25 - r * 0.6 : (r - 0.5) * 1.6);
    const reach = preset.shape === 'islands' ? 6 : 10; // stay on the home island
    const fx = Math.round(sx + Math.cos(ang) * reach), fy = Math.round(sy + Math.sin(ang) * reach);
    oreField(map, rng, fx, fy, 4, rich, false);
  }
  const extra = Math.round(size / 20);
  for (let k = 0; k < extra; k++) {
    const x = Math.round(size * (0.25 + nextRandom(rng) * 0.5)), y = Math.round(size * (0.25 + nextRandom(rng) * 0.5));
    oreField(map, rng, x, y, 3, rich, k === 0);
  }
  // Point-symmetric map (like competitive skirmish maps): start 0↔1 and 2↔3 mirror each other.
  const n = size * size;
  for (let i = 0, j = n - 1; i < j; i++, j--) { map.terrain[j] = map.terrain[i]; map.ore[j] = map.ore[i]; map.gem[j] = map.gem[i]; }
  const half = map.oreSources.filter((o) => o.i < n / 2);
  map.oreSources = [...half, ...half.map((o) => ({ i: n - 1 - o.i, gem: o.gem }))];
  fillPuddles(map, 8);
  return map;
}

/** Coast: a sea filling the middle with an island at the very centre. Islands: water everywhere except
 *  an island per start corner and one in the middle (roads to the hub become long bridges). */
function shapeWater(map: GameMap, shape: 'coast' | 'islands', size: number, noise: (x: number, y: number) => number) {
  const c = (size - 1) / 2, all = startPositions(size, size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = idx(map, x, y), wob = (noise(x, y) - 0.5) * size * 0.12;
      const dc = Math.hypot(x - c, y - c) + wob;
      const land = shape === 'coast'
        ? dc > size * 0.3 || dc < size * 0.09
        : dc < size * 0.1 || all.some(([sx, sy]) => Math.hypot(x - sx - 1, y - sy - 1) + wob < size * 0.2);
      if (!land) map.terrain[i] = T.Water;
      else if (map.terrain[i] === T.Water) map.terrain[i] = T.Grass;
    }
}

/** Basin 8.5 tiles from (cx, cy) in direction `ang`, plus a channel onward until it meets open water. */
function harbour(map: GameMap, cx: number, cy: number, ang: number) {
  const before = map.terrain.slice();
  const wet = (i: number) => { map.terrain[i] = map.terrain[i] === T.Road || map.terrain[i] === T.Bridge ? T.Bridge : T.Water; };
  stamp(map, cx + Math.cos(ang) * 8.5, cy + Math.sin(ang) * 8.5, 2.6, wet);
  for (let k = 9.5; k < map.w; k += 0.5) {
    const x = cx + Math.cos(ang) * k, y = cy + Math.sin(ang) * k;
    if (!inBounds(map, Math.round(x), Math.round(y))) return;
    const sea = k > 12 && before[idx(map, Math.round(x), Math.round(y))] === T.Water;
    stamp(map, x, y, 1.6, wet);
    if (sea) return;
  }
}

/** Water bodies smaller than `min` tiles (river fragments at the mirror seam) become land; their bridges become road. */
function fillPuddles(map: GameMap, min: number) {
  const wet = (i: number) => map.terrain[i] === T.Water || map.terrain[i] === T.Bridge;
  const seen = new Uint8Array(map.w * map.h);
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || !wet(start)) continue;
    const comp = [start];
    seen[start] = 1;
    for (let k = 0; k < comp.length; k++) {
      const x = comp[k] % map.w, y = (comp[k] / map.w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!inBounds(map, x + dx, y + dy)) continue;
        const j = idx(map, x + dx, y + dy);
        if (!seen[j] && wet(j)) { seen[j] = 1; comp.push(j); }
      }
    }
    if (comp.length < min) for (const i of comp) map.terrain[i] = map.terrain[i] === T.Bridge ? T.Road : T.Sand;
  }
}

function stamp(map: GameMap, cx: number, cy: number, r: number, fn: (i: number, x: number, y: number) => void) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++)
    for (let x = Math.floor(cx - r); x <= cx + r; x++)
      if (inBounds(map, x, y) && (x - cx) ** 2 + (y - cy) ** 2 <= r * r) fn(idx(map, x, y), x, y);
}

function carveRoad(map: GameMap, x0: number, y0: number, x1: number, y1: number) {
  const steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(x0 + ((x1 - x0) * s) / steps), y = Math.round(y0 + ((y1 - y0) * s) / steps);
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      if (!inBounds(map, x + dx, y + dy)) continue;
      const i = idx(map, x + dx, y + dy);
      if (map.oreSources.some((o) => o.i === i)) continue;
      map.terrain[i] = map.terrain[i] === T.Water || map.terrain[i] === T.Bridge ? T.Bridge : T.Road;
    }
  }
}

function oreField(map: GameMap, rng: { rng: number }, cx: number, cy: number, r: number, rich: number, gems: boolean) {
  stamp(map, cx, cy, r, (i, x, y) => {
    const t = map.terrain[i];
    if (t === T.Tree || t === T.Rock) map.terrain[i] = T.Grass;
    else if (t !== T.Grass && t !== T.Sand) return;
    const falloff = 1 - Math.hypot(x - cx, y - cy) / (r + 1);
    if (nextRandom(rng) > 0.15 + falloff) return;
    map.ore[i] = Math.round(ORE_TILE_MAX * rich * (0.5 + falloff * 0.5) * (gems ? GEM_MULTIPLIER : 1));
    map.gem[i] = gems ? 1 : 0;
  });
  // The mine sits at the field centre, or the nearest open tile to it (never on roads/bridges).
  let c = -1;
  for (let k = 0; k < 25 && c < 0; k++) {
    const x = cx + [0, 1, -1, 0, 0, 1, -1, 1, -1][k % 9] * (1 + Math.floor(k / 9)), y = cy + [0, 0, 0, 1, -1, 1, 1, -1, -1][k % 9] * (1 + Math.floor(k / 9));
    if (inBounds(map, x, y) && (map.terrain[idx(map, x, y)] === T.Grass || map.terrain[idx(map, x, y)] === T.Sand)) c = idx(map, x, y);
  }
  if (c < 0) return;
  map.terrain[c] = T.Rock; // the mine itself is an obstacle
  map.ore[c] = 0; map.gem[c] = 0;
  map.oreSources.push({ i: c, gem: gems });
}
