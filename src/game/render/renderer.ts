import { BUILDINGS } from '../data/buildings';
import { UNITS } from '../data/units';
import { WEAPONS } from '../data/weapons';
import { AIR_ALTITUDE, BUILD_RADIUS } from '../data/config';
import { isLowPower } from '../systems/economy';
import { settings } from '../../settings';
import { berserk, canSee, disguisedFrom, isAir, rankOf, submerged } from '../systems/combat';
import { FACTIONS } from '../data/factions';
import { TICK_RATE } from '../data/config';
import type { Entity, GameState } from '../types';
import { T } from '../world/map';
import { bakedBuilding, bakedProp, buildingTurret, drawAtlas, FEATHER_SIZE, featherTile, FX, fxImage, pivotOffset, TERRAIN_PRIORITY, texturedTile, unitSprites } from './art';
import { buildingSprite, drawUnit, oreSprite, prop, PROP_ANCHOR, tile } from './assets';
import { drawShores, drawWaterTile } from './water';
import { drawBridgeTile } from './bridge';
import { drawOre, drawOreMine } from './ore';
import { Camera, isoX, isoY, TH, TW } from './iso';
import { buildingDamage, CombatFx, constructionFx, type Corpse, spriteTop, unitRow } from './fx';

export interface ViewState {
  me: number;
  selected: Set<number>;
  hover: number;
  drag: { x0: number; y0: number; x1: number; y1: number } | null; // screen px
  ghost: { def: string; tx: number; ty: number; valid: boolean; cells?: boolean[]; line?: [number, number, boolean][] } | null;
  markers: { x: number; y: number; t: number; color: string; from?: [number, number][] }[]; // t: 0 → 1 over the fade
  floats: { id: number; x: number; y: number; t: number; amount: number }[]; // "+$" over a refinery
  groups?: Map<number, number>; // entity id → control group number
  aim?: { x: number; y: number; r: number; from?: [number, number] } | null; // superweapon target area (world tiles)
}

interface Obj { d: number; e?: Entity; kind?: 'tree' | 'rock'; tx?: number; ty?: number; v?: number; c?: Corpse }

export class Renderer {
  private g: CanvasRenderingContext2D;
  private fx = new CombatFx(); // render-only combat/death effects
  private dust: { x: number; y: number; t0: number; s: number }[] = [];
  private radius: { key: string; mask: Uint8Array } | null = null;
  dpr = 1;
  constructor(private canvas: HTMLCanvasElement) {
    this.g = canvas.getContext('2d')!;
  }

