// AssetManager: every visual is resolved from a stable asset ID (see data/*.ts `sprite` fields and
// docs/asset-register.md). All current art is procedural, project-made placeholder art drawn to
// cached canvases. Replacing an ID with bitmap art only touches this file — never gameplay code.
import { BUILDINGS } from '../data/buildings';
import { FACTIONS } from '../data/factions';
import { UNITS } from '../data/units';
import type { FactionId } from '../types';
import { artError, artId, artReady, bakedIcon, BUILDING_ART as BAKED_BUILDINGS, UNIT_ART as BAKED_UNITS } from './art';
import { TH, TW } from './iso';

const RES = 2; // pre-render resolution multiplier (crisp at zoom 2 / hi-dpi)
type G = CanvasRenderingContext2D;

function makeCanvas(w: number, h: number): [HTMLCanvasElement, G] {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * RES);
  c.height = Math.ceil(h * RES);
  const g = c.getContext('2d')!;
  g.scale(RES, RES);
  return [c, g];
}

export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f)));
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

function rand(seed: number) {
  let t = seed | 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const warned = new Set<string>();
function missing(id: string) {
  if (!warned.has(id)) { warned.add(id); console.warn(`[assets] missing asset "${id}", using placeholder`); }
}
/** Baked 3D art exists for this sprite (it may still be baking — then the neutral stand-in below is shown). */
const hasBakedArt = (sprite: string, faction: FactionId) => !!(BAKED_UNITS[sprite] || artId(BAKED_BUILDINGS, sprite, faction));

// ---------------------------------------------------------------- terrain

const TERRAIN_BASE = ['#587f3a', '#c7a86d', '#2d6089', '#72705f', '#6d6356', '#587f3a', '#2d6089'];
export { TERRAIN_MINIMAP } from '../world/map';
const diamond = (g: G) => {
  g.beginPath();
  g.moveTo(TW / 2, 0); g.lineTo(TW, TH / 2); g.lineTo(TW / 2, TH); g.lineTo(0, TH / 2);
  g.closePath();
};
const inDiamond = (x: number, y: number) => Math.abs(x - TW / 2) / (TW / 2) + Math.abs(y - TH / 2) / (TH / 2) <= 0.95;

const tileCache = new Map<number, HTMLCanvasElement>();
/** Terrain tile `t`, variant 0..3 (water variants double as animation frames). */
export function tile(t: number, v: number): HTMLCanvasElement {
  const key = t * 8 + v;
  let c = tileCache.get(key);
  if (c) return c;
  const [cv, g] = makeCanvas(TW, TH);
  c = cv;
  const r = rand(t * 131 + v * 17 + 3);
  const base = TERRAIN_BASE[t] ?? '#ff00ff';
  diamond(g);
  g.fillStyle = base;
  g.fill();
  g.save();
  diamond(g);
  g.clip();
  const speck = (n: number, lo: number, hi: number, sz: number) => {
    for (let k = 0; k < n; k++) {
      const x = r() * TW, y = r() * TH;
      if (!inDiamond(x, y)) continue;
      g.fillStyle = shade(base, lo + r() * (hi - lo));
      g.fillRect(x, y, sz, sz * 0.7);
    }
  };
  if (t === 2 || t === 6) {
    // water: soft bands + wave glints, shifted per frame
    for (let k = 0; k < 6; k++) {
      g.strokeStyle = `rgba(160,210,240,${0.12 + r() * 0.12})`;
      g.lineWidth = 1;
      const y = ((k * 6 + v * 1.5) % TH) + 1, x = r() * TW * 0.6;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 5, y - 2, x + 10, y); g.stroke();
    }
  } else if (t === 4) {
    speck(90, 0.75, 1.2, 1.2);
    g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(10, TH / 2 - 4); g.lineTo(TW - 10, TH / 2 - 4); g.moveTo(10, TH / 2 + 4); g.lineTo(TW - 10, TH / 2 + 4); g.stroke();
  } else {
    speck(t === 0 || t === 5 ? 110 : 80, 0.78, 1.18, 1.6);
    if (t === 0 || t === 5) {
      g.strokeStyle = shade(base, 0.7); g.lineWidth = 1;
      for (let k = 0; k < 7; k++) {
        const x = r() * TW, y = r() * TH;
        if (!inDiamond(x, y)) continue;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1, y - 3); g.moveTo(x + 1, y); g.lineTo(x + 2, y - 3); g.stroke();
      }
    }
  }
  if (t === 6) {
    // bridge deck
    g.fillStyle = '#7a5a36';
    g.beginPath(); g.moveTo(TW / 2, 3); g.lineTo(TW - 6, TH / 2); g.lineTo(TW / 2, TH - 3); g.lineTo(6, TH / 2); g.closePath(); g.fill();
    g.strokeStyle = '#4d3820'; g.lineWidth = 1;
    for (let k = 1; k < 7; k++) { const f = k / 7; g.beginPath(); g.moveTo(6 + f * (TW / 2 - 6), TH / 2 - f * (TH / 2 - 3)); g.lineTo(TW / 2 + f * (TW / 2 - 6), TH - 3 - f * (TH / 2 - 3)); g.stroke(); }
  }
  g.restore();
  // top-left rim light for a little relief
  g.strokeStyle = 'rgba(255,255,255,0.05)';
  g.beginPath(); g.moveTo(0, TH / 2); g.lineTo(TW / 2, 0); g.lineTo(TW, TH / 2); g.stroke();
  tileCache.set(key, c);
  return c;
}

