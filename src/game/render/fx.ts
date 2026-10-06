// Render-only combat & damage effects: muzzle flashes, beams/arcs, projectile trails, impact sparks,
// infantry death (fall + fade + dust), burning buildings. Everything here is derived from GameState
// (entities, projectiles, effects) plus small render-side caches keyed by object identity — the
// deterministic simulation is never written to.
import { BUILDINGS } from '../data/buildings';
import { UNITS } from '../data/units';
import { WEAPONS, type WeaponDef } from '../data/weapons';
import { AIR_ALTITUDE } from '../data/config';
import type { Effect, Entity, GameState, Projectile } from '../types';
import { drawAtlas, FX, fxImage, unitSprites, type AnimRows } from './art';
import { isoX, isoY, TH, TW } from './iso';

/** Screen-space muzzle height (px above ground) of buildings with a weapon. */
const BUILDING_MUZZLE: Record<string, number> = { pillbox: 10, tower: 24, gatlingtower: 20, prismtower: 44, coil: 46, psispire: 36 };
const DEATH_FALL = 0.55, DEATH_LIE = 1.4, DEATH_FADE = 0.9; // seconds

interface Shooter { h: number; w?: WeaponDef; dx: number; dy: number }
export interface Corpse { def: string; faction: Parameters<typeof unitSprites>[1]; color: string; x: number; y: number; facing: number; t0: number }
interface Seen { def: string; owner: number; x: number; y: number; facing: number }

const hash = (n: number) => (((n * 2654435761) >>> 0) % 10007) / 10007;
/** Screen direction (unit vector) of a tile-space angle. */
const screenDir = (a: number): [number, number] => {
  const x = ((Math.cos(a) - Math.sin(a)) * TW) / 2, y = ((Math.cos(a) + Math.sin(a)) * TH) / 2, l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};

export class CombatFx {
  private state?: GameState;
  private shooters = new WeakMap<Effect, Shooter | null>();
  private starts = new WeakMap<Projectile, [number, number]>();
  private dusty = new WeakSet<Effect>();
  private seen = new Map<number, Seen>();
  private next = new Map<number, Seen>();
  corpses: Corpse[] = [];

  /** Call once per frame before drawing; resets caches when a new game state is shown. */
  begin(s: GameState) {
    if (s !== this.state) { this.state = s; this.seen.clear(); this.corpses = []; }
    this.next.clear();
  }

  /** Remember a visible infantry unit (to notice its death next frame). */
  track(e: Entity) {
    this.next.set(e.id, { def: e.def, owner: e.owner, x: e.x, y: e.y, facing: e.facing });
  }

  /** Units that vanished with a fresh death explosion at their spot become corpses; that explosion turns into dust. */
  end(s: GameState, time: number) {
    for (const [id, u] of this.seen) {
      if (this.next.has(id) || s.rt.byId.has(id)) continue;
      const f = s.effects.find((f) => f.kind === 'explosion' && f.t >= 0 && Math.abs(f.x - u.x) < 0.05 && Math.abs(f.y - u.y) < 0.05);
      if (!f) continue;
      this.dusty.add(f);
      const p = s.players[u.owner];
      this.corpses.push({ def: u.def, faction: p.faction, color: p.color, x: u.x, y: u.y, facing: u.facing, t0: time - f.t / 30 });
    }
    [this.seen, this.next] = [this.next, this.seen];
    this.corpses = this.corpses.filter((c) => time - c.t0 < DEATH_FALL + DEATH_LIE + DEATH_FADE);
  }

  drawCorpse(g: CanvasRenderingContext2D, c: Corpse, time: number) {
    const u = unitSprites(UNITS[c.def].sprite, c.faction, c.color);
    const r = u?.body.rows;
    if (!u || !r || !r.deathN) return;
    const t = time - c.t0;
    const fi = Math.min(r.deathN - 1, Math.floor((t / DEATH_FALL) * r.deathN));
    const fade = t < DEATH_FALL + DEATH_LIE ? 1 : 1 - (t - DEATH_FALL - DEATH_LIE) / DEATH_FADE;
    g.globalAlpha = Math.max(0, fade);
    drawAtlas(g, u.body, c.facing, isoX(c.x, c.y), isoY(c.x, c.y), r.death + fi);
    g.globalAlpha = 1;
  }

