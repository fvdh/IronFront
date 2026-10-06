import type { ArmorType, FactionId } from '../types';

export interface UnitDef {
  id: string;
  name: string;
  category: 'infantry' | 'vehicle';
  cost: number;
  time: number; // seconds
  hp: number;
  armor: ArmorType;
  speed: number; // tiles per tick
  turn: number; // radians per tick
  sight: number;
  weapon?: string;
  radius: number; // collision radius in tiles
  harvester?: { capacity: number };
  regen?: number; // hp per tick self-repair
  air?: boolean; // flies: ignores terrain, only weapons with `aa` can hit it
  engineer?: boolean; // captures enemy buildings / repairs own ones
  ability?: string; // active ability (data/abilities.ts), triggered with E or the panel button
  transport?: number; // passenger slots (infantry only)
  deploysTo?: string; // building this unit unpacks into (Base Crawler → Construction Yard)
  ammo?: number; // shots before it must rearm on an own pad building (`pads` in data/buildings.ts)
  limit?: number; // max alive + queued per player (heroes: 1)
  from?: string; // spawns at this building instead of the category's producer
  weapon2?: string; // secondary weapon, used on targets the primary can't hit (C4, laser designator)
  teleport?: boolean; // moves by teleporting (frozen for a moment after each jump)
  infiltrate?: boolean; // enters enemy buildings for an effect (systems/orders.ts infiltrate)
  disguise?: boolean; // enemies see it as one of their own infantry and don't auto-target it
  detects?: number; // sees through disguises within this radius
  hero?: boolean; // unique commando: gold ring, `limit: 1`
  move?: 'amphibious' | 'water'; // movement layer (default: ground)
  deployWeapon?: string; // weapon while deployed (Siege Rotor on the ground)
  gunner?: boolean; // transport whose weapon comes from its passenger (`gunnerWeapon`)
  gunnerWeapon?: string; // weapon this infantry lends to a gunner transport
  mimic?: boolean; // looks like a tree to enemies while it stands still and holds fire
  escort?: [string, number]; // spawns with these (Thrall Hauler: its thralls)
  hidden?: boolean; // never in the build menu
  stealth?: boolean; // submerged: invisible to enemies unless a detector (`detects`) is near or it just fired
  drone?: boolean; // unmanned machine: immune to mind control
  requires: string[]; // building defs
  factions: FactionId[];
  sprite: string; // asset id
  description: string;
}

const ALL: FactionId[] = ['allies', 'soviets', 'psi'];

