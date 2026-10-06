// Core game types. GameState is plain & serializable except `rt` (runtime caches, rebuilt on load).

export type FactionId = 'allies' | 'soviets' | 'psi';
export type ArmorType = 'none' | 'light' | 'heavy' | 'building';
export type Category = 'building' | 'infantry' | 'vehicle';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type GameMode = 'skirmish' | 'sandbox' | 'tutorial';

export type OrderType = 'idle' | 'move' | 'attack' | 'attackMove' | 'guard' | 'harvest' | 'capture' | 'enter' | 'rearm';

export interface Order {
  type: OrderType;
  tx: number; // destination / guard anchor (tile space)
  ty: number;
  targetId: number; // explicit attack target (0 = none)
}

export type HarvestState = 'seek' | 'toOre' | 'harvest' | 'toRef' | 'unload' | 'wait';

export interface Entity {
  id: number;
  def: string;
  owner: number;
  kind: 'unit' | 'building';
  // Units: center position in tile space. Buildings: top-left footprint tile.
  x: number;
  y: number;
  px: number; // previous tick position, for render interpolation
  py: number;
  hp: number;
  facing: number; // radians, tile space
  turret: number;
  order: Order;
  path: number[]; // tile indices
  pathIdx: number;
  gx: number; // movement goal (tile space)
  gy: number;
  needPath: boolean; // path request pending (throttled)
  targetId: number; // current combat target
  cooldown: number;
  scanTimer: number;
  stuckTimer: number;
  stuckDist: number;
  repaths: number;
  // harvester
  cargo: number;
  hstate: HarvestState;
  hTimer: number;
  // building
  built: number; // 0..1 build-up; operational at 1
  seenBy: number; // bitmask of players that have seen this building
  lastHit: number; // tick of last damage taken
  repairing: boolean;
  rallyX: number; // production rally point (-1 = none)
  rallyY: number;
  heat?: number; // gatling spin-up (consecutive shots)
  lastShot?: number; // tick of last shot
  xp?: number; // veterancy: value of kills (see systems/combat.ts rankOf)
  mcBy?: number; // mind-controlled by this entity id
  mcOwner?: number; // owner before mind control
  mcTarget?: number; // the unit this controller holds
  chargeOn?: number; // mind control being charged on this target (unit or building)
  chargeUntil?: number; // ...lands at this tick if the beam holds
  chargeLast?: number; // last tick the beam was on (a gap restarts the clock)
  leechUntil?: number; // a Leech Drone inside gives up at this tick
  bombWeapon?: string; // blast of the planted bomb (Sapper charge, Nova's C4)
  noPath?: boolean; // last path request found no way forward → moveStep reports 'gaveUp' once
  badOre?: number; // harvester: last ore tile it could not reach (skipped by findOre)
  up?: boolean; // building exit/dock faces -y (towards the map centre for bases in the lower half)
  abCd?: number; // ability cooldown (ticks)
  dug?: boolean; // dug in (Rifleman ability): no moving, more range, less damage taken
  inside?: number; // carried by this transport: out of the world (no sight, not targetable, not drawn)
  passengers?: number[]; // transport: ids of carried units
  ammo?: number; // aircraft shots left (UnitDef.ammo)
  pad?: number; // aircraft: assigned airfield id
  padK?: number; // ...and pad slot on it
  landed?: boolean; // aircraft parked on its pad: a ground target, doesn't fire
  deployed?: boolean; // deploy-mode infantry (Blight Trooper field): no moving
  frozenUntil?: number; // status: frozen (phase beam / after a teleport) — no actions; phased targets are also invulnerable
  phased?: number; // phase-beam progress; erased when it reaches hp
  bombAt?: number; // status: time bomb detonates at this tick
  bombBy?: number; // ...planted by this player
  bombSrc?: number; // ...and this unit (kill credit)
  master?: number; // thrall: its Thrall Hauler
  movedAt?: number; // last tick it moved (Shroud Tank disguise)
  leechBy?: number; // status: a Leech Drone of this player is eating it from the inside
  berserkUntil?: number; // status: attacks anything nearby, friend or foe
  gunWeapon?: string; // gunner transport (IFV): weapon lent by its passenger
  link?: number; // bridge segment: the span leader that holds its health; bridge hut: the span it repairs
  ruined?: boolean; // destroyed bridge segment (kept so a hut can rebuild it)
  charge?: number; // superweapon: ticks charged (full at POWERS[..].charge seconds)
  stasisUntil?: number; // Stasis Projector: invulnerable until this tick
  born?: number; // tick it was created (telemetry: lifetime at death)
}

