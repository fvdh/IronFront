// Match telemetry (Fun Pass phase 20, plan/fun-pass-plan.md 20.1). Read-only towards the simulation: it reads the
// state and writes only to `s.telemetry`; nothing in the sim reads it back, and it never draws random numbers.
import { BUILDINGS } from '../data/buildings';
import { TELEMETRY, TICK_RATE } from '../data/config';
import { UNITS } from '../data/units';
import type { Category, Entity, FactionId, GameEvent, GameSettings, GameState, Snapshot, Telemetry } from '../types';
import { capLeft, catalog, hasBuilding, missingRequirements, priceOf, PRODUCER, timeOf } from './production';

declare const __BUILD__: string | undefined;

/** Bumped on every change to the AI (systems/ai.ts), so runs on different AIs never get mixed up. */
export const AI_VERSION = 1;
/** Build id: version + bundle hash in a real build (vite define), 'dev' otherwise. */
export const BUILD: string = typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev';

const CATS: Category[] = ['building', 'infantry', 'vehicle'];
/** Per-second production state per queue: L running, G short of money, P paused/waiting for placement,
 *  K idle with money for something (choice-idle), A idle and too poor for anything, - no producer. */
export type QueueState = 'L' | 'G' | 'P' | 'K' | 'A' | '-';

/** Events kept in the record (fire and income are summarised in the snapshots instead). */
const SKIP = new Set<GameEvent['type']>(['fire', 'income', 'insufficient']);

export function initTelemetry(s: GameState): Telemetry {
  const { w, h } = s.map, n = w * h;
  // Fields: 8-connected groups of ore tiles at tick 0, including tiles within 2 of a mine.
  const ore = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (s.map.ore[i] > 0) ore[i] = 1;
  for (const m of s.map.oreSources) {
    const mx = m.i % w, my = Math.floor(m.i / w);
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const x = mx + dx, y = my + dy;
      if (x >= 0 && y >= 0 && x < w && y < h) ore[y * w + x] = 1;
    }
  }
  const fieldOf = new Uint16Array(n); // 0 = no field, else field id + 1
  const fieldOre: number[] = [], fieldPos: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    if (!ore[i] || fieldOf[i]) continue;
    const id = fieldOre.length, stack = [i];
    let total = 0, sx = 0, sy = 0, cnt = 0;
    fieldOf[i] = id + 1;
    while (stack.length) {
      const j = stack.pop()!, x = j % w, y = Math.floor(j / w);
      total += s.map.ore[j]; sx += x; sy += y; cnt++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const ax = x + dx, ay = y + dy, k = ay * w + ax;
        if (ax >= 0 && ay >= 0 && ax < w && ay < h && ore[k] && !fieldOf[k]) { fieldOf[k] = id + 1; stack.push(k); }
      }
    }
    fieldOre.push(total);
    fieldPos.push([sx / cnt + 0.5, sy / cnt + 0.5]);
  }
  return {
    build: BUILD, aiVersion: AI_VERSION, fieldOf, fieldOre, fieldPos,
    snaps: [], ev: [], dec: [],
    samples: s.players.map(() => ['', '', '']),
    acc: s.players.map((p) => ({ harvested: p.stats.harvested, stolen: 0, bonus: 0, credits: p.credits })),
  };
}

export function telemetryOnEvent(s: GameState, ev: GameEvent) {
  if (!s.telemetry || SKIP.has(ev.type)) return;
  s.telemetry.ev.push({ t: s.tick, ...ev });
}

/** A player's decision (human input or AI action). `dist` = how far armed units are sent (move/attack). */
export function logDecision(s: GameState, owner: number, kind: string, detail = '', dist?: number) {
  if (!s.telemetry || s.players[owner]?.neutral) return;
  s.telemetry.dec.push(dist === undefined ? [s.tick, owner, kind, detail] : [s.tick, owner, kind, detail, Math.round(dist * 10) / 10]);
}

/** End of every tick: per-second production samples, a snapshot every 10 s. */
export function telemetryTick(s: GameState) {
  const tm = s.telemetry;
  if (!tm || s.winner !== -1) return;
  if (s.tick % TICK_RATE === 0)
    for (const p of s.players) if (!p.neutral) for (let c = 0; c < 3; c++) tm.samples[p.id][c] += p.defeated ? '-' : queueState(s, p.id, CATS[c]);
  if (s.tick % TELEMETRY.snapshot === 0) for (const p of s.players) if (!p.neutral && !p.defeated) tm.snaps.push(snapshot(s, tm, p.id));
}

export function queueState(s: GameState, owner: number, cat: Category): QueueState {
  if (!hasBuilding(s, owner, PRODUCER[cat])) return '-';
  const p = s.players[owner], it = p.queues[cat][0];
  if (it) {
    if (it.hold || (cat === 'building' && p.ready)) return 'P';
    const pay = priceOf(s, owner, it.def) / (timeOf(it.def) * TICK_RATE);
    return p.credits >= pay ? 'L' : 'G';
  }
  if (cat === 'building' && p.ready) return 'P';
  const cheapest = Math.min(...available(s, owner, cat).map((d) => priceOf(s, owner, d)));
  return p.credits >= cheapest ? 'K' : 'A';
}

