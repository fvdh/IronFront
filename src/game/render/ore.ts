// Ore/gem art (owned by the ore pass). Returns false to fall back to oreSprite in assets.ts.
//
// Fully procedural, no third-party assets: low-poly crystal clusters are generated in three.js
// (golden faceted nuggets + shards for ore, multi-coloured hexagonal shards on dark rock for gems),
// lit with the same sun/sky as the baked units, and rendered with real shadows into small iso
// sprites — VARIANTS clusters × LEVELS depletion stages per kind. Each tile draws a soft,
// neighbour-aware ground stain plus one cached sprite, so fields read as dense and continuous,
// and visibly thin out as the tile is harvested. A cheap additive glint twinkles on crystal tips.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GEM_MULTIPLIER, ORE_TILE_MAX } from '../data/config';
import type { GameMap } from '../types';
import { TH, TW } from './iso';
import { yieldToPage } from './art';

const RES = 2;
const K = (TW / 2) * Math.SQRT2; // screen px per world unit (tile) at zoom 1
const VARIANTS = 6;
const LEVELS = 6;
// Sprite frame (css px): tile centre sits at (AX, AY).
const FW = 88, FH = 84, AX = 44, AY = 58;
// Stain frame: tile diamond plus a margin for soft outward edges.
const SM = 10, SW = TW + SM * 2, SH = TH + SM * 2;

interface Sprite { c: HTMLCanvasElement; glints: [number, number][] }
const sprites: Sprite[][][] = [[], []]; // [gem][variant][level-1]
const stains = new Map<number, HTMLCanvasElement>();
let glintSprite: HTMLCanvasElement | null = null;
// Ore mines: one baked sprite per kind; tile centre at (MX, MY) in an MW×MH frame.
const MW = 104, MH = 136, MX = 52, MY = 104;
const mines: (Sprite | null)[] = [null, null];
let ready = false;

// ------------------------------------------------------------------ helpers

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const hash3 = (x: number, y: number, z: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
};

