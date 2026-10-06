import { useSyncExternalStore } from 'react';
import { settings, type UserSettings } from '../settings';

function Slider({ label, k, min, max, step }: { label: string; k: keyof UserSettings; min: number; max: number; step: number }) {
  const s = useSyncExternalStore(settings.subscribe, settings.get);
  return (
    <label className="row">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={s[k] as number} onChange={(e) => settings.set({ [k]: Number(e.target.value) })} />
      <output>{k === 'scrollSpeed' ? s[k] : k === 'zoom' || k === 'gameSpeed' ? `${s[k]}×` : `${Math.round((s[k] as number) * 100)}%`}</output>
    </label>
  );
}

function Toggle({ label, k }: { label: string; k: keyof UserSettings }) {
  const s = useSyncExternalStore(settings.subscribe, settings.get);
  return (
    <label className="row">
      <span>{label}</span>
      <input type="checkbox" checked={s[k] as boolean} onChange={(e) => settings.set({ [k]: e.target.checked })} />
    </label>
  );
}

export function SettingsPanel() {
  return (
    <div className="settings">
      <h3>Sound</h3>
      <Slider label="Master volume" k="master" min={0} max={1} step={0.05} />
      <Slider label="Effects" k="sfx" min={0} max={1} step={0.05} />
      <Slider label="Interface" k="ui" min={0} max={1} step={0.05} />
      <Slider label="Music" k="music" min={0} max={1} step={0.05} />
      <Toggle label="Mute all" k="muted" />
      <Toggle label="Announcer" k="voice" />
      <Slider label="Announcer volume" k="voiceVol" min={0} max={1} step={0.05} />
      <Slider label="Unit voices" k="acks" min={0} max={1} step={0.05} />
      <h3>Display</h3>
      <Toggle label="Subtitles" k="subtitles" />
      <Slider label="Interface size" k="uiScale" min={0.9} max={1.25} step={0.05} />
      <Toggle label="Reduce motion" k="reduceMotion" />
      <Toggle label="Colour-blind palette" k="colorblind" />
      <p className="note">Player, health and order colours that stay apart with red-green colour blindness. Applies to new games.</p>
      <h3>Controls</h3>
      <Slider label="Scroll speed" k="scrollSpeed" min={300} max={2000} step={100} />
      <Toggle label="Edge scrolling" k="edgeScroll" />
      <Slider label="Default zoom" k="zoom" min={0.5} max={2} step={0.1} />
      <Slider label="Default game speed" k="gameSpeed" min={0.5} max={2} step={0.5} />
    </div>
  );
}
