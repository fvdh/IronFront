// Destructible bridges: Bridge tiles carry invisible segment entities (no footprint) that share one
// health pool on the span leader. A destroyed span turns into water (units on it drown); an engineer
// in the span's repair hut rebuilds it.
import { BUILDINGS } from '../data/buildings';
import { emit } from '../core/events';
import { UNITS } from '../data/units';
import { moveOf } from '../core/entities';
import type { Entity, GameState } from '../types';
import { T } from '../world/map';

export const spanOf = (s: GameState, e: Entity) => s.entities.filter((o) => o.link === e.link && BUILDINGS[o.def]?.bridge);

/** Damage on any segment goes to the span leader; at zero the span collapses. */
export function damageBridge(s: GameState, seg: Entity, amount: number) {
  const lead = s.rt.byId.get(seg.link ?? 0);
  if (!lead || lead.ruined) return;
  lead.hp -= amount;
  lead.lastHit = s.tick;
  if (lead.hp > 0) return;
  const m = s.map, segs = spanOf(s, lead);
  for (const e of segs) { e.ruined = true; e.hp = 1; m.terrain[e.y * m.w + e.x] = T.Water; }
  m.rev = (m.rev ?? 0) + 1;
  // Whatever stood on the deck goes down with it (aircraft and amphibious units excepted).
  for (const u of s.entities)
    if (u.kind === 'unit' && u.hp > 0 && !u.inside && !UNITS[u.def].air && moveOf(u) === 'ground' && segs.some((e) => e.x === Math.floor(u.x) && e.y === Math.floor(u.y))) {
      u.hp = 0;
      s.players[u.owner].stats.losses++;
      emit(s, { type: 'death', x: u.x, y: u.y, kind: 'unit', owner: u.owner, def: u.def });
    }
  for (const e of segs) s.effects.push({ kind: 'bigExplosion', x: e.x + 0.5, y: e.y + 0.5, x2: 0, y2: 0, t: -(e.x + e.y) % 6 * 3, life: 30, color: '' });
  emit(s, { type: 'bridge', destroyed: true, x: lead.x + 0.5, y: lead.y + 0.5 });
}

export function repairBridge(s: GameState, lead: Entity) {
  const m = s.map;
  for (const e of spanOf(s, lead)) { e.ruined = false; m.terrain[e.y * m.w + e.x] = T.Bridge; }
  lead.hp = BUILDINGS.bridge.hp;
  m.rev = (m.rev ?? 0) + 1;
  emit(s, { type: 'bridge', destroyed: false, x: lead.x + 0.5, y: lead.y + 0.5 });
}