export interface QueueItem {
  def: string;
  spent: number;
  progress: number; // ticks done
  hold?: boolean; // paused by the player (right-click on the cameo); a second right-click cancels
}

export interface PlayerStats {
  harvested: number;
  unitsBuilt: number;
  buildingsBuilt: number;
  damageDealt: number;
  kills: number;
  losses: number;
  stolen?: number; // credits taken from enemies (infiltration, Hover Disc drain)
  bonus?: number; // credits from crates
  rig?: number; // credits from captured tech buildings (Fuel Rig); also counted in harvested
}

export interface Player {
  id: number;
  name: string;
  faction: FactionId;
  color: string;
  ai: boolean;
  passive: boolean; // sandbox dummy: never acts
  credits: number;
  powerMade: number;
  powerUsed: number;
  defeated: boolean;
  queues: Record<Category, QueueItem[]>;
  ready: string | null; // finished building waiting for placement
  startX: number;
  startY: number;
  explored: Uint8Array;
  visible: Uint8Array;
  stats: PlayerStats;
  outage?: number; // infiltrated power plant: no power until this tick
  neutral?: boolean; // the civilians: own the town, tech buildings and bridges; never plays, never loses
  vet?: { infantry?: boolean; vehicle?: boolean }; // infiltrated barracks/factory: new units start as veterans
}

export interface Projectile {
  x: number;
  y: number;
  tx: number;
  ty: number;
  targetId: number;
  owner: number;
  weapon: string;
  sourceId: number;
}

export interface Effect {
  kind: 'explosion' | 'bigExplosion' | 'flash' | 'beam' | 'tracer' | 'smoke' | 'wave'; // wave: expanding ring, radius x2
  x: number;
  y: number;
  x2: number;
  y2: number;
  t: number; // ticks alive
  life: number;
  color: string;
}

export interface Hazard { x: number; y: number; until: number; owner: number; weapon: string }

export interface GameMap {
  w: number;
  h: number;
  name: string;
  terrain: Uint8Array;
  ore: Uint16Array; // credits worth of ore on tile
  gem: Uint8Array; // 1 = gem tile (higher value)
  deco: Uint8Array; // visual variation seed per tile
  /** Ore mines: impassable tiles that keep seeding ore around them (never deplete). */
  oreSources: { i: number; gem: boolean }[];
  rev?: number; // bumped whenever terrain changes in play (bridge destroyed/rebuilt): invalidates caches
}

export interface AIState {
  player: number;
  nextThink: number;
  attackWave: number;
  nextAttack: number;
  attacking: number[]; // unit ids currently in an attack wave
  waveSize?: number; // units the current wave started with
  lastPlace: number;
  difficulty?: Difficulty; // per-AI override (balance tests); default settings.difficulty
}

export type GameEvent =
  | { type: 'fire'; x: number; y: number; weapon: string; owner: number }
  | { type: 'death'; x: number; y: number; kind: 'unit' | 'building'; owner: number; def: string; by?: number; killer?: string; cost?: number; cause?: DeathCause; age?: number } // killer: def of the unit/building that dealt it // by: player who dealt the blow; age in ticks
  | { type: 'unitReady'; owner: number; def: string }
  | { type: 'spawned'; owner: number; def: string; reason: 'escort' | 'freeUnit' | 'mutagen' } // a unit nobody paid for
  | { type: 'buildingReady'; owner: number; def: string }
  | { type: 'placed'; owner: number; def: string; x?: number; y?: number } // building centre
  | { type: 'income'; owner: number; id: number; amount: number } // refinery id
  | { type: 'underAttack'; owner: number; def: string; x: number; y: number; by?: number }
  | { type: 'lowPower'; owner: number }
  | { type: 'insufficient'; owner: number }
  | { type: 'captured'; owner: number; from: number; def: string }
  | { type: 'promoted'; owner: number; def: string; rank: number }
  | { type: 'mindControl'; owner: number; from: number; def: string }
  | { type: 'mindControlStart'; owner: number; from: number; def: string; target: string; x: number; y: number } // a control beam started (def = controller) on one of `from`'s
  | { type: 'mindControlBroken'; owner: number; from: number; def: string; target: string } // ...and broke off before it landed
  | { type: 'mutated'; owner: number; from: number; def: string; cost: number } // Mutagen Spire: infantry turned into a Mauler (no death)
  | { type: 'defeated'; owner: number }
  | { type: 'enqueued'; owner: number; def: string }
  | { type: 'ability'; owner: number; def: string; ability: string }
  | { type: 'deployed'; owner: number; def: string; x?: number; y?: number }
  | { type: 'infiltrated'; owner: number; from: number; def: string }
  | { type: 'garrisoned'; owner: number; def: string }
  | { type: 'bridge'; destroyed: boolean; x: number; y: number }
  | { type: 'crate'; owner: number; kind: string; x: number; y: number }
  | { type: 'superweapon'; owner: number; def: string; phase: 'built' | 'ready' | 'fired'; x: number; y: number }
  | { type: 'gameOver'; winner: number };