  resize(w: number, h: number) {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  render(s: GameState, cam: Camera, view: ViewState, alpha: number, time: number) {
    const g = this.g, z = cam.zoom * this.dpr;
    const me = s.players[view.me];
    const { w: mw, h: mh } = s.map;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#07090b';
    g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    g.setTransform(z, 0, 0, z, -cam.x * z, -cam.y * z);
    g.imageSmoothingEnabled = true;

    // Visible tile window.
    const L = cam.x, R = cam.x + cam.vw / cam.zoom, Tp = cam.y, B = cam.y + cam.vh / cam.zoom;
    const cs = [cam.toWorld(0, 0), cam.toWorld(cam.vw, 0), cam.toWorld(0, cam.vh), cam.toWorld(cam.vw, cam.vh)];
    const x0 = Math.max(0, Math.floor(Math.min(...cs.map((c) => c[0]))) - 2), x1 = Math.min(mw - 1, Math.ceil(Math.max(...cs.map((c) => c[0]))) + 2);
    const y0 = Math.max(0, Math.floor(Math.min(...cs.map((c) => c[1]))) - 2), y1 = Math.min(mh - 1, Math.ceil(Math.max(...cs.map((c) => c[1]))) + 4);
    const onScreen = (ix: number, iy: number, pad = 0) => ix + TW / 2 + pad >= L && ix - TW / 2 - pad <= R && iy + TH + pad >= Tp && iy - 80 - pad <= B;

    const frame = Math.floor(time * 3) & 3;
    const objs: Obj[] = [];
    const blends: number[] = [], ores: number[] = [], waters: number[] = [], bridges: number[] = [];
    const m = s.map;
    const mines = new Map(m.oreSources.map((o) => [o.i, o]));
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) {
        const ix = isoX(tx, ty), iy = isoY(tx, ty);
        if (!onScreen(ix, iy)) continue;
        const i = ty * mw + tx;
        if (!me.explored[i]) continue;
        const t = m.terrain[i];
        const v = t === T.Water || t === T.Bridge ? (m.deco[i] + frame) & 3 : m.deco[i] & 3;
        const base = t === T.Tree ? T.Grass : t;
        const wet = t === T.Water || t === T.Bridge;
        if (wet) waters.push(i);
        if (t === T.Bridge) bridges.push(i);
        if (!(wet && drawWaterTile(g, m, tx, ty, ix, iy, time)))
          g.drawImage((wet ? null : texturedTile(base, tx, ty)) ?? tile(wet ? T.Water : t === T.Rock ? T.Rock : base, v), ix - TW / 2 - 0.5, iy - 0.5, TW + 1, TH + 1);
        // Soft transition: this tile bleeds over lower-priority neighbours.
        const pr = TERRAIN_PRIORITY[base];
        if ((tx > 0 && TERRAIN_PRIORITY[m.terrain[i - 1]] < pr) || (tx < mw - 1 && TERRAIN_PRIORITY[m.terrain[i + 1]] < pr) ||
            (ty > 0 && TERRAIN_PRIORITY[m.terrain[i - mw]] < pr) || (ty < mh - 1 && TERRAIN_PRIORITY[m.terrain[i + mw]] < pr)) blends.push(i);
        if (m.ore[i]) ores.push(i);
        if (t === T.Tree || t === T.Rock) objs.push({ d: tx + ty + 1, kind: t === T.Tree ? 'tree' : 'rock', tx, ty, v: m.deco[i] & 3 });
      }

    blends.sort((a, b) => TERRAIN_PRIORITY[m.terrain[a]] - TERRAIN_PRIORITY[m.terrain[b]]);
    const fw = TW * FEATHER_SIZE, fh = TH * FEATHER_SIZE;
    g.save();
    g.beginPath(); // keep soft transitions inside the map
    g.moveTo(isoX(0, 0), isoY(0, 0)); g.lineTo(isoX(mw, 0), isoY(mw, 0)); g.lineTo(isoX(mw, mh), isoY(mw, mh)); g.lineTo(isoX(0, mh), isoY(0, mh));
    g.clip();
    for (const i of blends) {
      const tx = i % mw, ty = (i / mw) | 0, t = m.terrain[i];
      const c = featherTile(t === T.Tree ? T.Grass : t, tx, ty);
      if (c) g.drawImage(c, isoX(tx + 0.5, ty + 0.5) - fw / 2, isoY(tx + 0.5, ty + 0.5) - fh / 2, fw, fh);
    }
    g.restore();
    drawShores(g, m, waters, time);
    for (const i of bridges) {
      const tx = i % mw, ty = (i / mw) | 0;
      if (!drawBridgeTile(g, m, tx, ty, isoX(tx, ty), isoY(tx, ty))) g.drawImage(tile(T.Bridge, m.deco[i] & 3), isoX(tx, ty) - TW / 2 - 0.5, isoY(tx, ty) - 0.5, TW + 1, TH + 1);
    }
    for (const i of ores) {
      const tx = i % mw, ty = (i / mw) | 0;
      if (!drawOre(g, m, i, tx, ty, isoX(tx, ty), isoY(tx, ty), time)) g.drawImage(oreSprite(m.ore[i] >= 220 ? 3 : m.ore[i] >= 100 ? 2 : 1, !!m.gem[i], m.deco[i] & 3), isoX(tx, ty) - TW / 2, isoY(tx, ty) - 8, TW, TH + 8);
    }

    // Map border fades out on the ground layer only: buildings and units near the edge stay untouched.
    this.edgeFade(mw, mh);

    // Ground hazards: poison clouds, radiation fields of deployed Blight Troopers.
    for (const h of s.hazards ?? []) if (me.visible[Math.floor(h.y) * mw + Math.floor(h.x)]) this.haze(h.x, h.y, WEAPONS[h.weapon].range, h.weapon === 'lightning' ? 'rgba(150,170,220,' : 'rgba(140,240,90,', time);
    for (const e of s.entities) if (e.deployed && !e.inside && me.visible[Math.floor(e.y) * mw + Math.floor(e.x)]) this.haze(e.x, e.y, WEAPONS.radField.range, 'rgba(190,255,60,', time);

    // Bonus crates.
    for (const c of s.crates ?? []) {
      if (!me.visible[Math.floor(c.y) * mw + Math.floor(c.x)]) continue;
      const cx = isoX(c.x, c.y), cy = isoY(c.x, c.y) - Math.abs(Math.sin(time * 3 + c.x)) * 2, b = bakedProp('prop.crate');
      if (b) g.drawImage(b.c, cx - b.ax, cy - b.ay, b.w, b.h);
      else {
        g.fillStyle = '#8a6a3a'; g.fillRect(cx - 7, cy - 12, 14, 12);
        g.strokeStyle = '#ffd23a'; g.lineWidth = 1.5; g.strokeRect(cx - 7, cy - 12, 14, 12);
        g.beginPath(); g.moveTo(cx - 7, cy - 12); g.lineTo(cx + 7, cy); g.moveTo(cx + 7, cy - 12); g.lineTo(cx - 7, cy); g.stroke();
      }
    }

    // Entities (respecting fog: enemy units only when visible, buildings once seen).
    this.fx.begin(s);
    for (const e of s.entities) {
      if (e.inside) continue;
      if (e.owner !== view.me) {
        if (e.kind === 'unit' && !canSee(s, view.me, e)) continue; // fog, submerged subs
        if (e.kind === 'building' && !(e.seenBy & (1 << view.me))) continue;
      }
      if (e.kind === 'building') {
        const d = BUILDINGS[e.def];
        if (d.bridge) continue; // drawn as terrain (render/bridge.ts)
        if (!onScreen(isoX(e.x + d.w / 2, e.y + d.h / 2), isoY(e.x + d.w / 2, e.y + d.h / 2), 96)) continue;
        objs.push({ d: e.x + e.y + (d.w + d.h) / 2, e });
      } else {
        const x = e.px + (e.x - e.px) * alpha, y = e.py + (e.y - e.py) * alpha;
        if (!onScreen(isoX(x, y), isoY(x, y), 30)) continue;
        // Aircraft above everything; parked on a pad, just after its airfield (the back pad would sort behind it).
        const pad = e.landed && e.pad ? s.rt.byId.get(e.pad) : undefined;
        objs.push({ d: pad ? pad.x + pad.y + (BUILDINGS[pad.def].w + BUILDINGS[pad.def].h) / 2 + 0.01 : x + y + (isAir(e) ? 1e4 : 0), e });
        if (UNITS[e.def].category === 'infantry') this.fx.track(e);
      }
    }
    this.fx.end(s, time);
    for (const c of this.fx.corpses) if (me.visible[Math.floor(c.y) * mw + Math.floor(c.x)]) objs.push({ d: c.x + c.y - 0.05, c });
    objs.sort((a, b) => a.d - b.d);
    // Aircraft ground shadows go under all objects.
    for (const o of objs) {
      if (!o.e || o.e.kind !== 'unit' || !UNITS[o.e.def].air) continue;
      const e = o.e, x = e.px + (e.x - e.px) * alpha, y = e.py + (e.y - e.py) * alpha, r = UNITS[e.def].radius * 34;
      g.fillStyle = 'rgba(0,0,0,0.28)';
      g.beginPath(); g.ellipse(isoX(x, y), isoY(x, y), r, r / 2, 0, 0, Math.PI * 2); g.fill();
    }

    for (const o of objs) {
      if (o.c) this.fx.drawCorpse(g, o.c, time);
      else if (o.kind) {
        const ix = isoX(o.tx! + 0.5, o.ty! + 0.5), iy = isoY(o.tx! + 0.5, o.ty! + 0.5);
        const mine = o.kind === 'rock' ? mines.get(o.ty! * mw + o.tx!) : undefined;
        if (mine && drawOreMine(g, m, mine, ix, iy, time)) continue;
        const b = bakedProp(`prop.${o.kind}.${o.v}`);
        if (b) g.drawImage(b.c, ix - b.ax, iy - b.ay, b.w, b.h);
        else g.drawImage(prop(o.kind, o.v!), ix - PROP_ANCHOR[0], iy - PROP_ANCHOR[1], 48, 60);
      } else if (o.e!.kind === 'building') this.drawBuilding(s, o.e!, view, time);
      else this.drawUnitEntity(s, o.e!, view, alpha, time);
      const e = o.e;
      if (e && (e.stasisUntil ?? 0) > s.tick) { // Stasis Projector: red shimmer
        const big = e.kind === 'building', cx = big ? e.x + BUILDINGS[e.def].w / 2 : e.px + (e.x - e.px) * alpha, cy = big ? e.y + BUILDINGS[e.def].h / 2 : e.py + (e.y - e.py) * alpha;
        const r = big ? (BUILDINGS[e.def].w + BUILDINGS[e.def].h) * 9 : 14;
        g.strokeStyle = `rgba(255,60,50,${0.55 + 0.3 * Math.sin(time * 8)})`; g.lineWidth = 2.5;
        g.beginPath(); g.ellipse(isoX(cx, cy), isoY(cx, cy) - r * 0.5, r, r * 0.75, 0, 0, Math.PI * 2); g.stroke();
      }
    }

    this.drawProjectilesAndEffects(s, view, time);

    // Fog of war.
    // Runs of equal fog state along a tile row merge into one parallelogram (far fewer subpaths than one
    // diamond per tile: the shroud fill was the most expensive part of a zoomed-out frame).
    // Shroud grows ~1 px past the tile edge: water (drawWaterTile grows 0.6/1.2 px), shore foam (fades out
    // ~0.7 px past the edge) and terrain tiles overdraw slightly and must not peek through.
    g.beginPath();
    const dim = new Path2D();
    const run = (q: Path2D | CanvasRenderingContext2D, a: number, b: number, ty: number, ey: number, ex: number) => {
      q.moveTo(isoX(a, ty), isoY(a, ty) - ey); q.lineTo(isoX(b + 1, ty) + ex, isoY(b + 1, ty));
      q.lineTo(isoX(b + 1, ty + 1), isoY(b + 1, ty + 1) + ey); q.lineTo(isoX(a, ty + 1) - ex, isoY(a, ty + 1)); q.closePath();
    };
    for (let ty = y0; ty <= y1; ty++) {
      let start = x0, state = -1;
      for (let tx = x0; tx <= x1 + 1; tx++) {
        const i = ty * mw + tx;
        const st = tx > x1 ? -1 : me.visible[i] ? 0 : me.explored[i] ? 1 : 2;
        if (st === state) continue;
        if (state === 1) run(dim, start, tx - 1, ty, 0.6, 0.8);
        else if (state === 2) run(g, start, tx - 1, ty, 1.15, 2.3);
        state = st; start = tx;
      }
    }
    g.fillStyle = '#07090b';
    g.fill();
    g.fillStyle = 'rgba(7,9,11,0.5)';
    g.fill(dim);

    this.drawOverlays(s, view);

    if (view.drag) {
      g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const { x0: a, y0: b, x1: c, y1: d } = view.drag;
      g.strokeStyle = '#8cf57a'; g.lineWidth = 1; g.fillStyle = 'rgba(140,245,122,0.08)';
      g.fillRect(Math.min(a, c), Math.min(b, d), Math.abs(c - a), Math.abs(d - b));
      g.strokeRect(Math.min(a, c) + 0.5, Math.min(b, d) + 0.5, Math.abs(c - a), Math.abs(d - b));
    }
  }