  /** Which entity fired this effect (muzzle = centre + 0.45 tile along its turret, see systems/combat.ts). */
  private shooter(s: GameState, f: Effect): Shooter | null {
    let r = this.shooters.get(f);
    if (r !== undefined) return r;
    r = null;
    for (const e of s.entities) {
      if (e.hp <= 0 || (e.lastShot ?? -99) < s.tick - f.t - 1) continue;
      const bd = e.kind === 'building' ? BUILDINGS[e.def] : undefined;
      const cx = bd ? e.x + bd.w / 2 : e.x, cy = bd ? e.y + bd.h / 2 : e.y;
      if (Math.abs(cx + Math.cos(e.turret) * 0.45 - f.x) > 0.12 || Math.abs(cy + Math.sin(e.turret) * 0.45 - f.y) > 0.12) continue;
      const [dx, dy] = screenDir(e.turret);
      if (bd) { r = { h: BUILDING_MUZZLE[e.def] ?? 22, w: bd.weapon ? WEAPONS[bd.weapon] : undefined, dx, dy }; break; }
      const d = UNITS[e.def];
      const frame = unitSprites(d.sprite, s.players[e.owner].faction, s.players[e.owner].color)?.body.frame ?? 40;
      const h = d.category === 'infantry' ? (17 * frame) / 40 : 12;
      r = { h: h + (d.air ? AIR_ALTITUDE : 0), w: d.weapon ? WEAPONS[d.weapon] : undefined, dx, dy };
      break;
    }
    this.shooters.set(f, r);
    return r;
  }

  /** Draws one effect; returns false if the caller should use its default drawing. */
  drawEffect(g: CanvasRenderingContext2D, s: GameState, f: Effect, k: number, time: number): boolean {
    const ix = isoX(f.x, f.y), iy = isoY(f.x, f.y);
    switch (f.kind) {
      case 'explosion':
        if (this.dusty.has(f)) { dust(g, ix, iy, k, f.x * 97 + f.y * 13); return true; }
        if (f.color && f.life <= 16) sparks(g, ix, iy - 5, k, f.x * 31 + f.y * 17, f.color, 7); // shell/rocket impact
        return false;
      case 'flash': {
        const sh = this.shooter(s, f);
        muzzle(g, ix, iy - (sh?.h ?? 11), sh?.dx ?? 0, sh?.dy ?? 0, k, f.color, sh && sh.h > 14 && !sh.w?.speed ? 0.8 : 1.4);
        return true;
      }
      case 'tracer':
      case 'beam': {
        const sh = this.shooter(s, f);
        const melee = (sh?.w?.range ?? 9) < 1.5;
        if (melee) { if (f.kind === 'tracer') sparks(g, isoX(f.x2, f.y2), isoY(f.x2, f.y2) - 8, k, f.x2 * 7 + f.y2, '#ffffff', 4); return true; }
        const h = sh?.h ?? (f.kind === 'beam' ? 13 : 9);
        const ax = ix, ay = iy - h, bx = isoX(f.x2, f.y2), by = isoY(f.x2, f.y2) - 8;
        if (f.kind === 'tracer') {
          tracer(g, ax, ay, bx, by, k, f.color);
          muzzle(g, ax, ay, sh?.dx ?? (bx - ax) / (Math.hypot(bx - ax, by - ay) || 1), sh?.dy ?? (by - ay) / (Math.hypot(bx - ax, by - ay) || 1), k, f.color, h < 20 && h > 14 ? 0.7 : 1);
        } else beam(g, ax, ay, bx, by, k, f.color, time, f.x * 53 + f.y * 29);
        return true;
      }
    }
    return false;
  }

