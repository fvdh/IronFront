import { BUILDINGS } from '../data/buildings';
import { emit } from '../core/events';
import { logDecision } from './telemetry';
import { TICK_RATE } from '../data/config';
import { POWERS } from '../data/powers';
import { UNITS } from '../data/units';
import { blockedAt, centerX, centerY, distTo, freeSpot, spawnUnit } from '../core/entities';
import type { Entity, GameState } from '../types';
import { idx, terrainPassable } from '../world/map';
import { damage } from './combat';
import { isLowPower } from './economy';
import { stopMove } from './movement';

export const superweaponsOn = (s: GameState) => s.settings.superweapons !== false;
export const fullCharge = (def: string) => POWERS[BUILDINGS[def].superweapon!].charge * TICK_RATE;
export const isReady = (e: Entity) => (e.charge ?? 0) >= fullCharge(e.def);

/** Per tick for a finished superweapon building: announce it, charge while powered, announce when ready. */
export function chargeTick(s: GameState, e: Entity) {
  const at = { owner: e.owner, def: e.def, x: centerX(e), y: centerY(e) };
  if (e.charge === undefined) { e.charge = 0; emit(s, { type: 'superweapon', phase: 'built', ...at }); }
  if (isReady(e) || isLowPower(s, e.owner)) return;
  if (++e.charge >= fullCharge(e.def)) emit(s, { type: 'superweapon', phase: 'ready', ...at });
}

const inArea = (s: GameState, x: number, y: number, r: number) =>
  s.entities.filter((o) => o.hp > 0 && !o.inside && o.owner !== s.neutral && distTo(x, y, o) <= r);

/** Fire an own, charged superweapon at (x, y); the Phase Gate sends the group around (x, y) to (x2, y2). */
export function firePower(s: GameState, owner: number, id: number, x: number, y: number, x2 = x, y2 = y): boolean {
  const b = s.rt.byId.get(id);
  if (!b || b.owner !== owner || b.hp <= 0 || b.kind !== 'building' || !BUILDINGS[b.def].superweapon || !isReady(b) || !superweaponsOn(s)) return false;
  const pw = BUILDINGS[b.def].superweapon!, r = POWERS[pw].radius;
  b.charge = 0;
  logDecision(s, owner, 'power', b.def);
  emit(s, { type: 'superweapon', phase: 'fired', owner, def: b.def, x, y });
  s.effects.push({ kind: 'wave', x, y, x2: r, y2: 0, t: 0, life: 30, color: '#ffffff' });
  if (pw === 'storm') (s.hazards ??= []).push({ x, y, until: s.tick + 10 * TICK_RATE, owner, weapon: 'lightning' });
  if (pw === 'hammer') s.projectiles.push({ x: centerX(b), y: centerY(b), tx: x, ty: y, targetId: 0, owner, weapon: 'hammerBlast', sourceId: b.id }); // a few seconds of flight, everybody sees it coming
  if (pw === 'stasis')
    for (const o of inArea(s, x, y, r)) {
      if (o.kind === 'unit' && UNITS[o.def].category === 'infantry') damage(s, o, 1e9, owner, undefined, 'superweapon');
      else o.stasisUntil = s.tick + 20 * TICK_RATE;
    }
  if (pw === 'dominion')
    for (const o of inArea(s, x, y, r)) {
      if (o.owner === owner || (o.kind === 'unit' && UNITS[o.def].hero) || (o.kind === 'building' && BUILDINGS[o.def].bridge)) continue;
      emit(s, { type: 'captured', owner, from: o.mcOwner ?? o.owner, def: o.def });
      o.owner = owner; o.mcBy = 0; o.mcOwner = undefined; o.seenBy |= 1 << owner;
      o.targetId = 0; o.repairing = false; o.rallyX = o.rallyY = -1;
      if (o.kind === 'unit') { stopMove(o); o.order = { type: UNITS[o.def].harvester ? 'harvest' : 'idle', tx: o.x, ty: o.y, targetId: 0 }; o.hstate = 'seek'; }
    }
  if (pw === 'mutagen')
    for (const o of inArea(s, x, y, r)) {
      if (o.owner === owner || o.kind !== 'unit' || UNITS[o.def].category !== 'infantry' || UNITS[o.def].hero) continue;
      o.hp = 0; // mutated, not killed
      emit(s, { type: 'mutated', owner, from: o.owner, def: o.def, cost: UNITS[o.def].cost });
      s.players[o.owner].stats.losses++;
      spawnUnit(s, 'brute', owner, o.x, o.y);
      emit(s, { type: 'spawned', owner, def: 'brute', reason: 'mutagen' });
      s.effects.push({ kind: 'flash', x: o.x, y: o.y, x2: 0, y2: 0, t: 0, life: 12, color: '#9dff6a' });
    }
  if (pw === 'phasegate') phase(s, owner, x, y, x2, y2, r);
  return true;
}

/** Phase Gate: vehicles keep their formation; infantry is lost unless it can phase itself; whatever lands where it can't be dies. */
function phase(s: GameState, owner: number, x: number, y: number, x2: number, y2: number, r: number) {
  for (const o of inArea(s, x, y, r)) {
    if (o.kind !== 'unit' || UNITS[o.def].air) continue;
    const d = UNITS[o.def];
    if (d.category === 'infantry' && !d.teleport && !d.hero) { damage(s, o, 1e9, owner, undefined, 'superweapon'); continue; }
    if (d.category === 'infantry') continue; // Phase Troopers and heroes stay where they are
    const nx = x2 + (o.x - x), ny = y2 + (o.y - y), mv = d.move ?? 'ground';
    const tx = Math.floor(nx), ty = Math.floor(ny);
    const ok = tx >= 0 && ty >= 0 && tx < s.map.w && ty < s.map.h && terrainPassable(s.map, idx(s.map, tx, ty), mv);
    const spot = !ok ? null : blockedAt(s, nx, ny, mv) ? freeSpot(s, nx, ny, 2, false, mv) : [nx, ny];
    s.effects.push({ kind: 'flash', x: o.x, y: o.y, x2: 0, y2: 0, t: 0, life: 12, color: '#7ff5ff' });
    if (!spot) { damage(s, o, 1e9, owner, undefined, 'superweapon'); continue; } // into the sea or the rocks
    o.x = o.px = spot[0]; o.y = o.py = spot[1];
    stopMove(o);
    o.order = { type: UNITS[o.def].harvester ? 'harvest' : 'idle', tx: o.x, ty: o.y, targetId: 0 };
    o.hstate = 'seek'; o.targetId = 0;
    o.frozenUntil = s.tick + 3 * TICK_RATE;
    s.effects.push({ kind: 'flash', x: o.x, y: o.y, x2: 0, y2: 0, t: 0, life: 12, color: '#7ff5ff' });
  }
}