export const UNITS: Record<string, UnitDef> = {
  miner: {
    id: 'miner', name: 'Ore Hauler', category: 'vehicle', cost: 1400, time: 12, hp: 1000, armor: 'heavy', speed: 0.045, turn: 0.12, sight: 4,
    radius: 0.42, harvester: { capacity: 700 }, requires: ['factory'], factions: ['allies', 'soviets'], sprite: 'unit.miner',
    description: 'Gathers ore automatically and hauls it to the refinery.',
  },
  tank_allies: {
    id: 'tank_allies', name: 'Warden Tank', category: 'vehicle', cost: 700, time: 10, hp: 300, armor: 'heavy', speed: 0.075, turn: 0.15, sight: 7,
    weapon: 'cannon', radius: 0.38, requires: ['factory'], factions: ['allies'], sprite: 'unit.tank.allies',
    description: 'Fast, versatile battle tank.',
  },
  tank_soviets: {
    id: 'tank_soviets', name: 'Anvil Heavy Tank', category: 'vehicle', cost: 850, time: 12, hp: 420, armor: 'heavy', speed: 0.06, turn: 0.1, sight: 7,
    weapon: 'heavyCannon', radius: 0.42, requires: ['factory'], factions: ['soviets'], sprite: 'unit.tank.soviets',
    description: 'Heavily armored twin-barrel tank. Slow.',
  },
  tank_psi: {
    id: 'tank_psi', name: 'Lash Tank', category: 'vehicle', cost: 750, time: 11, hp: 360, armor: 'heavy', speed: 0.07, turn: 0.14, sight: 7,
    weapon: 'psiLash', radius: 0.38, requires: ['factory'], factions: ['psi'], sprite: 'unit.tank.psi',
    description: 'Psionic beam. Strong against infantry.',
  },
  rifle: {
    id: 'rifle', name: 'Rifleman', category: 'infantry', cost: 200, time: 5, hp: 125, armor: 'none', speed: 0.042, turn: 0.4, sight: 6,
    weapon: 'rifle', radius: 0.18, ability: 'digin', gunnerWeapon: 'ifvMg', requires: ['barracks'], factions: ['allies', 'soviets'], sprite: 'unit.infantry',
    description: 'Cheap basic infantry. Can dig in (E): stays put, gains range and takes less damage.',
  },
  rocket: {
    id: 'rocket', name: 'Rocket Trooper', category: 'infantry', cost: 300, time: 7, hp: 110, armor: 'none', speed: 0.038, turn: 0.4, sight: 6,
    weapon: 'rocket', radius: 0.18, requires: ['barracks'], factions: ['allies'], sprite: 'unit.rocketeer',
    description: 'Anti-tank infantry with a rocket launcher. Weak against infantry.',
  },
  jeep: {
    id: 'jeep', name: 'Scout Jeep', category: 'vehicle', cost: 500, time: 7, hp: 180, armor: 'light', speed: 0.1, turn: 0.2, sight: 8,
    weapon: 'mg', radius: 0.32, requires: ['factory'], factions: ['soviets'], sprite: 'unit.jeep',
    description: 'Fast scout with a machine gun. Strong against infantry.',
  },
  heavy: {
    id: 'heavy', name: 'Colossus Tank', category: 'vehicle', cost: 1750, time: 22, hp: 1000, armor: 'heavy', speed: 0.042, turn: 0.07, sight: 7,
    weapon: 'heavyCannon2', radius: 0.48, regen: 0.12, requires: ['factory', 'lab'], factions: ['soviets'], sprite: 'unit.tank.heavy',
    description: 'Super-heavy twin-cannon tank. Slowly repairs itself. Requires Tech Center.',
  },
  // --- Allies ---
  dog: {
    id: 'dog', name: 'Attack Dog', category: 'infantry', cost: 200, time: 4, hp: 100, armor: 'none', speed: 0.08, turn: 0.5, sight: 7,
    weapon: 'bite', radius: 0.18, detects: 4, requires: ['barracks'], factions: ['allies', 'soviets'], sprite: 'unit.dog',
    description: 'Fast. Kills infantry in one bite, useless against vehicles and buildings. Exposes disguised spies.',
  },
  ifv: {
    id: 'ifv', name: 'Lancer IFV', category: 'vehicle', cost: 600, time: 8, hp: 220, armor: 'light', speed: 0.095, turn: 0.18, sight: 8,
    weapon: 'ifvRocket', radius: 0.34, transport: 1, gunner: true, ability: 'unload', requires: ['factory'], factions: ['allies'], sprite: 'unit.ifv',
    description: 'Fast rocket-armed fighting vehicle. Carries 1 infantry that sets its weapon: Rifleman = machine gun, Phase Trooper = phase beam, Nova = sniper.',
  },
  prism: {
    id: 'prism', name: 'Refractor Tank', category: 'vehicle', cost: 1200, time: 16, hp: 160, armor: 'light', speed: 0.06, turn: 0.12, sight: 8,
    weapon: 'refractor', radius: 0.38, requires: ['factory', 'lab'], factions: ['allies'], sprite: 'unit.prism',
    description: 'Long-range light beam with splash damage. Fragile. Requires Tech Center.',
  },
  // --- Soviets ---
  arc: {
    id: 'arc', name: 'Arc Trooper', category: 'infantry', cost: 500, time: 9, hp: 200, armor: 'light', speed: 0.035, turn: 0.4, sight: 6,
    weapon: 'arcBolt', radius: 0.2, requires: ['barracks', 'radar'], factions: ['soviets'], sprite: 'unit.arc',
    description: 'Armored infantry with a short-range electric discharge. Strong against everything. Requires Radar.',
  },
  artillery: {
    id: 'artillery', name: 'Longbow Launcher', category: 'vehicle', cost: 900, time: 14, hp: 160, armor: 'light', speed: 0.045, turn: 0.1, sight: 7,
    weapon: 'longbow', radius: 0.42, requires: ['factory', 'radar'], factions: ['soviets'], sprite: 'unit.artillery',
    description: 'Rocket artillery with huge range and splash damage. Strong against buildings, defenseless up close. Requires Radar.',
  },
  // --- Psi ---
  initiate: {
    id: 'initiate', name: 'Adept', category: 'infantry', cost: 200, time: 5, hp: 110, armor: 'none', speed: 0.042, turn: 0.4, sight: 6,
    weapon: 'psiBolt', radius: 0.18, requires: ['barracks'], factions: ['psi'], sprite: 'unit.initiate',
    description: 'Basic infantry with a psionic discharge.',
  },
  brute: {
    id: 'brute', name: 'Mauler', category: 'infantry', cost: 500, time: 8, hp: 340, armor: 'light', speed: 0.045, turn: 0.4, sight: 6,
    weapon: 'smash', radius: 0.26, requires: ['barracks'], factions: ['psi'], sprite: 'unit.brute',
    description: 'Mutated powerhouse. Smashes infantry and vehicles alike, but only up close.',
  },
  gatling: {
    id: 'gatling', name: 'Spinner Tank', category: 'vehicle', cost: 650, time: 9, hp: 240, armor: 'light', speed: 0.08, turn: 0.16, sight: 8,
    weapon: 'gatling', radius: 0.36, requires: ['factory'], factions: ['psi'], sprite: 'unit.gatling',
    description: 'Gatling cannon that fires faster the longer it keeps shooting. Strong against infantry.',
  },
  magnetar: {
    id: 'magnetar', name: 'Magnetar', category: 'vehicle', cost: 1300, time: 16, hp: 400, armor: 'light', speed: 0.05, turn: 0.1, sight: 8,
    weapon: 'magBeam', radius: 0.4, requires: ['factory', 'lab'], factions: ['psi'], sprite: 'unit.magnetar',
    description: 'Long-range magnetic beam, devastating against vehicles and buildings. Requires Tech Center.',
  },
  // --- Phase 4: engineers, mind control, aircraft ---
  engineer: {
    id: 'engineer', name: 'Engineer', category: 'infantry', cost: 500, time: 8, hp: 75, armor: 'none', speed: 0.04, turn: 0.4, sight: 5,
    radius: 0.18, engineer: true, requires: ['barracks'], factions: ALL, sprite: 'unit.engineer',
    description: 'Captures enemy buildings or fully repairs your own (right-click the building). Consumed on use.',
  },
  mentalist: {
    id: 'mentalist', name: 'Mentalist', category: 'infantry', cost: 800, time: 10, hp: 150, armor: 'none', speed: 0.04, turn: 0.4, sight: 6,
    weapon: 'mindControl', radius: 0.18, ability: 'psiwave', requires: ['barracks', 'radar'], factions: ['psi'], sprite: 'unit.mentalist',
    description: 'Mind-controls one enemy unit after a short beam (longer for expensive units; machines are immune). If the Mentalist dies, the unit is released. Requires Radar.',
  },
  jet: {
    id: 'jet', name: 'Kestrel VTOL', category: 'vehicle', cost: 1200, time: 14, hp: 220, armor: 'light', speed: 0.14, turn: 0.15, sight: 8,
    weapon: 'airMissile', radius: 0.4, air: true, ammo: 3, requires: ['factory', 'airfield'], from: 'airfield', factions: ['allies'], sprite: 'unit.jet',
    description: 'Fast attack aircraft with 3 missile salvos, hits ground and air targets. Rearms at the Airfield (4 per Airfield).',
  },
  airship: {
    id: 'airship', name: 'Thunderhead Airship', category: 'vehicle', cost: 2000, time: 24, hp: 1600, armor: 'heavy', speed: 0.025, turn: 0.03, sight: 7,
    weapon: 'bomb', radius: 0.7, air: true, requires: ['factory', 'lab'], factions: ['soviets'], sprite: 'unit.airship',
    description: 'Slow, heavily armored airship that drops devastating bombs on whatever is below. Requires Tech Center.',
  },
  disc: {
    id: 'disc', name: 'Hover Disc', category: 'vehicle', cost: 1500, time: 18, hp: 450, armor: 'light', speed: 0.09, turn: 0.12, sight: 8,
    weapon: 'discLaser', radius: 0.5, air: true, requires: ['factory', 'lab'], factions: ['psi'], sprite: 'unit.disc',
    description: 'Hovering laser disc, hits ground and air targets. Drains power from plants and cash from refineries. Requires Tech Center.',
  },
  // --- Phase 7: base crawler, transport ---
  mcv: {
    id: 'mcv', name: 'Base Crawler', category: 'vehicle', cost: 3000, time: 30, hp: 1000, armor: 'heavy', speed: 0.04, turn: 0.08, sight: 6,
    radius: 0.5, deploysTo: 'cy', ability: 'deploy', requires: ['factory', 'depot'], factions: ALL, sprite: 'unit.mcv',
    description: 'Mobile construction yard. Deploy (E) into an extra Construction Yard, even far from your base.',
  },
  flakhauler: {
    id: 'flakhauler', name: 'Flak Hauler', category: 'vehicle', cost: 600, time: 9, hp: 260, armor: 'light', speed: 0.085, turn: 0.16, sight: 8,
    weapon: 'flakGun', radius: 0.36, transport: 5, ability: 'unload', requires: ['factory'], factions: ['soviets'], sprite: 'unit.flakhauler',
    description: 'Tracked anti-air. Carries 5 infantry: right-click it with infantry selected, E to unload.',
  },
  // --- Phase 8: infantry & heroes ---
  skyjumper: {
    id: 'skyjumper', name: 'Skyjumper', category: 'infantry', cost: 600, time: 9, hp: 125, armor: 'none', speed: 0.09, turn: 0.4, sight: 8,
    weapon: 'jumperGun', radius: 0.2, air: true, requires: ['barracks', 'radar'], factions: ['allies'], sprite: 'unit.skyjumper',
    description: 'Jetpack infantry: flies over everything. Only anti-air can hit it.',
  },
  infiltrator: {
    id: 'infiltrator', name: 'Infiltrator', category: 'infantry', cost: 1000, time: 10, hp: 100, armor: 'none', speed: 0.045, turn: 0.4, sight: 7,
    radius: 0.18, infiltrate: true, disguise: true, requires: ['barracks', 'radar'], factions: ['allies'], sprite: 'unit.infiltrator',
    description: 'Spy: the enemy sees him as their own infantry (dogs don\'t). Right-click an enemy building: refinery = steal cash, power plant = cut power, radar = wipe map, barracks/factory = veterans, other = intel.',
  },
  phasetrooper: {
    id: 'phasetrooper', name: 'Phase Trooper', category: 'infantry', cost: 1000, time: 16, hp: 200, armor: 'none', speed: 0.05, turn: 0.4, sight: 7,
    weapon: 'phaseBeam', radius: 0.2, teleport: true, gunnerWeapon: 'phaseBeam', requires: ['barracks', 'lab'], factions: ['allies'], sprite: 'unit.phasetrooper',
    description: 'Teleports instead of walking. Its beam slowly pulls a target out of time: frozen and invulnerable, it vanishes when the beam finishes it.',
  },
  nova: {
    id: 'nova', name: 'Nova', category: 'infantry', cost: 1500, time: 20, hp: 250, armor: 'none', speed: 0.065, turn: 0.5, sight: 9,
    weapon: 'novaPistols', weapon2: 'c4', gunnerWeapon: 'ifvSniper', radius: 0.2, move: 'amphibious', regen: 0.15, hero: true, limit: 1, requires: ['barracks', 'lab'], factions: ['allies'], sprite: 'unit.nova',
    description: 'Hero. Elite commando: her pistols kill infantry in one shot, her C4 destroys a building 3 seconds after she plants it (a Construction Yard or superweapon takes two). Can swim. Useless against vehicles. Heals when out of combat. Max 1.',
  },
  flakgunner: {
    id: 'flakgunner', name: 'Flak Gunner', category: 'infantry', cost: 300, time: 6, hp: 120, armor: 'none', speed: 0.04, turn: 0.4, sight: 7,
    weapon: 'flakRifle', radius: 0.18, requires: ['barracks'], factions: ['soviets'], sprite: 'unit.flakgunner',
    description: 'Anti-air infantry. Also hits infantry on the ground.',
  },
  sapper: {
    id: 'sapper', name: 'Sapper', category: 'infantry', cost: 600, time: 9, hp: 160, armor: 'none', speed: 0.05, turn: 0.4, sight: 6,
    weapon: 'timeBomb', radius: 0.18, requires: ['barracks', 'radar'], factions: ['soviets'], sprite: 'unit.sapper',
    description: 'Plants a time bomb on units or buildings. After 5 seconds: heavy explosion that also hits bystanders.',
  },
  blight: {
    id: 'blight', name: 'Blight Trooper', category: 'infantry', cost: 450, time: 9, hp: 180, armor: 'none', speed: 0.04, turn: 0.4, sight: 6,
    weapon: 'radRifle', radius: 0.2, ability: 'irradiate', requires: ['barracks', 'lab'], factions: ['soviets'], sprite: 'unit.blight',
    description: 'Radiation rifle against infantry. Deploy (E) for a radiation field that kills nearby enemy infantry.',
  },
  grom: {
    id: 'grom', name: 'Grom', category: 'infantry', cost: 1500, time: 20, hp: 300, armor: 'none', speed: 0.06, turn: 0.5, sight: 9,
    weapon: 'gromRifle', weapon2: 'designator', radius: 0.22, regen: 0.15, hero: true, limit: 1, requires: ['barracks', 'lab'], factions: ['soviets'], sprite: 'unit.grom',
    description: 'Hero. Heavy rifle against infantry; paints buildings with a laser to call in an air strike. Heals when out of combat. Max 1.',
  },
  toxin: {
    id: 'toxin', name: 'Toxin Sniper', category: 'infantry', cost: 600, time: 9, hp: 110, armor: 'none', speed: 0.04, turn: 0.4, sight: 9,
    weapon: 'toxinRifle', radius: 0.18, requires: ['barracks', 'radar'], factions: ['psi'], sprite: 'unit.toxin',
    description: 'Long-range sniper against infantry. Victims leave a toxic cloud.',
  },
  oracle: {
    id: 'oracle', name: 'The Oracle', category: 'infantry', cost: 1800, time: 22, hp: 260, armor: 'none', speed: 0.045, turn: 0.4, sight: 9,
    weapon: 'oracleControl', weapon2: 'oracleTakeover', radius: 0.2, regen: 0.15, ability: 'psistorm', hero: true, limit: 1, requires: ['barracks', 'lab'], factions: ['psi'], sprite: 'unit.oracle',
    description: 'Hero. Mind-controls units at long range. Takes over an enemy building from close by after a 5-second beam that breaks if she is hit (not Construction Yards or superweapons). Psi Storm (E) devastates nearby infantry. Max 1.',
  },
  // --- Phase 9: vehicles & air ---
  thrallhauler: {
    id: 'thrallhauler', name: 'Thrall Hauler', category: 'vehicle', cost: 1500, time: 13, hp: 1000, armor: 'heavy', speed: 0.045, turn: 0.12, sight: 5,
    radius: 0.42, harvester: { capacity: 700 }, ability: 'rig', escort: ['thrall', 3], requires: ['factory'], factions: ['psi'], sprite: 'unit.thrallhauler',
    description: 'Psi harvester with 3 Thralls. Harvests on its own, or deploy (E) near a field: it becomes a mobile refinery and the Thralls mine around it.',
  },
  thrall: {
    id: 'thrall', name: 'Thrall', category: 'infantry', cost: 0, time: 1, hp: 90, armor: 'none', speed: 0.04, turn: 0.4, sight: 4,
    radius: 0.16, harvester: { capacity: 100 }, hidden: true, requires: ['barracks'], factions: ['psi'], sprite: 'unit.thrall',
    description: 'Thrall Hauler slave: mines ore while its hauler is deployed. Without a master it works for the nearest refinery.',
  },
  shroudtank: {
    id: 'shroudtank', name: 'Shroud Tank', category: 'vehicle', cost: 900, time: 14, hp: 300, armor: 'light', speed: 0.075, turn: 0.15, sight: 8,
    weapon: 'shroudCannon', radius: 0.38, mimic: true, requires: ['factory', 'lab'], factions: ['allies'], sprite: 'unit.shroudtank',
    description: 'When stationary and holding fire, the enemy sees a tree (dogs don\'t). Heavy first salvo from ambush.',
  },
  talon: {
    id: 'talon', name: 'Talon Strike Jet', category: 'vehicle', cost: 1200, time: 15, hp: 200, armor: 'light', speed: 0.16, turn: 0.14, sight: 8,
    weapon: 'talonBomb', radius: 0.42, air: true, ammo: 1, requires: ['factory', 'airfield', 'lab'], from: 'airfield', factions: ['allies'], sprite: 'unit.talon',
    description: 'Fast bomber: one heavy precision bomb, then back to the Airfield. Shares landing pads with the Kestrels.',
  },
  amphib: {
    id: 'amphib', name: 'Amphibious Transport', category: 'vehicle', cost: 900, time: 10, hp: 400, armor: 'heavy', speed: 0.07, turn: 0.12, sight: 7,
    radius: 0.45, move: 'amphibious', transport: 8, ability: 'unload', requires: ['factory', 'radar'], factions: ALL, sprite: 'unit.amphib',
    description: 'Sails and drives: carries 8 infantry over land and water. Unarmed. On water it can only unload at the shore.',
  },
  leechdrone: {
    id: 'leechdrone', name: 'Leech Drone', category: 'vehicle', cost: 500, time: 7, hp: 100, armor: 'light', speed: 0.11, turn: 0.3, sight: 7,
    weapon: 'leechBite', radius: 0.26, drone: true, requires: ['factory'], factions: ['soviets'], sprite: 'unit.leechdrone',
    description: 'Fast spider bot: kills infantry and crawls into vehicles, eating them from within for 20 seconds. A Repair Depot removes it sooner.',
  },
  siegerotor: {
    id: 'siegerotor', name: 'Siege Rotor', category: 'vehicle', cost: 1100, time: 14, hp: 300, armor: 'light', speed: 0.1, turn: 0.15, sight: 8,
    weapon: 'rotorGun', deployWeapon: 'siegeShell', radius: 0.45, air: true, ability: 'land', requires: ['factory', 'radar'], factions: ['soviets'], sprite: 'unit.siegerotor',
    description: 'Helicopter with a machine gun against ground troops. Land (E) to become long-range artillery, but then it is a ground target.',
  },
  hivemind: {
    id: 'hivemind', name: 'Hivemind', category: 'vehicle', cost: 1750, time: 20, hp: 700, armor: 'heavy', speed: 0.04, turn: 0.08, sight: 8,
    weapon: 'hiveControl', radius: 0.55, requires: ['factory', 'lab'], factions: ['psi'], sprite: 'unit.hivemind',
    description: 'Controls up to 3 units at once, each after a short beam. A fourth overloads it and it rapidly loses health.',
  },
  deliriumdrone: {
    id: 'deliriumdrone', name: 'Delirium Drone', category: 'vehicle', cost: 900, time: 12, hp: 250, armor: 'light', speed: 0.08, turn: 0.2, sight: 7,
    weapon: 'deliriumGas', radius: 0.32, drone: true, requires: ['factory', 'radar'], factions: ['psi'], sprite: 'unit.deliriumdrone',
    description: 'Gas cloud: affected enemies go delirious and attack everything nearby for 10 seconds, including their own troops.',
  },
  // --- Phase 11: navy (built at the Naval Yard, sail on water only) ---
  destroyer: {
    id: 'destroyer', name: 'Picket Destroyer', category: 'vehicle', cost: 1000, time: 12, hp: 600, armor: 'heavy', speed: 0.07, turn: 0.08, sight: 8,
    weapon: 'navalGun', weapon2: 'depthCharge', detects: 7, radius: 0.55, move: 'water', requires: ['navalyard'], from: 'navalyard', factions: ['allies'], sprite: 'unit.destroyer',
    description: 'Cannon against ships and shore, depth charges against subs. Sonar: detects subs within 7 tiles.',
  },
  cruiser: {
    id: 'cruiser', name: 'Bastion Cruiser', category: 'vehicle', cost: 1200, time: 14, hp: 800, armor: 'heavy', speed: 0.06, turn: 0.07, sight: 10,
    weapon: 'aegisMissile', radius: 0.6, move: 'water', requires: ['navalyard', 'radar'], from: 'navalyard', factions: ['allies'], sprite: 'unit.cruiser',
    description: 'Floating anti-air shield: long-range missiles. Hits air targets only.',
  },
  carrier: {
    id: 'carrier', name: 'Skyhaven Carrier', category: 'vehicle', cost: 2000, time: 22, hp: 900, armor: 'heavy', speed: 0.045, turn: 0.05, sight: 10,
    weapon: 'carrierDrones', radius: 0.7, move: 'water', requires: ['navalyard', 'lab'], from: 'navalyard', factions: ['allies'], sprite: 'unit.carrier',
    description: 'Launches long-range combat drones at land and sea targets. Slow, no defenses of its own.',
  },
  sonardrone: {
    id: 'sonardrone', name: 'Sonar Drone', category: 'vehicle', cost: 600, time: 7, hp: 200, armor: 'light', speed: 0.12, turn: 0.25, sight: 8,
    weapon: 'sonicPulse', detects: 7, radius: 0.3, drone: true, move: 'water', requires: ['navalyard'], from: 'navalyard', factions: ['allies'], sprite: 'unit.sonardrone',
    description: 'Fast sea drone: sonic pulse against ships and subs, detects subs and shakes a Kraken off its prey.',
  },
  flakboat: {
    id: 'flakboat', name: 'Flak Boat', category: 'vehicle', cost: 600, time: 7, hp: 300, armor: 'light', speed: 0.1, turn: 0.2, sight: 8,
    weapon: 'flakBoatGun', detects: 5, radius: 0.4, move: 'water', requires: ['navalyard'], from: 'navalyard', factions: ['soviets'], sprite: 'unit.flakboat',
    description: 'Fast anti-air patrol boat, also good against infantry on the shore. Detects nearby subs.',
  },
  barracuda: {
    id: 'barracuda', name: 'Barracuda Sub', category: 'vehicle', cost: 1000, time: 12, hp: 600, armor: 'heavy', speed: 0.065, turn: 0.08, sight: 7,
    weapon: 'torpedo', stealth: true, radius: 0.5, move: 'water', requires: ['navalyard'], from: 'navalyard', factions: ['soviets'], sprite: 'unit.barracuda',
    description: 'Submarine: invisible underwater until it fires. Torpedoes hit only ships and buildings on water.',
  },
  leviathan: {
    id: 'leviathan', name: 'Leviathan', category: 'vehicle', cost: 2000, time: 22, hp: 900, armor: 'heavy', speed: 0.045, turn: 0.05, sight: 8,
    weapon: 'leviathanMissile', radius: 0.7, move: 'water', requires: ['navalyard', 'lab'], from: 'navalyard', factions: ['soviets'], sprite: 'unit.leviathan',
    description: 'Missile ship: heavy, very long-range missiles against land and sea targets. Useless against aircraft and subs.',
  },
  kraken: {
    id: 'kraken', name: 'Kraken', category: 'vehicle', cost: 1000, time: 12, hp: 600, armor: 'heavy', speed: 0.08, turn: 0.15, sight: 6,
    weapon: 'krakenGrab', stealth: true, radius: 0.5, move: 'water', requires: ['navalyard', 'radar'], from: 'navalyard', factions: ['soviets'], sprite: 'unit.kraken',
    description: 'Invisible sea monster: grabs a ship and crushes it. A Sonar Drone shakes it off.',
  },
  psisub: {
    id: 'psisub', name: 'Psi Submarine', category: 'vehicle', cost: 1400, time: 16, hp: 700, armor: 'heavy', speed: 0.06, turn: 0.07, sight: 7,
    weapon: 'psiSubMissile', weapon2: 'torpedo', stealth: true, radius: 0.55, move: 'water', requires: ['navalyard'], from: 'navalyard', factions: ['psi'], sprite: 'unit.psisub',
    description: 'Submarine with missiles against land and torpedoes against ships. Invisible underwater until it fires.',
  },
};

// Faction flavour names for shared unit defs.
export const FACTION_UNIT_NAMES: Partial<Record<FactionId, Record<string, string>>> = {
  soviets: { rifle: 'Draftee', jeep: 'Raider', dog: 'War Hound' },
  psi: {},
};
