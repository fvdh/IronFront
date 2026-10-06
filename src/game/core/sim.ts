import { FOG_INTERVAL } from '../data/config';
import { emit } from './events';
import { telemetryTick } from '../systems/telemetry';
import { BUILDINGS } from '../data/buildings';
import { UNITS } from '../data/units';
import { aiTick } from '../systems/ai';
import { projectilesTick, statusTick } from '../systems/combat';
import { regrowOre, updatePower } from '../systems/economy';
import { crateTick } from '../systems/crates';
import { computeFog } from '../systems/fog';
import { processPaths, separate } from '../systems/movement';
import { buildingTick, unitTick, unload } from '../systems/orders';
import { productionTick } from '../systems/production';
import type { GameState } from '../types';
import { markGrid } from './entities';

/** Advance the simulation by one fixed tick. Deterministic given the state. */
export function tick(s: GameState) {
  s.tick++;
  for (const e of s.entities) { e.px = e.x; e.py = e.y; }
  updatePower(s);
  for (const ai of s.ai) aiTick(s, ai);
  productionTick(s);
  processPaths(s);
  for (const e of s.entities) {
    if (e.hp <= 0) continue;
    if (e.kind === 'unit') unitTick(s, e);
    else buildingTick(s, e);
  }
  separate(s);
  projectilesTick(s);
  statusTick(s);
  removeDead(s);
  regrowOre(s);
  crateTick(s);
  if (s.tick % FOG_INTERVAL === 0) computeFog(s);
  if (s.tick % 15 === 0) checkVictory(s);
  telemetryTick(s);
}

function removeDead(s: GameState) {
  if (!s.entities.some((e) => e.hp <= 0)) return;
  // Mind control ends when the controller dies.
  for (const e of s.entities)
    if (e.mcBy && e.hp > 0 && (s.rt.byId.get(e.mcBy)?.hp ?? 0) <= 0) {
      e.owner = e.mcOwner ?? e.owner;
      e.mcBy = 0; e.mcOwner = undefined;
      e.order = { type: UNITS[e.def].harvester ? 'harvest' : 'idle', tx: e.x, ty: e.y, targetId: 0 };
      e.targetId = 0; e.hstate = 'seek'; e.path = []; e.pathIdx = 0; e.needPath = false;
    }
  // Thralls whose hauler is gone are free.
  for (const e of s.entities) if (e.master && (s.rt.byId.get(e.master)?.hp ?? 0) <= 0) e.master = undefined;
  // A collapsing building lets its garrison out; passengers of vehicles go down with them.
  for (const e of s.entities) if (e.hp <= 0 && e.kind === 'building' && e.passengers?.length) unload(s, e);
  for (const e of s.entities) if (e.inside && e.hp > 0 && (s.rt.byId.get(e.inside)?.hp ?? 0) <= 0) { e.hp = 0; s.players[e.owner].stats.losses++; }
  for (const e of s.entities) {
    if (e.hp > 0) continue;
    s.rt.byId.delete(e.id);
    if (e.kind === 'building') markGrid(s, e, 0);
  }
  s.entities = s.entities.filter((e) => e.hp > 0);
}

/** A player is out when they have no buildings and no armed units left. */
export function isDefeated(s: GameState, owner: number) {
  return !s.entities.some((e) => e.owner === owner && e.hp > 0 && (e.kind === 'building' ? !BUILDINGS[e.def].wall && !BUILDINGS[e.def].neutralOnly : !!UNITS[e.def].weapon || !!UNITS[e.def].deploysTo));
}

export function checkVictory(s: GameState) {
  if (s.winner !== -1 || s.settings.mode === 'sandbox') return;
  for (const p of s.players) {
    if (p.neutral || p.defeated || !isDefeated(s, p.id)) continue;
    p.defeated = true;
    emit(s, { type: 'defeated', owner: p.id });
    p.queues = { building: [], infantry: [], vehicle: [] };
    p.ready = null;
    for (const e of s.entities) if (e.owner === p.id) e.hp = 0; // leftover harvesters self-destruct
    removeDead(s);
  }
  const alive = s.players.filter((p) => !p.defeated && !p.neutral);
  if (alive.length <= 1 || s.players[0].defeated) {
    s.winner = s.players[0].defeated ? (alive[0]?.id ?? -2) : 0;
    emit(s, { type: 'gameOver', winner: s.winner });
  }
}
