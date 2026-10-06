// Balance measurement per unit (plan/balans-plan.md, B1). Opt-in, slow:
//   DUELS=1 npx vitest run duels --silent=false            → duel matrix + scenarios, report in docs/balans/
//   DUELS=1 DUELS_ONLY=nova,grom npx vitest run duels ...  → only matchups involving these units
//   DUELS=1 DUELS_SEA=1 npx vitest run duels ...           → the sea matrix (all ships, on open water) → docs/balans/duels-zee
//   REGRESS=1 REGRESS_OUT=nul-scenarios npx vitest run duels → regression scenarios (Fun Pass 20.3) → docs/metingen/
// Each duel: two equal-budget armies on an open field, attack-moving into each other, until one side is gone or 90 s pass.
// Efficiency = value the enemy lost / value you lost (value = cost × remaining health share). 1 = even trade.
import { describe, it } from 'vitest';
// @ts-expect-error no Node typings in this project; vitest runs in Node
import { mkdirSync, writeFileSync } from 'node:fs';
import { UNITS } from '../data/units';
import { duel, FIGHTERS, regressions, scenarios, SHIPS } from './balance-lab';

declare const process: { env: Record<string, string | undefined> };
const ON = !!process.env.DUELS;
const SEA = !!process.env.DUELS_SEA;
const ONLY = process.env.DUELS_ONLY?.split(',');

describe.skipIf(!ON)('balance measurement (B1)', () => {
  it('duel matrix and scenarios', () => {
    const units = SEA ? SHIPS : FIGHTERS;
    const pairs: [string, string][] = [];
    for (let i = 0; i < units.length; i++) for (let j = i + 1; j < units.length; j++)
      if (!ONLY || ONLY.includes(units[i]) || ONLY.includes(units[j])) pairs.push([units[i], units[j]]);
    const res = new Map<string, number>();
    const t0 = Date.now();
    for (const [a, b] of pairs) { const d = duel(a, b); res.set(`${a}|${b}`, d.eff); res.set(`${b}|${a}`, 1 / d.eff); }
    const eff = (a: string, b: string) => res.get(`${a}|${b}`);
    // Averages on a clipped log scale: "can't touch it at all" (e.g. no anti-air) counts as ×8, not ×3000.
    const clip = (e: number) => Math.max(-3, Math.min(3, Math.log2(e)));
    const gmean = (es: number[]) => (es.length ? Math.pow(2, es.reduce((t, e) => t + clip(e), 0) / es.length) : NaN);
    const cls = (u: string) => (UNITS[u].air ? 'air' : UNITS[u].category === 'infantry' ? 'inf' : 'veh');
    const rows = units.map((u) => {
      const vs = units.filter((o) => o !== u && eff(u, o) !== undefined).map((o) => [o, eff(u, o)!] as const);
      const by = (c: string) => gmean(vs.filter(([o]) => cls(o) === c).map(([, e]) => e));
      const sorted = [...vs].sort((x, y) => y[1] - x[1]);
      return { u, mean: gmean(vs.map(([, e]) => e)), inf: by('inf'), veh: by('veh'), air: by('air'), best: sorted.slice(0, 3), worst: sorted.slice(-3).reverse(), counters: sorted.filter(([, e]) => e < 0.5).length, n: vs.length };
    }).filter((r) => r.n).sort((x, y) => y.mean - x.mean);
    const f = (e: number) => (Number.isNaN(e) ? '–' : e >= 7.95 ? '≥8' : e <= 0.126 ? '≤⅛' : e.toFixed(2));
    const lines = [
      `# Duelmatrix${SEA ? ' zee' : ''} (${new Date().toISOString().slice(0, 10)})`, '',
      `Twee legers met hetzelfde budget (3000; met een held: de prijs van de held) op ${SEA ? 'open water' : 'open grasland'}, attack-move op elkaar, max 90 s.`,
      'Efficiëntie = waarde die de tegenstander verloor / waarde die jij verloor. 1 = gelijk; > 1 = jij wint de ruil.',
      'Gemiddelden zijn geometrisch en afgekapt op ×8 en ×⅛ (een unit die de ander niet eens kan raken telt als ×8, niet als ×3000).',
      'Kolommen Inf/Voert/Lucht: gemiddeld tegen tegenstanders van die soort. Counters = tegenstanders waartegen het onder 0,5 ligt.',
      'Abilities (E) worden niet gebruikt; helden en mind control gedragen zich zoals de AI ze inzet.', '',
      '| Unit | Kosten | Gemiddeld | Inf | Voert | Lucht | Counters | Beste ruil | Slechtste ruil |', '|---|---:|---:|---:|---:|---:|---:|---|---|',
      ...rows.map((r) => `| ${UNITS[r.u].name} (\`${r.u}\`) | ${UNITS[r.u].cost} | ${f(r.mean)} | ${f(r.inf)} | ${f(r.veh)} | ${f(r.air)} | ${r.counters}/${r.n} | ${r.best.map(([o, e]) => `${o} ${f(e)}`).join(', ')} | ${r.worst.map(([o, e]) => `${o} ${f(e)}`).join(', ')} |`),
    ];
    const sc = SEA ? [] : scenarios();
    if (sc.length) lines.push('', '## Scenario\'s', '', '| Scenario | Doel | Uitkomst | |', '|---|---|---|---|', ...sc.map((x) => `| ${x.name} | ${x.want} | ${x.got} | ${x.ok ? '✓' : '✗'} |`));
    lines.push('', `_${pairs.length} duels in ${Math.round((Date.now() - t0) / 1000)} s._`);
    mkdirSync('docs/balans', { recursive: true });
    const name = process.env.DUELS_OUT ?? (SEA ? 'duels-zee' : 'duels');
    writeFileSync(`docs/balans/${name}.md`, lines.join('\n') + '\n');
    // Full matrix as CSV for comparing rounds.
    writeFileSync(`docs/balans/${name}.csv`, ['unit,' + units.join(','), ...units.map((a) => [a, ...units.map((b) => (a === b ? '' : eff(a, b)?.toFixed(3) ?? ''))].join(','))].join('\n') + '\n');
    console.log(lines.join('\n'));
  }, 6 * 3_600_000);
});