/** Jitter a polyhedron's vertices (consistently for shared positions) and flat-shade it. */
function lumpy(geo: THREE.BufferGeometry, amt: number, seed: number): THREE.BufferGeometry {
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const kx = Math.round(x * 1000) / 1000 + seed, ky = Math.round(y * 1000) / 1000, kz = Math.round(z * 1000) / 1000;
    const k = 1 + (hash3(kx, ky, kz) - 0.5) * 2 * amt;
    p.setXYZ(i, x * k, y * k, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Hexagonal crystal: prism body with a pointed tip, base at y=0. */
function shardGeo(r: number, h: number, sides: number, rot: number): THREE.BufferGeometry {
  const pts = [new THREE.Vector2(0.0001, 0), new THREE.Vector2(r, 0), new THREE.Vector2(r * 1.05, h * 0.62), new THREE.Vector2(0.0001, h)];
  const g = new THREE.LatheGeometry(pts, sides, rot);
  return g.toNonIndexed();
}

// ------------------------------------------------------------------ cluster layout

interface Piece { kind: 'nugget' | 'shard' | 'rock'; x: number; z: number; s: number; h: number; tilt: number; dir: number; col: number; seed: number; rank: number }

/** Scatter clusters over the tile square [-0.5, 0.5]². rank ∈ [0,1]: low = survives depletion longest. */
function layout(gem: boolean, v: number): Piece[] {
  const r = rng(v * 7919 + (gem ? 104729 : 1299709));
  const out: Piece[] = [];
  const sites: [number, number, number][] = [];
  const nSites = gem ? 4 + Math.floor(r() * 2) : 5 + Math.floor(r() * 2);
  for (let tries = 0; sites.length < nSites && tries < 400; tries++) {
    const x = (r() - 0.5) * 0.9, z = (r() - 0.5) * 0.9;
    if (sites.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < (gem ? 0.32 : 0.3))) continue;
    // central clumps are bigger and deplete last
    const c = 1 - Math.min(1, Math.hypot(x, z) / 0.6);
    sites.push([x, z, c]);
  }
  sites.sort((a, b) => b[2] - a[2]);
  sites.forEach(([sx, sz, c], si) => {
    const rank = (si / sites.length) * 0.85 + r() * 0.15;
    const big = 0.75 + c * 0.45 + r() * 0.25;
    const col = Math.floor(r() * GEM_COLS.length);
    if (!gem) {
      // a tight clump of lumpy nuggets, with the odd crystal point sticking out
      const n = 7 + Math.floor(r() * 5);
      for (let k = 0; k < n; k++) {
        const a = r() * Math.PI * 2, d = k === 0 ? 0 : (0.03 + r() * 0.07) * big;
        const shard = k > 0 && r() < 0.22;
        out.push({
          kind: shard ? 'shard' : 'nugget', x: sx + Math.cos(a) * d, z: sz + Math.sin(a) * d,
          s: (shard ? 0.032 : 0.042 + r() * 0.035) * big * (k === 0 ? 1.5 : 1), h: shard ? (0.12 + r() * 0.1) * big : 0.8 + r() * 0.5,
          tilt: shard ? 0.25 + r() * 0.5 : 0, dir: a, col: Math.floor(r() * ORE_COLS.length), seed: r() * 100, rank: Math.min(1, rank + k * 0.035),
        });
      }
    } else {
      // dark rock bed with a spray of chunky, mixed-colour shards
      out.push({ kind: 'rock', x: sx, z: sz, s: 0.1 * big, h: 0.4, tilt: 0, dir: 0, col: 0, seed: r() * 100, rank });
      const n = 4 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        const a = r() * Math.PI * 2, d = k === 0 ? 0 : 0.03 + r() * 0.06;
        out.push({
          kind: 'shard', x: sx + Math.cos(a) * d, z: sz + Math.sin(a) * d,
          s: (0.03 + r() * 0.018) * big, h: (0.12 + r() * 0.12) * big * (k === 0 ? 1.4 : 1),
          tilt: k === 0 ? r() * 0.2 : 0.35 + r() * 0.45, dir: a, col: r() < 0.7 ? col : Math.floor(r() * GEM_COLS.length), seed: r() * 100, rank: Math.min(1, rank + k * 0.03),
        });
      }
    }
  });
  // loose grit fills the gaps so full tiles look carpeted
  const grit = gem ? 10 : 26;
  for (let k = 0; k < grit; k++) {
    const shard = gem && k % 2 === 0;
    out.push({ kind: shard ? 'shard' : gem ? 'rock' : 'nugget', x: (r() - 0.5) * 0.95, z: (r() - 0.5) * 0.95, s: shard ? 0.018 : 0.018 + r() * 0.018, h: shard ? 0.07 : 0.6, tilt: shard ? 0.5 : 0, dir: r() * 6, col: Math.floor(r() * (gem ? GEM_COLS.length : ORE_COLS.length)), seed: r() * 100, rank: 0.3 + r() * 0.7 });
  }
  return out;
}

// ------------------------------------------------------------------ baking

const ORE_COLS = ['#d99a14', '#e6ad1e', '#c8820e', '#efbe34'];
const GEM_COLS = ['#c8142c', '#1f4fe0', '#7a28d8', '#12a8cc', '#c8142c'];

function mats() {
  const ore = ORE_COLS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.38, metalness: 0.45, flatShading: true, emissive: new THREE.Color(c).multiplyScalar(0.06), envMapIntensity: 0.9 }));
  const gem = GEM_COLS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.1, metalness: 0.2, flatShading: true, emissive: new THREE.Color(c).multiplyScalar(0.18), envMapIntensity: 1.8 }));
  const rock = new THREE.MeshStandardMaterial({ color: '#5a5660', roughness: 0.8, metalness: 0, flatShading: true });
  const oreRock = new THREE.MeshStandardMaterial({ color: '#6b5226', roughness: 0.8, metalness: 0.1, flatShading: true });
  return { ore, gem, rock, oreRock };
}