const oreCache = new Map<number, HTMLCanvasElement>();
/** Ore/gem crystals overlay for a tile. level 1..3. Anchor: tile top corner, 8px headroom. */
export function oreSprite(level: number, gem: boolean, v: number): HTMLCanvasElement {
  const key = level * 100 + (gem ? 50 : 0) + v;
  let c = oreCache.get(key);
  if (c) return c;
  const [cv, g] = makeCanvas(TW, TH + 8);
  c = cv;
  const r = rand(key * 7 + 1);
  const cols = gem ? ['#56d8e8', '#a76bff', '#e7f9ff'] : ['#e2b43c', '#b8862a', '#fff0a8'];
  const n = level * 5 + 2;
  for (let k = 0; k < n; k++) {
    let x = 0, y = 0;
    do { x = 8 + r() * (TW - 16); y = 4 + r() * (TH - 8); } while (!inDiamond(x, y));
    const h = 3 + r() * (gem ? 6 : 4), w = 2 + r() * 2;
    y += 8;
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath(); g.ellipse(x, y + 1, w + 1, 1.5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = cols[k % 2];
    g.beginPath(); g.moveTo(x - w, y); g.lineTo(x, y - h); g.lineTo(x + w, y); g.lineTo(x, y + 1.5); g.closePath(); g.fill();
    g.fillStyle = cols[2];
    g.fillRect(x - 0.5, y - h + 1.5, 1, h * 0.4);
  }
  oreCache.set(key, c);
  return c;
}

const propCache = new Map<string, HTMLCanvasElement>();
/** Tree / rock props. Anchor: (24, 52) in a 48×60 canvas = tile centre. */
export const PROP_ANCHOR: [number, number] = [24, 52];
export function prop(kind: 'tree' | 'rock', v: number): HTMLCanvasElement {
  const key = kind + v;
  let c = propCache.get(key);
  if (c) return c;
  const [cv, g] = makeCanvas(48, 60);
  c = cv;
  const r = rand(v * 97 + (kind === 'tree' ? 5 : 9));
  const [ax, ay] = PROP_ANCHOR;
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.beginPath(); g.ellipse(ax + 3, ay, 17, 8, 0, 0, Math.PI * 2); g.fill();
  if (kind === 'tree') {
    g.fillStyle = '#4a3322'; g.fillRect(ax - 2, ay - 16, 4, 16);
    const greens = ['#2f5a24', '#3b6d2a', '#4b8234'];
    const blobs = [[0, -24, 13], [-7, -30, 9], [6, -31, 9], [0, -38, 8]];
    for (let k = 0; k < blobs.length; k++) {
      const [bx, by, br] = blobs[k];
      const jx = (r() - 0.5) * 4, jy = (r() - 0.5) * 3;
      g.fillStyle = '#1f3d18';
      g.beginPath(); g.arc(ax + bx + jx, ay + by + jy + 1, br + 1, 0, Math.PI * 2); g.fill();
      g.fillStyle = greens[k % 3];
      g.beginPath(); g.arc(ax + bx + jx, ay + by + jy, br, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(190,230,120,0.18)';
      g.beginPath(); g.arc(ax + bx + jx - br * 0.35, ay + by + jy - br * 0.35, br * 0.45, 0, Math.PI * 2); g.fill();
    }
  } else {
    for (let k = 0; k < 3; k++) {
      const bx = ax + (k - 1) * 9 + (r() - 0.5) * 4, by = ay - 2 - (k === 1 ? 4 : 0);
      const w = 9 + r() * 5, h = 10 + r() * 10;
      g.fillStyle = '#5c5a52';
      g.beginPath(); g.moveTo(bx - w, by); g.lineTo(bx - w * 0.6, by - h); g.lineTo(bx + w * 0.3, by - h - 3); g.lineTo(bx + w, by - 2); g.lineTo(bx + w * 0.4, by + 3); g.closePath(); g.fill();
      g.fillStyle = '#8a877c';
      g.beginPath(); g.moveTo(bx - w * 0.6, by - h); g.lineTo(bx + w * 0.3, by - h - 3); g.lineTo(bx + w * 0.1, by - h * 0.4); g.lineTo(bx - w * 0.7, by - h * 0.3); g.closePath(); g.fill();
    }
  }
  propCache.set(key, c);
  return c;
}

// ---------------------------------------------------------------- buildings

interface BCtx { g: G; ox: number; oy: number; body: string; roof: string; accent: string; team: string; glow: string }
const P = (b: BCtx, lx: number, ly: number, z = 0): [number, number] => [b.ox + ((lx - ly) * TW) / 2, b.oy + ((lx + ly) * TH) / 2 - z];

function poly(g: G, pts: [number, number][], fill: string, stroke = 'rgba(0,0,0,0.35)') {
  g.beginPath();
  pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fillStyle = fill; g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = 0.75; g.stroke(); }
}

function prism(b: BCtx, x0: number, y0: number, w: number, h: number, z0: number, H: number, color: string) {
  const A = (z: number) => P(b, x0, y0, z), B = (z: number) => P(b, x0 + w, y0, z), C = (z: number) => P(b, x0 + w, y0 + h, z), D = (z: number) => P(b, x0, y0 + h, z);
  poly(b.g, [D(z0), C(z0), C(z0 + H), D(z0 + H)], shade(color, 0.86));
  poly(b.g, [C(z0), B(z0), B(z0 + H), C(z0 + H)], shade(color, 0.66));
  poly(b.g, [A(z0 + H), B(z0 + H), C(z0 + H), D(z0 + H)], shade(color, 1.12));
}

/** Quad on the front-left (y = y0+h) or front-right (x = x0+w) face of a prism. */
function face(b: BCtx, side: 'L' | 'R', fixed: number, a0: number, a1: number, z0: number, z1: number, color: string, stroke = '') {
  const pt = (a: number, z: number) => (side === 'L' ? P(b, a, fixed, z) : P(b, fixed, a, z));
  poly(b.g, [pt(a0, z0), pt(a1, z0), pt(a1, z1), pt(a0, z1)], color, stroke);
}

function cyl(b: BCtx, lx: number, ly: number, r: number, z0: number, H: number, color: string, top?: string) {
  const [cx, cy] = P(b, lx, ly, z0);
  const g = b.g;
  const grad = g.createLinearGradient(cx - r, 0, cx + r, 0);
  grad.addColorStop(0, shade(color, 1.1)); grad.addColorStop(0.5, color); grad.addColorStop(1, shade(color, 0.6));
  g.fillStyle = grad;
  g.beginPath(); g.ellipse(cx, cy, r, r / 2, 0, 0, Math.PI); g.lineTo(cx - r, cy - H); g.ellipse(cx, cy - H, r, r / 2, 0, Math.PI, 0, true); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.75; g.stroke();
  g.fillStyle = top ?? shade(color, 1.2);
  g.beginPath(); g.ellipse(cx, cy - H, r, r / 2, 0, 0, Math.PI * 2); g.fill(); g.stroke();
}

function windows(b: BCtx, side: 'L' | 'R', fixed: number, a0: number, a1: number, z: number, n: number) {
  const step = (a1 - a0) / n;
  for (let k = 0; k < n; k++) face(b, side, fixed, a0 + step * (k + 0.25), a0 + step * (k + 0.75), z, z + 4, 'rgba(30,40,55,0.85)');
}

const BUILDING_ART: Record<string, (b: BCtx) => void> = {
  'building.cy': (b) => {
    prism(b, 0.15, 0.15, 2.7, 2.7, 0, 24, b.body);
    face(b, 'L', 2.85, 0.15, 2.85, 17, 21, b.team);
    face(b, 'R', 2.85, 0.15, 2.85, 17, 21, b.team);
    windows(b, 'L', 2.85, 0.3, 2.7, 8, 5);
    prism(b, 0.8, 0.8, 1.4, 1.4, 24, 16, b.roof);
    windows(b, 'L', 2.2, 0.9, 2.1, 30, 3);
    windows(b, 'R', 2.2, 0.9, 2.1, 30, 3);
    const g = b.g;
    const [mx, my] = P(b, 0.45, 0.45, 24), [tx, ty] = P(b, 0.45, 0.45, 70), [jx, jy] = P(b, 1.9, 0.45, 70);
    g.strokeStyle = b.accent; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(mx, my); g.lineTo(tx, ty); g.lineTo(jx, jy); g.stroke();
    g.strokeStyle = 'rgba(40,40,40,0.8)'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(jx, jy); g.lineTo(jx, jy + 18); g.stroke();
    g.fillStyle = b.team; g.fillRect(tx - 2, ty - 3, 4, 4);
    const [dx, dy] = P(b, 1.5, 1.5, 40);
    g.fillStyle = shade(b.roof, 1.3);
    g.beginPath(); g.ellipse(dx, dy - 2, 7, 4, 0, Math.PI, 0); g.fill();
  },
  'building.power': (b) => {
    prism(b, 0.12, 0.12, 1.76, 1.76, 0, 12, b.body);
    face(b, 'L', 1.88, 0.12, 1.88, 3, 6, b.team);
    cyl(b, 0.62, 0.62, 8, 12, 30, b.roof, b.glow);
    cyl(b, 1.38, 1.38, 8, 12, 30, b.roof, b.glow);
    const g = b.g;
    for (const [lx, ly] of [[0.62, 0.62], [1.38, 1.38]]) {
      const [cx, cy] = P(b, lx, ly, 42);
      const grad = g.createRadialGradient(cx, cy, 1, cx, cy, 12);
      grad.addColorStop(0, b.glow); grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad; g.beginPath(); g.ellipse(cx, cy, 12, 7, 0, 0, Math.PI * 2); g.fill();
    }
  },
  'building.refinery': (b) => {
    // loading pad on the front row
    const g = b.g;
    poly(g, [P(b, 0.4, 2.1, 1), P(b, 2.6, 2.1, 1), P(b, 2.6, 2.95, 1), P(b, 0.4, 2.95, 1)], '#4a4a44');
    for (let k = 0; k < 5; k++) poly(g, [P(b, 0.5 + k * 0.44, 2.85, 1), P(b, 0.72 + k * 0.44, 2.85, 1), P(b, 0.62 + k * 0.44, 2.95, 1), P(b, 0.4 + k * 0.44, 2.95, 1)], '#d9b23a', '');
    prism(b, 0.15, 0.15, 2.2, 1.9, 0, 22, b.body);
    face(b, 'L', 2.05, 0.15, 2.35, 15, 19, b.team);
    windows(b, 'R', 2.35, 0.3, 1.9, 8, 3);
    prism(b, 1.2, 1.55, 0.9, 0.55, 0, 10, b.accent); // intake ramp
    cyl(b, 2.55, 0.75, 11, 0, 40, b.roof);
    cyl(b, 2.55, 0.75, 11.2, 26, 4, b.team);
  },
  'building.barracks': (b) => {
    prism(b, 0.2, 0.2, 1.6, 1.6, 0, 14, b.body);
    prism(b, 0.2, 0.75, 1.6, 0.5, 14, 6, b.roof);
    face(b, 'L', 1.8, 0.7, 1.3, 0, 9, 'rgba(25,25,25,0.9)');
    windows(b, 'R', 1.8, 0.3, 1.7, 7, 3);
    const g = b.g;
    const [px, py] = P(b, 0.35, 0.35, 14);
    g.strokeStyle = '#333'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 30); g.stroke();
    g.fillStyle = b.team;
    g.beginPath(); g.moveTo(px, py - 30); g.lineTo(px + 13, py - 26); g.lineTo(px, py - 21); g.closePath(); g.fill();
  },
  'building.factory': (b) => {
    prism(b, 0.1, 0.1, 2.8, 2.8, 0, 28, b.body);
    face(b, 'L', 2.9, 0.75, 2.25, 0, 20, '#262626');
    for (let z = 3; z < 20; z += 3.5) face(b, 'L', 2.9, 0.75, 2.25, z, z + 0.8, 'rgba(120,120,120,0.5)');
    face(b, 'L', 2.9, 0.75, 2.25, 20, 23, b.team);
    face(b, 'R', 2.9, 0.1, 2.9, 22, 25, b.team);
    prism(b, 0.4, 0.4, 2.0, 1.2, 28, 6, b.roof);
    cyl(b, 2.4, 0.5, 5, 28, 16, b.accent);
  },
  'building.navalyard': (b) => {
    // pontoon piers in a U around an open slip (water shows through), gantry crane over it
    const pier = '#8f8b82', H = 4;
    prism(b, 0.08, 0.1, 2.84, 0.6, 0, H, pier);
    prism(b, 0.1, 0.7, 0.56, 2.2, 0, H, pier);
    prism(b, 2.34, 0.7, 0.56, 2.2, 0, H, pier);
    face(b, 'R', 0.66, 0.7, 2.9, H - 1.5, H, b.team);
    face(b, 'L', 2.9, 0.1, 0.66, H - 1.5, H, b.team);
    face(b, 'L', 2.9, 2.34, 2.9, H - 1.5, H, b.team);
    prism(b, 0.2, 0.2, 0.6, 0.45, H, 14, b.body);
    prism(b, 0.2, 0.2, 0.6, 0.45, H + 14, 2, b.team);
    const g = b.g;
    for (const x of [0.38, 2.62]) {
      const [lx, ly] = P(b, x, 1.6, H), [tx, ty] = P(b, x, 1.6, 44);
      g.strokeStyle = '#d8a62a'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(lx, ly); g.lineTo(tx, ty); g.stroke();
    }
    const [ax, ay] = P(b, 0.38, 1.6, 44), [bx, by] = P(b, 2.62, 1.6, 44);
    g.strokeStyle = b.team; g.lineWidth = 3.5;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
  },
  'building.tower': (b) => {
    prism(b, 0.1, 0.1, 0.8, 0.8, 0, 8, b.accent);
    cyl(b, 0.5, 0.5, 9, 8, 24, b.body);
    cyl(b, 0.5, 0.5, 9.3, 20, 4, b.team);
    prism(b, 0.32, 0.32, 0.36, 0.36, 32, 8, b.roof);
  },
};