  /** Projectile with a ballistic arc (render-only height), glowing shell tracer or rocket with flame + smoke trail. */
  drawProjectile(g: CanvasRenderingContext2D, p: Projectile, time: number) {
    const w = WEAPONS[p.weapon];
    let st = this.starts.get(p);
    if (!st) { st = [p.x, p.y]; this.starts.set(p, st); }
    const total = Math.hypot(p.tx - p.x, p.ty - p.y) + Math.hypot(p.x - st[0], p.y - st[1]) || 1;
    const lob = w.speed < 0.3 ? 7 : w.visual === 'rocket' ? 2.5 : 1.2; // px of arc per tile of range
    const at = (x: number, y: number): [number, number] => {
      const done = Math.hypot(x - st![0], y - st![1]), prog = Math.min(1, done / total);
      return [isoX(x, y), isoY(x, y) - 11 - Math.sin(prog * Math.PI) * Math.min(48, total * lob)];
    };
    const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy) || 1;
    const [hx, hy] = at(p.x, p.y);
    if (w.visual === 'rocket') {
      for (let j = 5; j >= 1; j--) {
        const [sx, sy] = at(p.x - (dx / d) * 0.16 * j, p.y - (dy / d) * 0.16 * j);
        const a = 0.32 * (1 - j / 6);
        g.fillStyle = `rgba(215,212,205,${a})`;
        g.beginPath(); g.arc(sx + Math.sin(time * 9 + j) * 0.8, sy - j * 0.6, 1.6 + j * 0.9, 0, Math.PI * 2); g.fill();
      }
      const [tx, ty] = at(p.x - (dx / d) * 0.1, p.y - (dy / d) * 0.1);
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = 'rgba(255,170,60,0.85)';
      g.beginPath(); g.arc(tx, ty, 2.4 + Math.sin(time * 40) * 0.6, 0, Math.PI * 2); g.fill();
      g.globalCompositeOperation = 'source-over';
      g.strokeStyle = '#d8d8d0'; g.lineWidth = 2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(tx, ty); g.lineTo(hx, hy); g.stroke();
      return;
    }
    const [tx, ty] = at(p.x - (dx / d) * 0.35, p.y - (dy / d) * 0.35);
    g.globalCompositeOperation = 'lighter';
    const grad = g.createLinearGradient(tx, ty, hx, hy);
    grad.addColorStop(0, 'rgba(255,200,90,0)'); grad.addColorStop(1, w.color);
    g.strokeStyle = grad; g.lineWidth = 2.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(tx, ty); g.lineTo(hx, hy); g.stroke();
    g.fillStyle = 'rgba(255,250,220,0.95)';
    g.beginPath(); g.arc(hx, hy, 1.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,210,120,0.25)';
    g.beginPath(); g.arc(hx, hy, 4, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'source-over';
  }
}

/** Animation row for a living unit with a baked animation atlas. */
export function unitRow(r: AnimRows, e: Entity, tick: number, x: number, y: number, stride: number): number {
  if (r.fire && tick - (e.lastShot ?? -99) < 6) return r.fire;
  if (e.x === e.px && e.y === e.py) return r.idle;
  // phase from distance travelled along the facing: feet stay planted and pause with the game
  const along = x * Math.cos(e.facing) + y * Math.sin(e.facing);
  const ph = (((along / stride + e.id * 0.37) % 1) + 1) % 1;
  return r.walk + Math.floor(ph * r.walkN);
}

