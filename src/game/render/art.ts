// Baked art: open-licensed 3D models (see docs/asset-register.md) rendered at load time into
// isometric sprite atlases — 32 facings per vehicle, per team colour — the same pre-rendered-3D
// approach classic isometric RTS games used. Terrain uses CC0 photo textures projected onto the
// iso grid. Anything missing falls back to the procedural placeholders in assets.ts.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { BUILDINGS } from '../data/buildings';
import { FACTIONS } from '../data/factions';
import { UNITS } from '../data/units';
import type { FactionId } from '../types';
import { TH, TW } from './iso';
import { prepareWater } from './water';
import { prepareBridge } from './bridge';
import { prepareOre } from './ore';

const RES = 2;
const K = (TW / 2) * Math.SQRT2; // screen px per world unit (1 unit = 1 tile) at zoom 1
const BASE = `${import.meta.env.BASE_URL}assets/`;

// ------------------------------------------------------------------ manifest

interface Part {
  model: string;
  include?: string[]; // only these nodes (and children)
  exclude?: string[];
  at?: [number, number, number]; // tile x, tile y, height (tiles)
  yaw?: number; // degrees
  fit?: number; // scale so the largest horizontal extent equals this many tiles
  height?: number; // or: scale so the height equals this many tiles (with `fit` too: stretch vertically to it)
  squash?: number; // extra vertical scale (e.g. flatten a squat hangar into a saucer)
  tint?: Record<string, string>; // material name → colour override
  flat?: string; // drop the texture and rename all materials to this (plain shape, coloured via tint/team)
  ref?: { include?: string[]; exclude?: string[] }; // nodes used for scale/centre (turrets: the hull)
  /** Attach to this bone of the animated (first) part: follows it every baked frame. `at` is then an offset
   *  in the bone's frame (tiles, three.js axes) and `rot` an extra rotation (degrees, XYZ). */
  bone?: string;
  rot?: [number, number, number]; // without `bone`: extra tilt (degrees, XYZ) before `yaw`, e.g. raise an AA barrel
}

/** Skeletal clips (names after the last '|') baked as extra atlas rows: idle, walk cycle, firing pose, death. */
interface Anim { idle: string; walk: string; walkFrames: number; fire?: string; fireAt?: number; death?: string; deathFrames?: number; res?: number }
// air: no baked ground shadow (renderer lifts + shadows it). sea: floats — no ground shadow, everything below the
// waterline (height 0) is clipped away, a soft foam ring + darker submerged silhouette is baked under the hull.
// turretAt: turret rotation centre [side, forward] in tiles (default: centre of the turret's bounding box).
// scale: uniform scale of the whole model after assembly (parts, foam, turret + pivot); `frame` is the final size.
// res: atlas resolution multiplier (default RES; big ships use less to keep atlas memory down).
interface UnitArt { parts: Part[]; turret?: Part[]; yaw: number; team: string[]; facings: number; frame: number; anchor?: number; air?: boolean; sea?: boolean; turretAt?: [number, number]; scale?: number; res?: number; anim?: Anim }
interface BuildingArt { parts: Part[]; team: string[] }
interface PropArt { parts: Part[] }

// Infantry clips (Quaternius "Soldier"): idle with rifle, 6-frame run with the rifle up, shot recoil, 4-frame fall.
const GUNNER: Anim = { idle: 'Idle_Gun', walk: 'Run_Shoot', walkFrames: 6, fire: 'Idle_Gun_Shoot', fireAt: 0.2, death: 'Death', deathFrames: 4, res: 1.5 };
const CASTER: Anim = { ...GUNNER, idle: 'Idle', walk: 'Run' }; // empty-handed, arm thrust forward when firing
const BRAWLER: Anim = { ...CASTER, fire: 'Punch_Right', fireAt: 0.45 };
/** Animated body (CC-BY 3.0, Quaternius) + optional rifle in the right hand (rot/at solved for the aiming pose). */
const TROOPER = (height: number, tint?: Record<string, string>): Part => ({ model: 'trooper', height, tint });
const RIFLE = (tint?: Record<string, string>): Part => ({ model: 'rifle', fit: 0.32, bone: 'WristR', at: [0.061, -0.007, 0.054], rot: [86.6, -31.1, 80.4], tint });

type V3 = [number, number, number];
/** Prop on a bone of the trooper: `at` = [side, front(+)/back(−), up along the bone] in tiles, `rot` in degrees. */
const ON = (bone: string, p: Omit<Part, 'bone'>): Part => ({ ...p, bone });
/** Pistol in a hand (Kenney Space Kit `weapon_gun`). */
const NOVA_GUN = { Main: '#22242a', Barrel: '#ff6a1a', Detail: '#ff6a1a' };
/** Sidearm: the Quaternius rifle scaled down, in either hand (left = mirrored right-hand pose). */
const PISTOL = (bone: 'WristR' | 'WristL', tint?: Record<string, string>): Part => ({ model: 'rifle', fit: 0.17, bone, tint, ...(bone === 'WristR' ? { at: [0.061, -0.007, 0.054], rot: [86.6, -31.1, 80.4] } : { at: [-0.061, -0.007, 0.054], rot: [86.6, 31.1, -80.4] }) });
/** Plain bevelled block (Kenney TD `tile`, texture dropped); `name` is its material for tint/team. Walls, aprons, frames. */
const SLAB = (name: string, fit: number, height: number, at: V3, color?: string): Part => ({ model: 'td-tile', flat: name, fit, height, at, ...(color && { tint: { [name]: color } }) });
/** Slim cylinder (Kenney Space Kit rocket section) standing on `at`, tilted by `rot` (barrels, crane boom, missile bodies). */
const ROD = (name: string, d: number, len: number, at: V3, rot: V3, color?: string): Part => ({ model: 'space-rocket_fuelA', flat: name, fit: d, height: len, at, rot, ...(color && { tint: { [name]: color } }) });
/** Missile tilted `a`° from vertical towards +y: white body + nose cone (material `tip`, team-coloured by the caller). */
const MISSILE = ([x, y, z]: V3, a = 50, len = 0.34, d = 0.08): Part[] => {
  const r = (a * Math.PI) / 180;
  return [ROD('missile', d, len, [x, y, z], [a, 0, 0], '#e4e6e0'), { model: 'space-rocket_topA', flat: 'tip', fit: d, height: 0.09, at: [x, y + len * Math.sin(r), z + len * Math.cos(r)], rot: [a, 0, 0] }];
};
/** ROD from point `a` to point `b` (tiles; legs, struts, braces). */
const STRUT = (name: string, d: number, a: V3, b: V3, color?: string): Part => {
  const [dx, dy, dz] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(dx, dy, dz), r2d = 180 / Math.PI;
  return ROD(name, d, len, a, [Math.acos(dz / len) * r2d, Math.atan2(dx, dy) * r2d, 0], color);
};
// --- procedural primitives (geometry built in code by procModel(), no model file; `flat` names the material)
const tintOf = (name: string, color?: string) => (color ? { tint: { [name]: color } } : {});
const r3 = (v: number) => Math.round(v * 1000) / 1000;
/** Ship hull, bow towards +y: `len` long, `beam` wide, `depth` from keel to deck; sloped sides, raked bow, deck sheer.
 *  Sides use material `name`, the deck `${name}.deck`. */
const HULL = (name: string, len: number, beam: number, depth: number, at: V3, c?: { hull: string; deck: string }, bow = 0.32, sheer = 0.3): Part =>
  ({ model: `proc:hull:${r3(beam / len)}:${r3(depth / len)}:${bow}:${sheer}`, flat: name, fit: len, at, ...(c && { tint: { [name]: c.hull, [`${name}.deck`]: c.deck } }) });
/** Rectangular box w (side) × l (forward) × h standing on `at`. */
const BOX = (name: string, w: number, l: number, h: number, at: V3, color?: string, yaw = 0): Part => {
  const m = Math.max(w, l);
  return { model: `proc:box:${r3(w / m)}:${r3(l / m)}`, flat: name, fit: m, height: h, at, yaw, ...tintOf(name, color) };
};
/** Cigar body (submarine / drone), axis along y, blunt nose at +y; diameter `dia`. */
const CIGAR = (name: string, len: number, dia: number, at: V3, color?: string): Part => ({ model: `proc:cigar:${r3(dia / len)}`, flat: name, fit: len, at, ...tintOf(name, color) });
/** Sphere of diameter d resting on `at` (`h`: stretch to this height). */
const BALL = (name: string, d: number, at: V3, color?: string, h?: number): Part => ({ model: 'proc:sphere', flat: name, fit: d, height: h, at, ...tintOf(name, color) });
/** Half sphere (flat side down), diameter d, height h. */
const DOME = (name: string, d: number, h: number, at: V3, color?: string): Part => ({ model: 'proc:dome', flat: name, fit: d, height: h, at, ...tintOf(name, color) });
/** Ring of outer diameter d: lying flat (`h`) or standing with its axis along y (`v`, e.g. a thruster duct). */
const RING = (name: string, d: number, at: V3, color?: string, kind: 'h' | 'v' = 'v', tube = 0.08): Part => ({ model: `proc:ring${kind}:${tube}`, flat: name, fit: d, at, ...tintOf(name, color) });
/** Tapered tentacle arching out of the water, `len` long, reaching from `from` (tiles, at the waterline) in
 *  direction `deg` (0 = forward/+y, 90 = +x). `curl` bends the tip sideways, `dip` sends the tip back under water. */
const TENTACLE = (name: string, len: number, from: [number, number], deg: number, color?: string, curl = 0, dip = 0, squash = 0.6): Part => {
  const a = (deg * Math.PI) / 180, r = len / 2;
  return { model: `proc:tentacle:${curl}:${dip}`, flat: name, fit: len, squash, yaw: deg, at: [from[0] + Math.sin(a) * r, from[1] + Math.cos(a) * r, -0.17 * len * squash], ...tintOf(name, color) };
};
/** Small cone (rocket nose) standing on `at`, tilted by `rot`: spines, fins, nose caps. */
const CONE = (name: string, d: number, h: number, at: V3, rot: V3 = [0, 0, 0], color?: string): Part => ({ model: 'space-rocket_topA', flat: name, fit: d, height: h, at, rot, ...tintOf(name, color) });

const PSI = { metal: '#9a88b8', metalDark: '#4a3f5e', dark: '#5e4785' };
// naval palettes: Allied light naval grey, Red Bloc dark steel with rust, Psi violet
const NAVY = { hull: '#7d868d', deck: '#5c646a', sup: '#b3bbc1', dark: '#3a4045', glass: '#24303a' };
const RED_NAVY = { hull: '#55524c', deck: '#45413c', sup: '#7a726a', dark: '#2a2826', rust: '#7a4630', glass: '#2a2a26' };
const PSI_NAVY = { hull: '#5b4a7a', deck: '#463a5e', sup: '#8a74b0', glow: '#d6a6ff', dark: '#2e2640' };
/** Shipyard on water (3×3): pontoon piers in a U around an open slip (opens towards +y), a hull on the slipway,
 *  a gantry crane straddling it, control house + containers on the back pier. Team colour on kerbs, roof, crane beam. */
const NAVALYARD = (p: { deck: string; float: string; crane: string; house: string; ship: { hull: string; deck: string } }): Part[] => [
  BOX('float', 2.92, 0.64, 0.08, [1.5, 0.4, 0], p.float), BOX('float', 0.62, 2.42, 0.08, [0.39, 1.75, 0], p.float), BOX('float', 0.62, 2.42, 0.08, [2.61, 1.75, 0], p.float),
  BOX('deck', 2.86, 0.58, 0.04, [1.5, 0.4, 0.08], p.deck), BOX('deck', 0.56, 2.38, 0.04, [0.39, 1.76, 0.08], p.deck), BOX('deck', 0.56, 2.38, 0.04, [2.61, 1.76, 0.08], p.deck),
  BOX('stripe', 0.05, 2.2, 0.015, [0.645, 1.82, 0.12]), BOX('stripe', 0.05, 2.2, 0.015, [2.355, 1.82, 0.12]), BOX('stripe', 1.66, 0.05, 0.015, [1.5, 0.695, 0.12]),
  // ship on the slipway, nose out
  HULL('ship', 1.6, 0.4, 0.15, [1.5, 1.75, 0], p.ship, 0.32, 0.25), BOX('ship', 0.2, 0.3, 0.1, [1.5, 1.5, 0.15], p.ship.hull), ROD('ship', 0.06, 0.12, [1.5, 1.42, 0.25], [0, 0, 0], p.ship.deck),
  // gantry crane: A-frame legs on both arms, team-coloured beam, trolley + hook above the hull
  ...[0.4, 2.6].flatMap((x) => [STRUT('crane', 0.055, [x, 1.4, 0.12], [x, 1.62, 1.02], p.crane), STRUT('crane', 0.055, [x, 1.84, 0.12], [x, 1.62, 1.02], p.crane), BOX('crane', 0.12, 0.5, 0.04, [x, 1.62, 0.12], p.crane)]),
  BOX('stripe', 2.36, 0.11, 0.09, [1.5, 1.62, 1.0]), BOX('crane', 0.2, 0.17, 0.08, [1.25, 1.62, 0.92], p.crane), ROD('cable', 0.014, 0.5, [1.25, 1.62, 0.42], [0, 0, 0], '#2a2a2a'), BOX('hook', 0.06, 0.06, 0.05, [1.25, 1.62, 0.37], '#3a3a3a'),
  // control house (back-left), containers + barrels (back-right), bollards and port/starboard lights on the arm ends
  BOX('house', 0.52, 0.42, 0.32, [0.55, 0.42, 0.12], p.house), BOX('glass', 0.44, 0.02, 0.07, [0.55, 0.635, 0.3], '#24303a'), BOX('glass', 0.02, 0.34, 0.07, [0.815, 0.42, 0.3], '#24303a'),
  BOX('stripe', 0.54, 0.44, 0.03, [0.55, 0.42, 0.44]), ROD('mast', 0.025, 0.32, [0.42, 0.32, 0.47], [0, 0, 0], '#3a3d40'), { model: 'space-satelliteDish', fit: 0.2, at: [0.68, 0.45, 0.47] },
  { model: 'ind-shipping-container-a', fit: 0.5, at: [1.55, 0.38, 0.12] }, { model: 'ind-shipping-container-a', fit: 0.5, at: [2.1, 0.38, 0.12] },
  ...[[2.6, 0.32], [2.75, 0.45]].map(([x, y]): Part => ({ model: 'space-barrel', fit: 0.14, at: [x, y, 0.12], tint: { metal: '#3a3d40', metalRed: '#d8a020' } })),
  ...[1.1, 2.0, 2.75].flatMap((y) => [ROD('bollard', 0.05, 0.05, [0.16, y, 0.12], [0, 0, 0], '#2a2c2e'), ROD('bollard', 0.05, 0.05, [2.84, y, 0.12], [0, 0, 0], '#2a2c2e')]),
  BALL('lightL', 0.06, [0.39, 2.9, 0.12], '#ff3a2a'), BALL('lightR', 0.06, [2.61, 2.9, 0.12], '#3aff6a'),
];
/** Cylinder of diameter d (the larger end), height h, standing on `at`; `top` = top/bottom radius ratio (taper,
 *  > 1 widens upwards like a hopper). `rot` tilts it (a disc stood on edge: rot [90, 0, 0] + yaw). */
const CYL = (name: string, d: number, h: number, at: V3, color?: string, top = 1, rot?: V3, yaw?: number): Part => ({ model: `proc:cyl:${r3(top)}`, flat: name, fit: d, height: h, at, rot, yaw, ...tintOf(name, color) });
/** Octagonal plinth (two overlapping boxes, one turned 45°) of width w. */
const OCTA = (name: string, w: number, h: number, at: V3, color?: string): Part[] => [BOX(name, w, w, h, at, color), BOX(name, w * 0.83, w * 0.83, h, at, color, 45)];
/** Glass tank: dark foot, glowing fluid column inside see-through glass, domed cap. */
const VAT = (x: number, y: number, z: number, d: number, h: number, fluid: string, cap: string): Part[] => [
  CYL('vatfoot', d + 0.1, 0.08, [x, y, z], '#2a2433'), CYL('fluid!', d * 0.82, h * 0.86, [x, y, z + 0.08], fluid),
  CYL('glass~', d, h, [x, y, z + 0.08], '#dff6ff'), DOME('vatcap', d + 0.06, 0.13, [x, y, z + 0.08 + h], cap), RING('stripe', d + 0.04, [x, y, z + 0.06 + h], undefined, 'h', 0.05),
];
/** Ring point at angle `deg` (0 = +y) and radius r around (cx, cy). */
const AROUND = (cx: number, cy: number, r: number, deg: number): [number, number] => [cx + Math.sin((deg * Math.PI) / 180) * r, cy + Math.cos((deg * Math.PI) / 180) * r];
// phase 12 palettes: Allied concrete/white with cyan tech glow, Red Bloc dark steel/rust/hazard yellow, Psi violet
const AL = { base: '#a9a59b', deck: '#c9c5bb', light: '#dcd9d0', metal: '#aab3ba', dark: '#3a4045', glow: '#4fe6ff', core: '#d4fbff' };
const RB = { pad: '#6e6a62', steel: '#55524c', mid: '#7e766c', dark: '#2e2c2a', rust: '#7a4630', hazard: '#e0b020', glow: '#ff4a2a' };
const PS = { pad: '#3a3048', base: '#4a3f5e', mid: '#5b4a7a', light: '#8a74b0', pale: '#b9a6dd', glow: '#d6a6ff', bio: '#7cff4a' };
const PSI_CRYSTAL = { crystal: '#b46cff', rock: '#4a3f5e', rockTrack: '#3a3048' };

