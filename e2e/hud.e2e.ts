// Phase 15: the faction console HUD (cameo states, superweapon clocks, command bar) and the touch drawer.
import { expect, test, type Page } from './test';

declare global { interface Window { __game: any; __step: (n: number) => void } }

async function startSkirmish(page: Page, faction = 0) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skirmish' }).click();
  await page.locator('.faction').nth(faction).click();
  await page.getByRole('button', { name: /Start skirmish/i }).click();
  await page.waitForFunction(() => !!window.__game && !document.querySelector('.loading'), null, { timeout: 120_000 });
  await page.evaluate(() => { const g = window.__game; g.openMenu?.(false); g.s.players[1].passive = true; g.me.credits = 20_000; });
}
const cameo = (page: Page, name: RegExp) => page.getByRole('button', { name }).first();
async function screenOf(page: Page, x: number, y: number) {
  return page.evaluate(([x, y]) => {
    const g = window.__game, c = document.querySelector('canvas:not(.minimap)')!.getBoundingClientRect();
    const [sx, sy] = g.cam.toScreen(x, y);
    return { x: c.left + sx, y: c.top + sy };
  }, [x, y] as const);
}

for (const [i, faction, power] of [[0, 'allies', /^Power Plant,/], [1, 'soviets', /^Dynamo Plant,/], [2, 'psi', /^Bio Reactor,/]] as const) {
  test(`cameo states and HUD, ${faction}`, async ({ page }, info) => {
    await startSkirmish(page, i);
    await expect(page.locator('.game')).toHaveAttribute('data-faction', faction);
    // building → on hold → resumed → held again → cancelled with refund
    await cameo(page, power).click();
    await page.evaluate(() => window.__step(60));
    await expect(cameo(page, power)).toHaveClass(/building/);
    await expect(cameo(page, power).locator('.tm')).toBeVisible();
    await cameo(page, power).click({ button: 'right' });
    await expect(cameo(page, power)).toHaveAccessibleName(/on hold/);
    await expect(cameo(page, power).getByText('ON HOLD')).toBeVisible();
    const held = await page.evaluate(() => window.__game.me.queues.building[0].progress);
    await page.evaluate(() => window.__step(60));
    expect(await page.evaluate(() => window.__game.me.queues.building[0].progress)).toBe(held);
    await info.attach(`${faction}-hold`, { body: await page.locator('.sidebar').screenshot(), contentType: 'image/png' });
    await cameo(page, power).click();
    await expect(cameo(page, power)).toHaveClass(/building/);
    await cameo(page, power).click({ button: 'right' });
    await cameo(page, power).click({ button: 'right' });
    await expect(cameo(page, power)).not.toHaveClass(/building|hold/);
    expect(await page.evaluate(() => window.__game.me.credits)).toBeCloseTo(20_000, 0);
    await page.evaluate(() => { window.__game.me.credits = 0; window.__game.notify(); });
    await expect(cameo(page, power)).toHaveClass(/poor/);
    await page.evaluate(() => { window.__game.me.credits = 20_000; window.__game.notify(); });
    // ready and locked
    await cameo(page, power).click();
    await page.waitForFunction(() => { window.__step(30); return !!window.__game.me.ready; }, null, { timeout: 30_000, polling: 50 });
    await expect(cameo(page, power).getByText('READY')).toBeVisible();
    await expect(page.locator('.cameo.locked').first()).toBeVisible();
    // a busy tab shows a progress ring, a ready tab a dot
    await expect(page.getByRole('tab', { name: 'Structures' }).locator('.dot')).toBeVisible();
    // enemy superweapon clock, own one is a button
    await page.evaluate(async () => {
      const E = await import('/src/game/core/entities.ts');
      const g = window.__game, s = g.s, e = s.players[1];
      E.spawnBuilding(s, 'stormengine', 1, e.startX + 3, e.startY + 3).built = 1;
      window.__step(2);
    });
    await expect(page.locator('.swt .enemy')).toContainText(/Storm Engine/);
    // command bar for a selected group
    await page.evaluate(async () => {
      const E = await import('/src/game/core/entities.ts');
      const F = await import('/src/game/data/factions.ts');
      const g = window.__game, me = g.me;
      g.view.selected.clear();
      for (let k = 0; k < 3; k++) g.view.selected.add(E.spawnUnit(g.s, F.FACTIONS[me.faction].mainTank, 0, me.startX + 1.5 + k, me.startY + 6.5).id);
      g.notify();
    });
    await expect(page.locator('.cmdbar')).toBeVisible();
    await expect(page.locator('.cmdbar').getByRole('button', { name: /Atk-move/ })).toBeVisible();
    await expect(page.locator('.cmdbar .group span')).toHaveText('3×');
    await info.attach(`${faction}-hud`, { body: await page.screenshot(), contentType: 'image/png' });
  });
}

