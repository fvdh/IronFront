import { BUILDINGS } from '../data/buildings';
import { emit } from '../core/events';
import { SCAN_INTERVAL, TICK_RATE } from '../data/config';
import { UNITS } from '../data/units';
import { WEAPONS, type WeaponDef } from '../data/weapons';
import { centerX, centerY, distTo } from '../core/entities';
import type { DeathCause, Entity, GameState, Projectile } from '../types';
import { isLowPower } from './economy';
import { idx, nextRandom } from '../world/map';
import { angleDiff, turnToward } from './movement';
import { damageBridge } from './bridges';

export const armorOf = (e: Entity) => (e.kind === 'building' ? 'building' : UNITS[e.def].armor);
/** Primary weapon id right now: deployed weapon (Siege Rotor), the one lent by its passenger (IFV), else the def's. */
export function primaryId(e: Entity): string | undefined {
  if (e.kind === 'building') return BUILDINGS[e.def].weapon;
  const d = UNITS[e.def];
  return (e.deployed && d.deployWeapon) || e.gunWeapon || d.weapon;
}
export const weaponOf = (e: Entity): WeaponDef | undefined => {
  const w = primaryId(e);
  return w ? WEAPONS[w] : undefined;
};

/** The weapon `e` uses on `t`: primary, else the secondary (C4, designator) when only that one works. */
export function weaponFor(e: Entity, t: Entity): [string, WeaponDef] | undefined {
  for (const id of [primaryId(e), e.kind === 'unit' && !e.deployed ? UNITS[e.def].weapon2 : undefined]) if (id && canHit(WEAPONS[id], t)) return [id, WEAPONS[id]];
  return undefined;
}

/** Shroud Tank holding still and silent: shows as a tree. */
export const mimicking = (s: GameState, e: Entity) => e.kind === 'unit' && !!UNITS[e.def].mimic && s.tick - (e.movedAt ?? -1e9) > 30 && s.tick - (e.lastShot ?? -1e9) > 60;

/** Enemy spy / mimic that `viewer` can't see through (no detector of theirs nearby). */
export function disguisedFrom(s: GameState, e: Entity, viewer: number): boolean {
  const r = e.kind === 'unit' && (UNITS[e.def].disguise || mimicking(s, e)) && e.owner !== viewer;
  return !!r && !detected(s, e, viewer);
}
/** A detector (`detects`: dogs, sonar ships) of `viewer` is close enough to `e`. */
const detected = (s: GameState, e: Entity, viewer: number) =>
  s.entities.some((d) => d.owner === viewer && d.hp > 0 && !d.inside && d.built >= 1 && ((d.kind === 'unit' ? UNITS : BUILDINGS)[d.def].detects ?? 0) >= Math.hypot(centerX(d) - e.x, centerY(d) - e.y));

/** Stealth sub under water right now: it surfaces for 1.5 s after each shot. */
export const submerged = (s: GameState, e: Entity) => e.kind === 'unit' && !!UNITS[e.def].stealth && s.tick - (e.lastShot ?? -1e9) >= 45;
/** Sails on water (ships, subs) or stands on it (Naval Yard): what `navalOnly` weapons can hit. */
export const onWater = (e: Entity) => (e.kind === 'unit' ? UNITS[e.def].move === 'water' : !!BUILDINGS[e.def].naval);