describe.skipIf(!process.env.REGRESS)('regression scenarios (Fun Pass 20.3)', () => {
  it('report', () => {
    const t0 = Date.now(), rs = regressions(), date = new Date().toISOString().slice(0, 10);
    const pct = (x: number) => `${Math.round(x * 100)}%`;
    const lines = [
      `# Regressiescenario's (${date})`, '',
      'Vaste gevechten (plan/fun-pass-plan.md 20.3). Geen pass/fail: een wijziging die een scenario omdraait moet bewust zijn. Kant A valt aan (attack-move, of een aanval op het doel), kant B houdt stand rond zijn eigen positie; gebouwen hebben stroom. Max 90 s.', '',
      '| Scenario | Budget A / B | Winnaar | Over A | Over B | Duur (s) | TTK mediaan (s) | Opmerking |', '|---|---|---|---:|---:|---:|---:|---|',
      ...rs.map((r) => `| ${r.name} | ${r.budget} | ${r.winner} | ${pct(r.aLeft)} | ${pct(r.bLeft)} | ${r.secs} | ${r.ttk === null ? '–' : r.ttk.toFixed(1)} | ${r.note} |`),
      '', `_${rs.length} scenario's in ${Math.round((Date.now() - t0) / 1000)} s._`,
    ];
    mkdirSync('docs/metingen', { recursive: true });
    const base = `docs/metingen/${date}-${process.env.REGRESS_OUT ?? 'scenarios'}`;
    writeFileSync(`${base}.md`, lines.join('\n') + '\n');
    writeFileSync(`${base}.json`, JSON.stringify(rs, null, 1));
    console.log(lines.join('\n'));
  }, 3_600_000);
});
