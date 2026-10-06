import { BUILDINGS } from '../data/buildings';
import { SCAN_INTERVAL } from '../data/config';
import { UNITS } from '../data/units';
import type { Entity, GameState } from '../types';
import { idx, terrainPassable, type MoveKind } from '../world/map';

function create(s: GameState, def: string, owner: number, kind: Entity['kind'], x: number, y: number, hp: number): Entity {
  const id = s.nextId++;
  const e: Entity = {
    id, def, owner, kind, x, y, px: x, py: y, hp,
    facing: Math.PI / 4, turret: Math.PI / 4,
    order: { type: 'idle', tx: x, ty: y, targetId: 0 },
    path: [], pathIdx: 0, gx: x, gy: y, needPath: false,
    targetId: 0, cooldown: 0, scanTimer: id % SCAN_INTERVAL,
    stuckTimer: 0, stuckDist: 1e9, repaths: 0,
    cargo: 0, hstate: 'seek', hTimer: 0,
    built: 1, seenBy: 1 << owner, lastHit: -9999,
    repairing: false, rallyX: -1, rallyY: -1, born: s.tick,
  };
  s.entities.push(e);
  s.rt.byId.set(id, e);
  return e;
}

export function spawnUnit(s: GameState, def: string, owner: number, x: number, y: number): Entity {
  const d = UNITS[def];
  const e = create(s, def, owner, 'unit', x, y, d.hp);
  if (d.harvester) e.order.type = 'harvest';
  if (d.ammo) e.ammo = d.ammo;
  if (d.escort) for (let k = 0; k < d.escort[1]; k++) {
    const [ex, ey] = freeSpot(s, x + Math.cos(k * 2.1), y + Math.sin(k * 2.1), 4) ?? [x, y];
    const t = spawnUnit(s, d.escort[0], owner, ex, ey);
    t.master = e.id;
  }
  return e;
}

export function spawnBuilding(s: GameState, def: string, owner: number, tx: number, ty: number, built = 1): Entity {
  const e = create(s, def, owner, 'building', tx, ty, BUILDINGS[def].hp);
  e.built = built;
  // Exits and docks face the map centre, so point-mirrored bases are truly equal.
  e.up = ty + BUILDINGS[def].h / 2 > s.map.h / 2;
  markGrid(s, e, e.id);
  return e;
}

export function markGrid(s: GameState, e: Entity, v: number) {
  const d = BUILDINGS[e.def];
  if (d.bridge) return; // bridge segments have no footprint: units drive over them
  for (let y = e.y; y < e.y + d.h; y++) for (let x = e.x; x < e.x + d.w; x++) s.rt.grid[idx(s.map, x, y)] = v;
}

/** Tile row just outside a building's exit side, and the exit direction (+1 = +y). */
export const exitRow = (e: Entity): [number, number] => (e.up ? [e.y - 1, -1] : [e.y + BUILDINGS[e.def].h, 1]);

export const isBuilding = (e: Entity) => e.kind === 'building';
export const centerX = (e: Entity) => (e.kind === 'building' ? e.x + BUILDINGS[e.def].w / 2 : e.x);
export const centerY = (e: Entity) => (e.kind === 'building' ? e.y + BUILDINGS[e.def].h / 2 : e.y);

/** Distance from a point to an entity (to the footprint edge for buildings). */
export function distTo(x: number, y: number, e: Entity): number {
  if (e.kind === 'unit') return Math.hypot(e.x - x, e.y - y);
  const d = BUILDINGS[e.def];
  const dx = Math.max(e.x - x, 0, x - (e.x + d.w));
  const dy = Math.max(e.y - y, 0, y - (e.y + d.h));
  return Math.hypot(dx, dy);
}

export const blocked = (s: GameState, i: number, mv: MoveKind = 'ground') => !terrainPassable(s.map, i, mv) || s.rt.grid[i] !== 0;

export function blockedAt(s: GameState, x: number, y: number, mv: MoveKind = 'ground'): boolean {
  const tx = Math.floor(x), ty = Math.floor(y);
  if (tx < 0 || ty < 0 || tx >= s.map.w || ty >= s.map.h) return true;
  return blocked(s, idx(s.map, tx, ty), mv);
}

/** Movement layer of a unit. */
export const moveOf = (e: Entity): MoveKind => (e.kind === 'unit' && UNITS[e.def].move) || 'ground';

/** Rebuild non-serialized caches (entity index, occupancy grid). */
export function rebuildRuntime(s: GameState) {
  s.rt = { byId: new Map(), grid: new Int32Array(s.map.w * s.map.h), events: [] };
  for (const e of s.entities) {
    s.rt.byId.set(e.id, e);
    if (e.kind === 'building') markGrid(s, e, e.id);
  }
}

export function ownBuildings(s: GameState, owner: number, def?: string, builtOnly = true): Entity[] {
  return s.entities.filter((e) => e.owner === owner && e.kind === 'building' && e.hp > 0 && (!def || e.def === def) && (!builtOnly || e.built >= 1));
}

/** Nearest free, passable tile center around (x,y) — spiral search. */
export function freeSpot(s: GameState, x: number, y: number, maxR = 8, avoidUnits = true, mv: MoveKind = 'ground'): [number, number] | null {
  const bx = Math.floor(x), by = Math.floor(y);
  for (let r = 0; r <= maxR; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const tx = bx + dx, ty = by + dy;
        if (blockedAt(s, tx, ty, mv)) continue;
        if (avoidUnits && s.entities.some((e) => e.kind === 'unit' && e.hp > 0 && !e.inside && Math.floor(e.x) === tx && Math.floor(e.y) === ty)) continue;
        return [tx + 0.5, ty + 0.5];
      }
  return null;
}