/** Flat "+" sign lying at height z, made of five SLAB squares of size s (medical cross, crate marking). */
const PLUS = (name: string, [x, y, z]: V3, s: number, color: string): Part[] =>
  [[0, 0], [s, 0], [-s, 0], [0, s], [0, -s]].map(([dx, dy]) => SLAB(name, s * 1.04, 0.025, [x + dx, y + dy, z], color));
/** Map-structure weathering: Kenney City Kit colormaps multiplied towards a dusty warm grey. */
const WORN = { colormap: '#ddd6c8' };
const TREE = (x: number, y: number, h = 0.8): Part => ({ model: 'sub-tree-small', height: h, at: [x, y, 0] });

/** Asset IDs referenced by data/*.ts `sprite` fields. */
export const UNIT_ART: Record<string, UnitArt> = {
  'unit.tank.allies': { parts: [{ model: 'tank-olive', exclude: ['Tank_Turret', 'Tank_Gun'], fit: 0.95 }], turret: [{ model: 'tank-olive', include: ['Tank_Turret', 'Tank_Gun'], fit: 0.95, ref: { exclude: ['Tank_Turret', 'Tank_Gun'] } }], yaw: 90, team: ['Main'], facings: 32, frame: 76 },
  'unit.tank.soviets': { parts: [{ model: 'tank-heavy', exclude: ['Tank_Turret', 'Tank_Gun'], fit: 1.05 }], turret: [{ model: 'tank-heavy', include: ['Tank_Turret', 'Tank_Gun'], fit: 1.05, ref: { exclude: ['Tank_Turret', 'Tank_Gun'] } }], yaw: 90, team: ['Main'], facings: 32, frame: 80 },
  'unit.tank.psi': { parts: [{ model: 'tank-hover', fit: 0.95 }], yaw: 180, team: [], facings: 32, frame: 76 },
  'unit.tank.heavy': { parts: [{ model: 'tank-brown', exclude: ['Tank_Turret'], fit: 1.15 }], turret: [{ model: 'tank-brown', include: ['Tank_Turret'], fit: 1.15, ref: { exclude: ['Tank_Turret'] } }], yaw: 90, team: ['Main'], facings: 32, frame: 88 },
  'unit.miner': { parts: [{ model: 'truck-military', fit: 1.25 }], yaw: 0, team: ['TruckTop'], facings: 32, frame: 88 },
  'unit.jeep': { parts: [{ model: 'jeep', fit: 0.8 }], yaw: 0, team: ['LightGreen_Jeep'], facings: 32, frame: 64 },
  'unit.infantry': { parts: [TROOPER(0.56), RIFLE()], yaw: 0, team: ['Swat'], facings: 16, frame: 40, anchor: 0.8, anim: GUNNER },
  'unit.rocketeer': { parts: [TROOPER(0.56), { model: 'rpg', fit: 0.36, bone: 'WristR', at: [0.061, -0.007, 0.054], rot: [86.6, -31.1, 80.4 - 90] }], yaw: 0, team: ['Swat'], facings: 16, frame: 40, anchor: 0.8, anim: GUNNER },
  // --- faction expansion (composed from CC0/CC-BY parts already in the register + Kenney kits, Quaternius dog)
  'unit.dog': { parts: [{ model: 'dog', fit: 0.46 }], yaw: 0, team: [], facings: 16, frame: 40, anchor: 0.8, anim: { idle: 'Idle', walk: 'Run', walkFrames: 6, fire: 'Headbutt', fireAt: 0.4, death: 'Death', deathFrames: 4, res: 1.5 } },
  'unit.arc': { parts: [TROOPER(0.62, { Swat: '#5a6470', Grey: '#1c1f24' }), RIFLE({ Main: '#4fd2ff', Barrel: '#2a6f8a' })], yaw: 0, team: ['Black'], facings: 16, frame: 44, anchor: 0.8, anim: GUNNER },
  'unit.initiate': { parts: [TROOPER(0.54, { Swat: '#6a3a8e', Grey: '#2a1838', Hair_Brown: '#d6a6ff' })], yaw: 0, team: ['Black'], facings: 16, frame: 40, anchor: 0.8, anim: CASTER },
  'unit.brute': { parts: [TROOPER(0.8, { Swat: '#5f7a45', Grey: '#2f3a26', Skin: '#a8c890', Hair_Brown: '#3d5a2a' })], yaw: 0, team: ['Black'], facings: 16, frame: 56, anchor: 0.82, anim: { ...BRAWLER, res: 1.25 } },
  'unit.ifv': { parts: [{ model: 'space-rover', fit: 0.8 }], turret: [{ model: 'space-turret_single', include: ['turret'], fit: 0.42, at: [0, 0, 0.26], ref: { include: ['turret'] } }], yaw: 180, team: ['metalRed'], facings: 32, frame: 64 },
  'unit.prism': { parts: [{ model: 'space-rover', fit: 0.85 }], turret: [{ model: 'space-rock_crystals', fit: 0.55, at: [0, 0, 0.22], tint: { crystal: '#7fe9ff', rock: '#5b6a74', rockTrack: '#4a555d' } }], yaw: 180, team: ['metalRed'], facings: 32, frame: 68 },
  'unit.artillery': { parts: [{ model: 'truck-military', fit: 1.2 }], turret: [{ model: 'space-barrels_rail', fit: 0.5, at: [0, -0.25, 0.24], tint: { metal: '#6b7058', metalDark: '#3c3f33' } }], yaw: 0, team: ['TruckTop', 'metalRed'], facings: 32, frame: 88 },
  'unit.gatling': { parts: [{ model: 'tank-hover', fit: 0.9 }], turret: [{ model: 'space-turret_double', include: ['turret'], fit: 0.5, at: [0, 0, 0.3], ref: { include: ['turret'] }, tint: { metal: '#8a7aa6', metalDark: '#4a3f5e' } }], yaw: 180, team: ['metalRed'], facings: 32, frame: 76 },
  // --- phase 4: engineers, mind control, aircraft (air: baked without ground shadow; the renderer lifts them and paints its own)
  'unit.engineer': { parts: [TROOPER(0.54, { Swat: '#d99a22', Grey: '#3a3226', Hair_Brown: '#ffd23a' }), { model: 'space-barrels_rail', fit: 0.1, bone: 'WristL', at: [0, -0.04, 0.02], tint: { metal: '#c8402a', metalDark: '#6a2418' } }], yaw: 0, team: ['Black'], facings: 16, frame: 40, anchor: 0.8, anim: { ...BRAWLER, fire: undefined } },
  'unit.mentalist': { parts: [TROOPER(0.56, { Swat: '#e6def2', Grey: '#8a6cb8', Hair_Brown: '#e0b8ff' }), { model: 'space-rock_crystals', fit: 0.1, bone: 'Head', at: [0, 0, 0.16], tint: { crystal: '#f0c8ff', rock: '#b46cff', rockTrack: '#b46cff' } }], yaw: 0, team: ['Black'], facings: 16, frame: 44, anchor: 0.8, anim: CASTER },
  'unit.jet': { parts: [{ model: 'space-craft_speederD', fit: 0.9, tint: { metal: '#b8c0c6', metalDark: '#5b6a74' } }], yaw: 180, team: ['metalRed'], facings: 32, frame: 76, air: true },
  'unit.airship': { parts: [{ model: 'air-blimp', fit: 1.6 }], yaw: 0, team: [], facings: 32, frame: 128, anchor: 0.6, air: true },
  'unit.disc': { parts: [{ model: 'space-hangar_roundB', fit: 0.8, squash: 0.4, tint: { metal: '#9a88b8', metalDark: '#4a3f5e', dark: '#d6a6ff' } }, { model: 'space-hangar_roundGlass', fit: 0.42, at: [0, 0, 0.1], tint: { metalDark: '#4a3f5e', _defaultMat: '#c79bff', dark: '#b46cff' } }], yaw: 0, team: ['metalRed'], facings: 32, frame: 68, air: true },
  // --- phase 8 infantry: trooper.glb recoloured per type + props on bones (Kenney Space Kit / TD parts, Quaternius rifle, RPG)
  'unit.skyjumper': { parts: [TROOPER(0.56, { Swat: '#8fa4b8', Grey: '#3a4652' }), RIFLE(), ...[-0.035, 0.035].flatMap((x) => [ON('Chest', ROD('jet', 0.055, 0.15, [x, -0.075, -0.07], [0, 0, 0], '#b8c0c8')), ON('Chest', { model: 'space-rocket_topA', flat: 'flame', fit: 0.05, height: 0.05, at: [x, -0.075, -0.07], rot: [180, 0, 0], tint: { flame: '#ffb03a' } })])], yaw: 0, team: ['Swat', 'jet'], facings: 16, frame: 44, anchor: 0.8, anim: GUNNER, air: true },
  'unit.infiltrator': { parts: [TROOPER(0.56, { Swat: '#2b2d33', Black: '#3a3c44', Grey: '#1c1d21', Hair_Brown: '#2b2d33' }), ON('Head', SLAB('hat', 0.13, 0.012, [0, 0, 0.085], '#1a1a1c')), ON('Head', SLAB('band', 0.085, 0.015, [0, 0, 0.096])), ON('Head', SLAB('hat', 0.08, 0.035, [0, 0, 0.11], '#1a1a1c')), PISTOL('WristR')], yaw: 0, team: ['Grey', 'band'], facings: 16, frame: 40, anchor: 0.8, anim: CASTER },
  'unit.phasetrooper': { parts: [TROOPER(0.62, { Swat: '#c9d2da', Grey: '#3c4650', Hair_Brown: '#c9d2da' }), RIFLE({ Main: '#3fe8ff', Barrel: '#1f8fa8' }), ON('Chest', SLAB('pack', 0.1, 0.13, [0, -0.075, -0.05], '#5a6670')), ON('Chest', ROD('core', 0.045, 0.11, [0, -0.13, -0.035], [0, 0, 0], '#5ff0ff'))], yaw: 0, team: ['Black'], facings: 16, frame: 44, anchor: 0.8, anim: GUNNER },
  'unit.nova': { parts: [{ model: 'trooper', height: 0.6, squash: 1.1, tint: { Swat: '#1d1f24', Grey: '#2c2f36', Hair_Brown: '#ff6a1a' } }, PISTOL('WristR', NOVA_GUN), PISTOL('WristL', NOVA_GUN)], yaw: 0, team: ['Black'], facings: 16, frame: 48, anchor: 0.8, anim: GUNNER },
  'unit.flakgunner': { parts: [TROOPER(0.56, { Swat: '#6b5a44', Grey: '#3a3226' }), { model: 'rpg', fit: 0.46, bone: 'WristR', at: [0.061, -0.007, 0.054], rot: [86.6, -31.1, 80.4 - 90] }, ON('Chest', { model: 'space-barrel', fit: 0.08, at: [0, -0.08, -0.05], tint: { metal: '#5a4c3c' } })], yaw: 0, team: ['Swat', 'metalRed'], facings: 16, frame: 44, anchor: 0.8, anim: GUNNER },
  'unit.sapper': { parts: [TROOPER(0.56, { Swat: '#4a4038', Grey: '#2a2420', Hair_Brown: '#ff7a1a' }), ON('WristL', { model: 'space-barrel', fit: 0.11, at: [0, -0.03, 0.03], tint: { metal: '#3a3430', metalRed: '#ff7a1a' } }), ON('Chest', SLAB('satchel', 0.085, 0.08, [0, -0.07, -0.1], '#6a5232'))], yaw: 0, team: ['Swat'], facings: 16, frame: 40, anchor: 0.8, anim: BRAWLER },
  'unit.blight': { parts: [TROOPER(0.58, { Swat: '#b6c23a', Grey: '#3e4420', Skin: '#2a2e22', Hair_Brown: '#b6c23a' }), RIFLE({ Main: '#4a5020', Barrel: '#9cff3a' }), ON('Chest', ROD('tank', 0.08, 0.16, [0, -0.08, -0.08], [0, 0, 0], '#e2e640'))], yaw: 0, team: ['Black'], facings: 16, frame: 40, anchor: 0.8, anim: GUNNER },
  'unit.grom': { parts: [{ model: 'trooper', height: 0.62, squash: 0.94, tint: { Swat: '#3b3d30', Grey: '#26271f', Hair_Brown: '#3a2a1c' } }, { model: 'rifle', fit: 0.42, bone: 'WristR', at: [0.061, -0.007, 0.054], rot: [86.6, -31.1, 80.4], tint: { Main: '#2a2622' } }, ON('Head', { model: 'space-rocket_topA', flat: 'beret', fit: 0.1, height: 0.035, at: [0.01, -0.01, 0.07], rot: [-14, 0, 10], tint: { beret: '#c8231e' } })], yaw: 0, team: ['Black'], facings: 16, frame: 48, anchor: 0.8, anim: GUNNER },
  'unit.toxin': { parts: [TROOPER(0.56, { Swat: '#3c3448', Grey: '#26202e', Hair_Brown: '#2a2030' }), { model: 'rifle', fit: 0.5, bone: 'WristR', at: [0.061, -0.007, 0.054], rot: [86.6, -31.1, 80.4], tint: { Main: '#1e1a22', Barrel: '#7cff3a', Glass: '#7cff3a' } }], yaw: 0, team: ['Black'], facings: 16, frame: 44, anchor: 0.8, anim: GUNNER },
  'unit.oracle': { parts: [TROOPER(0.62, { Swat: '#3a2152', Grey: '#5e3a86', Hair_Brown: '#e6dcf2' }), ON('Head', { model: 'space-rock_crystals', fit: 0.16, at: [0, 0, 0.2], tint: { crystal: '#e8b8ff', rock: '#b46cff', rockTrack: '#b46cff' } })], yaw: 0, team: ['Black'], facings: 16, frame: 48, anchor: 0.82, anim: CASTER },
  // --- phase 5: construction crawler + soviet AA carrier. Forward is -x for yaw 90 hulls, -y (at) for yaw 180.
  'unit.mcv': { parts: [{ model: 'tank-heavy', exclude: ['Tank_Turret', 'Tank_Gun'], fit: 1.2 }, { model: 'ind-shipping-container-a', fit: 0.62, yaw: 90, at: [0.12, 0, 0.2] }, { model: 'space-machine_wireless', fit: 0.3, yaw: 90, at: [-0.36, 0, 0.2] }, ROD('boom', 0.07, 0.78, [0.44, 0.07, 0.47], [0, 0, 90], '#d8b23a')], yaw: 90, team: ['Main'], facings: 32, frame: 100 },
  'unit.flakhauler': { parts: [{ model: 'space-rover', fit: 0.8, tint: { metal: '#8a7a60', metalDark: '#5a4c3c' } }], turret: [{ model: 'td-weapon-turret', fit: 0.36, yaw: 180, at: [0, 0.03, 0.26], rot: [-30, 0, 0] }, ROD('barrel', 0.032, 0.24, [-0.05, -0.07, 0.38], [-60, 0, 0], '#2e2a26'), ROD('barrel', 0.032, 0.24, [0.05, -0.07, 0.38], [-60, 0, 0], '#2e2a26')], yaw: 180, team: ['metalRed'], facings: 32, frame: 72 },
  'unit.magnetar': { parts: [{ model: 'space-craft_speederA', fit: 1.0, tint: { metal: '#8a7aa6', metalDark: '#4a3f5e' } }], turret: [{ model: 'space-satelliteDish', fit: 0.4, at: [0, 0, 0.2], tint: { metal: '#b9a6dd', metalDark: '#4a3f5e' } }], yaw: 180, team: ['metalRed'], facings: 32, frame: 80 },
  // --- phase 9: stealth/support vehicles, Psi harvesting, new aircraft
  'unit.shroudtank': { parts: [{ model: 'tank-olive', exclude: ['Tank_Turret', 'Tank_Gun'], fit: 0.88 }], turret: [{ model: 'tank-olive', include: ['Tank_Turret', 'Tank_Gun'], fit: 0.88, ref: { exclude: ['Tank_Turret', 'Tank_Gun'] } }, { model: 'space-satelliteDish', fit: 0.22, at: [0.04, 0, 0.3], yaw: 90, tint: { metal: '#c9d2da', metalDark: '#5a6670', _defaultMat: '#7dffb0' } }], yaw: 90, team: ['Main', 'metalRed'], facings: 32, frame: 76 },
  'unit.leechdrone': { parts: [{ model: 'spider', fit: 0.6, tint: { Material: '#7c848c' } }, ON('Body', SLAB('eye', 0.05, 0.03, [0, 0, 0], '#ff3020'))], yaw: 0, team: ['Material.001'], facings: 16, frame: 44, anchor: 0.72, anim: { idle: 'Spider_Idle', walk: 'Spider_Walk', walkFrames: 6, fire: 'Spider_Attack', fireAt: 0.4, death: 'Spider_Death', deathFrames: 4, res: 1.5 } },
  'unit.siegerotor': { parts: [{ model: 'heli-gunship', fit: 1.15, tint: { DarkGreen: '#55594a' } }, STRUT('cannon', 0.06, [0, -0.15, 0.07], [0, 0.62, 0.07], '#2a2c2e'), SLAB('breech', 0.12, 0.08, [0, -0.1, 0.03], '#3a3c3e')], yaw: 0, team: ['DarkYellow_Aircraft', 'Orange_Airplane'], facings: 32, frame: 100, air: true },
  'unit.hivemind': { parts: [{ model: 'space-craft_cargoB', fit: 1.2, tint: PSI }, { model: 'brain', fit: 0.5, at: [0, 0, 0.3], tint: { brain_colour: '#e2b0ff' } }], yaw: 180, team: ['metalRed'], facings: 32, frame: 100 },
  'unit.deliriumdrone': { parts: [{ model: 'space-craft_speederB', fit: 0.6, tint: PSI }, ...[-0.1, 0.1].map((x): Part => ({ model: 'space-barrel', fit: 0.11, at: [x, 0.12, 0.1], tint: { metal: '#d8d040', metalDark: '#7a7020' } })), ROD('vent', 0.05, 0.1, [0, 0.2, 0.1], [0, 0, 0], '#4a3f5e'), { model: 'brain', fit: 0.16, at: [0, 0.2, 0.2], tint: { brain_colour: '#c6dc4a' } }], yaw: 180, team: ['metalRed'], facings: 32, frame: 56 },
  'unit.talon': { parts: [{ model: 'jet-strike', fit: 1.05, tint: { '455A64': '#2b2f35', '78909C': '#3d434a', '80DEEA': '#e0a040' } }, STRUT('stripe', 0.045, [0, -0.38, 0.1], [0, 0.2, 0.1])], yaw: 0, team: ['stripe'], facings: 32, frame: 88, air: true },
  'unit.amphib': { parts: [{ model: 'lifeboat', fit: 1.0, tint: { Red: '#3a3c36', DarkRed: '#2a2b27', White: '#6e6c5c' } }, SLAB('hull', 0.62, 0.14, [0, 0.05, 0.08], '#6b7058'), SLAB('stripe', 0.5, 0.03, [0, 0.05, 0.22]), SLAB('roof', 0.42, 0.05, [0, 0.05, 0.25], '#5a5f4a'), ...[-0.13, 0.13].map((x): Part => ({ model: 'space-gate_simple', fit: 0.24, at: [x, -0.4, 0.06], tint: { metal: '#4a4d44', metalDark: '#2e302a' } }))], yaw: 0, team: ['stripe'], facings: 32, frame: 84 },
  'unit.thrallhauler': { parts: [{ model: 'space-craft_miner', fit: 1.25, tint: PSI }, SLAB('bin', 0.46, 0.12, [0, 0.25, 0.22], '#3a3048'), { model: 'space-rock_crystals', fit: 0.4, at: [0, 0.25, 0.3], tint: { crystal: '#e8c040', rock: '#7a6a3a', rockTrack: '#5a4c2a' } }], yaw: 180, team: ['metalRed'], facings: 32, frame: 92 },
  'unit.thrall': { parts: [TROOPER(0.5, { Swat: '#8a7a60', Black: '#5e5446', Hair_Brown: '#4a3a2a' }), ON('Chest', SLAB('sack', 0.1, 0.11, [0, -0.08, -0.09], '#9a8460')), ON('Chest', ROD('haft', 0.022, 0.26, [0.03, -0.11, -0.16], [0, 0, 35], '#6a4a2a')), ON('Chest', ROD('pick', 0.026, 0.14, [-0.177, -0.11, 0.013], [0, 0, -55], '#9a9a9a'))], yaw: 0, team: ['Grey'], facings: 16, frame: 36, anchor: 0.8, anim: CASTER },
  // --- phase 11: navy. Procedural hulls (proc:*) + Kenney Space Kit bits; bow = +y, hulls sunk below the waterline
  // (`sea`: clipped at height 0, no ground shadow, baked foam ring). Generic warship shapes, no copied designs.
  'unit.destroyer': {
    parts: [
      HULL('hull', 1.25, 0.24, 0.15, [0, 0, -0.06], NAVY),
      BOX('sup', 0.15, 0.34, 0.1, [0, -0.1, 0.085], NAVY.sup), BOX('sup', 0.13, 0.13, 0.07, [0, 0.03, 0.18], NAVY.sup), BOX('glass', 0.135, 0.02, 0.025, [0, 0.095, 0.215], NAVY.glass), BOX('stripe', 0.14, 0.14, 0.015, [0, 0.03, 0.25]),
      ROD('mast', 0.02, 0.2, [0, 0, 0.265], [0, 0, 0], NAVY.dark), BOX('mast', 0.13, 0.02, 0.015, [0, 0, 0.4], NAVY.dark),
      ROD('funnel', 0.075, 0.11, [0, -0.2, 0.185], [0, 0, 0], NAVY.dark), ROD('stripe', 0.078, 0.025, [0, -0.2, 0.27], [0, 0, 0]),
      ROD('dome', 0.05, 0.05, [0, -0.38, 0.085], [0, 0, 0], NAVY.dark), BALL('dome', 0.11, [0, -0.38, 0.12], '#e4e6e2'), // sonar/radar dome
      BOX('stripe', 0.12, 0.1, 0.01, [0, -0.52, 0.088]),
    ],
    turret: [BOX('gun', 0.1, 0.11, 0.055, [0, 0.3, 0.095], NAVY.sup), ROD('barrel', 0.022, 0.17, [0, 0.34, 0.118], [90, 0, 0], NAVY.dark)],
    turretAt: [0, 0.3], yaw: 0, team: ['stripe'], facings: 32, scale: 1.52, frame: 112, anchor: 0.6, sea: true,
  },
  'unit.cruiser': {
    parts: [
      HULL('hull', 1.55, 0.3, 0.17, [0, 0, -0.065], NAVY),
      BOX('sup', 0.2, 0.5, 0.12, [0, -0.12, 0.105], NAVY.sup), BOX('sup', 0.18, 0.17, 0.09, [0, 0.05, 0.225], NAVY.sup), BOX('glass', 0.185, 0.02, 0.03, [0, 0.135, 0.27], NAVY.glass), BOX('stripe', 0.185, 0.175, 0.015, [0, 0.05, 0.315]),
      ...[-0.095, 0.095].map((x) => BOX('array', 0.014, 0.1, 0.075, [x, 0.06, 0.23], '#2c3e55')), // phased-array radar faces
      ROD('mast', 0.025, 0.2, [0, -0.02, 0.33], [0, 0, 0], NAVY.dark), { model: 'space-satelliteDish', fit: 0.15, at: [0, -0.02, 0.5], tint: { metal: '#c9d0d4', metalDark: '#5b6a74' } },
      ROD('funnel', 0.08, 0.1, [0, -0.25, 0.225], [0, 0, 0], NAVY.dark), ROD('stripe', 0.082, 0.025, [0, -0.25, 0.3], [0, 0, 0]),
      BALL('dome', 0.12, [0, -0.38, 0.225], '#e4e6e2'),
      // aft AA launcher (fixed, missiles angled back)
      BOX('launcher', 0.15, 0.12, 0.05, [0, -0.6, 0.1], NAVY.dark), ...[-0.035, 0.035].flatMap((x) => MISSILE([x, -0.6, 0.15], -50, 0.16, 0.045)),
    ],
    turret: [BOX('launcher', 0.16, 0.13, 0.06, [0, 0.42, 0.12], NAVY.sup), ...[0.17, 0.215].flatMap((z) => [-0.04, 0.04].flatMap((x) => MISSILE([x, 0.39, z], 55, 0.17, 0.045)))],
    turretAt: [0, 0.42], yaw: 0, team: ['stripe', 'tip'], facings: 32, scale: 1.42, frame: 128, anchor: 0.6, sea: true,
  },
  'unit.carrier': {
    parts: [
      HULL('hull', 2.15, 0.36, 0.19, [0, 0, -0.07], NAVY, 0.3, 0),
      BOX('fdeck', 0.5, 2.0, 0.04, [-0.03, -0.02, 0.12], '#4a5055'), BOX('fdeck', 0.22, 0.7, 0.04, [-0.2, -0.45, 0.12], '#4a5055', -9), // angled landing strip
      BOX('mark', 0.014, 1.75, 0.004, [-0.03, 0.05, 0.16], '#e8e8e0'), BOX('mark', 0.012, 0.6, 0.004, [-0.2, -0.45, 0.16], '#e8d040', -9),
      BOX('stripe', 0.5, 0.06, 0.006, [-0.03, -0.98, 0.16]), BOX('stripe', 0.5, 0.06, 0.006, [-0.03, 0.94, 0.16]),
      // island on starboard (+x)
      BOX('sup', 0.1, 0.4, 0.17, [0.18, -0.12, 0.16], NAVY.sup), BOX('sup', 0.1, 0.2, 0.07, [0.18, -0.06, 0.33], NAVY.sup), BOX('glass', 0.105, 0.02, 0.025, [0.18, 0.045, 0.36], NAVY.glass), BOX('stripe', 0.105, 0.205, 0.015, [0.18, -0.06, 0.4]),
      ROD('funnel', 0.07, 0.08, [0.18, -0.25, 0.33], [0, 0, 0], NAVY.dark), ROD('mast', 0.022, 0.18, [0.18, -0.1, 0.415], [0, 0, 0], NAVY.dark), { model: 'space-satelliteDish', fit: 0.13, at: [0.18, -0.1, 0.58], tint: { metal: '#c9d0d4', metalDark: '#5b6a74' } },
      // parked jets
      ...[[-0.12, 0.62], [-0.12, 0.3], [-0.16, -0.75]].map(([x, y]): Part => ({ model: 'space-craft_speederD', fit: 0.24, yaw: 180, at: [x, y, 0.16], tint: { metal: '#b8c0c6', metalDark: '#5b6a74' } })),
    ],
    yaw: 0, team: ['stripe', 'metalRed'], facings: 32, scale: 1.21, frame: 152, res: 1.5, anchor: 0.6, sea: true,
  },
  'unit.sonardrone': {
    parts: [
      CIGAR('body', 0.55, 0.13, [0, 0, -0.065], '#c4cacd'), BALL('sensor', 0.06, [0, 0.25, -0.02], '#5ff0ff'),
      BOX('stripe', 0.014, 0.13, 0.06, [0, -0.07, 0.055]), ROD('mast', 0.01, 0.07, [0, 0.0, 0.06], [0, 0, 0], '#3a4045'),
      ...[-0.075, 0.075].map((x) => BOX('fin', 0.06, 0.06, 0.012, [x, -0.18, 0.0], '#3a4045')),
      RING('duct', 0.12, [0, -0.27, -0.055], '#3a4045', 'v', 0.12),
    ],
    yaw: 0, team: ['stripe'], facings: 32, scale: 1.64, frame: 64, anchor: 0.6, sea: true,
  },
  'unit.flakboat': {
    parts: [
      HULL('hull', 0.8, 0.3, 0.13, [0, 0, -0.05], RED_NAVY, 0.3, 0.2),
      BOX('sup', 0.17, 0.2, 0.09, [0, -0.1, 0.08], RED_NAVY.sup), BOX('glass', 0.175, 0.02, 0.03, [0, 0.0, 0.12], RED_NAVY.glass), BOX('stripe', 0.18, 0.21, 0.015, [0, -0.1, 0.17]),
      ROD('mast', 0.015, 0.12, [0, -0.15, 0.185], [0, 0, 0], RED_NAVY.dark), BOX('rust', 0.3, 0.05, 0.02, [0, -0.33, 0.07], RED_NAVY.rust),
    ],
    turret: [BOX('turret', 0.12, 0.12, 0.06, [0, 0.18, 0.085], RED_NAVY.sup), ...[-0.03, 0.03].map((x) => ROD('barrel', 0.022, 0.17, [x, 0.2, 0.125], [60, 0, 0], RED_NAVY.dark))],
    turretAt: [0, 0.18], yaw: 0, team: ['stripe'], facings: 32, scale: 1.5, frame: 80, anchor: 0.6, sea: true,
  },
  'unit.barracuda': {
    parts: [
      CIGAR('hull', 1.15, 0.15, [0, 0, -0.105], '#383c3e'),
      BOX('sail', 0.06, 0.2, 0.13, [0, 0.12, -0.01], '#30343a'), BOX('sail', 0.22, 0.04, 0.012, [0, 0.14, 0.08], '#30343a'), BOX('stripe', 0.062, 0.2, 0.015, [0, 0.12, 0.12]),
      ROD('mast', 0.012, 0.07, [0, 0.16, 0.135], [0, 0, 0], '#1e2022'), BOX('sail', 0.012, 0.1, 0.09, [0, -0.5, -0.03], '#30343a'),
      ...[-0.15, -0.26].map((y) => BOX('hatch', 0.05, 0.06, 0.008, [0, y, 0.038], '#55504a')),
    ],
    yaw: 0, team: ['stripe'], facings: 32, scale: 1.48, frame: 104, anchor: 0.6, sea: true,
  },
  'unit.leviathan': {
    parts: [
      HULL('hull', 1.8, 0.34, 0.18, [0, 0, -0.07], RED_NAVY),
      BOX('sup', 0.24, 0.42, 0.14, [0, -0.38, 0.11], RED_NAVY.sup), BOX('sup', 0.2, 0.18, 0.1, [0, -0.25, 0.25], RED_NAVY.sup), BOX('glass', 0.205, 0.02, 0.03, [0, -0.155, 0.3], RED_NAVY.glass), BOX('stripe', 0.205, 0.185, 0.015, [0, -0.25, 0.35]),
      ROD('mast', 0.025, 0.22, [0, -0.3, 0.365], [0, 0, 0], RED_NAVY.dark), BOX('mast', 0.18, 0.025, 0.02, [0, -0.3, 0.52], RED_NAVY.dark),
      ROD('funnel', 0.09, 0.12, [0, -0.5, 0.25], [0, 0, 0], RED_NAVY.dark), ROD('rust', 0.092, 0.03, [0, -0.5, 0.34], [0, 0, 0], RED_NAVY.rust),
      // vertical launch block: 2×5 cells, team-coloured hatch lids, three missiles standing up out of open cells
      BOX('vls', 0.22, 0.56, 0.03, [0, 0.26, 0.115], '#34312d'),
      ...[0, 1, 2, 3, 4].flatMap((i) => [-0.05, 0.05].filter((_x, k) => (i + k) % 3 !== 1).map((x) => BOX('stripe', 0.075, 0.075, 0.012, [x, 0.06 + i * 0.1, 0.145]))),
      ...([[-0.05, 0.16], [0.05, 0.36], [-0.05, 0.46]] as [number, number][]).flatMap(([x, y]) => MISSILE([x, y, 0.15], 0, 0.2, 0.05)),
      ROD('barrel', 0.03, 0.14, [0, 0.62, 0.15], [90, 0, 0], RED_NAVY.dark), BOX('gun', 0.1, 0.1, 0.05, [0, 0.6, 0.125], RED_NAVY.sup),
    ],
    yaw: 0, team: ['stripe', 'tip'], facings: 32, scale: 1.44, frame: 152, res: 1.5, anchor: 0.6, sea: true,
  },
  'unit.kraken': {
    parts: [
      DOME('flesh', 0.62, 0.22, [0, -0.04, -0.03], '#2c2731'), BALL('flesh', 0.28, [0, 0.17, -0.09], '#2c2731', 0.22),
      ...[-0.07, 0.07].map((x) => BALL('eye', 0.055, [x, 0.29, 0.03])), // team-coloured eyes
      BOX('plate', 0.2, 0.26, 0.04, [0, -0.06, 0.16], '#55585e'), BOX('plate', 0.14, 0.12, 0.03, [0, 0.12, 0.1], '#55585e'),
      ...[-0.09, 0.09].map((x) => STRUT('pipe', 0.025, [x, -0.3, 0.02], [x * 0.6, 0.0, 0.17], '#6a6d72')),
      ...[-0.18, -0.08, 0.02].map((y, i) => CONE('spine', 0.05, 0.08 - i * 0.01, [0, y, 0.19 - i * 0.005], [-25, 0, 0], '#4a3a52')),
      RING('stripe', 0.6, [0, -0.04, -0.01], undefined, 'h', 0.05),
      // irregular: two long hooked arms reaching forward, shorter ones breaking the water around the body
      TENTACLE('tentacle', 0.7, [0.1, 0.24], 18, '#3b3242', -1.5, 2, 0.75), TENTACLE('tentacle', 0.6, [-0.12, 0.22], -32, '#3b3242', 1.2, 2, 0.7),
      TENTACLE('tentacle', 0.5, [0.27, 0.02], 72, '#3b3242', 1, 1, 0.5), TENTACLE('tentacle', 0.42, [-0.27, -0.05], -100, '#3b3242', -1, 0, 0.45),
      TENTACLE('tentacle', 0.36, [0.2, -0.24], 135, '#3b3242', -1.4, 2, 0.6), TENTACLE('tentacle', 0.3, [-0.16, -0.28], -160, '#3b3242', 1, 1, 0.4),
      TENTACLE('tentacle', 0.26, [0.02, -0.33], 178, '#3b3242', 1.5, 2, 0.55),
    ],
    yaw: 0, team: ['eye', 'stripe'], facings: 32, scale: 1.55, frame: 152, res: 1.5, anchor: 0.6, sea: true,
  },
  'unit.psisub': {
    parts: [
      CIGAR('hull', 1.2, 0.2, [0, 0, -0.125], PSI_NAVY.hull),
      ...[-0.3, -0.1, 0.12, 0.3].map((y) => ({ ...RING('stripe', 0.215, [0, y, -0.13], undefined, 'v', 0.06), fit: 0.215 - Math.abs(y) * 0.12 })),
      BALL('glow', 0.22, [0, 0.02, -0.05], PSI_NAVY.glow, 0.16), BALL('flesh', 0.24, [0, -0.04, -0.07], PSI_NAVY.deck, 0.12),
      ...[-0.25, -0.4].map((y, i) => CONE('spine', 0.06, 0.1 - i * 0.02, [0, y, 0.04], [-35, 0, 0], PSI_NAVY.sup)),
      ...[-0.05, 0.05].map((x) => BALL('eye', 0.04, [x, 0.5, -0.02], PSI_NAVY.glow)),
      TENTACLE('feeler', 0.24, [0.03, -0.5], 170, PSI_NAVY.sup, 1, 1, 0.4), TENTACLE('feeler', 0.24, [-0.03, -0.5], -170, PSI_NAVY.sup, -1, 1, 0.4),
    ],
    yaw: 0, team: ['stripe'], facings: 32, scale: 1.42, frame: 116, anchor: 0.6, sea: true,
  },
};

