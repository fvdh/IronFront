// Mouse & keyboard → selection, camera and commands.
import { audio } from './audio';
import { BUILDINGS } from './data/buildings';
import { UNITS } from './data/units';
import type { Game } from './Game';
import { canSee, disguisedFrom, isAir } from './systems/combat';
import { commandAttack, commandCapture, commandEnter, commandHarvest, commandMove, mayEnter, setRally } from './systems/orders';
import { centerX, centerY } from './core/entities';
import { AIR_ALTITUDE, EDGE_ZONE } from './data/config';
import { place } from './systems/production';
import { cursorCss, cursorFor, type CursorName } from './cursors';
import type { Entity } from './types';

/** Entity under a screen point: units by sprite distance first, then building footprints (sampled at several heights). */
export function pick(game: Game, sx: number, sy: number): Entity | undefined {
  const { s, cam } = game;
  const me = game.view.me;
  let best: Entity | undefined, bestD = Infinity;
  for (const e of s.entities) {
    if (e.kind !== 'unit' || e.inside || !canSee(s, me, e) || (UNITS[e.def].mimic && disguisedFrom(s, e, me))) continue;
    const inf = UNITS[e.def].category === 'infantry';
    const [ux, uy] = cam.toScreen(e.x, e.y);
    const d = Math.hypot(ux - sx, uy - ((inf ? 10 : 8) + (isAir(e) ? AIR_ALTITUDE : 0)) * cam.zoom - sy);
    if (d < (inf ? 11 : 20) * cam.zoom && d < bestD) { bestD = d; best = e; }
  }
  if (best) return best;
  for (const h of [0, 12, 24, 36]) {
    const [wx, wy] = cam.toWorld(sx, sy + h * cam.zoom);
    for (const e of s.entities) {
      if (e.kind !== 'building' || e.ruined || !canSee(s, me, e)) continue;
      const d = BUILDINGS[e.def];
      if (wx >= e.x && wx < e.x + d.w && wy >= e.y && wy < e.y + d.h) return e;
    }
  }
  return undefined;
}

