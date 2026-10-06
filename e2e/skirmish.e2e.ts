// The master-prompt end-to-end checklist, driven through the real UI (clicks, keys, drags).
// window.__step(n) fast-forwards the simulation so a full game fits in a test.
import { expect, test, type Page } from './test';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { __game: any; __step: (n: number) => void } }

const step = (page: Page, seconds: number) => page.evaluate((n) => window.__step(n), Math.round(seconds * 30));
const count = (page: Page, def: string, owner = 0) =>
  page.evaluate(([d, o]) => window.__game.s.entities.filter((e: any) => e.def === d && e.owner === o).length, [def, owner] as const);

/** Client coordinates of a world point on the game canvas. */
async function screenOf(page: Page, x: number, y: number) {
  return page.evaluate(([x, y]) => {
    const g = window.__game, c = document.querySelector('canvas:not(.minimap)')!.getBoundingClientRect();
    const [sx, sy] = g.cam.toScreen(x, y);
    return { x: c.left + sx, y: c.top + sy };
  }, [x, y] as const);
}

async function startSkirmish(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skirmish' }).click();
  await page.getByRole('button', { name: /Start skirmish/i }).click();
  await page.waitForFunction(() => !!window.__game && !document.querySelector('.loading'), null, { timeout: 120_000 });
  await page.evaluate(() => window.__game.openMenu?.(false));
}

