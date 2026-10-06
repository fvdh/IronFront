import { BUILDINGS } from '../data/buildings';
import { UNITS } from '../data/units';
import { centerX, centerY } from '../core/entities';
import type { GameState } from '../types';

const circles = new Map<number, [number, number][]>();
function circle(r: number) {
  let c = circles.get(r);
  if (!c) {
    c = [];
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r) c.push([x, y]);
    circles.set(r, c);
  }
  return c;
}

/** Recompute per-player visibility, explored memory and building sightings. */
export function computeFog(s: GameState) {
  const { w, h } = s.map;
  for (const p of s.players) {
    if (s.settings.mode === 'sandbox' && !p.ai) { p.visible.fill(1); p.explored.fill(1); continue; }
    if (p.neutral) continue;
    p.visible.fill(0);
  }
  for (const e of s.entities) {
    if (e.hp <= 0 || e.inside) continue;
    const p = s.players[e.owner];
    if ((s.settings.mode === 'sandbox' && !p.ai) || p.neutral) continue;
    const sight = e.kind === 'building' ? BUILDINGS[e.def].sight : UNITS[e.def].sight;
    const cx = Math.floor(centerX(e)), cy = Math.floor(centerY(e));
    for (const [dx, dy] of circle(sight)) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const i = y * w + x;
      p.visible[i] = 1;
      p.explored[i] = 1;
    }
  }
  // Buildings become remembered once any footprint tile is seen.
  for (const e of s.entities) {
    if (e.kind !== 'building' || e.hp <= 0) continue;
    const d = BUILDINGS[e.def];
    for (const p of s.players) {
      if (e.seenBy & (1 << p.id)) continue;
      outer: for (let y = e.y; y < e.y + d.h; y++)
        for (let x = e.x; x < e.x + d.w; x++)
          if (p.visible[y * w + x]) { e.seenBy |= 1 << p.id; break outer; }
    }
  }
}