test.describe('tablet', () => {
  test.use({ viewport: { width: 1180, height: 820 }, hasTouch: true });
  test.skip(({ browserName }) => browserName === 'firefox', 'Firefox has no touch emulation in Playwright');

  test('touch: drawer, build and place, select by tap, attack in Order mode', async ({ page }, info) => {
    await startSkirmish(page);
    await expect(page.locator('.sidebar.drawer')).toBeVisible();
    await page.locator('.rail').tap();
    await expect(page.locator('.sidebar')).toHaveClass(/open/);
    await cameo(page, /^Power Plant,/).tap();
    await page.waitForFunction(() => { window.__step(30); return window.__game.me.ready === 'power'; }, null, { timeout: 30_000, polling: 50 });
    await cameo(page, /^Power Plant,/).tap();
    await expect(page.locator('.sidebar')).not.toHaveClass(/open/); // gets out of the way for placing
    const spot = await page.evaluate(async () => {
      const { canPlace } = await import('/src/game/systems/production.ts');
      const g = window.__game, s = g.s, cy = s.entities.find((e: any) => e.owner === 0 && e.def === 'cy');
      for (let r = 3; r < 10; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
        if (canPlace(s, 0, 'power', cy.x + dx, cy.y + dy)) { g.cam.centerOn(cy.x + dx + 1, cy.y + dy + 1); return [cy.x + dx + 1, cy.y + dy + 1]; }
      return null;
    });
    const p = await screenOf(page, spot![0], spot![1]);
    await page.touchscreen.tap(p.x, p.y);
    await expect.poll(() => page.evaluate(() => window.__game.s.entities.filter((e: any) => e.owner === 0 && e.def === 'power').length)).toBe(1);
    // select a tank with a tap, switch to Order, tap an enemy
    const [tank, enemy] = await page.evaluate(async () => {
      const E = await import('/src/game/core/entities.ts');
      const g = window.__game, me = g.me;
      const t = E.spawnUnit(g.s, 'tank_allies', 0, me.startX + 5.5, me.startY + 5.5);
      const e = E.spawnUnit(g.s, 'rifle', 1, me.startX + 8.5, me.startY + 5.5);
      for (const pl of g.s.players) { pl.visible.fill(1); pl.explored.fill(1); }
      g.cam.centerOn(me.startX + 7, me.startY + 5.5);
      window.__step(2);
      return [t.id, e.id];
    });
    const tp = await page.evaluate((id) => { const u = window.__game.s.rt.byId.get(id); return [u.x, u.y]; }, tank);
    const ts = await screenOf(page, tp[0], tp[1] - 0.2);
    await page.touchscreen.tap(ts.x, ts.y);
    await expect.poll(() => page.evaluate((id) => window.__game.view.selected.has(id), tank)).toBe(true);
    await page.getByRole('button', { name: 'Order' }).tap();
    const ep = await page.evaluate((id) => { const u = window.__game.s.rt.byId.get(id); return [u.x, u.y]; }, enemy);
    const es = await screenOf(page, ep[0], ep[1] - 0.2);
    await page.touchscreen.tap(es.x, es.y);
    await expect.poll(() => page.evaluate((id) => window.__game.s.rt.byId.get(id).order.type, tank)).toBe('attack');
    await info.attach('tablet', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