export const BUILDING_ART: Record<string, BuildingArt> = {
  'building.cy': { parts: [{ model: 'ind-building-e', fit: 2.7, at: [1.5, 1.5, 0] }], team: [] },
  'building.power': { parts: [{ model: 'ind-chimney-large', fit: 0.9, at: [1.45, 0.55, 0] }, { model: 'ind-chimney-large', fit: 0.9, at: [0.55, 1.45, 0] }], team: [] },
  'building.refinery': { parts: [{ model: 'ind-building-k', fit: 2.3, at: [1.2, 1.1, 0] }, { model: 'ind-detail-tank-large', fit: 1.1, at: [2.4, 0.7, 0] }], team: [] },
  'building.barracks': { parts: [{ model: 'tent', fit: 2.1, at: [1, 1, 0] }], team: ['Barracks_a'] },
  'building.factory': { parts: [{ model: 'space-hangar_largeA', fit: 2.9, at: [1.5, 1.5, 0] }], team: ['metalRed'] },
  'building.tower': { parts: [{ model: 'td-tower-round-bottom-a', fit: 0.85, at: [0.5, 0.5, 0] }, { model: 'turret-cannon', exclude: ['Turret_Cannon_Top'], fit: 0.7, at: [0.5, 0.5, 0.42] }], team: ['Orange'] },
  'building.radar': { parts: [{ model: 'ind-building-q', fit: 1.9, at: [1, 1, 0] }, { model: 'space-satelliteDish_large', fit: 1.1, at: [1, 1, 0.55] }], team: [] },
  'building.lab': { parts: [{ model: 'ind-building-c', fit: 2.2, at: [1.1, 1.6, 0] }, { model: 'space-hangar_roundA', fit: 1.2, at: [2.2, 0.8, 0] }, { model: 'space-satelliteDish', fit: 0.7, at: [0.6, 0.6, 0] }], team: ['metalRed'] },
  'building.lab.psi': { parts: [{ model: 'space-hangar_roundGlass', fit: 1.9, at: [1.3, 1.6, 0], tint: { metal: '#9a88b8', metalDark: '#4a3f5e', dark: '#5e4785' } }, { model: 'td-tower-round-crystals', fit: 0.9, at: [2.4, 0.6, 0] }, { model: 'space-rock_crystalsLargeA', fit: 0.8, at: [0.6, 0.6, 0], tint: { crystal: '#b46cff', rock: '#4a3f5e', rockTrack: '#3a3048' } }], team: ['metalRed'] },
  'building.pillbox': { parts: [{ model: 'space-hangar_roundA', fit: 0.9, at: [0.5, 0.5, 0], tint: { metal: '#b3afa4', metalDark: '#7a776e', dark: '#1e1e1e' } }], team: ['metalRed'] },
  'building.prismtower': { parts: [{ model: 'td-tower-round-bottom-a', fit: 0.8, at: [0.5, 0.5, 0] }, { model: 'space-rock_crystalsLargeA', fit: 0.7, at: [0.5, 0.5, 0.4], tint: { crystal: '#bdf3ff', rock: '#9aa6ad', rockTrack: '#7d878e' } }], team: [] },
  'building.coil': { parts: [{ model: 'space-supports_high', fit: 0.72, at: [0.5, 0.5, 0], tint: { metal: '#6d6158' } }, { model: 'space-chimney_detailed', height: 1.25, at: [0.5, 0.5, 0], tint: { metal: '#e0954a', metalDark: '#9a6232', dark: '#4fd2ff' } }], team: ['metalRed'] },
  'building.gatlingtower': { parts: [{ model: 'space-turret_double', exclude: ['turret'], fit: 0.7, at: [0.5, 0.5, 0], tint: { metal: '#9a88b8', metalDark: '#4a3f5e', dark: '#5e4785' } }], team: ['metalRed'] },
  'building.psispire': { parts: [{ model: 'td-tower-round-bottom-a', fit: 0.75, at: [0.5, 0.5, 0] }, { model: 'td-tower-round-crystals', fit: 0.75, at: [0.5, 0.5, 0.4] }], team: [] },
  'building.depot': { parts: [{ model: 'space-platform_large', fit: 1.9, at: [1, 1, 0] }, { model: 'space-structure_detailed', fit: 1.25, squash: 0.7, at: [1, 1, 0.02] }, { model: 'space-supports_low', fit: 0.45, at: [0.3, 1.7, 0] }, { model: 'space-barrels_rail', fit: 0.4, at: [1.7, 0.3, 0] }], team: ['metalRed'] },
  // --- phase 5: walls (1×1 blocks that join up in a row; `td-tile` used as a plain bevelled box), airfield, anti-air
  'building.wall': { parts: [SLAB('concrete', 1, 0.3, [0.5, 0.5, 0], '#a9a59b'), SLAB('stripe', 1, 0.05, [0.5, 0.5, 0.3]), SLAB('cap', 0.84, 0.1, [0.5, 0.5, 0.35], '#c9c5bb')], team: ['stripe'] },
  'building.wall.soviets': { parts: [SLAB('steel', 1, 0.27, [0.5, 0.5, 0], '#3e3b38'), SLAB('stripe', 1, 0.04, [0.5, 0.5, 0.27]), ...[0.27, 0.73].flatMap((x) => [0.27, 0.73].map((y) => SLAB('rust', 0.44, 0.12, [x, y, 0.31], '#7a4630')))], team: ['stripe'] },
  'building.wall.psi': { parts: [SLAB('base', 1, 0.09, [0.5, 0.5, 0], '#3d3350'), SLAB('glow', 1, 0.04, [0.5, 0.5, 0.09]), SLAB('base2', 0.94, 0.05, [0.5, 0.5, 0.13], '#4a3f5e'), { model: 'space-rock_crystalsLargeA', fit: 0.9, height: 0.36, at: [0.5, 0.5, 0.14], tint: { crystal: '#d29bff', rock: '#6a5290', rockTrack: '#54456e' } }], team: ['glow'] },
  'building.airfield': { parts: [SLAB('apron', 3, 0.04, [1.5, 1.5, 0], '#5d6063'), ...[[0.75, 0.75], [2.25, 0.75], [0.75, 2.25], [2.25, 2.25]].map(([x, y]): Part => ({ model: 'space-platform_small', fit: 1.22, at: [x, y, 0.04] })), { model: 'space-supports_high', fit: 0.24, height: 0.42, at: [1.5, 1.5, 0.04] }, { model: 'space-hangar_roundGlass', fit: 0.3, at: [1.5, 1.5, 0.44] }], team: ['metalRed'] },
  'building.samsite': { parts: [SLAB('pad', 0.95, 0.05, [0.5, 0.5, 0], '#9a978e'), { model: 'space-turret_single', exclude: ['turret'], fit: 0.72, at: [0.5, 0.5, 0.05] }], team: ['metalRed'] },
  'building.flakbattery': { parts: [{ model: 'td-tower-round-base', fit: 0.88, height: 0.26, at: [0.5, 0.5, 0] }], team: [] },
  // faction variants (looked up as `${sprite}.${faction}` first): soviets heavy/industrial, psi organic/purple
  'building.cy.soviets': { parts: [{ model: 'ind-building-l', fit: 2.8, at: [1.5, 1.5, 0] }], team: [] },
  'building.cy.psi': { parts: [{ model: 'space-hangar_roundGlass', fit: 2.5, at: [1.4, 1.6, 0], tint: { metal: '#9a88b8', metalDark: '#4a3f5e', dark: '#5e4785' } }, { model: 'space-rock_crystalsLargeA', fit: 1.0, at: [2.45, 0.55, 0], tint: { crystal: '#b46cff', rock: '#4a3f5e', rockTrack: '#3a3048' } }], team: ['metalRed'] },
  'building.power.soviets': { parts: [{ model: 'ind-building-m', fit: 1.9, at: [1, 1, 0] }], team: [] },
  'building.power.psi': { parts: [{ model: 'space-machine_generatorLarge', fit: 1.7, at: [1.05, 1.05, 0], tint: { metal: '#9a88b8', metalDark: '#4a3f5e', dark: '#5e4785' } }, { model: 'space-rock_crystals', fit: 0.6, at: [1.65, 0.4, 0], tint: { crystal: '#b46cff', rock: '#4a3f5e', rockTrack: '#3a3048' } }], team: ['metalRed'] },
  'building.barracks.soviets': { parts: [{ model: 'ind-building-p', fit: 1.9, at: [1, 1, 0] }], team: [] },
  'building.barracks.psi': { parts: [{ model: 'space-hangar_roundA', fit: 1.8, at: [1, 1, 0], tint: { metal: '#9a88b8', metalDark: '#4a3f5e', dark: '#5e4785' } }], team: ['metalRed'] },
  // --- phase 10: map structures (neutral, garrisoned/captured → owner changes, so no team colour on the civilian
  // ones; `sub-`/`com-`/`car-` models are not Kenney-recoloured, `ind-`/`td-` ones pick up owner accents).
  // Big/tall parts stand at the back (low x/y), small ones in front so nothing hides behind them.
  'building.civhouse': { parts: [{ model: 'sub-building-type-f', fit: 1.7, at: [0.95, 0.95, 0], tint: WORN }, TREE(1.75, 0.3)], team: [] },
  'building.civoffice': { parts: [{ model: 'com-building-a', fit: 1.6, at: [1, 1, 0], tint: WORN }], team: [] },
  'building.civhall': { parts: [{ model: 'civ-church', fit: 2.6, at: [1.45, 1.45, 0], tint: { Diffuse_color: '#e6e0d4' } }, TREE(2.7, 0.35, 0.9), TREE(0.35, 2.7)], team: [] },
  'building.civfarm': { parts: [{ model: 'civ-barn', fit: 1.45, at: [0.85, 0.95, 0], tint: { DarkRed: '#7a2e24', LightRed: '#9a4434', White: '#d8d2c2', RoofBlack: '#4a4642' } }, ROD('silo', 0.42, 1.05, [1.6, 0.4, 0], [0, 0, 0], '#b9b4a6'), { model: 'space-rocket_topA', flat: 'cap', fit: 0.42, height: 0.2, at: [1.6, 0.4, 1.05], tint: { cap: '#6a6660' } }], team: [] },
  'building.techrig': { parts: [SLAB('pad', 1.95, 0.04, [1, 1, 0], '#77736a'), { model: 'oil-pump', fit: 1.35, at: [0.8, 1.2, 0.04] }, { model: 'ind-detail-tank-large', fit: 0.75, at: [1.45, 0.5, 0.04] }, ...[[1.6, 1.5], [1.78, 1.32], [1.45, 1.7]].map(([x, y]): Part => ({ model: 'space-barrel', fit: 0.2, at: [x, y, 0.04], tint: { metal: '#3a3d40', metalRed: '#d8a020' } }))], team: [] },
  // green "+" (generic first-aid sign — never the red cross emblem)
  'building.hospital': { parts: [{ model: 'ind-building-p', flat: 'wall', fit: 1.75, at: [1.05, 0.7, 0], tint: { wall: '#e8e6df' } }, ...PLUS('cross', [1.05, 0.7, 0.76], 0.15, '#2fa84f'), { model: 'tent', flat: 'canvas', fit: 0.95, at: [0.62, 1.55, 0], tint: { canvas: '#e4e2da' } }, SLAB('pad', 0.5, 0.02, [1.55, 1.55, 0], '#8a8a84')], team: [] },
  'building.machineshop': { parts: [SLAB('apron', 1.95, 0.03, [1, 1, 0], '#6a6862'), { model: 'ind-building-j', fit: 1.3, at: [0.7, 0.85, 0.03] }, { model: 'car-truck', fit: 0.6, yaw: 90, at: [1.55, 1.45, 0.03] }, ROD('mast', 0.08, 1.15, [1.7, 0.35, 0.03], [0, 0, 0], '#d8a62a'), STRUT('boom', 0.06, [1.7, 0.35, 1.12], [1.55, 1.45, 1.05], '#d8a62a'), ROD('cable', 0.015, 0.4, [1.55, 1.45, 0.65], [0, 0, 0], '#2a2a2a')], team: [] },
  'building.outpost': { parts: [{ model: 'td-wood-structure-high', fit: 0.8, height: 1.3, at: [0.85, 0.85, 0] }, SLAB('deck', 0.95, 0.06, [0.85, 0.85, 1.3], '#6e5a40'), SLAB('hut', 0.6, 0.3, [0.85, 0.85, 1.36], '#7b7f6a'), SLAB('roof', 0.75, 0.05, [0.85, 0.85, 1.66], '#4e5244'), ROD('mast', 0.035, 0.9, [1.05, 0.7, 1.71], [0, 0, 0], '#c9ccc8'), { model: 'space-satelliteDish', fit: 0.45, at: [1.5, 1.45, 0] }, SLAB('shed', 0.5, 0.28, [0.6, 1.6, 0], '#80846e')], team: [] },
  // --- phase 11: shipyard on water (procedural pontoons/crane + Kenney containers/dish); faction tints
  'building.navalyard': { parts: NAVALYARD({ deck: '#a9a59b', float: '#3e4448', crane: '#d8a62a', house: '#d6d2c8', ship: { hull: '#7d868d', deck: '#5c646a' } }), team: ['stripe'] },
  'building.navalyard.soviets': { parts: NAVALYARD({ deck: '#6e6a62', float: '#2e2c2a', crane: '#a8502a', house: '#8a8076', ship: { hull: '#55524c', deck: '#45413c' } }), team: ['stripe'] },
  'building.navalyard.psi': { parts: NAVALYARD({ deck: '#6a5d80', float: '#3a3048', crane: '#9a88b8', house: '#8a74b0', ship: { hull: '#5b4a7a', deck: '#463a5e' } }), team: ['stripe'] },
  // --- phase 12: superweapons + economy. Procedural (proc:box/cyl/sphere/dome/ring) + Kenney parts; original
  // designs (no copied game buildings). Material suffix `!` = glowing, `~` = glass. Faction palettes as above.
  // Phase Gate (Allies): octagonal pad with a floor emitter, a standing ring on two clamp pylons framing a cyan
  // field (turned to face the camera), four capacitor columns with glowing coils, cables to the pylons.
  'building.phasegate': {
    parts: [
      BOX('base', 2.86, 2.86, 0.1, [1.5, 1.5, 0], AL.base), ...OCTA('deck', 2.1, 0.08, [1.5, 1.5, 0.1], AL.deck), RING('stripe', 1.75, [1.5, 1.5, 0.17], undefined, 'h', 0.03),
      CYL('pad', 1.5, 0.04, [1.5, 1.5, 0.18], AL.dark), CYL('floor!', 1.05, 0.03, [1.5, 1.5, 0.2], AL.glow),
      BOX('frame', 0.62, 0.34, 0.16, [1.5, 1.5, 0.18], AL.metal, 45),
      { ...RING('stripe', 2.0, [1.43, 1.43, 0.22], undefined, 'v', 0.035), yaw: 45 }, { ...RING('frame', 1.86, [1.5, 1.5, 0.26], AL.light, 'v', 0.075), yaw: 45 },
      CYL('field!', 1.42, 0.02, [1.5, 1.5, 1.19], '#3fc8f0', 1, [90, 0, 0], 45), CYL('core!', 0.72, 0.03, [1.53, 1.53, 1.19], AL.core, 1, [90, 0, 0], 45),
      ...[[2.17, 0.83], [0.83, 2.17]].flatMap(([x, y]) => [BOX('pylon', 0.3, 0.3, 1.25, [x, y, 0.18], AL.metal, 45), BOX('stripe', 0.34, 0.34, 0.07, [x, y, 1.43], undefined, 45), BALL('lamp!', 0.1, [x, y, 1.5], AL.glow)]),
      ...([[0.42, 0.42, 0.85], [2.58, 0.42, 0.6], [0.42, 2.58, 0.6], [2.6, 2.6, 0.38]] as V3[]).flatMap(([x, y, h]) => [
        CYL('cap', 0.26, h, [x, y, 0.1], AL.light), CYL('coil!', 0.3, 0.05, [x, y, 0.1 + h * 0.45], AL.glow), CYL('coil!', 0.3, 0.05, [x, y, 0.1 + h * 0.75], AL.glow), BALL('stripe', 0.16, [x, y, 0.08 + h]),
        STRUT('cable', 0.035, [x, y, 0.12], [x + (1.5 - x) * 0.55, y + (1.5 - y) * 0.55, 0.18], AL.dark),
      ]),
    ],
    team: ['stripe'],
  },
  // Storm Engine (Allies): generator house, a tapering four-legged lattice mast wound with copper conductor coils,
  // forked lightning rod + glowing arc ball on top, sky-facing dish, two antennae.
  'building.stormengine': {
    parts: [
      BOX('base', 2.86, 2.86, 0.1, [1.5, 1.5, 0], AL.base), BOX('house', 1.1, 0.95, 0.48, [0.72, 0.68, 0.1], AL.light), BOX('stripe', 1.12, 0.97, 0.05, [0.72, 0.68, 0.58]),
      BOX('vent', 0.5, 0.3, 0.1, [0.6, 0.62, 0.63], AL.dark), BOX('glass', 0.02, 0.6, 0.12, [1.275, 0.68, 0.32], '#24303a'),
      ...OCTA('footing', 1.15, 0.12, [1.68, 1.68, 0.1], AL.deck),
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => STRUT('mast', 0.07, [1.68 + sx * 0.42, 1.68 + sy * 0.42, 0.22], [1.68 + sx * 0.07, 1.68 + sy * 0.07, 2.2], AL.metal)),
      ROD('core', 0.1, 2.15, [1.68, 1.68, 0.22], [0, 0, 0], AL.dark),
      ...[[0.6, 0.86], [0.95, 0.7], [1.3, 0.55], [1.65, 0.4]].map(([z, d]) => RING('coil', d, [1.68, 1.68, z], '#c8803a', 'h', 0.09)),
      RING('stripe', 0.3, [1.68, 1.68, 1.95], undefined, 'h', 0.1),
      ...[0, 120, 240].map((a) => { const [x, y] = AROUND(1.68, 1.68, 0.16, a); return STRUT('rod', 0.03, [1.68, 1.68, 2.3], [x, y, 2.62], AL.metal); }),
      BALL('arc!', 0.2, [1.68, 1.68, 2.27], AL.core),
      { model: 'space-satelliteDish_large', fit: 0.85, at: [2.4, 0.62, 0.1], tint: { metal: '#c9d0d4', metalDark: '#5b6a74' } },
      ROD('antenna', 0.04, 1.1, [0.48, 2.42, 0.1], [0, 0, 0], AL.dark), BALL('lamp!', 0.09, [0.48, 2.42, 1.2], '#ff3a2a'),
      ROD('antenna', 0.04, 0.55, [2.55, 2.5, 0.1], [0, 0, 0], AL.dark), BALL('lamp!', 0.08, [2.55, 2.5, 0.65], AL.glow),
      STRUT('rod', 0.03, [0.4, 0.5, 0.6], [0.3, 0.4, 1.05], AL.metal), STRUT('rod', 0.03, [1.05, 0.5, 0.6], [1.15, 0.4, 1.0], AL.metal),
    ],
    team: ['stripe', 'metalRed'],
  },
  // Hammer Silo (Red Bloc): concrete pad, round silo collar with the two hazard-striped sliding doors parked on their
  // rails, a missile raised half out of the shaft with a team-coloured warhead, service gantry, control bunker.
  'building.hammersilo': {
    parts: [
      BOX('pad', 2.86, 2.86, 0.12, [1.5, 1.5, 0], RB.pad),
      ...[1.05, 2.15].map((y) => BOX('rail', 2.7, 0.06, 0.03, [1.5, y, 0.12], RB.dark)),
      CYL('collar', 1.5, 0.2, [1.5, 1.6, 0.12], RB.steel), RING('stripe', 1.52, [1.5, 1.6, 0.3], undefined, 'h', 0.04), CYL('shaft', 1.08, 0.01, [1.5, 1.6, 0.32], '#121212'),
      ...[0.42, 2.58].flatMap((x) => [BOX('door', 0.62, 1.3, 0.08, [x, 1.6, 0.15], '#24221f'), ...[-0.45, -0.15, 0.15, 0.45].map((dy) => BOX('hazard', 0.6, 0.13, 0.012, [x, 1.6 + dy, 0.23], RB.hazard, x < 1 ? 35 : -35))]),
      ROD('missile', 0.38, 1.5, [1.5, 1.6, 0.0], [0, 0, 0], '#e6e3da'), CYL('band', 0.41, 0.08, [1.5, 1.6, 0.95], RB.dark), CYL('band', 0.41, 0.06, [1.5, 1.6, 1.32], RB.dark),
      { model: 'space-rocket_topA', flat: 'tip', fit: 0.38, height: 0.55, at: [1.5, 1.6, 1.5] },
      // service gantry (back-right) with two arms clamping the missile
      BOX('gantry', 0.3, 0.3, 1.45, [2.35, 0.62, 0.12], RB.rust), BOX('stripe', 0.34, 0.34, 0.05, [2.35, 0.62, 1.57]), BALL('lamp!', 0.08, [2.35, 0.62, 1.62], RB.glow),
      STRUT('arm', 0.05, [2.3, 0.7, 0.75], [1.66, 1.45, 0.75], RB.rust), STRUT('arm', 0.05, [2.3, 0.7, 1.2], [1.66, 1.45, 1.2], RB.rust),
      // control bunker (back-left), warning lamps and vent stacks
      BOX('bunker', 0.75, 0.6, 0.32, [0.55, 0.42, 0.12], RB.mid), BOX('stripe', 0.77, 0.62, 0.04, [0.55, 0.42, 0.44]), BOX('glass', 0.6, 0.02, 0.06, [0.55, 0.725, 0.32], '#2a2a26'),
      ...[[1.0, 0.25], [1.25, 0.25]].map(([x, y]) => ROD('vent', 0.1, 0.38, [x, y, 0.12], [0, 0, 0], RB.dark)),
      ...[[0.3, 2.75], [2.75, 2.75]].map(([x, y]) => BALL('lamp!', 0.1, [x, y, 0.12], RB.glow)),
    ],
    team: ['stripe', 'tip'],
  },
  // Stasis Projector (Red Bloc): heavy stepped octagonal base with rust buttresses, a dark red dome ringed with a
  // glowing band, three prongs converging on a red emitter core with a halo; cooling stacks at the back.
  'building.stasis': {
    parts: [
      BOX('pad', 2.86, 2.86, 0.14, [1.5, 1.5, 0], RB.pad), ...OCTA('base', 2.25, 0.22, [1.5, 1.5, 0.14], RB.steel), ...OCTA('stripe', 2.28, 0.05, [1.5, 1.5, 0.3]),
      ...OCTA('base', 1.85, 0.12, [1.5, 1.5, 0.36], RB.dark),
      ...[45, 135, 225, 315].map((a) => { const [x, y] = AROUND(1.5, 1.5, 1.05, a); return BOX('buttress', 0.26, 0.4, 0.42, [x, y, 0.14], RB.rust, a); }),
      DOME('dome', 1.55, 0.72, [1.5, 1.5, 0.48], '#7e3328'), RING('band!', 1.38, [1.5, 1.5, 0.66], '#ff5a3a', 'h', 0.03),
      ...[0, 120, 240].map((a) => { const [x, y] = AROUND(1.5, 1.5, 0.5, a + 30), [tx, ty] = AROUND(1.5, 1.5, 0.12, a + 30); return STRUT('prong', 0.08, [x, y, 0.8], [tx, ty, 1.55], RB.steel); }),
      BALL('core!', 0.36, [1.5, 1.5, 1.32], RB.glow), RING('halo!', 0.66, [1.5, 1.5, 1.47], '#ff8a6a', 'h', 0.035), BALL('stripe', 0.14, [1.5, 1.5, 1.6]),
      ...[[0.38, 0.38], [0.38, 0.9]].map(([x, y]) => ROD('stack', 0.2, 0.75, [x, y, 0.14], [0, 0, 0], RB.dark)), ROD('rust', 0.21, 0.08, [0.38, 0.38, 0.82], [0, 0, 0], RB.rust),
      BOX('panel', 0.5, 0.06, 0.25, [2.2, 2.62, 0.14], RB.mid, 45),
    ],
    team: ['stripe'],
  },
  // Dominion Engine (Psi): octagonal violet plinth, tapering pillar, a glowing orb hovering above it inside two tilted
  // rings, three crystal pylons feeding it through glowing veins.
  'building.dominion': {
    parts: [
      BOX('pad', 2.86, 2.86, 0.08, [1.5, 1.5, 0], PS.pad), ...OCTA('base', 2.2, 0.16, [1.5, 1.5, 0.08], PS.mid), ...OCTA('stripe', 2.23, 0.04, [1.5, 1.5, 0.17]),
      CYL('pillar', 0.95, 1.05, [1.5, 1.5, 0.28], PS.light, 0.5), CYL('cap', 0.62, 0.08, [1.5, 1.5, 1.33], PS.base), RING('vein!', 0.62, [1.5, 1.5, 1.38], PS.glow, 'h', 0.06),
      BALL('orb!', 0.6, [1.5, 1.5, 1.6], '#e2b0ff'),
      { ...RING('ring', 1.35, [1.5, 1.5, 1.88], PS.pale, 'h', 0.045), rot: [24, 0, 0] }, { ...RING('stripe', 1.08, [1.5, 1.5, 1.88], undefined, 'h', 0.05), rot: [-20, 0, 40] },
      ...[20, 140, 260].flatMap((a) => {
        const [x, y] = AROUND(1.5, 1.5, 1.05, a);
        return [CYL('plinth', 0.36, 0.1, [x, y, 0.08], PS.base), { model: 'space-rock_crystals', fit: 0.42, at: [x, y, 0.18] as V3, tint: PSI_CRYSTAL }, STRUT('vein!', 0.04, [x, y, 0.3], [1.5 + (x - 1.5) * 0.35, 1.5 + (y - 1.5) * 0.35, 0.6], PS.glow)];
      }),
    ],
    team: ['stripe'],
  },
  // Mutagen Spire (Psi): organic mound with spines, a tall ribbed spire with glowing green bulbs, four glass vats of
  // green mutagen around it, connected by feed tubes.
  'building.mutagen': {
    parts: [
      BOX('pad', 2.86, 2.86, 0.06, [1.5, 1.5, 0], PS.pad), RING('stripe', 2.25, [1.5, 1.5, 0.06], undefined, 'h', 0.03), DOME('flesh', 2.1, 0.32, [1.5, 1.5, 0.06], PS.mid),
      ...[30, 100, 200, 290].map((a) => { const [x, y] = AROUND(1.5, 1.5, 0.75, a); return CONE('spine', 0.12, 0.22, [x, y, 0.12], [0, 0, 0], PS.pale); }),
      CYL('spire', 0.72, 1.95, [1.5, 1.5, 0.28], '#4f3f68', 0.14),
      ...[[0.7, 0.6], [1.15, 0.46], [1.6, 0.3]].map(([z, d]) => RING('rib', d, [1.5, 1.5, z], PS.pale, 'h', 0.08)),
      ...([[0, 0.55, 0.3], [130, 0.95, 0.24], [250, 1.35, 0.17]] as V3[]).map(([a, z, r]) => { const [x, y] = AROUND(1.5, 1.5, r, a); return BALL('bulb!', 0.18, [x, y, z - 0.09], PS.bio); }),
      BALL('bulb!', 0.17, [1.5, 1.5, 2.18], '#b8ff7a'),
      ...([[0.55, 0.55, 0.42, 0.95], [2.45, 0.6, 0.38, 0.8], [0.6, 2.45, 0.38, 0.8], [2.4, 2.4, 0.32, 0.55]] as [number, number, number, number][]).flatMap(([x, y, d, h]) => [
        ...VAT(x, y, 0.06, d, h, '#6cff4a', PS.mid), STRUT('tube!', 0.06, [x, y, 0.2 + h], [1.5 + (x - 1.5) * 0.18, 1.5 + (y - 1.5) * 0.18, 0.6 + h * 0.4], '#4fb83a'),
      ]),
    ],
    team: ['stripe'],
  },
  // Assembly Plant (Red Bloc): long sawtooth-roofed hall with a big door, two smokestacks, a portal crane lifting a
  // container over the yard, a conveyor carrying crates out of the hall, a tower crane at the back.
  'building.assembly': {
    parts: [
      BOX('pad', 2.86, 2.86, 0.06, [1.5, 1.5, 0], RB.pad),
      BOX('hall', 1.35, 2.1, 0.72, [0.8, 1.8, 0.06], RB.mid), BOX('stripe', 1.37, 2.12, 0.06, [0.8, 1.8, 0.58]),
      ...[0, 1, 2, 3].flatMap((i) => [BOX('roof', 1.35, 0.5, 0.16, [0.8, 0.98 + i * 0.53, 0.78], RB.steel), BOX('glass', 1.3, 0.04, 0.14, [0.8, 1.22 + i * 0.53, 0.78], '#3a4a52')]),
      BOX('door', 0.02, 0.8, 0.5, [1.48, 2.05, 0.06], RB.dark), ...[0, 1, 2].map((i) => BOX('hazard', 0.025, 0.12, 0.05, [1.485, 1.75 + i * 0.3, 0.58], RB.hazard)),
      { model: 'ind-chimney-large', fit: 0.42, at: [0.42, 0.42, 0.06] }, { model: 'ind-chimney-large', fit: 0.36, at: [1.05, 0.32, 0.06] },
      // conveyor out of the door with crates
      BOX('belt', 1.25, 0.28, 0.14, [2.12, 2.05, 0.06], RB.dark), ...[1.75, 2.15, 2.55].map((x) => BOX('crate', 0.18, 0.18, 0.14, [x, 2.05, 0.2], '#8a6a3a', 15)),
      // portal crane over the yard (rails along y)
      ...[1.75, 2.8].flatMap((x) => [ROD('crane', 0.07, 1.15, [x, 1.0, 0.06], [0, 0, 0], RB.hazard), ROD('crane', 0.07, 1.15, [x, 1.5, 0.06], [0, 0, 0], RB.hazard), BOX('crane', 0.08, 0.58, 0.06, [x, 1.25, 1.18], RB.hazard)]),
      BOX('stripe', 1.15, 0.12, 0.1, [2.28, 1.25, 1.2]), BOX('crane', 0.2, 0.18, 0.08, [2.3, 1.25, 1.12], RB.dark), ROD('cable', 0.014, 0.42, [2.3, 1.25, 0.7], [0, 0, 0], '#2a2a2a'),
      { model: 'ind-shipping-container-a', fit: 0.55, at: [2.3, 1.25, 0.48] },
      // tower crane (back-right)
      ROD('mast', 0.1, 1.6, [2.55, 0.35, 0.06], [0, 0, 0], RB.hazard), STRUT('jib', 0.06, [2.75, 0.35, 1.62], [1.6, 0.35, 1.62], RB.hazard), BOX('weight', 0.2, 0.2, 0.16, [2.78, 0.35, 1.5], RB.dark),
      ROD('cable', 0.012, 0.6, [1.75, 0.35, 1.0], [0, 0, 0], '#2a2a2a'),
    ],
    team: ['stripe'],
  },
  // Reclaimer (Psi): walled scrap pit with two toothed grinder drums, scrap heap, enclosed conveyor up to a
  // funnel hopper on legs, refined crystal pile out front, storage tank at the back.
  'building.reclaimer': {
    parts: [
      BOX('pad', 2.86, 2.86, 0.06, [1.5, 1.5, 0], PS.pad), BOX('pit', 1.55, 1.6, 0.04, [1.05, 1.7, 0.06], '#1c1824'),
      BOX('wall', 1.75, 0.18, 0.34, [1.05, 0.81, 0.06], PS.mid), BOX('wall', 0.18, 1.6, 0.34, [0.19, 1.7, 0.06], PS.mid), BOX('wall', 0.18, 1.6, 0.18, [1.91, 1.7, 0.06], PS.mid), BOX('wall', 1.75, 0.18, 0.18, [1.05, 2.59, 0.06], PS.mid),
      BOX('stripe', 1.77, 0.2, 0.04, [1.05, 0.81, 0.4]), BOX('stripe', 0.2, 1.62, 0.04, [0.19, 1.7, 0.4]),
      ...[1.45, 1.95].flatMap((y) => [ROD('drum', 0.26, 1.5, [1.8, y, 0.26], [0, 0, 90], '#6a6478'), ...[0.55, 0.85, 1.15, 1.45].map((x) => ({ ...RING('teeth', 0.34, [x, y, 0.09], '#a8a2b4', 'v', 0.1), yaw: 90 }))]),
      ...([[0.6, 1.1, '#6a5a4a'], [0.9, 1.05, '#5a6670'], [1.45, 1.1, '#7a4630'], [0.5, 2.35, '#5a6670'], [1.3, 2.35, '#6a5a4a']] as [number, number, string][]).map(([x, y, c], i) => BOX('scrap', 0.2, 0.16, 0.12, [x, y, 0.1], c, i * 37)),
      { model: 'space-barrel', fit: 0.2, at: [1.6, 2.3, 0.1], tint: { metal: '#5a5460', metalRed: '#8a7a40' } },
      STRUT('conveyor', 0.2, [1.9, 1.15, 0.12], [2.35, 0.75, 1.1], PS.light), STRUT('leg', 0.05, [2.1, 0.97, 0.06], [2.1, 0.97, 0.55], PS.base),
      ...[[2.15, 0.45], [2.65, 0.45], [2.15, 1.0], [2.65, 1.0]].map(([x, y]) => STRUT('leg', 0.05, [x, y, 0.06], [2.4 + (x - 2.4) * 0.5, 0.72 + (y - 0.72) * 0.5, 0.8], PS.base)),
      CYL('hopper', 0.85, 0.55, [2.4, 0.72, 0.75], PS.light, 2.2), RING('stripe', 0.86, [2.4, 0.72, 1.27], undefined, 'h', 0.05),
      CYL('tank', 0.5, 0.75, [0.45, 0.35, 0.06], PS.base), DOME('tank', 0.5, 0.15, [0.45, 0.35, 0.81], PS.light),
      { model: 'space-rock_crystals', fit: 0.5, at: [2.45, 2.35, 0.06], tint: PSI_CRYSTAL }, BALL('glow!', 0.1, [2.4, 1.6, 0.06], PS.glow),
    ],
    team: ['stripe'],
  },
  // Duplicator Vats (Psi, 2×2): four glass cloning tanks of different sizes with green fluid (dark figures floating in
  // the two big ones), pipes between the caps, a pump on the plinth.
  'building.vats': {
    parts: [
      BOX('pad', 1.92, 1.92, 0.12, [1, 1, 0], PS.base), BOX('stripe', 1.95, 1.95, 0.035, [1, 1, 0.06]),
      ...VAT(0.55, 0.55, 0.13, 0.6, 1.05, '#5cf04a', PS.mid), ...VAT(1.45, 0.55, 0.13, 0.48, 0.85, '#5cf04a', PS.mid),
      ...VAT(0.55, 1.45, 0.13, 0.48, 0.85, '#5cf04a', PS.mid), ...VAT(1.45, 1.42, 0.13, 0.4, 0.55, '#5cf04a', PS.mid),
      ...([[0.55, 0.55, 0.4], [1.45, 0.55, 0.32]] as V3[]).flatMap(([x, y, s]) => [ROD('figure', 0.11, s, [x, y, 0.3], [0, 0, 0], '#1e3a1a'), BALL('figure', 0.1, [x, y, 0.3 + s], '#1e3a1a')]),
      STRUT('pipe', 0.06, [0.55, 0.55, 1.3], [1.45, 0.55, 1.1], PS.light), STRUT('pipe', 0.06, [0.55, 0.55, 1.3], [0.55, 1.45, 1.1], PS.light),
      BALL('pump', 0.22, [1.0, 1.0, 0.13], PS.light), BALL('glow!', 0.08, [1.0, 1.0, 0.33], PS.bio),
    ],
    team: ['stripe'],
  },
  // Psi Beacon (Psi, 2×2): octagonal base, three swept fins holding a slender sensor spire with glowing halo rings
  // and a bright emitter orb on top; a crystal at its foot.
  'building.psibeacon': {
    parts: [
      BOX('pad', 1.85, 1.85, 0.08, [1, 1, 0], PS.pad), ...OCTA('base', 1.25, 0.14, [1, 1, 0.08], PS.mid), ...OCTA('stripe', 1.28, 0.04, [1, 1, 0.15]),
      ...[0, 120, 240].map((a) => { const [x, y] = AROUND(1, 1, 0.55, a + 45), [tx, ty] = AROUND(1, 1, 0.1, a + 45); return STRUT('fin', 0.1, [x, y, 0.22], [tx, ty, 1.0], PS.light); }),
      CYL('spire', 0.3, 1.4, [1, 1, 0.22], PS.pale, 0.3),
      RING('halo!', 0.7, [1, 1, 0.85], PS.glow, 'h', 0.035), RING('halo!', 0.5, [1, 1, 1.18], PS.glow, 'h', 0.04),
      BALL('emit!', 0.28, [1, 1, 1.55], '#f0d0ff'), ...[0, 120, 240].map((a) => { const [x, y] = AROUND(1, 1, 0.14, a); return CONE('prong', 0.06, 0.16, [x, y, 1.6], [0, 0, 0], PS.base); }),
      { model: 'space-rock_crystals', fit: 0.32, at: [1.6, 0.42, 0.08], tint: PSI_CRYSTAL },
    ],
    team: ['stripe'],
  },
  'building.bridgehut': { parts: [{ model: 'civ-shed', fit: 0.85, at: [0.48, 0.48, 0] }, ROD('post', 0.05, 0.45, [0.9, 0.12, 0], [0, 0, 0], '#e07a1a')], team: [] },
};
/** Rotating top parts for defensive buildings (baked in 32 facings like vehicle turrets). */
export const BUILDING_TURRET: Record<string, UnitArt> = {
  'building.tower': { parts: [{ model: 'turret-cannon', include: ['Turret_Cannon_Top'], fit: 0.7, at: [0, 0, 0.42], ref: { exclude: ['Turret_Cannon_Top'] } }], yaw: 0, team: ['Orange'], facings: 32, frame: 72, anchor: 0.75 },
  // turrets face +y (at) at yaw 0; `rot` x > 0 tilts a part's top towards +y (x < 0 raises its +y end)
  'building.samsite': { parts: [SLAB('frame', 0.4, 0.1, [0, 0, 0.3], '#8c969c'), ...[0.36, 0.46].flatMap((z) => [-0.1, 0.1].flatMap((x) => MISSILE([x, -0.1, z])))], yaw: 0, team: ['metalRed', 'tip'], facings: 32, frame: 72, anchor: 0.75 },
  'building.flakbattery': { parts: [{ model: 'td-weapon-turret', fit: 0.52, at: [0, -0.04, 0.24], rot: [-30, 0, 0] }, ROD('barrel', 0.045, 0.34, [-0.07, 0.08, 0.45], [60, 0, 0], '#2e2a26'), ROD('barrel', 0.045, 0.34, [0.07, 0.08, 0.45], [60, 0, 0], '#2e2a26')], yaw: 0, team: [], facings: 32, frame: 72, anchor: 0.75 },
  // space-turret_double's muzzles point to its −y, so it needs yaw 180 (like the unit.gatling hull)
  'building.gatlingtower': { parts: [{ model: 'space-turret_double', include: ['turret'], fit: 0.7, ref: { exclude: ['turret'] }, tint: { metal: '#9a88b8', metalDark: '#4a3f5e', dark: '#5e4785' } }], yaw: 180, team: ['metalRed'], facings: 32, frame: 72, anchor: 0.75 },
};

