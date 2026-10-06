import { regions } from '../world/map';
import { emit } from '../core/events';
import { armed, logDecision } from './telemetry';
import { BUILDINGS } from '../data/buildings';
import { REPAIR_COST_FACTOR, REPAIR_HP_PER_TICK, SELL_REFUND, TICK_RATE } from '../data/config';
import { UNITS } from '../data/units';
import { blockedAt, centerX, centerY, distTo, freeSpot, markGrid, moveOf } from '../core/entities';
import type { MoveKind } from '../world/map';
import type { Entity, GameState } from '../types';
import { acquire, berserk, canSee, engage, rangeOf, rankOf, validTarget, weaponFor, weaponOf } from './combat';
import { harvestTick, isLowPower } from './economy';
import { isMoving, moveStep, requestMove, stopMove, turnToward } from './movement';
import { assignPad, buildUpTick, padPos } from './production';
import { repairBridge } from './bridges';
import { chargeTick, superweaponsOn } from './powers';

// --- Commands (used by player input and AI). Ownership is enforced here. ---

const own = (s: GameState, owner: number, ids: number[]) =>
  ids.map((id) => s.rt.byId.get(id)).filter((e): e is Entity => !!e && e.hp > 0 && e.owner === owner && e.kind === 'unit' && !e.inside);

/** Spread destinations for a group: one free tile each, nearest first. */
export function formationSlots(s: GameState, x: number, y: number, n: number, mv: MoveKind = 'ground'): [number, number][] {
  const out: [number, number][] = [];
  const bx = Math.floor(x), by = Math.floor(y);
  // Slots stay in the clicked spot's terrain region (no slots across a river or behind rocks).
  const reg = regions(s.map, mv), inMap = bx >= 0 && by >= 0 && bx < s.map.w && by < s.map.h;
  const want = inMap ? reg[by * s.map.w + bx] : -1;
  for (let r = 0; out.length < n && r < 12; r++)
    for (let dy = -r; dy <= r && out.length < n; dy++)
      for (let dx = -r; dx <= r && out.length < n; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (!blockedAt(s, bx + dx, by + dy, mv) && (want < 0 || reg[(by + dy) * s.map.w + bx + dx] === want)) out.push([bx + dx + 0.5, by + dy + 0.5]);
      }
  if (!out.length) out.push([x, y]);
  if (n === 1 && !blockedAt(s, x, y, mv)) out[0] = [x, y];
  return out;
}

export function commandMove(s: GameState, owner: number, ids: number[], x: number, y: number, attackMove = false) {
  const us = own(s, owner, ids);
  // One layer for the group: all-amphibious groups may get slots on water, mixed groups stay on land.
  const mvs = new Set(us.map(moveOf));
  const slots = formationSlots(s, x, y, us.length, mvs.size === 1 ? [...mvs][0] : 'ground');
  // Greedy: closest unit to the target takes the nearest slot.
  us.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
  const far = us.filter(armed).reduce((m, u) => Math.max(m, Math.hypot(u.x - x, u.y - y)), 0);
  if (us.length) logDecision(s, owner, attackMove ? 'attackMove' : 'move', `${Math.floor(x)},${Math.floor(y)}`, far);
  us.forEach((u, k) => {
    const [sx, sy] = slots[k % slots.length];
    u.order = { type: attackMove ? 'attackMove' : 'move', tx: sx, ty: sy, targetId: 0 };
    u.targetId = 0;
    u.dug = u.deployed = false; // moving gets dug-in / deployed infantry back on its feet
    if (UNITS[u.def].harvester) u.hstate = 'seek';
    requestMove(u, sx, sy);
  });
  return us.length;
}

export function commandAttack(s: GameState, owner: number, ids: number[], targetId: number) {
  const t = s.rt.byId.get(targetId);
  if (!t || t.owner === owner || !canSee(s, owner, t)) return 0;
  const us = own(s, owner, ids).filter((u) => weaponFor(u, t));
  if (us.length) logDecision(s, owner, 'attack', String(targetId), us.filter(armed).reduce((m, u) => Math.max(m, distTo(u.x, u.y, t)), 0));
  for (const u of us) { u.order = { type: 'attack', tx: 0, ty: 0, targetId }; u.targetId = targetId; stopMove(u); }
  return us.length;
}