function buildPiece(p: Piece, f: number, gem: boolean, M: ReturnType<typeof mats>): THREE.Mesh {
  let geo: THREE.BufferGeometry, mat: THREE.Material;
  const s = p.s * f;
  if (p.kind === 'shard') {
    geo = shardGeo(s, p.h * f, gem ? 6 : 5, p.seed);
    mat = gem ? M.gem[p.col] : M.ore[p.col];
  } else if (p.kind === 'rock') {
    geo = lumpy(new THREE.IcosahedronGeometry(1, 0), 0.3, p.seed);
    mat = gem ? M.rock : M.oreRock;
  } else {
    geo = lumpy(new THREE.IcosahedronGeometry(1, 0), 0.35, p.seed);
    mat = M.ore[p.col];
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(p.x, 0, p.z);
  if (p.kind === 'shard') {
    mesh.rotation.set(Math.sin(p.dir) * p.tilt, p.seed, -Math.cos(p.dir) * p.tilt, 'YXZ');
    mesh.position.y = -0.01;
  } else {
    mesh.scale.set(s, s * p.h, s);
    mesh.rotation.y = p.seed;
    mesh.position.y = s * p.h * 0.35;
  }
  return mesh;
}

async function bakeAll() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  try {
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setSize(FW * RES, FH * RES, false);
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
    scene.add(new THREE.HemisphereLight(0xe8eef5, 0x4a4636, 0.8));
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.8);
    sun.position.set(-6, 10, -2); // same sun as the baked units (screen top-left)
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6, near: 0.1, far: 30 });
    sun.shadow.bias = -0.0015;
    scene.add(sun);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.45 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const camera = new THREE.OrthographicCamera(-AX / K, (FW - AX) / K, AY / K, -(FH - AY) / K, 0.1, 200);
    const e = Math.PI / 6;
    camera.position.set(Math.cos(e) * Math.SQRT1_2 * 60, Math.sin(e) * 60, Math.cos(e) * Math.SQRT1_2 * 60);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const M = mats();
    const v3 = new THREE.Vector3();

    for (let gi = 0; gi < 2; gi++) {
      const gem = gi === 1;
      for (let v = 0; v < VARIANTS; v++) {
        const pieces = layout(gem, v);
        const levels: Sprite[] = [];
        for (let L = 1; L <= LEVELS; L++) {
          const frac = L / LEVELS;
          const f = 0.55 + 0.45 * frac; // survivors also shrink
          const group = new THREE.Group();
          const tips: [number, number, number][] = [];
          for (const p of pieces) {
            if (p.rank > frac * 1.02 + 0.02) continue;
            const mesh = buildPiece(p, f, gem, M);
            group.add(mesh);
            if (p.kind !== 'rock') {
              mesh.updateMatrixWorld(true);
              const top = p.kind === 'shard' ? v3.set(0, p.h * f, 0) : v3.set(0, 1, 0);
              mesh.localToWorld(top);
              top.project(camera);
              tips.push([((top.x + 1) / 2) * FW, ((1 - top.y) / 2) * FH, p.kind === 'shard' ? p.h : p.s * 3]);
            }
          }
          scene.add(group);
          renderer.render(scene, camera);
          const c = document.createElement('canvas');
          c.width = FW * RES; c.height = FH * RES;
          c.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
          scene.remove(group);
          group.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
          tips.sort((a, b) => b[2] - a[2]);
          levels.push({ c, glints: tips.slice(0, 3).map(([x, y]) => [x, y]) });
        }
        sprites[gi].push(levels);
        await yieldToPage(); // keep the page responsive (setTimeout is throttled to ~1 s in background tabs)
      }
    }

    // ---- ore mines (procedural): rock mound + crystals; ore gets a steel drilling derrick, gems a crystal spire
    renderer.setSize(MW * RES, MH * RES, false);
    Object.assign(camera, { left: -MX / K, right: (MW - MX) / K, top: MY / K, bottom: -(MH - MY) / K });
    camera.updateProjectionMatrix();
    const steel = new THREE.MeshStandardMaterial({ color: '#6f757d', roughness: 0.45, metalness: 0.6, flatShading: true });
    const dark = new THREE.MeshStandardMaterial({ color: '#3a3d42', roughness: 0.6, metalness: 0.4, flatShading: true });
    const hazard = new THREE.MeshStandardMaterial({ color: '#d8a019', roughness: 0.5, metalness: 0.2, flatShading: true });
    const moundMat = new THREE.MeshStandardMaterial({ color: '#6a6258', roughness: 0.9, flatShading: true });
    const beam = (a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) => {
      const len = a.distanceTo(b);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), mat);
      mesh.position.copy(a).add(b).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      mesh.castShadow = mesh.receiveShadow = true;
      return mesh;
    };
    for (let gi = 0; gi < 2; gi++) {
      const gem = gi === 1;
      const r = rng(gem ? 4242 : 1717);
      const group = new THREE.Group();
      group.scale.setScalar(gem ? 1.1 : 1.3);
      moundMat.color.set(gem ? '#4e4a54' : '#5e5040');
      const tips: [number, number, number][] = [];
      const addTip = (o: THREE.Object3D, local: THREE.Vector3, w: number) => {
        o.updateMatrixWorld(true);
        const t = o.localToWorld(local.clone()).project(camera);
        tips.push([((t.x + 1) / 2) * MW, ((1 - t.y) / 2) * MH, w]);
      };
      // rock mound
      const mound = new THREE.Mesh(lumpy(new THREE.IcosahedronGeometry(1, 1), 0.22, gem ? 3 : 5), moundMat);
      mound.scale.set(0.42, 0.16, 0.42); mound.position.y = 0.02;
      mound.castShadow = mound.receiveShadow = true;
      group.add(mound);
      // crystals bursting out of the mound
      const n = gem ? 9 : 14;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + r() * 0.5, d = gem ? 0.2 + r() * 0.16 : 0.26 + r() * 0.16;
        const p: Piece = gem
          ? { kind: 'shard', x: Math.cos(a) * d, z: Math.sin(a) * d, s: 0.04 + r() * 0.02, h: 0.16 + r() * 0.14, tilt: 0.5 + r() * 0.4, dir: a, col: k % 4, seed: r() * 100, rank: 0 }
          : { kind: r() < 0.35 ? 'shard' : 'nugget', x: Math.cos(a) * d, z: Math.sin(a) * d, s: 0.05 + r() * 0.03, h: 0.9, tilt: 0.5, dir: a, col: k % 4, seed: r() * 100, rank: 0 };
        if (p.kind === 'shard' && !gem) p.h = 0.18 + r() * 0.1;
        const mesh = buildPiece(p, 1, gem, M);
        mesh.position.y += 0.05;
        group.add(mesh);
      }
      if (gem) {
        // crystal spire: a tall central shard ringed by leaning ones
        const cols = [3, 2, 1, 0, 2, 3];
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + 0.3;
          const main = k === 0;
          const mesh = buildPiece({ kind: 'shard', x: main ? 0 : Math.cos(a) * 0.09, z: main ? 0 : Math.sin(a) * 0.09, s: main ? 0.085 : 0.055, h: main ? 1.05 : 0.45 + r() * 0.25, tilt: main ? 0 : 0.28 + r() * 0.15, dir: a, col: cols[k], seed: r() * 100, rank: 0 }, 1, true, M);
          mesh.position.y += 0.08;
          group.add(mesh);
          addTip(mesh, new THREE.Vector3(0, (main ? 1.05 : 0.45) * 0.97, 0), main ? 2 : 1);
        }
      } else {
        // four-legged steel derrick over a drill pipe
        const top = new THREE.Vector3(0, 1.0, 0);
        const feet = [[-0.26, -0.26], [0.26, -0.26], [0.26, 0.26], [-0.26, 0.26]].map(([x, z]) => new THREE.Vector3(x, 0.02, z));
        feet.forEach((f, k) => {
          group.add(beam(f, top.clone().add(new THREE.Vector3(f.x * 0.2, 0, f.z * 0.2)), 0.024, steel));
          const g2 = feet[(k + 1) % 4];
          for (const hgt of [0.35, 0.68]) {
            const t = hgt / 1.0, lerp = (v: THREE.Vector3) => v.clone().lerp(top.clone().add(new THREE.Vector3(v.x * 0.2, 0, v.z * 0.2)), t);
            group.add(beam(lerp(f), lerp(g2), 0.014, steel));
          }
          const base = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), dark);
          base.position.set(f.x, 0.05, f.z); base.castShadow = true; group.add(base);
        });
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.16), hazard);
        cap.position.set(0, 1.02, 0); cap.castShadow = true; group.add(cap);
        group.add(beam(new THREE.Vector3(0, 0.0, 0), new THREE.Vector3(0, 1.0, 0), 0.03, dark));
        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.12, 8), hazard);
        collar.position.y = 0.2; collar.castShadow = true; group.add(collar);
        const hopper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.14), dark);
        hopper.position.set(0.3, 0.14, -0.08); hopper.castShadow = true; group.add(hopper);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffcf40' }));
        lamp.position.set(0, 1.09, 0); group.add(lamp);
        addTip(lamp, new THREE.Vector3(0, 0, 0), 2);
        addTip(collar, new THREE.Vector3(0, 0.06, 0), 1);
      }
      scene.add(group);
      renderer.render(scene, camera);
      const c = document.createElement('canvas');
      c.width = MW * RES; c.height = MH * RES;
      c.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
      scene.remove(group);
      group.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      mines[gi] = { c, glints: tips.map(([x, y]) => [x, y]) };
    }
    for (const mm of [steel, dark, hazard, moundMat]) mm.dispose();
    pmrem.dispose();
    for (const m of [...M.ore, ...M.gem, M.rock, M.oreRock]) m.dispose();
  } finally {
    renderer.dispose();
    renderer.forceContextLoss();
  }
}

