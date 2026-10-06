import { Profiler, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Game } from '../game/Game';
import { artMemory, prepareArt } from '../game/render/art';
import { bakeBridges } from '../game/render/bridge';
import { TUTORIAL } from '../game/tutorial';
import type { GameState } from '../game/types';
import { SettingsPanel } from './SettingsPanel';
import { announcerName } from '../game/announcer';
import { Icon } from './icons';
import { CommandBar, Sidebar, SuperweaponTimers, useDrawer } from './Sidebar';
import { Briefing } from './Briefing';
import { settings } from '../settings';
import { ScoreScreen } from './ScoreScreen';

const noop = () => () => {};
/** Dev builds: total React time spent on the HUD (window.__hud), for the performance budget test. */
const hudTime = (_id: string, _phase: string, ms: number) => {
  if (!import.meta.env.DEV) return;
  const w = window as unknown as { __hud?: { ms: number; commits: number } };
  const h = (w.__hud ??= { ms: 0, commits: 0 });
  h.ms += ms; h.commits++;
};
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

interface Props { initial: GameState; onQuit(): void; onRestart(): void; onLoad(): void }

export function GameView({ initial, onQuit, onRestart, onLoad }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vpRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Game | null>(null);

  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    let g: Game | null = null, ro: ResizeObserver | null = null, dead = false;
    // Bake the 3D art for the teams in this game first (cached across games).
    const t0 = performance.now();
    // Bake after the briefing has painted (the first job blocks the page for a moment), and keep the briefing up
    // at least a second so a cached reload doesn't flash it.
    const art = new Promise((r) => setTimeout(r, 50)).then(() => prepareArt(initial.players.filter((p) => !p.neutral), (_, done, total) => setProgress({ done, total })));
    Promise.all([art, new Promise((r) => setTimeout(r, 1000))]).then(() => {
      bakeBridges(initial.map);
      if (import.meta.env.DEV) console.info(`[load] art ready in ${Math.round(performance.now() - t0)} ms${document.hidden ? ' (background tab)' : ''}`, artMemory());
      if (dead) return;
      g = new Game(initial, canvasRef.current!);
      const vp = vpRef.current!;
      const r = vp.getBoundingClientRect();
      g.resize(r.width, r.height);
      ro = new ResizeObserver(([e]) => g!.resize(e.contentRect.width, e.contentRect.height));
      ro.observe(vp);
      g.start();
      setGame(g);
    });
    return () => { dead = true; ro?.disconnect(); g?.destroy(); };
  }, [initial]);

  useSyncExternalStore(game ? game.subscribe : noop, () => game?.version ?? 0);

  return (
    <Profiler id="hud" onRender={hudTime}>
    <div className="game" data-faction={game?.me.faction}>
      <div className="viewport" ref={vpRef}>
        <canvas ref={canvasRef} />
        {!game && <Briefing state={initial} done={progress.done} total={progress.total} />}
        {game && <TopBar game={game} />}
        {game && <div className="hud-left"><SuperweaponTimers game={game} />{settings.get().subtitles && <Messages game={game} />}</div>}
        {game && <CommandBar game={game} />}
        {game && <TouchMode game={game} />}
        {game?.help && <HelpOverlay onClose={() => { game.help = false; game.notify(); }} />}
        {game && game.s.settings.mode === 'tutorial' && game.tutorialStep < TUTORIAL.length && (
          <div className="tutorial">
            <b>Tutorial {game.tutorialStep + 1}/{TUTORIAL.length}</b>
            <p>{TUTORIAL[game.tutorialStep].text}</p>
          </div>
        )}
        {game && (game.placing || game.mode !== 'normal') && (
          <div className="modehint">{game.placing ? 'Place the structure. Right-click or Esc to cancel'
            : game.mode === 'attackMove' ? 'Attack-move: click a destination. Right-click to cancel'
            : game.mode === 'repair' ? 'Repair: click one of your structures (Shift = several). Right-click to stop'
            : 'Sell: click one of your structures. Right-click to cancel'}</div>
        )}
      </div>
      {game && <Sidebar game={game} />}
      {game?.showPause && !game.over && <PauseMenu game={game} onQuit={onQuit} onRestart={onRestart} onLoad={onLoad} />}
      {game?.over && <ScoreScreen game={game} onQuit={onQuit} onRestart={onRestart} />}
    </div>
    </Profiler>
  );
}