/** Engineers: capture an enemy building, or fully repair an own damaged one. Infiltrators: sabotage an enemy one. Both are used up. */
export function commandCapture(s: GameState, owner: number, ids: number[], targetId: number) {
  const t = s.rt.byId.get(targetId);
  if (!t || t.kind !== 'building' || t.hp <= 0 || BUILDINGS[t.def].wall || !canSee(s, owner, t)) return 0;
  const b = BUILDINGS[t.def];
  if (b.bridge || b.garrison) return 0; // bridges are shot, town buildings are garrisoned
  if (b.repairsBridge && !s.rt.byId.get(t.link ?? 0)?.ruined) return 0; // hut only matters when its bridge is down
  const us = own(s, owner, ids).filter((u) => (UNITS[u.def].engineer && (b.repairsBridge || t.owner !== owner || t.hp < b.hp)) || (UNITS[u.def].infiltrate && t.owner !== owner && t.owner !== s.neutral));
  if (us.length) logDecision(s, owner, 'capture', t.def);
  for (const u of us) { u.order = { type: 'capture', tx: 0, ty: 0, targetId }; requestMove(u, centerX(t), centerY(t)); }
  return us.length;
}

/** Infantry boards an own transport with free seats (as many as fit, nearest first). */
/** Seats in a transport, or garrison slots in a civilian building. */
export const seatsOf = (t: Entity) => (t.kind === 'unit' ? UNITS[t.def].transport : BUILDINGS[t.def].garrison) ?? 0;
/** May `owner`'s infantry get in? Own transports/buildings, or an empty civilian building. */
export const mayEnter = (s: GameState, owner: number, t: Entity) =>
  t.hp > 0 && (seatsOf(t) > 0 || recycler(t)) && (t.owner === owner || (t.kind === 'building' && t.owner === s.neutral && !recycler(t)));
const recycler = (t: Entity) => t.kind === 'building' && t.built >= 1 && !!BUILDINGS[t.def].recycles;
/** Who may go in: infantry into seats; any own ground unit into a Reclaimer. */
const enters = (t: Entity, u: Entity) => u !== t && !u.inside && (recycler(t) ? !UNITS[u.def].air && UNITS[u.def].move !== 'water' && !UNITS[u.def].hero : UNITS[u.def].category === 'infantry');

export function commandEnter(s: GameState, owner: number, ids: number[], transportId: number) {
  const t = s.rt.byId.get(transportId);
  if (!t || !mayEnter(s, owner, t)) return 0;
  const free = recycler(t) ? Infinity : seatsOf(t) - (t.passengers?.length ?? 0) - s.entities.filter((e) => e.order.type === 'enter' && e.order.targetId === t.id && !ids.includes(e.id)).length;
  const us = own(s, owner, ids).filter((u) => enters(t, u))
    .sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y)).slice(0, Math.max(0, free));
  for (const u of us) { u.order = { type: 'enter', tx: 0, ty: 0, targetId: t.id }; u.dug = false; requestMove(u, centerX(t), centerY(t)); }
  return us.length;
}

/** Everyone out: passengers step onto free tiles around the transport / building. */
export function unload(s: GameState, t: Entity) {
  const cx = centerX(t), cy = centerY(t), r = t.kind === 'building' ? Math.max(BUILDINGS[t.def].w, BUILDINGS[t.def].h) : 0;
  for (const id of t.passengers ?? []) {
    const u = s.rt.byId.get(id);
    if (!u) continue;
    // Amphibious transports on water can only unload right at the shore.
    const spot = moveOf(t) === 'ground' ? freeSpot(s, cx, cy, 3 + r) ?? freeSpot(s, cx, cy, 6 + r, false) : freeSpot(s, cx, cy, 1.5, false);
    if (!spot) break;
    u.inside = undefined;
    if (t.kind === 'building') u.dug = false;
    u.x = u.px = spot[0]; u.y = u.py = spot[1];
    toIdle(u);
    t.passengers = t.passengers!.filter((p) => p !== id);
  }
  if (!t.passengers?.length) {
    t.gunWeapon = undefined;
    if (t.kind === 'building' && s.neutral !== undefined) { t.owner = s.neutral; t.repairing = false; } // empty town building: back to the civilians
  }
}