export const isAir = (e: Entity) => e.kind === 'unit' && !!UNITS[e.def].air && !e.landed && !e.deployed; // parked / landed aircraft are ground targets
/** Damage multiplier of `w` against `t`: its armour, with the anti-air override against flying targets. */
export const versusOf = (w: WeaponDef, t: Entity) => (isAir(t) ? w.versusAir?.[armorOf(t)] : undefined) ?? w.versus[armorOf(t)];
export const berserk = (s: GameState, e: Entity) => (e.berserkUntil ?? 0) > s.tick;
/** Weapon range including the dug-in bonus. */
export const rangeOf = (e: Entity, w: WeaponDef) => w.range + (e.dug ? 1.5 : 0);
/** Can weapon `w` affect `t` at all (air needs anti-air; zero-damage armour; mind control only takes free ground/air units)? */
export function canHit(w: WeaponDef, t: Entity): boolean {
  if (isAir(t) ? !w.aa : w.airOnly) return false;
  if ((t.phased ?? 0) > 0 && !w.phase) return false; // being erased: out of time, untouchable
  if (t.ruined) return false;
  if (w.navalOnly && !onWater(t)) return false;
  if (t.kind === 'unit' && UNITS[t.def].stealth && !w.sub) return false; // only torpedoes, depth charges and sonar reach a sub
  if (w.fuse && t.bombAt) return false; // one bomb is enough
  if (w.control) return t.kind === 'unit' ? !w.buildingsOnly && !WEAPONS[UNITS[t.def].weapon ?? '']?.control && !UNITS[t.def].hero && !UNITS[t.def].drone && !controlled(t) : !!w.controlBuildings && !BUILDINGS[t.def].wall && t.def !== 'cy' && !BUILDINGS[t.def].superweapon;
  return versusOf(w, t) > 0;
}
/** Live mind-control link? */
export const controlled = (t: Entity) => !!t.mcBy;

/** Veterancy rank 0..2: veteran after killing its own value, elite after three times that. */
export function rankOf(e: Entity): number {
  const cost = (e.kind === 'building' ? BUILDINGS[e.def] : UNITS[e.def]).cost || 1;
  const xp = e.xp ?? 0;
  return xp >= cost * 3 ? 2 : xp >= cost ? 1 : 0;
}

/** Can `owner` currently see `e`? Buildings stay known once seen (they don't move). */
export function canSee(s: GameState, owner: number, e: Entity): boolean {
  if (e.owner === owner) return true;
  if (e.kind === 'building') return (e.seenBy & (1 << owner)) !== 0;
  const tx = Math.floor(e.x), ty = Math.floor(e.y);
  return s.players[owner].visible[idx(s.map, tx, ty)] === 1 && !(submerged(s, e) && !detected(s, e, owner));
}

/** Enemies — or anyone at all for a unit in a delirium rage. The civilians are nobody's enemy. */
export const isEnemy = (s: GameState, a: Entity, b: Entity) => a !== b && b.owner !== s.neutral && (a.owner !== b.owner || berserk(s, a));

/** `forced`: an explicit attack order may also hit civilian buildings and bridges. */
export const validTarget = (s: GameState, e: Entity, t: Entity | undefined, forced = false): t is Entity =>
  !!t && t.hp > 0 && !t.inside && !t.ruined && (isEnemy(s, e, t) || (forced && t.owner === s.neutral && t.owner !== e.owner)) && canSee(s, e.owner, t);

/** Nearest visible enemy within radius. Units are preferred over buildings at similar range. */
export function scanTarget(s: GameState, e: Entity, radius: number): Entity | undefined {
  const x = centerX(e), y = centerY(e);
  let best: Entity | undefined, bestD = Infinity;
  for (const t of s.entities) {
    if (!isEnemy(s, e, t) || t.hp <= 0 || t.inside || (t.kind === 'building' && BUILDINGS[t.def].wall)) continue; // walls only on command
    if (!weaponFor(e, t)) continue; // e.g. dogs ignore vehicles, ground guns ignore aircraft
    if (disguisedFrom(s, t, e.owner)) continue; // looks like one of ours
    const d = distTo(x, y, t) + (t.kind === 'building' ? 1.5 : 0) + (weaponOf(t) ? 0 : 0.8);
    if (d - 2.3 > radius || d >= bestD) continue;
    if (distTo(x, y, t) > radius || !canSee(s, e.owner, t)) continue;
    best = t; bestD = d;
  }
  return best;
}