export const PROP_ART: Record<string, PropArt> = {
  'prop.tree.0': { parts: [{ model: 'nat-tree_oak', height: 1.2, tint: { leafsGreen: '#3f6b2a', woodBark: '#5a3e28' } }] },
  'prop.tree.1': { parts: [{ model: 'nat-tree_default', height: 1.1, tint: { leafsGreen: '#35602a', woodBark: '#5a3e28' } }] },
  'prop.tree.2': { parts: [{ model: 'nat-tree_pineRoundA', height: 1.3, tint: { leafsDark: '#2c5226', woodBarkDark: '#4a3322' } }] },
  'prop.tree.3': { parts: [{ model: 'nat-tree_detailed', height: 1.15, tint: { leafsGreen: '#466f2e', woodBark: '#5a3e28' } }] },
  'prop.rock.0': { parts: [{ model: 'nat-rock_largeA', fit: 0.9, tint: { dirt: '#77705f', grass: '#8a8676' } }] },
  'prop.rock.1': { parts: [{ model: 'nat-rock_largeB', fit: 0.9, tint: { dirt: '#77705f', grass: '#8a8676' } }] },
  'prop.rock.2': { parts: [{ model: 'nat-rock_largeC', fit: 0.9, tint: { dirt: '#77705f', grass: '#8a8676' } }] },
  'prop.rock.3': { parts: [{ model: 'nat-rock_largeD', fit: 0.9, tint: { dirt: '#77705f', grass: '#8a8676' } }] },
  // bonus supply crate (Quaternius, CC0) with a bright yellow "+" on the lid
  'prop.crate': { parts: [{ model: 'crate', fit: 0.4, tint: { Wood: '#b07c3e', DarkWood: '#6a4524' } }, ...PLUS('mark', [0, 0, 0.4], 0.07, '#ffd21a')] },
};

