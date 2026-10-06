import { lazy, Suspense, useEffect, useState } from 'react';
import { audio } from './game/audio';
import { deserialize, SAVE_KEY, SaveError } from './game/core/save';
import { createGame, DEFAULT_SETTINGS } from './game/core/state';
import type { FactionId, GameSettings, GameState } from './game/types';
import { OKABE_ITO, settings as userSettings } from './settings';
import { CreditsScreen } from './ui/CreditsScreen';
import { MainMenu } from './ui/MainMenu';
import { SettingsPanel } from './ui/SettingsPanel';
import { SkirmishSetup } from './ui/SkirmishSetup';

// The game view and the ?art debug page pull in the renderer and three.js (~600 KB): load them on demand
// so the menu appears fast. The download starts as soon as the menu is shown (see preload below).
const loadGameView = () => import('./ui/GameView');
const GameView = lazy(() => loadGameView().then((m) => ({ default: m.GameView })));
// The live AI-vs-AI behind the menus needs the renderer too, so it comes with that chunk.
const Attract = lazy(() => import('./ui/Attract').then((m) => ({ default: m.Attract })));
const ArtDebug = lazy(() => import('./ui/ArtDebug').then((m) => ({ default: m.ArtDebug })));
const Deploying = () => <div className="game"><div className="viewport"><div className="loading"><b>Deploying…</b><div className="bar"><div style={{ width: '0%' }} /></div><span>Loading game modules</span></div></div></div>;

/** Colour-blind palette for games started without the lobby (New Game, Tutorial, Sandbox); the lobby picks from it itself. */
function colorblind(s: GameSettings): GameSettings {
  if (s.ais || OKABE_ITO.includes(s.color)) return s;
  const order: FactionId[] = ['allies', 'soviets', 'psi'];
  const ais = Array.from({ length: Math.max(1, Math.min(3, s.aiCount)) }, (_, i) => ({ faction: order[(order.indexOf(s.enemyFaction) + i) % 3], color: OKABE_ITO[i + 1], difficulty: s.difficulty }));
  return { ...s, color: OKABE_ITO[0], ...(s.mode === 'sandbox' ? {} : { ais }) };
}

type Screen = { name: 'menu' | 'setup' | 'settings' | 'credits' } | { name: 'game'; state: GameState; key: number };

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' });
  const [error, setError] = useState<string | null>(null);
  // Warm the game chunk once the menu is up, so starting a game rarely waits on the download.
  useEffect(() => { const t = setTimeout(() => { void loadGameView(); }, 1000); return () => clearTimeout(t); }, []);

  const play = (picked: GameSettings) => {
    const settings = userSettings.get().colorblind ? colorblind(picked) : picked;
    audio.unlock();
    setError(null);
    setScreen({ name: 'game', state: createGame(settings), key: Date.now() });
  };

  const load = () => {
    audio.unlock();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) throw new SaveError('No saved game found.');
      setScreen({ name: 'game', state: deserialize(raw), key: Date.now() });
      setError(null);
    } catch (e) {
      setError(e instanceof SaveError ? e.message : `Load failed: ${(e as Error).message}`);
      setScreen({ name: 'menu' });
    }
  };

  const menu = () => setScreen({ name: 'menu' });
  if (import.meta.env.DEV && location.search.includes('art')) return <Suspense fallback={<p>loading…</p>}><ArtDebug /></Suspense>;

  const page = (() => { switch (screen.name) {
    case 'game':
      return (
        <Suspense fallback={<Deploying />}>
          <GameView
            key={screen.key}
            initial={screen.state}
            onQuit={menu}
            onRestart={() => play(screen.state.settings)}
            onLoad={load}
          />
        </Suspense>
      );
    case 'setup':
      return <SkirmishSetup onStart={play} onBack={menu} />;
    case 'settings':
      return (
        <div className="screen">
          <div className="panel">
            <h2>Options</h2>
            <SettingsPanel />
            <button className="btn" onClick={menu}>Back</button>
          </div>
        </div>
      );
    case 'credits':
      return <CreditsScreen onBack={menu} />;
    default:
      return (
        <MainMenu
          error={error}
          onNewGame={() => play({ ...DEFAULT_SETTINGS, seed: (Math.random() * 1e9) | 0 })}
          onSkirmish={() => setScreen({ name: 'setup' })}
          onTutorial={() => play({ ...DEFAULT_SETTINGS, mode: 'tutorial', difficulty: 'easy', mapPreset: 'plains', mapSize: 'small', seed: 2024 })}
          onSandbox={() => play({ ...DEFAULT_SETTINGS, mode: 'sandbox', seed: (Math.random() * 1e9) | 0 })}
          onLoad={load}
          onSettings={() => setScreen({ name: 'settings' })}
          onCredits={() => setScreen({ name: 'credits' })}
        />
      );
  } })();
  if (screen.name === 'game') return page;
  return <>{(!navigator.webdriver || location.search.includes('attract')) && <Suspense fallback={null}><Attract tag={screen.name === 'menu'} /></Suspense>}{page}</>;
}
