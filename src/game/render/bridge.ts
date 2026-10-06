// Bridge art (owned by the bridge pass). Returns false to fall back to the procedural deck in assets.ts.
//
// Every connected group of Bridge tiles is split into straight spans (greedy road-width bands,
// refined to the road's direction) and built procedurally in three.js, then rendered once per map
// through the same 2:1 dimetric camera/light rig as art.ts into one cached sprite per group:
// asphalt deck with dashed centre line, kerbed sidewalks, steel railings, concrete fascia beams with
// cornice and drip ledge, end posts, and piers (round columns under a cap beam, foam ring at the
// waterline). Railings stay open where another span joins. No third-party models; textures are
// CC0 ambientCG Asphalt031 (shared with roads) and Concrete034 (public/assets/bridge/).
//
// Height trick: units render at ground level, so the deck sits at ground level too and the river
// surface is faked lower (WL). An invisible depth-only ground plane over land tiles hides every
// part below ground, so the bridge only "drops" where there is water.
import * as THREE from 'three';
import type { GameMap } from '../types';
import { T } from '../world/map';

const RES = 2;
const TW = 64, TH = 32;
const K = (TW / 2) * Math.SQRT2; // screen px per world unit at zoom 1
const ELEV = Math.PI / 6;
const VK = K * Math.cos(ELEV); // screen px per unit of height
const BASE = `${import.meta.env.BASE_URL}assets/`;

// Heights in tiles (1 unit = 1 tile ≈ 39 px of height on screen).
const WL = -0.62; // apparent water level below the deck
const DT = 0.05; // deck (road) top
const KERB = 0.045; // kerb/sidewalk height above the deck
const SIDE = 0.16; // sidewalk width

interface Sprite { c: HTMLCanvasElement; x: number; y: number; w: number; h: number }
interface MapBridges { comp: Int32Array; sprites: (Sprite | null)[]; rev?: number }

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene, camera: THREE.OrthographicCamera, sun: THREE.DirectionalLight;
let asphalt: THREE.Texture | null = null, concrete: THREE.Texture | null = null;
let failed = false;
const cache = new WeakMap<GameMap, MapBridges>();
const drawn = new Set<number>();
let clearPending = false;

export async function prepareBridge(): Promise<void> {
  try {
    const loader = new THREE.TextureLoader();
    const [a, c] = await Promise.all([loader.loadAsync(`${BASE}textures/Asphalt031.jpg`), loader.loadAsync(`${BASE}bridge/Concrete034.jpg`)]);
    for (const t of [a, c]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; }
    asphalt = a; concrete = c;
    setup();
  } catch (e) {
    failed = true;
    console.warn('bridge art unavailable, using fallback', e);
  }
}

function setup() {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xe8eef5, 0x4a4636, 1.6));
  sun = new THREE.DirectionalLight(0xfff4e0, 2.6); // same light rig as art.ts (sun at screen top-left)
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0015;
  scene.add(sun, sun.target);
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
}

// ------------------------------------------------------------------ map analysis

function analyse(m: GameMap): MapBridges {
  const { w, h, terrain } = m;
  const comp = new Int32Array(w * h).fill(-1);
  const sprites: (Sprite | null)[] = [];
  for (let s = 0; s < w * h; s++) {
    if (terrain[s] !== T.Bridge || comp[s] >= 0) continue;
    const id = sprites.length, tiles: number[] = [];
    const stack = [s];
    comp[s] = id;
    while (stack.length) {
      const i = stack.pop()!;
      tiles.push(i);
      const x = i % w, y = (i / w) | 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (terrain[j] === T.Bridge && comp[j] < 0) { comp[j] = id; stack.push(j); }
        }
    }
    let sp: Sprite | null = null;
    try { sp = bake(m, tiles); } catch (e) { console.warn('bridge bake failed', e); }
    sprites.push(sp);
  }
  return { comp, sprites };
}

type V2 = [number, number];
/** A straight bridge span: centre (tile space), unit direction along the road, length and width in tiles. */
interface Span { cx: number; cy: number; ax: number; ay: number; L: number; W: number }