function TopBar({ game }: { game: Game }) {
  const [log, setLog] = useState(false);
  return (
    <div className="topbar">
      {log && <MessageLog game={game} onClose={() => setLog(false)} />}
      <span className="timer plate" title="Game time">{fmt(game.gameTime())}</span>
      <div className="speed plate" role="group" aria-label="Game speed">
        {[0.5, 1, 1.5, 2].map((v) => (
          <button key={v} className={game.speed === v ? 'on' : ''} onClick={() => game.setSpeed(v)} title={`Speed ${v}×`}>{v}×</button>
        ))}
      </div>
      <button className={game.paused ? 'on' : ''} onClick={() => game.togglePause()} title="Pause (P)">{game.paused ? 'Resume' : 'Pause'}</button>
      <button onClick={() => game.save()} title="Quick save">Save</button>
      <button className={log ? 'on' : ''} onClick={() => setLog(!log)} title="Message log">Log</button>
      <button onClick={() => game.openMenu(true)} title="Menu (Esc)">Menu</button>
      {game.paused && <span className="paused">PAUSED</span>}
      <button className={game.help ? 'on' : ''} onClick={() => { game.help = !game.help; game.notify(); }} title="Hotkeys (F1 / ?)">?</button>
    </div>
  );
}

/** Touch screens have no right button: a Select / Order switch decides what a tap on the map does. */
function TouchMode({ game }: { game: Game }) {
  if (!useDrawer()) return null;
  const set = (v: boolean) => { game.touchOrder = v; game.notify(); };
  return (
    <div className="touchmode plate" role="group" aria-label="Tap mode">
      <button className={game.touchOrder ? '' : 'on'} aria-pressed={!game.touchOrder} onClick={() => set(false)}><Icon name="select" size={18} />Select</button>
      <button className={game.touchOrder ? 'on' : ''} aria-pressed={game.touchOrder} onClick={() => set(true)}><Icon name="order" size={18} />Order</button>
    </div>
  );
}

/** Everything the announcer said this game, newest first. */
function MessageLog({ game, onClose }: { game: Game; onClose(): void }) {
  return (
    <div className="msglog plate" role="log" aria-label="Message log">
      <div className="msglog-head"><b>Message log</b><span>{announcerName(game.me.faction)}</span><button onClick={onClose} aria-label="Close log">×</button></div>
      <ol>{[...game.log].reverse().map((m, i) => <li key={i} className={`msg ${m.kind}`}><time>{fmt(m.t)}</time>{m.text}</li>)}</ol>
    </div>
  );
}

function Messages({ game }: { game: Game }) {
  return (
    <div className="messages" aria-live="polite">
      {game.messages.map((m) => <div key={m.text + m.t} className={`msg ${m.kind}`}>{m.text}</div>)}
    </div>
  );
}

function PauseMenu({ game, onQuit, onRestart, onLoad }: { game: Game; onQuit(): void; onRestart(): void; onLoad(): void }) {
  const [showSettings, setShowSettings] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  return (
    <div className="overlay">
      <div className="panel">
        <h2>Paused</h2>
        {showSettings ? (
          <>
            <SettingsPanel />
            <button className="btn" onClick={() => setShowSettings(false)}>Back</button>
          </>
        ) : (
          <>
            <button className="btn primary" onClick={() => game.openMenu(false)}>Resume</button>
            <button className="btn" onClick={() => setNote(game.save() ?? 'Game saved.')}>Save</button>
            <button className="btn" onClick={onLoad}>Load</button>
            <button className="btn" onClick={onRestart}>Restart</button>
            <button className="btn" onClick={() => setShowSettings(true)}>Options</button>
            <button className="btn" onClick={onQuit}>Main menu</button>
            {note && <p className="hint">{note}</p>}
          </>
        )}
      </div>
    </div>
  );
}

const KEYS: [string, string][] = [
  ['Left-click / drag', 'Select (double-click: all of that type on screen)'],
  ['Placing walls', 'Click and drag for a line'],
  ['Right-click', 'Move · attack · harvest ore · capture structure (Engineer)'],
  ['F', 'Attack-move: engage anything on the way'],
  ['G · X', 'Guard position · stop'],
  ['E', 'Ability: deploy, pack up, unload, dig in …'],
  ['Right-click own transport or empty civilian building', 'Infantry boards / garrisons the building'],
  ['Ctrl + right-click', 'Force-fire on civilian building or bridge'],
  ['Ctrl+1–9 · 1–9', 'Create group · select group (twice = jump camera)'],
  ['H', 'Camera to your base'],
  ['WASD / arrow keys / screen edge', 'Move camera (scroll wheel = zoom)'],
  ['Right-drag', 'Pan the map (middle button works too)'],
  ['P', 'Pause'],
  ['Space', 'Camera to the latest alert (red ring on the radar)'],
  ['Esc', 'Cancel / menu'],
  ['F1 / ?', 'This help'],
];

function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <h2>Hotkeys</h2>
        <table><tbody>{KEYS.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
        <p className="hint">Gold chevrons = veteran/elite · purple dot = mind-controlled · aircraft can only be hit by anti-air (see tooltip).</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