/** Keep or acquire an auto-target within radius (throttled scans). */
export function acquire(s: GameState, e: Entity, radius: number): Entity | undefined {
  const cur = s.rt.byId.get(e.targetId);
  if (validTarget(s, e, cur) && distTo(centerX(e), centerY(e), cur) <= radius + 1) return cur;
  e.targetId = 0;
  if (--e.scanTimer > 0) return undefined;
  e.scanTimer = SCAN_INTERVAL;
  const t = scanTarget(s, e, radius);
  if (t) e.targetId = t.id;
  return t;
}

/** Aim at and fire on `t` if in range. Returns true when in range. */
export function engage(s: GameState, e: Entity, t: Entity): boolean {
  const pick = weaponFor(e, t);
  if (!pick || e.landed || (e.ammo !== undefined && e.ammo <= 0)) return false;
  const [wid, w] = pick;
  const x = centerX(e), y = centerY(e);
  if (distTo(x, y, t) > rangeOf(e, w)) return false;
  if (w.control && t.kind === 'unit' && held(s, e) >= (w.maxControl ? w.maxControl + 1 : 1)) return false; // hands full (a Hivemind may overload itself by 1)
  const want = Math.atan2(centerY(t) - y, centerX(t) - x);
  e.turret = turnToward(e.turret, want, e.kind === 'unit' && UNITS[e.def].category === 'infantry' ? 1 : 0.22);
  if (e.kind === 'unit' && UNITS[e.def].category === 'infantry') e.facing = e.turret;
  if (e.cooldown > 0 || Math.abs(angleDiff(e.turret, want)) >= 0.3) return true;
  if (w.control && !charged(s, e, t, w)) return true; // the beam has to hold first
  fire(s, e, t, w, wid);
  return true;
}

/** Mind control lands only after the beam holds: 1 s + 0.5 s per 500 credits for a unit, 5 s for a building.
 *  A new target restarts the clock; hitting a controller that is taking a building breaks it (see damage). */
export const chargeTicks = (t: Entity) => (t.kind === 'building' ? 5 * TICK_RATE : Math.round(TICK_RATE * (1 + UNITS[t.def].cost / 1000)));
function charged(s: GameState, e: Entity, t: Entity, w: WeaponDef): boolean {
  if (e.chargeOn !== t.id || s.tick - (e.chargeLast ?? -1e9) > 3) { // new target, or the beam broke (out of range, retargeted)
    if (e.chargeOn) beamBroken(s, e);
    e.chargeOn = t.id; e.chargeUntil = s.tick + chargeTicks(t);
    emit(s, { type: 'mindControlStart', owner: e.owner, from: t.owner, def: e.def, target: t.def, x: centerX(t), y: centerY(t) });
  }
  e.chargeLast = s.tick;
  if (s.tick % 6 === 0) s.effects.push({ kind: 'beam', x: centerX(e), y: centerY(e), x2: centerX(t), y2: centerY(t), t: 0, life: 6, color: w.color }); // visible while charging
  if (s.tick < (e.chargeUntil ?? 0)) return false;
  e.chargeOn = 0;
  return true;
}

/** The beam on `e.chargeOn` broke before it landed (telemetry; the clock restarts on the next beam). */
function beamBroken(s: GameState, e: Entity) {
  const t = s.rt.byId.get(e.chargeOn!);
  if (t) emit(s, { type: 'mindControlBroken', owner: e.owner, from: t.owner, def: e.def, target: t.def });
  e.chargeOn = 0;
}

