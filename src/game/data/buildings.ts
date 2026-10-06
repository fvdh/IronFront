import type { FactionId } from '../types';

export interface BuildingDef {
  id: string;
  name: string;
  cost: number;
  time: number; // seconds
  hp: number;
  w: number;
  h: number;
  power: number; // + produces, - consumes
  sight: number;
  requires: string[];
  buildable: boolean; // false = cannot be built from sidebar (e.g. Construction Yard)
  produces?: 'building' | 'infantry' | 'vehicle';
  freeUnit?: string;
  weapon?: string;
  needsPower?: boolean; // goes offline under low power
  repairs?: boolean; // repairs own vehicles parked next to it (for credits)
  pads?: number; // landing pads: aircraft with `ammo` rearm here
  wall?: boolean; // placed as a dragged line; ignored by auto-targeting and victory checks
  ability?: string; // building ability button (Construction Yard: pack up)
  garrison?: number; // civilian building: infantry slots; its owner fires the occupants' weapons from inside
  income?: number; // tech: credits per second for the owner
  heals?: 'infantry' | 'vehicle'; // tech: the owner's units of this kind heal 2% per second, anywhere
  neutralOnly?: boolean; // map structure (town, tech, bridge): never built, capture/garrison only
  bridge?: boolean; // bridge segment: invisible, no footprint, only direct hits hurt it, health lives on the span leader
  naval?: boolean; // placed on open water (Naval Yard)
  superweapon?: string; // charges and fires this power (data/powers.ts); one per player
  limit?: number; // max alive + queued per player
  vehicleDiscount?: boolean; // Assembly Plant: vehicles 25% cheaper and faster
  duplicates?: boolean; // Duplicator Vats: every trained infantry comes twice (not heroes)
  recycles?: boolean; // Reclaimer: own units driven in are turned into half their cost
  detects?: number; // spots subs and spies within this radius; Psi Beacon also shows enemy attack orders on the minimap
  repairsBridge?: boolean; // bridge hut: an engineer here rebuilds the linked ruined span
  factions?: FactionId[]; // omitted = all factions
  sprite: string;
  description: string;
}

