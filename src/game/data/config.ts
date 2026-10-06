// Central balance & engine configuration. Change numbers here, not in systems.
export const TICK_RATE = 30; // simulation ticks per second at game speed 1
export const FOG_INTERVAL = 6; // ticks between visibility recalculation
export const LOW_POWER_PRODUCTION = 0.5; // production speed multiplier under low power
export const BUILD_RADIUS = 5; // max tile gap between new building and an existing own building
export const ORE_TILE_MAX = 300; // credits per full ore tile
export const GEM_MULTIPLIER = 2;
export const ORE_REGROW_INTERVAL = 150; // ticks
export const ORE_REGROW_AMOUNT = 8;
export const ORE_MINE_OUTPUT = 40; // ore added around each mine per regrow step
export const ORE_SPREAD_CHANCE = 0.05; // per regrow step, per tile above half full: seed one empty neighbour
export const HARVEST_INTERVAL = 8; // ticks per harvest bite
export const HARVEST_BITE = 40; // credits per bite
export const UNLOAD_INTERVAL = 4;
export const UNLOAD_BITE = 70;
export const PATH_NODE_LIMIT = 6000;
export const PATHS_PER_TICK = 24; // throttling budget
export const STUCK_TICKS = 45;
export const MAX_REPATHS = 4;
export const SCAN_INTERVAL = 12; // ticks between auto-target scans
export const SANDBOX_CREDITS = 999999;
export const SANDBOX_BUILD_SPEED = 5;
export const QUEUE_LIMIT = 5;
export const SELL_REFUND = 0.5; // fraction of cost (scaled by health) returned when selling
export const REPAIR_HP_PER_TICK = 1.5;
export const AIR_ALTITUDE = 30; // screen px (zoom 1) aircraft are drawn above the ground
export const REPAIR_COST_FACTOR = 0.5; // repairing 0→full hp costs this fraction of the building cost

export const DIFFICULTY = {
  easy: { think: 60, attackBase: 3, attackGrow: 1, firstAttack: 5 * 60, waveGap: 150, refineries: 1, factories: 1, towers: 1, minersPerRef: 1, defendRadius: 10, buildSpeed: 0.7, fullWaves: false, retreat: false },
  normal: { think: 30, attackBase: 8, attackGrow: 2, firstAttack: 4 * 60, waveGap: 100, refineries: 2, factories: 1, towers: 2, minersPerRef: 2, defendRadius: 14, buildSpeed: 0.85, fullWaves: true, retreat: false },
  hard: { think: 30, attackBase: 14, attackGrow: 3, firstAttack: 5 * 60, waveGap: 70, refineries: 2, factories: 2, towers: 3, minersPerRef: 2, defendRadius: 18, buildSpeed: 1, fullWaves: true, retreat: true },
} as const; // firstAttack & waveGap in seconds; buildSpeed < 1 = easy-AI handicap (no bonuses above 1: the AI never cheats)

export const MAP_SIZES = { small: 48, medium: 64, large: 96 } as const;
export const START_CREDIT_OPTIONS = [2500, 5000, 10000];
export const PLAYER_COLORS = ['#2f7de1', '#d8412f', '#3fae4a', '#e0b12a', '#9b4fd6', '#e07b2a'];

/** Edge scrolling: band in screen px along the map view where the camera starts to scroll (faster closer to the edge). */
export const EDGE_ZONE = 28;

/** Telemetry measuring parameters (Fun Pass 20.0): not targets. */
export const TELEMETRY = { snapshot: 300, clusterGap: 5, concMinArmy: 2000, quietGap: 30, planShift: 0.5 } as const;
