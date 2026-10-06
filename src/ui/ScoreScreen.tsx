// End of a game: the result plate, your numbers counting up with bars, every player's score, and a rank.
import { useEffect, useState } from 'react';
import { audio } from '../game/audio';
import { reducedMotion } from '../settings';
import type { Game } from '../game/Game';
import { FACTIONS } from '../game/data/factions';
import type { Player } from '../game/types';
import { MAP_PRESETS } from '../game/world/mapgen';
import { matchRecord } from '../game/systems/telemetry';
import { Emblem } from './icons';

const RANKS: [number, string][] = [[0, 'Recruit'], [800, 'Private'], [1600, 'Sergeant'], [2800, 'Lieutenant'], [4200, 'Captain'], [6000, 'Major'], [8000, 'Colonel'], [10500, 'General'], [13500, 'Field Marshal']];
const SEGS = 28;

export const scoreOf = (p: Player, won: boolean) =>
  Math.max(0, Math.round(p.stats.harvested / 10 + p.stats.kills * 60 + p.stats.buildingsBuilt * 40 + p.stats.unitsBuilt * 15 - p.stats.losses * 20 + (won ? 2500 : 0)));
export const rankOf = (score: number) => RANKS.filter(([min]) => score >= min).at(-1)![1];

/** Download this match's telemetry as JSON (Fun Pass 20.4). Local only: nothing is sent anywhere. */
function exportMatch(game: Game) {
  const rec = matchRecord(game.s);
  if (!rec) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(rec)], { type: 'application/json' }));
  a.download = `iron-front-match-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}-${rec.build}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export function ScoreScreen({ game, onQuit, onRestart }: { game: Game; onQuit(): void; onRestart(): void }) {
  const s = game.s, me = game.me, win = s.winner === game.view.me;
  const players = s.players.filter((p) => !p.neutral);
  const rows: { label: string; get(p: Player): number; money?: boolean; bad?: boolean }[] = [
    { label: 'Ore harvested', get: (p) => Math.round(p.stats.harvested), money: true },
    { label: 'Units built', get: (p) => p.stats.unitsBuilt },
    { label: 'Structures built', get: (p) => p.stats.buildingsBuilt },
    { label: 'Enemies destroyed', get: (p) => p.stats.kills },
    { label: 'Units lost', get: (p) => p.stats.losses, bad: true },
  ];
  const scores = players.map((p) => scoreOf(p, s.winner === p.id));
  const best = Math.max(1, ...scores);
  const mine = scores[players.indexOf(me)];

  // Count up over ~1.6 s with a soft tick; instantly with reduced motion.
  const [k, setK] = useState(() => (reducedMotion() ? 1 : 0));
  useEffect(() => {
    if (k >= 1) return;
    let raf = 0, last = -1;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 1600), e = 1 - Math.pow(1 - t, 4);
      const n = Math.floor(e * 20);
      if (n !== last) { last = n; audio.play('click', 0.18); }
      setK(e);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="overlay score-bg">
      <section className={`panel score ${win ? 'win' : 'lose'}`} aria-labelledby="score-banner">
        <h1 id="score-banner" className="banner">
          <small>{MAP_PRESETS.find((m) => m.id === s.settings.mapPreset)?.name ?? 'Skirmish'} · {fmt(game.gameTime())}</small>
          <span>{win ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}</span>
        </h1>
        <div className="tally">
          {rows.map((r) => {
            const v = r.get(me), max = Math.max(1, ...players.map(r.get));
            const lit = Math.round((SEGS * v * k) / max);
            return (
              <div key={r.label} className={`row ${r.bad ? 'bad' : ''}`}>
                <span>{r.label}</span>
                <div className="segs" aria-hidden="true">{Array.from({ length: SEGS }, (_, i) => <i key={i} className={i < lit ? 'on' : ''} />)}</div>
                <b>{r.money ? '$' : ''}{Math.round(v * k).toLocaleString('en-US')}</b>
              </div>
            );
          })}
        </div>
        <ol className="standings">
          {players.map((p, i) => (
            <li key={p.id} className={p.id === me.id ? 'me' : ''}>
              <Emblem faction={p.faction} size={26} />
              <span className="name"><i className="dot" style={{ background: p.color }} />{p.name}<small>{FACTIONS[p.faction].name}{s.winner === p.id ? ' · winner' : p.defeated ? ' · defeated' : ''}</small></span>
              <span className="bar"><i style={{ width: `${(100 * scores[i] * k) / best}%`, background: p.color }} /></span>
              <b>{Math.round(scores[i] * k).toLocaleString('en-US')}</b>
            </li>
          ))}
        </ol>
        <div className="rank">
          <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><path d="M8 16l16-9 16 9M8 26l16-9 16 9M8 36l16-9 16 9" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" /></svg>
          Rank: {rankOf(mine)}
        </div>
        <div className="actions">
          {game.s.telemetry && <button className="btn" onClick={() => exportMatch(game)} title="Save this match's data as a JSON file (stays on your computer)">Export match data</button>}
          <button className="btn" onClick={onQuit}>Main menu</button>
          <button className="btn primary" onClick={onRestart}>Play again</button>
        </div>
      </section>
    </div>
  );
}