  private drawBuilding(s: GameState, e: Entity, view: ViewState, time: number) {
    const g = this.g;
    const d = BUILDINGS[e.def];
    const p = s.players[e.owner];
    const sp = bakedBuilding(d.sprite, p.faction, p.color) ?? buildingSprite(e.def, p.faction, p.color);
    const ix = isoX(e.x, e.y) - sp.ox, iy = isoY(e.x, e.y) - sp.oy;
    const off = !!d.needsPower && e.built >= 1 && isLowPower(s, e.owner);
    if (e.built < 1) {
      // Build-up: reveal the model (not the empty headroom above it) bottom-up with a scaffold outline.
      const vis = sp.h * (1 - spriteTop(sp.c)) * e.built;
      g.save();
      g.beginPath(); g.rect(ix, iy + sp.h - vis, sp.w, vis); g.clip();
      g.globalAlpha = 0.85;
      g.drawImage(sp.c, ix, iy, sp.w, sp.h);
      g.restore();
      this.footprint(e.x, e.y, d.w, d.h, 'rgba(255,220,120,0.7)', false);
      constructionFx(g, e, iy + sp.h - vis, sp.w, time);
    } else {
      g.drawImage(off ? dimmed(sp.c) : sp.c, ix, iy, sp.w, sp.h);
    }
    const bt = d.weapon && e.built >= 1 ? buildingTurret(d.sprite, p.faction, p.color) : undefined;
    if (bt) drawAtlas(g, bt.body, e.turret, isoX(e.x + 0.5, e.y + 0.5), isoY(e.x + 0.5, e.y + 0.5));
    else if (d.weapon && e.built >= 1) {
      // turret barrel
      const cx = isoX(e.x + 0.5, e.y + 0.5), cy = isoY(e.x + 0.5, e.y + 0.5) - 38;
      const dx = Math.cos(e.turret), dy = Math.sin(e.turret);
      g.strokeStyle = '#1d1d1d'; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + ((dx - dy) * TW) / 2 * 0.45, cy + ((dx + dy) * TH) / 2 * 0.45); g.stroke();
    }
    if (e.passengers?.length && d.garrison) {
      // Garrison pips: one lit per occupant.
      const cx = isoX(e.x + d.w / 2, e.y + d.h / 2), cy = isoY(e.x, e.y) - 46;
      for (let k = 0; k < d.garrison; k++) {
        g.fillStyle = k < e.passengers.length ? p.color : 'rgba(0,0,0,0.5)';
        g.fillRect(cx - d.garrison * 3 + k * 6, cy, 4, 4);
      }
    }
    if (e.repairing) { // wrench
      const cx = isoX(e.x + d.w / 2, e.y + d.h / 2), cy = isoY(e.x, e.y) - 30 - Math.sin(time * 4) * 3;
      g.fillStyle = 'rgba(20,30,20,0.85)'; g.beginPath(); g.arc(cx, cy, 9, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#6ee05a'; g.lineWidth = 2.5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - 4.5, cy + 4.5); g.lineTo(cx + 1, cy - 1); g.stroke();
      g.beginPath(); g.arc(cx + 2.5, cy - 2.5, 3, Math.PI * 0.95, Math.PI * 2.55); g.stroke();
    }
    if (off) { // low power: dimmed, a blinking bolt, and defences say they are down
      const cx = isoX(e.x + d.w / 2, e.y + d.h / 2), cy = isoY(e.x, e.y) - 22;
      if (Math.floor(time * 2) % 2) {
        g.fillStyle = '#ffd23a'; g.strokeStyle = '#0b0d0f'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(cx + 2, cy - 9); g.lineTo(cx - 5, cy + 1); g.lineTo(cx - 0.5, cy + 1); g.lineTo(cx - 2, cy + 9); g.lineTo(cx + 5, cy - 1); g.lineTo(cx + 0.5, cy - 1); g.closePath();
        g.stroke(); g.fill();
      }
      if (d.weapon) label(g, 'OFFLINE', cx, cy + 20, '#ff6a50');
    }
    if (e.rallyX >= 0 && e.owner === view.me && view.selected.has(e.id)) { // rally line and flag, only while selected
      const rx = isoX(e.rallyX, e.rallyY), ry = isoY(e.rallyX, e.rallyY), ey = e.up ? e.y : e.y + d.h;
      g.strokeStyle = 'rgba(224,169,44,0.8)'; g.setLineDash([4, 4]); g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(isoX(e.x + d.w / 2, ey), isoY(e.x + d.w / 2, ey)); g.lineTo(rx, ry); g.stroke(); g.setLineDash([]);
      const wave = Math.sin(time * 5 + e.id) * 1.5;
      g.fillStyle = '#0b0d0f'; g.fillRect(rx - 1.5, ry - 17, 3, 18);
      g.fillStyle = '#e0a92c'; g.fillRect(rx - 0.5, ry - 16, 1, 16);
      g.fillStyle = p.color; g.strokeStyle = '#0b0d0f'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(rx + 0.5, ry - 16); g.quadraticCurveTo(rx + 5, ry - 17 + wave, rx + 10, ry - 14 + wave); g.lineTo(rx + 0.5, ry - 10); g.closePath(); g.fill(); g.stroke();
    }
    buildingDamage(g, e, time);
  }