function fire(s: GameState, e: Entity, t: Entity, w: WeaponDef, wid: string) {
  // Gatling weapons spin up: each shot within the firing rhythm shortens the next cooldown.
  if (mimicking(s, e)) emit(s, { type: 'ability', owner: e.owner, def: e.def, ability: 'ambush' }); // fires out of its disguise
  e.heat = w.ramp && s.tick - (e.lastShot ?? -1e9) <= w.cooldown + 15 ? (e.heat ?? 0) + 1 : 0;
  e.lastShot = s.tick;
  e.cooldown = w.ramp ? Math.max(w.ramp, w.cooldown - e.heat) : w.cooldown;
  if (e.ammo !== undefined && --e.ammo <= 0) { e.order = { type: 'rearm', tx: 0, ty: 0, targetId: 0 }; e.targetId = 0; } // fly home to rearm
  const x = centerX(e), y = centerY(e), tx = centerX(t), ty = centerY(t);
  emit(s, { type: 'fire', x, y, weapon: wid, owner: e.owner });
  const mx = x + Math.cos(e.turret) * 0.45, my = y + Math.sin(e.turret) * 0.45;
  if (w.speed > 0) {
    s.projectiles.push({ x: mx, y: my, tx, ty, targetId: t.id, owner: e.owner, weapon: wid, sourceId: e.id });
    if (w.visual === 'double') s.projectiles.push({ x: mx + 0.12, y: my - 0.12, tx, ty, targetId: t.id, owner: e.owner, weapon: wid, sourceId: e.id });
    s.effects.push({ kind: 'flash', x: mx, y: my, x2: 0, y2: 0, t: 0, life: 4, color: w.color });
  } else {
    // Laser designator: three strike rockets come in from the owner's side of the map.
    if (w.strike) for (let k = 0; k < 3; k++) s.projectiles.push({ x: tx - 13 - k * 1.2, y: ty - 13 - k * 0.6, tx, ty, targetId: t.id, owner: e.owner, weapon: w.strike, sourceId: e.id });
    if (w.control) takeControl(s, e, t);
    else hit(s, t, w, e.owner, tx, ty, e);
    s.effects.push({ kind: w.visual === 'beam' ? 'beam' : 'tracer', x: mx, y: my, x2: tx, y2: ty, t: 0, life: w.visual === 'beam' ? 8 : 4, color: w.color });
  }
}

/** Apply a weapon hit at (x, y): the target, or with splash every enemy in the radius (falloff to 50%). */
function hit(s: GameState, t: Entity | undefined, w: WeaponDef, owner: number, x: number, y: number, by?: Entity) {
  const k = by ? 1 + 0.2 * rankOf(by) : 1;
  const cause: DeathCause | undefined = w.superweapon ? 'superweapon' : undefined;
  if (t && w.phase) {
    // Phase beam: the target freezes out of time; erased once the beam has "dealt" its health.
    t.phased = (t.phased ?? 0) + w.damage * k;
    t.frozenUntil = s.tick + 25;
    if (t.phased >= t.hp) { t.phased = 0; damage(s, t, 1e9, owner, by); }
    return;
  }
  if (t && w.fuse) { t.bombAt = s.tick + w.fuse; t.bombBy = owner; t.bombSrc = by?.id; t.bombWeapon = w.blast; return; }
  if (t && w.leech && t.kind === 'unit' && UNITS[t.def].category === 'vehicle') {
    // The drone crawls inside: gone from the field, the vehicle is eaten until a repair depot gets it out.
    if (!t.leechBy && by) { t.leechBy = owner; t.leechUntil = s.tick + LEECH_SECONDS * TICK_RATE; by.hp = 0; emit(s, { type: 'ability', owner, def: by.def, ability: 'leech' }); }
    return;
  }
  if (!w.splash) {
    if (!t) return;
    damage(s, t, w.damage * versusOf(w, t) * k, owner, by, cause);
    if (w.grab) t.frozenUntil = Math.max(t.frozenUntil ?? 0, s.tick + w.cooldown + 10); // held fast until the next squeeze
    if (w.stun && t.kind === 'unit' && WEAPONS[UNITS[t.def].weapon ?? '']?.grab) t.frozenUntil = Math.max(t.frozenUntil ?? 0, s.tick + w.stun); // shaken off: its prey slips away
    if (w.drain && t.kind === 'building') drain(s, t, owner);
    if (w.cloud && t.hp <= 0) (s.hazards ??= []).push({ x: centerX(t), y: centerY(t), until: s.tick + 8 * TICK_RATE, owner, weapon: 'poisonCloud' });
    return;
  }
  if (t && t.kind === 'building' && BUILDINGS[t.def].bridge) damage(s, t, w.damage * w.versus.building * k, owner, by); // the aimed-at bridge itself
  for (const o of s.entities) {
    if (o.owner === owner || o.hp <= 0 || o.inside || !canHit(w, o) || (o.kind === 'building' && BUILDINGS[o.def].bridge)) continue; // bridges: only aimed fire
    const d = distTo(x, y, o);
    if (d > w.splash) continue;
    damage(s, o, w.damage * versusOf(w, o) * k * (1 - (0.5 * d) / w.splash), owner, by, cause);
    if (w.berserk && o.kind === 'unit' && !UNITS[o.def].hero) o.berserkUntil = s.tick + w.berserk;
  }
  if (w.splash > 1) s.effects.push({ kind: 'bigExplosion', x, y, x2: 0, y2: 0, t: 0, life: 24, color: '' });
  if (w.fallout) (s.hazards ??= []).push({ x, y, until: s.tick + w.fallout[1] * TICK_RATE, owner, weapon: w.fallout[0] });
}