/** Build `def` through the sidebar and place it with a real click on a valid spot near the base. */
async function build(page: Page, label: RegExp, def: string) {
  await page.getByRole('tab', { name: 'Structures' }).click();
  await page.getByRole('button', { name: label }).first().click();
  await page.waitForFunction((d) => { window.__step(30); return window.__game.me.ready === d; }, def, { timeout: 60_000, polling: 50 });
  await page.getByRole('button', { name: label }).first().click(); // enter placement mode
  const spot = await page.evaluate(async (d) => {
    const { canPlace } = await import('/src/game/systems/production.ts');
    const { BUILDINGS } = await import('/src/game/data/buildings.ts');
    const g = window.__game, s = g.s, b = BUILDINGS[d];
    const cy = s.entities.find((e: any) => e.owner === 0 && e.def === 'cy');
    for (let r = 2; r < 10; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
      if (canPlace(s, 0, d, cy.x + dx, cy.y + dy)) { g.cam.centerOn(cy.x + dx + b.w / 2, cy.y + dy + b.h / 2); return [cy.x + dx + b.w / 2, cy.y + dy + b.h / 2]; }
    return null;
  }, def);
  expect(spot, `room for ${def}`).not.toBeNull();
  const p = await screenOf(page, spot![0], spot![1]);
  await page.mouse.move(p.x, p.y);
  await page.mouse.click(p.x, p.y);
  await expect.poll(() => count(page, def)).toBeGreaterThan(0);
  await step(page, 2); // finish the build-up animation (prerequisites need a completed building)
}

test('skirmish end to end: build, harvest, produce, fight, AI, win/lose, pause, save/load', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  // 1. Start a skirmish.
  await startSkirmish(page);
  await expect(page.locator('canvas:not(.minimap)')).toBeVisible();
  await page.evaluate(() => { window.__game.s.players[1].passive = true; }); // AI frozen while we build (checked on its own in step 7)

  // 2–3. Power + refinery; the free harvester delivers ore.
  await build(page, /^Power Plant,/, 'power');
  await build(page, /^Ore Refinery,/, 'refinery');
  await page.waitForFunction(() => { window.__step(60); return window.__game.me.stats.harvested > 0; }, null, { timeout: 60_000, polling: 50 });

  // 4. War factory and a tank.
  await page.evaluate(() => { window.__game.me.credits += 5000; });
  await build(page, /^War Factory,/, 'factory');
  await page.getByRole('tab', { name: 'Vehicles' }).click();
  await expect(page.getByRole('button', { name: /^Warden Tank,/ })).not.toHaveAccessibleName(/locked/);
  await page.getByRole('button', { name: /^Warden Tank,/ }).click();
  await page.waitForFunction(() => { window.__step(30); return window.__game.s.entities.filter((e: any) => e.owner === 0 && e.def === 'tank_allies').length >= 1; }, null, { timeout: 60_000, polling: 50 });

  // 5. Box-select the tank(s) and move with a right click.
  const tank = await page.evaluate(() => { const g = window.__game; const t = g.s.entities.filter((e: any) => e.owner === 0 && e.def === 'tank_allies').pop(); g.cam.centerOn(t.x, t.y); return [t.x, t.y, t.id]; });
  const tp = await screenOf(page, tank[0], tank[1]);
  await page.mouse.move(tp.x - 40, tp.y - 40); await page.mouse.down(); await page.mouse.move(tp.x + 40, tp.y + 30, { steps: 5 }); await page.mouse.up();
  await expect.poll(() => page.evaluate((id) => window.__game.view.selected.has(id), tank[2])).toBe(true);
  const dest = await screenOf(page, tank[0] + 3, tank[1] + 1);
  await page.mouse.click(dest.x, dest.y, { button: 'right' });
  await expect.poll(() => page.evaluate((id) => window.__game.s.rt.byId.get(id).order.type, tank[2])).toBe('move');

  // 6. Attack an enemy with a right click; it gets destroyed.
  const enemy = await page.evaluate(async (id) => {
    const { spawnUnit } = await import('/src/game/core/entities.ts');
    const g = window.__game, t = g.s.rt.byId.get(id);
    const e = spawnUnit(g.s, 'rifle', 1, t.x + 2, t.y);
    window.__step(12); // fog update
    return [e.x, e.y, e.id];
  }, tank[2]);
  const ep = await screenOf(page, enemy[0], enemy[1] - 0.3);
  await page.mouse.click(ep.x, ep.y, { button: 'right' });
  await page.waitForFunction((id) => { window.__step(15); return !window.__game.s.rt.byId.get(id); }, enemy[2], { timeout: 30_000, polling: 50 });

  // 7. The AI builds, harvests, produces and attacks.
  await page.evaluate(() => { window.__game.s.players[1].passive = false; window.__game.me.credits += 20000; });
  // Fast-forward until the AI launches its first attack wave (stops before it can end the game).
  await page.evaluate(() => { for (let k = 0; k < 10 * 60 && !window.__game.s.ai[0].attackWave && window.__game.s.winner === -1; k++) window.__step(30); });
  const ai = await page.evaluate(() => {
    const s = window.__game.s, own = s.entities.filter((e: any) => e.owner === 1);
    return { buildings: own.filter((e: any) => e.kind === 'building').length, harvested: s.players[1].stats.harvested, built: s.players[1].stats.unitsBuilt, waves: s.ai[0].attackWave };
  });
  expect(ai.buildings).toBeGreaterThan(3);
  expect(ai.harvested).toBeGreaterThan(0);
  expect(ai.built).toBeGreaterThan(3);
  expect(ai.waves).toBeGreaterThan(0);

  // 9. Pause and resume (P key), 10. save and load.
  await page.keyboard.press('p');
  await expect(page.getByText('PAUSED', { exact: true })).toBeVisible();
  const t0 = await page.evaluate(() => window.__game.s.tick);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__game.s.tick)).toBe(t0);
  await page.keyboard.press('p');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const saved = await page.evaluate(() => ({ tick: window.__game.s.tick, n: window.__game.s.entities.length }));
  await step(page, 20);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Load', exact: true }).click();
  await page.waitForFunction((t) => window.__game?.s.tick <= t + 1, saved.tick, { timeout: 60_000 });
  expect(await page.evaluate(() => window.__game.s.entities.length)).toBe(saved.n);

  // 8a. Win: the enemy is wiped out → victory screen; restart.
  await page.evaluate(() => { window.__game.openMenu?.(false); for (const e of window.__game.s.entities) if (e.owner === 1) e.hp = 0; window.__step(30); });
  await expect(page.getByText('MISSION ACCOMPLISHED', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play again' }).click();
  await page.waitForFunction(() => window.__game && window.__game.s.tick < 100 && !document.querySelector('.loading'), null, { timeout: 120_000 });

  // 8b. Lose: our base is wiped out → defeat screen.
  await page.evaluate(() => { for (const e of window.__game.s.entities) if (e.owner === 0) e.hp = 0; window.__step(30); });
  await expect(page.getByText('MISSION FAILED', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Main menu' }).click();
  await expect(page.getByRole('button', { name: 'Skirmish' })).toBeVisible();

  expect(errors).toEqual([]);
});

test('menu, settings, credits and help overlay work without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Options' }).click();
  await expect(page.getByText('Music', { exact: true })).toBeVisible();
  await page.goBack().catch(() => {});
  await page.goto('/');
  await page.getByRole('button', { name: 'Credits' }).click();
  await expect(page.getByText(/Quaternius/).first()).toBeVisible();
  await page.goto('/');
  await startSkirmish(page);
  await page.keyboard.press('F1');
  await expect(page.getByText('Hotkeys', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Hotkeys', { exact: true })).toBeHidden();
  expect(errors).toEqual([]);
});

test('phase 7 through the UI: ability key, wall drag, boarding a transport', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startSkirmish(page);
  await page.evaluate(() => { window.__game.s.players[1].passive = true; });

  // Dig in a rifleman with E.
  const r = await page.evaluate(async () => {
    const { spawnUnit } = await import('/src/game/core/entities.ts');
    const g = window.__game, cy = g.s.entities.find((e: any) => e.owner === 0 && e.def === 'cy');
    const u = spawnUnit(g.s, 'rifle', 0, cy.x + 5.5, cy.y + 4.5);
    g.cam.centerOn(u.x, u.y);
    return [u.x, u.y, u.id];
  });
  const rp = await screenOf(page, r[0], r[1] - 0.3);
  await page.mouse.click(rp.x, rp.y);
  await expect.poll(() => page.evaluate((id) => window.__game.view.selected.has(id), r[2])).toBe(true);
  await page.keyboard.press('e');
  await expect.poll(() => page.evaluate((id) => window.__game.s.rt.byId.get(id).dug, r[2])).toBe(true);
  await expect(page.getByText('dug in', { exact: true })).toBeVisible();

  // Drag a wall line: one ready piece + paid extensions.
  const spot = await page.evaluate(async () => {
    const { canPlace } = await import('/src/game/systems/production.ts');
    const g = window.__game, s = g.s, cy = s.entities.find((e: any) => e.owner === 0 && e.def === 'cy');
    g.me.ready = 'wall';
    for (let dy = -4; dy <= 4; dy++) for (let dx = -6; dx <= 2; dx++) {
      const x = cy.x + dx, y = cy.y + dy;
      if ([0, 1, 2, 3].every((k) => canPlace(s, 0, 'wall', x + k, y))) { g.cam.centerOn(x + 2, y); return [x, y]; }
    }
    return null;
  });
  expect(spot).not.toBeNull();
  await page.getByRole('tab', { name: 'Defense' }).click();
  await page.getByRole('button', { name: /Wall,/ }).first().click();
  const a = await screenOf(page, spot![0] + 0.5, spot![1] + 0.5), b = await screenOf(page, spot![0] + 3.5, spot![1] + 0.5);
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 6 }); await page.mouse.up();
  await expect.poll(() => count(page, 'wall')).toBe(4);

  // Infantry boards a Flak Hauler with a right click.
  const ids = await page.evaluate(async () => {
    const { spawnUnit } = await import('/src/game/core/entities.ts');
    const g = window.__game, cy = g.s.entities.find((e: any) => e.owner === 0 && e.def === 'cy');
    const h = spawnUnit(g.s, 'flakhauler', 0, cy.x + 6.5, cy.y + 6.5);
    const u = spawnUnit(g.s, 'rifle', 0, cy.x + 4.5, cy.y + 6.5);
    g.view.selected.clear(); g.view.selected.add(u.id);
    g.cam.centerOn(h.x, h.y);
    return [h.id, u.id, h.x, h.y];
  });
  const hp = await screenOf(page, ids[2], ids[3] - 0.2);
  await page.mouse.click(hp.x, hp.y, { button: 'right' });
  await page.waitForFunction((id) => { window.__step(10); return !!window.__game.s.rt.byId.get(id).inside; }, ids[1], { timeout: 30_000, polling: 50 });
  expect(errors).toEqual([]);
});