// ------------------------------------------------------------------ 2D: stains and glints

/** Ground stain under a tile. mask bit set = that neighbour also has ore (edge stays hard). */
function stain(gem: boolean, mask: number, v: number): HTMLCanvasElement {
  const key = (gem ? 1000 : 0) + mask * 10 + v;
  let c = stains.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  const W = SW * RES, H = SH * RES;
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  const d = img.data;
  const r = rng(key * 31 + 7);
  const base = gem ? [44, 38, 52] : [104, 70, 20];
  const speck = gem ? [[70, 200, 230], [190, 70, 220], [230, 60, 80]] : [[236, 186, 58], [255, 222, 110], [60, 40, 12]];
  for (let py = 0; py < H; py++)
    for (let px = 0; px < W; px++) {
      const lx = px / RES - SM - TW / 2, ly = py / RES - SM;
      const u = (lx / (TW / 2) + ly / (TH / 2)) / 2, w = (ly / (TH / 2) - lx / (TW / 2)) / 2;
      // edge order: u=0 (x-1), w=0 (y-1), u=1 (x+1), w=1 (y+1)
      const n = (hash3(Math.floor(px / 5), Math.floor(py / 5), v) - 0.5) * 0.14 + (hash3(Math.floor(px / 2), Math.floor(py / 2), v + 9) - 0.5) * 0.06;
      let a = 1;
      const edge = (t: number, open: boolean) => {
        if (open) a *= Math.min(1, Math.max(0, (t + 0.14 + n) / 0.34));
        else a *= Math.min(1, Math.max(0, (t + 0.5 / (TW / 2)) * TW / 2)); // 1px AA seam
      };
      edge(u, !(mask & 1)); edge(w, !(mask & 2)); edge(1 - u, !(mask & 4)); edge(1 - w, !(mask & 8));
      if (a <= 0) continue;
      const k = (py * W + px) * 4;
      const grain = hash3(px, py, v + 3);
      let col = base;
      let alpha = 0.62 * a * (0.85 + grain * 0.3);
      if (grain > 0.965) { col = speck[Math.floor(r() * speck.length)]; alpha = Math.min(1, a * 1.1); }
      else if (grain < 0.05) { col = [base[0] * 0.5, base[1] * 0.5, base[2] * 0.5]; alpha = 0.75 * a; }
      d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = alpha * 255;
    }
  g.putImageData(img, 0, 0);
  stains.set(key, c);
  return c;
}