/** A Leech Drone eats for this long (about 720 damage), then it is spent: light vehicles die, a Colossus survives. */
export const LEECH_SECONDS = 20;

/** Units currently held by a mind controller. */
export const held = (s: GameState, e: Entity) => s.entities.reduce((n, o) => n + (o.mcBy === e.id && o.hp > 0 ? 1 : 0), 0);

/** Hover Disc beam on a building: siphons credits from a refinery, blacks out a power plant. */
function drain(s: GameState, t: Entity, owner: number) {
  const them = s.players[t.owner], me = s.players[owner];
  if (t.def === 'refinery') { const take = Math.min(them.credits, 40); them.credits -= take; me.credits += take; me.stats.stolen = (me.stats.stolen ?? 0) + take; }
  else if (BUILDINGS[t.def].power > 0) them.outage = Math.max(them.outage ?? 0, s.tick + 60);
}

/** Splash weapon `wid` going off at (x, y) (abilities, bombs). */
export function blast(s: GameState, x: number, y: number, wid: string, owner: number, by?: Entity) {
  hit(s, undefined, WEAPONS[wid], owner, x, y, by);
}

/** Per tick: time bombs, fading phase beams, poison clouds and radiation fields. */
export function statusTick(s: GameState) {
  for (const e of s.entities) {
    if (e.hp <= 0) continue;
    if (e.bombAt && s.tick >= e.bombAt) {
      const blastId = e.bombWeapon ?? WEAPONS.timeBomb.blast!;
      e.bombAt = undefined;
      blast(s, centerX(e), centerY(e), blastId, e.bombBy ?? 0, s.rt.byId.get(e.bombSrc ?? 0));
      if (e.hp > 0 && e.owner === e.bombBy) damage(s, e, WEAPONS[blastId].damage * WEAPONS[blastId].versus[armorOf(e)], e.bombBy); // own bombed units still go up
    }
    if (e.phased && (e.frozenUntil ?? 0) <= s.tick) e.phased = 0; // beam stopped: back in time, unharmed
    if (e.deployed && e.kind === 'unit' && UNITS[e.def].ability === 'irradiate') field(s, e.x, e.y, 'radField', e.owner, e);
    if (e.leechBy !== undefined) { damage(s, e, WEAPONS.leechChew.damage, e.leechBy); if (s.tick >= (e.leechUntil ?? Infinity)) { e.leechBy = undefined; e.leechUntil = undefined; } } // burns out after LEECH_SECONDS
    const ctl = e.kind === 'unit' && UNITS[e.def].weapon ? WEAPONS[UNITS[e.def].weapon!] : undefined;
    if (ctl?.maxControl && s.tick % 10 === 0 && held(s, e) > ctl.maxControl) damage(s, e, 15, e.owner); // overloaded Hivemind
  }
  if (s.hazards?.length) {
    for (const h of s.hazards) {
      const w = WEAPONS[h.weapon];
      if (!w.splash) { field(s, h.x, h.y, h.weapon, h.owner); continue; }
      if (s.tick % w.cooldown) continue; // storm: a strike every `cooldown` ticks somewhere inside `range`
      const a = nextRandom(s) * Math.PI * 2, d = Math.sqrt(nextRandom(s)) * w.range;
      const x = h.x + Math.cos(a) * d, y = h.y + Math.sin(a) * d;
      blast(s, x, y, h.weapon, h.owner);
      s.effects.push({ kind: 'beam', x, y: y - 6, x2: x, y2: y, t: 0, life: 6, color: w.color });
    }
    s.hazards = s.hazards.filter((h) => h.until > s.tick);
  }
}

