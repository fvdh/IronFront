import { describe, expect, it } from 'vitest';
import { ANNOUNCER_LINES, announcerUrl, priorityOf, slug, SpeechQueue } from '../announcer';
import LINES from '../data/voicelines.json';
import type { FactionId } from '../types';

import gameSrc from '../Game.ts?raw';
import inputSrc from '../input.ts?raw';

const source = gameSrc + inputSrc;
const FILES = new Set(Object.keys(import.meta.glob('/public/assets/audio/voice/**/*.m4a')).map((k) => k.replace('/public/assets/audio/', '')));
const existsSync = (p: string) => FILES.has(p);

describe('phase 16: announcer', () => {
  it('every announcer line is said by the game (a literal, or a superweapon template)', () => {
    const templates = LINES.superweaponLines.map((l) => l.replace('{0}', '${name}'));
    for (const t of templates) expect(source, t).toContain(t);
    for (const t of LINES.announcer.filter((t) => t !== '@superweapons')) expect(source, t).toMatch(new RegExp(`'${t}'`));
  });

  it('every line has a recorded file for each announcer, every unit answer and hero line exists', () => {
    for (const f of Object.keys(LINES.announcers) as FactionId[])
      for (const t of ANNOUNCER_LINES) expect(existsSync(announcerUrl(f, t)), `${f}: ${t}`).toBe(true);
    for (const [f, a] of Object.entries(LINES.acks))
      for (const [cls, kinds] of Object.entries(a)) if (cls !== 'voice')
        for (const [kind, texts] of Object.entries(kinds as Record<string, string[]>))
          texts.forEach((_, i) => expect(existsSync(`voice/acks-${f}/${cls}-${kind}-${i}.m4a`)).toBe(true));
    for (const [h, d] of Object.entries(LINES.heroes))
      for (const kind of ['select', 'move', 'attack'] as const)
        d[kind].forEach((_, i) => expect(existsSync(`voice/hero-${h}/${kind}-${i}.m4a`)).toBe(true));
    // no stray files left from older line lists
    const want = new Set(ANNOUNCER_LINES.map((t) => `${slug(t)}.m4a`));
    for (const file of FILES) if (file.includes('/announcer-')) expect(want.has(file.split('/').pop()!), file).toBe(true);
  });

  it('the queue never repeats a line within its cooldown and speaks danger first', () => {
    const q = new SpeechQueue();
    expect(q.push('Building', 0, 0)).toBe(true);
    expect(q.push('Our base is under attack', 10, 10_000)).toBe(true);
    expect(q.push('Construction complete', 20, 4000)).toBe(true);
    expect(q.push('Our base is under attack', 30, 10_000)).toBe(false); // still queued / cooling down
    expect(q.next(40)).toBe('Our base is under attack');
    q.speaking(40, 1500);
    expect(q.next(500)).toBeNull(); // still talking: no overlap
    expect(q.next(1600)).toBe('Construction complete');
    q.speaking(1600, 0);
    expect(q.next(1700)).toBeNull(); // 'Building' (click feedback) went stale while the others spoke
    expect(q.push('Our base is under attack', 5000, 10_000)).toBe(false);
    expect(q.push('Our base is under attack', 10_011, 10_000)).toBe(true);
  });

  it('priorities: danger > things you wait for > click feedback', () => {
    expect(priorityOf('Warning: enemy Hammer Silo detected')).toBe(3);
    expect(priorityOf('Our harvester is under attack')).toBe(3);
    expect(priorityOf('Unit ready')).toBe(2);
    expect(priorityOf('Power restored')).toBe(2);
    expect(priorityOf('On hold')).toBe(1);
  });
});