export interface GameSettings {
  mode: GameMode;
  faction: FactionId;
  enemyFaction: FactionId;
  color: string;
  mapPreset: string;
  mapSize: 'small' | 'medium' | 'large';
  resources: 'low' | 'normal' | 'high';
  seed: number;
  difficulty: Difficulty;
  startCredits: number;
  aiCount: number;
  ais?: { faction: FactionId; color: string; difficulty: Difficulty }[]; // lobby slots, one per AI (older saves: enemyFaction/difficulty for all)
  crates?: boolean; // bonus crates spawn on the map
  town?: boolean; // civilians: garrisonable town, tech buildings, destructible bridges (skirmish)
  superweapons?: boolean; // superweapon buildings may be built (undefined in older saves = on)
  telemetry?: boolean; // record match telemetry (default on; false = off, e.g. the determinism test)
  oreRules?: 'v12' | 'v14'; // ore regrowth rules (missing = 'v12'); Fun Pass 20.5 harness
}

/** Derived, non-serialized caches. Rebuilt by `rebuildRuntime` after load. */
export interface Runtime {
  byId: Map<number, Entity>;
  grid: Int32Array; // building id occupying each tile (0 = free)
  events: GameEvent[];
}

export interface GameState {
  version: number;
  tick: number;
  rng: number;
  settings: GameSettings;
  map: GameMap;
  players: Player[];
  entities: Entity[];
  nextId: number;
  projectiles: Projectile[];
  effects: Effect[];
  ai: AIState[];
  winner: number; // -1 = in progress
  pathCursor?: number; // round-robin start for the per-tick path budget
  hazards?: Hazard[]; // lingering ground effects (poison clouds)
  neutral?: number; // player id of the civilians (undefined in older saves / sandbox)
  crates?: { x: number; y: number }[]; // bonus crates on the map (settings.crates)
  telemetry?: Telemetry; // match record (systems/telemetry.ts); never read by the simulation
  rt: Runtime;
}

export type DeathCause = 'weapon' | 'superweapon' | 'hero' | 'mc' | 'hazard' | 'self';

/** One player every 10 s (systems/telemetry.ts). Values in credits unless noted. */
export interface Snapshot {
  t: number; p: number; credits: number;
  income: number; stolen: number; bonus: number; spent: number; // in the interval
  rig?: number; // part of income from captured tech buildings, in the interval (missing in older exports)
  army: number; bld: number; // army value, building value (cost × health)
  inf: number; veh: number; air: number; sea: number; cy: number; harv: number; power: number; // counts (harv = harvesters); power = made − used
  fields: number[]; // ore left per field, % of tick 0
  options: number[]; // orderable defs: building, infantry, vehicle
  conc: number | null; // largest cluster / army value (army ≥ TELEMETRY.concMinArmy)
  byDef: Record<string, number>; // army value per def
}

export interface Telemetry {
  build: string; aiVersion: number;
  fieldOf: Uint16Array; fieldOre: number[]; fieldPos: [number, number][]; // ore fields at tick 0 (id + 1 per tile)
  snaps: Snapshot[];
  ev: (GameEvent & { t: number })[];
  dec: [number, number, string, string, number?][]; // tick, owner, kind, detail, distance
  samples: string[][]; // per player, per queue (building, infantry, vehicle): one QueueState char per second
  acc: { harvested: number; stolen: number; bonus: number; rig?: number; credits: number }[]; // running totals for the next snapshot
}
