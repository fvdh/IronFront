// Context cursors: own SVG drawings, inlined as data URIs (no files to load). Hot spot is the centre unless noted.
import { BUILDINGS } from './data/buildings';
import { UNITS } from './data/units';
import { EDGE_ZONE } from './data/config';
import type { Game } from './Game';
import { pick } from './input';
import { mayEnter } from './systems/orders';
import { terrainPassable } from './world/map';
import { settings } from '../settings';

export type CursorName = 'default' | 'select' | 'move' | 'nomove' | 'attack' | 'enter' | 'capture' | 'repair' | 'sell' | 'nope' | 'deploy' | 'target' | 'place' | 'grab'
  | 'scroll-n' | 'scroll-ne' | 'scroll-e' | 'scroll-se' | 'scroll-s' | 'scroll-sw' | 'scroll-w' | 'scroll-nw';

const O = 'stroke="#0b0d0f" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" fill="none"'; // dark outline under every shape
const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${body}</svg>`;
const both = (d: string, color: string, w = 2) => `<path d="${d}" ${O}/><path d="${d}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;

const GREEN = '#8cf57a', RED = '#ff4a3a', YELLOW = '#ffd23a', CYAN = '#7ff5ff';
const arrow = (rot: number) => both('M16 4 L24 14 L19 14 L19 22 L13 22 L13 14 L8 14 Z', YELLOW).replace(/<path /g, `<path transform="rotate(${rot} 16 16)" `);

const SHAPES: Partial<Record<CursorName, [string, number, number]>> = {
  select: [both('M4 10 V4 H10 M22 4 H28 V10 M4 22 V28 H10 M22 28 H28 V22', GREEN), 16, 16],
  move: [both('M16 6 V26 M6 16 H26 M16 6 L12 10 M16 6 L20 10 M16 26 L12 22 M16 26 L20 22 M6 16 L10 12 M6 16 L10 20 M26 16 L22 12 M26 16 L22 20', GREEN), 16, 16],
  nomove: [both('M16 5 A11 11 0 1 0 16.01 5 Z M8.5 8.5 L23.5 23.5', RED, 2.5), 16, 16],
  attack: [both('M16 3 V11 M16 21 V29 M3 16 H11 M21 16 H29 M16 8 A8 8 0 1 0 16.01 8 Z', RED), 16, 16],
  target: [both('M16 2 V9 M16 23 V30 M2 16 H9 M23 16 H30 M16 5 A11 11 0 1 0 16.01 5 Z M16 12 A4 4 0 1 0 16.01 12 Z', RED, 2.5), 16, 16],
  enter: [both('M4 4 L13 13 M13 7 V13 H7 M28 4 L19 13 M19 7 V13 H25 M4 28 L13 19 M7 19 H13 V25 M28 28 L19 19 M25 19 H19 V25', GREEN), 16, 16],
  capture: [both('M10 28 V5 M10 6 H24 L20 11 L24 16 H10', YELLOW), 10, 28],
  repair: [both('M7 25 L18 14 M18 14 A6 6 0 1 1 22 10 L25 7 M18 14 L15 11', GREEN, 2.5), 7, 25],
  sell: [both('M21 9 C19 6 11 6 11 11 C11 16 21 15 21 20 C21 26 12 26 10 22 M16 4 V28', YELLOW, 2.5), 16, 16],
  nope: [both('M16 5 A11 11 0 1 0 16.01 5 Z M8.5 8.5 L23.5 23.5', RED, 2.5), 16, 16],
  deploy: [both('M16 3 V11 M12 7 L16 3 L20 7 M16 29 V21 M12 25 L16 29 L20 25 M3 16 H11 M7 12 L3 16 L7 20 M29 16 H21 M25 12 L29 16 L25 20', CYAN), 16, 16],
  place: [both('M4 16 L16 9 L28 16 L16 23 Z', GREEN), 16, 16],
  'scroll-n': [arrow(0), 16, 4], 'scroll-ne': [arrow(45), 26, 6], 'scroll-e': [arrow(90), 28, 16], 'scroll-se': [arrow(135), 26, 26],
  'scroll-s': [arrow(180), 16, 28], 'scroll-sw': [arrow(225), 6, 26], 'scroll-w': [arrow(270), 4, 16], 'scroll-nw': [arrow(315), 6, 6],
};
const FALLBACK: Partial<Record<CursorName, string>> = { attack: 'crosshair', target: 'crosshair', nomove: 'not-allowed', nope: 'not-allowed', select: 'pointer', grab: 'grabbing', place: 'cell' };

export function cursorCss(name: CursorName): string {
  const s = SHAPES[name];
  const fb = FALLBACK[name] ?? (name === 'default' ? 'default' : 'pointer');
  if (!s) return fb;
  return `url("data:image/svg+xml,${encodeURIComponent(svg(s[0]))}") ${s[1]} ${s[2]}, ${fb}`;
}

/** Which cursor belongs under the mouse at screen point (x, y) in the current mode. */
export function cursorFor(game: Game, x: number, y: number, force = false): CursorName {
  const { s, cam } = game, me = game.view.me;
  if (game.mouse.over && settings.get().edgeScroll && !game.view.drag) {
    const dx = x < EDGE_ZONE ? -1 : x > cam.vw - EDGE_ZONE ? 1 : 0, dy = y < EDGE_ZONE ? -1 : y > cam.vh - EDGE_ZONE ? 1 : 0;
    if (dx || dy) return `scroll-${dy < 0 ? 'n' : dy > 0 ? 's' : ''}${dx < 0 ? 'w' : dx > 0 ? 'e' : ''}` as CursorName;
  }
  if (game.placing) return 'place';
  const h = pick(game, x, y);
  if (game.mode === 'power') return 'target';
  if (game.mode === 'attackMove') return 'attack';
  if (game.mode === 'repair' || game.mode === 'sell') return h && h.kind === 'building' && h.owner === me ? game.mode : 'nope';
  const units = game.selectedUnitIds().map((id) => s.rt.byId.get(id)!).filter(Boolean);
  if (!units.length) return h ? 'select' : 'default';
  if (h) {
    if (h.kind === 'building' && h.owner !== me && h.owner !== s.neutral && units.some((u) => UNITS[u.def].engineer || UNITS[u.def].infiltrate)) return 'capture';
    if (h.kind === 'building' && h.owner === me && h.hp < BUILDINGS[h.def].hp && units.some((u) => UNITS[u.def].engineer)) return 'repair';
    if (mayEnter(s, me, h) && units.some((u) => UNITS[u.def].category === 'infantry')) return 'enter';
    if (h.owner !== me && (h.owner !== s.neutral || force)) return 'attack';
    if (h.kind === 'unit' && h.owner === me && units.length === 1 && units[0].id === h.id && UNITS[h.def].ability === 'deploy') return 'deploy';
    if (h.owner === me) return 'select';
  }
  const [wx, wy] = cam.toWorld(x, y), tx = Math.floor(wx), ty = Math.floor(wy);
  if (tx < 0 || ty < 0 || tx >= s.map.w || ty >= s.map.h) return 'nomove';
  const i = ty * s.map.w + tx;
  if (!game.me.explored[i]) return 'move';
  return units.some((u) => UNITS[u.def].air || terrainPassable(s.map, i, UNITS[u.def].move ?? 'ground')) ? 'move' : 'nomove';
}
