// Fun Pass phase 20: the telemetry and the metrics on hand-built records (each metric fires, and does not fire),
// plus the live checks: determinism with and without telemetry, saves, and a real match record.
import { describe, expect, it } from 'vitest';
import { spawnBuilding, spawnUnit } from '../core/entities';
import { deserialize, serialize } from '../core/save';
import { tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { DIFFICULTY, TICK_RATE } from '../data/config';
import { matchRecord, type MatchRecord } from '../systems/telemetry';
import type { GameSettings, GameState, Snapshot } from '../types';
import { choiceDensity, compare, firstMoments, harassment, matchMetrics, meaningful, phaseWindows, readMatch, report, wilson, type Run } from './meting';
import { classify, score } from './verlies';

const S = TICK_RATE, M = 60 * TICK_RATE;

// ------------------------------------------------------------------ builder

type Ev = MatchRecord['telemetry']['ev'][number];
interface Opts { T?: number; winner?: number; snaps?: (t: number, p: number) => Partial<Snapshot>; ev?: Ev[]; dec?: MatchRecord['telemetry']['dec']; samples?: string[][]; factions?: ['allies' | 'soviets' | 'psi', 'allies' | 'soviets' | 'psi'] }

/** Two players: p0 starts at (5,5) next to field 0, p1 at (40,40) next to field 2; field 1 is free at (30,8). */
function rec(o: Opts = {}): MatchRecord {
  const T = o.T ?? 20 * M;
  const snaps: Snapshot[] = [];
  for (let t = 300; t <= T; t += 300) for (const p of [0, 1])
    snaps.push({ t, p, credits: 500, income: 200, stolen: 0, bonus: 0, spent: 200, army: 3000, bld: 5000, inf: 5, veh: 5, air: 0, sea: 0, cy: 1, harv: 2, power: 50, fields: [80, 100, 80], options: [8, 4, 4], conc: 0.8, byDef: { tank_allies: 1500, rifle: 1500 }, ...o.snaps?.(t, p) });
  return {
    format: 'iron-front-match', build: 'test', aiVersion: 1, settings: { ...DEFAULT_SETTINGS },
    players: [{ id: 0, name: 'A', faction: o.factions?.[0] ?? 'allies', ai: true, startX: 5, startY: 5 }, { id: 1, name: 'B', faction: o.factions?.[1] ?? 'soviets', ai: true, startX: 40, startY: 40 }],
    winner: o.winner ?? 0, tick: T,
    telemetry: { build: 'test', aiVersion: 1, fieldOf: [], fieldOre: [1000, 1000, 1000], fieldPos: [[6, 6], [30, 8], [40, 40]], snaps, ev: o.ev ?? [], dec: o.dec ?? [], samples: o.samples ?? [['', '', ''], ['', '', '']] },
  };
}
const death = (t: number, owner: number, def: string, extra: Partial<Ev> = {}): Ev => ({ t, type: 'death', x: 20, y: 20, kind: 'unit', owner, def, by: 1 - owner, cost: 750, cause: 'weapon', age: 60 * S, ...extra } as Ev);

// ------------------------------------------------------------------ A–G on built records

describe('Fun Pass metrics (20.2) on built telemetry', () => {
  it('phase windows: lategame only from 18 min, contact only with contact', () => {
    const w = phaseWindows(20 * M, 6 * M);
    expect(w.midgame).toEqual([5 * M, 15 * M]);
    expect(w.lategame).toEqual([15 * M, 17 * M]);
    expect(w.contact).toEqual([5 * M, 8 * M]);
    const short = phaseWindows(10 * M, null);
    expect(short.lategame).toBeNull();
    expect(short.contact).toBeNull();
    expect(short.midgame).toEqual([5 * M, 7 * M]);
  });

  it('meaningful decisions: new defs, far moves, repeated clicks once', () => {
    const m = readMatch(rec({ dec: [[10, 0, 'queue', 'rifle'], [20, 0, 'queue', 'rifle'], [30, 0, 'queue', 'tank_allies'], [40, 0, 'move', '9,9', 2], [50, 0, 'move', '30,30', 12], [60, 0, 'move', '30,30', 12], [200, 0, 'move', '30,30', 12], [70, 1, 'place', 'power']] }));
    expect(meaningful(m, 0).map((d) => d.t)).toEqual([10, 30, 50, 200]); // same rifle again, short move and a repeat within 2 s drop out
  });

  it('choice-idle, uptime and quiet time from the per-second samples', () => {
    const inf = 'K'.repeat(60) + 'L'.repeat(60), veh = '-'.repeat(120);
    const m = readMatch(rec({ T: 2 * M, samples: [['', inf, veh], ['', '', '']], dec: [[30, 0, 'place', 'a'], [30 + 40 * S, 0, 'place', 'b'], [30 + 45 * S, 0, 'place', 'c']] }));
    const c = choiceDensity(m, 0);
    expect(c.choiceIdle).toBeCloseTo(0.5);
    expect(c.uptime).toBeCloseTo(0.5);
    expect(c.quiet.longest).toBeCloseTo(40);
    expect(c.quiet.pctLong).toBeCloseTo(40 / 120);
    const none = choiceDensity(readMatch(rec({ T: 2 * M, samples: [['', 'L'.repeat(120), ''], ['', '', '']] })), 0);
    expect(none.choiceIdle).toBe(0);
    expect(none.uptime).toBe(1);
  });

  it('dominant unit and plan shifts', () => {
    const m = readMatch(rec({ T: 3 * M, snaps: () => ({ byDef: { tank_allies: 2700, rifle: 300 } }), ev: [
      { t: 10, type: 'enqueued', owner: 0, def: 'rifle' } as Ev, { t: M + 10, type: 'enqueued', owner: 0, def: 'tank_allies' } as Ev, { t: 2 * M + 10, type: 'enqueued', owner: 0, def: 'tank_allies' } as Ev,
    ] }));
    const c = choiceDensity(m, 0);
    expect(c.dominant.mean).toBeCloseTo(0.9);
    expect(c.dominant.pctOver50).toBe(1);
    expect(c.planShifts.total).toBe(1); // anti-infantry → anti-armour, then the same again
    expect(choiceDensity(readMatch(rec({ T: 3 * M })), 0).planShifts.total).toBe(0);
  });

  it('first moments: expansion, tech, attack on the economy, defence, faction mechanic', () => {
    const m = readMatch(rec({ factions: ['psi', 'soviets'], ev: [
      { t: 2 * M, type: 'placed', owner: 0, def: 'refinery', x: 7, y: 7 } as Ev, // start field: no expansion
      { t: 6 * M, type: 'placed', owner: 0, def: 'refinery', x: 29, y: 9 } as Ev,
      { t: 4 * M, type: 'enqueued', owner: 0, def: 'lab' } as Ev,
      { t: 5 * M, type: 'underAttack', owner: 1, def: 'miner', x: 38, y: 38, by: 0 } as Ev,
      { t: 7 * M, type: 'underAttack', owner: 0, def: 'power', x: 8, y: 8, by: 1 } as Ev,
      { t: 9 * M, type: 'mindControl', owner: 0, from: 1, def: 'tank_soviets' } as Ev,
    ], dec: [[7 * M + 20 * S, 0, 'move', '9,9', 10]] }));
    const f = firstMoments(m, 0);
    expect(f.expansion).toBe(6);
    expect(f.tech).toBe(4);
    expect(f.ecoAttack).toBe(5);
    expect(f.defense).toBeCloseTo(7.33, 1);
    expect(f.defenseReaction).toBe(20);
    expect(f.factionMechanic).toBe(9);
    expect(f.strategic).toBe(4);
    const g = firstMoments(readMatch(rec()), 0);
    expect([g.expansion, g.tech, g.ecoAttack, g.defense, g.factionMechanic, g.strategic]).toEqual([null, null, null, null, null, null]);
    // a second field within 10 tiles of the start is a start field too (grenzen.md §4)
    const r = rec({ ev: [{ t: M, type: 'placed', owner: 0, def: 'refinery', x: 12, y: 13 } as Ev] });
    r.telemetry.fieldPos.push([12, 12]); r.telemetry.fieldOre.push(1000);
    expect(firstMoments(readMatch(r), 0).expansion).toBeNull();
  });

  it('counter-production: ordering the counter of what the enemy mostly fields', () => {
    const m = readMatch(rec({ snaps: (_t, p) => (p === 1 ? { byDef: { tank_soviets: 3000 } } : {}), ev: [{ t: 3 * M, type: 'enqueued', owner: 0, def: 'rocket' } as Ev] }));
    expect(firstMoments(m, 0).counter).toBe(3);
    const n = readMatch(rec({ snaps: (_t, p) => (p === 1 ? { byDef: { rifle: 3000 } } : {}), ev: [{ t: 3 * M, type: 'enqueued', owner: 0, def: 'rocket' } as Ev] }));
    expect(firstMoments(n, 0).counter).toBeNull();
  });

  it('fights, biggest fight, decisive fight and comeback', () => {
    const ev = [death(10 * M, 1, 'tank_soviets', { cost: 900 }), death(10 * M + 5 * S, 1, 'tank_soviets', { cost: 900 }), death(10 * M + 10 * S, 1, 'tank_soviets', { cost: 900 }), death(12 * M, 1, 'tank_soviets', { x: 40, y: 2 })];
    const mm = matchMetrics(rec({ T: 14 * M, ev, snaps: (t, p) => (p === 0 && t < 8 * M ? { army: 1000 } : {}) }));
    expect(mm.biggestFight).toBeCloseTo(0.9);
    expect(mm.decisive.any).toBe(true);
    expect(mm.comeback).toBe(true); // the winner had 1000 against 3000
    const calm = matchMetrics(rec({ T: 14 * M, ev: [death(10 * M, 1, 'rifle', { cost: 100 })] }));
    expect(calm.decisive.any).toBe(false);
    expect(calm.comeback).toBe(false);
  });

  it('snowball at 10 min, second CY and the start field running dry', () => {
    const mm = matchMetrics(rec({ snaps: (t, p) => ({ army: p === 0 ? 6000 : 3000, cy: p === 0 && t >= 12 * M ? 2 : 1, fields: [t >= 8 * M ? 20 : 80, 100, 80] }) }));
    expect(mm.snowball10).toEqual({ leader: 0, won: true });
    expect(mm.players[0].secondCy).toBe(12);
    expect(mm.players[0].startFieldLow).toBe(8);
    expect(mm.players[1].startFieldLow).toBeNull();
    expect(matchMetrics(rec()).snowball10).toBeNull();
  });

  it('superweapon: lead before the shot, opponent out within 90 s', () => {
    const shot = { t: 10 * M, type: 'superweapon', owner: 0, def: 'hammer', phase: 'fired', x: 40, y: 40 } as Ev;
    const out = { t: 10 * M + 60 * S, type: 'defeated', owner: 1 } as Ev;
    const mm = matchMetrics(rec({ ev: [shot, death(10 * M + 5 * S, 1, 'cy', { kind: 'building', cost: 3000, cause: 'superweapon' }), out] }));
    expect(mm.superweapon?.bucket).toBe('even');
    expect(mm.superweapon?.outIn90).toBe(true);
    expect(mm.superweapon?.lost90sw).toBe(3000);
    const ahead = matchMetrics(rec({ ev: [shot], snaps: (_t, p) => (p === 0 ? { army: 9000 } : {}) }));
    expect(ahead.superweapon?.bucket).toBe('ahead');
    expect(ahead.superweapon?.outIn90).toBe(false);
    expect(matchMetrics(rec()).superweapon).toBeNull();
  });

  it('unit statistics: built, kills, cost efficiency, early deaths', () => {
    const mm = matchMetrics(rec({ ev: [{ t: 10, type: 'unitReady', owner: 0, def: 'rifle' } as Ev, { t: 20, type: 'unitReady', owner: 0, def: 'rifle' } as Ev, death(40 * S, 0, 'rifle', { age: 30 * S, killer: 'rifle', cost: 100 })] }));
    expect(mm.units.rifle).toMatchObject({ built: 2, died: 1, diedYoung: 1 });
    expect(mm.units.rifle).toMatchObject({ kills: 1, killValue: 100 });
    // per player: a unit taken by mind control kills for its new owner
    const mc = matchMetrics(rec({ ev: [{ t: 10, type: 'unitReady', owner: 1, def: 'heavy' } as Ev, { t: 20, type: 'mindControl', owner: 0, from: 1, def: 'heavy' } as Ev, death(40 * S, 1, 'rifle', { by: 0, killer: 'heavy', cost: 200 })] }));
    expect(mc.unitsByPlayer[0].heavy).toMatchObject({ built: 0, taken: 1, kills: 1, killValue: 200 });
    expect(mc.unitsByPlayer[1].heavy).toMatchObject({ built: 1, lost: 1, kills: 0 });
    const fr = matchMetrics(rec({ ev: [{ t: 10, type: 'spawned', owner: 1, def: 'miner', reason: 'freeUnit' } as Ev] }));
    expect(fr.unitsByPlayer[1].miner).toMatchObject({ built: 0, free: 1 });
  });

  it('harassment: income lost after a raid on the economy, in minutes of income', () => {
    const raid = (t: number) => ({ t, type: 'underAttack', owner: 1, def: 'miner', x: 40, y: 40, by: 0 }) as Ev;
    const r = rec({ ev: [raid(10 * M), raid(11 * M), raid(19 * M)], snaps: (t, p) => (p === 1 && t > 10 * M ? { income: 50 } : {}) });
    expect(harassment(readMatch(r), 1)).toEqual([{ raw: 1.5, net: 1.5 }]); // 2400 → 600 in 2 min = 1.5 min of income; 11 min is the same raid, 19 min has no 2 min left
    expect(harassment(readMatch(rec({ ev: [raid(10 * M)] })), 1)).toEqual([{ raw: 0, net: 0 }]);
    const dry = rec({ ev: [raid(10 * M)], snaps: (t) => (t > 10 * M ? { income: 50 } : {}) }); // both lose income: the fields, not the raid
    expect(harassment(readMatch(dry), 1)).toEqual([{ raw: 1.5, net: 0 }]);
    expect(harassment(readMatch(r), 0)).toEqual([]);
  });

  it('faction balance interval (Wilson)', () => {
    const [lo, hi] = wilson(12, 24);
    expect(lo).toBeCloseTo(0.314, 2);
    expect(hi).toBeCloseTo(0.686, 2);
  });

  it('report and comparison render', () => {
    const a: Run = { label: 'a', date: 'x', settings: {}, matches: [matchMetrics(rec()), matchMetrics(rec({ winner: 1 }))] };
    expect(report(a)).toContain('## Alarmbellen');
    expect(compare(a, a)).toContain('| duur (min) | 20.00 | 20.00 | 0.00 |');
  });
});

// ------------------------------------------------------------------ loss classification (plan/fun-pass-verliesclassificatie.md)

describe('loss classification', () => {
  const lose = (o: Opts) => classify(rec({ winner: 0, ...o }))!;
  it('EU: the winner earned 1.5× for 4 minutes and the loser never expanded', () => {
    const rich = (t: number, p: number) => ({ income: p === 0 && t > 5 * M ? 400 : 200, army: p === 1 && t > 12 * M ? 1000 : 3000 }); // turning point at 12 min
    expect(lose({ snaps: rich }).causes.EU).toBe(10 * M); // the 2-minute income reaches 1.5× at 6 min, plus 4 min
    expect(lose({ snaps: rich, ev: [{ t: M, type: 'placed', owner: 1, def: 'refinery', x: 30, y: 8 } as Ev] }).causes.EU).toBeUndefined();
  });
  it('ES: refinery lost and income down', () => {
    const c = lose({ ev: [death(10 * M, 1, 'refinery', { kind: 'building' })], snaps: (t, p) => ({ income: p === 1 && t > 10 * M ? 50 : 200, army: p === 1 && t > 12 * M ? 1000 : 3000 }) });
    expect(c.causes.ES).toBe(10 * M);
    expect(lose({ ev: [death(10 * M, 1, 'refinery', { kind: 'building' })], snaps: (t, p) => ({ army: p === 1 && t > 12 * M ? 1000 : 3000 }) }).causes.ES).toBeUndefined();
  });
  it('PB: production standing still for 3 minutes with even income', () => {
    expect(lose({ samples: [['', '', ''], ['', 'K'.repeat(1200), 'K'.repeat(1200)]] }).causes.PB).toBeDefined();
    expect(lose({ samples: [['', '', ''], ['', 'L'.repeat(1200), 'L'.repeat(1200)]] }).causes.PB).toBeUndefined();
    expect(lose({ samples: [['', '', ''], ['', 'G'.repeat(1200), 'A'.repeat(1200)]] }).causes.PB, 'broke is not "money not spent"').toBeUndefined();
  });
  it('SC: lost to aircraft without anti-air', () => {
    const air = [death(16 * M, 1, 'tank_soviets', { killer: 'jet', cost: 900 }), death(16 * M + 10, 1, 'tank_soviets', { killer: 'jet', cost: 900 })];
    expect(lose({ ev: air }).causes.SC).toBeDefined();
    expect(lose({ ev: air, snaps: (_t, p) => (p === 1 ? { byDef: { flakgunner: 1500, tank_soviets: 1500 } } : {}) }).causes.SC).toBeUndefined();
  });
  it('BG: one even fight costs ≥ 90% of the army, over within 5 min', () => {
    const fight = [0, 1, 2, 3, 4].map((k) => death(18 * M + k * 5 * S, 1, 'tank_soviets', { cost: 600 })); // 3000 of 3000
    expect(lose({ ev: fight.slice(0, 4) }).causes.BG).toBeUndefined(); // 80%
    expect(lose({ ev: fight }).causes.BG).toBe(18 * M);
    expect(lose({ ev: fight.slice(0, 1) }).causes.BG).toBeUndefined();
  });
  it('SW: a superweapon took the factory just before the turning point', () => {
    const sw = death(14 * M, 1, 'factory', { kind: 'building', cause: 'superweapon', cost: 2000 });
    expect(lose({ ev: [sw], snaps: (t, p) => (p === 1 && t > 15 * M ? { army: 1000 } : {}) }).causes.SW).toBe(14 * M);
    expect(lose({ ev: [{ ...sw, cause: 'weapon' } as Ev] }).causes.SW).toBeUndefined();
  });
  it('OV: units taken over', () => {
    const mc = { t: 15 * M, type: 'mindControl', owner: 0, from: 1, def: 'tank_soviets' } as Ev;
    expect(lose({ ev: [mc, death(16 * M, 1, 'rifle', { cost: 100 })] }).causes.OV).toBe(15 * M);
    expect(lose({ ev: [death(16 * M, 1, 'rifle', { cost: 100 })] }).causes.OV).toBeUndefined();
  });
  it('VA: raided early by a much bigger army, over before 12 min', () => {
    const raid = [{ t: 4 * M, type: 'underAttack', owner: 1, def: 'power', x: 40, y: 40, by: 0 } as Ev];
    const c = lose({ T: 10 * M, ev: raid, snaps: (_t, p) => ({ army: p === 0 ? 3000 : 1000 }) });
    expect(c.causes.VA).toBe(4 * M);
    expect(lose({ T: 20 * M, ev: raid, snaps: (_t, p) => ({ army: p === 0 ? 3000 : 1000 }) }).causes.VA).toBeUndefined();
  });
  it('main cause = earliest; nothing found = X; scores 2/1/0', () => {
    const c = lose({ ev: [{ t: 15 * M, type: 'mindControl', owner: 0, from: 1, def: 'tank_soviets' } as Ev, ...[0, 1, 2, 3, 4].map((k) => death(18 * M + k * 5 * S, 1, 'tank_soviets', { cost: 600 }))] });
    expect(c.main).toBe('OV');
    expect(score(c, ['OV'])).toBe(2);
    expect(score(c, ['BG'])).toBe(1);
    expect(score(c, ['EU'])).toBe(0);
    expect(lose({}).main).toBe('X');
    expect(classify(rec({ winner: -1 }))).toBeNull();
  });
});

// ------------------------------------------------------------------ live: the telemetry does not touch the game

const aiGame = (extra: Partial<GameSettings>) => {
  const s = createGame({ ...DEFAULT_SETTINGS, seed: 77, difficulty: 'hard', mapSize: 'small', faction: 'psi', enemyFaction: 'soviets', town: true, crates: true, ...extra });
  s.players[0].ai = true;
  s.ai.unshift({ player: 0, nextThink: 0, attackWave: 0, nextAttack: DIFFICULTY.hard.firstAttack * TICK_RATE, attacking: [], lastPlace: 0, difficulty: 'hard' });
  return s;
};
const run = (s: GameState, ticks: number) => { while (s.tick < ticks && s.winner === -1) { tick(s); s.rt.events.length = 0; } return s; };
const hash = (s: GameState) => { const { telemetry: _t, settings: _s, ...rest } = JSON.parse(serialize(s)); let h = 0; const j = JSON.stringify(rest); for (let i = 0; i < j.length; i++) h = (h * 31 + j.charCodeAt(i)) | 0; return h; };

describe('telemetry is read-only (20.6 Klaar als)', () => {
  it('same game with and without telemetry, and with oreRules missing vs v12: identical', () => {
    const T = 8 * M;
    const a = run(aiGame({}), T), b = run(aiGame({ telemetry: false }), T), c = run(aiGame({ oreRules: 'v12' }), T);
    expect(b.telemetry).toBeUndefined();
    expect(a.telemetry!.snaps.length).toBeGreaterThan(50);
    for (const x of [b, c]) { expect(x.tick).toBe(a.tick); expect(x.winner).toBe(a.winner); expect(hash(x)).toBe(hash(a)); }
  }, 120_000);

  it('saves keep the telemetry and play on identically; old saves without it load', () => {
    const s = run(aiGame({}), 2 * M);
    const t = deserialize(serialize(s));
    expect(t.telemetry!.fieldOf).toBeInstanceOf(Uint16Array);
    run(s, 3 * M); run(t, 3 * M);
    expect(hash(t)).toBe(hash(s));
    expect(t.telemetry!.snaps.length).toBe(s.telemetry!.snaps.length);
    const old = JSON.parse(serialize(s)); delete old.telemetry;
    expect(() => run(deserialize(JSON.stringify(old)), 3 * M + 60)).not.toThrow();
  }, 120_000);

  it('a real match record goes through every metric and the loss script', () => {
    const s = run(aiGame({}), 30 * M);
    const r = JSON.parse(JSON.stringify(matchRecord(s))) as MatchRecord; // as exported
    const mm = matchMetrics(r);
    expect(mm.players).toHaveLength(2);
    expect(mm.firstContact).not.toBeNull();
    expect(r.telemetry.dec.some(([, p, k]) => p === 0 && k === 'queue')).toBe(true);
    expect(() => classify(r)).not.toThrow();
    expect(() => report({ label: 'x', date: 'x', settings: {}, matches: [mm] })).not.toThrow();
  }, 120_000);

  it('rig income and free units are recorded', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, aiCount: 0 } as GameSettings);
    spawnBuilding(s, 'techrig', 0, 20, 20);
    spawnUnit(s, 'thrallhauler', 0, 10, 10);
    spawnBuilding(s, 'refinery', 0, 14, 4, 0);
    run(s, 20 * S);
    const ev = s.telemetry!.ev.filter((e) => e.type === 'spawned');
    expect(ev.filter((e) => 'reason' in e && e.reason === 'escort')).toHaveLength(3);
    expect(ev.some((e) => 'reason' in e && e.reason === 'freeUnit')).toBe(true);
    expect(s.telemetry!.snaps.filter((x) => x.p === 0).reduce((a, x) => a + (x.rig ?? 0), 0)).toBeGreaterThan(0);
  });

  it('oreRules v14 does not exist before phase 23', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, oreRules: 'v14' });
    expect(() => run(s, 200)).toThrow(/phase 23/);
  });
});
