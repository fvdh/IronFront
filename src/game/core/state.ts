import { FACTIONS } from '../data/factions';
import { PLAYER_COLORS, SANDBOX_CREDITS } from '../data/config';
import { createAI } from '../systems/ai';
import { computeFog } from '../systems/fog';
import { updatePower } from '../systems/economy';
import { initTelemetry } from '../systems/telemetry';
import type { FactionId, GameSettings, GameState, Player } from '../types';
import { generateMap, startPositions } from '../world/mapgen';
import { placeStructures } from '../world/structures';
import { spawnBuilding, spawnUnit } from './entities';

export const SAVE_VERSION = 2;

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'skirmish', faction: 'allies', enemyFaction: 'soviets', superweapons: true, color: PLAYER_COLORS[0],
  mapPreset: 'plains', mapSize: 'medium', resources: 'normal', seed: 1234,
  difficulty: 'normal', startCredits: 5000, aiCount: 1,
};

export const AI_NAMES = ['General Kova', 'Marshal Brandt', 'Director Vail'];

export function createGame(settings: GameSettings): GameState {
  const sandbox = settings.mode === 'sandbox';
  const ais = sandbox ? undefined : settings.ais;
  const nPlayers = sandbox ? 2 : 1 + Math.max(1, Math.min(3, ais?.length ?? settings.aiCount));
  const map = generateMap(settings, nPlayers);
  const starts = startPositions(map.w, map.h);
  const n = map.w * map.h;
  const factions: FactionId[] = ['allies', 'soviets', 'psi'];
  const colors = ais ? [settings.color, ...ais.map((a) => a.color)] : [settings.color, ...PLAYER_COLORS.filter((c) => c !== settings.color)];

  const players: Player[] = Array.from({ length: nPlayers }, (_, id) => ({
    id,
    name: id === 0 ? 'Commander' : sandbox ? 'Target Dummy' : AI_NAMES[(id - 1) % AI_NAMES.length],
    faction: id === 0 ? settings.faction : ais?.[id - 1].faction ?? factions[(factions.indexOf(settings.enemyFaction) + id - 1) % 3],
    color: colors[id],
    ai: id !== 0,
    passive: sandbox && id !== 0,
    credits: id === 0 && sandbox ? SANDBOX_CREDITS : settings.startCredits,
    powerMade: 0, powerUsed: 0, defeated: false,
    queues: { building: [], infantry: [], vehicle: [] },
    ready: null,
    startX: starts[id][0] + 0.5, startY: starts[id][1] + 0.5,
    explored: new Uint8Array(n), visible: new Uint8Array(n),
    stats: { harvested: 0, unitsBuilt: 0, buildingsBuilt: 0, damageDealt: 0, kills: 0, losses: 0 },
  }));

  const s: GameState = {
    version: SAVE_VERSION, tick: 0, rng: settings.seed ^ 0x5eed, settings, map, players,
    entities: [], nextId: 1, projectiles: [], effects: [], ai: [], winner: -1,
    rt: { byId: new Map(), grid: new Int32Array(n), events: [] },
  };

  // The civilians own the town, tech buildings and bridges. Appended last so player ids stay the same.
  if (settings.town && !sandbox) {
    s.neutral = players.length;
    players.push({ ...players[0], id: s.neutral, name: 'Civilians', faction: 'allies', color: '#8f8a7c', ai: false, passive: true, neutral: true, credits: 0, startX: -1, startY: -1, explored: new Uint8Array(n), visible: new Uint8Array(n), queues: { building: [], infantry: [], vehicle: [] }, stats: { harvested: 0, unitsBuilt: 0, buildingsBuilt: 0, damageDealt: 0, kills: 0, losses: 0 } });
  }

  for (const p of players) {
    if (p.neutral) continue;
    const [sx, sy] = starts[p.id];
    spawnBuilding(s, 'cy', p.id, sx - 1, sy - 1);
    if (p.passive) {
      // Sandbox dummy: a small static base and some targets.
      spawnBuilding(s, 'power', p.id, sx + 3, sy - 1);
      spawnBuilding(s, 'barracks', p.id, sx - 1, sy + 3);
      for (let k = 0; k < 3; k++) spawnUnit(s, FACTIONS[p.faction].mainTank, p.id, sx + 4.5 + k, sy + 4.5);
    }
    if (p.ai && !p.passive) s.ai.push({ ...createAI(p.id, settings.difficulty), ...(ais ? { difficulty: ais[p.id - 1].difficulty } : {}) });
  }
  if (sandbox) {
    // Sandbox: start with the full base so every system can be tried right away.
    const [sx, sy] = starts[0];
    spawnBuilding(s, 'power', 0, sx + 3, sy - 1);
    spawnBuilding(s, 'barracks', 0, sx + 3, sy + 2);
    spawnBuilding(s, 'factory', 0, sx - 1, sy - 5);
    spawnUnit(s, FACTIONS[settings.faction].mainTank, 0, sx + 0.5, sy + 3.5);
  }
  if (s.neutral !== undefined) placeStructures(s);
  updatePower(s);
  computeFog(s);
  if (settings.telemetry !== false) s.telemetry = initTelemetry(s);
  return s;
}