test('phase 8 through the UI: infiltrator steals money, hero shows up in the sidebar', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startSkirmish(page);
  const ids = await page.evaluate(async () => {
    const { spawnUnit, spawnBuilding } = await import('/src/game/core/entities.ts');
    const g = window.__game, s = g.s, cy = s.entities.find((e: any) => e.owner === 0 && e.def === 'cy');
    s.players[1].passive = true;
    s.players[1].credits = 3000;
    s.players[1].queues = { building: [], infantry: [], vehicle: [] };
    const ref = spawnBuilding(s, 'refinery', 1, cy.x + 7, cy.y + 5);
    ref.seenBy = 0xff; // scouted
    const spy = spawnUnit(s, 'infiltrator', 0, cy.x + 5.5, cy.y + 6.5);
    g.view.selected.clear(); g.view.selected.add(spy.id);
    window.__step(12);
    g.cam.centerOn(ref.x + 1.5, ref.y + 1.5);
    return [ref.x + 1.5, ref.y + 1.5, spy.id];
  });
  const rp = await screenOf(page, ids[0], ids[1]);
  await page.mouse.click(rp.x, rp.y, { button: 'right' });
  // The spy walks in and is used up; half the enemy's money changes hands.
  await page.waitForFunction((id) => { window.__step(15); return !window.__game.s.rt.byId.get(id) && window.__game.s.players[1].credits <= 1500; }, ids[2], { timeout: 30_000, polling: 50 });

  // Heroes appear (locked) in the infantry tab with their limit in the tooltip.
  await page.getByRole('tab', { name: 'Infantry' }).click();
  await page.getByRole('button', { name: /^Nova,/ }).hover();
  await expect(page.getByText(/max\. 1 at a time/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('phase 9 through the UI: helicopter lands with E, IFV takes its passenger\'s weapon', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startSkirmish(page);
  const ids = await page.evaluate(async () => {
    const { spawnUnit } = await import('/src/game/core/entities.ts');
    const g = window.__game, s = g.s, cy = s.entities.find((e: any) => e.owner === 0 && e.def === 'cy');
    s.players[1].passive = true;
    const r = spawnUnit(s, 'siegerotor', 0, cy.x + 6.5, cy.y + 5.5);
    const ifv = spawnUnit(s, 'ifv', 0, cy.x + 4.5, cy.y + 7.5);
    const rifle = spawnUnit(s, 'rifle', 0, cy.x + 3.5, cy.y + 7.5);
    g.cam.centerOn(r.x, r.y);
    window.__step(2);
    return { r: [r.x, r.y, r.id], ifv: [ifv.x, ifv.y, ifv.id], rifle: rifle.id };
  });
  // Click the hovering helicopter (drawn above its ground position), land it with E.
  const rp = await page.evaluate(([x, y]) => {
    const g = window.__game, c = document.querySelector('canvas:not(.minimap)')!.getBoundingClientRect();
    const [sx, sy] = g.cam.toScreen(x, y);
    return { x: c.left + sx, y: c.top + sy - 38 * g.cam.zoom };
  }, ids.r);
  await page.mouse.click(rp.x, rp.y);
  await expect.poll(() => page.evaluate((id) => window.__game.view.selected.has(id), ids.r[2])).toBe(true);
  await page.keyboard.press('e');
  await expect.poll(() => page.evaluate((id) => window.__game.s.rt.byId.get(id).deployed, ids.r[2])).toBe(true);

  // Rifleman into the IFV → machine gun.
  await page.evaluate((id) => { const g = window.__game; g.view.selected.clear(); g.view.selected.add(id); }, ids.rifle);
  const ip = await screenOf(page, ids.ifv[0], ids.ifv[1] - 0.2);
  await page.mouse.click(ip.x, ip.y, { button: 'right' });
  await page.waitForFunction((id) => { window.__step(30); return window.__game.s.rt.byId.get(id).gunWeapon === 'ifvMg'; }, ids.ifv[2], { timeout: 60_000, polling: 50 });
  expect(errors).toEqual([]);
});

test('phase 10 through the UI: garrison a town building with a right click, evacuate with E', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startSkirmish(page);
  const ids = await page.evaluate(async () => {
    const { spawnUnit, spawnBuilding, freeSpot } = await import('/src/game/core/entities.ts');
    const { canPlace } = await import('/src/game/systems/production.ts');
    const g = window.__game, s = g.s, cy = s.entities.find((e: any) => e.owner === 0 && e.def === 'cy');
    s.players[1].passive = true;
    let spot: number[] | null = null;
    for (let r = 4; r < 12 && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r && !spot; dx++)
      if (canPlace(s, 0, 'power', cy.x + dx, cy.y + dy)) spot = [cy.x + dx, cy.y + dy];
    const h = spawnBuilding(s, 'civhouse', s.neutral, spot![0], spot![1]);
    h.seenBy = 0xff;
    const at = freeSpot(s, h.x - 1, h.y + 1, 4);
    const u = spawnUnit(s, 'rifle', 0, at[0], at[1]);
    g.view.selected.clear(); g.view.selected.add(u.id);
    g.cam.centerOn(h.x + 1, h.y + 1);
    window.__step(2);
    return [h.x + 1, h.y + 1, h.id, u.id];
  });
  expect(await page.evaluate(() => window.__game.s.neutral)).toBeGreaterThan(0); // the setup screen enables the civilians
  const hp = await screenOf(page, ids[0], ids[1]);
  await page.mouse.click(hp.x, hp.y - 10, { button: 'right' });
  await page.waitForFunction((id) => { window.__step(30); return window.__game.s.rt.byId.get(id).inside > 0; }, ids[3], { timeout: 60_000, polling: 50 });
  expect(await page.evaluate((id) => window.__game.s.rt.byId.get(id).owner, ids[2])).toBe(0);
  await page.evaluate((id) => { const g = window.__game; g.view.selected.clear(); g.view.selected.add(id); g.notify(); }, ids[2]);
  await expect(page.getByText('Garrison', { exact: true })).toBeVisible();
  await page.keyboard.press('e');
  await expect.poll(() => page.evaluate((id) => window.__game.s.rt.byId.get(id).owner === window.__game.s.neutral, ids[2])).toBe(true);
  expect(errors).toEqual([]);
});

test('phase 11 through the UI: Naval Yard on the water, a destroyer launches and stays at sea', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Skirmish' }).click();
  await page.locator('select').filter({ has: page.locator('option[value="coast"]') }).selectOption('coast');
  await page.getByRole('button', { name: /Start skirmish/i }).click();
  await page.waitForFunction(() => !!window.__game && !document.querySelector('.loading'), null, { timeout: 120_000 });
  await page.evaluate(() => window.__game.openMenu?.(false));
  // Skip the early build order: refinery and factory stand, cash in the bank.
  await page.evaluate(async () => {
    const { spawnBuilding } = await import('/src/game/core/entities.ts');
    const { canPlace } = await import('/src/game/systems/production.ts');
    const s = window.__game.s, cy = s.entities.find((e: any) => e.owner === 0 && e.def === 'cy');
    s.players[1].passive = true;
    s.players[0].credits = 10000;
    for (const d of ['power', 'refinery', 'factory']) {
      let done = false;
      for (let r = 3; r < 12 && !done; r++) for (let dy = -r; dy <= r && !done; dy++) for (let dx = -r; dx <= r && !done; dx++)
        if (canPlace(s, 0, d, cy.x + dx, cy.y + dy)) { spawnBuilding(s, d, 0, cy.x + dx, cy.y + dy); done = true; }
    }
    window.__step(2);
  });
  await build(page, /^Naval Yard/, 'navalyard');
  const yard = await page.evaluate(() => { const y = window.__game.s.entities.find((e: any) => e.def === 'navalyard'); return [y.x, y.y]; });
  expect(await page.evaluate(([x, y]) => window.__game.s.map.terrain[y * window.__game.s.map.w + x], yard)).toBe(2); // on water
  await page.getByRole('tab', { name: 'Vehicles' }).click();
  await page.getByRole('button', { name: /^Picket Destroyer/ }).click();
  await page.waitForFunction(() => { window.__step(30); return window.__game.s.entities.some((e: any) => e.def === 'destroyer'); }, null, { timeout: 60_000, polling: 50 });
  // Order it onto dry land next to the base: it sails as close as it can and stays on the water.
  const ship = await page.evaluate(() => { const g = window.__game, e = g.s.entities.find((u: any) => u.def === 'destroyer'); g.view.selected.clear(); g.view.selected.add(e.id); return e.id; });
  const cyc = await page.evaluate(() => { const c = window.__game.s.entities.find((e: any) => e.owner === 0 && e.def === 'cy'); window.__game.cam.centerOn(c.x + 1.5, c.y + 1.5); return [c.x + 1.5, c.y + 1.5]; });
  const p = await screenOf(page, cyc[0], cyc[1] + 2);
  await page.mouse.click(p.x, p.y, { button: 'right' });
  await step(page, 20);
  const t = await page.evaluate((id) => { const s = window.__game.s, e = s.rt.byId.get(id); return s.map.terrain[Math.floor(e.y) * s.map.w + Math.floor(e.x)]; }, ship);
  expect([2, 6]).toContain(t); // water or under a bridge
  expect(errors).toEqual([]);
});

