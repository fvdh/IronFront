import { describe, expect, it } from 'vitest';
import { rebuildRuntime, spawnBuilding, spawnUnit } from '../core/entities';
import { tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { TICK_RATE } from '../data/config';
import { damageBridge } from '../systems/bridges';
import { commandAttack } from '../systems/orders';
import type { GameState } from '../types';
import { regions, T } from '../world/map';

const run = (s: GameState, seconds: number) => { for (let k = 0; k < seconds * TICK_RATE; k++) tick(s); };
/** Player 1 is a hard AI with a ready base in the top-right corner; player 0 just stands there. */
const ai = (extra = {}) => {
  const s = createGame({ ...DEFAULT_SETTINGS, seed: 7, difficulty: 'hard', ...extra });
  s.map.terrain.fill(T.Grass);
  s.map.ore.fill(0);
  s.map.rev = 1;
  s.entities = s.entities.filter((e) => e.owner !== s.neutral);
  rebuildRuntime(s);
  for (const p of s.players) { p.visible.fill(1); p.explored.fill(1); p.credits = 20_000; }
  s.ai[0].nextAttack = 1e9; // no attack waves: watch the side jobs
  for (const [d, x, y] of [['power', 46, 4], ['power', 48, 4], ['power', 50, 4], ['refinery', 46, 12], ['barracks', 50, 12], ['factory', 44, 7], ['radar', 57, 12]] as const) {
    const b = spawnBuilding(s, d, 1, x, y); b.seenBy = 0xff;
  }
  return s;
};
const neutral = (s: GameState, def: string, x: number, y: number) => { const b = spawnBuilding(s, def, s.neutral!, x, y); b.seenBy = 0xff; return b; };

describe('phase 13: the AI uses everything', () => {
  it('sends an engineer to take a free tech building near its base', () => {
    const s = ai({ town: true, enemyFaction: 'soviets' });
    const rig = neutral(s, 'techrig', 40, 18);
    run(s, 40);
    expect(rig.owner).toBe(1);
  });

  it('rebuilds a bridge it knows was destroyed', () => {
    const s = ai({ town: true });
    const m = s.map;
    for (let y = 0; y < m.h; y++) for (let x = 30; x < 33; x++) m.terrain[y * m.w + x] = T.Water;
    for (let x = 30; x < 33; x++) m.terrain[20 * m.w + x] = T.Bridge;
    m.rev = 5;
    const segs = [30, 31, 32].map((x) => neutral(s, 'bridge', x, 20));
    for (const e of segs) e.link = segs[0].id;
    const hut = neutral(s, 'bridgehut', 34, 22);
    hut.link = segs[0].id;
    damageBridge(s, segs[0], 1e9);
    expect(segs[0].ruined).toBe(true);
    run(s, 60);
    expect(segs[0].ruined).toBe(false);
  });

  it('garrisons an empty town building near home with idle infantry', () => {
    const s = ai({ town: true, enemyFaction: 'soviets' });
    const house = neutral(s, 'civoffice', 44, 16);
    for (let k = 0; k < 5; k++) spawnUnit(s, 'rifle', 1, 47.5 + k * 0.6, 18.5);
    run(s, 45);
    expect(house.owner).toBe(1);
    expect(house.passengers!.length).toBeGreaterThan(0);
  });

  it('a Mentalist lets loose its psi wave on a group of enemy infantry', () => {
    const s = ai({ enemyFaction: 'psi' });
    const m = spawnUnit(s, 'mentalist', 1, 40.5, 20.5);
    const inf = [0, 1, 2, 3].map((k) => spawnUnit(s, 'rifle', 0, 39.5 + k * 0.5, 22));
    run(s, 4);
    expect(m.abCd).toBeGreaterThan(0);
    expect(inf.filter((u) => u.hp > 0).length).toBeLessThan(4);
  });

  it('ferries infantry across water when there is no land route to the enemy', () => {
    const s = ai({ enemyFaction: 'allies' });
    const m = s.map;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (Math.abs(x - y) < 4) m.terrain[y * m.w + x] = T.Water; // a strait between the corners
    m.rev = 6;
    const reg = regions(m);
    expect(reg[54 * m.w + 9]).not.toBe(reg[9 * m.w + 54]);
    expect(reg[54 * m.w + 9]).toBeGreaterThanOrEqual(0);
    for (let k = 0; k < 6; k++) spawnUnit(s, 'rifle', 1, 44.5 + (k % 3), 20.5 + Math.floor(k / 3));
    run(s, 150);
    const across = s.entities.filter((e) => e.owner === 1 && e.def === 'rifle' && e.hp > 0 && !e.inside && e.x < e.y).length;
    const lost = s.players[1].stats.losses;
    expect(s.entities.some((e) => e.owner === 1 && e.def === 'amphib')).toBe(true);
    expect(across + lost).toBeGreaterThan(0); // landed (and maybe already fighting)
  }, 60_000);

  it('anti-air shoots down Leviathan missiles; undefended targets get hit', () => {
    const s = ai({ enemyFaction: 'soviets' });
    s.ai.length = 0;
    const m = s.map;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < 6; x++) m.terrain[y * m.w + x] = T.Water;
    m.rev = 7;
    const lev = spawnUnit(s, 'leviathan', 1, 2.5, 20.5), lev2 = spawnUnit(s, 'leviathan', 1, 2.5, 40.5);
    const covered = spawnBuilding(s, 'power', 0, 14, 20), bare = spawnBuilding(s, 'power', 0, 14, 40);
    covered.seenBy = bare.seenBy = 0xff;
    spawnBuilding(s, 'power', 0, 20, 30);
    spawnBuilding(s, 'samsite', 0, 12, 23).seenBy = 0xff;
    commandAttack(s, 1, [lev.id], covered.id);
    commandAttack(s, 1, [lev2.id], bare.id);
    run(s, 15);
    expect(covered.hp).toBe(750);
    expect(bare.hp).toBeLessThan(750);
  });
});
