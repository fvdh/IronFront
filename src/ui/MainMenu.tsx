import { SAVE_KEY } from '../game/core/save';
import pkg from '../../package.json';
import { uiClick } from './sound';

interface Props {
  error: string | null;
  onNewGame(): void;
  onSkirmish(): void;
  onTutorial(): void;
  onSandbox(): void;
  onLoad(): void;
  onSettings(): void;
  onCredits(): void;
}

export function MainMenu(p: Props) {
  let hasSave = false;
  try { hasSave = !!localStorage.getItem(SAVE_KEY); } catch { /* storage blocked */ }
  const b = (label: string, go: () => void, primary = false, note?: string) => (
    <button className={`btn ${primary ? 'primary' : ''}`} onClick={() => { uiClick(); go(); }}>{label}{note && <small>{note}</small>}</button>
  );
  return (
    <div className="screen menu-screen">
      <nav className="panel menu" aria-label="Main menu">
        <h1 className="logo">Iron <span>Front</span></h1>
        <p className="subtitle">Real-time strategy · Browser edition</p>
        {b('New Game', p.onNewGame, true)}
        {b('Skirmish', p.onSkirmish)}
        {b('Tutorial', p.onTutorial)}
        {b('Sandbox', p.onSandbox)}
        {hasSave && b('Load Game', p.onLoad, false, '1 save')}
        {b('Options', p.onSettings)}
        {b('Credits', p.onCredits)}
        {p.error && <p className="error" role="alert">{p.error}</p>}
      </nav>
      <p className="shell-ver">v{pkg.version} · MIT · open assets</p>
    </div>
  );
}
