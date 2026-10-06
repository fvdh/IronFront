// "Why did I lose?" — the objective loss classification of plan/fun-pass-verliesclassificatie.md, run on a match
// record. One rule set for coding playtest answers (phase 21) and the debrief screen (25.2).
import { BUILDINGS } from '../data/buildings';
import { TICK_RATE } from '../data/config';
import { UNITS } from '../data/units';
import type { MatchRecord } from '../systems/telemetry';
import { classOf, counters, type Ev, income2, type Match, playerMetrics, readMatch, snapAt, type UnitClass } from './meting';

export type Cause = 'EU' | 'ES' | 'PB' | 'SC' | 'BG' | 'SW' | 'OV' | 'VA';
/** Tie order for causes that trigger at the same moment: structural causes first. */
export const ORDER: Cause[] = ['EU', 'ES', 'PB', 'VA', 'SC', 'OV', 'SW', 'BG'];

/** Main numbers per category ("hoofdgetal"), calibrated once on nul-normal-medium and then frozen. */
export const VERLIES = {
  EU: { income: 1.5, minutes: 4 },
  ES: { haulers: 0.5, incomeDrop: 0.4, beforeTurn: false }, // beforeTurn: only losses up to the turning point K (proposal, see docs/metingen/grenzen.md)
  PB: { uptime: 0.5, unused: 3000, minutes: 3 },
  SC: { share: 0.6, counter: 0.1 },
  BG: { lost: 0.5 },
  SW: { share: 0.2 },
  OV: { share: 0.2 },
  VA: { before: 6, weaker: 0.5, endBefore: 12 },
};

export interface Classification { loser: number; turn: number; causes: Partial<Record<Cause, number>>; main: Cause | 'X' } // tick each cause triggers

const MIN = 60 * TICK_RATE;
const even = (r: number) => r >= 0.8 && r <= 1.25;
const valueOf = (def: string) => (BUILDINGS[def] ?? UNITS[def])?.cost ?? 0;