export const BUILDINGS: Record<string, BuildingDef> = {
  cy: { id: 'cy', name: 'Construction Yard', cost: 3000, time: 30, hp: 1500, w: 3, h: 3, power: 20, sight: 8, requires: [], buildable: false, produces: 'building', ability: 'pack', sprite: 'building.cy', description: 'Heart of the base. Builds all structures.' },
  power: { id: 'power', name: 'Power Plant', cost: 800, time: 8, hp: 750, w: 2, h: 2, power: 100, sight: 5, requires: ['cy'], buildable: true, sprite: 'building.power', description: 'Provides 100 power.' },
  refinery: { id: 'refinery', name: 'Ore Refinery', cost: 2000, time: 14, hp: 900, w: 3, h: 3, power: -40, sight: 6, requires: ['power'], buildable: true, freeUnit: 'miner', sprite: 'building.refinery', description: 'Processes ore into credits. Includes a free Ore Hauler.' },
  barracks: { id: 'barracks', name: 'Barracks', cost: 500, time: 8, hp: 800, w: 2, h: 2, power: -20, sight: 5, requires: ['power'], buildable: true, produces: 'infantry', sprite: 'building.barracks', description: 'Trains infantry.' },
  factory: { id: 'factory', name: 'War Factory', cost: 2000, time: 15, hp: 1200, w: 3, h: 3, power: -40, sight: 5, requires: ['refinery'], buildable: true, produces: 'vehicle', sprite: 'building.factory', description: 'Builds vehicles.' },
  radar: { id: 'radar', name: 'Radar Array', cost: 1000, time: 12, hp: 1000, w: 2, h: 2, power: -50, sight: 10, requires: ['refinery'], buildable: true, needsPower: true, sprite: 'building.radar', description: 'Enables the minimap (with enough power). Required for heavy vehicles.' },
  lab: { id: 'lab', name: 'Tech Center', cost: 2000, time: 20, hp: 1000, w: 3, h: 3, power: -100, sight: 6, requires: ['factory', 'radar'], buildable: true, sprite: 'building.lab', description: 'Unlocks your faction\'s most advanced units.' },
  depot: { id: 'depot', name: 'Repair Depot', cost: 800, time: 10, hp: 1000, w: 2, h: 2, power: -20, sight: 5, requires: ['factory'], buildable: true, repairs: true, sprite: 'building.depot', description: 'Repairs adjacent friendly vehicles (costs credits). Right-click the depot with vehicles selected.' },
  // --- Faction defenses ---
  pillbox: { id: 'pillbox', name: 'Pillbox', cost: 500, time: 7, hp: 600, w: 1, h: 1, power: 0, sight: 7, requires: ['barracks'], buildable: true, weapon: 'pillboxMg', factions: ['allies'], sprite: 'building.pillbox', description: 'Concrete machine-gun bunker against infantry. Works without power.' },
  prismtower: { id: 'prismtower', name: 'Refractor Tower', cost: 1500, time: 14, hp: 700, w: 1, h: 1, power: -75, sight: 9, requires: ['radar'], buildable: true, weapon: 'refractorTower', needsPower: true, factions: ['allies'], sprite: 'building.prismtower', description: 'Long-range light beam with splash damage. Offline on low power.' },
  tower: { id: 'tower', name: 'Sentry Gun', cost: 600, time: 8, hp: 650, w: 1, h: 1, power: -30, sight: 7, requires: ['barracks'], buildable: true, weapon: 'towerGun', needsPower: true, factions: ['soviets'], sprite: 'building.tower', description: 'Rapid-fire cannon against infantry and light vehicles. Offline on low power.' },
  coil: { id: 'coil', name: 'Arc Coil', cost: 1500, time: 14, hp: 800, w: 1, h: 1, power: -75, sight: 8, requires: ['radar'], buildable: true, weapon: 'coilBolt', needsPower: true, factions: ['soviets'], sprite: 'building.coil', description: 'Heavy electric discharge, destroys anything up close. Offline on low power.' },
  gatlingtower: { id: 'gatlingtower', name: 'Gatling Cannon', cost: 1000, time: 10, hp: 700, w: 1, h: 1, power: -40, sight: 8, requires: ['barracks'], buildable: true, weapon: 'gatlingTower', needsPower: true, factions: ['psi'], sprite: 'building.gatlingtower', description: 'Spins up: fires faster and faster. Strong against infantry. Offline on low power.' },
  psispire: { id: 'psispire', name: 'Psi Spire', cost: 1500, time: 14, hp: 700, w: 1, h: 1, power: -75, sight: 9, requires: ['radar'], buildable: true, weapon: 'psiSpire', needsPower: true, factions: ['psi'], sprite: 'building.psispire', description: 'Psionic beam against vehicles. Offline on low power.' },
  // --- Phase 7 ---
  wall: { id: 'wall', name: 'Wall', cost: 100, time: 2, hp: 400, w: 1, h: 1, power: 0, sight: 1, requires: ['power'], buildable: true, wall: true, sprite: 'building.wall', description: 'Wall. Drag to place a line (each extra segment costs $100). Not auto-targeted.' },
  airfield: { id: 'airfield', name: 'Airfield', cost: 1000, time: 12, hp: 1000, w: 3, h: 3, power: -50, sight: 7, requires: ['radar'], buildable: true, pads: 4, factions: ['allies'], sprite: 'building.airfield', description: 'Four landing pads. Kestrels launch here and rearm their missiles.' },
  samsite: { id: 'samsite', name: 'Skyguard SAM', cost: 900, time: 10, hp: 600, w: 1, h: 1, power: -50, sight: 10, requires: ['radar'], buildable: true, weapon: 'samMissile', needsPower: true, factions: ['allies'], sprite: 'building.samsite', description: 'Long-range anti-air missiles. Hits air targets only. Offline on low power.' },
  flakbattery: { id: 'flakbattery', name: 'Flak Battery', cost: 900, time: 10, hp: 700, w: 1, h: 1, power: -50, sight: 9, requires: ['radar'], buildable: true, weapon: 'flakCannon', needsPower: true, factions: ['soviets'], sprite: 'building.flakbattery', description: 'Anti-air flak with splash damage. Hits air targets only. Offline on low power.' },
  // --- Phase 11 ---
  navalyard: { id: 'navalyard', name: 'Naval Yard', cost: 1000, time: 12, hp: 1200, w: 3, h: 3, power: -20, sight: 7, requires: ['refinery'], buildable: true, naval: true, repairs: true, sprite: 'building.navalyard', description: 'Built on open water. Builds ships and repairs adjacent ships (costs credits).' },
  // --- Phase 12: superweapons & economy ---
  phasegate: { id: 'phasegate', name: 'Phase Gate', cost: 2500, time: 30, hp: 1500, w: 3, h: 3, power: -200, sight: 6, requires: ['lab'], buildable: true, needsPower: true, superweapon: 'phasegate', limit: 1, factions: ['allies'], sprite: 'building.phasegate', description: 'Superweapon: teleports a group of vehicles across the map. Charges in 4 minutes (not on low power).' },
  stormengine: { id: 'stormengine', name: 'Storm Engine', cost: 5000, time: 45, hp: 1500, w: 3, h: 3, power: -200, sight: 6, requires: ['lab'], buildable: true, needsPower: true, superweapon: 'storm', limit: 1, factions: ['allies'], sprite: 'building.stormengine', description: 'Superweapon: lightning storm over an area. Charges in 6 minutes (not on low power).' },
  hammersilo: { id: 'hammersilo', name: 'Hammer Silo', cost: 5000, time: 45, hp: 1500, w: 3, h: 3, power: -200, sight: 6, requires: ['lab'], buildable: true, needsPower: true, superweapon: 'hammer', limit: 1, factions: ['soviets'], sprite: 'building.hammersilo', description: 'Superweapon: heavy missile with radiation. Charges in 6 minutes (not on low power).' },
  stasis: { id: 'stasis', name: 'Stasis Projector', cost: 2500, time: 30, hp: 1500, w: 3, h: 3, power: -200, sight: 6, requires: ['lab'], buildable: true, needsPower: true, superweapon: 'stasis', limit: 1, factions: ['soviets'], sprite: 'building.stasis', description: 'Superweapon: 20 seconds of invulnerability for vehicles and buildings. Charges in 4 minutes (not on low power).' },
  dominion: { id: 'dominion', name: 'Dominion Engine', cost: 5000, time: 45, hp: 1500, w: 3, h: 3, power: -200, sight: 6, requires: ['lab'], buildable: true, needsPower: true, superweapon: 'dominion', limit: 1, factions: ['psi'], sprite: 'building.dominion', description: 'Superweapon: permanently takes over everything in an area. Charges in 6 minutes (not on low power).' },
  mutagen: { id: 'mutagen', name: 'Mutagen Spire', cost: 2500, time: 30, hp: 1500, w: 3, h: 3, power: -200, sight: 6, requires: ['lab'], buildable: true, needsPower: true, superweapon: 'mutagen', limit: 1, factions: ['psi'], sprite: 'building.mutagen', description: 'Superweapon: turns enemy infantry into Maulers for you. Charges in 4 minutes (not on low power).' },
  assembly: { id: 'assembly', name: 'Assembly Plant', cost: 2000, time: 20, hp: 1200, w: 3, h: 3, power: -100, sight: 5, requires: ['factory', 'radar'], buildable: true, vehicleDiscount: true, limit: 1, factions: ['soviets'], sprite: 'building.assembly', description: 'Vehicles (and ships) cost 25% less and build 25% faster.' },
  reclaimer: { id: 'reclaimer', name: 'Reclaimer', cost: 1200, time: 12, hp: 900, w: 3, h: 3, power: -50, sight: 5, requires: ['refinery'], buildable: true, recycles: true, factions: ['psi'], sprite: 'building.reclaimer', description: 'Right-click the Reclaimer with your own (or captured) ground units: they are recycled for half their cost.' },
  vats: { id: 'vats', name: 'Duplicator Vats', cost: 2500, time: 25, hp: 1000, w: 2, h: 2, power: -100, sight: 5, requires: ['barracks', 'lab'], buildable: true, duplicates: true, limit: 1, factions: ['psi'], sprite: 'building.vats', description: 'Every infantry trained comes out of the barracks twice (not heroes).' },
  psibeacon: { id: 'psibeacon', name: 'Psi Beacon', cost: 1000, time: 10, hp: 700, w: 2, h: 2, power: -50, sight: 10, requires: ['radar'], buildable: true, detects: 10, needsPower: true, factions: ['psi'], sprite: 'building.psibeacon', description: 'Shows enemy units\' attack targets on the minimap and reveals subs and spies within 10 tiles.' },
  // --- Phase 10: map structures (owned by the civilians) ---
  civhouse: { id: 'civhouse', name: 'House', cost: 600, time: 1, hp: 900, w: 2, h: 2, power: 0, sight: 5, requires: [], buildable: false, neutralOnly: true, garrison: 3, ability: 'unload', sprite: 'building.civhouse', description: 'Civilian house. Holds 3 infantry: they fire from inside with extra range and can\'t be hit until it collapses.' },
  civoffice: { id: 'civoffice', name: 'Office Block', cost: 800, time: 1, hp: 1300, w: 2, h: 2, power: 0, sight: 6, requires: [], buildable: false, neutralOnly: true, garrison: 5, ability: 'unload', sprite: 'building.civoffice', description: 'Office building. Holds 5 infantry.' },
  civhall: { id: 'civhall', name: 'Town Hall', cost: 1200, time: 1, hp: 2000, w: 3, h: 3, power: 0, sight: 7, requires: [], buildable: false, neutralOnly: true, garrison: 8, ability: 'unload', sprite: 'building.civhall', description: 'Town hall. Holds 8 infantry.' },
  civfarm: { id: 'civfarm', name: 'Farmhouse', cost: 500, time: 1, hp: 800, w: 2, h: 2, power: 0, sight: 5, requires: [], buildable: false, neutralOnly: true, garrison: 3, ability: 'unload', sprite: 'building.civfarm', description: 'Farmhouse. Holds 3 infantry.' },
  techrig: { id: 'techrig', name: 'Fuel Rig', cost: 1000, time: 1, hp: 1000, w: 2, h: 2, power: 0, sight: 5, requires: [], buildable: false, neutralOnly: true, income: 15, sprite: 'building.techrig', description: 'Tech building. Capture with an Engineer: +$15 per second.' },
  hospital: { id: 'hospital', name: 'Field Hospital', cost: 1000, time: 1, hp: 1000, w: 2, h: 2, power: 0, sight: 5, requires: [], buildable: false, neutralOnly: true, heals: 'infantry', sprite: 'building.hospital', description: 'Tech building. Capture with an Engineer: all your infantry slowly heals, anywhere.' },
  machineshop: { id: 'machineshop', name: 'Machine Shop', cost: 1000, time: 1, hp: 1000, w: 2, h: 2, power: 0, sight: 5, requires: [], buildable: false, neutralOnly: true, heals: 'vehicle', sprite: 'building.machineshop', description: 'Tech building. Capture with an Engineer: all your vehicles slowly self-repair, anywhere.' },
  outpost: { id: 'outpost', name: 'Outpost', cost: 800, time: 1, hp: 800, w: 2, h: 2, power: 0, sight: 14, requires: [], buildable: false, neutralOnly: true, sprite: 'building.outpost', description: 'Tech building. Capture with an Engineer: sees 14 tiles far.' },
  bridgehut: { id: 'bridgehut', name: 'Bridge Repair Hut', cost: 300, time: 1, hp: 600, w: 1, h: 1, power: 0, sight: 3, requires: [], buildable: false, neutralOnly: true, repairsBridge: true, sprite: 'building.bridgehut', description: 'Send an Engineer here to rebuild the destroyed bridge next to it.' },
  bridge: { id: 'bridge', name: 'Bridge', cost: 0, time: 1, hp: 2500, w: 1, h: 1, power: 0, sight: 0, requires: [], buildable: false, neutralOnly: true, bridge: true, sprite: '', description: 'Bridge. Can only be destroyed by targeted fire; an Engineer in the repair hut rebuilds it.' },
};

export const FACTION_BUILDING_NAMES: Partial<Record<FactionId, Record<string, string>>> = {
  allies: { lab: 'Research Lab', wall: 'Barrier Wall' },
  soviets: { wall: 'Bloc Wall', power: 'Dynamo Plant', radar: 'Radar Tower', lab: 'Research Institute', barracks: 'Bloc Barracks' },
  psi: { wall: 'Psi Wall', power: 'Bio Reactor', barracks: 'Psi Barracks', radar: 'Psi Sensor Array', lab: 'Psi Laboratory', refinery: 'Thrall Refinery' },
};