export function commandStop(s: GameState, owner: number, ids: number[]) {
  for (const u of own(s, owner, ids)) {
    stopMove(u);
    u.targetId = 0;
    u.order = { type: UNITS[u.def].harvester ? 'harvest' : 'idle', tx: u.x, ty: u.y, targetId: 0 };
    if (UNITS[u.def].harvester) u.hstate = 'seek';
  }
}

export function commandGuard(s: GameState, owner: number, ids: number[]) {
  for (const u of own(s, owner, ids).filter((u) => weaponOf(u))) {
    stopMove(u);
    u.order = { type: 'guard', tx: u.x, ty: u.y, targetId: 0 };
  }
}

/** Harvesters: mine a specific ore tile, return to a refinery, or resume auto-harvesting. */
export function commandHarvest(s: GameState, owner: number, ids: number[], opts: { toRefinery?: boolean; tile?: [number, number] } = {}) {
  for (const u of own(s, owner, ids).filter((u) => UNITS[u.def].harvester)) {
    u.order = { type: 'harvest', tx: 0, ty: 0, targetId: 0 };
    u.hstate = opts.toRefinery && u.cargo > 0 ? 'toRef' : 'seek';
    u.targetId = 0;
    stopMove(u);
    if (opts.tile && !opts.toRefinery) { requestMove(u, opts.tile[0] + 0.5, opts.tile[1] + 0.5); u.hstate = 'toOre'; }
  }
}

// --- Building commands ---

const ownBuilding = (s: GameState, owner: number, id: number) => {
  const e = s.rt.byId.get(id);
  return e && e.hp > 0 && e.owner === owner && e.kind === 'building' ? e : undefined;
};

/** Toggle repair on an own, damaged building. Repair drains credits while it runs. */
export function toggleRepair(s: GameState, owner: number, id: number): boolean {
  const e = ownBuilding(s, owner, id);
  if (!e || e.built < 1) return false;
  e.repairing = !e.repairing && e.hp < BUILDINGS[e.def].hp;
  if (e.repairing) logDecision(s, owner, 'repair', e.def, 0);
  return true;
}

/** Sell an own building: refund part of the cost (scaled by health) and remove it. */
export function sellBuilding(s: GameState, owner: number, id: number): number {
  const e = ownBuilding(s, owner, id);
  if (!e || BUILDINGS[e.def].neutralOnly) return 0; // town and tech buildings can't be sold
  const d = BUILDINGS[e.def];
  const refund = Math.floor(d.cost * SELL_REFUND * (e.hp / d.hp) * e.built);
  s.players[owner].credits += refund;
  logDecision(s, owner, 'sell', e.def);
  e.hp = 0; // removed in the regular dead-entity cleanup (no kill credit)
  markGrid(s, e, 0);
  s.effects.push({ kind: 'smoke', x: centerX(e), y: centerY(e), x2: 0, y2: 0, t: 0, life: 45, color: '' });
  return refund;
}

/** Rally point for a production building: new units drive there. */
export function setRally(s: GameState, owner: number, id: number, x: number, y: number): boolean {
  const e = ownBuilding(s, owner, id);
  if (!e || !BUILDINGS[e.def].produces || e.def === 'cy') return false;
  e.rallyX = x; e.rallyY = y;
  return true;
}

// --- Per-tick behaviour ---

