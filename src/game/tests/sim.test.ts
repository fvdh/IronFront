import { describe, expect, it } from 'vitest';
import { spawnBuilding, spawnUnit } from '../core/entities';
import { deserialize, serialize, SaveError } from '../core/save';
import { checkVictory, tick } from '../core/sim';
import { createGame, DEFAULT_SETTINGS } from '../core/state';
import { TICK_RATE } from '../data/config';
import { findPath } from '../systems/pathfinding';
import { canPlace, cancel, catalog, enqueue, forFaction, place } from '../systems/production';
import { scanTarget } from '../systems/combat';
import { FACTIONS } from '../data/factions';
import { UNITS } from '../data/units';
import { BUILDINGS } from '../data/buildings';
import { commandAttack, commandCapture, commandMove, sellBuilding, setRally, toggleRepair } from '../systems/orders';
import { rankOf } from '../systems/combat';
import { hasRadar } from '../systems/economy';
import { WEAPONS } from '../data/weapons';
import type { GameState } from '../types';
import { idx, T } from '../world/map';

const run = (s: GameState, seconds: number) => { for (let k = 0; k < seconds * TICK_RATE; k++) tick(s); };
const passiveGame = () => {
  const s = createGame({ ...DEFAULT_SETTINGS, seed: 7 });
  s.players[1].passive = true; // freeze the AI for isolated system tests
  return s;
};
const cyOf = (s: GameState, owner: number) => s.entities.find((e) => e.owner === owner && e.def === 'cy')!;

describe('pathfinding', () => {
  it('routes around a wall and reports unreachable goals', () => {
    const s = passiveGame();
    const m = s.map;
    m.terrain.fill(T.Grass);
    for (let y = 0; y < 20; y++) m.terrain[idx(m, 10, y)] = T.Rock;
    const r = findPath(s, 5, 5, 15, 5);
    expect(r.complete).toBe(true);
    expect(r.path.some((i) => Math.floor(i / m.w) >= 20)).toBe(true); // went around the wall's end
    for (let y = 0; y < m.h; y++) m.terrain[idx(m, 10, y)] = T.Rock;
    expect(findPath(s, 5, 5, 15, 5).complete).toBe(false);
  });
});

describe('construction & production', () => {
  it('charges exactly the cost, waits without money and places validly', () => {
    const s = passiveGame();
    const p = s.players[0];
    p.credits = 500;
    expect(enqueue(s, 0, 'power')).toBe('ok');
    run(s, 12);
    expect(p.ready).toBeNull(); // 800 cost, only 500 available → waits
    expect(p.credits).toBeGreaterThanOrEqual(0);
    p.credits += 1000;
    run(s, 10);
    expect(p.ready).toBe('power');
    expect(p.credits).toBeCloseTo(700, 5);
    const cy = cyOf(s, 0);
    expect(canPlace(s, 0, 'power', cy.x, cy.y)).toBe(false); // overlap
    expect(canPlace(s, 0, 'power', cy.x + 40, cy.y)).toBe(false); // too far from base
    let spot: [number, number] | null = null;
    for (let dx = 3; dx < 8 && !spot; dx++) for (let dy = -3; dy < 4 && !spot; dy++) if (canPlace(s, 0, 'power', cy.x + dx, cy.y + dy)) spot = [cy.x + dx, cy.y + dy];
    expect(spot).not.toBeNull();
    expect(place(s, 0, spot![0], spot![1])).not.toBeNull();
    run(s, 2);
    expect(p.powerMade).toBeGreaterThan(100);
  });

  it('locks items behind prerequisites and refunds on cancel', () => {
    const s = passiveGame();
    const p = s.players[0];
    expect(enqueue(s, 0, 'factory')).toBe('locked');
    enqueue(s, 0, 'power');
    const before = p.credits;
    run(s, 3);
    expect(p.credits).toBeLessThan(before);
    cancel(s, 0, 'power');
    expect(p.credits).toBeCloseTo(before, 5);
  });
});