/** Classify the loss of `loser` (default: the player who did not win). null for a stalemate. */
export function classify(rec: MatchRecord, loser?: number): Classification | null {
  const m = readMatch(rec);
  const L = loser ?? m.players.find((p) => p !== rec.winner && rec.winner !== -1);
  if (L === undefined || rec.winner === -1 && loser === undefined) return null;
  const W = m.players.find((p) => p !== L)!;
  const army = (p: number, t: number) => snapAt(m, p, t)?.army ?? 0;
  const ratioAt = (t: number) => { const w = army(W, t); return w > 0 ? army(L, t) / w : 1; };
  const ls = m.snaps.get(L) ?? [];
  // Turning point K: last snapshot where the loser still had ≥ 0.8× the winner's army; never → first contact.
  const keep = ls.filter((s) => army(W, s.t) > 0 && s.army >= 0.8 * army(W, s.t));
  const K = keep.length ? keep[keep.length - 1].t : m.contact ?? 0;
  const from = K - 5 * MIN, inWin = (t: number) => t >= from && t <= m.T;
  const causes: Partial<Record<Cause, number>> = {};
  const set = (c: Cause, t: number | undefined) => { if (t !== undefined && inWin(t)) causes[c] = Math.min(causes[c] ?? Infinity, t); };
  const pm = playerMetrics(m, L);

  // EU: opponent income ≥ 1.5× for ≥ 4 min before K, no expansion, armies ~even at the start of it.
  if (pm.first.expansion === null && pm.secondCy === null) { // no refinery or CY by another field, no second CY
    let start: number | null = null;
    for (const s of ls) {
      if (s.t > K) break;
      const ok = income2(m, W, s.t) >= VERLIES.EU.income * Math.max(1, income2(m, L, s.t));
      if (!ok) { start = null; continue; }
      start ??= s.t;
      if (s.t - start >= VERLIES.EU.minutes * MIN && even(ratioAt(start))) { set('EU', s.t); break; }
    }
  }
  // ES: a refinery lost, or ≥ 50% of the haulers within 2 min, and income ≥ 40% down within 2 min.
  const lossEv = m.deaths.filter((d) => d.owner === L && d.by !== L && (d.def === 'refinery' || !!UNITS[d.def]?.harvester));
  for (const d of lossEv) {
    if (VERLIES.ES.beforeTurn && d.t > K) break;
    const before = snapAt(m, L, d.t - 2 * MIN)?.harv ?? 0;
    const lostH = lossEv.filter((x) => UNITS[x.def]?.harvester && x.t > d.t - 2 * MIN && x.t <= d.t).length;
    const hit = d.def === 'refinery' || (before > 0 && lostH >= VERLIES.ES.haulers * before);
    const inc0 = income2(m, L, d.t), inc1 = income2(m, L, d.t + 2 * MIN);
    if (hit && inc0 > 0 && inc1 <= (1 - VERLIES.ES.incomeDrop) * inc0) { set('ES', d.t); break; }
  }
  // PB: production uptime < 50% or > $3000 unused for ≥ 3 min, with income ~even.
  const S = [1, 2].map((c) => rec.telemetry.samples[L]?.[c] ?? '');
  const secs = Math.max(S[0].length, S[1].length), span = VERLIES.PB.minutes * 60;
  for (let i = span; i < secs; i++) {
    let have = 0, run = 0;
    for (let k = i - span; k < i; k++) { const a = S[0][k] ?? '-', b = S[1][k] ?? '-'; if (a === '-' && b === '-') continue; have++; if (a === 'L' || b === 'L') run++; }
    const t = (i + 1) * TICK_RATE;
    const idleRich = ls.filter((s) => s.t > t - span * TICK_RATE && s.t <= t);
    const unused = idleRich.length > 0 && idleRich.every((s) => { const k = s.t / TICK_RATE - 1; return s.credits > VERLIES.PB.unused && (S[0][k] === 'K' || S[1][k] === 'K'); });
    const incW = income2(m, W, t);
    if (((have && run / have < VERLIES.PB.uptime) || unused) && incW > 0 && even(income2(m, L, t) / incW)) { set('PB', t); if (causes.PB !== undefined) break; }
  }
  // Lost value in the window: deaths plus takeovers (mind control, capture, mutation).
  const took = m.ev.filter((e) => (e.type === 'mindControl' || e.type === 'captured' || e.type === 'mutated') && e.from === L && e.owner !== L && inWin(e.t)) as (Ev & { def: string })[];
  const died = m.deaths.filter((d) => d.owner === L && d.by !== L && inWin(d.t));
  const lostValue = died.reduce((a, d) => a + (d.cost ?? valueOf(d.def)), 0) + took.reduce((a, e) => a + valueOf(e.def), 0);
  // SC: ≥ 60% of the lost value by one enemy class, while < 10% of the loser's army had the counter role.
  if (lostValue > 0) {
    const byClass: Partial<Record<UnitClass, number>> = {};
    for (const d of died) if (d.killer && UNITS[d.killer]) byClass[classOf(d.killer)] = (byClass[classOf(d.killer)] ?? 0) + (d.cost ?? 0);
    for (const [c, v] of Object.entries(byClass) as [UnitClass, number][]) {
      if (v < VERLIES.SC.share * lostValue) continue;
      const ws = ls.filter((s) => inWin(s.t) && s.army > 0);
      const share = ws.length ? ws.reduce((a, s) => a + Object.entries(s.byDef).filter(([d]) => counters(d, c)).reduce((x, [, y]) => x + y, 0) / s.army, 0) / ws.length : 0;
      if (share < VERLIES.SC.counter) set('SC', K);
    }
  }
  // BG: one fight costs ≥ 50% of the loser's army, armies ~even before, end within 5 min.
  for (const f of m.fights) {
    const a = army(L, f.start);
    if (a > 0 && (f.lost[L] ?? 0) >= VERLIES.BG.lost * a && even(ratioAt(f.start)) && m.T - f.end <= 5 * MIN) { set('BG', f.start); break; }
  }
  // SW: superweapons ≥ 20% of the lost value, or a CY/factory lost to a shot within 3 min before K.
  const sw = died.filter((d) => d.cause === 'superweapon');
  const swValue = sw.reduce((a, d) => a + (d.cost ?? 0), 0);
  const keyLost = sw.find((d) => (d.def === 'cy' || d.def === 'factory') && d.t >= K - 3 * MIN && d.t <= K);
  if ((lostValue > 0 && swValue >= VERLIES.SW.share * lostValue) || keyLost) set('SW', (keyLost ?? sw[0])?.t);
  // OV: takeovers ≥ 20% of the lost value.
  const tookValue = took.reduce((a, e) => a + valueOf(e.def), 0);
  if (lostValue > 0 && tookValue >= VERLIES.OV.share * lostValue) set('OV', took[0]?.t);
  // VA: first enemy attack in the base before 6 min, loser < 0.5× army at first contact, over before 12 min.
  const raid = m.ev.find((e) => e.type === 'underAttack' && e.owner === L && e.by === W && !!BUILDINGS[e.def]);
  if (raid && raid.t < VERLIES.VA.before * MIN && m.contact !== null && ratioAt(m.contact) < VERLIES.VA.weaker && m.T < VERLIES.VA.endBefore * MIN) set('VA', raid.t);

  const found = (Object.entries(causes) as [Cause, number][]).sort((a, b) => a[1] - b[1] || ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]));
  return { loser: L, turn: K, causes, main: found.length ? found[0][0] : 'X' };
}

/** Score of a coded answer (0/1/2) against the script's result: 2 = names the main cause, 1 = another valid one. */
export function score(c: Classification, coded: Cause[]): 0 | 1 | 2 {
  if (coded.includes(c.main as Cause)) return 2;
  return coded.some((x) => c.causes[x] !== undefined) ? 1 : 0;
}

/** Match helper for tests: the classification of a match already read. */
export const classifyMatch = (m: Match, loser?: number) => classify(m.rec, loser);