const GLOW: Record<FactionId, string> = { allies: '#bfefff', soviets: '#8fe0ff', psi: '#b7ff8a' };

export interface BuildingSprite { c: HTMLCanvasElement; ox: number; oy: number; w: number; h: number }
const bCache = new Map<string, BuildingSprite>();
export const BUILDING_HEADROOM = 76;

/** Pre-rendered building. Draw at iso(e.x, e.y) − (ox, oy). */
export function buildingSprite(def: string, faction: FactionId, team: string): BuildingSprite {
  const key = `${def}|${faction}|${team}`;
  let s = bCache.get(key);
  if (s) return s;
  const d = BUILDINGS[def];
  const w = ((d.w + d.h) * TW) / 2, h = ((d.w + d.h) * TH) / 2 + BUILDING_HEADROOM;
  const [c, g] = makeCanvas(w, h);
  const st = FACTIONS[faction].style;
  const b: BCtx = { g, ox: (d.h * TW) / 2, oy: BUILDING_HEADROOM, body: st.body, roof: st.roof, accent: st.accent, team, glow: GLOW[faction] };
  // footprint shadow (not under the shipyard: it floats on open water)
  if (d.sprite !== 'building.navalyard') poly(g, [P(b, 0, 0), P(b, d.w, 0), P(b, d.w + 0.4, d.h), P(b, 0, d.h)], 'rgba(0,0,0,0.25)', '');
  const art = BUILDING_ART[d.sprite];
  if (art) art(b);
  else {
    // Neutral stand-in (bake pending, or no art): low faction-coloured block with a team stripe and a roof slab.
    if (!hasBakedArt(d.sprite, faction)) missing(d.sprite);
    const H = 8 + Math.min(d.w, d.h) * 4, m = 0.12, x1 = d.w - m, y1 = d.h - m;
    prism(b, m, m, d.w - 2 * m, d.h - 2 * m, 0, H, b.body);
    face(b, 'L', y1, m, x1, H * 0.55, H * 0.8, b.team);
    face(b, 'R', x1, m, y1, H * 0.55, H * 0.8, b.team);
    if (d.w > 1 || d.h > 1) prism(b, 0.35, 0.35, d.w - 0.7, d.h - 0.7, H, 5, b.roof);
  }
  s = { c, ox: b.ox, oy: b.oy, w, h };
  bCache.set(key, s);
  return s;
}