const inSpan = (s: Span, x: number, y: number, pad = 0) => {
  const dx = x - s.cx, dy = y - s.cy;
  return Math.abs(dx * s.ax + dy * s.ay) <= s.L / 2 + pad && Math.abs(-dx * s.ay + dy * s.ax) <= s.W / 2 + pad;
};

/**
 * Split a bridge's tiles into straight spans (RA2 bridges are straight): greedily take the
 * road-width band (tile axes / diagonals) holding the most tile centres — nearby road tiles in the
 * same band count too, so the span follows the road rather than the river — keep its longest
 * contiguous run as one span, and repeat for whatever the span does not cover.
 */
function fitSpans(tiles: V2[], roads: V2[]): Span[] {
  const HB = 1.25; // half the band width for tile centres (roads are 2 tiles wide, 3 on diagonals)
  let rest = tiles.map(([x, y]): V2 => [x + 0.5, y + 0.5]);
  const out: { s: Span; n: number; tiles: V2[] }[] = [];
  for (let guard = 0; rest.length && guard < 64; guard++) {
    let best = { ax: 1, ay: 0, lo: 0, hi: 0, count: -1 };
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 4, ax = Math.cos(a), ay = Math.sin(a); // tile axes and diagonals
      const vs = rest.map(([x, y]) => -ay * x + ax * y).sort((p, q) => p - q);
      const rv = roads.map(([x, y]) => -ay * x + ax * y);
      for (let i = 0, j = 0; i < vs.length; i++) {
        while (vs[j] < vs[i] - 2 * HB) j++;
        const count = i - j + 1 + 0.5 * rv.filter((v) => v >= vs[j] - 0.3 && v <= vs[i] + 0.3).length;
        if (count > best.count || (count === best.count && vs[i] - vs[j] < best.hi - best.lo - 1e-6)) best = { ax, ay, lo: vs[j], hi: vs[i], count };
      }
    }
    let { ax, ay, lo, hi } = best;
    // Refine the direction with the band's principal axis (roads to the map centre are rarely exactly 45°).
    const pick = (ax: number, ay: number, lo: number, hi: number) => rest.filter(([x, y]) => { const v = -ay * x + ax * y; return v >= lo - 1e-6 && v <= hi + 1e-6; });
    let sel = pick(ax, ay, lo, hi);
    const pts = sel.concat(roads.filter(([x, y]) => { const v = -ay * x + ax * y; return v >= lo - 0.3 && v <= hi + 0.3; }));
    if (sel.length >= 4) {
      const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length, my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      let sxx = 0, syy = 0, sxy = 0;
      for (const [x, y] of pts) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
      let th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
      if (Math.cos(th) * ax + Math.sin(th) * ay < 0) th += Math.PI;
      const rx = Math.cos(th), ry = Math.sin(th);
      if (rx * ax + ry * ay > Math.cos(Math.PI / 12)) {
        const vm = -ry * mx + rx * my;
        const vs = rest.map(([x, y]) => -ry * x + rx * y).filter((v) => Math.abs(v - vm) <= HB);
        if (vs.length >= sel.length) { ax = rx; ay = ry; lo = Math.min(...vs); hi = Math.max(...vs); sel = pick(ax, ay, lo, hi); }
      }
    }
    const band = sel.map(([x, y]) => ax * x + ay * y).sort((p, q) => p - q);
    let r0 = 0, bestRun: [number, number] = [0, 0];
    for (let i = 1; i <= band.length; i++)
      if (i === band.length || band[i] - band[i - 1] > 1.6) {
        if (i - r0 > bestRun[1] - bestRun[0]) bestRun = [r0, i];
        r0 = i;
      }
    const u0 = band[bestRun[0]] - 0.8, u1 = band[bestRun[1] - 1] + 0.8;
    const v0 = lo - 0.47, v1 = hi + 0.47;
    const uc = (u0 + u1) / 2, vc = (v0 + v1) / 2;
    const s: Span = { cx: uc * ax - vc * ay, cy: uc * ay + vc * ax, ax, ay, L: u1 - u0, W: v1 - v0 };
    const before = rest.length;
    rest = rest.filter(([x, y]) => !inSpan(s, x, y, -0.2));
    out.push({ s, n: before - rest.length, tiles: sel });
  }
  // Small leftovers (a few tiles where roads meet or drift) are absorbed by lengthening a big span
  // that already runs past them, instead of becoming stubby odd-angled mini bridges.
  const big = out.filter((o) => o.n > 5);
  const keep: Span[] = big.map((o) => o.s);
  for (const o of out) {
    if (o.n > 5) continue;
    const plan: [Span, number][] = [];
    const ok = o.tiles.every(([x, y]) => {
      for (const b of keep) {
        const dx = x - b.cx, dy = y - b.cy, du = dx * b.ax + dy * b.ay, dv = -dx * b.ay + dy * b.ax;
        if (Math.abs(dv) <= b.W / 2 + 0.3 && Math.abs(du) <= b.L / 2 + 1.6) { plan.push([b, du]); return true; }
      }
      return false;
    });
    if (!ok || !keep.length) { keep.push(o.s); continue; }
    const ext = new Map<Span, [number, number]>();
    for (const [b, du] of plan) { const r = ext.get(b) ?? [-b.L / 2, b.L / 2]; ext.set(b, [Math.min(r[0], du - 0.8), Math.max(r[1], du + 0.8)]); }
    for (const [b, [u0, u1]] of ext) { const mid = (u0 + u1) / 2; b.cx += mid * b.ax; b.cy += mid * b.ay; b.L = u1 - u0; }
  }
  return keep;
}