test('phase 12 through the UI: a charged superweapon fires from its sidebar button at a clicked spot', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startSkirmish(page);
  const at = await page.evaluate(async () => {
    const { spawnBuilding, spawnUnit } = await import('/src/game/core/entities.ts');
    const { canPlace } = await import('/src/game/systems/production.ts');
    const { fullCharge } = await import('/src/game/systems/powers.ts');
    const g = window.__game, s = g.s, cy = s.entities.find((e: any) => e.owner === 0 && e.def === 'cy');
    s.players[1].passive = true;
    const put = (d: string) => {
      for (let r = 3; r < 14; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
        if (canPlace(s, 0, d, cy.x + dx, cy.y + dy)) return spawnBuilding(s, d, 0, cy.x + dx, cy.y + dy);
      return null;
    };
    for (let k = 0; k < 4; k++) put('power');
    const sw = put('stormengine');
    sw.charge = fullCharge('stormengine');
    const foe = spawnUnit(s, 'tank_soviets', 1, cy.x + 8.5, cy.y - 6.5);
    g.cam.centerOn(foe.x, foe.y);
    window.__step(2);
    g.notify();
    return [foe.x, foe.y, sw.id];
  });
  await page.getByRole('button', { name: /Storm Engine, ready/ }).click();
  const p = await screenOf(page, at[0], at[1]);
  await page.mouse.move(p.x, p.y);
  await page.mouse.click(p.x, p.y);
  await expect.poll(() => page.evaluate(() => (window.__game.s.hazards ?? []).filter((h: any) => h.weapon === 'lightning').length)).toBe(1);
  expect(await page.evaluate((id) => window.__game.s.rt.byId.get(id).charge, at[2])).toBeLessThan(60); // spent (the game keeps running: it is already recharging)
  await step(page, 3);
  expect(errors).toEqual([]);
});