  private footprint(x: number, y: number, w: number, h: number, color: string, fill: boolean, lw = 1.5) {
    const g = this.g;
    g.beginPath();
    g.moveTo(isoX(x, y), isoY(x, y)); g.lineTo(isoX(x + w, y), isoY(x + w, y));
    g.lineTo(isoX(x + w, y + h), isoY(x + w, y + h)); g.lineTo(isoX(x, y + h), isoY(x, y + h)); g.closePath();
    if (fill) { g.fillStyle = color; g.fill(); } else { g.strokeStyle = color; g.lineWidth = lw; g.stroke(); }
  }

  /** Pulsing translucent ground disc (tile-space radius r). */
  private haze(x: number, y: number, r: number, rgba: string, time: number) {
    const g = this.g, ix = isoX(x, y), iy = isoY(x, y), rx = (r * TW) / Math.SQRT2, ry = (r * TH) / Math.SQRT2;
    const grad = g.createRadialGradient(ix, iy, 0, ix, iy, rx);
    const a = 0.22 + 0.06 * Math.sin(time * 3 + x);
    grad.addColorStop(0, `${rgba}${a})`); grad.addColorStop(1, `${rgba}0)`);
    g.fillStyle = grad;
    g.beginPath(); g.ellipse(ix, iy, rx, ry, 0, 0, Math.PI * 2); g.fill();
  }

  private drawUnitEntity(s: GameState, e: Entity, view: ViewState, alpha: number, time: number) {
    const g = this.g;
    // Enemy spies look like the viewer's own basic infantry.
    const fake = disguisedFrom(s, e, view.me);
    if (fake && UNITS[e.def].mimic) {
      // Shroud Tank: the enemy sees just another tree.
      const b = bakedProp(`prop.tree.${e.id & 3}`), tx = isoX(e.x, e.y), ty = isoY(e.x, e.y);
      if (b) g.drawImage(b.c, tx - b.ax, ty - b.ay, b.w, b.h);
      else g.drawImage(prop('tree', e.id & 3), tx - PROP_ANCHOR[0], ty - PROP_ANCHOR[1], 48, 60);
      return;
    }
    const d = UNITS[fake ? FACTIONS[s.players[view.me].faction].roster.infAI : e.def];
    const p = s.players[fake ? view.me : e.owner];
    const x = e.px + (e.x - e.px) * alpha, y = e.py + (e.y - e.py) * alpha;
    const ix = isoX(x, y);
    const iy = isoY(x, y);
    if (d.category === 'infantry' && (view.selected.has(e.id) || d.hero)) { // vehicles, ships and aircraft get corner brackets (drawOverlays)
      const r = d.hero ? 9 : 7;
      g.strokeStyle = d.hero ? `rgba(255,210,58,${view.selected.has(e.id) ? 0.95 : 0.45})` : e.owner === view.me ? 'rgba(140,245,122,0.9)' : 'rgba(255,138,112,0.9)'; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(ix, iy, r, r / 2, 0, 0, Math.PI * 2); g.stroke();
    }
    const phased = (e.phased ?? 0) > 0, frozen = (e.frozenUntil ?? 0) > s.tick;
    if (phased || frozen) g.globalAlpha = phased ? 0.45 + 0.4 * (1 - e.phased! / Math.max(1, e.hp)) : 0.75;
    if (submerged(s, e)) g.globalAlpha = 0.45; // under water (enemies only see it when detected)
    this.drawUnitBody(s, e, d, p, ix, iy, x, y, time);
    g.globalAlpha = 1;
    if (d.category !== 'infantry' && !d.air && !d.move && (e.x !== e.px || e.y !== e.py) && Math.random() < 0.25 && this.dust.length < 240)
      this.dust.push({ x: x - Math.cos(e.facing) * 0.35, y: y - Math.sin(e.facing) * 0.35, t0: time, s: 0.7 + Math.random() * 0.6 });
    if (phased || frozen) {
      g.strokeStyle = `rgba(${d.move === 'water' && !phased ? '96,255,176' : '127,245,255'},${0.5 + 0.3 * Math.sin(time * 10)})`; g.lineWidth = 2; // ships: held by a Kraken
      g.beginPath(); g.ellipse(ix, iy - 8, 11, 14, 0, 0, Math.PI * 2); g.stroke();
    }
    if (berserk(s, e)) {
      g.fillStyle = `rgba(216,224,96,${0.5 + 0.4 * Math.sin(time * 12)})`;
      g.beginPath(); g.arc(ix - 6, iy - 20, 3, 0, Math.PI * 2); g.fill();
    }
    if (e.leechBy !== undefined) {
      g.strokeStyle = '#ff5040'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(ix, iy - 12, 5 + Math.sin(time * 9) * 1.5, 0, Math.PI * 2); g.stroke();
    }
    if (e.bombAt && e.bombAt > s.tick) {
      const left = (e.bombAt - s.tick) / TICK_RATE;
      g.fillStyle = Math.floor(time * (left < 2 ? 8 : 3)) % 2 ? '#ff3a20' : '#5a1008';
      g.beginPath(); g.arc(ix + 6, iy - 18, 3, 0, Math.PI * 2); g.fill();
    }
  }