export function unitTick(s: GameState, e: Entity) {
  if (e.cooldown > 0) e.cooldown--;
  const d = UNITS[e.def];
  const w = weaponOf(e);
  const o = e.order;
  const regen = (d.regen ?? 0) + (rankOf(e) === 2 ? 0.05 : 0); // elite units heal slowly
  if (regen && e.hp < d.hp && s.tick - e.lastHit > 5 * TICK_RATE) e.hp = Math.min(d.hp, e.hp + regen); // heals only out of combat

  if (e.inside) { const t = s.rt.byId.get(e.inside); if (t) { e.x = e.px = centerX(t); e.y = e.py = centerY(t); } return; }
  if ((e.frozenUntil ?? 0) > s.tick) return; // frozen in time
  if (berserk(s, e)) {
    // Delirium: attack whatever is closest, friend or foe; orders are ignored.
    const t = w ? acquire(s, e, Math.max(d.sight, rangeOf(e, w))) : undefined;
    if (t && !engage(s, e, t)) chase(e, t);
    moveStep(s, e);
    return;
  }
  if (o.type === 'capture') { captureTick(s, e); return; }
  if (o.type === 'enter') { enterTick(s, e); return; }
  if (o.type === 'rearm') { rearmTick(s, e); return; }
  if (e.landed && e.pad && !s.rt.byId.get(e.pad)) e.landed = false; // airfield gone
  if (e.dug || e.deployed) stopMove(e);
  if (e.ammo === 0 && o.type !== 'move') { e.order = { type: 'rearm', tx: 0, ty: 0, targetId: 0 }; return; }

  if (o.type === 'harvest') { harvestTick(s, e); return; }

  if (o.type === 'attack') {
    const t = s.rt.byId.get(o.targetId);
    if (!validTarget(s, e, t, true)) { toIdle(e); }
    else {
      if (!engage(s, e, t)) chase(e, t);
      else if (isMoving(e)) stopMove(e);
      if (moveStep(s, e) === 'gaveUp') toIdle(e);
      return;
    }
  }

  if (o.type === 'attackMove' || o.type === 'guard') {
    const t = w ? acquire(s, e, Math.max(d.sight, rangeOf(e, w))) : undefined;
    const leashOk = t && (o.type === 'attackMove' || distTo(o.tx, o.ty, t) <= d.sight + 2);
    if (t && leashOk) {
      if (engage(s, e, t)) { if (isMoving(e)) stopMove(e); }
      else chase(e, t);
    } else {
      e.targetId = 0;
      const far = Math.hypot(o.tx - e.x, o.ty - e.y) > (o.type === 'guard' ? 1.5 : 0.8);
      if (far && !isMoving(e) && !e.noPath) requestMove(e, o.tx, o.ty);
      if (!far && o.type === 'attackMove') { toIdle(e); }
    }
    const st = moveStep(s, e);
    if (st === 'gaveUp' && o.type === 'attackMove') toIdle(e);
    if (st === 'gaveUp' && o.type === 'guard') { o.tx = e.x; o.ty = e.y; } // unreachable guard spot: guard here instead
    if (st === 'arrived' && o.type === 'attackMove' && !e.targetId) toIdle(e);
    return;
  }

  // move / idle: fire at whatever is in range without chasing.
  const st = moveStep(s, e);
  if (o.type === 'move' && (st === 'arrived' || st === 'gaveUp' || st === 'idle')) toIdle(e);
  const t = w ? acquire(s, e, rangeOf(e, w)) : undefined;
  if (t) engage(s, e, t);
  else if (e.kind === 'unit' && d.category === 'vehicle') e.turret = turnToward(e.turret, e.facing, 0.08);
}

function captureTick(s: GameState, e: Entity) {
  const t = s.rt.byId.get(e.order.targetId);
  if (!t || t.hp <= 0 || t.kind !== 'building') { toIdle(e); return; }
  if (distTo(e.x, e.y, t) <= 0.9) {
    if (UNITS[e.def].infiltrate) infiltrate(s, e, t);
    else if (BUILDINGS[t.def].repairsBridge) { const lead = s.rt.byId.get(t.link ?? 0); if (lead?.ruined) repairBridge(s, lead); }
    else if (t.owner !== e.owner) {
      emit(s, { type: 'captured', owner: e.owner, from: t.owner, def: t.def });
      t.owner = e.owner;
      t.seenBy |= 1 << e.owner;
      t.repairing = false; t.rallyX = t.rallyY = -1; t.targetId = 0;
    } else t.hp = BUILDINGS[t.def].hp;
    e.hp = 0; // the engineer moves in (removed without a kill)
    return;
  }
  if (!isMoving(e)) requestMove(e, centerX(t), centerY(t));
  if (moveStep(s, e) === 'gaveUp') toIdle(e);
}

