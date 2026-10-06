import { ABILITIES } from '../data/abilities';
import { emit } from '../core/events';
import { logDecision } from './telemetry';
import { BUILDINGS } from '../data/buildings';
import { UNITS } from '../data/units';
import { blockedAt, centerX, centerY, markGrid, spawnBuilding, spawnUnit } from '../core/entities';
import type { Entity, GameState } from '../types';
import { WEAPONS } from '../data/weapons';
import { blast } from './combat';
import { stopMove } from './movement';
import { unload } from './orders';
import { canPlace } from './production';

function wave(s: GameState, e: Entity, wid: string) {
  blast(s, e.x, e.y, wid, e.owner, e);
  s.effects.push({ kind: 'wave', x: e.x, y: e.y, x2: WEAPONS[wid].splash!, y2: 0, t: 0, life: 20, color: WEAPONS[wid].color });
  return true;
}

export const abilityOf = (e: Entity) => (e.kind === 'unit' ? UNITS[e.def].ability : BUILDINGS[e.def].ability);

/** Fire the ability of every own selected unit/building that has one and is off cooldown. Returns how many acted. */
export function commandAbility(s: GameState, owner: number, ids: number[]): number {
  let n = 0;
  for (const id of ids) {
    const e = s.rt.byId.get(id);
    const ab = e && e.owner === owner && e.hp > 0 && !e.inside ? abilityOf(e) : undefined;
    if (!e || !ab || (e.abCd ?? 0) > s.tick) continue;
    if (!RUN[ab](s, e)) continue;
    e.abCd = s.tick + ABILITIES[ab].cooldown;
    emit(s, { type: 'ability', owner, def: e.def, ability: ab });
    logDecision(s, owner, 'ability', ab);
    n++;
  }
  return n;
}

const RUN: Record<string, (s: GameState, e: Entity) => boolean> = {
  /** Base Crawler → Construction Yard centred on the crawler. */
  deploy(s, e) {
    const def = UNITS[e.def].deploysTo!, b = BUILDINGS[def];
    const tx = Math.round(e.x - b.w / 2), ty = Math.round(e.y - b.h / 2);
    if (!canPlace(s, e.owner, def, tx, ty, { anywhere: true, ignore: e.id })) return false;
    e.hp = 0; // the crawler becomes the building (removed without a kill)
    spawnBuilding(s, def, e.owner, tx, ty, 0);
    emit(s, { type: 'deployed', owner: e.owner, def, x: e.x, y: e.y });
    return true;
  },
  /** Construction Yard → Base Crawler (not while it is building something). */
  pack(s, e) {
    const p = s.players[e.owner];
    const crawler = Object.values(UNITS).find((u) => u.deploysTo === e.def);
    if (!crawler || e.built < 1 || p.queues.building.length || p.ready) return false;
    const health = e.hp / BUILDINGS[e.def].hp;
    e.hp = 0;
    markGrid(s, e, 0);
    const u = spawnUnit(s, crawler.id, e.owner, centerX(e), centerY(e));
    u.hp = crawler.hp * health; // damage carries over
    emit(s, { type: 'deployed', owner: e.owner, def: crawler.id, x: u.x, y: u.y });
    return true;
  },
  unload(s, e) {
    if (!e.passengers?.length) return false;
    stopMove(e);
    unload(s, e);
    return true;
  },
  /** Thrall Hauler: park as a mobile refinery for its thralls (or drive off again). */
  rig(_s, e) {
    e.deployed = !e.deployed;
    stopMove(e);
    e.hstate = e.deployed ? 'wait' : 'seek';
    e.hTimer = 0;
    return true;
  },
  /** Siege Rotor: land as artillery (ground target), or take off. */
  land(s, e) {
    if (!e.deployed && blockedAt(s, e.x, e.y)) return false;
    e.deployed = !e.deployed;
    stopMove(e);
    e.targetId = 0;
    e.order = { type: 'idle', tx: e.x, ty: e.y, targetId: 0 };
    return true;
  },
  irradiate(_s, e) {
    e.deployed = !e.deployed;
    stopMove(e);
    e.order = { type: 'idle', tx: e.x, ty: e.y, targetId: 0 };
    return true;
  },
  psiwave: (s, e) => wave(s, e, 'psiWave'),
  psistorm: (s, e) => wave(s, e, 'psiStorm'),
  digin(_s, e) {
    e.dug = !e.dug;
    stopMove(e);
    e.order = { type: 'idle', tx: e.x, ty: e.y, targetId: 0 };
    return true;
  },
};
