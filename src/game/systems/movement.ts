import { MAX_REPATHS, PATHS_PER_TICK, STUCK_TICKS } from '../data/config';
import { emit } from '../core/events';
import { UNITS } from '../data/units';
import { blockedAt, freeSpot, moveOf } from '../core/entities';
import type { Entity, GameState } from '../types';
import { findPath, smoothPath } from './pathfinding';

export type MoveStatus = 'idle' | 'moving' | 'arrived' | 'gaveUp';

export function requestMove(e: Entity, x: number, y: number) {
  e.gx = x; e.gy = y;
  e.needPath = true;
  e.landed = false; // aircraft take off
  e.path = []; e.pathIdx = 0;
  e.stuckTimer = 0; e.stuckDist = 1e9; e.repaths = 0;
}

export function stopMove(e: Entity) {
  e.path = []; e.pathIdx = 0; e.needPath = false;
}

export const isMoving = (e: Entity) => e.needPath || e.pathIdx < e.path.length;

export function angleDiff(a: number, b: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function turnToward(a: number, b: number, rate: number) {
  const d = angleDiff(a, b);
  return Math.abs(d) <= rate ? b : a + Math.sign(d) * rate;
}

/** Resolve pending path requests within the per-tick budget. */
export function processPaths(s: GameState) {
  // Round-robin over the entity list so no unit starves when many request paths every tick.
  let budget = PATHS_PER_TICK;
  const n = s.entities.length, start = (s.pathCursor ?? 0) % Math.max(1, n);
  for (let k = 0; k < n; k++) {
    const e = s.entities[(start + k) % n];
    if (!e.needPath || e.hp <= 0) continue;
    if (budget-- <= 0) { s.pathCursor = (start + k) % n; break; }
    e.needPath = false;
    if (UNITS[e.def]?.air) { // aircraft fly straight to the goal
      e.gx = Math.min(Math.max(e.gx, 0.5), s.map.w - 0.5); e.gy = Math.min(Math.max(e.gy, 0.5), s.map.h - 0.5);
      e.path = [Math.floor(e.gy) * s.map.w + Math.floor(e.gx)]; e.pathIdx = 0; e.stuckTimer = 0;
      continue;
    }
    if (UNITS[e.def]?.teleport) { teleport(s, e); continue; }
    const mv = moveOf(e);
    const r = findPath(s, Math.floor(e.x), Math.floor(e.y), Math.floor(e.gx), Math.floor(e.gy), undefined, mv);
    const goalTile = Math.floor(e.gy) * s.map.w + Math.floor(e.gx);
    e.path = r.path.length ? smoothPath(s, e.x, e.y, r.path, mv) : r.complete && !blockedAt(s, e.gx, e.gy, mv) ? [goalTile] : [];
    e.noPath = !e.path.length && Math.hypot(e.gx - e.x, e.gy - e.y) > 0.8; // nowhere to go: don't let callers re-request every tick
    e.pathIdx = 0;
    e.stuckTimer = 0;
  }
}

/** Teleporting infantry: jump to the goal (nearest free tile), then stand frozen for a moment per tile jumped. */
function teleport(s: GameState, e: Entity) {
  const spot = blockedAt(s, e.gx, e.gy) ? freeSpot(s, e.gx, e.gy, 3, false) : [e.gx, e.gy];
  e.path = []; e.pathIdx = 0;
  if (!spot) { e.noPath = true; return; }
  const d = Math.hypot(spot[0] - e.x, spot[1] - e.y);
  s.effects.push({ kind: 'flash', x: e.x, y: e.y, x2: 0, y2: 0, t: 0, life: 10, color: '#7ff5ff' });
  e.x = e.px = spot[0]; e.y = e.py = spot[1];
  e.frozenUntil = s.tick + Math.min(90, Math.round(d * 4));
  emit(s, { type: 'ability', owner: e.owner, def: e.def, ability: 'teleport' }); // telemetry: Allied faction mechanic
  s.effects.push({ kind: 'flash', x: e.x, y: e.y, x2: 0, y2: 0, t: 0, life: 10, color: '#7ff5ff' });
}

/** Advance one tick along the current path. */
export function moveStep(s: GameState, e: Entity): MoveStatus {
  if (e.needPath) return 'moving';
  if (e.pathIdx >= e.path.length) { if (e.noPath) { e.noPath = false; return 'gaveUp'; } return 'idle'; }
  const d = UNITS[e.def];
  const w = s.map.w;
  const i = e.path[e.pathIdx];
  const last = e.pathIdx === e.path.length - 1;
  let tx = (i % w) + 0.5, ty = ((i / w) | 0) + 0.5;
  if (last && Math.floor(e.gx) === i % w && Math.floor(e.gy) === ((i / w) | 0)) { tx = e.gx; ty = e.gy; }
  const dx = tx - e.x, dy = ty - e.y;
  const dist = Math.hypot(dx, dy);
  if (dist < (last ? 0.06 : 0.25)) {
    e.pathIdx++;
    if (e.pathIdx >= e.path.length) { stopMove(e); return 'arrived'; }
    return 'moving';
  }
  const want = Math.atan2(dy, dx);
  e.facing = turnToward(e.facing, want, d.turn);
  const align = Math.cos(angleDiff(e.facing, want));
  if (align > 0.3) {
    const step = Math.min(dist, d.speed * align);
    const nx = e.x + (dx / dist) * step, ny = e.y + (dy / dist) * step;
    if (!d.air && blockedAt(s, nx, ny, moveOf(e))) { e.needPath = true; return 'moving'; } // world changed (new building): repath
    e.x = nx; e.y = ny;
    e.movedAt = s.tick;
  }

  // Stuck detection: no progress towards the goal over STUCK_TICKS → repath, then give up.
  if (++e.stuckTimer >= STUCK_TICKS) {
    const toGoal = Math.hypot(e.gx - e.x, e.gy - e.y);
    if (toGoal > e.stuckDist - 0.25) {
      if (toGoal < 1.6 || ++e.repaths > MAX_REPATHS) { stopMove(e); return toGoal < 1.6 ? 'arrived' : 'gaveUp'; }
      e.needPath = true;
    }
    e.stuckDist = toGoal;
    e.stuckTimer = 0;
  }
  return 'moving';
}

/** Soft collision between ground units. */
export function separate(s: GameState) {
  // ponytail: O(n²) pair scan, fine to ~400 units; switch to a spatial hash if unit counts grow.
  const us = s.entities.filter((e) => e.kind === 'unit' && e.hp > 0 && !e.inside);
  for (let a = 0; a < us.length; a++) {
    const A = us[a], ra = UNITS[A.def].radius, air = !!UNITS[A.def].air;
    for (let b = a + 1; b < us.length; b++) {
      const B = us[b];
      if (air !== !!UNITS[B.def].air) continue; // aircraft only push each other
      const dx = B.x - A.x, dy = B.y - A.y;
      const r = ra + UNITS[B.def].radius;
      if (dx > r || dx < -r || dy > r || dy < -r) continue;
      const d2 = dx * dx + dy * dy;
      if (d2 >= r * r) continue;
      let d = Math.sqrt(d2), nx = dx, ny = dy;
      if (d < 1e-4) { nx = Math.cos(A.id); ny = Math.sin(A.id); d = 1; }
      const push = (r - Math.min(d, r)) * 0.5;
      // Moving units yield less than idle ones so traffic flows through parked groups.
      const am = isMoving(A), bm = isMoving(B);
      const wa = am === bm ? 0.5 : am ? 0.25 : 0.75;
      const ax = A.x - (nx / d) * push * wa * 2, ay = A.y - (ny / d) * push * wa * 2;
      const bx = B.x + (nx / d) * push * (1 - wa) * 2, by = B.y + (ny / d) * push * (1 - wa) * 2;
      if (air || !blockedAt(s, ax, ay, moveOf(A))) { A.x = ax; A.y = ay; }
      if (air || !blockedAt(s, bx, by, moveOf(B))) { B.x = bx; B.y = by; }
    }
  }
}