describe('economy', () => {
  it('a harvester mines ore and delivers credits', () => {
    const s = passiveGame();
    const cy = cyOf(s, 0);
    let ref = null;
    for (let dx = -6; dx < 7 && !ref; dx++) for (let dy = -6; dy < 7 && !ref; dy++) if (canPlace(s, 0, 'refinery', cy.x + dx, cy.y + dy)) ref = spawnBuilding(s, 'refinery', 0, cy.x + dx, cy.y + dy, 0.99);
    expect(ref).toBeTruthy();
    const p = s.players[0];
    const start = p.credits;
    run(s, 90);
    expect(s.entities.some((e) => e.owner === 0 && e.def === 'miner')).toBe(true);
    expect(p.stats.harvested).toBeGreaterThan(0);
    expect(p.credits).toBeGreaterThan(start);
  });
});

describe('combat', () => {
  it('tanks move, attack, destroy and clean up', () => {
    const s = passiveGame();
    const [x, y] = [s.players[0].startX, s.players[0].startY];
    const a = spawnUnit(s, 'tank_allies', 0, x + 3.5, y + 4.5);
    const b = spawnUnit(s, 'rifle', 1, x + 9.5, y + 4.5);
    commandMove(s, 0, [a.id], x + 5.5, y + 4.5);
    run(s, 1);
    expect(a.x).toBeGreaterThan(x + 3.5);
    run(s, 1);
    expect(commandAttack(s, 0, [a.id], b.id)).toBe(1);
    run(s, 60);
    expect(b.hp).toBe(0);
    expect(s.entities.includes(b)).toBe(false);
    expect(s.rt.byId.has(b.id)).toBe(false);
    expect(a.hp).toBeGreaterThan(0);
  });
});

