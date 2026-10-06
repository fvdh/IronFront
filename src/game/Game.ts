// Game controller: owns the state, fixed-timestep loop, camera, renderer, input and event feedback.
// React talks to the game only through this class (subscribe/version + command methods).
import { reducedMotion, settings } from '../settings';
import { audio, type SoundId } from './audio';
import { centerX, centerY } from './core/entities';
import { serialize, SAVE_KEY } from './core/save';
import { tick } from './core/sim';
import { BUILDINGS } from './data/buildings';
import { EDGE_ZONE, TICK_RATE } from './data/config';
import { displayName } from './data/factions';
import { UNITS } from './data/units';
import { WEAPONS } from './data/weapons';
import { attachInput } from './input';
import { Camera } from './render/iso';
import { Renderer, type ViewState } from './render/renderer';
import { canPlace, cellFree, enqueue, holdOrCancel, missingRequirements, placeLine, resume } from './systems/production';
import { abilityOf, commandAbility } from './systems/abilities';
import { commandGuard, commandMove, commandStop, sellBuilding, toggleRepair } from './systems/orders';
import { firePower, isReady } from './systems/powers';
import { POWERS } from './data/powers';
import { TUTORIAL } from './tutorial';
import { ANNOUNCER_LINES, isHeroVoice, type AckClass, type AckKind } from './announcer';
import { hasRadar, isLowPower } from './systems/economy';
import { catalog } from './systems/production';
import type { Entity, GameEvent, GameState } from './types';

export { SAVE_KEY } from './core/save';

/** Tiles from a to b along the dominant axis (wall drag), at most 12. */
export function wallLine(a: [number, number], b: [number, number]): [number, number][] {
  const horiz = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]);
  const n = Math.min(12, Math.abs(horiz ? b[0] - a[0] : b[1] - a[1]) + 1), k = Math.sign(horiz ? b[0] - a[0] : b[1] - a[1]) || 1;
  return Array.from({ length: n }, (_, i) => (horiz ? [a[0] + i * k, a[1]] : [a[0], a[1] + i * k]) as [number, number]);
}

/** Order colours that stay apart with red-green blindness: move sky blue, attack vermillion, rally/guard yellow-orange. */
const CB_ORDER: Record<string, string> = { '#8cf57a': '#56b4e9', '#ff4a3a': '#d55e00', '#ff7a4a': '#d55e00', '#ffd23a': '#f0e442', '#e0a92c': '#e69f00' };

export interface Message { text: string; t: number; kind: 'info' | 'warn' | 'good' }

export class Game {
  cam: Camera;
  view: ViewState;
  renderer: Renderer;
  paused = false;
  speed = settings.get().gameSpeed;
  placing: string | null = null;
  mode: 'normal' | 'attackMove' | 'repair' | 'sell' | 'power' = 'normal';
  powerId = 0; // superweapon being aimed (mode 'power')
  powerFrom: [number, number] | null = null; // Phase Gate: group picked, waiting for the destination
  messages: Message[] = [];
  groups = new Map<number, number[]>();
  tutorialStep = 0;
  help = false; // hotkey overlay (F1 / ?)
  version = 0;
  showPause = false;
  private listeners = new Set<() => void>();
  private raf = 0;
  private last = 0;
  private acc = 0;
  private lastHud = 0;
  private time = 0;
  /** Seconds since this view started (real time, not game time): pings and messages age on it. */
  get clock() { return this.time; }
  private detach: () => void = () => {};
  mouse = { x: 0, y: 0, over: false };
  /** Touch: a tap on the map gives an order (like a right click) instead of selecting. */
  touchOrder = false;
  keys = new Set<string>();

  constructor(public s: GameState, public canvas: HTMLCanvasElement) {
    this.cam = new Camera(s.map.w, s.map.h);
    this.cam.zoom = settings.get().zoom;
    this.renderer = new Renderer(canvas);
    this.view = { me: 0, selected: new Set(), hover: 0, drag: null, ghost: null, markers: [], floats: [] };
  }

  get me() { return this.s.players[this.view.me]; }
  get over() { return this.s.winner !== -1; }