// ------------------------------------------------------------------ geometry

const mats = new Map<string, THREE.Material>();
function mat(key: string, make: () => THREE.Material) {
  let m = mats.get(key);
  if (!m) { m = make(); mats.set(key, m); }
  return m;
}
const concreteMat = (tone: number) => mat(`c${tone}`, () => new THREE.MeshStandardMaterial({ map: concrete, color: new THREE.Color(tone), roughness: 0.92 }));
const asphaltMat = () => mat('a', () => new THREE.MeshStandardMaterial({ map: asphalt, color: 0xb4b1ab, roughness: 0.95 }));
const steelMat = () => mat('s', () => new THREE.MeshStandardMaterial({ color: 0x59636b, roughness: 0.5, metalness: 0.45 }));
const paintMat = (c: number) => mat(`p${c}`, () => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }));

/** Box in span-local space (u along the road, v across, y up) with world-scaled UVs. */
function box(g: THREE.Group, material: THREE.Material, u0: number, u1: number, y0: number, y1: number, v0: number, v1: number, tex = 1.4, shadow = true) {
  const sx = u1 - u0, sy = y1 - y0, sz = v1 - v0;
  const geo = new THREE.BoxGeometry(sx, sy, sz);
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
  const off = ((u0 * 0.37 + v0 * 0.61) % 1 + 1) % 1;
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * dims[f][0]) / tex + off, (uv.getY(i) * dims[f][1]) / tex + off); }
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set((u0 + u1) / 2, (y0 + y1) / 2, (v0 + v1) / 2);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  g.add(mesh);
}

