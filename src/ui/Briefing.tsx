// Loading screen as a briefing: the map with start positions, your faction, the real load steps and rotating tips.
import { useEffect, useState } from 'react';
import { FACTIONS } from '../game/data/factions';
import type { GameState } from '../game/types';
import { MAP_PRESETS, startPositions } from '../game/world/mapgen';
import { Emblem } from './icons';
import { MapPreview } from './MapPreview';

const TIPS = [
  'Right-click a cameo to put it on hold; right-click again to cancel and get your money back.',
  'Hold the right mouse button and drag to scroll the map.',
  'Space jumps the camera to the latest alert.',
  'Ctrl + number makes a group; press the number twice to jump to it.',
  'Low power slows production and switches off defences that need it. Watch the power rail.',
  'Engineers capture enemy structures and tech buildings, and repair bridges.',
  'F gives an attack-move: units fight anything they meet on the way.',
  'Infantry can garrison empty civilian buildings: right-click the building.',
  'Ore regrows slowly. Gems are worth more than ore.',
  'A Construction Yard deploys from a Base Crawler: build one to expand.',
];

export function Briefing({ state, done, total }: { state: GameState; done: number; total: number }) {
  const me = state.players[0], players = state.players.filter((p) => !p.neutral);
  const preset = MAP_PRESETS.find((m) => m.id === state.settings.mapPreset);
  const [tip, setTip] = useState(() => (Math.random() * TIPS.length) | 0);
  useEffect(() => { const t = setInterval(() => setTip((n) => (n + 1) % TIPS.length), 5000); return () => clearInterval(t); }, []);
  const starts = startPositions(state.map.w, state.map.h).slice(0, players.length);
  const baked = total > 0 && done >= total;
  return (
    <div className="loading briefing" data-faction={me.faction}>
      <section className="panel brief">
        <header>
          <Emblem faction={me.faction} size={64} />
          <div>
            <small>{FACTIONS[me.faction].name} · {state.settings.mode === 'tutorial' ? 'Training' : state.settings.mode === 'sandbox' ? 'Sandbox' : 'Skirmish'}</small>
            <h1>{preset?.name ?? 'Battlefield'}</h1>
          </div>
        </header>
        <div className="brief-body">
          <div className="well mapwell"><MapPreview map={state.map} starts={starts} colors={players.map((p) => p.color)} width={300} label={`${preset?.name ?? 'Map'}: you start at position 1`} /></div>
          <div>
            <p className="objective">Objective: destroy every enemy structure.</p>
            <ol className="foes">
              {players.map((p, i) => <li key={p.id}><i className="dot" style={{ background: p.color }} />{i + 1}. {p.name}<small>{FACTIONS[p.faction].name}</small></li>)}
            </ol>
          </div>
        </div>
        <pre className="term" aria-live="polite">
          {`> Map generated: ${state.map.w} × ${state.map.h} tiles\n`}
          {`> Baking sprites… ${done}/${total || '?'}${baked ? '  done' : ''}\n`}
          {baked ? '> Deploying forces…' : <span className="cursor">_</span>}
        </pre>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={total || 1} aria-valuenow={done} aria-label="Loading"><div style={{ width: `${total ? (100 * done) / total : 0}%` }} /></div>
        <p className="brief-tip"><b>Tip</b> {TIPS[tip]}</p>
      </section>
    </div>
  );
}