/** Terrain id → CC0 texture (null = procedural). One texture spans TEX_TILES×TEX_TILES tiles. */
const TERRAIN_TEX: (string | null)[] = ['Grass004', 'Ground054', null, 'Rock051', 'Asphalt031', 'Grass004', null];
const TERRAIN_GRADE: (string | null)[] = [null, 'rgba(160,120,60,0.12)', null, 'rgba(60,55,45,0.25)', 'rgba(20,20,20,0.35)', null, null];
const TEX_TILES = 4;

// ------------------------------------------------------------------ baker

/** Row layout of an animated atlas (rows × facings). */
export interface AnimRows { idle: number; walk: number; walkN: number; fire: number; death: number; deathN: number }
export interface Atlas { c: HTMLCanvasElement; frame: number; facings: number; ax: number; ay: number; res: number; rows?: AnimRows }
export interface UnitSprites { body: Atlas; turret?: Atlas; pivot: [number, number]; yaw: number }
export interface BakedBuilding { c: HTMLCanvasElement; ox: number; oy: number; w: number; h: number }

const models = new Map<string, THREE.Group>();
const units = new Map<string, UnitSprites>();
const buildings = new Map<string, BakedBuilding>();
const turrets = new Map<string, UnitSprites>();
const props = new Map<string, { c: HTMLCanvasElement; ax: number; ay: number; w: number; h: number }>();
const tiles = new Map<string, HTMLCanvasElement>();
const textures = new Map<string, HTMLImageElement>();