// ---------------------------------------------------------------- units (drawn live: they rotate)

/** Project a local oriented-rect corner set around a unit. θ in tile space. */
function obb(sx: number, sy: number, th: number, cx: number, cy: number, L: number, W: number, z: number): [number, number][] {
  const c = Math.cos(th), s = Math.sin(th);
  return ([[L / 2, W / 2], [L / 2, -W / 2], [-L / 2, -W / 2], [-L / 2, W / 2]] as [number, number][]).map(([a, b]) => {
    const dx = (cx + a) * c - (cy + b) * s, dy = (cx + a) * s + (cy + b) * c;
    return [sx + ((dx - dy) * TW) / 2, sy + ((dx + dy) * TH) / 2 - z];
  });
}
const dirPt = (sx: number, sy: number, th: number, len: number, z: number, side = 0): [number, number] => {
  const dx = Math.cos(th) * len - Math.sin(th) * side, dy = Math.sin(th) * len + Math.cos(th) * side;
  return [sx + ((dx - dy) * TW) / 2, sy + ((dx + dy) * TH) / 2 - z];
};

export interface UnitLook { facing: number; turret: number; team: string; faction: FactionId; cargo: number; moving: boolean; time: number; id: number }

type UnitArt = (g: G, x: number, y: number, u: UnitLook) => void;

