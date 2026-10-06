// Water art (owned by the water pass). Fully procedural — no third-party assets.
//
// Open water: a set of pre-baked, seamlessly looping animation frames generated directly in iso screen space.
// Each frame is periodic over a PW × PH rectangle (a whole number of tiles, so it is also periodic on the
// iso tile lattice) and used as a world-anchored CanvasPattern: every water tile is one diamond fill.
// Shorelines: per land-neighbour configuration (8-bit mask) a small animated overlay (shallow tint, foam band,
// surf lines washing in) is baked lazily and drawn on top of each coastal water tile.
import type { GameMap } from '../types';
import { T } from '../world/map';
import { TW, TH } from './iso';
import { texturedTile, yieldToPage } from './art';

const RES = 2; // bake resolution multiplier (matches art.ts)
const FRAMES = 16; // open-water animation loop
const FPS = 7;
const PT = 5; // pattern period in tiles (5: 16 frames ≈ 13 MB; was 6 ≈ 19 MB, the period difference is not noticeable)
const PW = PT * TW, PH = PT * TH; // pattern period in iso px (zoom 1)
const SHORE_FRAMES = 16;
const SHORE_FPS = 6;

// ------------------------------------------------------------------ periodic gradient noise

function hash(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
const GX = new Float32Array(16), GY = new Float32Array(16);
for (let k = 0; k < 16; k++) { GX[k] = Math.cos((k / 16) * Math.PI * 2); GY[k] = Math.sin((k / 16) * Math.PI * 2); }
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Perlin noise, periodic with (px, py) lattice cells. Range ≈ [-0.7, 0.7]. */
function pnoise(x: number, y: number, px: number, py: number, s: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const x0 = mod(xi, px), x1 = mod(xi + 1, px), y0 = mod(yi, py), y1 = mod(yi + 1, py);
  const g = (ix: number, iy: number, dx: number, dy: number) => { const k = hash(ix, iy, s) & 15; return GX[k] * dx + GY[k] * dy; };
  const u = fade(xf), v = fade(yf);
  const a = g(x0, y0, xf, yf), b = g(x1, y0, xf - 1, yf), c = g(x0, y1, xf, yf - 1), d = g(x1, y1, xf - 1, yf - 1);
  return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
}
/** fBm of periodic noise; (px, py) = base lattice period, each octave doubles it (stays periodic). */
function fbm(x: number, y: number, px: number, py: number, oct: number, s: number): number {
  let sum = 0, amp = 1, norm = 0;
  for (let o = 0; o < oct; o++) { sum += pnoise(x, y, px, py, s + o * 17) * amp; norm += amp; amp *= 0.5; x *= 2; y *= 2; px *= 2; py *= 2; }
  return sum / norm;
}
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// ------------------------------------------------------------------ open water frames

// Palette (RA2-like deep blue-green with bright cyan glints).
const DEEP = [22, 66, 94], MID = [36, 100, 122], LIGHT = [96, 170, 184], GLINT = [215, 245, 245];

let frames: HTMLCanvasElement[] = [];
let patterns: (CanvasPattern | null)[] = [];
let baking: Promise<void> | null = null;

/** One noise layer sampled on the bake pixel grid (periodic over W × H), so frames can shift it instead of
 *  re-evaluating fBm per pixel per frame. */
function noiseGrid(W: number, H: number, cx: number, cy: number, oct: number, seed: number): Float32Array {
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) out[y * W + x] = fbm((x / W) * cx, (y / H) * cy, cx, cy, oct, seed);
  return out;
}
/** grid shifted by (ox, oy) px with bilinear interpolation and wrap-around: out(x, y) = grid(x + ox, y + oy). */
function shifted(grid: Float32Array, W: number, H: number, ox: number, oy: number, out: Float32Array): Float32Array {
  const ix = Math.floor(ox), iy = Math.floor(oy), fx = ox - ix, fy = oy - iy;
  const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
  for (let y = 0; y < H; y++) {
    const r0 = mod(y + iy, H) * W, r1 = mod(y + iy + 1, H) * W;
    for (let x = 0; x < W; x++) {
      const c0 = mod(x + ix, W), c1 = c0 + 1 === W ? 0 : c0 + 1;
      out[y * W + x] = grid[r0 + c0] * w00 + grid[r0 + c1] * w10 + grid[r1 + c0] * w01 + grid[r1 + c1] * w11;
    }
  }
  return out;
}