let renderer: THREE.WebGLRenderer | null = null;
let shadowCatcher: THREE.Mesh;
let scene: THREE.Scene, camera: THREE.OrthographicCamera, root: THREE.Group;
export let artReady = false;
export let artError: string | null = null;

function setup() {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xe8eef5, 0x4a4636, 1.6));
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.6);
  sun.position.set(-6, 10, -2); // screen top-left
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.1, far: 40 });
  sun.shadow.bias = -0.002;
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.38 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  shadowCatcher = ground;
  root = new THREE.Group();
  scene.add(root);
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  // 2:1 dimetric: 30° elevation, looking from +x/+z (tile x/y grow towards the viewer's bottom).
  const e = Math.PI / 6;
  camera.position.set(Math.cos(e) * Math.SQRT1_2 * 60, Math.sin(e) * 60, Math.cos(e) * Math.SQRT1_2 * 60);
  camera.lookAt(0, 0, 0);
}

/** Frame the camera so world origin lands at (ax, ay) inside a w×h css-px frame. */
function frameCamera(w: number, h: number, ax: number, ay: number, res = RES) {
  camera.left = -ax / K; camera.right = (w - ax) / K;
  camera.top = ay / K; camera.bottom = -(h - ay) / K;
  camera.updateProjectionMatrix();
  renderer!.setSize(w * res, h * res, false);
}

// ------------------------------------------------------------------ procedural models ("proc:<kind>:<params>")

/** Ship hull, unit length along z (bow +z), deck at y = depth (rising `sheer` towards the bow), keel narrower. */
function hullGeo(b: number, d: number, bow: number, sheer: number): THREE.BufferGeometry {
  const half: [number, number][] = [[b * 0.4, -0.5], [b * 0.5, -0.3], [b * 0.5, 0.5 - bow]];
  for (let i = 1; i <= 6; i++) { const t = i / 6; half.push([b * 0.5 * (1 - t ** 1.7), 0.5 - bow + bow * t]); }
  const ring = [...half, ...half.slice(0, -1).reverse().map(([x, z]): [number, number] => [-x, z])];
  const top = ring.map(([x, z]) => new THREE.Vector3(x, d * (1 + sheer * Math.max(0, (z - 0.15) / 0.35)), z));
  const bot = ring.map(([x, z]) => new THREE.Vector3(x * 0.5, 0, z * 0.9 - 0.03));
  const side: number[] = [], deck: number[] = [];
  const tri = (out: number[], ...v: THREE.Vector3[]) => v.forEach((p) => out.push(p.x, p.y, p.z));
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    tri(side, top[i], top[j], bot[j]); tri(side, top[i], bot[j], bot[i]);
  }
  for (const [a, b2, c] of THREE.ShapeUtils.triangulateShape(ring.map(([x, z]) => new THREE.Vector2(x, z)), [])) { tri(deck, top[a], top[b2], top[c]); tri(side, bot[a], bot[c], bot[b2]); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...side, ...deck], 3));
  g.addGroup(0, side.length / 3, 0); g.addGroup(side.length / 3, deck.length / 3, 1);
  g.computeVertexNormals();
  return g;
}

