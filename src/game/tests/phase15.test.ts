import { describe, expect, it } from 'vitest';
import { tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { enqueue, holdOrCancel, resume } from '../systems/production';

describe('phase 15: on hold', () => {
  it('right-click holds production, left-click resumes, a second right-click cancels with refund', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, seed: 3 });
    const p = s.players[0];
    p.credits = 5000;
    expect(enqueue(s, 0, 'power')).toBe('ok');
    for (let k = 0; k < 60; k++) tick(s);
    const it = p.queues.building[0];
    expect(holdOrCancel(s, 0, 'power')).toBe('hold');
    const [prog, credits] = [it.progress, p.credits];
    for (let k = 0; k < 60; k++) tick(s);
    expect(it.progress).toBe(prog); // frozen
    expect(p.credits).toBeCloseTo(credits);
    expect(resume(s, 0, 'power')).toBe(true);
    for (let k = 0; k < 10; k++) tick(s);
    expect(it.progress).toBeGreaterThan(prog);
    expect(holdOrCancel(s, 0, 'power')).toBe('hold');
    expect(holdOrCancel(s, 0, 'power')).toBe('cancel');
    expect(p.queues.building.length).toBe(0);
    expect(p.credits).toBeCloseTo(5000);
  });
});
