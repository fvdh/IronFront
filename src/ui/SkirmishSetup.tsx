import { useMemo, useState } from 'react';
import { uiClick } from './sound';
import { AI_NAMES, DEFAULT_SETTINGS } from '../game/core/state';
import { PLAYER_COLORS as DEFAULT_COLORS, START_CREDIT_OPTIONS } from '../game/data/config';
import { OKABE_ITO, settings } from '../settings';
import { displayName, FACTIONS } from '../game/data/factions';
import { UNITS } from '../game/data/units';
import type { Difficulty, FactionId, GameSettings } from '../game/types';
import { generateMap, MAP_PRESETS, startPositions } from '../game/world/mapgen';
import { Emblem } from './icons';
import { MapPreview } from './MapPreview';

const FACTION_IDS = Object.keys(FACTIONS) as FactionId[];
interface Slot { faction: FactionId | 'random'; color: string; difficulty: Difficulty }

/** Skirmish lobby: your faction as three emblems, a row per player, the real map of this seed, options folded away. */
export function SkirmishSetup({ onStart, onBack }: { onStart(s: GameSettings): void; onBack(): void }) {
  const PLAYER_COLORS = settings.get().colorblind ? OKABE_ITO : DEFAULT_COLORS;
  const [s, set] = useState<GameSettings>({ ...DEFAULT_SETTINGS, color: PLAYER_COLORS[0], seed: (Math.random() * 1e9) | 0, town: true, crates: true });
  const [slots, setSlots] = useState<Slot[]>([{ faction: 'random', color: PLAYER_COLORS[1], difficulty: 'normal' }]);
  const up = (patch: Partial<GameSettings>) => { uiClick(); set({ ...s, ...patch }); };
  const colors = [s.color, ...slots.map((a) => a.color)];
  const nextColor = (cur: string) => { // cycle to the next colour nobody else has
    const i = PLAYER_COLORS.indexOf(cur);
    for (let k = 1; k <= PLAYER_COLORS.length; k++) { const c = PLAYER_COLORS[(i + k) % PLAYER_COLORS.length]; if (c === cur || !colors.includes(c)) return c; }
    return cur;
  };
  const setSlot = (i: number, patch: Partial<Slot>) => { uiClick(); setSlots(slots.map((a, k) => (k === i ? { ...a, ...patch } : a))); };
  const addAI = () => {
    uiClick();
    setSlots([...slots, { faction: 'random', color: PLAYER_COLORS.find((c) => !colors.includes(c))!, difficulty: slots.at(-1)!.difficulty }]);
  };

  const map = useMemo(() => generateMap(s, 1 + slots.length), [s.mapPreset, s.mapSize, s.resources, s.seed, slots.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const starts = useMemo(() => startPositions(map.w, map.h).slice(0, 1 + slots.length), [map, slots.length]);
  const preset = MAP_PRESETS.find((m) => m.id === s.mapPreset)!;

  const start = () => {
    uiClick();
    const ais = slots.map((a) => ({ ...a, faction: a.faction === 'random' ? FACTION_IDS[(Math.random() * 3) | 0] : a.faction }));
    onStart({ ...s, ais, aiCount: ais.length, enemyFaction: ais[0].faction, difficulty: ais[0].difficulty });
  };

  return (
    <div className="screen lobby">
      <section className="panel lobby-main">
        <h2>Skirmish</h2>
        <h3>Your faction</h3>
        <div className="factions">
          {FACTION_IDS.map((f) => (
            <button key={f} className={`faction ${s.faction === f ? 'on' : ''}`} data-f={f} onClick={() => up({ faction: f })} aria-pressed={s.faction === f}>
              <Emblem faction={f} size={56} />
              <b>{FACTIONS[f].name}</b>
              <span>{FACTIONS[f].tagline}</span>
              <small>{Object.values(UNITS).filter((u) => u.factions.length === 1 && u.factions[0] === f).map((u) => displayName(u.id, f)).join(' · ')}</small>
            </button>
          ))}
        </div>
        <h3>Players</h3>
        <ol className="slots">
          <li className="slot well">
            <span className="num">1</span><Emblem faction={s.faction} size={30} /><b>Commander</b>
            <span className="you">{FACTIONS[s.faction].name}</span><span className="you">You</span>
            <button className="sw" style={{ background: s.color }} aria-label="Your colour: next" onClick={() => up({ color: nextColor(s.color) })} />
            <span />
          </li>
          {slots.map((a, i) => (
            <li key={i} className="slot well">
              <span className="num">{i + 2}</span>
              {a.faction === 'random' ? <span className="emblem-q" aria-hidden="true">?</span> : <Emblem faction={a.faction} size={30} />}
              <b>{AI_NAMES[i]}</b>
              <select aria-label={`${AI_NAMES[i]} faction`} value={a.faction} onChange={(e) => setSlot(i, { faction: e.target.value as Slot['faction'] })}>
                <option value="random">Random faction</option>
                {FACTION_IDS.map((f) => <option key={f} value={f}>{FACTIONS[f].name}</option>)}
              </select>
              <select aria-label={`${AI_NAMES[i]} difficulty`} value={a.difficulty} onChange={(e) => setSlot(i, { difficulty: e.target.value as Difficulty })}>
                <option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option>
              </select>
              <button className="sw" style={{ background: a.color }} aria-label={`${AI_NAMES[i]} colour: next`} onClick={() => setSlot(i, { color: nextColor(a.color) })} />
              {slots.length > 1 ? <button className="rm" aria-label={`Remove ${AI_NAMES[i]}`} onClick={() => { uiClick(); setSlots(slots.filter((_, k) => k !== i)); }}>×</button> : <span />}
            </li>
          ))}
          {slots.length < 3 && <li><button className="slot open" onClick={addAI}>+ Add AI opponent</button></li>}
        </ol>
        <p className="hint">Every player fights for themselves.</p>
      </section>
      <section className="panel lobby-map">
        <div className="well mapwell"><MapPreview map={map} starts={starts} colors={colors} label={`${preset.name}, ${1 + slots.length} start positions`} /></div>
        <p className="hint">{preset.description}</p>
        <div className="opts">
          <label>Map
            <select value={s.mapPreset} onChange={(e) => up({ mapPreset: e.target.value })}>
              {MAP_PRESETS.map((m) => <option key={m.id} value={m.id} title={m.description}>{m.name}</option>)}
            </select>
          </label>
          <label>Size
            <select value={s.mapSize} onChange={(e) => up({ mapSize: e.target.value as GameSettings['mapSize'] })}>
              <option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option>
            </select>
          </label>
          <label>Credits
            <select value={s.startCredits} onChange={(e) => up({ startCredits: Number(e.target.value) })}>
              {START_CREDIT_OPTIONS.map((c) => <option key={c} value={c}>${c.toLocaleString('en-US')}</option>)}
            </select>
          </label>
          <label className="check"><input type="checkbox" checked={s.superweapons !== false} onChange={(e) => up({ superweapons: e.target.checked })} /> Superweapons</label>
        </div>
        <details className="advanced">
          <summary>Advanced</summary>
          <div className="opts">
            <label>Ore
              <select value={s.resources} onChange={(e) => up({ resources: e.target.value as GameSettings['resources'] })}>
                <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
              </select>
            </label>
            <label className="check"><input type="checkbox" checked={!!s.town} onChange={(e) => up({ town: e.target.checked })} /> Civilians: towns, tech buildings, bridges</label>
            <label className="check"><input type="checkbox" checked={!!s.crates} onChange={(e) => up({ crates: e.target.checked })} /> Bonus crates</label>
            <label>Seed
              <span className="seed">
                <input type="number" value={s.seed} onChange={(e) => set({ ...s, seed: Number(e.target.value) | 0 })} />
                <button className="btn small" onClick={() => up({ seed: (Math.random() * 1e9) | 0 })} aria-label="Random seed">↻</button>
              </span>
            </label>
          </div>
        </details>
        <div className="actions">
          <button className="btn" onClick={() => { uiClick(); onBack(); }}>Back</button>
          <button className="btn primary" onClick={start}>Start skirmish</button>
        </div>
      </section>
    </div>
  );
}
