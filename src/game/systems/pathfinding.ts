import { PATH_NODE_LIMIT } from '../data/config';
import { blocked, blockedAt } from '../core/entities';
import type { GameState } from '../types';
import type { MoveKind } from '../world/map';

// A* on the tile grid, 8 directions, no corner cutting. Scratch buffers are reused between calls;
// a generation counter avoids clearing them.
const DX = [1, -1, 0, 0, 1, 1, -1, -1];
const DY = [0, 0, 1, -1, 1, -1, 1, -1];
let size = 0, gen = 0;
let g = new Float32Array(0), seen = new Uint32Array(0), closed = new Uint32Array(0), parent = new Int32Array(0);
let heapI: number[] = [], heapF: number[] = [];

function push(i: number, f: number) {
  let k = heapI.length;
  heapI.push(i); heapF.push(f);
  while (k > 0) {
    const p = (k - 1) >> 1;
    if (heapF[p] <= f) break;
    heapI[k] = heapI[p]; heapF[k] = heapF[p];
    k = p;
  }
  heapI[k] = i; heapF[k] = f;
}

function pop(): number {
  const top = heapI[0];
  const li = heapI.pop()!, lf = heapF.pop()!;
  const n = heapI.length;
  if (n > 0) {
    let k = 0;
    for (;;) {
      let c = 2 * k + 1;
      if (c >= n) break;
      if (c + 1 < n && heapF[c + 1] < heapF[c]) c++;
      if (heapF[c] >= lf) break;
      heapI[k] = heapI[c]; heapF[k] = heapF[c];
      k = c;
    }
    heapI[k] = li; heapF[k] = lf;
  }
  return top;
}

export interface PathResult { path: number[]; complete: boolean }

/** Path of tile indices (excluding start). If the goal is unreachable, returns a path to the closest reachable tile. */
export function findPath(s: GameState, sx: number, sy: number, gx: number, gy: number, limit = PATH_NODE_LIMIT, mv: MoveKind = 'ground'): PathResult {
  const { w, h } = s.map;
  const n = w * h;
  if (n !== size) {
    size = n; gen = 0;
    g = new Float32Array(n); seen = new Uint32Array(n); closed = new Uint32Array(n); parent = new Int32Array(n);
  }
  gen++;
  heapI = []; heapF = [];
  sx = Math.min(w - 1, Math.max(0, sx | 0)); sy = Math.min(h - 1, Math.max(0, sy | 0));
  gx = Math.min(w - 1, Math.max(0, gx | 0)); gy = Math.min(h - 1, Math.max(0, gy | 0));
  const start = sy * w + sx, goal = gy * w + gx;
  const heur = (i: number) => {
    const dx = Math.abs((i % w) - gx), dy = Math.abs(((i / w) | 0) - gy);
    return Math.max(dx, dy) + 0.4142 * Math.min(dx, dy);
  };
  g[start] = 0; seen[start] = gen; parent[start] = -1;
  push(start, heur(start));
  let best = start, bestH = heur(start), expanded = 0;
  while (heapI.length) {
    const cur = pop();
    if (closed[cur] === gen) continue;
    closed[cur] = gen;
    if (cur === goal) { best = cur; break; }
    const hc = heur(cur);
    if (hc < bestH) { best = cur; bestH = hc; }
    if (++expanded > limit) break;
    const x = cur % w, y = (cur / w) | 0;
    for (let k = 0; k < 8; k++) {
      const nx = x + DX[k], ny = y + DY[k];
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx;
      if (closed[ni] === gen || blocked(s, ni, mv)) continue;
      if (k >= 4 && (blocked(s, y * w + nx, mv) || blocked(s, ny * w + x, mv))) continue;
      const ng = g[cur] + (k >= 4 ? Math.SQRT2 : 1);
      if (seen[ni] === gen && ng >= g[ni]) continue;
      seen[ni] = gen; g[ni] = ng; parent[ni] = cur;
      push(ni, ng + heur(ni));
    }
  }
  const path: number[] = [];
  for (let i = best; i !== start && i !== -1; i = parent[i]) path.push(i);
  path.reverse();
  return { path, complete: best === goal };
}

/** True when a unit of ~0.3 tile radius can travel the straight segment without touching blocked tiles. */
export function lineClear(s: GameState, x0: number, y0: number, x1: number, y1: number, mv: MoveKind = 'ground'): boolean {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.ceil(len / 0.2);
  for (let k = 0; k <= steps; k++) {
    const t = steps ? k / steps : 0;
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    if (blockedAt(s, x - 0.3, y - 0.3, mv) || blockedAt(s, x + 0.3, y - 0.3, mv) || blockedAt(s, x - 0.3, y + 0.3, mv) || blockedAt(s, x + 0.3, y + 0.3, mv)) return false;
  }
  return true;
}

/** Drop intermediate waypoints that are reachable in a straight line (bounded lookahead). */
export function smoothPath(s: GameState, fromX: number, fromY: number, path: number[], mv: MoveKind = 'ground'): number[] {
  if (path.length < 3) return path;
  const w = s.map.w;
  const cx = (i: number) => (i % w) + 0.5, cy = (i: number) => ((i / w) | 0) + 0.5;
  const out: number[] = [];
  let ax = fromX, ay = fromY, i = 0;
  while (i < path.length) {
    let j = i;
    while (j + 1 < path.length && j - i < 12 && lineClear(s, ax, ay, cx(path[j + 1]), cy(path[j + 1]), mv)) j++;
    out.push(path[j]);
    ax = cx(path[j]); ay = cy(path[j]);
    i = j + 1;
  }
  return out;
}