async function bakeFrames(): Promise<HTMLCanvasElement[]> {
  const frames: HTMLCanvasElement[] = [];
  const W = PW * RES, H = PH * RES, n = W * H;
  // static large-scale depth variation
  const depth = noiseGrid(W, H, 3, 3, 3, 11);
  // ripple lattice: cells ~ 32 × 12 iso px (horizontally stretched = flattened by the iso view)
  const cx = Math.round(PW / 32), cy = 2 * Math.round(PH / 24); // integer lattice periods; cy even so layer B (×1.5) stays periodic
  const rxA = 7 * RES, ryA = 3 * RES, rxB = 5 * RES, ryB = 2.5 * RES; // circular drift radii (px at RES)
  // The two ripple layers only drift between frames: sample each once, shift per frame (bilinear, sub-pixel).
  const gridA = noiseGrid(W, H, cx, cy, 2, 101), gridB = noiseGrid(W, H, cx * 1.5, cy * 1.5, 2, 202);
  const A = new Float32Array(n), B = new Float32Array(n);
  await yieldToPage();
  for (let f = 0; f < FRAMES; f++) {
    const th = (f / FRAMES) * Math.PI * 2;
    shifted(gridA, W, H, Math.cos(th) * rxA, Math.sin(th) * ryA, A);
    shifted(gridB, W, H, -Math.sin(th) * rxB, Math.cos(th) * ryB, B);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d')!;
    const img = g.createImageData(W, H), d = img.data;
    for (let i = 0; i < n; i++) {
      const a = A[i], b = B[i];
      // ridged interference -> thin wavy crests
      const ra = 1 - Math.abs(a) * 2.6, rb = 1 - Math.abs(b) * 2.6;
      const pa = Math.max(0, ra), pb = Math.max(0, rb), ra2 = pa * pa, rb2 = pb * pb, rab = Math.max(0, ra * rb); // (no **: slow here)
      const crest = ra2 * ra2 * 0.55 + rb2 * rb2 * 0.4 + rab * rab * 0.55;
      const base = smooth(-0.35, 0.35, depth[i] + (a + b) * 0.35);
      let r = mix(DEEP[0], MID[0], base), gg = mix(DEEP[1], MID[1], base), bb = mix(DEEP[2], MID[2], base);
      const hl = smooth(0.3, 0.9, crest) * 0.6;
      r = mix(r, LIGHT[0], hl); gg = mix(gg, LIGHT[1], hl); bb = mix(bb, LIGHT[2], hl);
      const gl = smooth(0.85, 1.1, crest) * 0.7;
      r = mix(r, GLINT[0], gl); gg = mix(gg, GLINT[1], gl); bb = mix(bb, GLINT[2], gl);
      const o = i * 4;
      d[o] = r; d[o + 1] = gg; d[o + 2] = bb; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    frames.push(c);
    await yieldToPage(); // keep the page responsive
  }
  return frames;
}

/** Load/bake water assets. Called from prepareArt; must not throw (log and fall back instead). */
export async function prepareWater(): Promise<void> {
  if (frames.length || baking) return baking ?? undefined;
  baking = (async () => {
    try {
      const t0 = performance.now();
      const f = await bakeFrames();
      if (import.meta.env.DEV) console.info(`[water] ${f.length} frames baked in ${Math.round(performance.now() - t0)} ms`);
      patterns = f.map(() => null);
      frames = f; // publish only when complete
    } catch (e) {
      console.warn('[water] bake failed, using procedural fallback:', e);
    }
  })();
  return baking;
}
function patternFor(g: CanvasRenderingContext2D, f: number): CanvasPattern | null {
  let p = patterns[f];
  if (!p) {
    p = g.createPattern(frames[f], 'repeat');
    if (!p) return null;
    p.setTransform(new DOMMatrix([1 / RES, 0, 0, 1 / RES, 0, 0]));
    patterns[f] = p;
  }
  return p;
}

/** Draw the base tile for a Water or Bridge tile at iso (ix, iy) (tile top corner). */
export function drawWaterTile(g: CanvasRenderingContext2D, _m: GameMap, _tx: number, _ty: number, ix: number, iy: number, time: number, e = 0.6): boolean {
  if (!frames.length) return false;
  const p = patternFor(g, ((Math.floor(time * FPS) % FRAMES) + FRAMES) % FRAMES);
  if (!p) return false;
  // pattern is in world (iso) coordinates -> seamless across tiles; slightly enlarged diamond (e) hides AA seams
  g.fillStyle = p;
  g.beginPath();
  g.moveTo(ix, iy - e); g.lineTo(ix + TW / 2 + e * 2, iy + TH / 2); g.lineTo(ix, iy + TH + e); g.lineTo(ix - TW / 2 - e * 2, iy + TH / 2);
  g.closePath();
  g.fill();
  return true;
}

// ------------------------------------------------------------------ shorelines
//
// The tile staircase is smoothed into a flowing coastline: for every coastal tile (water or land) a signed
// distance field sd (> 0 = water) is computed from its 3×3 land/water neighbourhood (box-blurred indicator).
//  - water tiles: where sd < 0 the neighbouring land texture is patched in (static, cached per tile)
//  - land tiles:  where sd > 0 animated water is painted in (masks composited with the water pattern in one layer)
//  - both:        animated foam / shallow tint / surf overlay, cached per neighbourhood config × frame
// Every tile only paints inside its own diamond, so overlays never double up.

// neighbour offsets in tile space: bit k of a config = land at NB[k]; bit 8 = the tile itself is land
const NB: [number, number][] = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const SELF = 1 << 8;
const SM = 0.0625; // canvas margin (tiles) for the anti-aliased diamond edge (keeps canvas sizes integral)
const SW = TW * (1 + 2 * SM), SH = TH * (1 + 2 * SM);
const CW = SW * RES, CH = SH * RES;
const BLUR = 0.9; // box-blur radius (tiles) that rounds the staircase; must be < 1 (3×3 neighbourhood suffices)
const BAKE_MS = 4; // per-frame time budget for lazy shore baking (tiles wait a few frames, no hitch)

const isWet = (t: number) => t === T.Water || t === T.Bridge;

/** Smoothed signed distance to the coast (tile units, > 0 = water side) at tile-local (u, v). */
function coastDist(cfg: number, u: number, v: number): number {
  let land = 0;
  for (let k = 0; k < 9; k++) {
    if (!(cfg & (1 << k))) continue;
    const dx = k < 8 ? NB[k][0] : 0, dy = k < 8 ? NB[k][1] : 0;
    const ox = Math.min(u + BLUR, dx + 1) - Math.max(u - BLUR, dx), oy = Math.min(v + BLUR, dy + 1) - Math.max(v - BLUR, dy);
    if (ox > 0 && oy > 0) land += ox * oy;
  }
  return (0.5 - land / (4 * BLUR * BLUR)) * 2 * BLUR;
}

interface Field { sd: Float32Array; nz: Float32Array; cov: Float32Array; minSd: number; maxSd: number }
const fields = new Map<number, Field>();
/** Per-pixel sd / noise / diamond coverage for a neighbourhood config (cov = 0 outside the own diamond). */
function field(cfg: number): Field {
  let f = fields.get(cfg);
  if (f) return f;
  const n = CW * CH, sd = new Float32Array(n), nz = new Float32Array(n), cov = new Float32Array(n);
  let minSd = 9, maxSd = -9;
  for (let y = 0; y < CH; y++)
    for (let x = 0; x < CW; x++) {
      // canvas px -> iso offset from the tile top corner -> tile-local (u, v)
      const px = (x + 0.5) / RES - SW / 2, py = (y + 0.5) / RES - SM * TH;
      const a = px / (TW / 2), b = py / (TH / 2);
      const u = (a + b) / 2, v = (b - a) / 2;
      const out = Math.max(-u, -v, u - 1, v - 1);
      if (out > 0.025) continue;
      const i = y * CW + x;
      cov[i] = out > 0 ? 1 - out / 0.025 : 1;
      // tile-periodic noise: breaks up the foam but stays continuous across tile borders
      nz[i] = fbm(u * 4, v * 4, 4, 4, 2, 303) + 0.5 * fbm(u * 4 + 7.3, v * 4 + 1.1, 4, 4, 1, 404);
      sd[i] = coastDist(cfg, u, v);
      if (sd[i] < minSd) minSd = sd[i];
      if (sd[i] > maxSd) maxSd = sd[i];
    }
  f = { sd, nz, cov, minSd, maxSd };
  fields.set(cfg, f);
  return f;
}

/** Alpha mask of one side of the coast inside the tile (water side if `wet`), or null if empty. */
const masks = new Map<number, HTMLCanvasElement | null>();
function sideMask(cfg: number, wet: boolean): HTMLCanvasElement | null {
  const key = cfg * 2 + (wet ? 1 : 0);
  if (masks.has(key)) return masks.get(key)!;
  const f = field(cfg);
  let c: HTMLCanvasElement | null = null;
  if (wet ? f.maxSd > -0.03 : f.minSd < 0.03) {
    c = document.createElement('canvas');
    c.width = CW; c.height = CH;
    const g = c.getContext('2d')!;
    const img = g.createImageData(CW, CH), d = img.data;
    for (let i = 0; i < CW * CH; i++) {
      if (!f.cov[i]) continue;
      const s = wet ? f.sd[i] + f.nz[i] * 0.04 : -(f.sd[i] + f.nz[i] * 0.04);
      d[i * 4 + 3] = smooth(-0.04, 0.02, s) * f.cov[i] * 255;
    }
    g.putImageData(img, 0, 0);
  }
  masks.set(key, c);
  return c;
}

/** Animated foam / shallow-water overlay frames for a neighbourhood config. */
const foams = new Map<number, HTMLCanvasElement[]>();
function bakeFoam(cfg: number): HTMLCanvasElement[] {
  const f = field(cfg), n = CW * CH;
  const res: HTMLCanvasElement[] = [];
  for (let fr = 0; fr < SHORE_FRAMES; fr++) {
    const ph = fr / SHORE_FRAMES;
    const c = document.createElement('canvas');
    c.width = CW; c.height = CH;
    const g = c.getContext('2d')!;
    const img = g.createImageData(CW, CH), d = img.data;
    for (let i = 0; i < n; i++) {
      if (!f.cov[i]) continue;
      const nz = f.nz[i], dd = f.sd[i] + nz * 0.07;
      if (dd > 0.9 || dd < -0.12) continue;
      // shallow turquoise tint
      const shallow = dd > 0 ? (1 - smooth(0, 0.8, dd)) * 0.5 : 0;
      // bright foam band on the waterline, broken up by noise; thin wet fringe on the land side
      const foam = Math.exp(-(((dd - 0.07) / 0.075) ** 2)) * (0.95 + nz * 1.0) + Math.exp(-(((dd - 0.24) / 0.05) ** 2)) * Math.max(0, nz * 1.6 + 0.1);
      // two surf lines washing in toward the shore
      let surf = 0;
      for (let k = 0; k < 2; k++) {
        const p = (ph + k * 0.5) % 1;
        const at = 0.8 - 0.68 * p;
        surf += Math.exp(-(((dd - at) / 0.045) ** 2)) * Math.sin(p * Math.PI) * 0.5 * (0.6 + nz * 1.4);
      }
      const wf = Math.min(1, Math.max(0, foam) + Math.max(0, surf));
      const aS = shallow * (1 - wf), aT = wf + aS;
      if (aT <= 0.004) continue;
      const o = i * 4;
      d[o] = (236 * wf + 70 * aS) / aT; d[o + 1] = (248 * wf + 175 * aS) / aT; d[o + 2] = (246 * wf + 170 * aS) / aT;
      d[o + 3] = Math.min(1, aT) * 255 * f.cov[i];
    }
    g.putImageData(img, 0, 0);
    res.push(c);
  }
  return res;
}

/** Static land patch for a water tile (land texture where the smoothed coast is on the land side). */
const patches = new Map<number, { key: number; c: HTMLCanvasElement | null }>();
function landPatch(m: GameMap, i: number, tx: number, ty: number, cfg: number): HTMLCanvasElement | null {
  // dominant neighbouring land type (edge neighbours count double)
  const cnt = [0, 0, 0, 0, 0, 0, 0];
  for (let k = 0; k < 8; k++) {
    if (!(cfg & (1 << k))) continue;
    let t = m.terrain[(ty + NB[k][1]) * m.w + tx + NB[k][0]];
    if (t === T.Tree) t = T.Grass;
    cnt[t] += NB[k][0] && NB[k][1] ? 1 : 2;
  }
  let lt = 0;
  for (let t = 1; t < 7; t++) if (cnt[t] > cnt[lt]) lt = t;
  const key = cfg * 8 + lt;
  const hit = patches.get(i);
  if (hit && hit.key === key) return hit.c;
  let c: HTMLCanvasElement | null = null;
  const mask = sideMask(cfg, false), tex = mask && texturedTile(lt, tx, ty);
  if (mask && tex) {
    c = document.createElement('canvas');
    c.width = CW; c.height = CH;
    const g = c.getContext('2d')!;
    // slightly enlarged so the patch edge has no anti-aliased gap (the texture is noise, 1 px drift is invisible)
    const e = 2;
    g.drawImage(tex, SM * TW * RES - e, SM * TH * RES - e / 2, TW * RES + 2 * e, TH * RES + e);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(mask, 0, 0);
  }
  patches.set(i, { key, c });
  return c;
}

function configAt(m: GameMap, tx: number, ty: number): number {
  const { w, h, terrain } = m;
  let cfg = isWet(terrain[ty * w + tx]) ? 0 : SELF;
  for (let k = 0; k < 8; k++) {
    const x = tx + NB[k][0], y = ty + NB[k][1];
    if (x < 0 || y < 0 || x >= w || y >= h) { if (cfg & SELF) cfg |= 1 << k; continue; } // off-map continues the tile itself
    if (!isWet(terrain[y * w + x])) cfg |= 1 << k;
  }
  return cfg;
}

let layer: HTMLCanvasElement | null = null;
const cfgCache = new WeakMap<Uint8Array, { cfg: Int16Array; seen: Uint32Array; stamp: number; rev: number }>();

/** Overlay pass after terrain blends (shorelines, foam). `tiles` = visible water/bridge tile indices. */
export function drawShores(g: CanvasRenderingContext2D, m: GameMap, tiles: number[], time: number): void {
  if (!frames.length) return;
  const { w, h, terrain } = m;
  const gf = Math.floor(time * SHORE_FPS);
  const t0 = performance.now();
  /** Shore art for this config is baked (or gets baked now if the frame budget allows). */
  const ready = (cfg: number) => {
    if (foams.has(cfg)) return true;
    if (performance.now() - t0 > BAKE_MS) return false;
    foams.set(cfg, bakeFoam(cfg));
    sideMask(cfg, true); sideMask(cfg, false);
    return true;
  };
  const coast: number[] = [], cfgs: number[] = [];
  // Neighbourhood configs are computed once per tile, again only after the terrain changed (m.rev: bridge destroyed/rebuilt).
  let cache = cfgCache.get(terrain);
  if (!cache || cache.rev !== (m.rev ?? 0)) { cache = { cfg: new Int16Array(w * h).fill(-1), seen: new Uint32Array(w * h), stamp: 0, rev: m.rev ?? 0 }; cfgCache.set(terrain, cache); }
  const cc = cache.cfg, seen = cache.seen, stamp = ++cache.stamp;
  const cfgOf = (j: number) => { let c = cc[j]; if (c < 0) c = cc[j] = configAt(m, j % w, (j / w) | 0); return c; };
  for (const i of tiles) {
    const cfg = cfgOf(i);
    if (!(cfg & 0xff) || !ready(cfg)) continue;
    coast.push(i); cfgs.push(cfg);
    const tx = i % w, ty = (i / w) | 0;
    for (let k = 0; k < 8; k++) {
      const x = tx + NB[k][0], y = ty + NB[k][1];
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const j = y * w + x;
      if (isWet(terrain[j]) || seen[j] === stamp) continue;
      seen[j] = stamp;
      const lc = cfgOf(j);
      if (ready(lc)) { coast.push(j); cfgs.push(lc); }
    }
  }
  const tl = (i: number) => { const tx = i % w, ty = (i / w) | 0; return [((tx - ty) * TW) / 2 - SW / 2, ((tx + ty) * TH) / 2 - SM * TH] as const; };

  // 1) land patches on water tiles
  for (let n = 0; n < coast.length; n++) {
    const cfg = cfgs[n];
    if (cfg & SELF) continue;
    const i = coast[n];
    // repaint the water base: the smoothed coast replaces the renderer's land feather bleeding over this tile
    drawWaterTile(g, m, i % w, (i / w) | 0, (((i % w) - ((i / w) | 0)) * TW) / 2, (((i % w) + ((i / w) | 0)) * TH) / 2, time, 0);
    const c = landPatch(m, i, i % w, (i / w) | 0, cfg);
    if (c) { const [x, y] = tl(i); g.drawImage(c, x, y, SW, SH); }
  }

  // 2) animated water on land tiles: gather masks in an offscreen layer, colour them with the water pattern
  const pat = patternFor(g, ((Math.floor(time * FPS) % FRAMES) + FRAMES) % FRAMES);
  if (pat) {
    const cv = g.canvas;
    if (!layer) layer = document.createElement('canvas');
    if (layer.width !== cv.width || layer.height !== cv.height) { layer.width = cv.width; layer.height = cv.height; }
    const lg = layer.getContext('2d')!;
    const tf = g.getTransform();
    // Only the screen rect covering this frame's masks is cleared, filled and composited (not the whole canvas).
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    for (let n = 0; n < coast.length; n++) {
      if (!(cfgs[n] & SELF) || !sideMask(cfgs[n], true)) continue;
      const [x, y] = tl(coast[n]);
      if (x < bx0) bx0 = x; if (y < by0) by0 = y; if (x + SW > bx1) bx1 = x + SW; if (y + SH > by1) by1 = y + SH;
    }
    // device-px rect (the view transform is scale + translate only)
    const rx0 = Math.max(0, Math.floor(tf.a * bx0 + tf.e) - 1), ry0 = Math.max(0, Math.floor(tf.d * by0 + tf.f) - 1);
    const rx1 = Math.min(cv.width, Math.ceil(tf.a * bx1 + tf.e) + 1), ry1 = Math.min(cv.height, Math.ceil(tf.d * by1 + tf.f) + 1);
    if (rx1 > rx0 && ry1 > ry0) {
      lg.setTransform(1, 0, 0, 1, 0, 0);
      lg.globalCompositeOperation = 'source-over';
      lg.clearRect(rx0, ry0, rx1 - rx0, ry1 - ry0);
      lg.setTransform(tf);
      for (let n = 0; n < coast.length; n++) {
        if (!(cfgs[n] & SELF)) continue;
        const mk = sideMask(cfgs[n], true);
        if (!mk) continue;
        const [x, y] = tl(coast[n]);
        lg.drawImage(mk, x, y, SW, SH);
      }
      lg.globalCompositeOperation = 'source-in';
      lg.fillStyle = pat;
      lg.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(layer, rx0, ry0, rx1 - rx0, ry1 - ry0, rx0, ry0, rx1 - rx0, ry1 - ry0);
      g.restore();
    }
  }

  // 3) foam / shallow overlay on both sides of the coast
  for (let n = 0; n < coast.length; n++) {
    const cfg = cfgs[n];
    const set = foams.get(cfg)!;
    const i = coast[n], tx = i % w, ty = (i / w) | 0;
    // world-varying phase offset so surf travels along the coast instead of pulsing in sync
    const f = (((gf + ((tx * 3 + ty * 5) >> 1)) % SHORE_FRAMES) + SHORE_FRAMES) % SHORE_FRAMES;
    const [x, y] = tl(i);
    g.drawImage(set[f], x, y, SW, SH);
  }
}