/** One straight span: deck, markings, and per side kerb + fascia + railing (left open where another span joins). */
function buildSpan(m: GameMap, s: Span, others: Span[]): THREE.Group {
  const g = new THREE.Group();
  g.rotation.y = Math.atan2(-s.ay, s.ax); // local +x → (ax, ay), local +z → (-ay, ax)
  g.position.set(s.cx, 0, s.cy);
  const cMain = concreteMat(0xcbc4b4), cDark = concreteMat(0x9d968a), cLight = concreteMat(0xddd6c6);
  const L = s.L, W = s.W, u0 = -L / 2, u1 = L / 2, v0 = -W / 2, v1 = W / 2;
  const world = (u: number, v: number): V2 => [s.cx + u * s.ax - v * s.ay, s.cy + u * s.ay + v * s.ax];
  const terrainAt = (u: number, v: number) => {
    const [x, y] = world(u, v);
    const tx = Math.floor(x), ty = Math.floor(y);
    return tx < 0 || ty < 0 || tx >= m.w || ty >= m.h ? T.Water : m.terrain[ty * m.w + tx];
  };
  const wet = (u: number, v: number) => { const t = terrainAt(u, v); return t === T.Water || t === T.Bridge; };

  // Deck: slab + asphalt + dashed centre line.
  box(g, cDark, u0, u1, -0.12, DT - 0.01, v0, v1, 1.4, false);
  box(g, asphaltMat(), u0, u1, DT - 0.02, DT, v0, v1, 2.2);
  if (W > 1.5) for (let u = u0 + 0.35; u + 0.26 < u1 - 0.2; u += 0.5) box(g, paintMat(0xe4dfcc), u, u + 0.26, DT, DT + 0.004, -0.018, 0.018, 1, false);

  const top = DT + KERB, rh = 0.15, STEP = 0.25;
  const n = Math.max(1, Math.round(L / STEP)), step = L / n;
  for (const side of [-1, 1]) {
    const ve = side * (W / 2);
    const at = (o: number) => ve + side * o; // offset outward from the edge
    // Pieces where another span continues sideways (a junction) stay open.
    const open: boolean[] = [];
    const inOther = (u: number, v: number, pad: number) => { const [x, y] = world(u, v); return others.some((o) => inSpan(o, x, y, pad)); };
    for (let k = 0; k < n; k++) {
      const u = u0 + (k + 0.5) * step;
      open.push(terrainAt(u, ve + side * 0.35) === T.Bridge || inOther(u, ve + side * 0.2, 0) || inOther(u, ve - side * 0.1, -0.05));
    }
    for (let k = 0; k < n; ) {
      if (open[k]) { k++; continue; }
      let e = k;
      while (e < n && !open[e]) e++;
      const a = u0 + k * step, b = u0 + e * step;
      const lo = (o0: number, o1: number) => [Math.min(at(o0), at(o1)), Math.max(at(o0), at(o1))] as const;
      const V = (o0: number, o1: number) => lo(o0, o1);
      let [p, q] = V(-SIDE, 0); box(g, cLight, a, b, DT - 0.02, top, p, q, 1.2); // sidewalk
      [p, q] = V(0, 0.05); box(g, cMain, a, b, -0.24, top + 0.01, p, q, 1.2); // fascia beam
      [p, q] = V(0, 0.075); box(g, cLight, a, b, top - 0.025, top + 0.014, p, q, 1.2); // cornice
      [p, q] = V(-0.12, 0.035); box(g, cDark, a, b, -0.29, -0.24, p, q, 1.2); // drip ledge
      // Railing: posts + top and mid rails.
      const np = Math.max(1, Math.round((b - a) / 0.2));
      [p, q] = V(-0.044, -0.016);
      for (let i = 0; i < np; i++) { const u = a + ((i + 0.5) * (b - a)) / np; box(g, steelMat(), u - 0.014, u + 0.014, top, top + rh, p, q); }
      [p, q] = V(-0.052, -0.008); box(g, steelMat(), a + 0.02, b - 0.02, top + rh - 0.02, top + rh + 0.005, p, q);
      [p, q] = V(-0.046, -0.014); box(g, steelMat(), a + 0.02, b - 0.02, top + rh * 0.5 - 0.012, top + rh * 0.5 + 0.008, p, q);
      // Concrete end posts.
      [p, q] = V(-0.13, 0.03);
      for (const u of [a + 0.07, b - 0.07]) box(g, cLight, u - 0.07, u + 0.07, DT, top + 0.22, p, q);
      k = e;
    }
  }
  // Abutment walls under both ends (the land occluder hides them where the end rests on the bank).
  box(g, cMain, u0, u0 + 0.14, WL - 0.02, -0.12, v0 + 0.02, v1 - 0.02);
  box(g, cMain, u1 - 0.14, u1, WL - 0.02, -0.12, v0 + 0.02, v1 - 0.02);
  // Piers: pairs of round columns under a cap beam every ~1.6 tiles, where the river is below.
  const nSpan = Math.max(1, Math.round(L / 1.6));
  for (let k = 1; k < nSpan; k++) {
    const u = u0 + (L * k) / nSpan;
    const cols = [v0 + 0.32, v1 - 0.32].filter((v) => wet(u, v) && wet(u, v + Math.sign(v) * 0.3));
    if (!cols.length) continue;
    box(g, cDark, u - 0.13, u + 0.13, -0.37, -0.29, v0 + 0.1, v1 - 0.1);
    for (const v of cols) addPier(g, cMain, u, v);
  }
  return g;
}

