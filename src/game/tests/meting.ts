// Fun Pass metrics (plan/fun-pass-plan.md 20.2): pure functions from a match record (telemetry export) to numbers.
// Read by balance.test.ts (BALANCE_REPORT), the comparison (COMPARE) and verlies.ts. No grenzen here: only measuring.
import { BUILDINGS } from '../data/buildings';
import { TELEMETRY, TICK_RATE } from '../data/config';
import { UNITS } from '../data/units';
import { WEAPONS } from '../data/weapons';
import type { GameEvent, Snapshot } from '../types';
import type { MatchRecord } from '../systems/telemetry';

export type Ev = GameEvent & { t: number };
export type Phase = 'opening' | 'contact' | 'midgame' | 'lategame' | 'end';
export const PHASES: Phase[] = ['opening', 'contact', 'midgame', 'lategame', 'end'];
const MIN = 60 * TICK_RATE;
export const min = (t: number) => Math.round((t / MIN) * 100) / 100;
const costOf = (def: string) => (BUILDINGS[def] ?? UNITS[def])?.cost ?? 0;

// ------------------------------------------------------------------ small statistics

export function median(xs: number[]): number | null {
  const v = xs.filter((x) => x !== null && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}
export function quantile(xs: number[], q: number): number | null {
  const v = xs.filter((x) => x !== null && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const i = (v.length - 1) * q, lo = Math.floor(i);
  return v[lo] + (v[Math.min(lo + 1, v.length - 1)] - v[lo]) * (i - lo);
}
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
/** 95% Wilson score interval for k successes out of n. */
export function wilson(k: number, n: number): [number, number] {
  if (!n) return [0, 1];
  const z = 1.96, p = k / n, d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}

// ------------------------------------------------------------------ definitions shared by every metric (20.0)

export type Role = 'antiArmor' | 'aa' | 'antiInf' | 'economy' | 'defense' | 'tech' | 'superweapon' | 'other';
export type UnitClass = 'inf' | 'veh' | 'air' | 'sea';

const needsLab = new Map<string, boolean>();
/** `lab` or anything that needs it, directly or through another requirement. */
export function isTech(def: string): boolean {
  if (def === 'lab') return true;
  if (needsLab.has(def)) return needsLab.get(def)!;
  needsLab.set(def, false); // cycle guard
  const r = (BUILDINGS[def] ?? UNITS[def])?.requires ?? [];
  const v = r.some(isTech);
  needsLab.set(def, v);
  return v;
}

/** Role from data, in the order of 20.2: anti-armour if versus.heavy ≥ versus.none, else AA, else anti-infantry. */
export function roleOf(def: string): Role {
  const b = BUILDINGS[def];
  if (b) return b.superweapon ? 'superweapon' : def === 'refinery' ? 'economy' : b.weapon ? 'defense' : isTech(def) ? 'tech' : 'other';
  const u = UNITS[def];
  if (u.harvester) return 'economy';
  const w = WEAPONS[u.weapon ?? ''];
  if (!w) return 'other';
  if (w.versus.heavy >= w.versus.none) return 'antiArmor';
  if (w.aa || w.airOnly) return 'aa';
  return 'antiInf';
}
const hasAA = (def: string) => !!UNITS[def] && [UNITS[def].weapon, UNITS[def].weapon2].some((w) => w && (WEAPONS[w]?.aa || WEAPONS[w]?.airOnly));
export const classOf = (def: string): UnitClass => (UNITS[def].air ? 'air' : UNITS[def].move === 'water' ? 'sea' : UNITS[def].category === 'infantry' ? 'inf' : 'veh');
/** Does `def` carry the counter role against units of this class (table "Counterrol per klasse")? */
export function counters(def: string, c: UnitClass): boolean {
  if (!UNITS[def]) return false;
  const r = roleOf(def), w = WEAPONS[UNITS[def].weapon ?? ''];
  if (c === 'inf') return r === 'antiInf';
  if (c === 'veh') return r === 'antiArmor';
  if (c === 'air') return r === 'aa' || hasAA(def);
  return !!w && (!!w.navalOnly || !!w.sub || (r === 'antiArmor' && w.range >= 6));
}
const armedDef = (def: string) => !!UNITS[def]?.weapon && !UNITS[def].harvester;

/** Phase windows in ticks (20.0); null = does not occur. T = duration, C = first contact. */
export function phaseWindows(T: number, C: number | null): Record<Phase, [number, number] | null> {
  const m = (x: number) => x * MIN;
  return {
    opening: [0, Math.min(m(5), T)],
    contact: C === null ? null : [Math.max(0, C - m(1)), Math.min(T, C + m(2))],
    midgame: m(5) < Math.min(m(15), T - m(3)) ? [m(5), Math.min(m(15), T - m(3))] : null,
    lategame: T >= m(18) ? [m(15), T - m(3)] : null,
    end: [Math.max(0, T - m(3)), T],
  };
}

// ------------------------------------------------------------------ the record, read once

export interface Match {
  rec: MatchRecord;
  ev: Ev[];
  T: number;
  players: number[]; // non-neutral player ids
  snaps: Map<number, Snapshot[]>;
  deaths: (Ev & { type: 'death' })[];
  contact: number | null;
  fights: Fight[];
  windows: Record<Phase, [number, number] | null>;
}
export interface Fight { start: number; end: number; x: number; y: number; lost: Record<number, number> } // armed value lost per player

export function readMatch(rec: MatchRecord): Match {
  const tm = rec.telemetry, ev = tm.ev as Ev[];
  const players = rec.players.map((p) => p.id);
  const isPlayer = (id: number | undefined) => id !== undefined && players.includes(id);
  const snaps = new Map(players.map((p) => [p, tm.snaps.filter((s) => s.p === p)]));
  const deaths = ev.filter((e): e is Ev & { type: 'death' } => e.type === 'death');
  const contactEv = ev.find((e) => (e.type === 'underAttack' || e.type === 'death') && isPlayer(e.owner) && isPlayer(e.by) && e.by !== e.owner);
  const contact = contactEv ? contactEv.t : null;
  return { rec, ev, T: rec.tick, players, snaps, deaths, contact, fights: fights(deaths.filter((d) => isPlayer(d.owner) && isPlayer(d.by) && d.by !== d.owner)), windows: phaseWindows(rec.tick, contact) };
}

/** Fights: deaths within 8 tiles and 30 s of each other (single-linkage). */
export function fights(ds: (Ev & { type: 'death' })[]): Fight[] {
  const gapT = 30 * TICK_RATE, sorted = [...ds].sort((a, b) => a.t - b.t);
  const parent = sorted.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < sorted.length; i++)
    for (let j = i + 1; j < sorted.length && sorted[j].t - sorted[i].t <= gapT; j++)
      if (Math.hypot(sorted[i].x - sorted[j].x, sorted[i].y - sorted[j].y) <= 8) parent[find(j)] = find(i);
  const groups = new Map<number, (Ev & { type: 'death' })[]>();
  sorted.forEach((d, i) => { const r = find(i); groups.set(r, [...(groups.get(r) ?? []), d]); });
  return [...groups.values()].map((g) => {
    const lost: Record<number, number> = {};
    for (const d of g) if (d.kind === 'unit' && armedDef(d.def)) lost[d.owner] = (lost[d.owner] ?? 0) + (d.cost ?? costOf(d.def));
    return { start: g[0].t, end: g[g.length - 1].t, x: g[0].x, y: g[0].y, lost };
  }).sort((a, b) => a.start - b.start);
}

/** Last snapshot of `p` at or before tick t. */
export function snapAt(m: Match, p: number, t: number): Snapshot | undefined {
  const ss = m.snaps.get(p) ?? [];
  let best: Snapshot | undefined;
  for (const s of ss) { if (s.t > t) break; best = s; }
  return best;
}
/** Income (harvested + stolen + bonus) over the 2 minutes up to t. */
export function income2(m: Match, p: number, t: number): number {
  return (m.snaps.get(p) ?? []).filter((s) => s.t > t - 2 * MIN && s.t <= t).reduce((a, s) => a + s.income + s.stolen + s.bonus, 0);
}
const ratio = (a: number, b: number) => (b > 0 ? a / b : a > 0 ? Infinity : 1);
const opponent = (m: Match, p: number) => m.players.find((q) => q !== p) ?? -1;

// ------------------------------------------------------------------ B. choice density

export interface Decision { t: number; kind: string; detail: string; dist?: number }
/** Meaningful decisions of player p (definition under 20.2-B), repeated clicks within 2 s counted once. */
export function meaningful(m: Match, p: number): Decision[] {
  const out: Decision[] = [], lastQ: Record<string, string> = {}, last = new Map<string, number>();
  for (const [t, owner, kind, detail, dist] of m.rec.telemetry.dec) {
    if (owner !== p) continue;
    let ok = false;
    if (kind === 'queue') { const c = BUILDINGS[detail] ? 'building' : UNITS[detail]?.category ?? '?'; ok = lastQ[c] !== detail; lastQ[c] = detail; }
    else if (kind === 'move' || kind === 'attackMove' || kind === 'attack') ok = (dist ?? 0) >= 6;
    else ok = ['place', 'ability', 'power', 'sell', 'capture'].includes(kind);
    if (!ok) continue;
    const key = `${kind}|${detail}`;
    if (t - (last.get(key) ?? -1e9) < 2 * TICK_RATE) continue;
    last.set(key, t);
    out.push({ t, kind, detail, dist });
  }
  return out;
}

/** Per-second production samples of player p for queue c (0 building, 1 infantry, 2 vehicle); second k ends at tick (k+1)·30. */
const samples = (m: Match, p: number, c: number) => m.rec.telemetry.samples[p]?.[c] ?? '';
function pctIn(str: string, from: number, to: number, hit: string, of = 'LGPKA'): number | null {
  let n = 0, k = 0;
  for (let i = Math.floor(from / TICK_RATE); i < Math.min(str.length, Math.ceil(to / TICK_RATE)); i++) if (of.includes(str[i])) { n++; if (hit.includes(str[i])) k++; }
  return n ? k / n : null;
}

export interface ChoiceDensity {
  choiceIdle: number | null; // main metric: mean of the infantry and vehicle queues
  perQueue: (number | null)[]; // building, infantry, vehicle
  byPhase: Record<Phase, number | null>;
  moneyShort: number | null; poorIdle: number | null;
  uptime: number | null;
  unusedMoney: { mean: number | null; creditSeconds: number };
  options: (number | null)[]; breadth: number | null;
  quiet: { longest: number | null; median: number | null; pctLong: number | null }; // seconds; share of play time
  dominant: { mean: number | null; pctOver50: number | null };
  planShifts: { total: number; byPhase: Record<Phase, number> };
}

export function choiceDensity(m: Match, p: number): ChoiceDensity {
  const units = [1, 2].map((c) => samples(m, p, c));
  const both = (f: (s: string) => number | null) => { const v = units.map(f).filter((x): x is number => x !== null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const byPhase = {} as Record<Phase, number | null>;
  for (const ph of PHASES) { const w = m.windows[ph]; byPhase[ph] = w ? both((s) => pctIn(s, w[0], w[1], 'K')) : null; }
  // uptime & unused money, second by second over the unit queues
  const ss = m.snaps.get(p) ?? [];
  let have = 0, run = 0, idleSecs = 0, credSum = 0, si = 0;
  const len = Math.max(...units.map((u) => u.length), 0);
  for (let i = 0; i < len; i++) {
    const st = units.map((u) => u[i] ?? '-');
    if (st.every((x) => x === '-')) continue;
    have++;
    if (st.includes('L')) run++;
    if (st.includes('K')) {
      const t = (i + 1) * TICK_RATE;
      while (si + 1 < ss.length && ss[si + 1].t <= t) si++;
      // ponytail: credits from the nearest earlier snapshot (10 s grid), not per second.
      if (ss[si]) { idleSecs++; credSum += ss[si].credits; }
    }
  }
  const dec = meaningful(m, p);
  const gaps = dec.slice(1).map((d, i) => (d.t - dec[i].t) / TICK_RATE);
  const play = m.T / TICK_RATE;
  const long = gaps.filter((g) => g >= TELEMETRY.quietGap).reduce((a, b) => a + b, 0);
  const dom = ss.filter((s) => s.army > 0).map((s) => Math.max(...Object.values(s.byDef)) / s.army);
  // breadth: distinct defs ordered in the last 2 minutes, per snapshot
  const enq = m.ev.filter((e) => e.type === 'enqueued' && e.owner === p) as (Ev & { type: 'enqueued' })[];
  const breadth = ss.map((s) => new Set(enq.filter((e) => e.t > s.t - 2 * MIN && e.t <= s.t).map((e) => e.def)).size);
  return {
    choiceIdle: both((s) => pctIn(s, 0, m.T, 'K')),
    perQueue: [0, 1, 2].map((c) => pctIn(samples(m, p, c), 0, m.T, 'K')),
    byPhase,
    moneyShort: both((s) => pctIn(s, 0, m.T, 'G')), poorIdle: both((s) => pctIn(s, 0, m.T, 'A')),
    uptime: have ? run / have : null,
    unusedMoney: { mean: idleSecs ? credSum / idleSecs : null, creditSeconds: Math.round(credSum) },
    options: [0, 1, 2].map((c) => median(ss.map((s) => s.options[c]))), breadth: median(breadth),
    quiet: { longest: gaps.length ? Math.max(...gaps) : null, median: median(gaps), pctLong: play ? long / play : null },
    dominant: { mean: mean(dom), pctOver50: dom.length ? dom.filter((d) => d > 0.5).length / dom.length : null },
    planShifts: planShifts(m, enq),
  };
}

/** Spending per 60 s window over roles; a shift = L1 distance ≥ TELEMETRY.planShift between consecutive (non-empty) windows. */
export function planShifts(m: Match, enq: { t: number; def: string }[]) {
  const W = MIN, wins: Record<string, number>[] = [];
  for (const e of enq) { const k = Math.floor(e.t / W); (wins[k] ??= {})[roleOf(e.def)] = (wins[k]?.[roleOf(e.def)] ?? 0) + costOf(e.def); }
  const byPhase = Object.fromEntries(PHASES.map((p) => [p, 0])) as Record<Phase, number>;
  let total = 0, prev: Record<string, number> | null = null;
  wins.forEach((w, k) => {
    if (!w) return;
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    const norm = Object.fromEntries(Object.entries(w).map(([r, v]) => [r, v / sum]));
    if (prev) {
      const roles = new Set([...Object.keys(prev), ...Object.keys(norm)]);
      let d = 0;
      for (const r of roles) d += Math.abs((norm[r] ?? 0) - (prev[r] ?? 0));
      if (d >= TELEMETRY.planShift) {
        total++;
        const t = k * W;
        for (const ph of PHASES) { const win = m.windows[ph]; if (win && t >= win[0] && t < win[1]) byPhase[ph]++; }
      }
    }
    prev = norm;
  });
  return { total, byPhase };
}

// ------------------------------------------------------------------ C. time to the first meaningful decision

export interface FirstMoments {
  expansion: number | null; tech: number | null; ecoAttack: number | null;
  defense: number | null; defenseReaction: number | null; // minutes; reaction in seconds
  counter: number | null; factionMechanic: number | null; strategic: number | null;
}

/** Field nearest to (x, y) (by field centre). */
function nearestField(m: Match, x: number, y: number): number {
  let best = -1, bd = Infinity;
  m.rec.telemetry.fieldPos.forEach(([fx, fy], k) => { const d = Math.hypot(fx - x, fy - y); if (d < bd) { bd = d; best = k; } });
  return best;
}
export const startField = (m: Match, p: number) => { const pl = m.rec.players.find((q) => q.id === p)!; return nearestField(m, pl.startX, pl.startY); };
/** Start fields (frozen, docs/metingen/grenzen.md §4): every field whose centre lies within this many tiles of the start. */
export const START_FIELD_RADIUS = 10;
export function startFields(m: Match, p: number): Set<number> {
  const pl = m.rec.players.find((q) => q.id === p)!, out = new Set<number>([startField(m, p)]);
  m.rec.telemetry.fieldPos.forEach(([fx, fy], k) => { if (Math.hypot(fx - pl.startX, fy - pl.startY) <= START_FIELD_RADIUS) out.add(k); });
  return out;
}

/** Faction mechanics (frozen with the plan, 20.2-C): the first event that shows the faction's own trick. */
export const FACTION_MECHANICS: Record<string, (e: Ev, p: number) => boolean> = {
  psi: (e, p) => e.type === 'mindControl' && e.owner === p,
  soviets: (e, p) => e.type === 'ability' && e.owner === p && ['leech', 'arccharge', 'irradiate'].includes(e.ability),
  allies: (e, p) => e.type === 'ability' && e.owner === p && ['teleport', 'ambush', 'digin'].includes(e.ability),
};

export function firstMoments(m: Match, p: number): FirstMoments {
  const sf = startFields(m, p), faction = m.rec.players.find((q) => q.id === p)!.faction;
  const firstT = (f: (e: Ev) => boolean) => m.ev.find(f)?.t ?? null;
  // expansion: first finished refinery or deployed CY whose nearest field is not a start field
  const expansion = firstT((e) => (e.type === 'placed' || e.type === 'deployed') && e.owner === p && (e.def === 'refinery' || e.def === 'cy') && e.x !== undefined && !sf.has(nearestField(m, e.x, e.y!)));
  const tech = firstT((e) => (e.type === 'enqueued' && e.owner === p && isTech(e.def)) || (e.type === 'captured' && e.owner === p && !!BUILDINGS[e.def]?.neutralOnly && !BUILDINGS[e.def].garrison && !BUILDINGS[e.def].bridge));
  const ecoAttack = firstT((e) => (e.type === 'underAttack' || e.type === 'death') && e.by === p && e.owner !== p && (e.def === 'refinery' || !!UNITS[e.def]?.harvester));
  // first defensive reaction
  let defense: number | null = null, defenseReaction: number | null = null;
  const hit = m.ev.find((e) => e.type === 'underAttack' && e.owner === p && e.by !== undefined && e.by !== p && m.players.includes(e.by) && (!!BUILDINGS[e.def] || !!UNITS[e.def]?.harvester)) as (Ev & { type: 'underAttack' }) | undefined;
  if (hit) {
    for (const [t, owner, kind, detail] of m.rec.telemetry.dec) {
      if (owner !== p || t < hit.t || t > hit.t + MIN) continue;
      const near = (kind === 'move' || kind === 'attackMove') && (() => { const [x, y] = detail.split(',').map(Number); return Math.hypot(x - hit.x, y - hit.y) <= 8; })();
      if (near || kind === 'repair' || (kind === 'queue' && roleOf(detail) === 'defense')) { defense = t; defenseReaction = (t - hit.t) / TICK_RATE; break; }
    }
  }
  // first counter-production. ponytail: uses the enemy's real army (snapshots), not only what this player had seen.
  let counter: number | null = null;
  const lastRole = new Map<UnitClass, number>();
  for (const e of m.ev) {
    if (e.type !== 'enqueued' || e.owner !== p || !UNITS[e.def]) continue;
    const s = snapAt(m, opponent(m, p), e.t);
    if (s && s.army > 0) {
      const byClass: Record<string, number> = {};
      for (const [d, v] of Object.entries(s.byDef)) byClass[classOf(d)] = (byClass[classOf(d)] ?? 0) + v;
      const top = Object.entries(byClass).sort((a, b) => b[1] - a[1])[0][0] as UnitClass;
      if (counters(e.def, top) && e.t - (lastRole.get(top) ?? -1e9) > MIN) { counter = e.t; break; }
    }
    for (const c of ['inf', 'veh', 'air', 'sea'] as UnitClass[]) if (counters(e.def, c)) lastRole.set(c, e.t);
  }
  const fm = FACTION_MECHANICS[faction];
  const factionMechanic = fm ? firstT((e) => fm(e, p)) : null;
  const all = [expansion, tech, ecoAttack, counter, factionMechanic].filter((x): x is number => x !== null);
  const mm = (x: number | null) => (x === null ? null : min(x));
  return { expansion: mm(expansion), tech: mm(tech), ecoAttack: mm(ecoAttack), defense: mm(defense), defenseReaction, counter: mm(counter), factionMechanic: mm(factionMechanic), strategic: all.length ? min(Math.min(...all)) : null };
}

// ------------------------------------------------------------------ A, D, E, F per match

export interface Superweapon {
  shooter: number; t: number; def: string;
  total: number; army: number; income: number; // shooter : opponent, last snapshot before the shot
  bucket: 'ahead' | 'even' | 'behind'; bucketArmy: 'ahead' | 'even' | 'behind';
  outIn90: boolean; behindIn90: boolean; shooterWon: boolean;
  lost90: number; lost90sw: number; // opponent value lost in the 90 s after, and the part by superweapons
}
const bucket = (r: number) => (r > 1.25 ? 'ahead' : r < 0.8 ? 'behind' : 'even');

export function superweapon(m: Match): Superweapon | null {
  const shot = m.ev.find((e) => e.type === 'superweapon' && e.phase === 'fired') as (Ev & { type: 'superweapon' }) | undefined;
  if (!shot) return null;
  const a = shot.owner, b = opponent(m, a), sa = snapAt(m, a, shot.t - 1), sb = snapAt(m, b, shot.t - 1);
  if (!sa || !sb) return null;
  const tot = (s: Snapshot) => s.army + s.bld + s.credits;
  const end = shot.t + 90 * TICK_RATE;
  const outIn90 = m.ev.some((e) => e.type === 'defeated' && e.owner === b && e.t <= end);
  const after = (m.snaps.get(b) ?? []).filter((s) => s.t > shot.t);
  const armyA = (t: number) => snapAt(m, a, t)?.army ?? 0;
  const k = after.findIndex((s) => s.t <= end && s.army <= 0.5 * armyA(s.t));
  const behindIn90 = k >= 0 && after.slice(k).every((s) => s.army < 0.8 * armyA(s.t));
  const lost = m.deaths.filter((d) => d.owner === b && d.t > shot.t && d.t <= end);
  return {
    shooter: a, t: shot.t, def: shot.def,
    total: ratio(tot(sa), tot(sb)), army: ratio(sa.army, sb.army), income: ratio(income2(m, a, shot.t), income2(m, b, shot.t)),
    bucket: bucket(ratio(tot(sa), tot(sb))), bucketArmy: bucket(ratio(sa.army, sb.army)),
    outIn90, behindIn90, shooterWon: m.rec.winner === a,
    lost90: lost.reduce((s, d) => s + (d.cost ?? 0), 0), lost90sw: lost.filter((d) => d.cause === 'superweapon').reduce((s, d) => s + (d.cost ?? 0), 0),
  };
}

export interface PlayerMetrics {
  id: number; faction: string; ai: boolean; won: boolean;
  first: FirstMoments; choice: ChoiceDensity;
  conc: Record<Phase, number | null>;
  incomePerMin: number[]; spentPerMin: number[];
  fieldsWithRefinery: number; secondCy: number | null; startFieldLow: number | null;
  rigIncome: number | null; // credits from captured Fuel Rigs (null: export before the field existed)
  harass: { raw: number; net: number }[]; // per raid on this player's economy: income lost in minutes of income; net = minus the attacker's own drop (see harassment())
}
export interface MatchMetrics {
  seed: number; map: string; size: string; build: string; aiVersion: number; superweapons: boolean; oreRules: string;
  factions: string[]; winner: number; duration: number; stalemate: boolean;
  firstContact: number | null; ttkFirstFight: number | null; biggestFight: number | null;
  leads: Record<string, { army: number; income: number } | null>; // p0 : p1 at 5/10/15/20 min
  superweapon: Superweapon | null;
  snowball10: { leader: number; won: boolean } | null;
  comeback: boolean; decisive: { any: boolean; after15: boolean };
  fieldLow: (number | null)[]; // per field: first minute below 25%
  totalRatio: (number | null)[]; // per minute: total value (army + buildings + credits) p0 : p1 (control for the superweapon over-win)
  players: PlayerMetrics[];
  loss?: { main: string; causes: string[] } | null; // loss classification (verlies.ts), filled in by the run
  units: Record<string, UnitStat>; // all players together, per unit type
  unitsByPlayer: Record<number, Record<string, UnitStat & { taken: number; lost: number; free: number }>>; // per player; taken = gained by takeover, lost = taken from him, free = spawned without paying
}
export interface UnitStat { built: number; died: number; diedYoung: number; kills: number; killValue: number; ownValue: number }

/** Harassment cost (signal phase 23): per raid on p's Haulers or refinery, the drop in p's income over the 2 min
 *  after the raid versus the 2 min before, in minutes of income. A new raid starts ≥ 2 min after the previous one;
 *  raids without a full 2 min after them (end of the game) do not count.
 *  net: minus the attacker's drop over the same window, because income falls anyway once the fields run dry.
 *  ponytail: the final assault on a base counts as a raid too when there are 2 min left; filter on K if that skews it. */
export function harassment(m: Match, p: number): { raw: number; net: number }[] {
  const out: { raw: number; net: number }[] = [];
  const drop = (q: number, t: number) => { const b = income2(m, q, t); return b > 0 ? Math.max(0, b - income2(m, q, t + 2 * MIN)) / (b / 2) : 0; };
  let last = -Infinity;
  for (const e of m.ev) {
    if ((e.type !== 'underAttack' && e.type !== 'death') || e.owner !== p || e.by === undefined || e.by === p || !m.players.includes(e.by)) continue;
    if (e.def !== 'refinery' && !UNITS[e.def]?.harvester) continue;
    if (e.t - last < 2 * MIN) continue;
    last = e.t;
    const before = income2(m, p, e.t);
    if (e.t + 2 * MIN > m.T || before <= 0) continue;
    const raw = drop(p, e.t);
    out.push({ raw, net: raw - drop(e.by, e.t) });
  }
  return out;
}

export function playerMetrics(m: Match, p: number): PlayerMetrics {
  const ss = m.snaps.get(p) ?? [];
  const conc = {} as Record<Phase, number | null>;
  for (const ph of PHASES) { const w = m.windows[ph]; conc[ph] = w ? median(ss.filter((s) => s.t >= w[0] && s.t <= w[1] && s.conc !== null).map((s) => s.conc!)) : null; }
  const perMin = (f: (s: Snapshot) => number) => { const out: number[] = []; for (const s of ss) { const k = Math.floor((s.t - 1) / MIN); out[k] = (out[k] ?? 0) + f(s); } return Array.from(out, (x) => x ?? 0); };
  const refs = m.ev.filter((e) => e.type === 'placed' && e.owner === p && e.def === 'refinery' && e.x !== undefined) as (Ev & { type: 'placed' })[];
  const fields = new Set<number>();
  m.rec.telemetry.fieldPos.forEach(([fx, fy], k) => { if (refs.some((r) => Math.hypot(r.x! - fx, r.y! - fy) <= 8)) fields.add(k); });
  const sf = startField(m, p);
  const low = sf >= 0 ? ss.find((s) => s.fields[sf] < 25) : undefined;
  const cy2 = ss.find((s) => s.cy >= 2);
  return {
    id: p, faction: m.rec.players.find((q) => q.id === p)!.faction, ai: m.rec.players.find((q) => q.id === p)!.ai, won: m.rec.winner === p,
    first: firstMoments(m, p), choice: choiceDensity(m, p), conc,
    incomePerMin: perMin((s) => s.income + s.stolen + s.bonus), spentPerMin: perMin((s) => s.spent),
    fieldsWithRefinery: fields.size, secondCy: cy2 ? min(cy2.t) : null, startFieldLow: low ? min(low.t) : null,
    rigIncome: ss.some((s) => s.rig !== undefined) ? ss.reduce((a, s) => a + (s.rig ?? 0), 0) : null,
    harass: harassment(m, p),
  };
}

export function matchMetrics(rec: MatchRecord): MatchMetrics {
  const m = readMatch(rec), [p0, p1] = m.players;
  const firstFight = m.fights[0];
  const ttk = firstFight ? median(m.deaths.filter((d) => d.kind === 'unit' && d.t >= firstFight.start && d.t <= firstFight.end && d.age !== undefined).map((d) => d.age! / TICK_RATE)) : null;
  let biggest: number | null = null;
  for (const f of m.fights) for (const [p, v] of Object.entries(f.lost)) {
    const a = snapAt(m, Number(p), f.start)?.army ?? 0;
    if (a > 0) biggest = Math.max(biggest ?? 0, Math.min(1, v / a));
  }
  const leads: MatchMetrics['leads'] = {};
  for (const mm of [5, 10, 15, 20]) {
    const t = mm * MIN, a = snapAt(m, p0, t), b = snapAt(m, p1, t);
    leads[mm] = a && b && m.T >= t ? { army: ratio(a.army, b.army), income: ratio(income2(m, p0, t), income2(m, p1, t)) } : null;
  }
  let snowball10: MatchMetrics['snowball10'] = null;
  const a10 = snapAt(m, p0, 10 * MIN), b10 = snapAt(m, p1, 10 * MIN);
  if (a10 && b10 && m.T >= 10 * MIN) {
    if (a10.army >= 1.5 * b10.army && a10.army > 0) snowball10 = { leader: p0, won: rec.winner === p0 };
    else if (b10.army >= 1.5 * a10.army && b10.army > 0) snowball10 = { leader: p1, won: rec.winner === p1 };
  }
  const loser = rec.winner === -1 ? -1 : opponent(m, rec.winner);
  const comeback = rec.winner !== -1 && (m.snaps.get(rec.winner) ?? []).some((s) => s.t >= 3 * MIN && (snapAt(m, loser, s.t)?.army ?? 0) > 0 && s.army <= 0.6 * snapAt(m, loser, s.t)!.army);
  const decisiveFights = loser < 0 ? [] : m.fights.filter((f) => { const a = snapAt(m, loser, f.start)?.army ?? 0; return a > 0 && (f.lost[loser] ?? 0) >= 0.5 * a && m.T - f.end <= 5 * MIN; });
  const first = (m.snaps.get(p0) ?? []);
  const fieldLow = rec.telemetry.fieldOre.map((_, k) => { const s = first.find((x) => x.fields[k] < 25); return s ? min(s.t) : null; });
  // per unit (20.2-G)
  const units: MatchMetrics['units'] = {}, unitsByPlayer: MatchMetrics['unitsByPlayer'] = {};
  const stat = (): UnitStat => ({ built: 0, died: 0, diedYoung: 0, kills: 0, killValue: 0, ownValue: 0 });
  const zero = () => ({ ...stat(), taken: 0, lost: 0, free: 0 });
  // both the type total and the player's own row; a unit that changed owner counts for its owner at that moment
  const u = (d: string, p: number | undefined, f: (x: UnitStat) => void) => {
    f((units[d] ??= stat()));
    if (p !== undefined && m.players.includes(p)) f(((unitsByPlayer[p] ??= {})[d] ??= zero()));
  };
  for (const e of m.ev) {
    if (e.type === 'unitReady' && UNITS[e.def] && m.players.includes(e.owner)) u(e.def, e.owner, (x) => { x.built++; x.ownValue += UNITS[e.def].cost; });
    if (e.type === 'spawned' && m.players.includes(e.owner)) ((unitsByPlayer[e.owner] ??= {})[e.def] ??= zero()).free++;
    if ((e.type === 'mindControl' || e.type === 'mutated' || e.type === 'captured') && UNITS[e.def] && m.players.includes(e.owner)) {
      const p = (unitsByPlayer[e.owner] ??= {}); (p[e.def] ??= zero()).taken++;
      if (m.players.includes(e.from)) ((unitsByPlayer[e.from] ??= {})[e.def] ??= zero()).lost++;
    }
    if (e.type === 'death') {
      if (e.kind === 'unit' && UNITS[e.def] && m.players.includes(e.owner)) u(e.def, e.owner, (x) => { x.died++; if ((e.age ?? 1e9) < MIN) x.diedYoung++; });
      if (e.killer && UNITS[e.killer] && e.by !== e.owner) u(e.killer, e.by, (x) => { x.kills++; x.killValue += e.cost ?? 0; });
    }
  }
  return {
    seed: rec.settings.seed, map: rec.settings.mapPreset, size: rec.settings.mapSize, build: rec.build, aiVersion: rec.aiVersion,
    superweapons: rec.settings.superweapons !== false, oreRules: rec.settings.oreRules ?? 'v12',
    factions: m.players.map((p) => rec.players.find((q) => q.id === p)!.faction), winner: rec.winner,
    duration: min(m.T), stalemate: rec.winner === -1,
    firstContact: m.contact === null ? null : min(m.contact), ttkFirstFight: ttk, biggestFight: biggest,
    leads, superweapon: superweapon(m), snowball10, comeback,
    decisive: { any: decisiveFights.length > 0, after15: decisiveFights.some((f) => f.start >= 15 * MIN) },
    fieldLow, totalRatio: Array.from({ length: Math.floor(m.T / MIN) + 1 }, (_, k) => { const a = snapAt(m, p0, k * MIN), b = snapAt(m, p1, k * MIN); return a && b ? ratio(a.army + a.bld + a.credits, b.army + b.bld + b.credits) : null; }),
    players: m.players.map((p) => playerMetrics(m, p)), units, unitsByPlayer,
  };
}

// ------------------------------------------------------------------ report (20.6) and comparison (20.5)

const f2 = (x: number | null | undefined, d = 2) => (x === null || x === undefined || !Number.isFinite(x) ? '–' : x.toFixed(d));
const pct = (x: number | null | undefined) => (x === null || x === undefined ? '–' : `${Math.round(x * 100)}%`);
/** "median (Q1–Q3)" */
function mq(xs: (number | null)[], d = 2, asPct = false) {
  const v = xs.filter((x): x is number => x !== null && Number.isFinite(x));
  if (!v.length) return '–';
  const g = (x: number | null) => (asPct ? pct(x) : f2(x, d));
  return `${g(median(v))} (${g(quantile(v, 0.25))}–${g(quantile(v, 0.75))}), n=${v.length}`;
}
const share = (xs: boolean[]) => (xs.length ? `${xs.filter(Boolean).length}/${xs.length} (${pct(xs.filter(Boolean).length / xs.length)})` : '–');
const sym = (r: number) => (r >= 1 ? r : 1 / r); // lead regardless of who leads

export interface Run { label: string; date: string; settings: Record<string, string>; matches: MatchMetrics[] }

/** Markdown summary of a run. `control` = the same run without superweapons (over-win, 20.2-D). */
export function report(run: Run, control?: Run): string {
  const ms = run.matches, ps = ms.flatMap((m) => m.players.map((p) => ({ m, p })));
  const factions = ['allies', 'soviets', 'psi'];
  const L: string[] = [];
  const row = (...c: string[]) => L.push(`| ${c.join(' | ')} |`);
  L.push(`# Meting ${run.label} (${run.date})`, '');
  L.push(`Build ${[...new Set(ms.map((m) => m.build))].join(', ')} · AI-versie ${[...new Set(ms.map((m) => m.aiVersion))].join(', ')} · ${ms.length} potjes · ${Object.entries(run.settings).map(([k, v]) => `${k}=${v}`).join(' · ')}`, '');
  L.push('Alle spelers in deze run zijn AI. B-metrieken (keuzedichtheid) zijn voor de AI **diagnose**: de AI denkt elke 30–60 ticks en houdt bewust een geldreserve aan (`planUnits`), wat als keuze-idle telt. Cijfers: mediaan (Q1–Q3). Er staan bewust geen grenzen in dit rapport; die komen in `docs/metingen/grenzen.md` (§2 regel 6).', '');
  L.push('Kanttekening: de AI breidt niet uit naar andere velden (alleen een Base Crawler zonder CY, `crawlers()` in `ai.ts`); uitbreidingscijfers meten dat gedrag.', '');

  // ---- alarm bells first
  const sws = ms.map((m) => m.superweapon).filter((x): x is Superweapon => !!x);
  const even = sws.filter((x) => x.bucket === 'even');
  L.push('## Alarmbellen', '');
  row('Signaal', 'Waarde'); row('---', '---');
  row('Superwapen: bak `gelijk` → tegenstander binnen 90 s uit', `${share(even.map((x) => x.outIn90))}${even.length < 15 ? ' — **onbeslist** (n < 15)' : ''}`);
  if (control) for (const b of ['ahead', 'even', 'behind'] as const) row(`Overwinst superwapen, bak ${b}`, overwin(sws.filter((x) => x.bucket === b), ms, control.matches));
  row('Keuze-idle midgame (unit-wachtrijen)', mq(ps.map(({ p }) => p.choice.byPhase.midgame), 2, true));
  row('Tijd zonder beslissing ≥ 30 s (aandeel speeltijd)', mq(ps.map(({ p }) => p.choice.quiet.pctLong), 2, true));
  row('Dominante eenheid (gemiddeld aandeel)', mq(ps.map(({ p }) => p.choice.dominant.mean), 2, true));
  row('Legerconcentratie lategame', mq(ps.map(({ p }) => p.conc.lategame)));
  row('Comeback (winnaar stond ooit ≥ 40% achter)', share(ms.filter((m) => !m.stalemate).map((m) => m.comeback)));
  row('Patstellingen (30 min zonder winnaar)', share(ms.map((m) => m.stalemate)));
  row('Tijd tot eerste strategische keuze (min)', mq(ps.map(({ p }) => p.first.strategic)));
  L.push('');

  L.push('## A. Verloop', '');
  row('Metriek', 'Waarde'); row('---', '---');
  row('Duur (min)', mq(ms.map((m) => m.duration)));
  row('Eerste contact (min)', mq(ms.map((m) => m.firstContact)));
  row('TTK eerste gevecht (s)', mq(ms.map((m) => m.ttkFirstFight), 1));
  row('Grootste gevecht (% legerwaarde van één kant)', mq(ms.map((m) => m.biggestFight), 2, true));
  for (const k of ['5', '10', '15', '20']) row(`Voorsprong op ${k} min (leger · inkomen, wie voor staat : de ander)`, `${mq(ms.map((m) => (m.leads[k] ? sym(m.leads[k]!.army) : null)))} · ${mq(ms.map((m) => (m.leads[k] ? sym(m.leads[k]!.income) : null)))}`);
  L.push('');

  L.push('## B. Keuzedichtheid (AI: diagnose)', '');
  row('Metriek', 'Alle', ...factions); row('---', '---', ...factions.map(() => '---'));
  const byF = (f: (x: PlayerMetrics) => number | null, d = 2, asPct = false) => [mq(ps.map(({ p }) => f(p)), d, asPct), ...factions.map((fa) => mq(ps.filter(({ p }) => p.faction === fa).map(({ p }) => f(p)), d, asPct))];
  row('Keuze-idle (hoofdmetriek)', ...byF((p) => p.choice.choiceIdle, 2, true));
  for (const ph of PHASES) row(`Keuze-idle ${ph}`, ...byF((p) => p.choice.byPhase[ph], 2, true));
  row('Keuze-idle bouwwachtrij (detail)', ...byF((p) => p.choice.perQueue[0], 2, true));
  row('Geldgebrek', ...byF((p) => p.choice.moneyShort, 2, true));
  row('Arm-idle', ...byF((p) => p.choice.poorIdle, 2, true));
  row('Productie-uptime', ...byF((p) => p.choice.uptime, 2, true));
  row('Ongebruikt geld (gem. credits bij keuze-idle)', ...byF((p) => p.choice.unusedMoney.mean, 0));
  row('Productieopties gebouw · inf · voertuig', ...byF((p) => p.choice.options[0], 0).map((x, i) => `${x} · ${byF((p) => p.choice.options[1], 0)[i]} · ${byF((p) => p.choice.options[2], 0)[i]}`));
  row('Gebruikte breedte (defs in 2 min)', ...byF((p) => p.choice.breadth, 1));
  row('Langste gat zonder beslissing (s)', ...byF((p) => p.choice.quiet.longest, 0));
  row('Mediaan gat (s)', ...byF((p) => p.choice.quiet.median, 1));
  row('Dominante eenheid, % tijd boven 50%', ...byF((p) => p.choice.dominant.pctOver50, 2, true));
  row('Planwissels per potje', ...byF((p) => p.choice.planShifts.total, 1));
  L.push('');

  L.push('## C. Tijd tot de eerste betekenisvolle beslissing (min; n = potjes waarin het voorkwam)', '');
  row('Moment', 'Alle', ...factions); row('---', '---', ...factions.map(() => '---'));
  for (const k of ['expansion', 'tech', 'ecoAttack', 'defense', 'counter', 'factionMechanic', 'strategic'] as const) row(k, ...byF((p) => p.first[k]));
  row('Reactietijd verdediging (s)', ...byF((p) => p.first.defenseReaction, 0));
  L.push('');

  L.push('## D. Superwapens', '');
  L.push(`Eerste schot per potje: ${sws.length} van ${ms.length} potjes. Bakken op totale waarde (leger + gebouwen + credits); de indeling op legerwaarde ernaast. Een bak met n < 15 is onbeslist.`, '');
  row('Bak', 'n (leger-bak n)', 'Tegenstander uit < 90 s', 'Beslissend achter < 90 s', 'Winst schutter', 'Verlies tegenstander 90 s (mediaan $)', 'Waarvan superwapen');
  row('---', '---', '---', '---', '---', '---', '---');
  for (const b of ['ahead', 'even', 'behind'] as const) {
    const xs = sws.filter((x) => x.bucket === b);
    row(b, `${xs.length} (${sws.filter((x) => x.bucketArmy === b).length})${xs.length < 15 ? ' onbeslist' : ''}`, share(xs.map((x) => x.outIn90)), share(xs.map((x) => x.behindIn90)), share(xs.map((x) => x.shooterWon)), f2(median(xs.map((x) => x.lost90)), 0), pct(xs.reduce((a, x) => a + x.lost90sw, 0) / Math.max(1, xs.reduce((a, x) => a + x.lost90, 0))));
  }
  if (!control) L.push('', 'Overwinst: draai dezelfde run met `BALANCE_NOSW=1` en geef hem mee met `BALANCE_CONTROL=<json>`.');
  L.push('');

  L.push('## E. Sneeuwbal, comeback, deathball', '');
  row('Metriek', 'Waarde'); row('---', '---');
  const sb = ms.map((m) => m.snowball10).filter((x): x is NonNullable<typeof x> => !!x);
  row('P(winst) bij legerwaarde ≥ 1,5× op 10 min', share(sb.map((x) => x.won)));
  row('Comeback', share(ms.filter((m) => !m.stalemate).map((m) => m.comeback)));
  row('Beslissend gevecht (≥ 50% van het leger, einde < 5 min)', share(ms.filter((m) => !m.stalemate).map((m) => m.decisive.any)));
  row('...waarvan na 15 min', share(ms.filter((m) => !m.stalemate).map((m) => m.decisive.after15)));
  for (const ph of PHASES) row(`Legerconcentratie ${ph}`, mq(ps.map(({ p }) => p.conc[ph])));
  L.push('');

  L.push('## F. Economie en uitbreiding', '');
  row('Metriek', 'Alle', ...factions); row('---', '---', ...factions.map(() => '---'));
  for (const k of [3, 6, 10, 15]) row(`Inkomen minuut ${k} ($/min)`, ...byF((p) => p.incomePerMin[k - 1] ?? null, 0));
  for (const k of [3, 6, 10, 15]) row(`Besteed minuut ${k} ($/min)`, ...byF((p) => p.spentPerMin[k - 1] ?? null, 0));
  row('Velden met eigen raffinaderij (ooit)', ...byF((p) => p.fieldsWithRefinery, 0));
  row('Startveld < 25% (min)', ...byF((p) => p.startFieldLow));
  row('Tweede CY (min)', ...byF((p) => p.secondCy));
  row('Inkomen uit Fuel Rigs ($, heel potje)', ...byF((p) => p.rigIncome, 0));
  row('Harassment: kosten per raid (min inkomen)', ...byF((p) => median(p.harass.map((x) => x.raw))));
  row('Harassment netto (min inkomen, min daling aanvaller)', ...byF((p) => median(p.harass.map((x) => x.net))));
  L.push('');
  row('Metriek', 'Waarde'); row('---', '---');
  row('Startveld ooit < 25%', share(ps.map(({ p }) => p.startFieldLow !== null)));
  row('Speler met een tweede CY', share(ps.map(({ p }) => p.secondCy !== null)));
  const exp = ps.filter(({ m }) => !m.stalemate);
  row('Winst met tweede CY', share(exp.filter(({ p }) => p.secondCy !== null).map(({ p }) => p.won)));
  row('Winst zonder tweede CY', share(exp.filter(({ p }) => p.secondCy === null).map(({ p }) => p.won)));
  const raids = ps.flatMap(({ p }) => p.harass);
  row('Raids op de economie die ≥ 1 min inkomen kosten, netto (signaal fase 23)', share(raids.map((x) => x.net >= 1)));
  row('Patstellingen', share(ms.map((m) => m.stalemate)));
  L.push('');

  L.push('## G. Gebruik en balans', '');
  L.push('Factiebalans (beslissing 21): winrate in **niet-spiegelpotjes**, patstelling = gespeeld en niet gewonnen, met 95%-Wilson-interval. Daarnaast het aandeel van alle overwinningen (maat van het balansplan).', '');
  row('Factie', 'Winrate niet-spiegel', '95%-interval', 'Aandeel overwinningen (alle potjes)'); row('---', '---', '---', '---');
  const nonMirror = ms.filter((m) => m.factions[0] !== m.factions[1]);
  const wins = ms.filter((m) => !m.stalemate);
  for (const fa of factions) {
    const games = nonMirror.filter((m) => m.factions.includes(fa));
    const won = games.filter((m) => m.winner >= 0 && m.factions[m.winner] === fa).length;
    const [lo, hi] = wilson(won, games.length);
    row(fa, `${won}/${games.length} (${pct(games.length ? won / games.length : null)})`, `${pct(lo)}–${pct(hi)}`, `${wins.filter((m) => m.factions[m.winner] === fa).length}/${wins.length}`);
  }
  const mirror = ms.filter((m) => m.factions[0] === m.factions[1] && !m.stalemate);
  L.push('', `Zetelbias (spiegelpotjes): speler 0 wint ${mirror.filter((m) => m.winner === 0).length} van ${mirror.length}.`, '');
  const U: Record<string, UnitStat> = {};
  for (const m of ms) for (const [d, x] of Object.entries(m.units)) { const t = (U[d] ??= { built: 0, died: 0, diedYoung: 0, kills: 0, killValue: 0, ownValue: 0 }); for (const k of Object.keys(x) as (keyof typeof x)[]) t[k] += x[k]; }
  row('Eenheid', 'Gebouwd', 'Kills', 'Kosten-efficiëntie', '% overleeft ≥ 60 s'); row('---', '---:', '---:', '---:', '---:');
  for (const [d, x] of Object.entries(U).filter(([, x]) => x.built).sort((a, b) => b[1].built - a[1].built))
    row(`${UNITS[d]?.name ?? d} (\`${d}\`)`, String(x.built), String(x.kills), f2(x.ownValue ? x.killValue / x.ownValue : null), pct(1 - x.diedYoung / x.built));
  const losses = ms.map((m) => m.loss).filter((x): x is NonNullable<typeof x> => !!x);
  if (losses.length) {
    L.push('', '## Verliesoorzaken (plan/fun-pass-verliesclassificatie.md, geijkt: docs/metingen/grenzen.md §3)', '');
    row('Code', 'Hoofdoorzaak', 'Geldige oorzaak'); row('---', '---:', '---:');
    for (const c of ['EU', 'ES', 'PB', 'SC', 'BG', 'SW', 'OV', 'VA', 'X']) row(c, `${losses.filter((x) => x.main === c).length}/${losses.length}`, c === 'X' ? '–' : `${losses.filter((x) => x.causes.includes(c)).length}/${losses.length}`);
  }
  L.push('', 'Kosteneffectiviteit per unit zonder micro en terrein: duelmatrix `DUELS=1 npx vitest run duels` (`docs/balans/`).');
  return L.join('\n') + '\n';
}

/** Win rate of the shooters in a bucket minus that of players with the same total-value lead class, same minute ± 1, in the run without superweapons. */
function overwin(shots: Superweapon[], ms: MatchMetrics[], control: MatchMetrics[]): string {
  if (!shots.length) return '–';
  let diff = 0, n = 0;
  for (const x of shots) {
    const minute = Math.round(x.t / MIN), b = bucket(x.total);
    const peers: boolean[] = [];
    for (const c of control) for (let k = minute - 1; k <= minute + 1; k++) {
      const r = c.totalRatio[k];
      if (r === null || r === undefined || c.stalemate) continue;
      if (bucket(r) === b) peers.push(c.winner === 0); // player 0 has ratio r
      if (bucket(1 / r) === b) peers.push(c.winner === 1);
    }
    if (!peers.length) continue;
    diff += (x.shooterWon ? 1 : 0) - peers.filter(Boolean).length / peers.length;
    n++;
  }
  return n ? `${diff / n >= 0 ? '+' : ''}${Math.round((diff / n) * 100)} procentpunt (n=${n}${n < 15 ? ', onbeslist' : ''})` : '–';
}

/** Scalar metrics the comparison reports; the primary metric of an iteration is named in docs/metingen/ before the run. */
export const COMPARE_METRICS: Record<string, (m: MatchMetrics) => number | null> = {
  'duur (min)': (m) => m.duration,
  'eerste contact (min)': (m) => m.firstContact,
  'patstelling': (m) => (m.stalemate ? 1 : 0),
  'comeback': (m) => (m.stalemate ? null : m.comeback ? 1 : 0),
  'inkomen min 10 ($/min, gem. spelers)': (m) => mean(m.players.map((p) => p.incomePerMin[9]).filter((x) => x !== undefined)),
  'besteed min 10 ($/min, gem. spelers)': (m) => mean(m.players.map((p) => p.spentPerMin[9]).filter((x) => x !== undefined)),
  'eerste uitbreiding (min, gem. spelers)': (m) => mean(m.players.map((p) => p.first.expansion).filter((x): x is number => x !== null)),
  'startveld < 25% (aandeel spelers)': (m) => mean(m.players.map((p) => (p.startFieldLow !== null ? 1 : 0))),
  'arm-idle (gem. spelers)': (m) => mean(m.players.map((p) => p.choice.poorIdle).filter((x): x is number => x !== null)),
  'keuze-idle (gem. spelers)': (m) => mean(m.players.map((p) => p.choice.choiceIdle).filter((x): x is number => x !== null)),
};

/** Deterministic bootstrap (over matches) of the difference in means B − A, 95% interval. */
export function compare(a: Run, b: Run, iters = 2000): string {
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const L = [`# Vergelijking ${a.label} → ${b.label}`, '', `A: ${a.matches.length} potjes, B: ${b.matches.length} potjes. Verschil = gemiddelde B − gemiddelde A, 95%-interval met bootstrap over potjes (vaste seed). Alleen de vooraf vastgelegde primaire metriek beslist; de rest is verkennend.`, '', '| Metriek | A | B | Verschil | 95%-interval |', '|---|---:|---:|---:|---|'];
  for (const [name, f] of Object.entries(COMPARE_METRICS)) {
    const xa = a.matches.map(f).filter((x): x is number => x !== null && Number.isFinite(x)), xb = b.matches.map(f).filter((x): x is number => x !== null && Number.isFinite(x));
    if (!xa.length || !xb.length) { L.push(`| ${name} | – | – | – | – |`); continue; }
    const ma = mean(xa)!, mb = mean(xb)!, ds: number[] = [];
    for (let k = 0; k < iters; k++) {
      const sa = xa.map(() => xa[Math.floor(rnd() * xa.length)]), sb = xb.map(() => xb[Math.floor(rnd() * xb.length)]);
      ds.push(mean(sb)! - mean(sa)!);
    }
    L.push(`| ${name} | ${f2(ma)} | ${f2(mb)} | ${f2(mb - ma)} | ${f2(quantile(ds, 0.025))} – ${f2(quantile(ds, 0.975))} |`);
  }
  return L.join('\n') + '\n';
}