  private drawUnitBody(s: GameState, e: Entity, d: (typeof UNITS)[string], p: GameState['players'][number], ix: number, iyIn: number, x: number, y: number, time: number) {
    const g = this.g;
    let iy = iyIn;
    const u = unitSprites(d.sprite, p.faction, p.color);
    if (d.air) iy -= !isAir(e) ? 4 : AIR_ALTITUDE + Math.sin(time * 2 + e.id) * 1.5;
    if (u) {
      const rows = u.body.rows; // baked walk/fire cycle (infantry, dog); others keep the bob
      const bob = !rows && d.category === 'infantry' && (e.x !== e.px || e.y !== e.py) ? Math.abs(Math.sin(time * 12 + e.id)) * 1.5 : 0;
      drawAtlas(g, u.body, e.facing, ix, iy - bob, rows ? unitRow(rows, e, s.tick, x, y, d.sprite === 'unit.dog' ? 0.75 : 1.1) : 0);
      if (u.turret) {
        // short recoil kick along the barrel right after a shot
        const kick = Math.max(0, 4 - (s.tick - (e.lastShot ?? -99))) * 0.6;
        const [ox, oy] = pivotOffset(u, e.facing);
        const rx = -((Math.cos(e.turret) - Math.sin(e.turret)) * kick), ry = -((Math.cos(e.turret) + Math.sin(e.turret)) * kick) / 2;
        drawAtlas(g, u.turret, e.turret, ix + ox + rx, iy + oy + ry);
      }
      return;
    }
    drawUnit(g, d.sprite, ix, iy, { facing: e.facing, turret: e.turret, team: p.color, faction: p.faction, cargo: e.cargo, moving: e.x !== e.px || e.y !== e.py, time, id: e.id });
  }