function enterTick(s: GameState, e: Entity) {
  const t = s.rt.byId.get(e.order.targetId);
  if (!t || !mayEnter(s, e.owner, t) || (!recycler(t) && (t.passengers?.length ?? 0) >= seatsOf(t))) { toIdle(e); return; }
  const bld = t.kind === 'building', tx = centerX(t), ty = centerY(t);
  const d = bld ? distTo(e.x, e.y, t) : Math.hypot(t.x - e.x, t.y - e.y);
  const board = () => {
    if (recycler(t)) { // Reclaimer: half the unit's price back
      if (e.passengers?.length) unload(s, e);
      const back = Math.floor(UNITS[e.def].cost * 0.5);
      s.players[e.owner].credits += back;
      s.players[e.owner].stats.harvested += back;
      e.hp = 0;
      s.effects.push({ kind: 'smoke', x: tx, y: ty, x2: 0, y2: 0, t: 0, life: 40, color: '' });
      return;
    }
    if (bld && t.owner !== e.owner) { // moving into an empty town building claims it
      t.owner = e.owner; t.seenBy |= 1 << e.owner;
      emit(s, { type: 'garrisoned', owner: e.owner, def: t.def });
    }
    (t.passengers ??= []).push(e.id);
    e.inside = t.id; e.targetId = 0;
    if (bld) e.dug = true; // fires from cover: +range
    if (!bld && UNITS[t.def].gunner) t.gunWeapon = UNITS[e.def].gunnerWeapon;
    stopMove(e);
  };
  if (d <= (bld ? 0.9 : UNITS[t.def].radius + 0.6)) { board(); return; }
  if (!e.noPath && (!isMoving(e) || Math.hypot(tx - e.gx, ty - e.gy) > 1)) requestMove(e, tx, ty); // no re-request while 'gaveUp' is pending
  // Can't step onto its tile (vehicle parked on a rock edge or shore): right next to it is close enough.
  if (moveStep(s, e) === 'gaveUp') { if (d < 1.6) board(); else toIdle(e); }
}

/** Aircraft out of ammo: fly to an own landing pad, land, reload one shot per second. */
function rearmTick(s: GameState, e: Entity) {
  const d = UNITS[e.def];
  let b = s.rt.byId.get(e.pad ?? 0);
  if (!b || b.hp <= 0 || b.owner !== e.owner) {
    e.landed = false;
    if (s.tick % 30 !== e.id % 30 || !assignPad(s, e)) { moveStep(s, e); return; } // no pad: circle in place, retry
    b = s.rt.byId.get(e.pad!)!;
  }
  const [px, py] = padPos(b, e.padK!);
  if (!e.landed) {
    if (Math.hypot(px - e.x, py - e.y) < 0.1) { e.landed = true; stopMove(e); return; }
    if (!isMoving(e)) requestMove(e, px, py);
    moveStep(s, e);
    return;
  }
  if (b.built >= 1 && s.tick % 30 === 0) e.ammo = Math.min(d.ammo!, (e.ammo ?? 0) + 1);
  if (e.ammo === d.ammo) { e.order = { type: 'idle', tx: e.x, ty: e.y, targetId: 0 }; }
}

/** Infiltrator inside an enemy building: the effect depends on what it is. */
function infiltrate(s: GameState, e: Entity, t: Entity) {
  const me = s.players[e.owner], them = s.players[t.owner];
  emit(s, { type: 'infiltrated', owner: e.owner, from: t.owner, def: t.def });
  if (t.def === 'refinery') { const take = Math.floor(them.credits / 2); them.credits -= take; me.credits += take; me.stats.stolen = (me.stats.stolen ?? 0) + take; }
  else if (BUILDINGS[t.def].power > 0) them.outage = s.tick + 45 * TICK_RATE;
  else if (t.def === 'radar') them.explored.fill(0);
  else if (t.def === 'barracks') (me.vet ??= {}).infantry = true;
  else if (t.def === 'factory') (me.vet ??= {}).vehicle = true;
  else for (const b of s.entities) if (b.owner === t.owner && b.kind === 'building') b.seenBy |= 1 << e.owner; // intel: the whole base
}