  start() {
    this.detach = attachInput(this);
    const p = this.me;
    this.cam.centerOn(p.startX + 1, p.startY + 1);
    audio.setAnnouncer(p.faction, ANNOUNCER_LINES);
    this.say('Battle control online', 'info', true, 0);
    this.watch = this.watched();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    // Dev-only test hook: lets browser automation advance the sim when rAF is throttled (hidden tab).
    if (import.meta.env.DEV) Object.assign(window, { __game: this, __step: (n: number) => { for (let k = 0; k < n && !this.over; k++) tick(this.s); this.handleEvents(); this.renderer.render(this.s, this.cam, this.view, 1, this.time); this.notify(); },
      // Snapshot tests: stop the frame loop and pin the animation clock, so __step(0) renders the same picture every time.
      __freeze: (t: number) => { cancelAnimationFrame(this.raf); this.time = t; } });
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.detach();
    this.listeners.clear();
  }

  resize(w: number, h: number) {
    this.cam.vw = w; this.cam.vh = h;
    this.renderer.resize(w, h);
    this.cam.clamp();
  }

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => { this.listeners.delete(l); };
  };
  notify() {
    this.version++;
    this.listeners.forEach((l) => l());
  }

  private frame = (now: number) => {
    const dt = Math.min(0.25, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.scrollCamera(dt);
    const running = !this.paused && !this.showPause && !this.over;
    if (running) {
      this.acc += dt * this.speed * TICK_RATE;
      let n = 0;
      while (this.acc >= 1 && n < 8) { tick(this.s); this.acc -= 1; n++; }
      if (n === 8) this.acc = 0; // can't keep up: drop time instead of spiralling
      this.handleEvents();
    }
    for (const m of this.view.markers) m.t += dt / 0.6;
    this.view.markers = this.view.markers.filter((m) => m.t < 1);
    for (const f of this.view.floats) f.t += dt / 1.4;
    this.view.floats = this.view.floats.filter((f) => f.t < 1);
    const shake = this.shakeUntil > this.time ? (this.shakeUntil - this.time) * 14 : 0;
    const [sx, sy] = [(Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake];
    this.cam.x += sx; this.cam.y += sy;
    this.renderer.render(this.s, this.cam, this.view, running ? this.acc : 1, this.time);
    this.cam.x -= sx; this.cam.y -= sy;
    this.pings = this.pings.filter((q) => this.time - q.t < 3);
    if (now - this.lastHud > 120) {
      this.lastHud = now;
      this.watchChanges();
      this.view.groups = new Map([...this.groups].flatMap(([n, ids]) => ids.map((id) => [id, n] as [number, number])));
      for (const id of this.view.selected) if (!this.s.rt.byId.has(id) || this.s.rt.byId.get(id)!.inside) this.view.selected.delete(id);
      this.messages = this.messages.filter((m) => this.time - m.t < 6);
      this.updateTutorial();
      this.notify();
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private scrollVel = { x: 0, y: 0 };
  private scrollCamera(dt: number) {
    const sp = settings.get().scrollSpeed;
    let dx = 0, dy = 0;
    const k = this.keys;
    if (k.has('arrowleft') || k.has('a')) dx -= 1;
    if (k.has('arrowright') || k.has('d')) dx += 1;
    if (k.has('arrowup') || k.has('w')) dy -= 1;
    if (k.has('arrowdown') || k.has('s')) dy += 1;
    if (settings.get().edgeScroll && this.mouse.over && !this.view.drag) {
      // Speed grows from 30% at the inside of the band to 100% at the very edge.
      const z = EDGE_ZONE, m = this.mouse, f = (d: number) => (d < z ? 0.3 + 0.7 * (1 - Math.max(0, d) / z) : 0);
      dx += f(this.cam.vw - m.x) - f(m.x);
      dy += f(this.cam.vh - m.y) - f(m.y);
    }
    // Ease the velocity (≈80 ms) so starting and stopping don't jerk.
    const v = this.scrollVel, a = Math.min(1, dt * 12);
    v.x += (dx * sp - v.x) * a; v.y += (dy * sp - v.y) * a;
    if (Math.abs(v.x) < 1 && !dx) v.x = 0;
    if (Math.abs(v.y) < 1 && !dy) v.y = 0;
    if (v.x || v.y) this.cam.pan(v.x * dt, v.y * dt);
  }

  // ------------------------------------------------------------ feedback

  /** Message on screen (and in the log); `voice` = speak it, or the announcer line to speak instead. */
  say(text: string, kind: Message['kind'] = 'info', voice: boolean | string = true, gap = 4000) {
    const last = this.messages.find((m) => m.text === text);
    if (last && this.time - last.t < gap / 1000) return false;
    this.messages = [...this.messages.filter((m) => m.text !== text), { text, t: this.time, kind }].slice(-5);
    this.log = [...this.log, { text, t: this.gameTime(), kind }].slice(-40);
    if (voice) audio.say(typeof voice === 'string' ? voice : text, gap);
    return true;
  }
  /** Message log (newest last), readable from the top bar. */
  log: { text: string; t: number; kind: Message['kind'] }[] = [];
  /** Red rings on the radar where something of ours was hit; Space jumps to the latest. */
  pings: { x: number; y: number; t: number }[] = [];
  lastAlert: [number, number] | null = null;
  private shakeUntil = 0;

  private alert(x: number, y: number) {
    this.lastAlert = [x, y];
    if (!this.pings.some((q) => Math.hypot(q.x - x, q.y - y) < 6 && this.time - q.t < 2)) this.pings.push({ x, y, t: this.time });
  }
  jumpToAlert() { if (this.lastAlert) this.cam.centerOn(...this.lastAlert); }

  /** A unit of the selection answers (first own unit decides the voice). */
  ack(kind: AckKind) {
    const u = this.selectedEntities().find((e) => e.owner === this.view.me && e.kind === 'unit');
    if (!u) return;
    const d = UNITS[u.def];
    const cls: AckClass = d.air ? 'aircraft' : d.move === 'water' ? 'ship' : d.category === 'infantry' ? 'infantry' : 'vehicle';
    audio.ack(this.s.players[u.owner].faction, cls, kind, isHeroVoice(u.def) ? u.def : undefined);
  }

  /** Announce state changes that have no event of their own: power, radar, new build options. */
  private watch = { low: false, radar: false, options: 0 };
  private watched() {
    const s = this.s, me = this.view.me;
    const options = (['building', 'infantry', 'vehicle'] as const).reduce((n, c) => n + catalog(s, me, c).filter((d) => !missingRequirements(s, me, d).length).length, 0);
    return { low: isLowPower(s, me), radar: hasRadar(s, me), options };
  }
  private watchChanges() {
    const now = this.watched(), was = this.watch;
    if (was.low && !now.low) this.say('Power restored', 'good');
    if (!was.radar && now.radar) this.say('Radar online', 'good');
    if (was.radar && !now.radar && !this.over) this.say('Radar offline', 'warn');
    if (now.options > was.options && this.s.tick > 30) this.say('New construction options', 'good', true, 8000);
    this.watch = now;
  }

  sound(id: SoundId, x?: number, y?: number) {
    if (x === undefined || y === undefined) { audio.play(id); return; }
    const [cx, cy] = this.cam.center();
    // Iso screen-x grows with (x - y): pan by the horizontal offset from the camera centre.
    audio.play(id, Math.max(0, 1 - Math.hypot(x - cx, y - cy) / 28), Math.max(-1, Math.min(1, (x - y - (cx - cy)) / 24)));
  }

  private handleEvents() {
    const me = this.view.me;
    const vis = this.me.visible;
    for (const ev of this.s.rt.events.splice(0)) this.onEvent(ev, me, vis);
  }

  private onEvent(ev: GameEvent, me: number, vis: Uint8Array) {
    const seen = (x: number, y: number) => vis[Math.floor(y) * this.s.map.w + Math.floor(x)] === 1;
    switch (ev.type) {
      case 'fire': if (seen(ev.x, ev.y)) this.sound(WEAPONS[ev.weapon].sound as SoundId, ev.x, ev.y); break;
      case 'death':
        if (seen(ev.x, ev.y)) this.sound(ev.kind === 'building' || UNITS[ev.def]?.category === 'vehicle' ? 'bigExplode' : 'explode', ev.x, ev.y);
        if (ev.owner === me) this.say(ev.kind === 'building' ? 'Structure lost' : 'Unit lost', 'warn', true, ev.kind === 'building' ? 5000 : 8000);
        break;
      case 'unitReady': if (ev.owner === me) { this.sound('ready'); this.say(`${displayName(ev.def, this.me.faction)} ready`, 'good', false); audio.say('Unit ready', 2500); } break;
      case 'buildingReady': if (ev.owner === me) { this.sound('ready'); this.say('Construction complete', 'good'); } break;
      case 'placed': if (ev.owner === me) this.sound('place'); break;
      case 'income': {
        // One rising "+$" per refinery visit: bites that arrive while it is still young add up.
        const r = this.s.rt.byId.get(ev.id);
        if (ev.owner !== me || !r) break;
        const f = this.view.floats.find((q) => q.id === ev.id && q.t < 0.35);
        if (f) f.amount += ev.amount; else this.view.floats.push({ id: ev.id, x: centerX(r), y: centerY(r), t: 0, amount: ev.amount });
        break;
      }
      case 'deployed': if (ev.owner === me) this.sound('place'); break;
      case 'underAttack':
        if (ev.owner !== me) break;
        this.alert(ev.x, ev.y);
        if (BUILDINGS[ev.def]) { this.sound('alert'); this.say('Our base is under attack', 'warn', true, 10000); }
        else if (UNITS[ev.def]?.harvester) { this.sound('alert'); this.say('Our harvester is under attack', 'warn', true, 10000); }
        break;
      case 'captured':
        if (ev.owner === me) { this.sound('capture'); this.say(`${displayName(ev.def, this.me.faction)} captured`, 'good', 'Building captured'); }
        else if (ev.from === me) { this.sound('alert'); this.say('Structure captured by the enemy', 'warn', true, 5000); }
        break;
      case 'infiltrated':
        if (ev.owner === me) { this.sound('capture'); this.say(`${displayName(ev.def, this.s.players[ev.from].faction)} infiltrated`, 'good'); }
        else if (ev.from === me) { this.sound('alert'); this.say('Enemy infiltration detected', 'warn', true, 5000); }
        break;
      case 'superweapon': {
        const name = POWERS[BUILDINGS[ev.def].superweapon!].name, mine = ev.owner === me;
        if (ev.phase === 'built') { this.sound('alert'); this.say(mine ? `${name} online` : `Warning: enemy ${name} detected`, mine ? 'good' : 'warn', true); }
        if (ev.phase === 'ready') { this.sound(mine ? 'ready' : 'alert'); this.say(mine ? `${name} ready` : `Warning: enemy ${name} ready`, mine ? 'good' : 'warn', true); }
        if (ev.phase === 'fired') { this.sound('bigExplode', ev.x, ev.y); if (seen(ev.x, ev.y) && !reducedMotion()) this.shakeUntil = this.time + 0.7; this.say(mine ? `${name} activated` : `Warning: enemy ${name} activated`, mine ? 'info' : 'warn', true); if (!mine) this.view.markers.push({ x: ev.x, y: ev.y, t: 0, color: '#ff4a3a' }); }
        break;
      }
      case 'garrisoned': if (ev.owner === me) { this.sound('capture'); this.say('Building garrisoned', 'good'); } break;
      case 'bridge': if (this.me.explored[Math.floor(ev.y) * this.s.map.w + Math.floor(ev.x)]) { this.sound(ev.destroyed ? 'bigExplode' : 'capture', ev.x, ev.y); this.say(ev.destroyed ? 'Bridge destroyed' : 'Bridge repaired', 'info'); } break;
      case 'crate': if (ev.owner === me) { this.sound('promote'); this.say(({ money: 'Crate: +$1000', veteran: 'Crate: promotion', heal: 'Crate: units repaired', reveal: 'Crate: map revealed' } as Record<string, string>)[ev.kind], 'good', false, 0); } break;
      case 'mindControlStart': if (ev.from === me) { this.alert(ev.x, ev.y); if (this.say('Warning: mind control beam', 'warn', true, 8000)) this.sound('alert'); } break;
      case 'mindControl':
        if (ev.owner === me) this.sound('mindcontrol');
        if (ev.from === me) { this.sound('alert'); this.say('Unit under enemy mind control', 'warn', true, 8000); }
        break;
      case 'promoted': if (ev.owner === me) this.sound('promote'); if (ev.owner === me) this.say(`${displayName(ev.def, this.me.faction)} ${ev.rank === 2 ? 'elite' : 'promoted to veteran'}`, 'good', 'Unit promoted', 5000); break;
      case 'lowPower': if (ev.owner === me) { this.sound('alert'); this.say('Low power', 'warn'); } break;
      case 'insufficient': if (ev.owner === me) this.say('Insufficient funds', 'warn', true, 8000); break;
      case 'gameOver':
        this.placing = null;
        this.sound(ev.winner === me ? 'victory' : 'defeat');
        audio.say(ev.winner === me ? 'Mission accomplished' : 'Mission failed', 0);
        this.notify();
        break;
    }
  }

  private updateTutorial() {
    if (this.s.settings.mode !== 'tutorial') return;
    while (this.tutorialStep < TUTORIAL.length && TUTORIAL[this.tutorialStep].done(this)) {
      this.tutorialStep++;
      this.sound('ready');
    }
  }

  // ------------------------------------------------------------ commands from UI / input

  selectedEntities(): Entity[] {
    return [...this.view.selected].map((id) => this.s.rt.byId.get(id)).filter((e): e is Entity => !!e);
  }
  selectedUnitIds(): number[] {
    return this.selectedEntities().filter((e) => e.owner === this.view.me && e.kind === 'unit').map((e) => e.id);
  }

  queue(def: string) {
    audio.unlock();
    const p = this.me;
    if (p.ready === def) { this.placing = def; this.mode = 'normal'; this.sound('click'); this.notify(); return; }
    if (resume(this.s, this.view.me, def)) { this.sound('click'); this.say('Building', 'info', true, 0); this.notify(); return; }
    const r = enqueue(this.s, this.view.me, def);
    if (r === 'ok') { this.sound('click'); this.say(BUILDINGS[def] ? 'Building' : 'Training', 'info', true, 0); }
    else if (r === 'full') { this.sound('error'); this.say('Queue full', 'warn'); }
    else if (r === 'limit') { this.sound('error'); this.say(UNITS[def]?.ammo ? 'No free landing pad' : 'Unit limit reached', 'warn', !UNITS[def]?.ammo); }
    else {
      this.sound('error');
      const miss = missingRequirements(this.s, this.view.me, def).map((d) => displayName(d, p.faction));
      this.say(miss.length ? `Requires: ${miss.join(', ')}` : 'Unavailable', 'warn', false);
    }
    this.notify();
  }

  cancel(def: string) {
    const r = holdOrCancel(this.s, this.view.me, def);
    if (r) { this.sound('click'); this.say(r === 'hold' ? 'On hold' : 'Cancelled', 'info', true, 0); }
    if (this.placing === def && this.me.ready !== def) this.placing = null;
    this.notify();
  }

  ghostAt(sx: number, sy: number) {
    const b = this.mode === 'power' ? this.s.rt.byId.get(this.powerId) : undefined;
    if (b) { const [wx, wy] = this.cam.toWorld(sx, sy); this.view.aim = { x: wx, y: wy, r: POWERS[BUILDINGS[b.def].superweapon!].radius, from: this.powerFrom ?? undefined }; }
    else this.view.aim = null;
    if (!this.placing) { this.view.ghost = null; return; }
    const d = BUILDINGS[this.placing];
    const [wx, wy] = this.cam.toWorld(sx, sy);
    const tx = Math.round(wx - d.w / 2), ty = Math.round(wy - d.h / 2);
    const g = this.view.ghost;
    if (g && g.def === this.placing && g.tx === tx && g.ty === ty && !this.wallStart === !g.line) return;
    const line = this.wallStart ? wallLine(this.wallStart, [tx, ty]) : undefined;
    const cells: boolean[] = [];
    for (let y = ty; y < ty + d.h; y++) for (let x = tx; x < tx + d.w; x++) cells.push(cellFree(this.s, this.placing, x, y));
    this.view.ghost = { def: this.placing, tx, ty, cells, valid: canPlace(this.s, this.view.me, this.placing, tx, ty), line: line?.map(([x, y]) => [x, y, canPlace(this.s, this.view.me, this.placing!, x, y)] as [number, number, boolean]) };
  }

  /** Wall drag: first click anchors the line, release places it. */
  wallStart: [number, number] | null = null;
  placeWall() {
    const g = this.view.ghost;
    if (!this.wallStart || !g) return;
    const n = placeLine(this.s, this.view.me, wallLine(this.wallStart, [g.tx, g.ty]));
    this.wallStart = null;
    if (n) { this.placing = null; this.view.ghost = null; }
    else { this.sound('error'); this.say('Cannot deploy here', 'warn', true, 1500); }
    this.notify();
  }

  /** Ability of the selection (E). */
  ability() {
    const ids = this.selectedEntities().filter((e) => e.owner === this.view.me).map((e) => e.id);
    if (commandAbility(this.s, this.view.me, ids)) this.sound('move');
    else if (ids.some((id) => abilityOf(this.s.rt.byId.get(id)!))) { this.sound('error'); this.say('Cannot do that here', 'warn', false, 0); }
    this.notify();
  }

  /** Sidebar superweapon button: start aiming. */
  armPower(id: number) {
    const b = this.s.rt.byId.get(id);
    if (!b || !isReady(b)) { this.sound('error'); return; }
    this.mode = 'power'; this.powerId = id; this.powerFrom = null; this.placing = null; this.view.ghost = null;
    const pw = POWERS[BUILDINGS[b.def].superweapon!];
    this.say(pw.twoStep ? `${pw.name}: click the group to send` : `${pw.name}: click a target`, 'info', 'Select target', 0);
    this.sound('click'); this.notify();
  }
  /** Left click while aiming: fire (Phase Gate: first the group, then the destination). */
  powerClick(x: number, y: number) {
    const b = this.s.rt.byId.get(this.powerId);
    if (b && POWERS[BUILDINGS[b.def].superweapon!].twoStep && !this.powerFrom) { this.powerFrom = [x, y]; this.say('Now click the destination', 'info', false, 0); this.notify(); return; }
    const [fx, fy] = this.powerFrom ?? [x, y];
    if (!firePower(this.s, this.view.me, this.powerId, fx, fy, x, y)) this.sound('error');
    this.mode = 'normal'; this.powerFrom = null; this.notify();
  }

  /** Order feedback: a ring at the target and, for `ids`, a fading line from each unit to it. */
  mark(x: number, y: number, color: string, ids: number[] = []) {
    const from = ids.map((id) => this.s.rt.byId.get(id)).filter((e) => !!e && !e.inside).map((e) => [e!.x, e!.y] as [number, number]);
    this.view.markers.push({ x, y, t: 0, color: settings.get().colorblind ? CB_ORDER[color] ?? color : color, from });
  }

  stop() { commandStop(this.s, this.view.me, this.selectedUnitIds()); this.sound('move'); }
  guard() { const ids = this.selectedUnitIds(); commandGuard(this.s, this.view.me, ids); for (const id of ids) { const e = this.s.rt.byId.get(id); if (e && !e.inside) this.mark(e.x, e.y, '#ffd23a'); } this.sound('move'); this.ack('move'); this.say('Guarding position', 'info', false, 0); }
  attackMoveMode() { if (this.selectedUnitIds().length) { this.mode = 'attackMove'; this.say('Attack-move: click a destination', 'info', false, 0); } }
  attackMoveTo(x: number, y: number) {
    const ids = this.selectedUnitIds();
    if (commandMove(this.s, this.view.me, ids, x, y, true)) {
      this.mark(x, y, '#ff7a4a', ids);
      this.sound('move');
      this.ack('attack');
    }
    this.mode = 'normal';
  }

  setMode(m: Game['mode']) { this.mode = this.mode === m ? 'normal' : m; this.placing = null; this.view.ghost = null; this.sound('click'); this.notify(); }
  /** Repair/sell click on a building (from input). */
  buildingAction(id: number) {
    const me = this.view.me;
    if (this.mode === 'repair') {
      if (toggleRepair(this.s, me, id)) { this.sound('click'); const e = this.s.rt.byId.get(id); if (e?.repairing) this.say('Repairing', 'info', true, 0); }
      else this.sound('error');
    } else if (this.mode === 'sell') {
      const refund = sellBuilding(this.s, me, id);
      if (refund > 0) { this.sound('place'); this.say(`Structure sold (+$${refund})`, 'good', 'Structure sold', 0); } else this.sound('error');
    }
    this.notify();
  }

  setSpeed(v: number) { this.speed = v; settings.set({ gameSpeed: v }); this.notify(); }
  togglePause() { this.paused = !this.paused; this.notify(); }
  openMenu(open = !this.showPause) { this.showPause = open; this.notify(); }

  home() {
    const cy = this.s.entities.find((e) => e.owner === this.view.me && e.def === 'cy') ?? this.s.entities.find((e) => e.owner === this.view.me);
    if (cy) this.cam.centerOn(centerX(cy), centerY(cy));
  }

  save(): string | null {
    try {
      localStorage.setItem(SAVE_KEY, serialize(this.s));
      this.say('Game saved', 'good', false, 0);
      return null;
    } catch (e) {
      const msg = `Save failed: ${(e as Error).message}`;
      this.say(msg, 'warn', false, 0);
      return msg;
    }
  }

  gameTime() { return this.s.tick / TICK_RATE; }
}