  private drawProjectilesAndEffects(s: GameState, view: ViewState, time: number) {
    const g = this.g;
    const vis = s.players[view.me].visible;
    const seen = (x: number, y: number) => vis[Math.floor(y) * s.map.w + Math.floor(x)] === 1;
    for (const p of s.projectiles) {
      if (!seen(p.x, p.y)) continue;
      if (fxImage()) { this.fx.drawProjectile(g, p, time); continue; }
      const w = WEAPONS[p.weapon];
      const ix = isoX(p.x, p.y), iy = isoY(p.x, p.y) - 11;
      if (w.visual === 'rocket') {
        const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy) || 1;
        const bx = isoX(p.x - (dx / d) * 0.6, p.y - (dy / d) * 0.6), by = isoY(p.x - (dx / d) * 0.6, p.y - (dy / d) * 0.6) - 11;
        const grad = g.createLinearGradient(bx, by, ix, iy);
        grad.addColorStop(0, 'rgba(200,200,200,0)'); grad.addColorStop(1, 'rgba(230,230,230,0.7)');
        g.strokeStyle = grad; g.lineWidth = 3; g.beginPath(); g.moveTo(bx, by); g.lineTo(ix, iy); g.stroke();
      }
      g.fillStyle = w.color;
      g.beginPath(); g.arc(ix, iy, 2.2, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.25)';
      g.beginPath(); g.arc(ix, iy, 4.5, 0, Math.PI * 2); g.fill();
    }
    this.dust = this.dust.filter((p) => time - p.t0 < 0.8);
    for (const p of this.dust) {
      if (!seen(p.x, p.y)) continue;
      const k = (time - p.t0) / 0.8;
      g.fillStyle = `rgba(178,160,124,${0.38 * (1 - k)})`;
      g.beginPath(); g.ellipse(isoX(p.x, p.y), isoY(p.x, p.y) - 2 - k * 4, (3 + k * 7) * p.s, (2 + k * 4) * p.s, 0, 0, Math.PI * 2); g.fill();
    }
    for (const f of s.effects) {
      if (f.t < 0 || !seen(f.x, f.y)) continue;
      const k = f.t / f.life;
      const ix = isoX(f.x, f.y), iy = isoY(f.x, f.y);
      const fx = fxImage();
      if (fx && this.fx.drawEffect(g, s, f, k, time)) continue;
      if (fx && (f.kind === 'explosion' || f.kind === 'bigExplosion' || f.kind === 'smoke')) { this.drawFx(fx, f.kind, k, ix, iy, (f.x * 131 + f.y * 71) | 0); continue; }
      switch (f.kind) {
        case 'explosion':
        case 'bigExplosion': {
          const big = f.kind === 'bigExplosion' ? 1.9 : 1;
          const r = (5 + k * 12) * big;
          g.fillStyle = `rgba(60,55,50,${0.5 * (1 - k)})`;
          g.beginPath(); g.arc(ix, iy - 6 - k * 10 * big, r * 1.1, 0, Math.PI * 2); g.fill();
          g.fillStyle = `rgba(255,${Math.floor(200 - k * 140)},60,${1 - k})`;
          g.beginPath(); g.arc(ix, iy - 5, r * (1 - k * 0.5), 0, Math.PI * 2); g.fill();
          g.fillStyle = `rgba(255,250,210,${Math.max(0, 1 - k * 2.5)})`;
          g.beginPath(); g.arc(ix, iy - 5, r * 0.45, 0, Math.PI * 2); g.fill();
          if (big > 1)
            for (let j = 0; j < 6; j++) {
              const a = j * 1.05 + f.x * 3;
              g.fillStyle = `rgba(50,40,30,${1 - k})`;
              g.fillRect(ix + Math.cos(a) * k * 30, iy - 5 + Math.sin(a) * k * 14 - Math.sin(k * Math.PI) * 18, 2.5, 2.5);
            }
          break;
        }
        case 'flash':
          g.fillStyle = `rgba(255,240,180,${1 - k})`;
          g.beginPath(); g.arc(ix, iy - 11, 5 * (1 - k) + 2, 0, Math.PI * 2); g.fill();
          break;
        case 'tracer':
        case 'beam': {
          const jx = isoX(f.x2, f.y2), jy = isoY(f.x2, f.y2);
          const beam = f.kind === 'beam';
          g.strokeStyle = f.color; g.globalAlpha = 1 - k; g.lineWidth = beam ? 3.5 * (1 - k) + 1 : 1.2;
          g.beginPath(); g.moveTo(ix, iy - (beam ? 13 : 9));
          if (beam) g.quadraticCurveTo((ix + jx) / 2 + Math.sin(time * 40) * 6, (iy + jy) / 2 - 20, jx, jy - 8);
          else g.lineTo(jx, jy - 8);
          g.stroke();
          g.globalAlpha = 1;
          break;
        }
        case 'wave': {
          const r = f.x2 * (0.3 + 0.7 * k), rx = (r * TW) / Math.SQRT2, ry = (r * TH) / Math.SQRT2;
          g.strokeStyle = f.color; g.globalAlpha = 1 - k; g.lineWidth = 4 * (1 - k) + 1;
          g.beginPath(); g.ellipse(ix, iy, rx, ry, 0, 0, Math.PI * 2); g.stroke();
          g.globalAlpha = 1;
          break;
        }
        case 'smoke':
          for (let j = 0; j < 4; j++) {
            const t = (k * 3 + j / 4) % 1;
            g.fillStyle = `rgba(45,45,45,${0.4 * (1 - t) * (1 - k)})`;
            g.beginPath(); g.arc(ix + Math.sin(j * 1.7) * 10, iy - 10 - t * 40, 6 + t * 12, 0, Math.PI * 2); g.fill();
          }
          break;
      }
    }
  }

  /** Sprite-based explosions: flash → additive fire puffs → rising black smoke. */
  private drawFx(img: HTMLImageElement, kind: 'explosion' | 'bigExplosion' | 'smoke', k: number, x: number, y: number, seed: number) {
    const g = this.g;
    const S = FX.size;
    const puff = (frame: number, px: number, py: number, size: number, alpha: number, add: boolean) => {
      if (alpha <= 0.01) return;
      g.globalAlpha = Math.min(1, alpha);
      g.globalCompositeOperation = add ? 'lighter' : 'source-over';
      g.drawImage(img, frame * S, 0, S, S, px - size / 2, py - size / 2, size, size);
    };
    const r = (n: number) => ((seed * (n + 7) * 2654435761) >>> 0) / 4294967296;
    if (kind === 'smoke') {
      for (let j = 0; j < 4; j++) {
        const t = (k * 3 + j / 4) % 1;
        puff(FX.smoke + (j % 4), x + (r(j) - 0.5) * 18, y - 12 - t * 46, 22 + t * 30, 0.55 * (1 - t) * (1 - k), false);
      }
    } else {
      const big = kind === 'bigExplosion' ? 1.9 : 1;
      puff(FX.smoke + (seed & 3), x + (r(1) - 0.5) * 8, y - 8 - k * 26 * big, (18 + k * 34) * big, 0.7 * Math.sin(k * Math.PI), false);
      for (let j = 0; j < (big > 1 ? 3 : 2); j++)
        puff(FX.fire + ((seed + j) & 7), x + (r(j + 2) - 0.5) * 16 * big, y - 6 - r(j + 5) * 8 * big, (12 + k * 26) * big, (1 - k) * 1.1, true);
      puff(FX.flash + (seed & 3), x, y - 6, 24 * big * (0.6 + k), 1 - k * 2.5, true);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }

  private drawOverlays(s: GameState, view: ViewState) {
    const g = this.g;
    const me = s.players[view.me];
    const ring = (cx: number, cy: number, r: number, color: string, dash?: number[]) => {
      g.strokeStyle = color; g.lineWidth = 2; if (dash) g.setLineDash(dash); g.beginPath();
      for (let k = 0; k <= 48; k++) { const a = (k / 48) * Math.PI * 2, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (k) g.lineTo(isoX(x, y), isoY(x, y)); else g.moveTo(isoX(x, y), isoY(x, y)); }
      g.stroke(); g.setLineDash([]);
    };
    // Placement: where the base may grow, the ghost, a green/red cell grid and the defence's reach.
    if (view.ghost) {
      const { def, line } = view.ghost;
      const d = BUILDINGS[def];
      this.buildRadius(s, view.me);
      const sp = bakedBuilding(d.sprite, me.faction, me.color) ?? buildingSprite(def, me.faction, me.color);
      for (const [tx, ty, valid] of line ?? [[view.ghost.tx, view.ghost.ty, view.ghost.valid] as [number, number, boolean]]) {
        g.globalAlpha = 0.55;
        g.drawImage(sp.c, isoX(tx, ty) - sp.ox, isoY(tx, ty) - sp.oy, sp.w, sp.h);
        g.globalAlpha = 1;
        let k = 0;
        for (let y = ty; y < ty + d.h; y++)
          for (let x = tx; x < tx + d.w; x++) {
            const ok = valid && (line ? true : view.ghost.cells?.[k++] ?? true);
            this.footprint(x, y, 1, 1, ok ? 'rgba(80,230,100,0.32)' : 'rgba(240,60,50,0.45)', true);
            this.footprint(x, y, 1, 1, ok ? 'rgba(140,255,150,0.55)' : 'rgba(255,110,90,0.7)', false, 1);
          }
      }
      if (d.weapon && !line) ring(view.ghost.tx + d.w / 2, view.ghost.ty + d.h / 2, WEAPONS[d.weapon].range, 'rgba(235,240,225,0.55)', [6, 5]);
    }
    // Superweapon aim: target circle (Phase Gate: also the picked group and a line to the destination).
    if (view.aim) {
      const a = view.aim;
      ring(a.x, a.y, a.r, 'rgba(255,80,60,0.9)');
      if (a.from) {
        ring(a.from[0], a.from[1], a.r, 'rgba(127,245,255,0.9)');
        g.setLineDash([6, 6]); g.beginPath(); g.moveTo(isoX(a.from[0], a.from[1]), isoY(a.from[0], a.from[1])); g.lineTo(isoX(a.x, a.y), isoY(a.x, a.y)); g.stroke(); g.setLineDash([]);
      }
    }
    // Command markers and order lines (green move, red attack, yellow guard/capture), fading out together.
    for (const mk of view.markers) {
      const k = mk.t;
      const ix = isoX(mk.x, mk.y), iy = isoY(mk.x, mk.y);
      g.strokeStyle = mk.color; g.lineWidth = 1.25; g.globalAlpha = (1 - k) * 0.75;
      for (const [fx, fy] of mk.from ?? []) {
        g.beginPath(); g.moveTo(isoX(fx, fy), isoY(fx, fy)); g.lineTo(ix, iy); g.stroke();
        g.fillStyle = mk.color; g.fillRect(isoX(fx, fy) - 1.5, isoY(fx, fy) - 1.5, 3, 3);
      }
      g.globalAlpha = 1 - k; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(ix, iy, 6 + k * 12, 3 + k * 6, 0, 0, Math.PI * 2); g.stroke();
      g.globalAlpha = 1;
    }
    const hpCol = settings.get().colorblind ? ['#56b4e9', '#f0e442', '#d55e00'] : ['#57d34a', '#e8c53a', '#e2452f']; // colour-blind: blue / yellow / vermillion
    // Health: segmented pips (colour and number of lit segments both tell the state; enemy bars are striped),
    // corner brackets around selected vehicles and buildings, veterancy chevrons and the control group.
    for (const e of s.entities) {
      const sel = view.selected.has(e.id);
      const show = sel || view.hover === e.id || s.tick - e.lastHit < 90 || !!e.mcBy || rankOf(e) > 0;
      if (!show || e.inside || e.ruined || (UNITS[e.def]?.mimic && disguisedFrom(s, e, view.me))) continue;
      if (e.owner !== view.me) {
        if (e.kind === 'unit' && !canSee(s, view.me, e)) continue;
        if (e.kind === 'building' && !(e.seenBy & (1 << view.me))) continue;
      }
      let ix: number, iy: number, w: number, max: number, n: number, hp = e.hp;
      const bracket = sel ? (e.owner === view.me ? 'rgba(236,246,228,0.95)' : 'rgba(255,138,112,0.95)') : '';
      if (e.kind === 'building') {
        const d = BUILDINGS[e.def];
        ix = isoX(e.x + d.w / 2, e.y + d.h / 2); w = Math.max(24, (d.w + d.h) * 11); max = d.hp; n = Math.min(14, Math.max(6, Math.round(w / 5)));
        if (d.bridge) { iy = isoY(e.x, e.y) - 10; hp = s.rt.byId.get(e.link ?? 0)?.hp ?? e.hp; w = 40; n = 8; } // the span's shared health
        else {
          const p = s.players[e.owner], sp = bakedBuilding(d.sprite, p.faction, p.color) ?? buildingSprite(e.def, p.faction, p.color);
          const top = Math.min(isoY(e.x, e.y) - 24, isoY(e.x, e.y) - sp.oy + sp.h * spriteTop(sp.c));
          iy = top - 8;
          if (bracket) brackets(g, isoX(e.x, e.y + d.h) - 2, top - 2, isoX(e.x + d.w, e.y) + 2, isoY(e.x + d.w, e.y + d.h) + 2, bracket, 9);
        }
      } else {
        const d = UNITS[e.def];
        const lift = isAir(e) ? AIR_ALTITUDE : 0, inf = d.category === 'infantry';
        ix = isoX(e.x, e.y); iy = isoY(e.x, e.y) - (inf ? 24 : d.move === 'water' ? 36 : 26) - lift; w = inf ? 14 : d.move === 'water' ? Math.max(26, d.radius * 50) : 26; max = d.hp;
        n = inf ? 4 : d.move === 'water' ? 8 : 6;
        if (bracket && !inf) brackets(g, ix - w / 2 - 3, iy + 6, ix + w / 2 + 3, isoY(e.x, e.y) - lift + (d.move === 'water' ? 10 : 7), bracket, 6);
      }
      const rank = rankOf(e);
      for (let k = 0; k < rank; k++) {
        const cx = ix - w / 2 - 6, cy = iy + 3 - k * 4;
        g.strokeStyle = '#ffd23a'; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(cx - 3, cy - 2); g.lineTo(cx, cy + 1); g.lineTo(cx + 3, cy - 2); g.stroke();
      }
      if (e.mcBy) { g.fillStyle = '#e07bff'; g.beginPath(); g.arc(ix, iy - 6, 3, 0, Math.PI * 2); g.fill(); }
      const f = Math.max(0, hp / max), lit = f > 0 ? Math.max(1, Math.ceil(f * n - 1e-6)) : 0;
      const x0 = ix - w / 2, seg = (w - (n - 1)) / n;
      g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(x0 - 1, iy - 1, w + 2, 6);
      g.fillStyle = f > 0.5 ? hpCol[0] : f > 0.25 ? hpCol[1] : hpCol[2];
      for (let k = 0; k < lit; k++) g.fillRect(x0 + k * (seg + 1), iy, seg, 4);
      if (e.owner !== view.me && e.owner !== s.neutral) { // enemy: dark diagonal stripes over the lit part
        g.save(); g.beginPath(); g.rect(x0, iy, lit * (seg + 1), 4); g.clip();
        g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 1.2; g.beginPath();
        for (let x = x0 - 4; x < x0 + w; x += 3.5) { g.moveTo(x, iy + 4); g.lineTo(x + 4, iy); }
        g.stroke(); g.restore();
      }
      if (e.kind === 'unit' && UNITS[e.def].harvester && e.owner === view.me) {
        g.fillStyle = '#d9aa35'; g.fillRect(x0, iy + 5, (w * e.cargo) / UNITS[e.def].harvester!.capacity, 2);
      }
      const grp = e.owner === view.me ? view.groups?.get(e.id) : undefined;
      if (grp !== undefined) label(g, String(grp), x0 + w + 6, iy + 2, '#ecf6e4', 9);
    }
    // Ore money rising from the refinery.
    for (const f of view.floats) {
      g.globalAlpha = 1 - f.t * f.t;
      label(g, `+$${f.amount}`, isoX(f.x, f.y), isoY(f.x, f.y) - 34 - f.t * 26, '#ffd23a', 12);
      g.globalAlpha = 1;
    }
  }

  /** Faint outline of the area a new building may go (BUILD_RADIUS around own buildings), cached for a moment. */
  private buildRadius(s: GameState, me: number) {
    const { w: mw, h: mh } = s.map, mine = s.entities.filter((e) => e.owner === me && e.kind === 'building' && e.hp > 0);
    const key = `${s.tick >> 4}:${mine.length}`;
    if (this.radius?.key !== key) {
      const mask = new Uint8Array(mw * mh);
      for (const e of mine) {
        const b = BUILDINGS[e.def];
        for (let y = Math.max(0, e.y - BUILD_RADIUS - 1); y <= Math.min(mh - 1, e.y + b.h + BUILD_RADIUS); y++)
          for (let x = Math.max(0, e.x - BUILD_RADIUS - 1); x <= Math.min(mw - 1, e.x + b.w + BUILD_RADIUS); x++) mask[y * mw + x] = 1;
      }
      this.radius = { key, mask };
    }
    const m = this.radius.mask, g = this.g, inside = (x: number, y: number) => x >= 0 && y >= 0 && x < mw && y < mh && m[y * mw + x] === 1;
    g.beginPath();
    for (let y = 0; y < mh; y++)
      for (let x = 0; x < mw; x++) {
        if (!m[y * mw + x]) continue;
        if (!inside(x, y - 1)) { g.moveTo(isoX(x, y), isoY(x, y)); g.lineTo(isoX(x + 1, y), isoY(x + 1, y)); }
        if (!inside(x + 1, y)) { g.moveTo(isoX(x + 1, y), isoY(x + 1, y)); g.lineTo(isoX(x + 1, y + 1), isoY(x + 1, y + 1)); }
        if (!inside(x, y + 1)) { g.moveTo(isoX(x + 1, y + 1), isoY(x + 1, y + 1)); g.lineTo(isoX(x, y + 1), isoY(x, y + 1)); }
        if (!inside(x - 1, y)) { g.moveTo(isoX(x, y + 1), isoY(x, y + 1)); g.lineTo(isoX(x, y), isoY(x, y)); }
      }
    g.strokeStyle = 'rgba(140,245,122,0.4)'; g.lineWidth = 1.5; g.setLineDash([5, 4]); g.stroke(); g.setLineDash([]);
  }

  /** Map border: a soft, slightly grainy fade into the void instead of a hard diamond edge. */
  private edgeFade(mw: number, mh: number) {
    const g = this.g, D = 3;
    const edges: [number, number, number, number, number, number][] = [[0, 0, mw, 0, 0, 1], [mw, 0, mw, mh, -1, 0], [mw, mh, 0, mh, 0, -1], [0, mh, 0, 0, 1, 0]];
    for (let [ax, ay, bx, by, nx, ny] of edges) {
      // Start a little outside the edge (and past the corners): terrain tiles overdraw by half a pixel and would show as a thin light seam.
      const ex0 = (bx - ax) * 0.02, ey0 = (by - ay) * 0.02;
      [ax, ay, bx, by] = [ax - ex0 - nx * 0.12, ay - ey0 - ny * 0.12, bx + ex0 - nx * 0.12, by + ey0 - ny * 0.12];
      const A = [isoX(ax, ay), isoY(ax, ay)], B = [isoX(bx, by), isoY(bx, by)];
      const C = [isoX(bx + nx * D, by + ny * D), isoY(bx + nx * D, by + ny * D)], E = [isoX(ax + nx * D, ay + ny * D), isoY(ax + nx * D, ay + ny * D)];
      const ex = B[0] - A[0], ey = B[1] - A[1], el = Math.hypot(ex, ey), px = -ey / el, py = ex / el;
      const depth = (E[0] - A[0]) * px + (E[1] - A[1]) * py;
      const grad = g.createLinearGradient(A[0], A[1], A[0] + px * depth, A[1] + py * depth);
      grad.addColorStop(0, 'rgba(7,9,11,1)'); grad.addColorStop(0.35, 'rgba(7,9,11,0.7)'); grad.addColorStop(1, 'rgba(7,9,11,0)');
      g.fillStyle = grad;
      g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.lineTo(C[0], C[1]); g.lineTo(E[0], E[1]); g.closePath(); g.fill();
      g.save(); g.clip(); g.fillStyle = grain(g); g.globalAlpha = 0.5; g.fill(); g.restore();
    }
  }
}