describe('phase 2: repair, sell, rally, radar', () => {
  it('repair heals for credits; sell refunds and frees the grid', () => {
    const s = passiveGame();
    const p = s.players[0];
    const cy = cyOf(s, 0);
    cy.hp = 500;
    const before = p.credits;
    expect(toggleRepair(s, 0, cy.id)).toBe(true);
    run(s, 10);
    expect(cy.hp).toBeGreaterThan(500);
    expect(p.credits).toBeLessThan(before);
    expect(toggleRepair(s, 1, cy.id)).toBe(false); // not yours
    const c2 = p.credits;
    const refund = sellBuilding(s, 0, cy.id);
    expect(refund).toBeGreaterThan(0);
    expect(p.credits).toBeCloseTo(c2 + refund, 5);
    tick(s);
    expect(s.entities.includes(cy)).toBe(false);
    expect(s.rt.grid[idx(s.map, cy.x + 1, cy.y + 1)]).toBe(0);
  });

  it('new units drive to the rally point; tech tank needs radar + lab; radar needs power', () => {
    const s = passiveGame();
    const p = s.players[0];
    p.credits = 50000;
    const cy = cyOf(s, 0);
    const spot = (def: string) => {
      for (let r = 3; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (canPlace(s, 0, def, cy.x + dx, cy.y + dy)) return [cy.x + dx, cy.y + dy];
      throw new Error('no spot ' + def);
    };
    const [fx, fy] = spot('factory');
    const f = spawnBuilding(s, 'factory', 0, fx, fy);
    spawnBuilding(s, 'power', 0, ...(spot('power') as [number, number]));
    spawnBuilding(s, 'refinery', 0, ...(spot('refinery') as [number, number]));
    expect(enqueue(s, 0, 'prism')).toBe('locked');
    expect(setRally(s, 0, f.id, cy.x + 1.5, cy.y + 6.5)).toBe(true);
    enqueue(s, 0, 'ifv');
    run(s, 25);
    const jeep = s.entities.find((e) => e.def === 'ifv')!;
    expect(Math.hypot(jeep.x - (cy.x + 1.5), jeep.y - (cy.y + 6.5))).toBeLessThan(2);
    spawnBuilding(s, 'power', 0, ...(spot('power') as [number, number]));
    const radar = spawnBuilding(s, 'radar', 0, ...(spot('radar') as [number, number]));
    tick(s);
    expect(hasRadar(s, 0)).toBe(true);
    expect(enqueue(s, 0, 'prism')).toBe('locked');
    spawnBuilding(s, 'lab', 0, ...(spot('lab') as [number, number]));
    expect(enqueue(s, 0, 'prism')).toBe('ok');
    p.powerUsed = 9999; // simulate a blackout for the radar check
    expect(hasRadar(s, 0)).toBe(false);
    void radar;
  });

  it('rockets beat armour, machine guns beat infantry', () => {
    expect(WEAPONS.rocket.versus.heavy).toBeGreaterThan(WEAPONS.mg.versus.heavy * 4);
    expect(WEAPONS.mg.versus.none).toBeGreaterThan(WEAPONS.rocket.versus.none * 3);
  });
});

describe('phase 3: factions', () => {
  it('each faction has its own roster, defenses and tech tier', () => {
    const s = passiveGame();
    const seen = new Map<string, string>();
    for (const f of Object.values(FACTIONS)) {
      s.players[0].faction = f.id;
      const units = [...catalog(s, 0, 'infantry'), ...catalog(s, 0, 'vehicle')];
      const buildings = catalog(s, 0, 'building');
      for (const d of [f.mainTank, f.roster.raider, f.roster.tech, f.roster.infAI, f.roster.infAT, ...f.roster.defenses, ...(f.roster.support ? [f.roster.support] : [])])
        expect(forFaction(d, f.id), `${f.id}: ${d}`).toBe(true);
      expect(buildings).toContain('lab');
      expect(UNITS[f.roster.tech].requires).toContain('lab');
      expect(buildings.filter((b) => BUILDINGS[b].weapon)).toEqual([...f.roster.defenses, ...(f.roster.aaDef ? [f.roster.aaDef] : [])]);
      // A unique signature unit per faction (not available to any other).
      for (const u of units.filter((u) => UNITS[u].factions.length === 1)) seen.set(u, f.id);
    }
    expect(new Set(seen.values()).size).toBe(3);
    s.players[0].faction = 'allies';
    s.players[0].credits = 50000;
    expect(enqueue(s, 0, 'brute')).toBe('faction');
    expect(enqueue(s, 0, 'coil')).toBe('faction');
  });

  it('splash hits groups, dogs ignore tanks, gatlings spin up, heavies self-repair', () => {
    const s = passiveGame();
    const cy = cyOf(s, 1);
    const [x, y] = [cy.x + 1.5, cy.y + 8.5];
    // Splash: one artillery rocket damages every infantry in the blast.
    const arty = spawnUnit(s, 'artillery', 0, x - 6, y);
    const pack = [0, 0.6, 1.2].map((d) => spawnUnit(s, 'rifle', 1, x + d, y));
    run(s, 0.5); // fog update
    expect(commandAttack(s, 0, [arty.id], pack[0].id)).toBe(1);
    run(s, 6);
    expect(pack.every((u) => u.hp < UNITS.rifle.hp)).toBe(true);
    // Dogs only target what they can hurt.
    const dog = spawnUnit(s, 'dog', 0, x, y + 3);
    const tank = spawnUnit(s, 'tank_psi', 1, x + 0.5, y + 3);
    expect(scanTarget(s, dog, 6)?.id).not.toBe(tank.id);
    for (const u of [...pack, dog, tank, arty]) u.hp = 0;
    // Gatling: shots come faster the longer it fires.
    const g = spawnUnit(s, 'gatling', 0, x - 3, y + 6);
    const wall = spawnUnit(s, 'miner', 1, x, y + 6); // unarmed, so it can't fire back
    wall.order.type = 'idle';
    const shots: number[] = [];
    run(s, 0.5);
    expect(commandAttack(s, 0, [g.id], wall.id)).toBe(1);
    for (let k = 0; k < 300; k++) { tick(s); if (g.lastShot === s.tick) shots.push(s.tick); }
    expect(shots.length).toBeGreaterThan(8);
    expect(shots[shots.length - 1] - shots[shots.length - 2]).toBeLessThan(shots[1] - shots[0]);
    // Colossus regenerates.
    g.hp = 0;
    const colossus = spawnUnit(s, 'heavy', 1, x, y + 6);
    colossus.hp -= 200;
    run(s, 3);
    expect(colossus.hp).toBeGreaterThan(UNITS.heavy.hp - 200);
  });
});

describe('phase 4: advanced gameplay', () => {
  const near = (s: GameState) => { const cy = cyOf(s, 1); return [cy.x + 1.5, cy.y + 8.5] as const; };

  it('mind control takes a unit until the controller dies', () => {
    const s = passiveGame();
    const [x, y] = near(s);
    const m = spawnUnit(s, 'mentalist', 0, x - 3, y);
    const tank = spawnUnit(s, 'tank_soviets', 1, x, y);
    tank.cooldown = 1e9; // keep it from shooting back
    run(s, 3); // idle units auto-engage: the mentalist takes the tank on its own
    expect(tank.owner).toBe(0);
    expect(tank.mcBy).toBe(m.id);
    m.hp = 0;
    tick(s);
    expect(tank.owner).toBe(1);
  });

  it('engineers capture enemy buildings and repair own ones', () => {
    const s = passiveGame();
    const cy = cyOf(s, 1);
    const eng = spawnUnit(s, 'engineer', 0, cy.x + 1.5, cy.y + 5);
    run(s, 0.5);
    expect(commandCapture(s, 0, [eng.id], cy.id)).toBe(1);
    run(s, 10);
    expect(cy.owner).toBe(0);
    expect(s.entities.includes(eng)).toBe(false);
    cy.hp = 100;
    const eng2 = spawnUnit(s, 'engineer', 0, cy.x + 1.5, cy.y + 5);
    commandCapture(s, 0, [eng2.id], cy.id);
    run(s, 10);
    expect(cy.hp).toBe(1500);
  });

  it('aircraft fly over obstacles and only anti-air can hit them', () => {
    const s = passiveGame();
    const m = s.map;
    const [x, y] = near(s);
    for (let yy = 0; yy < m.h; yy++) m.terrain[idx(m, Math.floor(x) - 3, yy)] = T.Rock; // wall across the map
    const jet = spawnUnit(s, 'jet', 0, x - 6, y);
    commandMove(s, 0, [jet.id], x - 1, y);
    run(s, 4);
    expect(Math.hypot(jet.x - (x - 1), jet.y - y)).toBeLessThan(1);
    const tank = spawnUnit(s, 'tank_soviets', 1, x + 1, y);
    const ifv = spawnUnit(s, 'jeep', 1, x + 1, y + 1);
    run(s, 0.5);
    expect(scanTarget(s, tank, 8)?.id).not.toBe(jet.id);
    expect(scanTarget(s, ifv, 8)?.id).toBe(jet.id);
  });

  it('veterans rank up from kills; the repair depot heals vehicles', () => {
    const s = passiveGame();
    const [x, y] = near(s);
    const tank = spawnUnit(s, 'tank_allies', 0, x - 3, y);
    for (let k = 0; k < 4; k++) {
      const v = spawnUnit(s, 'rifle', 1, x, y + k * 0.1);
      v.hp = 1;
    }
    run(s, 0.5);
    for (let k = 0; k < 40 && rankOf(tank) === 0; k++) { const v = s.entities.find((e) => e.owner === 1 && e.def === 'rifle'); if (v) commandAttack(s, 0, [tank.id], v.id); run(s, 0.5); }
    expect(rankOf(tank)).toBe(1);
    const p = s.players[0]; p.credits = 5000;
    const cy = cyOf(s, 0);
    let spot: [number, number] | null = null;
    for (let r = 3; r < 12 && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r && !spot; dx++) if (canPlace(s, 0, 'depot', cy.x + dx, cy.y + dy)) spot = [cy.x + dx, cy.y + dy];
    const depot = spawnBuilding(s, 'depot', 0, spot![0], spot![1]);
    const hurt = spawnUnit(s, 'tank_allies', 0, depot.x + 2.5, depot.y + 0.5);
    hurt.hp = 50;
    run(s, 3);
    expect(hurt.hp).toBeGreaterThan(150);
    expect(p.credits).toBeLessThan(5000);
  });
});

describe('victory', () => {
  it('detects win and loss', () => {
    const s = passiveGame();
    for (const e of s.entities) if (e.owner === 1) e.hp = 0;
    tick(s);
    checkVictory(s);
    expect(s.winner).toBe(0);
    const t = passiveGame();
    for (const e of t.entities) if (e.owner === 0) e.hp = 0;
    tick(t);
    checkVictory(t);
    expect(t.winner).toBe(1);
  });
});

describe('save/load', () => {
  it('round-trips state and rejects corrupt data', () => {
    const s = passiveGame();
    enqueue(s, 0, 'power');
    run(s, 5);
    const copy = deserialize(serialize(s));
    expect(copy.tick).toBe(s.tick);
    expect(copy.entities.length).toBe(s.entities.length);
    expect(copy.players[0].queues.building[0].progress).toBe(s.players[0].queues.building[0].progress);
    expect(copy.map.ore).toBeInstanceOf(Uint16Array);
    expect(Array.from(copy.rt.grid)).toEqual(Array.from(s.rt.grid));
    run(copy, 5); // keeps simulating
    expect(() => deserialize('{nope')).toThrow(SaveError);
    expect(() => deserialize(serialize(s).replace('"version":2', '"version":99'))).toThrow(/Incompatible/);
  });

  it('a loaded game continues exactly like the original (AI, mind control, veterancy)', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, seed: 11, difficulty: 'hard' });
    s.players[0].ai = true;
    s.ai.unshift({ player: 0, nextThink: 0, attackWave: 0, nextAttack: s.ai[0].nextAttack, attacking: [], lastPlace: 0 });
    run(s, 120);
    const [x, y] = [s.map.w / 2, s.map.h / 2];
    const m = spawnUnit(s, 'mentalist', 0, x, y);
    const t = spawnUnit(s, 'tank_psi', 0, x + 1, y);
    Object.assign(t, { mcBy: m.id, mcOwner: 1 }); m.mcTarget = t.id;
    s.entities.find((e) => e.owner === 0 && e.kind === 'unit')!.xp = 99999;
    const copy = deserialize(serialize(s));
    run(s, 60); run(copy, 60);
    expect(serialize(copy)).toBe(serialize(s));
  });
});

