// Persisted user settings with a tiny subscribe API for React (useSyncExternalStore).
export interface UserSettings {
  master: number;
  sfx: number;
  ui: number;
  music: number; // background music volume
  muted: boolean;
  voice: boolean; // announcer on/off
  voiceVol: number; // announcer volume
  acks: number; // unit acknowledgement volume
  scrollSpeed: number; // px per second
  edgeScroll: boolean;
  zoom: number;
  gameSpeed: number;
  subtitles: boolean; // announcer lines as text on the map (the log keeps them either way)
  reduceMotion: boolean; // on top of the system setting: no shake, no live menu battle, no count-ups
  uiScale: number; // HUD and menus, 0.9–1.25
  colorblind: boolean; // Okabe-Ito player colours, health and order colours that survive red-green blindness
}

const KEY = 'ironfront.settings';
const DEFAULTS: UserSettings = { master: 0.7, sfx: 0.8, ui: 0.6, music: 0.45, muted: false, voice: true, voiceVol: 0.9, acks: 0.7, scrollSpeed: 900, edgeScroll: true, zoom: 1, gameSpeed: 1, subtitles: true, reduceMotion: false, uiScale: 1, colorblind: false };

/** Merge stored settings over the defaults, keeping only known keys with the right type
 *  (older saves lack newer keys such as `music`; corrupt values fall back to the default). */
export function migrate(stored: unknown): UserSettings {
  const out: UserSettings = { ...DEFAULTS };
  if (!stored || typeof stored !== 'object') return out;
  const src = stored as Record<string, unknown>;
  for (const k of Object.keys(DEFAULTS) as (keyof UserSettings)[]) {
    const v = src[k];
    if (typeof v !== typeof DEFAULTS[k] || (typeof v === 'number' && !Number.isFinite(v))) continue;
    (out as unknown as Record<string, unknown>)[k] = v;
  }
  return out;
}

function load(): UserSettings {
  try {
    return migrate(JSON.parse(localStorage.getItem(KEY) ?? '{}'));
  } catch {
    return { ...DEFAULTS };
  }
}

let current = load();
const listeners = new Set<() => void>();

/** Reduce motion: the player's own choice, or the system setting. */
export const reducedMotion = () => current.reduceMotion || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);

/** Player colours: the default set, or Okabe-Ito (readable with every common colour blindness). */
export const OKABE_ITO = ['#0072b2', '#e69f00', '#009e73', '#f0e442', '#cc79a7', '#d55e00'];

export const settings = {
  get: () => current,
  set(patch: Partial<UserSettings>) {
    current = { ...current, ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* storage unavailable: keep in memory */ }
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
};