/** Cigar body (lathe), unit length along z, rounded nose at +z, tapered tail. */
function cigarGeo(dia: number): THREE.BufferGeometry {
  const R = dia / 2, pts = [new THREE.Vector2(0, -0.5)];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16; // 0 tail … 1 nose
    const r = u < 0.72 ? R * (1 - ((0.72 - u) / 0.72) ** 2.2 * 0.82) : R * Math.sqrt(Math.max(0, 1 - ((u - 0.72) / 0.28) ** 2));
    pts.push(new THREE.Vector2(Math.max(r, 1e-4), u - 0.5));
  }
  return new THREE.LatheGeometry(pts, 14).rotateX(Math.PI / 2);
}

/** Tapered tube arching up out of the water (base at y ≈ −0.15) and forward (+z); unit length. */
function tentacleGeo(curl: number, dip: number): THREE.BufferGeometry {
  // dip 0: tip hangs just above the water; 1: tip goes back under; 2: tip curls up into a hook
  const c = curl, tip: number[][] = dip === 2 ? [[c * 0.1, 0.16, 0.66], [c * 0.2, 0.2, 0.78], [c * 0.24, 0.32, 0.74], [c * 0.18, 0.36, 0.64], [c * 0.12, 0.3, 0.6]]
    : [[c * 0.12, 0.18, 0.66], [c * 0.16, dip ? -0.1 : 0.07, 0.78]];
  const curve = new THREE.CatmullRomCurve3([[0, -0.15, 0], [0, 0.1, 0.08], [0, 0.27, 0.25], [c * 0.05, 0.3, 0.45], ...tip].map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const S = 40, M = 10, { normals, binormals } = curve.computeFrenetFrames(S, false);
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= S; i++) {
    const t = i / S, p = curve.getPointAt(t), r = 0.1 * (1 - t) ** 0.8 + 0.012 * t;
    for (let j = 0; j <= M; j++) {
      const a = (j / M) * Math.PI * 2, n = normals[i].clone().multiplyScalar(Math.cos(a) * r).add(binormals[i].clone().multiplyScalar(Math.sin(a) * r));
      pos.push(p.x + n.x, p.y + n.y, p.z + n.z);
      if (i < S && j < M) { const k = i * (M + 1) + j; idx.push(k, k + M + 1, k + 1, k + 1, k + M + 1, k + M + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Plain-shape models built in code (no file): materials are named `proc` (+ `proc.deck` for hull decks). */
function procModel(spec: string): THREE.Group {
  const [, kind, ...ps] = spec.split(':');
  const n = ps.map(Number);
  let geo: THREE.BufferGeometry;
  switch (kind) {
    case 'hull': geo = hullGeo(n[0], n[1], n[2], n[3]); break;
    case 'box': geo = new THREE.BoxGeometry(n[0], 1, n[1]).translate(0, 0.5, 0); break;
    case 'cigar': geo = cigarGeo(n[0]); break;
    case 'sphere': geo = new THREE.SphereGeometry(0.5, 16, 12); break;
    case 'dome': geo = new THREE.SphereGeometry(0.5, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2); break;
    case 'ringh': geo = new THREE.TorusGeometry(0.5, n[0], 8, 28).rotateX(Math.PI / 2); break;
    case 'ringv': geo = new THREE.TorusGeometry(0.5, n[0], 8, 28); break;
    case 'tentacle': geo = tentacleGeo(n[0], n[1]); break;
    case 'cyl': geo = new THREE.CylinderGeometry(n[0] * 0.5, 0.5, 1, 20).translate(0, 0.5, 0); break; // top/bottom radius ratio n[0]
    default: throw new Error(`unknown procedural model ${spec}`);
  }
  const mat = (name: string) => Object.assign(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, metalness: 0.15, side: THREE.DoubleSide, flatShading: kind === 'hull' || kind === 'box' }), { name });
  const mesh = new THREE.Mesh(geo, kind === 'hull' ? [mat('proc'), mat('proc.deck')] : mat('proc'));
  const g = new THREE.Group();
  g.add(mesh);
  return g;
}

/** Waterline for `sea` units: everything below height 0 is clipped. */
const WATERLINE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let foamTex: THREE.Texture | null = null;
/** Soft foam ring + darker submerged silhouette under a ship (canvas top = stern, bottom = bow). */
function foamTexture(): THREE.Texture {
  if (foamTex) return foamTex;
  const W = 128, H = 256, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.filter = 'blur(7px)';
  g.fillStyle = 'rgba(6,26,38,0.3)';
  g.beginPath(); g.ellipse(W / 2, H / 2, W * 0.33, H * 0.4, 0, 0, Math.PI * 2); g.fill();
  g.filter = 'blur(2.5px)';
  g.strokeStyle = 'rgba(236,246,252,0.5)'; g.lineWidth = 5;
  g.beginPath(); g.ellipse(W / 2, H / 2, W * 0.38, H * 0.43, 0, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(236,246,252,0.35)'; g.lineWidth = 3; // stern wash
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(W / 2 + s * 10, H * 0.1); g.quadraticCurveTo(W / 2 + s * 18, H * 0.04, W / 2 + s * 30, 2); g.stroke(); }
  foamTex = new THREE.CanvasTexture(c);
  foamTex.colorSpace = THREE.SRGBColorSpace;
  return foamTex;
}
function foamMesh(group: THREE.Group): THREE.Mesh {
  group.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(group, true), size = bb.getSize(new THREE.Vector3()), mid = bb.getCenter(new THREE.Vector3());
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: foamTexture(), transparent: true, depthWrite: false }));
  m.scale.set(size.x * 1.3 + 0.08, 1, size.z * 1.12 + 0.08);
  m.position.set(mid.x, 0.003, mid.z);
  return m;
}

async function loadModel(name: string): Promise<THREE.Group> {
  let m = models.get(name);
  if (m) return m;
  if (name.startsWith('proc:')) { m = procModel(name); models.set(name, m); return m; }
  const gltf = await new GLTFLoader().loadAsync(`${BASE}models/${name}.glb`);
  m = gltf.scene;
  m.animations = gltf.animations; // kept for animated bakes (SkeletonUtils.clone copies them)
  models.set(name, m);
  return m;
}

const matches = (o: THREE.Object3D, names: string[]) => { for (let p: THREE.Object3D | null = o; p; p = p.parent) if (names.includes(p.name)) return true; return false; };

/** Build one part: clone, filter nodes, recolour, scale and place (x = tile x, z = tile y). */
async function buildPart(p: Part, team: string[], teamColor: string, faction: FactionId): Promise<THREE.Object3D> {
  const src = await loadModel(p.model);
  const obj = cloneSkinned(src);
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    if ((p.include && !matches(o, p.include)) || (p.exclude && matches(o, p.exclude))) { mesh.visible = false; return; }
    mesh.castShadow = true;
    mesh.frustumCulled = false; // posed skinned meshes leave their bind-pose bounds
    const recolor = (m: THREE.Material) => {
      const c = (m as THREE.MeshStandardMaterial).clone();
      if (p.flat) { c.map = null; c.color.set('#ffffff'); c.name = m.name.startsWith('proc.') ? p.flat + m.name.slice(4) : p.flat; } // untextured: tint/team by this name (proc hull deck: `${flat}.deck`)
      if (p.tint?.[c.name]) c.color.set(p.tint[c.name]);
      if (team.includes(c.name)) c.color.set(teamColor).multiplyScalar(0.85);
      // material-name suffixes: `!` glows (emissive in its own colour), `~` is see-through glass (casts no shadow)
      if (c.name.endsWith('!')) c.emissive.copy(c.color).multiplyScalar(0.75);
      if (c.name.endsWith('~')) { c.transparent = true; c.opacity = 0.38; c.depthWrite = false; c.roughness = 0.15; mesh.castShadow = false; }
      if (c.map && /^(ind|td|air)-/.test(p.model)) c.map = kenneyRecolor(c.map, teamColor, faction);
      c.metalness = Math.min(c.metalness ?? 0, 0.3);
      return c;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(recolor) : recolor(mesh.material);
  });
  const wrap = new THREE.Group();
  wrap.add(obj);
  const box = filteredBox(obj, p.ref ?? p);
  const size = box.getSize(new THREE.Vector3());
  const k = p.height && !p.fit ? p.height / size.y : p.fit ? p.fit / Math.max(size.x, size.z, p.bone ? size.y : 0) : 1;
  obj.scale.multiplyScalar(k);
  const sq = (p.squash ?? 1) * (p.height && p.fit ? p.height / (size.y * k) : 1); // fit + height: stretch to both
  obj.scale.y *= sq;
  const c = box.getCenter(new THREE.Vector3());
  obj.position.set(-c.x * k, -box.min.y * k * sq, -c.z * k); // centre on origin, stand on ground
  const d2r = Math.PI / 180;
  if (p.rot && !p.bone) wrap.rotation.set(p.rot[0] * d2r, (p.yaw ?? 0) * d2r + p.rot[1] * d2r, p.rot[2] * d2r, 'YXZ');
  else wrap.rotation.y = (p.yaw ?? 0) * d2r;
  const [x, y, z] = p.at ?? [0, 0, 0];
  wrap.position.set(x, z, y);
  return wrap;
}

/** Bounding box of the meshes selected by an include/exclude filter (in the object's own frame). */
function filteredBox(o: THREE.Object3D, f: { include?: string[]; exclude?: string[] }): THREE.Box3 {
  const box = new THREE.Box3();
  o.updateMatrixWorld(true);
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (!m.isMesh || (f.include && !matches(c, f.include)) || (f.exclude && matches(c, f.exclude))) return;
    box.expandByObject(m, true);
  });
  if (box.isEmpty()) box.setFromObject(o);
  return box;
}

const texCache = new Map<string, THREE.Texture>();
/** Kenney colormaps: orange accents → team colour, lavender body → faction body tone. */
function kenneyRecolor(t: THREE.Texture, team: string, faction: FactionId): THREE.Texture {
  const key = `${t.uuid}|${team}|${faction}`;
  let out = texCache.get(key);
  if (out) return out;
  const img = t.image as HTMLImageElement | ImageBitmap;
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  const g = cv.getContext('2d')!;
  g.drawImage(img as CanvasImageSource, 0, 0);
  const d = g.getImageData(0, 0, cv.width, cv.height);
  const tc = new THREE.Color(team), body = new THREE.Color(FACTIONS[faction].style.body);
  const hsl = { h: 0, s: 0, l: 0 };
  for (let i = 0; i < d.data.length; i += 4) {
    const c = new THREE.Color(d.data[i] / 255, d.data[i + 1] / 255, d.data[i + 2] / 255);
    c.getHSL(hsl);
    let n: THREE.Color | null = null;
    if ((hsl.h < 0.14 || hsl.h > 0.95) && hsl.s > 0.5) n = tc.clone().multiplyScalar(0.6 + hsl.l * 0.8);
    else if (hsl.h > 0.58 && hsl.h < 0.78 && hsl.s < 0.6) n = body.clone().multiplyScalar(0.55 + hsl.l * 1.0);
    if (n) { d.data[i] = Math.min(255, n.r * 255); d.data[i + 1] = Math.min(255, n.g * 255); d.data[i + 2] = Math.min(255, n.b * 255); }
  }
  g.putImageData(d, 0, 0);
  out = new THREE.CanvasTexture(cv);
  out.colorSpace = THREE.SRGBColorSpace;
  out.flipY = t.flipY;
  out.magFilter = THREE.NearestFilter;
  texCache.set(key, out);
  return out;
}

function snapshot(target: CanvasRenderingContext2D, dx: number, dy: number) {
  renderer!.render(scene, camera);
  target.drawImage(renderer!.domElement, dx, dy);
}

async function bakeRotating(a: UnitArt, team: string, faction: FactionId, which: 'body' | 'turret'): Promise<{ atlas: Atlas; pivot: [number, number] }> {
  const parts = which === 'body' ? a.parts : a.turret!;
  const group = new THREE.Group();
  for (const p of parts) group.add(await buildPart(p, a.team, team, faction));
  let pivot: [number, number] = [0, 0];
  if (which === 'turret') {
    // Turret geometry sits where it is on the hull; bake it rotating around its own centre.
    group.updateMatrixWorld(true);
    const tb = new THREE.Box3();
    group.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.visible) tb.expandByObject(m, true); });
    const tc = a.turretAt ? new THREE.Vector3(a.turretAt[0], 0, a.turretAt[1]) : tb.getCenter(new THREE.Vector3());
    pivot = [tc.x * (a.scale ?? 1), tc.z * (a.scale ?? 1)];
    for (const ch of group.children) { ch.position.x -= tc.x; ch.position.z -= tc.z; }
  }
  root.add(group);
  const anim = which === 'body' ? a.anim : undefined;
  const res = anim?.res ?? a.res ?? RES;
  const { poses, rows } = anim ? animPoses(anim) : { poses: [null], rows: undefined };
  const pose = anim ? poser(group, parts) : () => {};
  const F = a.frame, ax = F / 2, ay = F * (a.anchor ?? 0.66);
  frameCamera(F, F, ax, ay, res);
  const c = document.createElement('canvas');
  c.width = F * res * a.facings; c.height = F * res * poses.length;
  const g = c.getContext('2d')!;
  const yaw0 = (a.yaw * Math.PI) / 180;
  shadowCatcher.visible = !a.air && !a.sea; // aircraft: the renderer paints its own ground shadow; ships float
  if (a.sea) {
    renderer!.clippingPlanes = [WATERLINE];
    if (which === 'body') group.add(foamMesh(group));
  }
  if (a.scale) group.scale.setScalar(a.scale); // about the waterline/ground origin, so the clip plane stays put
  poses.forEach((ps, r) => {
    if (ps) pose(ps[0], ps[1]);
    for (let i = 0; i < a.facings; i++) {
      const th = (i / a.facings) * Math.PI * 2; // tile-space facing
      group.rotation.y = Math.PI / 2 - th + yaw0;
      snapshot(g, i * F * res, r * F * res);
    }
  });
  shadowCatcher.visible = true;
  renderer!.clippingPlanes = [];
  root.remove(group);
  return { atlas: { c, frame: F, facings: a.facings, ax, ay, res, rows }, pivot };
}

/** Atlas rows for an animated unit: idle, walk cycle, firing pose, death (each [clip, fraction of its duration]). */
function animPoses(an: Anim): { poses: ([string, number] | null)[]; rows: AnimRows } {
  const poses: [string, number][] = [[an.idle, 0]];
  for (let i = 0; i < an.walkFrames; i++) poses.push([an.walk, i / an.walkFrames]);
  const fire = an.fire ? poses.push([an.fire, an.fireAt ?? 0.15]) - 1 : 0;
  const death = poses.length, deathN = an.death ? an.deathFrames ?? 4 : 0;
  for (let i = 0; i < deathN; i++) poses.push([an.death!, (i + 1) / deathN]);
  return { poses, rows: { idle: 0, walk: 1, walkN: an.walkFrames, fire, death, deathN } };
}

/** Returns pose(clip, f): poses every skinned part at fraction f of the clip and moves bone-attached parts along. */
function poser(group: THREE.Group, parts: Part[]) {
  const mixers: { m: THREE.AnimationMixer; clips: THREE.AnimationClip[] }[] = [];
  let host: THREE.Object3D | undefined;
  group.children.forEach((w, k) => {
    const o = w.children[0];
    if (!parts[k].bone && o?.animations.length) { mixers.push({ m: new THREE.AnimationMixer(o), clips: o.animations }); host ??= o; }
  });
  const d2r = Math.PI / 180;
  const attached = parts.flatMap((p, k) => {
    const bone = p.bone && host?.getObjectByName(p.bone);
    if (!bone) return [];
    const [x, y, z] = p.at ?? [0, 0, 0], [rx, ry, rz] = p.rot ?? [0, 0, 0];
    return [{ wrap: group.children[k], bone, off: new THREE.Vector3(x, z, y), rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(rx * d2r, ry * d2r, rz * d2r)) }];
  });
  const m4 = new THREE.Matrix4(), inv = new THREE.Matrix4(), pos = new THREE.Vector3(), q = new THREE.Quaternion(), scl = new THREE.Vector3();
  return (clip: string, f: number) => {
    for (const { m, clips } of mixers) {
      const c = clips.find((x) => x.name.split('|').pop() === clip);
      if (!c) continue;
      m.stopAllAction();
      const act = m.clipAction(c);
      act.setLoop(THREE.LoopOnce, 1); act.clampWhenFinished = true; act.play();
      m.setTime(Math.min(f * c.duration, c.duration - 1e-3));
    }
    group.rotation.y = 0;
    group.updateMatrixWorld(true);
    inv.copy(group.matrixWorld).invert();
    for (const at of attached) {
      m4.multiplyMatrices(inv, at.bone.matrixWorld).decompose(pos, q, scl);
      at.wrap.position.copy(at.off).applyQuaternion(q).add(pos);
      at.wrap.quaternion.copy(q).multiply(at.rot);
    }
  };
}