function makeGlint(): HTMLCanvasElement {
  const S = 16 * RES, c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d')!;
  const h = S / 2;
  const rad = g.createRadialGradient(h, h, 0, h, h, h * 0.45);
  rad.addColorStop(0, 'rgba(255,255,240,1)'); rad.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = rad; g.fillRect(0, 0, S, S);
  g.fillStyle = 'rgba(255,255,235,0.9)';
  g.beginPath(); g.moveTo(h, 0); g.lineTo(h + 1.2, h); g.lineTo(h, S); g.lineTo(h - 1.2, h); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(0, h); g.lineTo(h, h - 1.2); g.lineTo(S, h); g.lineTo(h, h + 1.2); g.closePath(); g.fill();
  return c;
}

// ------------------------------------------------------------------ API

export async function prepareOre(): Promise<void> {
  if (ready) return;
  try {
    await bakeAll();
    glintSprite = makeGlint();
    ready = true;
  } catch (e) {
    console.warn('[ore] baking failed, using procedural fallback:', e);
  }
}

/** Draw ore on tile i. m.ore[i] = amount (0..ORE_TILE_MAX·GEM_MULTIPLIER), m.gem[i] = gem field. */
export function drawOre(g: CanvasRenderingContext2D, m: GameMap, i: number, tx: number, ty: number, ix: number, iy: number, time: number): boolean {
  if (!ready) return false;
  const amt = m.ore[i];
  if (!amt) return true;
  const gem = !!m.gem[i];
  // sqrt: half-full tiles still read as dense; the last harvests thin the tile out quickly
  const frac = Math.sqrt(Math.min(1, amt / (ORE_TILE_MAX * (gem ? GEM_MULTIPLIER : 1))));
  const level = Math.max(1, Math.min(LEVELS, Math.ceil(frac * LEVELS)));
  const w = m.w, h = m.h;
  const has = (j: number) => m.ore[j] > 0 && !!m.gem[j] === gem;
  const mask = (tx > 0 && has(i - 1) ? 1 : 0) | (ty > 0 && has(i - w) ? 2 : 0) | (tx < w - 1 && has(i + 1) ? 4 : 0) | (ty < h - 1 && has(i + w) ? 8 : 0);
  const d = m.deco[i];
  const sv = (tx * 3 + ty * 5) % 3;
  g.globalAlpha = 0.45 + 0.55 * frac;
  g.drawImage(stain(gem, mask, sv), ix - TW / 2 - SM, iy - SM, SW, SH);
  g.globalAlpha = 1;
  const variant = (d + tx * 7 + ty * 13) % VARIANTS;
  const s = sprites[gem ? 1 : 0][variant][level - 1];
  const x0 = ix - AX, y0 = iy + TH / 2 - AY;
  g.drawImage(s.c, x0, y0, FW, FH);
  // glint: each tile twinkles briefly every few seconds
  if (glintSprite && s.glints.length) {
    const ph = time * (gem ? 0.9 : 0.6) + hash3(tx, ty, 1) * 10;
    const t = ph - Math.floor(ph);
    if (t < 0.12) {
      const a = Math.sin((t / 0.12) * Math.PI);
      const [gx, gy] = s.glints[Math.floor(ph) % s.glints.length];
      const sz = (gem ? 12 : 10) * (0.6 + 0.4 * a);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = a * (gem ? 0.9 : 0.75);
      g.drawImage(glintSprite, x0 + gx - sz / 2, y0 + gy - sz / 2, sz, sz);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
  }
  return true;
}

/** Ore mine on its tile; (ix, iy) = tile centre in screen space. Depth-sorted by the caller like props. */
export function drawOreMine(g: CanvasRenderingContext2D, _m: GameMap, src: { i: number; gem: boolean }, ix: number, iy: number, time: number): boolean {
  const s = mines[src.gem ? 1 : 0];
  if (!s) return false;
  const x0 = ix - MX, y0 = iy - MY;
  g.drawImage(s.c, x0, y0, MW, MH);
  if (!glintSprite) return true;
  g.globalCompositeOperation = 'lighter';
  // ore rig: blinking beacon on the derrick; gem spire: slow pulsing glow on the crystal tips
  const [bx, by] = s.glints[0];
  const blink = src.gem ? 0.55 + 0.45 * Math.sin(time * 2 + src.i) : Math.max(0, Math.sin(time * 4 + src.i)) ** 6;
  const sz = src.gem ? 22 : 16;
  g.globalAlpha = blink * 0.9;
  g.drawImage(glintSprite, x0 + bx - sz / 2, y0 + by - sz / 2, sz, sz);
  const ph = time * 0.8 + src.i * 0.37, t = ph - Math.floor(ph);
  if (t < 0.15 && s.glints.length > 1) {
    const [gx, gy] = s.glints[1 + (Math.floor(ph) % (s.glints.length - 1))];
    g.globalAlpha = Math.sin((t / 0.15) * Math.PI) * 0.8;
    g.drawImage(glintSprite, x0 + gx - 6, y0 + gy - 6, 12, 12);
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  return true;
}
