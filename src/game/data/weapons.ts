import type { ArmorType } from '../types';

export interface WeaponDef {
  damage: number;
  range: number; // tiles
  cooldown: number; // ticks
  speed: number; // tiles/tick, 0 = instant hit
  visual: 'tracer' | 'shell' | 'beam' | 'double' | 'rocket';
  color: string;
  versus: Record<ArmorType, number>;
  sound: string;
  splash?: number; // area radius (tiles): enemies inside take damage with falloff
  ramp?: number; // gatling: cooldown shrinks 1 tick per consecutive shot down to this
  aa?: boolean; // can hit aircraft
  versusAir?: Partial<Record<ArmorType, number>>; // overrides `versus` against flying targets (BL2: AA vs heavy aircraft)
  control?: boolean; // mind control instead of damage
  superweapon?: boolean; // fired by a superweapon (telemetry: cause of death)
  airOnly?: boolean; // anti-air only: ignores ground targets
  phase?: boolean; // erases instead of damaging: target frozen + invulnerable until erased (systems/combat.ts)
  fuse?: number; // plants a time bomb (ticks) that detonates as `blast`
  blast?: string; // weapon used for the bomb's explosion
  cloud?: boolean; // kills leave a poison cloud
  controlBuildings?: boolean; // mind control also takes buildings (permanently)
  buildingsOnly?: boolean; // ...and nothing else
  strike?: string; // laser designator: calls in three of these from the sky
  leech?: boolean; // crawls into vehicles (eats them from the inside), kills infantry outright
  maxControl?: number; // mind control of several units; more than this overloads the controller
  berserk?: number; // ticks of madness for everything caught in the splash
  drain?: boolean; // steals credits from refineries / knocks out power plants it hits
  sub?: boolean; // reaches submerged submarines (torpedoes, depth charges, sonar)
  navalOnly?: boolean; // only targets on water (ships, subs, naval yards)
  grab?: boolean; // holds the target in place between hits (Kraken)
  fallout?: [string, number]; // leaves this hazard weapon for N seconds where it lands
  interceptable?: boolean; // slow missile: enemy anti-air in range can shoot it down
  stun?: number; // ticks a grabbing unit (Kraken) is shaken off for when hit
}