describe('AI (end-to-end, headless)', () => {
  it('builds a base, harvests, produces an army and attacks', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, seed: 42, difficulty: 'hard' });
    s.players[0].passive = true;
    run(s, 6 * 60);
    const ai = s.players[1];
    const defs = s.entities.filter((e) => e.owner === 1).map((e) => e.def);
    expect(defs).toContain('power');
    expect(defs).toContain('refinery');
    expect(defs).toContain('factory');
    expect(ai.stats.harvested).toBeGreaterThan(0);
    expect(ai.stats.unitsBuilt).toBeGreaterThan(3);
    expect(s.ai[0].attackWave).toBeGreaterThan(0);
  }, 60_000);

  it('AI vs AI game reaches a winner', () => {
    const s = createGame({ ...DEFAULT_SETTINGS, seed: 99, difficulty: 'hard', mapSize: 'small' });
    s.players[0].ai = true;
    s.ai.unshift({ player: 0, nextThink: 0, attackWave: 0, nextAttack: 120 * TICK_RATE, attacking: [], lastPlace: 0 });
    for (let k = 0; k < 40 * 60 * TICK_RATE && s.winner === -1; k++) tick(s);
    expect(s.winner).not.toBe(-1);
    expect(s.players.some((p) => p.defeated)).toBe(true);
  }, 240_000);
});