/** Damage-per-tick area: enemy units the weapon can hurt inside its range. */
function field(s: GameState, x: number, y: number, wid: string, owner: number, by?: Entity) {
  const w = WEAPONS[wid];
  for (const o of s.entities)
    if (o.owner !== owner && o.hp > 0 && !o.inside && o.kind === 'unit' && !isAir(o) && w.versus[armorOf(o)] > 0 && Math.hypot(o.x - x, o.y - y) <= w.range)
      damage(s, o, w.damage * w.versus[armorOf(o)], owner, by, w.superweapon ? 'superweapon' : by ? undefined : 'hazard');
}

/** Mind control: `t` switches sides until the controller dies (released in core/sim.ts). Buildings are taken for good. */
function takeControl(s: GameState, e: Entity, t: Entity) {
  if (t.kind === 'building') {
    emit(s, { type: 'captured', owner: e.owner, from: t.owner, def: t.def });
    t.owner = e.owner; t.seenBy |= 1 << e.owner;
    t.repairing = false; t.rallyX = t.rallyY = -1; t.targetId = 0;
    return;
  }
  emit(s, { type: 'mindControl', owner: e.owner, from: t.owner, def: t.def });
  t.mcOwner = t.owner;
  t.owner = e.owner;
  t.mcBy = e.id;
  e.mcTarget = t.id;
  t.order = { type: UNITS[t.def].harvester ? 'harvest' : 'idle', tx: t.x, ty: t.y, targetId: 0 };
  t.targetId = 0; t.hstate = 'seek'; t.path = []; t.pathIdx = 0; t.needPath = false;
}

