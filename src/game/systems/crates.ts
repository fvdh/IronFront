// Bonus crates (skirmish option): one appears every 40 s up to a cap; the first ground unit to touch it gets a random bonus.
import { TICK_RATE } from '../data/config';
import { emit } from '../core/events';
import { UNITS } from '../data/units';
import { blockedAt } from '../core/entities';
import type { Entity, GameState } from '../types';
import { nextRandom } from '../world/map';
import { rankOf } from './combat';

export function crateTick(s: GameState) {
  if (!s.settings.crates) return;
  const crates = (s.crates ??= []);
  const m = s.map;
  if (s.tick % (40 * TICK_RATE) === 0 && crates.length < 2 + s.players.length) {
    for (let k = 0; k < 30; k++) {
      const x = Math.floor(nextRandom(s) * m.w), y = Math.floor(nextRandom(s) * m.h);
      if (!blockedAt(s, x + 0.5, y + 0.5) && !m.ore[y * m.w + x]) { crates.push({ x: x + 0.5, y: y + 0.5 }); break; }
    }
  }
  if (!crates.length || s.tick % 5) return;
  s.crates = crates.filter((c) => {
    const u = s.entities.find((e) => e.kind === 'unit' && e.hp > 0 && !e.inside && !UNITS[e.def].air && e.owner !== s.neutral && Math.abs(e.x - c.x) < 0.6 && Math.abs(e.y - c.y) < 0.6);
    if (!u) return true;
    open(s, u, c.x, c.y);
    return false;
  });
}

function open(s: GameState, u: Entity, x: number, y: number) {
  const p = s.players[u.owner], roll = nextRandom(s);
  let kind: string;
  if (roll < 0.35) { kind = 'money'; p.credits += 1000; p.stats.bonus = (p.stats.bonus ?? 0) + 1000; }
  else if (roll < 0.6 && rankOf(u) < 2) { kind = 'veteran'; u.xp = UNITS[u.def].cost * (rankOf(u) + 1 === 2 ? 3 : 1); }
  else if (roll < 0.8) {
    kind = 'heal';
    for (const e of s.entities) if (e.owner === u.owner && e.kind === 'unit' && Math.hypot(e.x - x, e.y - y) < 5) e.hp = UNITS[e.def].hp;
  } else {
    kind = 'reveal';
    for (let dy = -12; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) {
      const tx = Math.floor(x) + dx, ty = Math.floor(y) + dy;
      if (tx >= 0 && ty >= 0 && tx < s.map.w && ty < s.map.h && dx * dx + dy * dy <= 144) p.explored[ty * s.map.w + tx] = 1;
    }
  }
  emit(s, { type: 'crate', owner: u.owner, kind, x, y });
}
