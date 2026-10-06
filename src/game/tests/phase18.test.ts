import { describe, expect, it } from 'vitest';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { generateMap } from '../world/mapgen';
import { rankOf, scoreOf } from '../../ui/ScoreScreen';

describe('phase 18: lobby slots and score', () => {
  it('each AI slot gets its own faction, colour and level', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, seed: 3, ais: [
      { faction: 'psi', color: '#d8412f', difficulty: 'hard' },
      { faction: 'psi', color: '#3fae4a', difficulty: 'easy' },
    ] });
    const ps = s.players.filter((p) => !p.neutral);
    expect(ps.map((p) => p.faction)).toEqual(['allies', 'psi', 'psi']);
    expect(ps.map((p) => p.color)).toEqual([DEFAULT_SETTINGS.color, '#d8412f', '#3fae4a']);
    expect(s.ai.map((a) => [a.player, a.difficulty])).toEqual([[1, 'hard'], [2, 'easy']]);
  });

  it('settings without slots (older saves) still give the old line-up', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, seed: 3, aiCount: 2, enemyFaction: 'soviets' });
    expect(s.players.filter((p) => !p.neutral).map((p) => p.faction)).toEqual(['allies', 'soviets', 'psi']);
    expect(s.ai.every((a) => a.difficulty === undefined)).toBe(true);
  });

  it('the lobby preview is the map the game will be played on', () => {
    const settings = { ...DEFAULT_SETTINGS, seed: 99, mapPreset: 'rivers', town: false };
    const a = generateMap(settings, 3), s = createGame({ ...settings, aiCount: 2 });
    expect(Array.from(s.map.terrain)).toEqual(Array.from(a.terrain));
  });

  it('score and rank grow with what you did', () => {
    const p = createGame(DEFAULT_SETTINGS).players[0];
    expect(rankOf(scoreOf(p, false))).toBe('Recruit');
    p.stats = { harvested: 40000, unitsBuilt: 120, buildingsBuilt: 40, damageDealt: 0, kills: 90, losses: 20 };
    expect(scoreOf(p, true)).toBeGreaterThan(scoreOf(p, false));
    expect(rankOf(scoreOf(p, true))).toBe('Field Marshal');
  });
});
