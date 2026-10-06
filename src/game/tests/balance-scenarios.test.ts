// Balance scenarios with a target band (plan/balans-plan.md). Fast; part of every run so a later tweak can't undo them.
import { describe, expect, it } from 'vitest';
import { scenarios } from './balance-lab';

const PENDING: string[] = []; // scenarios still being balanced

describe('balance scenarios (B2 heroes, B3 mind control)', () => {
  const all = scenarios();
  for (const sc of all.filter((x) => !PENDING.some((p) => x.name.startsWith(p))))
    it(`${sc.name}: ${sc.want}`, () => expect(sc.ok, sc.got).toBe(true));
});