/** Dev (?art): re-bake one unit after editing UNIT_ART at runtime (tuning bone attachments). */
export async function rebakeUnit(id: string, faction: FactionId, team: string) {
  units.set(`${id}|${faction}|${team}`, await bakeUnit(id, team, faction));
}

async function bakeUnit(id: string, team: string, faction: FactionId): Promise<UnitSprites> {
  const a = UNIT_ART[id];
  const body = await bakeRotating(a, team, faction, 'body');
  const turret = a.turret ? await bakeRotating(a, team, faction, 'turret') : undefined;
  return { body: body.atlas, turret: turret?.atlas, pivot: turret?.pivot ?? [0, 0], yaw: a.yaw };
}

async function bakeBuilding(sprite: string, def: string, team: string, faction: FactionId): Promise<BakedBuilding> {
  const a = BUILDING_ART[sprite];
  const d = BUILDINGS[def];
  const group = new THREE.Group();
  for (const p of a.parts) group.add(await buildPart(p, a.team, team, faction));
  root.add(group);
  const head = 110;
  const w = ((d.w + d.h) * TW) / 2, h = ((d.w + d.h) * TH) / 2 + head;
  frameCamera(w, h, (d.h * TW) / 2, head);
  const c = document.createElement('canvas');
  c.width = w * RES; c.height = h * RES;
  snapshot(c.getContext('2d')!, 0, 0);
  root.remove(group);
  return { c, ox: (d.h * TW) / 2, oy: head, w, h };
}

async function bakeProp(id: string) {
  const group = new THREE.Group();
  for (const p of PROP_ART[id].parts) group.add(await buildPart(p, [], '#ffffff', 'allies'));
  root.add(group);
  const w = 72, h = 96, ax = 36, ay = 78;
  frameCamera(w, h, ax, ay);
  const c = document.createElement('canvas');
  c.width = w * RES; c.height = h * RES;
  snapshot(c.getContext('2d')!, 0, 0);
  root.remove(group);
  props.set(id, { c, ax, ay, w, h });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(`load ${src}`)); i.src = src; });
}

/** Yield to the event loop. Unlike setTimeout this is not clamped/throttled in background tabs. */
export function yieldToPage(): Promise<void> {
  const sch = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (sch?.yield) return sch.yield();
  return new Promise((r) => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
}

/** Bake jobs by cache key (started or finished), so concurrent prepareArt calls and on-demand bakes share work. */
const started = new Map<string, Promise<void>>();
function once(key: string, job: () => Promise<void>): Promise<void> {
  let p = started.get(key);
  if (!p) { p = job(); started.set(key, p); }
  return p;
}
type Job = () => Promise<void>;
function unitJob(id: string, faction: FactionId, team: string): Job | null {
  const key = `${id}|${faction}|${team}`;
  return units.has(key) || !UNIT_ART[id] ? null : () => once(`u|${key}`, async () => { units.set(key, await bakeUnit(id, team, faction)); });
}
function buildingJobs(def: string, faction: FactionId, team: string): Job[] {
  const sprite = BUILDINGS[def].sprite, out: Job[] = [];
  const fs = artId(BUILDING_ART, sprite, faction), ft = artId(BUILDING_TURRET, sprite, faction);
  const bk = `${fs}|${faction}|${team}`, tk = `${ft}|${faction}|${team}`;
  if (fs && !buildings.has(bk)) out.push(() => once(`b|${bk}`, async () => { buildings.set(bk, await bakeBuilding(fs, def, team, faction)); }));
  if (ft && !turrets.has(tk)) out.push(() => once(`t|${tk}`, async () => {
    const r = await bakeRotating(BUILDING_TURRET[ft], team, faction, 'body');
    turrets.set(tk, { body: r.atlas, pivot: [0, 0], yaw: 0 });
  }));
  return out;
}

/**
 * Bake what a game with these players needs: each player's own roster (units/buildings available to their
 * faction) in their team colour. Anything else that shows up later (captured buildings, mind-controlled units
 * — drawn in the new owner's faction + colour) is baked on demand by the lookups below, with the procedural
 * placeholder drawn meanwhile. `all` bakes every art entry for every player (the ?art debug page).
 * Safe to call repeatedly and concurrently (cached, in-flight work is shared).
 */
let prepareStarted = false;
export async function prepareArt(players: { faction: FactionId; color: string }[], onProgress?: (f: number, done: number, total: number) => void, opts: { all?: boolean; abort?: () => boolean } = {}): Promise<void> {
  prepareStarted = true;
  try {
    if (!renderer) setup();
    const jobs: Job[] = [];
    for (const name of TERRAIN_TEX) if (name && !textures.has(name)) jobs.push(() => once(`tex|${name}`, async () => { textures.set(name, await loadImage(`${BASE}textures/${name}.jpg`)); }));
    if (!textures.has('fx')) jobs.push(() => once('env', () => Promise.all([prepareWater(), prepareBridge(), prepareOre()]).then(() => {})));
    if (!textures.has('fx')) jobs.push(() => once('fx', async () => { textures.set('fx', await loadImage(`${BASE}fx/fx.png`)); }));
    for (const id of Object.keys(PROP_ART)) if (!props.has(id)) jobs.push(() => once(`p|${id}`, () => bakeProp(id)));
    for (const p of players) {
      const ids = opts.all ? Object.keys(UNIT_ART) : [...new Set(Object.values(UNITS).filter((d) => d.factions.includes(p.faction)).map((d) => d.sprite))];
      for (const id of ids) { const j = unitJob(id, p.faction, p.color); if (j) jobs.push(j); }
      for (const def of Object.keys(BUILDINGS)) {
        const f = BUILDINGS[def].factions;
        if (opts.all || !f || f.includes(p.faction)) jobs.push(...buildingJobs(def, p.faction, p.color));
      }
    }
    let done = 0;
    for (const j of jobs) {
      if (opts.abort?.()) return; // e.g. the menu background, once a real game starts loading
      await j();
      onProgress?.(++done / jobs.length, done, jobs.length);
      await yieldToPage(); // keep the page responsive (and the progress bar moving)
    }
    artReady = true;
  } catch (e) {
    artError = (e as Error).message;
    console.warn('[art] baking failed, using procedural placeholders:', e);
  }
}

/** Approximate memory held by baked sprite canvases (RGBA bytes, MB) — for load/perf diagnostics. */
export function artMemory(): Record<string, number> {
  const mb = (c?: HTMLCanvasElement) => (c ? (c.width * c.height * 4) / 2 ** 20 : 0);
  const sum = (xs: Iterable<number>) => { let t = 0; for (const x of xs) t += x; return Math.round(t * 10) / 10; };
  return {
    units: sum([...units.values()].map((u) => mb(u.body.c) + mb(u.turret?.c))), unitSets: units.size,
    buildings: sum([...buildings.values()].map((b) => mb(b.c)).concat([...turrets.values()].map((t) => mb(t.body.c)))), buildingSets: buildings.size,
    props: sum([...props.values()].map((p) => mb(p.c))), tiles: sum([...tiles.values()].map(mb)),
  };
}

// On-demand bakes for combinations prepareArt skipped. One at a time, between frames.
const requested = new Set<string>();
const lazyJobs: Job[] = [];
let pumping = false;
function bakeLater(key: string, jobs: () => (Job | null)[]) {
  // Nothing prepared yet although sprites are being drawn (e.g. this module was hot-reloaded mid-game, which wipes
  // every bake cache): restart the shared bakes; lookups after that queue their own on-demand bakes again.
  if (!artReady && !prepareStarted && !artError) void prepareArt([]);
  if (!artReady || requested.has(key)) return;
  requested.add(key);
  for (const j of jobs()) if (j) lazyJobs.push(j);
  if (!pumping && lazyJobs.length) void (async () => {
    pumping = true;
    while (lazyJobs.length) {
      await yieldToPage();
      try { await lazyJobs.shift()!(); } catch (e) { console.warn('[art] on-demand bake failed:', e); }
    }
    pumping = false;
  })();
}
let spriteToDef: Map<string, string> | null = null;
const buildingDef = (sprite: string) => (spriteToDef ??= new Map(Object.entries(BUILDINGS).map(([d, b]) => [b.sprite, d]))).get(sprite);

// ------------------------------------------------------------------ lookups used by the renderer

export function unitSprites(sprite: string, faction: FactionId, team: string): UnitSprites | undefined {
  const key = `${sprite}|${faction}|${team}`;
  const u = units.get(key);
  if (!u) bakeLater(`u|${key}`, () => [unitJob(sprite, faction, team)]);
  return u;
}
/** Faction-specific art id (`building.cy.soviets`) if one exists, else the generic id (or undefined). */
export function artId<T>(m: Record<string, T>, sprite: string, faction: FactionId): string | undefined {
  const f = `${sprite}.${faction}`;
  return m[f] ? f : m[sprite] ? sprite : undefined;
}
/** Building + turret art for a building sprite; a missing combination is queued for baking. */
function requestBuilding(sprite: string, faction: FactionId, team: string) {
  bakeLater(`b|${sprite}|${faction}|${team}`, () => { const def = buildingDef(sprite); return def ? buildingJobs(def, faction, team) : []; });
}
export function bakedBuilding(sprite: string, faction: FactionId, team: string): BakedBuilding | undefined {
  const b = buildings.get(`${sprite}.${faction}|${faction}|${team}`) ?? buildings.get(`${sprite}|${faction}|${team}`);
  if (!b) requestBuilding(sprite, faction, team);
  return b;
}
export function buildingTurret(sprite: string, faction: FactionId, team: string): UnitSprites | undefined {
  const t = turrets.get(`${sprite}.${faction}|${faction}|${team}`) ?? turrets.get(`${sprite}|${faction}|${team}`);
  if (!t) requestBuilding(sprite, faction, team);
  return t;
}
export const bakedProp = (id: string) => props.get(id);
/** Particle atlas (Kenney smoke particles, CC0): frames 0–7 fire, 8–11 flash, 12–15 black smoke; 128 px each. */
export const fxImage = () => textures.get('fx');
export const FX = { fire: 0, flash: 8, smoke: 12, size: 128 };

/** Frame index for a tile-space angle. */
export const facingIndex = (a: Atlas, th: number) => ((Math.round((th / (Math.PI * 2)) * a.facings) % a.facings) + a.facings) % a.facings;

/** Draw one facing of an atlas; `row` selects an animation frame (see AnimRows), 0 = idle / static. */
export function drawAtlas(g: CanvasRenderingContext2D, a: Atlas, th: number, x: number, y: number, row = 0) {
  const i = facingIndex(a, th), F = a.frame, S = F * a.res;
  g.drawImage(a.c, i * S, row * S, S, S, x - a.ax, y - a.ay, F, F);
}

/** Terrain tile from a world-anchored texture (seamless across tiles). */
export function texturedTile(t: number, tx: number, ty: number): HTMLCanvasElement | null {
  const name = TERRAIN_TEX[t];
  const img = name && textures.get(name);
  if (!img) return null;
  const i = tx % TEX_TILES, j = ty % TEX_TILES;
  const key = `${t}|${i}|${j}`;
  let c = tiles.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = TW * RES; c.height = TH * RES;
  const g = c.getContext('2d')!;
  g.scale(RES, RES);
  g.beginPath(); g.moveTo(TW / 2, 0); g.lineTo(TW, TH / 2); g.lineTo(TW / 2, TH); g.lineTo(0, TH / 2); g.closePath(); g.clip();
  const px = img.width / TEX_TILES; // texture px per tile
  // texture (a,b) → tile-space (u,v) = (a/px − i, b/px − j) → iso ((u−v)·TW/2 + TW/2, (u+v)·TH/2)
  g.transform(TW / 2 / px, TH / 2 / px, -TW / 2 / px, TH / 2 / px, (j - i) * (TW / 2) + TW / 2, -(i + j) * (TH / 2));
  g.drawImage(img, 0, 0);
  g.setTransform(RES, 0, 0, RES, 0, 0);
  const grade = TERRAIN_GRADE[t];
  if (grade) { g.fillStyle = grade; g.fillRect(0, 0, TW, TH); }
  tiles.set(key, c);
  return c;
}

/** Draw priority for soft terrain transitions (higher bleeds over lower). */
export const TERRAIN_PRIORITY = [3, 2, 0, 4, 1, 3, 0];
const feathers = new Map<string, HTMLCanvasElement>();
const FEATHER = 1.6; // overlay size relative to a tile
/** Enlarged, soft-edged version of a textured tile used to blend into neighbouring terrain. */
export function featherTile(t: number, tx: number, ty: number): HTMLCanvasElement | null {
  const name = TERRAIN_TEX[t];
  const img = name && textures.get(name);
  if (!img) return null;
  const i = tx % TEX_TILES, j = ty % TEX_TILES;
  const key = `${t}|${i}|${j}`;
  let c = feathers.get(key);
  if (c) return c;
  const W = TW * FEATHER, H = TH * FEATHER, ox = (W - TW) / 2, oy = (H - TH) / 2;
  c = document.createElement('canvas');
  c.width = W * RES; c.height = H * RES;
  const g = c.getContext('2d')!;
  g.scale(RES, RES);
  const px = img.width / TEX_TILES;
  g.save();
  g.transform(TW / 2 / px, TH / 2 / px, -TW / 2 / px, TH / 2 / px, (j - i) * (TW / 2) + TW / 2 + ox, -(i + j) * (TH / 2) + oy);
  // draw the texture plus wrapped neighbours so the enlarged overlay has no gaps
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) g.drawImage(img, dx * img.width, dy * img.height);
  g.restore();
  const grade = TERRAIN_GRADE[t];
  if (grade) { g.fillStyle = grade; g.fillRect(0, 0, W, H); }
  // 2:1 elliptical fade-out mask
  g.globalCompositeOperation = 'destination-in';
  g.save();
  g.translate(W / 2, H / 2); g.scale(1, 0.5);
  const grad = g.createRadialGradient(0, 0, TW * 0.3, 0, 0, W / 2);
  grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(-W / 2, -H, W, H * 2);
  g.restore();
  feathers.set(key, c);
  return c;
}
export const FEATHER_SIZE = FEATHER;

/** Cameo for the sidebar, from baked art (null if not baked). */
export function bakedIcon(def: string, sprite: string, faction: FactionId, team: string, W: number, H: number, g: CanvasRenderingContext2D): boolean {
  const b = bakedBuilding(sprite, faction, team);
  if (b) {
    const k = Math.min((W - 4) / b.w, (H - 4) / b.h);
    g.drawImage(b.c, (W - b.w * k) / 2, (H - b.h * k) / 2, b.w * k, b.h * k);
    return true;
  }
  const u = unitSprites(sprite, faction, team);
  if (!u) return false;
  const a = u.body, F = a.frame, i = facingIndex(a, Math.PI * 0.15);
  const k = Math.min(W / (F * 0.8), H / (F * 0.8));
  g.drawImage(a.c, i * F * a.res, 0, F * a.res, F * a.res, W / 2 - a.ax * k, H * 0.72 - a.ay * k, F * k, F * k);
  if (u.turret) {
    const t = u.turret, j = facingIndex(t, Math.PI * 0.15);
    const [ox, oy] = pivotOffset(u, Math.PI * 0.15);
    g.drawImage(t.c, j * t.frame * t.res, 0, t.frame * t.res, t.frame * t.res, W / 2 + ox * k - t.ax * k, H * 0.72 + oy * k - t.ay * k, t.frame * k, t.frame * k);
  }
  return true;
}

/** Screen offset of the turret pivot for a given body facing (hull rotation as used in baking). */
export function pivotOffset(u: UnitSprites, facing: number): [number, number] {
  const [px, pz] = u.pivot;
  const phi = Math.PI / 2 - facing + (u.yaw * Math.PI) / 180;
  const x = px * Math.cos(phi) + pz * Math.sin(phi), y = -px * Math.sin(phi) + pz * Math.cos(phi);
  return [((x - y) * TW) / 2, ((x + y) * TH) / 2];
}