/** `cause` for the telemetry; when left out it follows from the attacker (self, hero, mind-controlled unit, weapon). */
export function damage(s: GameState, t: Entity, amount: number, attacker: number, by?: Entity, cause?: DeathCause) {
  if (t.hp <= 0 || (t.phased ?? 0) > 0 || (t.stasisUntil ?? 0) > s.tick) return; // erased / in stasis: untouchable
  if (t.kind === 'building' && BUILDINGS[t.def].bridge) { damageBridge(s, t, amount); return; }
  amount *= (1 - 0.15 * rankOf(t)) * (t.dug ? 0.6 : 1); // veterans and dug-in infantry are tougher
  t.hp -= amount;
  if (t.chargeOn && s.rt.byId.get(t.chargeOn)?.kind === 'building') beamBroken(s, t); // taking a building needs an unbroken beam
  s.players[attacker].stats.damageDealt += amount;
  if (s.tick - t.lastHit > 150) emit(s, { type: 'underAttack', owner: t.owner, def: t.def, x: centerX(t), y: centerY(t), by: attacker });
  t.lastHit = s.tick;
  if (t.hp > 0) return;
  t.hp = 0;
  s.players[attacker].stats.kills++;
  if (by && by.hp > 0) {
    const before = rankOf(by);
    by.xp = (by.xp ?? 0) + (t.kind === 'building' ? BUILDINGS[t.def] : UNITS[t.def]).cost;
    const now = rankOf(by);
    if (now > before) emit(s, { type: 'promoted', owner: by.owner, def: by.def, rank: now });
  }
  s.players[t.owner].stats.losses++;
  const x = centerX(t), y = centerY(t);
  cause ??= attacker === t.owner ? 'self' : by?.kind === 'unit' && UNITS[by.def].hero ? 'hero' : by?.mcBy ? 'mc' : 'weapon';
  emit(s, { type: 'death', x, y, kind: t.kind, owner: t.owner, def: t.def, by: attacker, killer: by?.def, cost: (t.kind === 'building' ? BUILDINGS[t.def] : UNITS[t.def]).cost, cause, age: s.tick - (t.born ?? 0) });
  if (t.kind === 'building') {
    const d = BUILDINGS[t.def];
    for (let k = 0; k < d.w * d.h; k++)
      s.effects.push({ kind: 'bigExplosion', x: t.x + (k % d.w) + 0.5, y: t.y + Math.floor(k / d.w) + 0.5, x2: 0, y2: 0, t: -k * 3, life: 30, color: '' });
    s.effects.push({ kind: 'smoke', x, y, x2: 0, y2: 0, t: 0, life: 120, color: '' });
  } else {
    s.effects.push({ kind: UNITS[t.def].category === 'vehicle' ? 'bigExplosion' : 'explosion', x, y, x2: 0, y2: 0, t: 0, life: 24, color: '' });
  }
}

/** Anti-air ready to fire shoots down an interceptable missile flying within its range. */
function intercepted(s: GameState, p: Projectile): boolean {
  for (const e of s.entities) {
    if (e.owner === p.owner || e.owner === s.neutral || e.hp <= 0 || e.inside || e.cooldown > 0 || (e.kind === 'building' && (e.built < 1 || (BUILDINGS[e.def].needsPower && isLowPower(s, e.owner))))) continue;
    const w = weaponOf(e);
    if (!w?.aa || distTo(p.x, p.y, e) > w.range) continue;
    e.cooldown = w.cooldown;
    s.effects.push({ kind: 'tracer', x: centerX(e), y: centerY(e), x2: p.x, y2: p.y, t: 0, life: 4, color: w.color });
    s.effects.push({ kind: 'explosion', x: p.x, y: p.y, x2: 0, y2: 0, t: 0, life: 14, color: '#ffb060' });
    return true;
  }
  return false;
}

export function projectilesTick(s: GameState) {
  for (const p of s.projectiles) {
    const w = WEAPONS[p.weapon];
    if (w.interceptable && s.tick % 5 === 0 && intercepted(s, p)) { p.targetId = -1e9; continue; } // shot down
    const t = s.rt.byId.get(p.targetId);
    if (t && t.hp > 0) { p.tx = centerX(t); p.ty = centerY(t); }
    const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
    if (d <= w.speed) {
      p.x = p.tx; p.y = p.ty;
      p.targetId = -p.targetId - 1; // mark as hit
      if (w.splash || (t && t.hp > 0)) hit(s, t, w, p.owner, p.x, p.y, s.rt.byId.get(p.sourceId));
      s.effects.push({ kind: 'explosion', x: p.x, y: p.y, x2: 0, y2: 0, t: 0, life: 14, color: w.color });
    } else {
      p.x += (dx / d) * w.speed; p.y += (dy / d) * w.speed;
    }
  }
  s.projectiles = s.projectiles.filter((p) => p.targetId >= 0);
  for (const f of s.effects) f.t++;
  s.effects = s.effects.filter((f) => f.t < f.life);
}