export function attachInput(game: Game): () => void {
  const c = game.canvas;
  let dragStart: { x: number; y: number } | null = null;
  let pan: { x: number; y: number } | null = null;
  // Right button: a click gives an order, a drag (> 6 px) scrolls the map instead.
  let rdown: { x: number; y: number; ctrl: boolean; dragging: boolean } | null = null;
  let lastClick = { t: 0, id: 0 };
  const pos = (e: MouseEvent) => {
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const sel = game.view.selected;
  const setCursor = (n: CursorName) => { if (c.dataset.cursor !== n) { c.dataset.cursor = n; c.style.cursor = cursorCss(n); } };

  const selectClick = (x: number, y: number, ev: MouseEvent) => {
    const e = pick(game, x, y);
    const now = performance.now();
    if (!e) { if (!ev.shiftKey && !ev.ctrlKey) sel.clear(); game.notify(); return; }
    if (e.owner === game.view.me && e.kind === 'unit' && lastClick.id === e.id && now - lastClick.t < 350) {
      // Double-click: all own units of this type on screen.
      for (const u of game.s.entities) {
        if (u.owner !== game.view.me || u.def !== e.def) continue;
        const [ux, uy] = game.cam.toScreen(u.x, u.y);
        if (ux >= 0 && uy >= 0 && ux <= game.cam.vw && uy <= game.cam.vh) sel.add(u.id);
      }
    } else if (ev.ctrlKey || ev.metaKey) sel.delete(e.id);
    else if (ev.shiftKey) { if (sel.has(e.id)) sel.delete(e.id); else sel.add(e.id); }
    else { sel.clear(); sel.add(e.id); }
    // Don't mix own units with other things.
    if (sel.size > 1) for (const id of sel) { const x = game.s.rt.byId.get(id); if (!x || x.owner !== game.view.me || x.kind !== 'unit') sel.delete(id); }
    lastClick = { t: now, id: e.id };
    if (e.owner === game.view.me) { game.sound('select'); game.ack('select'); }
    game.notify();
  };

  const selectBox = (a: { x: number; y: number }, b: { x: number; y: number }, add: boolean) => {
    const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
    if (!add) sel.clear();
    let n = 0;
    for (const e of game.s.entities) {
      if (e.owner !== game.view.me || e.kind !== 'unit' || e.inside) continue;
      const [ux, uy] = game.cam.toScreen(e.x, e.y);
      const uh = uy - (8 + (isAir(e) ? AIR_ALTITUDE : 0)) * game.cam.zoom;
      if (ux >= x0 && ux <= x1 && uh >= y0 && uh <= y1) { sel.add(e.id); n++; }
    }
    // Prefer combat units: drop harvesters when the box also caught fighters.
    const units = [...sel].map((id) => game.s.rt.byId.get(id)!).filter(Boolean);
    if (units.some((u) => UNITS[u.def]?.weapon)) for (const u of units) if (UNITS[u.def]?.harvester) sel.delete(u.id);
    if (n) { game.sound('select'); game.ack('select'); }
    game.notify();
  };

  const contextCommand = (x: number, y: number, force = false) => {
    const ids = game.selectedUnitIds();
    if (!ids.length) {
      // Production building selected: right-click sets its rally point.
      const [wx, wy] = game.cam.toWorld(x, y);
      const producers = game.selectedEntities().filter((e) => setRally(game.s, game.view.me, e.id, wx, wy));
      if (producers.length) { game.mark(wx, wy, '#e0a92c'); game.sound('move'); game.say('Rally point set', 'info', true, 0); }
      else sel.clear();
      game.notify();
      return;
    }
    const { s } = game;
    const me = game.view.me;
    const target = pick(game, x, y);
    const [wx, wy] = game.cam.toWorld(x, y);
    const harvesters = ids.filter((id) => UNITS[s.rt.byId.get(id)!.def].harvester);
    const others = ids.filter((id) => !harvesters.includes(id));
    // Engineers: capture enemy buildings / repair own ones; the rest of the selection attacks as usual.
    const engineers = ids.filter((id) => UNITS[s.rt.byId.get(id)!.def].engineer || UNITS[s.rt.byId.get(id)!.def].infiltrate);
    if (target && engineers.length && commandCapture(s, me, engineers, target.id)) {
      if (target.owner !== me) commandAttack(s, me, ids, target.id);
      game.mark(target.x + BUILDINGS[target.def].w / 2, target.y + BUILDINGS[target.def].h / 2, '#ffd23a', engineers);
      game.sound('move'); game.ack('move');
      return;
    }
    // Infantry into an own transport, or into an empty / own town building.
    if (target && mayEnter(s, me, target) && commandEnter(s, me, ids, target.id)) {
      game.mark(centerX(target), centerY(target), '#8cf57a', ids);
      game.sound('move'); game.ack('move');
      return;
    }
    // Civilian buildings and bridges are only attacked on purpose (Ctrl + right-click).
    if (target && target.owner !== me && (target.owner !== s.neutral || force)) {
      if (commandAttack(s, me, ids, target.id)) {
        game.mark(centerX(target), centerY(target), '#ff4a3a', ids);
        game.sound('move'); game.ack('attack');
        return;
      }
    }
    if (target && target.owner === me && target.def === 'refinery' && harvesters.length) {
      commandHarvest(s, me, harvesters, { toRefinery: true });
      game.sound('move');
      return;
    }
    const tx = Math.floor(wx), ty = Math.floor(wy);
    const onOre = tx >= 0 && ty >= 0 && tx < s.map.w && ty < s.map.h && s.map.ore[ty * s.map.w + tx] > 0;
    if (onOre && harvesters.length) {
      commandHarvest(s, me, harvesters, { tile: [tx, ty] });
      if (others.length) commandMove(s, me, others, wx, wy);
    } else commandMove(s, me, ids, wx, wy);
    game.mark(wx, wy, '#8cf57a', ids);
    game.sound('move'); game.ack('move');
  };

  const onDown = (ev: MouseEvent) => {
    audio.unlock();
    const p = pos(ev);
    if (ev.button === 1) { pan = p; ev.preventDefault(); return; }
    if (ev.button === 2) {
      if (game.placing) { game.placing = null; game.wallStart = null; game.view.ghost = null; game.notify(); return; }
      if (game.mode !== 'normal') { game.mode = 'normal'; game.notify(); return; }
      rdown = { ...p, ctrl: ev.ctrlKey || ev.metaKey, dragging: false };
      pan = p;
      return;
    }
    if (ev.button !== 0) return;
    if (game.placing && BUILDINGS[game.placing].wall) {
      const g = game.view.ghost;
      if (g) { game.wallStart = [g.tx, g.ty]; game.ghostAt(p.x, p.y); }
      return;
    }
    if (game.placing) {
      const g = game.view.ghost;
      if (g && place(game.s, game.view.me, g.tx, g.ty)) { game.placing = null; game.view.ghost = null; }
      else { game.sound('error'); game.say('Cannot deploy here', 'warn', false, 0); }
      game.notify();
      return;
    }
    if (game.mode === 'attackMove') { const [wx, wy] = game.cam.toWorld(p.x, p.y); game.attackMoveTo(wx, wy); return; }
    if (game.mode === 'power') { const [wx, wy] = game.cam.toWorld(p.x, p.y); game.powerClick(wx, wy); return; }
    if (game.mode === 'repair' || game.mode === 'sell') {
      const b = pick(game, p.x, p.y);
      if (b && b.kind === 'building' && b.owner === game.view.me) game.buildingAction(b.id); else game.sound('error');
      if (!ev.shiftKey) { game.mode = 'normal'; game.notify(); } // shift keeps the mode active
      return;
    }
    dragStart = p;
  };

  const onMove = (ev: MouseEvent) => {
    const p = pos(ev);
    if (rdown && !rdown.dragging && Math.hypot(p.x - rdown.x, p.y - rdown.y) > 6) rdown.dragging = true;
    if (pan && (!rdown || rdown.dragging)) { game.cam.pan(pan.x - p.x, pan.y - p.y); pan = p; }
    // Position-based, so HUD overlays (top bar, messages) on top of the canvas don't switch edge scrolling off.
    game.mouse.x = p.x; game.mouse.y = p.y; game.mouse.over = p.x >= -2 && p.y >= -2 && p.x <= game.cam.vw + 2 && p.y <= game.cam.vh + 2;
    // At the browser window's own edge (e.g. far right, over the sidebar) the map scrolls that way too.
    if (ev.clientX <= 3 || ev.clientY <= 3 || ev.clientX >= innerWidth - 4 || ev.clientY >= innerHeight - 4) {
      game.mouse.over = true;
      game.mouse.x = ev.clientX >= innerWidth - 4 ? game.cam.vw : Math.min(Math.max(p.x, 0), game.cam.vw);
      game.mouse.y = Math.min(Math.max(p.y, 0), game.cam.vh);
    }
    if (rdown?.dragging) { setCursor('grab'); return; }
    if (dragStart && Math.hypot(p.x - dragStart.x, p.y - dragStart.y) > 6) game.view.drag = { x0: dragStart.x, y0: dragStart.y, x1: p.x, y1: p.y };
    game.ghostAt(p.x, p.y);
    const h = pick(game, p.x, p.y);
    game.view.hover = h?.id ?? 0;
    setCursor(cursorFor(game, p.x, p.y, ev.ctrlKey || ev.metaKey));
  };

  const onUp = (ev: MouseEvent) => {
    if (ev.button === 1) { pan = null; return; }
    if (ev.button === 2) {
      const r = rdown; rdown = null; pan = null;
      if (r && !r.dragging) contextCommand(r.x, r.y, r.ctrl);
      return;
    }
    if (ev.button === 0 && game.wallStart) { game.placeWall(); return; }
    if (ev.button !== 0 || !dragStart) return;
    const p = pos(ev);
    if (game.view.drag) selectBox(dragStart, p, ev.shiftKey);
    else selectClick(p.x, p.y, ev);
    dragStart = null;
    game.view.drag = null;
  };

  const onWheel = (ev: WheelEvent) => {
    ev.preventDefault();
    const p = pos(ev);
    game.cam.zoomAt(game.cam.zoom * (ev.deltaY < 0 ? 1.1 : 1 / 1.1), p.x, p.y);
  };

  const onKey = (ev: KeyboardEvent) => {
    if ((ev.target as HTMLElement)?.closest?.('input, select, textarea')) return;
    const k = ev.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].includes(k) && !ev.ctrlKey && !ev.metaKey) {
      game.keys.add(k);
      ev.preventDefault();
      return;
    }
    if (/^[1-9]$/.test(k)) {
      const n = Number(k);
      if (ev.ctrlKey || ev.metaKey) { game.groups.set(n, game.selectedUnitIds()); game.say(`Group ${n} set`, 'info', false, 0); ev.preventDefault(); }
      else {
        const ids = (game.groups.get(n) ?? []).filter((id) => game.s.rt.byId.has(id));
        if (ids.length) {
          const same = ids.length === sel.size && ids.every((id) => sel.has(id));
          sel.clear(); ids.forEach((id) => sel.add(id));
          if (same) { const u = game.s.rt.byId.get(ids[0])!; game.cam.centerOn(u.x, u.y); }
          game.sound('select');
        }
      }
      game.notify();
      return;
    }
    switch (k) {
      case 'x': game.stop(); break;
      case 'e': game.ability(); break;
      case 'g': game.guard(); break;
      case 'f': game.attackMoveMode(); break;
      case 'h': game.home(); break;
      case 'f1': case '?': game.help = !game.help; ev.preventDefault(); break;
      case 'p': game.togglePause(); break;
      case ' ': game.jumpToAlert(); ev.preventDefault(); break; // genre: Space = to the latest alert
      case 'escape':
        if (game.help) game.help = false;
        else if (game.placing || game.mode !== 'normal') { game.placing = null; game.wallStart = null; game.view.ghost = null; game.mode = 'normal'; }
        else game.openMenu();
        break;
      default: return;
    }
    game.notify();
  };
  const onKeyUp = (ev: KeyboardEvent) => game.keys.delete(ev.key.toLowerCase());
  const onBlur = () => { game.keys.clear(); dragStart = null; pan = null; rdown = null; game.view.drag = null; game.mouse.over = false; };
  // Leaving the window through a screen edge keeps edge scrolling going (the mouse is stuck there); elsewhere it stops.
  const onLeave = (ev: MouseEvent) => {
    if (ev.relatedTarget) return;
    const p = pos(ev), z = EDGE_ZONE;
    if (!(p.x < z || p.y < z || p.x > game.cam.vw - z || p.y > game.cam.vh - z)) game.mouse.over = false;
  };
  const noMenu = (ev: Event) => ev.preventDefault();

  // ---- touch: tap = select (or order in Order mode), drag = pan, two fingers = pan + pinch zoom,
  // long-press then drag = box select. Taps reuse the mouse handlers through a minimal fake event.
  const fake = (t: Touch) => ({ button: 0, clientX: t.clientX, clientY: t.clientY, shiftKey: false, ctrlKey: false, metaKey: false, target: c, preventDefault() {} }) as unknown as MouseEvent;
  let touch: { x: number; y: number; mode: 'tap' | 'pan' | 'box'; timer: number } | null = null;
  let pinch: { d: number; x: number; y: number } | null = null;
  const two = (e: TouchEvent) => {
    const [a, b] = [pos(fake(e.touches[0])), pos(fake(e.touches[1]))];
    return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };
  const onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    audio.unlock();
    if (touch) clearTimeout(touch.timer);
    if (e.touches.length >= 2) { touch = null; pinch = two(e); game.view.drag = null; dragStart = null; return; }
    const p = pos(fake(e.touches[0]));
    touch = { ...p, mode: 'tap', timer: window.setTimeout(() => { if (touch?.mode === 'tap') { touch.mode = 'box'; dragStart = p; game.sound('click'); } }, 350) };
  };
  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (pinch && e.touches.length >= 2) {
      const n = two(e);
      game.cam.pan(pinch.x - n.x, pinch.y - n.y);
      game.cam.zoomAt(game.cam.zoom * (n.d / Math.max(1, pinch.d)), n.x, n.y);
      pinch = n;
      return;
    }
    if (!touch) return;
    const p = pos(fake(e.touches[0]));
    if (touch.mode === 'box') { game.view.drag = { x0: dragStart!.x, y0: dragStart!.y, x1: p.x, y1: p.y }; return; }
    if (touch.mode === 'tap' && Math.hypot(p.x - touch.x, p.y - touch.y) > 10) { touch.mode = 'pan'; clearTimeout(touch.timer); }
    if (touch.mode === 'pan') { game.cam.pan(touch.x - p.x, touch.y - p.y); touch.x = p.x; touch.y = p.y; }
  };
  const onTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length < 2) pinch = null;
    const t = touch;
    if (!t || e.touches.length) return;
    touch = null;
    clearTimeout(t.timer);
    const ev = fake(e.changedTouches[0]);
    if (t.mode === 'box') { if (game.view.drag) selectBox(dragStart!, pos(ev), false); else selectClick(t.x, t.y, ev); dragStart = null; game.view.drag = null; }
    else if (t.mode === 'tap') {
      onMove(ev); // hover + placement ghost under the finger
      if (game.touchOrder && !game.placing && game.mode === 'normal') contextCommand(t.x, t.y);
      else { onDown(ev); onUp(ev); }
    }
    game.mouse.over = false; // a finger near the edge must not start edge scrolling
    game.notify();
  };

  c.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  c.addEventListener('wheel', onWheel, { passive: false });
  c.addEventListener('contextmenu', noMenu);
  c.addEventListener('touchstart', onTouchStart, { passive: false });
  c.addEventListener('touchmove', onTouchMove, { passive: false });
  c.addEventListener('touchend', onTouchEnd, { passive: false });
  c.addEventListener('touchcancel', onTouchEnd, { passive: false });
  document.addEventListener('mouseout', onLeave);
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  return () => {
    c.removeEventListener('mousedown', onDown);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    c.removeEventListener('wheel', onWheel);
    c.removeEventListener('contextmenu', noMenu);
    c.removeEventListener('touchstart', onTouchStart);
    c.removeEventListener('touchmove', onTouchMove);
    c.removeEventListener('touchend', onTouchEnd);
    c.removeEventListener('touchcancel', onTouchEnd);
    document.removeEventListener('mouseout', onLeave);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
  };
}