test('phase 13: a hard AI-vs-AI game on Archipelago runs and renders for 12 minutes without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Skirmish' }).click();
  await page.locator('select').filter({ has: page.locator('option[value="islands"]') }).selectOption('islands');
  await page.locator('select').filter({ has: page.locator('option[value="hard"]') }).selectOption('hard');
  await page.getByRole('button', { name: /Start skirmish/i }).click();
  await page.waitForFunction(() => !!window.__game && !document.querySelector('.loading'), null, { timeout: 120_000 });
  await page.evaluate(() => {
    const g = window.__game, s = g.s;
    g.openMenu?.(false);
    s.players[0].ai = true;
    s.ai.unshift({ player: 0, nextThink: 0, attackWave: 0, nextAttack: s.ai[0].nextAttack, attacking: [], lastPlace: 0 });
    for (const p of s.players) p.explored.fill(1);
  });
  // Fast-forward in chunks and let the renderer draw in between (every chunk is a real frame).
  for (let m = 0; m < 12 && !(await page.evaluate(() => window.__game.s.winner !== -1)); m++) {
    await step(page, 60);
    await page.waitForTimeout(150);
  }
  const s = await page.evaluate(() => ({ tick: window.__game.s.tick, ents: window.__game.s.entities.length }));
  expect(s.tick).toBeGreaterThan(30 * 60 * 5);
  expect(s.ents).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('camera: right-drag scrolls the map without giving an order; edge scrolling works under the top bar', async ({ page }) => {
  await startSkirmish(page);
  const cam = () => page.evaluate(() => ({ x: window.__game.cam.x, y: window.__game.cam.y, markers: window.__game.view.markers.length }));
  const box = (await page.locator('canvas:not(.minimap)').boundingBox())!;
  // Park the camera mid-map so it can move both ways.
  await page.evaluate(() => { const g = window.__game; g.cam.centerOn(g.s.map.w / 2, g.s.map.h / 2); g.view.markers.length = 0; });
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const a = await cam();
  await page.mouse.move(cx, cy);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(cx - 150, cy - 90, { steps: 8 });
  await page.mouse.up({ button: 'right' });
  const b = await cam();
  expect(b.x - a.x).toBeCloseTo(150, -1); // grab-style: the map follows the mouse
  expect(b.y - a.y).toBeCloseTo(90, -1);
  expect(b.markers).toBe(0); // a drag is not a right-click order
  // The top bar covers the canvas's top edge; holding the mouse there still scrolls up.
  await page.mouse.move(cx, box.y + 2);
  await page.waitForTimeout(600);
  expect((await cam()).y).toBeLessThan(b.y - 50);
});
