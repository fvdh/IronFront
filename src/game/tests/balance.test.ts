// AI-vs-AI balance sweep and Fun Pass measuring runs (plan/fun-pass-plan.md 20.5/20.6). Opt-in (slow).
//   BALANCE=all npx vitest run balance            full crossing: 9 faction pairs × maps × BALANCE_SEEDS seeds
//   BALANCE=12 …                                  only the first 12 games of that crossing
// Options: BALANCE_MAPS=coast,islands · BALANCE_SEEDS=3 · BALANCE_SEED=1000 (base) · BALANCE_SIZE=small|medium
//   BALANCE_DIFF=hard,hard · BALANCE_NOSW=1 (no superweapons) · BALANCE_ORE=v12|v14 · BALANCE_NOTOWN=1
//   BALANCE_PART=2/4 (2nd quarter of the games, to run in parallel) · BALANCE_MIRROR=1 (mirrors only: seat bias)
//   BALANCE_REPORT=<label>: docs/metingen/<date>-<label>.md + .json (metrics per game) · BALANCE_RAW=1: also the telemetry
//   BALANCE_CONTROL=<json>: the same run without superweapons, for the over-win (20.2-D)
//   COMPARE=a.json,b.json npx vitest run balance: comparison report next to b
// @ts-expect-error no Node typings in this project; vitest runs in Node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { DIFFICULTY, TICK_RATE } from '../data/config';
import { matchRecord, type MatchRecord } from '../systems/telemetry';
import type { Difficulty, FactionId, GameSettings } from '../types';
import { compare, matchMetrics, report, type Run } from './meting';
import { classify } from './verlies';

declare const process: { env: Record<string, string | undefined> };
const env = process.env;
// BALANCE_HARD='{"towers":2}' tweaks the hard profile for an A/B run.
if (env.BALANCE_HARD) Object.assign(DIFFICULTY.hard, JSON.parse(env.BALANCE_HARD));
const [D0, D1] = (env.BALANCE_DIFF ?? 'hard,hard').split(',') as Difficulty[];
const FACTIONS: FactionId[] = ['allies', 'soviets', 'psi'];
const MAPS = (env.BALANCE_MAPS ?? 'plains,rivers,highlands').split(',');
const SEEDS = Number(env.BALANCE_SEEDS ?? 3);
const TOWN = !env.BALANCE_NOTOWN; // civilians, tech buildings, bridges and crates (as in the setup screen)

/** The full crossing (decision 16): faction pair × map × seed, so faction and map are never confounded. */
export function crossing(): { f0: FactionId; f1: FactionId; map: string; seed: number }[] {
  const out = [];
  for (const f0 of FACTIONS) for (const f1 of FACTIONS) {
    if (env.BALANCE_MIRROR && f0 !== f1) continue;
    for (const map of MAPS) for (let k = 0; k < SEEDS; k++) out.push({ f0, f1, map, seed: Number(env.BALANCE_SEED ?? 1000) + k });
  }
  return out;
}

/** One AI-vs-AI game to the end (or 30 min = stalemate). */
export function playMatch(g: { f0: FactionId; f1: FactionId; map: string; seed: number }, extra: Partial<GameSettings> = {}, limitMin = 30) {
  const s = createGame({
    ...DEFAULT_SETTINGS, seed: g.seed, difficulty: D1, mapSize: (env.BALANCE_SIZE as GameSettings['mapSize']) ?? 'small', mapPreset: g.map,
    faction: g.f0, enemyFaction: g.f1, town: TOWN, crates: TOWN, superweapons: !env.BALANCE_NOSW,
    ...(env.BALANCE_ORE ? { oreRules: env.BALANCE_ORE as GameSettings['oreRules'] } : {}), ...extra,
  });
  s.players[0].ai = true;
  s.ai.unshift({ player: 0, nextThink: 0, attackWave: 0, nextAttack: DIFFICULTY[D0].firstAttack * TICK_RATE, attacking: [], lastPlace: 0, difficulty: D0 });
  s.ai[1].difficulty = D1;
  s.ai[1].nextAttack = DIFFICULTY[D1].firstAttack * TICK_RATE;
  const limit = limitMin * 60 * TICK_RATE;
  while (s.tick < limit && s.winner === -1) tick(s);
  return s;
}