/** Additive star flash at a barrel tip, stretched along the barrel. */
function muzzle(g: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, k: number, color: string, size: number) {
  if (k > 0.75) return;
  const img = fxImage(), a = 1 - k / 0.75, L = 9 * size, W = 4 * size;
  g.globalCompositeOperation = 'lighter';
  if (img) { g.globalAlpha = a; g.drawImage(img, (FX.flash + 1) * FX.size, 0, FX.size, FX.size, x - L * 0.6, y - L * 0.6, L * 1.2, L * 1.2); }
  g.globalAlpha = a;
  g.fillStyle = color;
  g.beginPath(); g.moveTo(x - dy * W * 0.5, y + dx * W * 0.5); g.lineTo(x + dx * L, y + dy * L); g.lineTo(x + dy * W * 0.5, y - dx * W * 0.5); g.closePath(); g.fill();
  g.fillStyle = '#fffbe8';
  g.beginPath(); g.arc(x, y, 1.6 * size, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
}

/** Bullet streak: a short bright dash travelling muzzle → target, with sparks on arrival. */
function tracer(g: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, k: number, color: string) {
  const p = Math.min(1, k * 1.8), q = Math.max(0, p - 0.35);
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = color; g.lineWidth = 1.3; g.lineCap = 'round'; g.globalAlpha = 0.9;
  g.beginPath(); g.moveTo(ax + (bx - ax) * q, ay + (by - ay) * q); g.lineTo(ax + (bx - ax) * p, ay + (by - ay) * p); g.stroke();
  g.globalAlpha = 0.18 * (1 - k);
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  if (p >= 1) sparks(g, bx, by, (k - 0.55) / 0.45, bx * 7 + by, color, 4);
}

/** Radiating hot sparks (k 0..1). */
function sparks(g: CanvasRenderingContext2D, x: number, y: number, k: number, seed: number, color: string, n: number) {
  if (k < 0 || k > 1) return;
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = color; g.lineWidth = 1; g.globalAlpha = 1 - k;
  g.beginPath();
  for (let j = 0; j < n; j++) {
    const a = hash(seed + j * 7.3) * Math.PI * 2, v = 5 + hash(seed + j * 3.1) * 9;
    const r0 = v * k, r1 = v * k + 2.5;
    const grav = k * k * 6;
    g.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0 * 0.6 + grav);
    g.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * 0.6 + grav);
  }
  g.stroke();
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
}

/** Weapon-specific beams, keyed by beam colour (see data/weapons.ts). */
function beam(g: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, k: number, color: string, time: number, seed: number) {
  const a = 1 - k, len = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / len, ny = (bx - ax) / len;
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round'; g.lineJoin = 'round';
  const stroke = (pts: [number, number][], width: number, style: string, alpha: number) => {
    g.strokeStyle = style; g.lineWidth = width; g.globalAlpha = alpha;
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.stroke();
  };
  const path = (n: number, off: (t: number, i: number) => number): [number, number][] => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= n; i++) { const t = i / n, o = i === 0 || i === n ? 0 : off(t, i); pts.push([ax + (bx - ax) * t + nx * o, ay + (by - ay) * t + ny * o]); }
    return pts;
  };
  if (color === '#7fc8ff') {
    // electric arc: jagged, re-struck every frame, with a forked branch
    const flick = Math.floor(time * 40);
    const n = Math.max(6, Math.round(len / 9));
    const main = path(n, (t, i) => (hash(seed + i * 13 + flick * 101) - 0.5) * 14 * Math.sin(t * Math.PI) + 0.01);
    stroke(main, 6, color, 0.28 * a);
    stroke(main, 2.2, color, 0.9 * a);
    stroke(main, 1, '#ffffff', a);
    const bi = Math.floor(n * (0.3 + hash(seed + flick) * 0.4)), [sx, sy] = main[bi];
    const ex = sx + (hash(seed + flick * 3) - 0.5) * 22, ey = sy + (hash(seed + flick * 5) - 0.2) * 16;
    stroke([[sx, sy], [(sx + ex) / 2 + (hash(flick) - 0.5) * 6, (sy + ey) / 2 + (hash(flick + 1) - 0.5) * 6], [ex, ey]], 1.2, color, 0.8 * a);
    glow(g, bx, by, 9 * a + 3, color, a);
  } else if (color === '#f0a0ff') {
    // mind control: a slow sine tether with rings pulsing along it towards the victim
    const wave = path(Math.max(8, Math.round(len / 6)), (t) => Math.sin(t * 14 - time * 12) * 3 * Math.sin(t * Math.PI));
    stroke(wave, 3, color, 0.35 * a);
    stroke(wave, 1, '#ffe8ff', 0.8 * a);
    for (let j = 0; j < 3; j++) {
      const t = (k * 1.5 + j / 3) % 1, px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
      g.strokeStyle = color; g.lineWidth = 1.3; g.globalAlpha = a * Math.sin(t * Math.PI);
      g.beginPath(); g.ellipse(px, py, 3 + t * 5, (3 + t * 5) / 2, 0, 0, Math.PI * 2); g.stroke();
    }
    g.globalAlpha = a; g.strokeStyle = color; g.lineWidth = 1.5;
    g.beginPath(); g.ellipse(bx, by + 6, 6 + k * 10, 3 + k * 5, 0, 0, Math.PI * 2); g.stroke();
  } else if (color === '#d27bff' || color === '#8a7bff') {
    // psi / magnetic: twin braided waves
    const amp = color === '#8a7bff' ? 4 : 3;
    for (const s of [1, -1]) {
      const w = path(Math.max(8, Math.round(len / 6)), (t) => s * Math.sin(t * 10 + time * 25) * amp * Math.sin(t * Math.PI));
      stroke(w, 3.5, color, 0.3 * a);
      stroke(w, 1.2, '#f4e6ff', 0.85 * a);
    }
    glow(g, bx, by, 7 * a + 3, color, a);
  } else {
    // lasers (prism / refractor / disc): straight hot core with a wide halo
    const line = path(1, () => 0);
    stroke(line, 7 * a + 1, color, 0.3 * a);
    stroke(line, 2.5 * a + 0.8, color, 0.9 * a);
    stroke(line, 1, '#ffffff', a);
    glow(g, ax, ay, 6 * a + 2, color, a);
    glow(g, bx, by, 10 * a + 3, color, a);
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  if (k < 0.6) sparks(g, bx, by, k / 0.6, seed, color, 5);
}