/** Defs the player could order right now (requirements met, under the cap). */
export const available = (s: GameState, owner: number, cat: Category) =>
  catalog(s, owner, cat).filter((d) => !missingRequirements(s, owner, d).length && capLeft(s, owner, d) > 0);

/** Value of the army: cost of living armed units, without harvesters and passengers. */
export const armed = (e: Entity) => e.kind === 'unit' && e.hp > 0 && !e.inside && !!UNITS[e.def].weapon && !UNITS[e.def].harvester;

function snapshot(s: GameState, tm: Telemetry, owner: number): Snapshot {
  const p = s.players[owner], a = tm.acc[owner];
  const stolen = p.stats.stolen ?? 0, bonus = p.stats.bonus ?? 0;
  const income = p.stats.harvested - a.harvested;
  // ponytail: spent = money in minus what is left; sell refunds and production refunds count as negative spending.
  const spent = Math.max(0, a.credits + income + (stolen - a.stolen) + (bonus - a.bonus) - p.credits);
  const snap: Snapshot = {
    t: s.tick, p: owner, credits: Math.round(p.credits), income, stolen: stolen - a.stolen, bonus: bonus - a.bonus, spent: Math.round(spent),
    army: 0, bld: 0, inf: 0, veh: 0, air: 0, sea: 0, cy: 0, harv: 0, power: p.powerMade - p.powerUsed,
    fields: [], options: CATS.map((c) => available(s, owner, c).length), conc: null, byDef: {},
  };
  tm.acc[owner] = { harvested: p.stats.harvested, stolen, bonus, credits: p.credits };
  const units: Entity[] = [];
  for (const e of s.entities) {
    if (e.owner !== owner || e.hp <= 0) continue;
    if (e.kind === 'building') {
      const d = BUILDINGS[e.def];
      if (e.def === 'cy') snap.cy++;
      if (e.built >= 1 && !d.wall && !d.bridge) snap.bld += (d.cost * e.hp) / d.hp;
      continue;
    }
    const d = UNITS[e.def];
    if (d.harvester) snap.harv++;
    if (d.air) snap.air++; else if (d.move === 'water') snap.sea++; else if (d.category === 'infantry') snap.inf++; else snap.veh++;
    if (!armed(e)) continue;
    snap.army += d.cost;
    snap.byDef[e.def] = (snap.byDef[e.def] ?? 0) + d.cost;
    units.push(e);
  }
  snap.bld = Math.round(snap.bld);
  if (snap.army >= TELEMETRY.concMinArmy) snap.conc = Math.round((biggestCluster(units, TELEMETRY.clusterGap) / snap.army) * 100) / 100;
  const ore = new Array(tm.fieldOre.length).fill(0);
  for (let i = 0; i < tm.fieldOf.length; i++) if (tm.fieldOf[i]) ore[tm.fieldOf[i] - 1] += s.map.ore[i];
  // ponytail: the field state is the same for every player; stored per snapshot to keep the record flat.
  snap.fields = ore.map((v, k) => (tm.fieldOre[k] ? Math.round((v / tm.fieldOre[k]) * 100) : 0));
  return snap;
}

/** Value of the largest single-linkage cluster (gap in tiles). ponytail: O(n²), fine for a few hundred units. */
export function biggestCluster(us: { x: number; y: number; def: string }[], gap: number): number {
  const seen = new Uint8Array(us.length);
  let best = 0;
  for (let i = 0; i < us.length; i++) {
    if (seen[i]) continue;
    seen[i] = 1;
    let v = 0;
    const stack = [i];
    while (stack.length) {
      const a = us[stack.pop()!];
      v += UNITS[a.def].cost;
      for (let j = 0; j < us.length; j++) if (!seen[j] && Math.hypot(us[j].x - a.x, us[j].y - a.y) <= gap) { seen[j] = 1; stack.push(j); }
    }
    best = Math.max(best, v);
  }
  return best;
}

/** One match as exported ("Export match data", balance runs): settings, players and the telemetry (Fun Pass 20.4). */
export interface MatchRecord {
  format: 'iron-front-match';
  build: string;
  aiVersion: number;
  settings: GameSettings;
  players: { id: number; name: string; faction: FactionId; ai: boolean; difficulty?: string; startX: number; startY: number }[];
  winner: number; // -1 = no winner (stalemate at the time limit)
  tick: number;
  telemetry: Omit<Telemetry, 'fieldOf' | 'acc'> & { fieldOf: number[] };
}

export function matchRecord(s: GameState): MatchRecord | null {
  const tm = s.telemetry;
  if (!tm) return null;
  const { fieldOf, acc: _acc, ...rest } = tm;
  return {
    format: 'iron-front-match', build: tm.build, aiVersion: tm.aiVersion, settings: s.settings,
    players: s.players.filter((p) => !p.neutral).map((p) => ({
      id: p.id, name: p.name, faction: p.faction, ai: p.ai, startX: p.startX, startY: p.startY,
      difficulty: p.ai ? s.ai.find((a) => a.player === p.id)?.difficulty ?? s.settings.difficulty : undefined,
    })),
    winner: s.winner, tick: s.tick, telemetry: { ...rest, fieldOf: Array.from(fieldOf) },
  };
}