describe('map generation', () => {
  it('every start can reach every other start (all presets, sizes)', () => {
    const pass = (t: number) => t === T.Grass || t === T.Sand || t === T.Road || t === T.Bridge;
    for (const mapPreset of ['plains', 'rivers', 'highlands', 'coast', 'islands', 'random'])
      for (const mapSize of ['small', 'medium'] as const)
        for (let seed = 1; seed <= 12; seed++) {
          const s = createGame({ ...DEFAULT_SETTINGS, seed, mapPreset, mapSize, aiCount: 3 });
          const m = s.map, w = m.w, seen = new Uint8Array(w * m.h);
          const at = (p: { startX: number; startY: number }) => Math.floor(p.startY + 3) * w + Math.floor(p.startX + 3);
          const q = [at(s.players[0])];
          seen[q[0]] = 1;
          while (q.length) {
            const i = q.pop()!, x = i % w, y = (i / w) | 0;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const nx = x + dx, ny = y + dy, j = ny * w + nx;
              if (nx >= 0 && ny >= 0 && nx < w && ny < m.h && !seen[j] && pass(m.terrain[j])) { seen[j] = 1; q.push(j); }
            }
          }
          for (const p of s.players) expect(seen[at(p)], `${mapPreset}/${mapSize}/seed ${seed} → P${p.id}`).toBe(1);
          expect(m.oreSources.length).toBeGreaterThan(0);
        }
  });

  it('ore mines keep a depleted field alive', () => {
    const s = passiveGame();
    const src = s.map.oreSources[0];
    s.map.ore.fill(0);
    run(s, 60);
    const x = src.i % s.map.w, y = Math.floor(src.i / s.map.w);
    let near = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) near += s.map.ore[(y + dy) * s.map.w + x + dx] ?? 0;
    expect(near).toBeGreaterThan(0);
  });
});