export const WEAPONS: Record<string, WeaponDef> = {
  rifle: { damage: 11, range: 4.2, cooldown: 22, speed: 0, visual: 'tracer', color: '#ffe38a', versus: { none: 1, light: 0.6, heavy: 0.2, building: 0.25 }, sound: 'gun' },
  cannon: { damage: 62, range: 5.5, cooldown: 45, speed: 0.55, visual: 'shell', color: '#ffd27a', versus: { none: 0.35, light: 0.9, heavy: 1, building: 0.8 }, sound: 'cannon' },
  heavyCannon: { damage: 47, range: 5.5, cooldown: 55, speed: 0.5, visual: 'double', color: '#ffb35a', versus: { none: 0.35, light: 0.9, heavy: 1, building: 0.85 }, sound: 'cannon' },
  psiLash: { damage: 46, range: 5.2, cooldown: 32, speed: 0, visual: 'beam', color: '#d27bff', versus: { none: 0.9, light: 1, heavy: 0.95, building: 0.75 }, sound: 'zap' },
  towerGun: { damage: 24, range: 6.5, cooldown: 16, speed: 0, visual: 'tracer', color: '#fff0a0', versus: { none: 1, light: 0.8, heavy: 0.55, building: 0.3 }, aa: true, sound: 'gun' },
  rocket: { damage: 45, range: 6, cooldown: 55, speed: 0.38, visual: 'rocket', color: '#ffb060', versus: { none: 0.3, light: 0.9, heavy: 1.2, building: 0.6 }, aa: true, sound: 'rocket' },
  mg: { damage: 9, range: 5, cooldown: 8, speed: 0, visual: 'tracer', color: '#fff2a0', versus: { none: 1.2, light: 0.6, heavy: 0.15, building: 0.15 }, aa: true, sound: 'gun' },
  heavyCannon2: { damage: 85, range: 6, cooldown: 60, speed: 0.5, visual: 'double', color: '#ffc070', versus: { none: 0.4, light: 0.9, heavy: 1, building: 1 }, sound: 'cannon' },
  bite: { damage: 150, range: 1.1, cooldown: 25, speed: 0, visual: 'tracer', color: '#ffffff', versus: { none: 1, light: 0.5, heavy: 0, building: 0 }, sound: 'gun' },
  ifvRocket: { damage: 32, range: 6, cooldown: 38, speed: 0.45, visual: 'rocket', color: '#ffc080', versus: { none: 0.45, light: 1, heavy: 0.95, building: 0.4 }, aa: true, sound: 'rocket' },
  refractor: { damage: 95, range: 8, cooldown: 90, speed: 0, visual: 'beam', color: '#9fe8ff', versus: { none: 1, light: 1, heavy: 0.8, building: 1 }, sound: 'zap', splash: 1.3 },
  arcBolt: { damage: 60, range: 4, cooldown: 40, speed: 0, visual: 'beam', color: '#7fc8ff', versus: { none: 1, light: 1, heavy: 0.9, building: 0.6 }, sound: 'zap' },
  longbow: { damage: 170, range: 10, cooldown: 150, speed: 0.2, visual: 'rocket', color: '#ff9a50', versus: { none: 0.4, light: 1, heavy: 0.7, building: 1.4 }, sound: 'rocket', splash: 1.3 },
  psiBolt: { damage: 16, range: 4.2, cooldown: 24, speed: 0, visual: 'beam', color: '#d27bff', versus: { none: 1, light: 0.6, heavy: 0.25, building: 0.3 }, sound: 'zap' },
  smash: { damage: 85, range: 1.3, cooldown: 35, speed: 0, visual: 'tracer', color: '#ffe0c0', versus: { none: 1, light: 1, heavy: 0.8, building: 0.5 }, sound: 'cannon' },
  gatling: { damage: 9, range: 5.5, cooldown: 14, speed: 0, visual: 'tracer', color: '#ffe890', versus: { none: 1.2, light: 0.8, heavy: 0.3, building: 0.3 }, aa: true, versusAir: { heavy: 0.8 }, sound: 'gun', ramp: 5 },
  magBeam: { damage: 70, range: 8, cooldown: 34, speed: 0, visual: 'beam', color: '#8a7bff', versus: { none: 0.2, light: 1, heavy: 1.3, building: 1.2 }, sound: 'zap' },
  pillboxMg: { damage: 18, range: 5.5, cooldown: 12, speed: 0, visual: 'tracer', color: '#fff0a0', versus: { none: 1.2, light: 0.6, heavy: 0.25, building: 0.2 }, aa: true, sound: 'gun' },
  refractorTower: { damage: 120, range: 8, cooldown: 80, speed: 0, visual: 'beam', color: '#9fe8ff', versus: { none: 1, light: 1, heavy: 1, building: 0.6 }, sound: 'zap', splash: 1 },
  coilBolt: { damage: 150, range: 7, cooldown: 70, speed: 0, visual: 'beam', color: '#7fc8ff', versus: { none: 1, light: 1, heavy: 1, building: 0.5 }, sound: 'zap' },
  gatlingTower: { damage: 12, range: 6.5, cooldown: 14, speed: 0, visual: 'tracer', color: '#ffe890', versus: { none: 1.2, light: 0.9, heavy: 0.4, building: 0.3 }, aa: true, versusAir: { heavy: 0.8 }, sound: 'gun', ramp: 4 },
  psiSpire: { damage: 70, range: 7, cooldown: 45, speed: 0, visual: 'beam', color: '#d27bff', versus: { none: 0.6, light: 1, heavy: 1.1, building: 0.5 }, sound: 'zap' },
  mindControl: { damage: 0, range: 5, cooldown: 75, speed: 0, visual: 'beam', color: '#f0a0ff', versus: { none: 1, light: 1, heavy: 1, building: 0 }, sound: 'zap', control: true },
  airMissile: { damage: 60, range: 5, cooldown: 45, speed: 0.6, visual: 'rocket', color: '#ffc080', versus: { none: 0.5, light: 1, heavy: 1, building: 0.7 }, sound: 'rocket', aa: true },
  bomb: { damage: 160, range: 0.9, cooldown: 50, speed: 0.12, visual: 'shell', color: '#ffb060', versus: { none: 0.8, light: 1, heavy: 0.9, building: 1.5 }, sound: 'cannon', splash: 1.5 },
  discLaser: { damage: 40, range: 4.5, cooldown: 30, speed: 0, visual: 'beam', color: '#7affd8', versus: { none: 1, light: 1, heavy: 0.8, building: 0.8 }, sound: 'zap', aa: true, drain: true },
  // --- Phase 8 ---
  jumperGun: { damage: 16, range: 4.5, cooldown: 18, speed: 0, visual: 'tracer', color: '#fff0a0', versus: { none: 1, light: 0.5, heavy: 0.2, building: 0.25 }, aa: true, sound: 'gun' },
  phaseBeam: { damage: 22, range: 6, cooldown: 6, speed: 0, visual: 'beam', color: '#7ff5ff', versus: { none: 1, light: 1, heavy: 1, building: 1 }, phase: true, sound: 'zap' },
  novaPistols: { damage: 160, range: 5.5, cooldown: 22, speed: 0, visual: 'tracer', color: '#fff6c0', versus: { none: 1, light: 0, heavy: 0, building: 0 }, sound: 'gun' },
  c4: { damage: 0, range: 1.1, cooldown: 150, speed: 0, visual: 'tracer', color: '#ff7040', versus: { none: 0, light: 0, heavy: 0, building: 1 }, fuse: 90, blast: 'c4Blast', sound: 'cannon' },
  c4Blast: { damage: 1250, range: 0, cooldown: 0, speed: 0, visual: 'shell', color: '#ff7040', versus: { none: 0, light: 0, heavy: 0, building: 1 }, splash: 0.5, sound: 'cannon' },
  flakRifle: { damage: 26, range: 5.5, cooldown: 30, speed: 0, visual: 'tracer', color: '#ffd890', versus: { none: 0.8, light: 0.5, heavy: 0.15, building: 0.1 }, aa: true, versusAir: { heavy: 0.6 }, splash: 0.6, sound: 'gun' },
  timeBomb: { damage: 0, range: 1.2, cooldown: 90, speed: 0, visual: 'tracer', color: '#ff9040', versus: { none: 1, light: 1, heavy: 1, building: 1 }, fuse: 150, blast: 'sapperBlast', sound: 'gun' },
  sapperBlast: { damage: 450, range: 0, cooldown: 0, speed: 0, visual: 'shell', color: '#ffb060', versus: { none: 1, light: 1, heavy: 1, building: 1.2 }, splash: 1.8, sound: 'cannon' },
  radRifle: { damage: 75, range: 4.5, cooldown: 50, speed: 0, visual: 'beam', color: '#b8ff40', versus: { none: 1, light: 0.3, heavy: 0.1, building: 0.05 }, sound: 'zap' },
  radField: { damage: 4, range: 2.6, cooldown: 0, speed: 0, visual: 'beam', color: '#b8ff40', versus: { none: 1, light: 0, heavy: 0, building: 0 }, sound: 'zap' }, // per tick, infantry only
  gromRifle: { damage: 65, range: 5.5, cooldown: 16, speed: 0, visual: 'tracer', color: '#fff0a0', versus: { none: 1, light: 0.5, heavy: 0.15, building: 0 }, sound: 'gun' },
  designator: { damage: 0, range: 6, cooldown: 420, speed: 0, visual: 'beam', color: '#ff3020', versus: { none: 0, light: 0, heavy: 0, building: 1 }, strike: 'airstrike', sound: 'zap' },
  airstrike: { damage: 200, range: 0, cooldown: 0, speed: 0.55, visual: 'rocket', color: '#ffb060', versus: { none: 0.6, light: 0.8, heavy: 0.8, building: 1 }, splash: 1.2, sound: 'rocket' },
  toxinRifle: { damage: 125, range: 9, cooldown: 75, speed: 0, visual: 'tracer', color: '#9dff6a', versus: { none: 1, light: 0.15, heavy: 0.05, building: 0 }, cloud: true, sound: 'gun' },
  poisonCloud: { damage: 2.5, range: 1.6, cooldown: 0, speed: 0, visual: 'beam', color: '#9dff6a', versus: { none: 1, light: 0, heavy: 0, building: 0 }, sound: 'zap' }, // per tick, infantry only
  oracleControl: { damage: 0, range: 7, cooldown: 40, speed: 0, visual: 'beam', color: '#f0a0ff', versus: { none: 1, light: 1, heavy: 1, building: 0 }, control: true, sound: 'zap' },
  oracleTakeover: { damage: 0, range: 4.5, cooldown: 40, speed: 0, visual: 'beam', color: '#f0a0ff', versus: { none: 0, light: 0, heavy: 0, building: 1 }, control: true, controlBuildings: true, buildingsOnly: true, sound: 'zap' }, // inside every defence's reach
  psiWave: { damage: 200, range: 0, cooldown: 0, speed: 0, visual: 'beam', color: '#e07bff', versus: { none: 1, light: 0.25, heavy: 0.1, building: 0 }, splash: 3, sound: 'zap' },
  psiStorm: { damage: 260, range: 0, cooldown: 0, speed: 0, visual: 'beam', color: '#e07bff', versus: { none: 1, light: 0.35, heavy: 0.15, building: 0 }, splash: 3.5, sound: 'zap' },
  // --- Phase 9 ---
  ifvMg: { damage: 14, range: 5.5, cooldown: 10, speed: 0, visual: 'tracer', color: '#fff2a0', versus: { none: 1.2, light: 0.6, heavy: 0.2, building: 0.2 }, aa: true, sound: 'gun' },
  ifvSniper: { damage: 150, range: 7, cooldown: 30, speed: 0, visual: 'tracer', color: '#fff6c0', versus: { none: 1, light: 0.1, heavy: 0, building: 0 }, sound: 'gun' },
  shroudCannon: { damage: 75, range: 6, cooldown: 50, speed: 0.6, visual: 'shell', color: '#ffd27a', versus: { none: 0.4, light: 1, heavy: 1, building: 0.7 }, sound: 'cannon' },
  talonBomb: { damage: 500, range: 1, cooldown: 30, speed: 0.15, visual: 'shell', color: '#ffb060', versus: { none: 0.7, light: 1, heavy: 1, building: 1.2 }, splash: 1.2, sound: 'cannon' },
  leechBite: { damage: 200, range: 1.1, cooldown: 30, speed: 0, visual: 'tracer', color: '#ff5040', versus: { none: 1, light: 1, heavy: 1, building: 0 }, leech: true, sound: 'gun' },
  leechChew: { damage: 1.2, range: 0, cooldown: 0, speed: 0, visual: 'tracer', color: '#ff5040', versus: { none: 1, light: 1, heavy: 1, building: 0 }, sound: 'gun' }, // per tick inside a vehicle
  rotorGun: { damage: 14, range: 5, cooldown: 10, speed: 0, visual: 'tracer', color: '#fff2a0', versus: { none: 1.1, light: 0.7, heavy: 0.25, building: 0.25 }, sound: 'gun' },
  siegeShell: { damage: 140, range: 10, cooldown: 100, speed: 0.25, visual: 'shell', color: '#ffb060', versus: { none: 0.8, light: 1, heavy: 0.8, building: 1.2 }, splash: 1.4, sound: 'cannon' },
  hiveControl: { damage: 0, range: 6, cooldown: 40, speed: 0, visual: 'beam', color: '#f0a0ff', versus: { none: 1, light: 1, heavy: 1, building: 0 }, control: true, maxControl: 3, sound: 'zap' },
  deliriumGas: { damage: 10, range: 3, cooldown: 90, speed: 0, visual: 'beam', color: '#d8e060', versus: { none: 1, light: 0.5, heavy: 0.3, building: 0 }, splash: 2, berserk: 300, sound: 'zap' },
  // --- Phase 7 ---
  flakGun: { damage: 22, range: 6, cooldown: 20, speed: 0, visual: 'tracer', color: '#ffd890', versus: { none: 0.9, light: 0.7, heavy: 0.2, building: 0.15 }, aa: true, versusAir: { heavy: 1 }, sound: 'gun' },
  samMissile: { damage: 70, range: 9, cooldown: 40, speed: 0.6, visual: 'rocket', color: '#ffe0a0', versus: { none: 1, light: 1, heavy: 1, building: 0 }, aa: true, airOnly: true, sound: 'rocket' },
  flakCannon: { damage: 40, range: 8, cooldown: 25, speed: 0, visual: 'tracer', color: '#ffc870', versus: { none: 1, light: 1, heavy: 1, building: 0 }, aa: true, airOnly: true, splash: 1.0, sound: 'cannon' },
  // --- Phase 12: superweapons ---
  lightning: { superweapon: true, damage: 220, range: 4, cooldown: 8, speed: 0, visual: 'beam', color: '#cfe8ff', versus: { none: 1, light: 1, heavy: 0.8, building: 1 }, splash: 1.3, sound: 'zap' }, // storm hazard: a strike every `cooldown` ticks within `range`
  hammerBlast: { superweapon: true, damage: 1500, range: 0, cooldown: 0, speed: 0.2, fallout: ['fallout', 25], visual: 'rocket', color: '#ffb060', versus: { none: 1, light: 1, heavy: 1, building: 1.3 }, splash: 4, sound: 'cannon' },
  fallout: { superweapon: true, damage: 1.5, range: 3.5, cooldown: 0, speed: 0, visual: 'beam', color: '#b8ff40', versus: { none: 1, light: 0.5, heavy: 0.25, building: 0 }, sound: 'zap' }, // per tick
  // --- Phase 11: navy ---
  navalGun: { damage: 70, range: 7, cooldown: 50, speed: 0.6, visual: 'shell', color: '#ffd27a', versus: { none: 0.4, light: 1, heavy: 1, building: 0.9 }, sound: 'cannon' },
  depthCharge: { damage: 120, range: 4, cooldown: 50, speed: 0.3, visual: 'shell', color: '#a0d8ff', versus: { none: 0, light: 1, heavy: 1, building: 0.5 }, sub: true, navalOnly: true, sound: 'cannon' },
  aegisMissile: { damage: 55, range: 10, cooldown: 30, speed: 0.7, visual: 'rocket', color: '#ffe0a0', versus: { none: 1, light: 1.2, heavy: 1, building: 0 }, aa: true, airOnly: true, splash: 0.8, sound: 'rocket' },
  carrierDrones: { damage: 45, range: 10, cooldown: 45, speed: 0.22, visual: 'double', color: '#c8f0ff', versus: { none: 0.7, light: 1, heavy: 0.9, building: 0.8 }, sound: 'rocket' },
  sonicPulse: { damage: 30, range: 4, cooldown: 40, speed: 0, visual: 'beam', color: '#9ff0ff', versus: { none: 0.3, light: 1, heavy: 1, building: 0.3 }, sub: true, navalOnly: true, stun: 60, sound: 'zap' },
  flakBoatGun: { damage: 20, range: 6, cooldown: 14, speed: 0, visual: 'tracer', color: '#ffd890', versus: { none: 1, light: 0.8, heavy: 0.3, building: 0.2 }, aa: true, sound: 'gun' },
  torpedo: { damage: 120, range: 6, cooldown: 70, speed: 0.25, visual: 'rocket', color: '#bfe8ff', versus: { none: 0, light: 1, heavy: 1, building: 1 }, sub: true, navalOnly: true, sound: 'rocket' },
  leviathanMissile: { damage: 220, range: 13, cooldown: 140, speed: 0.3, interceptable: true, visual: 'rocket', color: '#ff9a50', versus: { none: 0.5, light: 1, heavy: 0.8, building: 1.4 }, splash: 1.4, sound: 'rocket' },
  krakenGrab: { damage: 45, range: 1.4, cooldown: 25, speed: 0, visual: 'tracer', color: '#60ffb0', versus: { none: 0, light: 1, heavy: 1, building: 0 }, sub: true, navalOnly: true, grab: true, sound: 'cannon' },
  psiSubMissile: { damage: 110, range: 9, cooldown: 80, speed: 0.35, visual: 'rocket', color: '#e07bff', versus: { none: 0.5, light: 1, heavy: 1, building: 1.2 }, splash: 0.8, sound: 'rocket' },
};