const N = env.BALANCE === 'all' ? Infinity : Number(env.BALANCE ?? 0);

describe.skipIf(!N)('balance', () => {
  it('AI vs AI sweep', () => {
    let games = crossing().slice(0, N);
    if (env.BALANCE_PART) { const [k, n] = env.BALANCE_PART.split('/').map(Number); games = games.filter((_, i) => i % n === k - 1); }
    const rows: string[] = [], records: MatchRecord[] = [];
    const wins = [0, 0], byFaction: Record<string, number> = {};
    let draws = 0;
    for (const g of games) {
      const s = playMatch(g);
      const rec = matchRecord(s)!;
      records.push(rec);
      if (s.winner === -1) draws++;
      else { wins[s.winner]++; const f = s.players[s.winner].faction; byFaction[f] = (byFaction[f] ?? 0) + 1; }
      const stat = s.players.filter((p) => !p.neutral).map((p, i) => {
        const own = s.entities.filter((e) => e.owner === i && e.hp > 0);
        return `${p.faction}: $${Math.round(p.credits)} b${own.filter((e) => e.kind === 'building').length} u${own.filter((e) => e.kind === 'unit').length}`;
      }).join(' | ');
      rows.push(`${g.map} s${g.seed} ${g.f0} v ${g.f1} → ${s.winner === -1 ? 'DRAW' : 'P' + s.winner} @${(s.tick / TICK_RATE / 60).toFixed(1)}m  ${stat}`);
    }
    console.log(rows.join('\n') + `\nP0 ${wins[0]} · P1 ${wins[1]} · draws ${draws} · ${JSON.stringify(byFaction)}`);
    if (!env.BALANCE_REPORT) return;
    const date = new Date().toISOString().slice(0, 10);
    const settings: Record<string, string> = {
      maps: MAPS.join(','), seeds: `${SEEDS} vanaf ${env.BALANCE_SEED ?? 1000}`, size: env.BALANCE_SIZE ?? 'small', diff: `${D0},${D1}`,
      superwapens: env.BALANCE_NOSW ? 'uit' : 'aan', ore: env.BALANCE_ORE ?? 'v12 (standaard)', stad: TOWN ? 'aan' : 'uit', ...(env.BALANCE_PART ? { deel: env.BALANCE_PART } : {}),
    };
    const run: Run = { label: env.BALANCE_REPORT, date, settings, matches: records.map((r) => { const c = classify(r); return { ...matchMetrics(r), loss: c && { main: c.main, causes: Object.keys(c.causes) } }; }) };
    const control = env.BALANCE_CONTROL ? (JSON.parse(readFileSync(env.BALANCE_CONTROL, 'utf8')) as Run) : undefined;
    mkdirSync('docs/metingen', { recursive: true });
    const base = `docs/metingen/${date}-${env.BALANCE_REPORT}`;
    writeFileSync(`${base}.json`, JSON.stringify(run));
    writeFileSync(`${base}.md`, report(run, control));
    if (env.BALANCE_RAW) writeFileSync(`${base}.raw.json`, JSON.stringify(records));
    console.log(`→ ${base}.md`);
  }, 24 * 3_600_000);
});

describe.skipIf(!env.COMPARE)('compare', () => {
  it('two runs', () => {
    const [a, b] = env.COMPARE!.split(',').map((f) => JSON.parse(readFileSync(f, 'utf8')) as Run);
    const out = env.COMPARE!.split(',')[1].replace(/\.json$/, '') + `-vs-${a.label}.md`;
    writeFileSync(out, compare(a, b));
    console.log(`→ ${out}`);
  });
});
