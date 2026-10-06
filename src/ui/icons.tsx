// Original line icons and faction emblems for the HUD (drawn for Iron Front; no existing marks referenced).
import type { FactionId } from '../game/types';

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round' as const };

const ICONS = {
  struct: <><path d="M3 21V10l6-4v4l6-4v4l6-4v15Z" {...P} /><path d="M7 15h2m4 0h2" {...P} /></>,
  defense: <path d="M5 21v-9h14v9ZM8 12V7h8v5M12 7V2" {...P} />,
  infantry: <><circle cx="12" cy="5" r="2.6" fill="currentColor" /><path d="M8 22l1.5-8L8 10l4-1.5 4 1.5-1.5 4L16 22M12 9v5" {...P} strokeWidth={2.2} /></>,
  vehicle: <path d="M2 15h20v4H2zM5 15l2-5h9l2 5M12 10V7h9" {...P} />,
  wrench: <path d="M14.5 3.5a5 5 0 0 0-5.6 6.7L3 16.1 7.9 21l5.9-5.9a5 5 0 0 0 6.7-5.6l-3.1 3.1-3.4-.9-.9-3.4Z" fill="currentColor" />,
  sell: <path d="M12 2v20M17 6.5c-1-1.3-2.8-2-5-2-3 0-5 1.5-5 3.6 0 5 10 2.6 10 7.7 0 2.1-2 3.7-5 3.7-2.4 0-4.4-.9-5.4-2.4" {...P} strokeWidth={2.4} />,
  bolt: <path d="M14 2 4 14h7l-1 8 10-12h-7Z" fill="currentColor" />,
  lock: <><rect x="5" y="10" width="14" height="11" rx="1" fill="currentColor" /><path d="M8 10V7a4 4 0 0 1 8 0v3" {...P} strokeWidth={2.4} /></>,
  attackMove: <><circle cx="12" cy="12" r="7" {...P} /><path d="M12 2v5M12 17v5M2 12h5M17 12h5" {...P} /></>,
  guard: <path d="M12 2 20 5v7c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5Z" {...P} strokeWidth={2.2} />,
  stop: <><path d="M8 2h8l6 6v8l-6 6H8l-6-6V8Z" {...P} strokeWidth={2.2} /><path d="M8 12h8" {...P} strokeWidth={2.6} /></>,
  ability: <path d="M12 3v12M7 10l5 5 5-5M4 21h16" {...P} strokeWidth={2.2} />,
  select: <path d="M6 3v16l4.5-4 3 6.5 2.8-1.3-3-6.3H19Z" fill="currentColor" />,
  order: <><circle cx="12" cy="12" r="8" {...P} /><path d="M12 1v6M12 17v6M1 12h6M17 12h6" {...P} /></>,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="ico">{ICONS[name]}</svg>;
}

const EMBLEMS: Record<FactionId, React.ReactNode> = {
  allies: <><path d="M24 3 43 12v13c0 10-8 17-19 20C13 42 5 35 5 25V12Z" {...P} strokeWidth={2.5} /><path d="M12 27l12-8 12 8M12 35l12-8 12 8" {...P} strokeWidth={3.2} strokeLinejoin="miter" /><path d="M24 8v8" {...P} strokeWidth={2.5} /></>,
  soviets: <><circle cx="24" cy="24" r="17" {...P} strokeWidth={6} strokeDasharray="5.2 3.7" /><circle cx="24" cy="24" r="12" {...P} strokeWidth={2.5} /><path d="M15 20h18v6H15zM21 26h6v8h-6z" fill="currentColor" /></>,
  psi: <><path d="M24 4 44 40H4Z" {...P} strokeWidth={2.5} /><path d="M14 33a10 10 0 0 1 20 0M18 33a6 6 0 0 1 12 0" {...P} strokeWidth={2.4} /><circle cx="24" cy="21" r="3.2" fill="currentColor" /></>,
};

export function Emblem({ faction, size = 44 }: { faction: FactionId; size?: number }) {
  return <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className="emblem">{EMBLEMS[faction]}</svg>;
}