function addPier(g: THREE.Group, cMain: THREE.Material, x: number, z: number) {
  const foam = mat('foam', () => new THREE.MeshBasicMaterial({ color: 0xe8f2f4, transparent: true, opacity: 0.5, depthWrite: false }));
  const R = 0.1, yTop = -0.37;
  const col = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 1.18, yTop - WL + 0.02, 16), cMain);
  col.position.set(x, (yTop + WL - 0.02) / 2, z);
  col.castShadow = col.receiveShadow = true;
  const ring = new THREE.Mesh(new THREE.RingGeometry(R * 1.15, R * 2.2, 20), foam);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, WL + 0.002, z);
  g.add(col, ring);
}

// ------------------------------------------------------------------ baking

function bake(m: GameMap, tiles: number[]): Sprite | null {
  if (!renderer) return null;
  const { w } = m;
  let x0 = w, y0 = m.h, x1 = 0, y1 = 0;
  for (const i of tiles) { const x = i % w, y = (i / w) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2;

  const group = new THREE.Group();
  const roads: V2[] = [];
  for (let ty = Math.max(0, y0 - 4); ty <= Math.min(m.h - 1, y1 + 4); ty++)
    for (let tx = Math.max(0, x0 - 4); tx <= Math.min(w - 1, x1 + 4); tx++) if (m.terrain[ty * w + tx] === T.Road) roads.push([tx + 0.5, ty + 0.5]);
  const spans = fitSpans(tiles.map((i): V2 => [i % w, (i / w) | 0]), roads);
  for (const sp of spans) group.add(buildSpan(m, sp, spans.filter((o) => o !== sp)));
  scene.add(group);
  group.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(group);

  // Shadow catcher at the apparent water level (the land occluder hides it outside the river).
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 6, y1 - y0 + 6), new THREE.ShadowMaterial({ opacity: 0.4 }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.set(cx, WL, cy);
  catcher.receiveShadow = true;
  group.add(catcher);

  // Screen bounds (iso px, zoom 1).
  let X0 = Infinity, X1 = -Infinity, Y0 = Infinity, Y1 = -Infinity;
  for (const px of [bb.min.x, bb.max.x]) for (const py of [bb.min.y, bb.max.y]) for (const pz of [bb.min.z, bb.max.z]) {
    const sx = ((px - pz) * TW) / 2, sy = ((px + pz) * TH) / 2 - py * VK;
    X0 = Math.min(X0, sx); X1 = Math.max(X1, sx); Y0 = Math.min(Y0, sy); Y1 = Math.max(Y1, sy);
  }
  // Land occluder: depth-only ground plane at y=0 over land tiles (drawn first) + shadow catcher.
  const land = new THREE.Group();
  const ground = new THREE.ShadowMaterial({ opacity: 0.38 });
  const occl = new THREE.MeshBasicMaterial({ colorWrite: false });
  const plane = new THREE.PlaneGeometry(1.02, 1.02);
  for (let ty = y0 - 3; ty <= y1 + 3; ty++)
    for (let tx = x0 - 3; tx <= x1 + 3; tx++) {
      const t = tx >= 0 && ty >= 0 && tx < m.w && ty < m.h ? m.terrain[ty * w + tx] : T.Grass;
      if (t === T.Water || t === T.Bridge) continue;
      for (const mt of [ground, occl]) {
        const p = new THREE.Mesh(plane, mt);
        p.rotation.x = -Math.PI / 2;
        p.position.set(tx + 0.5, 0.001, ty + 0.5);
        p.receiveShadow = mt === ground;
        p.renderOrder = mt === occl ? -1 : 0;
        land.add(p);
      }
    }
  scene.add(land);

  X0 = Math.floor(X0 - 4); Y0 = Math.floor(Y0 - 4); X1 = Math.ceil(X1 + 4); Y1 = Math.ceil(Y1 + 12);
  const fw = X1 - X0, fh = Y1 - Y0;
  const res = Math.min(RES, 4096 / Math.max(fw, fh));

  // Camera: same 2:1 dimetric view as art.ts, looking at the bridge centre.
  const centre = new THREE.Vector3(cx, 0, cy);
  const d = 80 + Math.max(x1 - x0, y1 - y0);
  camera.position.set(cx + Math.cos(ELEV) * Math.SQRT1_2 * d, Math.sin(ELEV) * d, cy + Math.cos(ELEV) * Math.SQRT1_2 * d);
  camera.lookAt(centre);
  const oX = ((cx - cy) * TW) / 2 - X0, oY = ((cx + cy) * TH) / 2 - Y0; // centre inside the frame
  camera.left = -oX / K; camera.right = (fw - oX) / K;
  camera.top = oY / K; camera.bottom = -(fh - oY) / K;
  camera.near = 1; camera.far = d * 2;
  camera.updateProjectionMatrix();
  sun.position.set(cx - 6, 10, cy - 2);
  sun.target.position.copy(centre);
  const r = Math.max(x1 - x0, y1 - y0) / 2 + 4;
  Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 0.1, far: 40 + r });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.needsUpdate = true;

  const pw = Math.round(fw * res), ph = Math.round(fh * res);
  renderer.setSize(pw, ph, false);
  renderer.render(scene, camera);
  const c = document.createElement('canvas');
  c.width = pw; c.height = ph;
  c.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
  scene.remove(group, land);
  plane.dispose(); ground.dispose(); occl.dispose(); (catcher.material as THREE.Material).dispose();
  group.traverse((o) => { const mm = o as THREE.Mesh; if (mm.isMesh) mm.geometry.dispose(); });
  return { c, x: X0, y: Y0, w: fw, h: fh };
}

