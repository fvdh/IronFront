import { FACTIONS } from './data/factions';
import { UNITS } from './data/units';
import type { Game } from './Game';

const has = (g: Game, def: string) => g.s.entities.some((e) => e.owner === g.view.me && e.def === def);
const count = (g: Game, def: string) => g.s.entities.filter((e) => e.owner === g.view.me && e.def === def).length;
const tank = (g: Game) => FACTIONS[g.me.faction].mainTank;

/** Tutorial steps; each completes automatically when its condition holds. */
export const TUTORIAL: { text: string; done: (g: Game) => boolean }[] = [
  { text: 'Click your Construction Yard to select it. Camera: WASD/arrow keys, screen edge or middle mouse button; zoom with the scroll wheel.', done: (g) => g.selectedEntities().some((e) => e.def === 'cy' && e.owner === g.view.me) },
  { text: 'Build a Power Plant: click its icon in the build menu on the right. When it is ready, click again and place it (green = valid, right-click = cancel).', done: (g) => has(g, 'power') },
  { text: 'Build an Ore Refinery. It comes with a free Ore Hauler that harvests ore on its own.', done: (g) => has(g, 'refinery') },
  { text: 'Let your Ore Hauler deliver 500 credits worth of ore to the refinery.', done: (g) => g.me.stats.harvested >= 500 },
  { text: 'Build Barracks and train 3 infantry (Infantry tab). Hover over an icon: the tooltip shows what a unit is strong and weak against.', done: (g) => g.s.entities.filter((e) => e.owner === g.view.me && e.kind === 'unit' && UNITS[e.def].category === 'infantry').length >= 3 },
  { text: 'Build a War Factory (Structures tab).', done: (g) => has(g, 'factory') },
  { text: 'Build 3 tanks from the Vehicles tab. Left-click = queue, right-click = cancel.', done: (g) => count(g, tank(g)) >= 3 },
  { text: 'Drag a box to select your tanks and right-click to send them. Tip: F = attack-move, G = guard, X = stop, Ctrl+1 = group.', done: (g) => g.s.entities.some((e) => e.owner === g.view.me && e.def === tank(g) && e.order.type !== 'idle') },
  { text: 'Tip: an Engineer (Barracks) captures an enemy structure with a right-click. Units with kills become veterans (gold chevrons) and fight better. Now build a Radar Array: it shows the minimap and unlocks stronger units.', done: (g) => has(g, 'radar') },
  { text: 'Find and destroy the enemy base. Right-click an enemy = attack. Good luck, Commander!', done: (g) => g.s.winner === g.view.me },
];
