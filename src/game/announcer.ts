// The announcer's spoken lines: which files exist, how urgent a line is, and a queue that never talks over itself.
// Pure logic (no Web Audio) so it can be unit-tested; audio.ts plays what `next()` hands out.
import LINES from './data/voicelines.json';
import type { FactionId } from './types';

export const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Every announcer line (exact message text), with the six superweapons expanded. */
export const ANNOUNCER_LINES: string[] = LINES.announcer.flatMap((t) =>
  t === '@superweapons' ? LINES.superweapons.flatMap((sw) => LINES.superweaponLines.map((l) => l.replace('{0}', sw))) : [t]);
const KNOWN = new Set(ANNOUNCER_LINES.map(slug));
export const hasLine = (text: string) => KNOWN.has(slug(text));
export const announcerName = (f: FactionId) => LINES.announcers[f].name;
export const announcerUrl = (f: FactionId, text: string) => `voice/announcer-${f}/${slug(text)}.m4a`;

/** 3 = danger (always first), 2 = things you wait for, 1 = click feedback. */
export function priorityOf(text: string): number {
  if (/attack|warning|lost|captured by|mind control|infiltration|mission/i.test(text)) return 3;
  if (/complete|ready|power|radar|promoted|options|online|activated|captured|reinforcements/i.test(text)) return 2;
  return 1;
}

interface Item { text: string; prio: number; at: number }

export class SpeechQueue {
  private queue: Item[] = [];
  private said = new Map<string, number>();
  private busyUntil = 0;

  /** Queue a line unless the same line was said less than `gapMs` ago. Returns whether it was queued. */
  push(text: string, now: number, gapMs: number): boolean {
    if (now - (this.said.get(text) ?? -1e9) < gapMs) return false;
    if (this.queue.some((q) => q.text === text)) return false;
    this.said.set(text, now);
    this.queue.push({ text, prio: priorityOf(text), at: now });
    return true;
  }

  /** The next line to speak once the previous one has finished; stale lines are dropped (danger keeps longer). */
  next(now: number): string | null {
    if (now < this.busyUntil) return null;
    this.queue = this.queue.filter((q) => now - q.at < (q.prio === 3 ? 6000 : q.prio === 2 ? 4000 : 1500));
    if (!this.queue.length) return null;
    let best = 0;
    for (let k = 1; k < this.queue.length; k++) if (this.queue[k].prio > this.queue[best].prio) best = k;
    return this.queue.splice(best, 1)[0].text;
  }

  /** The line handed out by next() plays for `ms`. */
  speaking(now: number, ms: number) { this.busyUntil = now + ms; }
  get size() { return this.queue.length; }
}

// ---- unit acknowledgements
export type AckKind = 'select' | 'move' | 'attack';
export type AckClass = 'infantry' | 'vehicle' | 'ship' | 'aircraft';

export function ackUrl(faction: FactionId, cls: AckClass, kind: AckKind, hero?: string): string {
  const h = hero ? (LINES.heroes as Record<string, Record<AckKind, string[]>>)[hero] : undefined;
  const n = (h ? h[kind] : LINES.acks[faction][cls][kind]).length;
  const i = Math.floor(Math.random() * n);
  return h ? `voice/hero-${hero}/${kind}-${i}.m4a` : `voice/acks-${faction}/${cls}-${kind}-${i}.m4a`;
}
export const isHeroVoice = (def: string) => def in LINES.heroes;
