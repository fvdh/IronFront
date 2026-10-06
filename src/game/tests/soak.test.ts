// Release soak test: full AI-vs-AI games with invariant checks every second.
// Quick variant runs by default; the long sweep is opt-in: SOAK=12 npx vitest run soak --silent=false
import { describe, expect, it } from 'vitest';
import { blockedAt, moveOf } from '../core/entities';
import { fullCharge } from '../systems/powers';
import { tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { BUILDINGS } from '../data/buildings';
import { QUEUE_LIMIT, TICK_RATE } from '../data/config';
import { UNITS } from '../data/units';
import { isMoving } from '../systems/movement';
import type { Difficulty, GameSettings, GameState } from '../types';

declare const process: { env: Record<string, string | undefined> };
const N = Number(process.env.SOAK ?? 0);

/** Every invariant a release build must keep. Returns readable violations (empty = healthy). */
function check(s: GameState, still: Map<number, { x: number; y: number; t: number }>): string[] {
  const bad: string[] = [];
  for (const p of s.players) {
    if (!Number.isFinite(p.credits) || p.credits < -1e-6) bad.push(`P${p.id} credits ${p.credits}`);
    // AI never has more money than its start + harvest (cancels/sells only refund what was spent).
    if (p.ai && p.credits > s.settings.startCredits + p.stats.harvested + (p.stats.stolen ?? 0) + (p.stats.bonus ?? 0) + 1e-6) bad.push(`P${p.id} has unearned credits`);
    for (const [cat, q] of Object.entries(p.queues)) {
      if (q.length > QUEUE_LIMIT) bad.push(`P${p.id} ${cat} queue ${q.length}`);
      for (const it of q) { const cost = (BUILDINGS[it.def] ?? UNITS[it.def]).cost; if (it.spent > cost + 1e-6 || it.spent < -1e-6) bad.push(`queue spent ${it.spent}/${cost}`); }
    }
  }
  const grid = new Int32Array(s.map.w * s.map.h);
  for (const e of s.entities) {
    if (e.hp <= 0 || s.rt.byId.get(e.id) !== e) bad.push(`entity ${e.id} dead/unindexed`);
    if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) { bad.push(`${e.def}#${e.id} NaN position`); continue; }
    if (e.kind === 'building') {
      const d = BUILDINGS[e.def];
      if (e.hp > d.hp + 1e-6) bad.push(`${e.def} overheal`);
      if (!d.bridge) for (let y = e.y; y < e.y + d.h; y++) for (let x = e.x; x < e.x + d.w; x++) grid[y * s.map.w + x] = e.id;
      if (d.garrison && !e.passengers?.length && e.owner !== s.neutral) bad.push(`${e.def} empty but not civilian`);
      if (d.bridge && !!e.ruined !== (s.map.terrain[e.y * s.map.w + e.x] === 2)) bad.push('bridge state vs terrain out of sync');
      if (d.superweapon && ((e.charge ?? 0) < 0 || (e.charge ?? 0) > fullCharge(e.def))) bad.push(`${e.def} charge ${e.charge}`);
      if ((e.stasisUntil ?? 0) > s.tick + 20 * TICK_RATE) bad.push(`${e.def} stasis too long`);
      continue;
    }
    const d = UNITS[e.def];
    if (e.hp > d.hp + 1e-6) bad.push(`${e.def} overheal`);
    // Transport bookkeeping: both sides agree, never over capacity.
    if (e.inside && !s.rt.byId.get(e.inside)?.passengers?.includes(e.id)) bad.push(`${e.def}#${e.id} orphan passenger`);
    if (e.passengers && (e.passengers.length > (d.transport ?? 0) || e.passengers.some((id) => s.rt.byId.get(id)?.inside !== e.id))) bad.push(`${e.def}#${e.id} passenger list out of sync`);
    if ((e.phased ?? 0) > 0 && (e.frozenUntil ?? 0) < s.tick - 1) bad.push(`${e.def}#${e.id} stays phased`);
    if (e.master && !s.rt.byId.get(e.master)) bad.push(`${e.def}#${e.id} master gone but not freed`);
    if (e.leechBy !== undefined && UNITS[e.def].category !== 'vehicle') bad.push(`${e.def}#${e.id} leech on non-vehicle`);
    if (e.bombAt && e.bombAt < s.tick - 1) bad.push(`${e.def}#${e.id} bomb never went off`);
    if ((e.frozenUntil ?? 0) > s.tick + 120) bad.push(`${e.def}#${e.id} frozen too long`);
    if ((e.stasisUntil ?? 0) > s.tick + 20 * TICK_RATE) bad.push(`${e.def}#${e.id} stasis too long`);
    if (UNITS[e.def].category === 'infantry' && (e.stasisUntil ?? 0) > s.tick) bad.push(`${e.def}#${e.id} infantry in stasis`);
    if (e.ammo !== undefined && (e.ammo < 0 || e.ammo > d.ammo!)) bad.push(`${e.def}#${e.id} ammo ${e.ammo}`);
    if (e.landed && e.pad && s.entities.some((o) => o !== e && o.landed && o.pad === e.pad && o.padK === e.padK)) bad.push(`${e.def}#${e.id} shares a landing pad`);
    if (e.x < 0 || e.y < 0 || e.x >= s.map.w || e.y >= s.map.h) bad.push(`${e.def}#${e.id} off map`);
    else if (!d.air && !e.inside && blockedAt(s, e.x, e.y, moveOf(e))) bad.push(`${e.def}#${e.id} inside obstacle at ${e.x.toFixed(1)},${e.y.toFixed(1)}`);
    // Stuck: wants to move but hasn't moved for 30 s.
    const last = still.get(e.id);
    if (!last || !isMoving(e) || Math.hypot(last.x - e.x, last.y - e.y) > 0.3) still.set(e.id, { x: e.x, y: e.y, t: s.tick });
    else if (isMoving(e) && s.tick - last.t > 30 * TICK_RATE) { bad.push(`${e.def}#${e.id} stuck (${e.order.type}) at ${e.x.toFixed(1)},${e.y.toFixed(1)}`); still.set(e.id, { x: e.x, y: e.y, t: s.tick }); }
  }
  if (s.hazards?.some((h) => h.until < s.tick)) bad.push('expired hazard kept');
  for (const p of s.players) if (p.ai && s.entities.filter((e) => e.owner === p.id && e.kind === 'unit' && UNITS[e.def].hero).length > 1) bad.push(`P${p.id} has two heroes`);
  for (let i = 0; i < grid.length; i++) if (grid[i] !== s.rt.grid[i]) { bad.push(`occupancy grid out of sync at ${i}`); break; }
  return bad;
}