function glow(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a: number) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(255,255,255,${0.9 * a})`); gr.addColorStop(0.35, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalAlpha = a; g.fillStyle = gr;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
}

/** Non-gory infantry death puff: low brownish dust ring + a few pebbles. */
function dust(g: CanvasRenderingContext2D, x: number, y: number, k: number, seed: number) {
  for (let j = 0; j < 4; j++) {
    const a = hash(seed + j) * Math.PI * 2, r = 3 + k * (8 + j * 2);
    g.fillStyle = `rgba(150,136,112,${0.38 * (1 - k)})`;
    g.beginPath(); g.ellipse(x + Math.cos(a) * r * 0.6, y - 2 - k * 5 + Math.sin(a) * r * 0.25, 4 + k * 7, 2.5 + k * 4, 0, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = `rgba(90,80,64,${1 - k})`;
  for (let j = 0; j < 4; j++) {
    const a = hash(seed + j * 5) * Math.PI * 2;
    g.fillRect(x + Math.cos(a) * k * 12, y - 3 + Math.sin(a) * k * 5 - Math.sin(k * Math.PI) * 7, 1.5, 1.5);
  }
}

/** Damaged buildings: smoke columns below 50 % hp, flickering fires below 25 %. */
export function buildingDamage(g: CanvasRenderingContext2D, e: Entity, time: number) {
  const d = BUILDINGS[e.def], f = e.hp / d.hp;
  if (f >= 0.5 || e.built < 1) return;
  const img = fxImage();
  const n = Math.min(3, Math.max(1, Math.round((d.w * d.h) / 3)));
  const top = 14 + Math.min(d.w, d.h) * 6;
  const spot = (j: number): [number, number] => {
    const u = 0.25 + hash(e.id * 11 + j) * 0.5, v = 0.25 + hash(e.id * 23 + j * 3) * 0.5;
    return [isoX(e.x + d.w * u, e.y + d.h * v), isoY(e.x + d.w * u, e.y + d.h * v) - top * (0.6 + hash(e.id + j) * 0.5)];
  };
  const smokeN = f < 0.25 ? n + 1 : n;
  for (let j = 0; j < smokeN; j++) {
    const [sx, sy] = spot(j);
    for (let q = 0; q < 4; q++) {
      const t = (time * 0.45 + q / 4 + hash(e.id + j * 5)) % 1;
      const size = 12 + t * 32, ox = Math.sin(t * 3 + j) * 4 + t * 10; // drifts with the wind
      const alpha = (f < 0.25 ? 0.7 : 0.55) * Math.sin(t * Math.PI);
      if (img) { g.globalAlpha = alpha; g.drawImage(img, (FX.smoke + ((q + j) & 3)) * FX.size, 0, FX.size, FX.size, sx + ox - size / 2, sy - t * 44 - size / 2, size, size); }
      else { g.fillStyle = `rgba(40,40,40,${alpha})`; g.beginPath(); g.arc(sx + ox, sy - t * 44, size / 3, 0, Math.PI * 2); g.fill(); }
    }
  }
  g.globalAlpha = 1;
  if (f >= 0.25) return;
  g.globalCompositeOperation = 'lighter';
  for (let j = 0; j < n + 1; j++) {
    const [fx, fy] = spot(j + 7);
    const fl = Math.floor(time * 12 + j * 3);
    const size = 19 + Math.sin(time * 9 + j) * 3;
    if (img) { g.globalAlpha = 0.9; g.drawImage(img, (FX.fire + (fl & 7)) * FX.size, 0, FX.size, FX.size, fx - size / 2, fy - size * 0.75, size, size); }
    else { g.fillStyle = 'rgba(255,140,40,0.8)'; g.beginPath(); g.arc(fx, fy - 4, 4, 0, Math.PI * 2); g.fill(); }
    for (let q = 0; q < 2; q++) { // embers
      const t = (time * 0.8 + q / 2 + j * 0.3) % 1;
      g.globalAlpha = 1 - t; g.fillStyle = '#ffb347';
      g.fillRect(fx + Math.sin(t * 7 + q * 2 + j) * 5, fy - 6 - t * 26, 1.3, 1.3);
    }
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
}

/** Construction: welding sparks and a glowing seam along the rising edge of the build-up reveal. */
export function constructionFx(g: CanvasRenderingContext2D, e: Entity, edgeY: number, w: number, time: number) {
  const d = BUILDINGS[e.def];
  const cx = isoX(e.x + d.w / 2, e.y + d.h / 2), half = Math.min(w * 0.3, ((d.w + d.h) * TW) / 6);
  g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(cx - half, 0, cx + half, 0);
  gr.addColorStop(0, 'rgba(255,190,90,0)'); gr.addColorStop(0.5, 'rgba(255,220,140,0.55)'); gr.addColorStop(1, 'rgba(255,190,90,0)');
  g.fillStyle = gr; g.fillRect(cx - half, edgeY - 1, half * 2, 2);
  for (let j = 0; j < 3; j++) {
    const t = (time * 2.2 + j / 3 + e.id * 0.1) % 1, sx = cx + (hash(e.id + j + Math.floor(time * 2.2 + j / 3) * 3) - 0.5) * half * 2;
    sparks(g, sx, edgeY, t, e.id * 5 + j + Math.floor(time * 2.2), '#ffd27a', 5);
  }
  g.globalCompositeOperation = 'source-over';
}

const tops = new WeakMap<HTMLCanvasElement, number>();
/** Fraction (0..1) of a baked sprite's height above its topmost opaque pixel (cached per canvas). */
export function spriteTop(c: HTMLCanvasElement): number {
  let t = tops.get(c);
  if (t !== undefined) return t;
  t = 0;
  try {
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let row = 0;
    outer: for (; row < c.height; row++) for (let i = row * c.width * 4 + 3, e = i + c.width * 4; i < e; i += 16) if (d[i] > 24) break outer;
    t = row / c.height;
  } catch { /* tainted or no 2d context: reveal the full height */ }
  tops.set(c, t);
  return t;
}