function toIdle(e: Entity) {
  const harv = UNITS[e.def].harvester;
  e.order = { type: harv ? 'harvest' : 'idle', tx: e.x, ty: e.y, targetId: 0 };
  if (harv) e.hstate = 'seek';
  e.targetId = 0;
  stopMove(e);
}

function chase(e: Entity, t: Entity) {
  const tx = centerX(t), ty = centerY(t);
  if (e.noPath) return; // unreachable: let moveStep report 'gaveUp'
  if (!isMoving(e) || Math.hypot(tx - e.gx, ty - e.gy) > 1.5) requestMove(e, tx, ty);
}

export function buildingTick(s: GameState, e: Entity) {
  buildUpTick(s, e);
  if (e.cooldown > 0) e.cooldown--;
  const d = BUILDINGS[e.def];
  if (e.repairing) {
    const p = s.players[e.owner];
    const heal = Math.min(REPAIR_HP_PER_TICK, d.hp - e.hp);
    const cost = (heal / d.hp) * d.cost * REPAIR_COST_FACTOR;
    if (heal <= 0) e.repairing = false;
    else if (p.credits >= cost) { p.credits -= cost; e.hp += heal; }
  }
  if (d.repairs && e.built >= 1) depotTick(s, e);
  if (d.superweapon && e.built >= 1 && superweaponsOn(s)) chargeTick(s, e);
  if (e.owner !== s.neutral && s.tick % TICK_RATE === 0) techTick(s, e, d);
  if (e.passengers?.length) garrisonFire(s, e);
  if (!d.weapon || e.built < 1 || (e.frozenUntil ?? 0) > s.tick) return;
  // Arc Coil charged by an own Arc Trooper next to it: runs without power and fires twice as fast.
  const charged = e.def === 'coil' && s.entities.some((u) => u.owner === e.owner && u.def === 'arc' && u.hp > 0 && !u.inside && distTo(u.x, u.y, e) < 1.6);
  if (charged && e.cooldown > 0) e.cooldown--;
  if (d.needsPower && isLowPower(s, e.owner) && !charged) return;
  const t = acquire(s, e, weaponOf(e)!.range);
  if (t) engage(s, e, t);
  if (charged && e.lastShot === s.tick) emit(s, { type: 'ability', owner: e.owner, def: e.def, ability: 'arccharge' }); // telemetry: Red Bloc faction mechanic
}

/** Captured tech buildings: income, or healing for the owner's infantry / vehicles everywhere (once a second). */
function techTick(s: GameState, e: Entity, d: (typeof BUILDINGS)[string]) {
  const p = s.players[e.owner];
  if (d.income) { p.credits += d.income; p.stats.harvested += d.income; }
  if (d.heals)
    for (const u of s.entities)
      if (u.owner === e.owner && u.kind === 'unit' && u.hp > 0 && UNITS[u.def].category === d.heals) u.hp = Math.min(UNITS[u.def].hp, u.hp + UNITS[u.def].hp * 0.02);
}

/** Garrisoned building: every occupant fires its own weapon from the building (with the cover range bonus). */
function garrisonFire(s: GameState, e: Entity) {
  for (const id of e.passengers!) {
    const u = s.rt.byId.get(id), w = u && weaponOf(u);
    if (!u || !w) continue;
    u.x = centerX(e); u.y = centerY(e);
    const t = acquire(s, u, rangeOf(u, w)); // measured from the building's centre
    if (t) engage(s, u, t);
  }
}

/** Repair depot: heals own vehicles parked next to it, paid like building repair. */
function depotTick(s: GameState, e: Entity) {
  const p = s.players[e.owner];
  for (const u of s.entities) {
    if (u.owner !== e.owner || u.kind !== 'unit' || u.hp <= 0) continue;
    const ud = UNITS[u.def];
    if (ud.category !== 'vehicle' || u.hp >= ud.hp || isMoving(u) || distTo(u.x, u.y, e) > 1.3) continue;
    if (u.leechBy !== undefined) u.leechBy = undefined; // mechanics pull the drone out
    const heal = Math.min(REPAIR_HP_PER_TICK * 2, ud.hp - u.hp);
    const cost = (heal / ud.hp) * ud.cost * REPAIR_COST_FACTOR;
    if (p.credits < cost) return;
    p.credits -= cost; u.hp += heal;
  }
}