function soak(settings: Partial<GameSettings>, minutes: number, diffs: Difficulty[]) {
  const s = createGame({ ...DEFAULT_SETTINGS, ...settings });
  s.players[0].ai = true;
  s.ai.unshift({ player: 0, nextThink: 0, attackWave: 0, nextAttack: s.ai[0].nextAttack, attacking: [], lastPlace: 0 });
  s.ai.forEach((a, k) => { a.difficulty = diffs[k % diffs.length]; });
  const still = new Map<number, { x: number; y: number; t: number }>();
  const problems = new Map<string, number>();
  while (s.tick < minutes * 60 * TICK_RATE && s.winner === -1) {
    tick(s);
    s.rt.events.length = 0; // nothing consumes events headless
    if (s.tick % TICK_RATE === 0) for (const b of check(s, still)) { const k = b.replace(/#\d+| at .*$|\d+(\.\d+)?/g, ''); problems.set(k, (problems.get(k) ?? 0) + 1); if (problems.get(k) === 1) console.log(`[${(s.tick / TICK_RATE / 60).toFixed(1)}m] ${b}`); }
  }
  return { s, problems };
}

describe('release soak', () => {
  it('quick: one 4-player game keeps every invariant', () => {
    const { problems } = soak({ seed: 77, mapSize: 'medium', mapPreset: 'rivers', aiCount: 3, faction: 'psi', town: true, crates: true }, 6, ['hard', 'normal', 'easy', 'hard']);
    expect([...problems.keys()]).toEqual([]);
  }, 300_000);

  it.skipIf(!N)('long sweep over maps, sizes, factions and difficulties', () => {
    const maps = ['plains', 'rivers', 'highlands', 'coast', 'islands', 'random'], sizes = ['small', 'medium', 'large'] as const, factions = ['allies', 'soviets', 'psi'] as const;
    const all = new Map<string, number>();
    for (let g = 0; g < N; g++) {
      const cfg = { seed: 500 + g, town: true, crates: true, mapPreset: maps[g % maps.length], mapSize: sizes[g % 3], aiCount: 1 + (g % 3), faction: factions[g % 3], enemyFaction: factions[(g + 1) % 3] };
      const { s, problems } = soak(cfg, 20, [(['easy', 'normal', 'hard'] as const)[g % 3], 'hard']);
      console.log(`#${g} ${cfg.mapPreset}/${cfg.mapSize} ${s.players.length}p → ${s.winner === -1 ? 'running' : 'P' + s.winner} @${(s.tick / TICK_RATE / 60).toFixed(1)}m, ${s.entities.length} entities, problems: ${[...problems].map(([k, n]) => `${k}×${n}`).join('; ') || 'none'}`);
      for (const [k, n] of problems) all.set(k, (all.get(k) ?? 0) + n);
    }
    expect([...all.keys()]).toEqual([]);
  }, 3_600_000);
});