/** Corner brackets (four L shapes) around a screen box. */
function brackets(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string, len: number) {
  const l = Math.min(len, (x1 - x0) / 3, (y1 - y0) / 3);
  g.beginPath();
  g.moveTo(x0, y0 + l); g.lineTo(x0, y0); g.lineTo(x0 + l, y0);
  g.moveTo(x1 - l, y0); g.lineTo(x1, y0); g.lineTo(x1, y0 + l);
  g.moveTo(x1, y1 - l); g.lineTo(x1, y1); g.lineTo(x1 - l, y1);
  g.moveTo(x0 + l, y1); g.lineTo(x0, y1); g.lineTo(x0, y1 - l);
  g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 3; g.lineCap = 'square'; g.stroke();
  g.strokeStyle = color; g.lineWidth = 1.5; g.stroke(); g.lineCap = 'butt';
}

/** Small outlined text over the battlefield. */
function label(g: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 10) {
  g.font = `700 ${size}px "Barlow Condensed", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 3; g.strokeStyle = 'rgba(7,9,11,0.9)'; g.strokeText(text, x, y);
  g.fillStyle = color; g.fillText(text, x, y);
  g.textAlign = 'start'; g.textBaseline = 'alphabetic';
}

const dims = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
/** The sprite darkened and desaturated (offline under low power); cached per sprite. */
function dimmed(c: HTMLCanvasElement): HTMLCanvasElement {
  let d = dims.get(c);
  if (d) return d;
  d = document.createElement('canvas'); d.width = c.width; d.height = c.height;
  const x = d.getContext('2d')!;
  x.drawImage(c, 0, 0);
  x.globalCompositeOperation = 'saturation'; x.fillStyle = 'rgb(128,128,128)'; x.globalAlpha = 0.6; x.fillRect(0, 0, d.width, d.height);
  x.globalCompositeOperation = 'destination-in'; x.globalAlpha = 1; x.drawImage(c, 0, 0); // keep the sprite's own shape
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(7,9,11,0.45)'; x.fillRect(0, 0, d.width, d.height);
  dims.set(c, d);
  return d;
}

let grainPat: CanvasPattern | null = null;
function grain(g: CanvasRenderingContext2D): CanvasPattern {
  if (grainPat) return grainPat;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d')!;
  let seed = 9;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 220; k++) { x.fillStyle = `rgba(7,9,11,${0.3 + rnd() * 0.6})`; x.beginPath(); x.arc(rnd() * 64, rnd() * 64, 0.8 + rnd() * 2.6, 0, Math.PI * 2); x.fill(); }
  return (grainPat = g.createPattern(c, 'repeat')!);
}