function tracks(g: G, x: number, y: number, th: number, L: number, W: number) {
  g.fillStyle = 'rgba(0,0,0,0.3)';
  g.beginPath(); g.ellipse(x + 2, y + 2, (L + W) * 17, (L + W) * 9, 0, 0, Math.PI * 2); g.fill();
  poly(g, obb(x, y, th, 0, 0, L, W, 0), '#262626');
  poly(g, obb(x, y, th, 0, 0, L, W, 3), '#3b3b3b');
}

function barrel(g: G, x: number, y: number, th: number, len: number, z: number, side = 0, width = 2.6) {
  const [ax, ay] = dirPt(x, y, th, 0.05, z, side), [bx, by] = dirPt(x, y, th, len, z, side);
  g.strokeStyle = '#1d1d1d'; g.lineWidth = width + 1.2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
  g.strokeStyle = '#5a5a5a'; g.lineWidth = width;
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
}

const UNIT_ART: Record<string, UnitArt> = {
  'unit.tank.allies': (g, x, y, u) => {
    const st = FACTIONS[u.faction].style;
    tracks(g, x, y, u.facing, 0.74, 0.54);
    poly(g, obb(x, y, u.facing, 0, 0, 0.66, 0.42, 5), shade(st.body, 0.8));
    poly(g, obb(x, y, u.facing, 0.02, 0, 0.6, 0.38, 8), st.body);
    barrel(g, x, y, u.turret, 0.52, 12);
    poly(g, obb(x, y, u.turret, -0.03, 0, 0.3, 0.26, 12), u.team);
    poly(g, obb(x, y, u.turret, -0.03, 0, 0.24, 0.2, 15), shade(u.team, 1.25));
  },
  'unit.tank.soviets': (g, x, y, u) => {
    const st = FACTIONS[u.faction].style;
    tracks(g, x, y, u.facing, 0.82, 0.6);
    poly(g, obb(x, y, u.facing, 0, 0, 0.74, 0.5, 5), shade(st.body, 0.75));
    poly(g, obb(x, y, u.facing, 0, 0, 0.66, 0.44, 9), st.body);
    barrel(g, x, y, u.turret, 0.55, 13, 0.06, 2.4);
    barrel(g, x, y, u.turret, 0.55, 13, -0.06, 2.4);
    poly(g, obb(x, y, u.turret, -0.05, 0, 0.36, 0.32, 13), u.team);
    poly(g, obb(x, y, u.turret, -0.05, 0, 0.28, 0.24, 17), shade(u.team, 1.2));
  },
  'unit.tank.psi': (g, x, y, u) => {
    const st = FACTIONS[u.faction].style;
    tracks(g, x, y, u.facing, 0.72, 0.52);
    poly(g, obb(x, y, u.facing, 0, 0, 0.66, 0.44, 5), shade(st.body, 0.8));
    poly(g, obb(x, y, u.facing, 0, 0, 0.58, 0.36, 8), st.body);
    barrel(g, x, y, u.turret, 0.36, 12, 0, 3.5);
    const [cx, cy] = dirPt(x, y, u.turret, -0.04, 13);
    g.fillStyle = u.team; g.beginPath(); g.ellipse(cx, cy, 8, 5, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.stroke();
    const pulse = 0.6 + 0.4 * Math.sin(u.time * 5 + u.id);
    g.fillStyle = `rgba(210,130,255,${pulse})`;
    g.beginPath(); g.arc(cx, cy - 3, 3.2, 0, Math.PI * 2); g.fill();
  },
  'unit.miner': (g, x, y, u) => {
    const st = FACTIONS[u.faction].style;
    tracks(g, x, y, u.facing, 0.92, 0.66);
    poly(g, obb(x, y, u.facing, 0, 0, 0.86, 0.56, 5), shade(st.body, 0.8));
    poly(g, obb(x, y, u.facing, 0.28, 0, 0.26, 0.5, 9), u.team); // cab
    poly(g, obb(x, y, u.facing, 0.28, 0, 0.2, 0.42, 14), shade(u.team, 1.2));
    poly(g, obb(x, y, u.facing, -0.14, 0, 0.5, 0.54, 12), shade(st.accent, 1.2)); // bin
    if (u.cargo > 0) poly(g, obb(x, y, u.facing, -0.14, 0, 0.42, 0.44, 12 + Math.min(1, u.cargo / 700) * 3), '#d9aa35');
  },
  'unit.infantry': (g, x, y, u) => {
    const step = u.moving ? Math.sin(u.time * 14 + u.id) * 2 : 0;
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath(); g.ellipse(x, y + 1, 5, 2.5, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#2b2b24'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(x - 1.5, y - 6); g.lineTo(x - 1.5 + step * 0.6, y); g.moveTo(x + 1.5, y - 6); g.lineTo(x + 1.5 - step * 0.6, y); g.stroke();
    g.fillStyle = shade(u.team, 0.85); g.fillRect(x - 3, y - 13, 6, 7.5);
    g.fillStyle = '#d9b089'; g.beginPath(); g.arc(x, y - 15.5, 2.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = shade(u.team, 0.6); g.beginPath(); g.arc(x, y - 16.2, 2.5, Math.PI, 0); g.fill();
    const [gx, gy] = dirPt(x, y, u.turret, 0.28, 10);
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x, y - 10); g.lineTo(gx, gy); g.stroke();
  },
};

let infantrySprites: Set<string> | null = null;
/** Neutral stand-in for a unit without procedural art (bake pending, or no art): soldier or small team-striped hull. */
function standIn(g: G, sprite: string, x: number, y: number, u: UnitLook) {
  infantrySprites ??= new Set(Object.values(UNITS).filter((d) => d.category === 'infantry').map((d) => d.sprite));
  if (infantrySprites.has(sprite)) { UNIT_ART['unit.infantry'](g, x, y, u); return; }
  const st = FACTIONS[u.faction].style;
  const ship = BAKED_UNITS[sprite];
  if (ship?.sea) {
    // ship: foam ring on the water (no ground shadow / tracks), pointed hull, team-coloured superstructure
    const L = Math.min(2, ship.frame / 70), W = L * 0.24, th = u.facing;
    g.strokeStyle = 'rgba(236,246,252,0.45)'; g.lineWidth = 2;
    g.beginPath(); g.ellipse(x, y, L * 20 + 4, L * 10 + 2, 0, 0, Math.PI * 2); g.stroke();
    poly(g, [dirPt(x, y, th, L / 2, 3), dirPt(x, y, th, L / 5, 3, W / 2), dirPt(x, y, th, -L / 2, 3, W * 0.4), dirPt(x, y, th, -L / 2, 3, -W * 0.4), dirPt(x, y, th, L / 5, 3, -W / 2)], st.body);
    poly(g, obb(x, y, th, -L * 0.1, 0, L * 0.3, W * 0.55, 7), u.team);
    return;
  }
  tracks(g, x, y, u.facing, 0.66, 0.48);
  poly(g, obb(x, y, u.facing, 0, 0, 0.58, 0.4, 6), st.body);
  poly(g, obb(x, y, u.facing, -0.05, 0, 0.26, 0.24, 10), u.team);
}

export function drawUnit(g: G, sprite: string, x: number, y: number, u: UnitLook) {
  const art = UNIT_ART[sprite];
  if (art) { art(g, x, y, u); return; }
  if (!hasBakedArt(sprite, u.faction)) missing(sprite);
  standIn(g, sprite, x, y, u);
}

// ---------------------------------------------------------------- sidebar icons

const iconCache = new Map<string, string>();
export function icon(def: string, faction: FactionId, team: string): string {
  const key = `${def}|${faction}|${team}`;
  let url = iconCache.get(key);
  if (url) return url;
  const W = 64, H = 48;
  const c = document.createElement('canvas');
  c.width = W * 2; c.height = H * 2;
  const g = c.getContext('2d')!;
  g.scale(2, 2);
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#2c3238'); grad.addColorStop(1, '#15191c');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  const sprite = (BUILDINGS[def] ?? UNITS[def]).sprite;
  const baked = bakedIcon(def, sprite, faction, team, W, H, g);
  if (baked) { /* baked 3D art */ }
  else if (BUILDINGS[def]) {
    const s = buildingSprite(def, faction, team);
    const k = Math.min((W - 4) / s.w, (H - 4) / s.h);
    g.drawImage(s.c, (W - s.w * k) / 2, (H - s.h * k) / 2, s.w * k, s.h * k);
  } else {
    // Procedural cameo, or (bake pending) a neutral grey silhouette — scaled to fit the 64×48 frame (infantry
    // figure spans ~y −19…+4 px, a hull ~±22 px wide at k = 1).
    const d = UNITS[def], inf = d.category === 'infantry', pending = !UNIT_ART[d.sprite];
    const k = inf ? 1.6 : 1.1;
    g.save(); g.translate(W / 2, inf ? H * 0.86 : H * 0.62); g.scale(k, k);
    if (pending) g.globalAlpha = 0.75;
    drawUnit(g, d.sprite, 0, 0, { facing: Math.PI * 0.2, turret: Math.PI * 0.2, team: pending ? '#6c737a' : team, faction, cargo: 0, moving: false, time: 0, id: 1 });
    g.restore();
  }
  url = c.toDataURL();
  // Only keep final icons: the baked one, or the procedural one when no bake is coming. A stand-in shown while a bake
  // is pending is redrawn on the next call, so the baked cameo replaces it once ready.
  if (baked || artError || (artReady && !hasBakedArt(sprite, faction))) iconCache.set(key, url);
  return url;
}
