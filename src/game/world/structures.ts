// Neutral map structures (owned by the civilians): a garrisonable town, capturable tech buildings,
// and destructible bridges with repair huts. Placed point-symmetrically so both sides get the same.
import { BUILDINGS } from '../data/buildings';
import { spawnBuilding } from '../core/entities';
import type { GameState } from '../types';
import { idx, inBounds, nextRandom, regions, T, terrainBuildable } from './map';

export function placeStructures(s: GameState) {
  bridges(s);
  const { w, h } = s.map;
  const starts = s.players.filter((p) => !p.neutral).map((p) => [p.startX, p.startY]);
  const pairs = Math.max(1, Math.round(w / 24)); // small 2, medium 3, large 4 mirrored pairs
  const town = ['civhouse', 'civoffice', 'civfarm', 'civhouse', 'civhall', 'civoffice'];
  const tech = ['techrig', 'hospital', 'machineshop', 'outpost'];
  const want = [...town.slice(0, 2 + pairs), ...tech.slice(0, pairs)];
  for (const def of want) {
    for (let tries = 0; tries < 200; tries++) {
      const d = BUILDINGS[def];
      // First half of the map (by index order); the mirror copy lands in the other half.
      const x = Math.floor(nextRandom(s) * (w - d.w - 2)) + 1, y = Math.floor(nextRandom(s) * (h / 2 - d.h - 1)) + 1;
      const mx = w - x - d.w, my = h - y - d.h;
      if (!fits(s, x, y, d.w, d.h) || !fits(s, mx, my, d.w, d.h) || (mx < x + d.w + 1 && my < y + d.h + 1 && mx + d.w + 1 > x && my + d.h + 1 > y)) continue;
      if (starts.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < 11 || Math.hypot(sx - mx, sy - my) < 11)) continue;
      const a = spawnBuilding(s, def, s.neutral!, x, y), b = spawnBuilding(s, def, s.neutral!, mx, my);
      if (connected(s)) break;
      for (const e of [a, b]) { e.hp = 0; markFree(s, e); } // would cut a route: drop the pair
      s.entities = s.entities.filter((e) => e.hp > 0);
      for (const e of [a, b]) s.rt.byId.delete(e.id);
    }
  }
}

/** Every Bridge-tile group becomes one span: segment entities (no footprint) led by the first, plus a repair hut on the bank. */
function bridges(s: GameState) {
  const m = s.map, seen = new Uint8Array(m.w * m.h);
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || m.terrain[start] !== T.Bridge) continue;
    const comp = [start];
    seen[start] = 1;
    for (let k = 0; k < comp.length; k++) {
      const x = comp[k] % m.w, y = (comp[k] / m.w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const j = idx(m, x + dx, y + dy);
        if (inBounds(m, x + dx, y + dy) && !seen[j] && m.terrain[j] === T.Bridge) { seen[j] = 1; comp.push(j); }
      }
    }
    const segs = comp.map((i) => spawnBuilding(s, 'bridge', s.neutral!, i % m.w, (i / m.w) | 0));
    for (const e of segs) e.link = segs[0].id;
    // Hut on the nearest free bank tile next to the span.
    let hut: [number, number] | null = null;
    for (const i of comp) {
      const x = i % m.w, y = (i / m.w) | 0;
      for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [-2, -2], [2, -2], [-2, 2]])
        if (!hut && fits(s, x + dx, y + dy, 1, 1)) hut = [x + dx, y + dy];
    }
    if (hut) spawnBuilding(s, 'bridgehut', s.neutral!, hut[0], hut[1]).link = segs[0].id;
  }
}

/** Buildable, unoccupied footprint with a one-tile free margin (no roads, ore or water touched). */
function fits(s: GameState, x: number, y: number, w: number, h: number) {
  const m = s.map;
  for (let ty = y - 1; ty <= y + h; ty++)
    for (let tx = x - 1; tx <= x + w; tx++) {
      if (!inBounds(m, tx, ty)) return false;
      const i = idx(m, tx, ty), inside = tx >= x && ty >= y && tx < x + w && ty < y + h;
      if (s.rt.grid[i] !== 0 || m.ore[i] > 0) return false;
      if (inside && (!terrainBuildable(m, i) || m.terrain[i] === T.Road)) return false;
      if (!inside && m.terrain[i] === T.Bridge) return false;
    }
  return true;
}

const markFree = (s: GameState, e: { x: number; y: number; def: string }) => {
  const d = BUILDINGS[e.def];
  for (let y = e.y; y < e.y + d.h; y++) for (let x = e.x; x < e.x + d.w; x++) s.rt.grid[idx(s.map, x, y)] = 0;
};

/** All starts still reach each other with the structures in place. */
function connected(s: GameState): boolean {
  const m = s.map, starts = s.players.filter((p) => !p.neutral);
  const reg = regions(m), seen = new Uint8Array(m.w * m.h);
  const at = (p: { startX: number; startY: number }) => idx(m, Math.floor(p.startX) + 3, Math.floor(p.startY) + 3);
  const q = [at(starts[0])];
  seen[q[0]] = 1;
  while (q.length) {
    const i = q.pop()!, x = i % m.w, y = (i / m.w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!inBounds(m, x + dx, y + dy)) continue;
      const j = idx(m, x + dx, y + dy);
      if (!seen[j] && reg[j] >= 0 && s.rt.grid[j] === 0) { seen[j] = 1; q.push(j); }
    }
  }
  return starts.every((p) => seen[at(p)]);
}