// ------------------------------------------------------------------ drawing

/** Optional: bake a map's bridges up front (e.g. at game start) instead of lazily on the first frame (~20–200 ms). */
export function bakeBridges(m: GameMap): void {
  if (!failed && renderer && !cache.has(m)) cache.set(m, analyse(m));
}

/** Draw the bridge for tile (tx, ty); drawn after terrain, before units (units drive over it). */
export function drawBridgeTile(g: CanvasRenderingContext2D, m: GameMap, tx: number, ty: number, _ix: number, _iy: number): boolean {
  if (failed || !renderer) return false;
  let b = cache.get(m);
  if (!b || (b.rev ?? 0) !== (m.rev ?? 0)) { b = analyse(m); b.rev = m.rev ?? 0; cache.set(m, b); } // re-baked after a bridge falls or is rebuilt
  const id = b.comp[ty * m.w + tx];
  const sp = id >= 0 ? b.sprites[id] : null;
  if (!sp) return false;
  // One sprite per bridge: draw it for the first visible tile of each frame, skip the rest
  // (the renderer draws all bridge tiles in one synchronous loop; a microtask resets the set).
  if (drawn.has(id)) return true;
  drawn.add(id);
  if (!clearPending) { clearPending = true; queueMicrotask(() => { drawn.clear(); clearPending = false; }); }
  g.drawImage(sp.c, sp.x, sp.y, sp.w, sp.h);
  return true;
}
