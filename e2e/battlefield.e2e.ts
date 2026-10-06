// Phase 17: battlefield readability. Context cursors per target, and frozen-frame snapshots of the overlay states.
import { expect, test, type Page } from './test';

declare global { interface Window { __game: any; __step: (n: number) => void; __freeze: (t: number) => void } }

async function startSkirmish(page: Page, seed?: number) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skirmish' }).click();
  await page.locator('.faction').nth(0).click();
  if (seed !== undefined) { await page.getByText('Advanced').click(); await page.locator('.seed input').fill(String(seed)); }
  await page.getByRole('button', { name: /Start skirmish/i }).click();
  await page.waitForFunction(() => !!window.__game && !document.querySelector('.loading'), null, { timeout: 120_000 });
  await page.evaluate(() => { const g = window.__game; g.openMenu?.(false); g.s.players[1].passive = true; g.me.credits = 20_000; });
}
/** Own tank, an enemy rifleman and the CY, all on screen; the tank is selected. Returns their world positions. */
async function scene(page: Page) {
  return page.evaluate(async () => {
    const { spawnUnit } = await import('/src/game/core/entities.ts');
    const g = window.__game, s = g.s;
    const cy = s.entities.find((e: any) => e.owner === 0 && e.def === 'cy');
    for (const e of s.entities) if (e.kind === 'unit' && e.owner === 0) e.x = e.px = cy.x - 6; // park the start units out of the way
    const tank = spawnUnit(s, 'tank_allies', 0, cy.x + 5.5, cy.y + 1.5);
    const foe = spawnUnit(s, 'rifle', 1, cy.x + 6.5, cy.y + 4.5);
    foe.hp = Math.round(foe.hp * 0.4); foe.lastHit = s.tick;
    for (let k = 0; k < s.players[0].visible.length; k++) s.players[0].visible[k] = s.players[0].explored[k] = 1;
    g.cam.centerOn(cy.x + 3, cy.y + 3);
    g.view.selected.clear(); g.view.selected.add(tank.id); g.notify();
    return { cy: [cy.x + 1, cy.y + 1], tank: [tank.x, tank.y], foe: [foe.x, foe.y], tankId: tank.id, foeId: foe.id };
  });
}
async function screenOf(page: Page, x: number, y: number, up = 0) {
  return page.evaluate(([x, y, up]) => {
    const g = window.__game, c = document.querySelector('canvas:not(.minimap)')!.getBoundingClientRect();
    const [sx, sy] = g.cam.toScreen(x, y);
    return { x: c.left + sx, y: c.top + sy - up * g.cam.zoom };
  }, [x, y, up] as const);
}
const cursor = (page: Page) => page.locator('canvas:not(.minimap)').first().getAttribute('data-cursor');

test('cursor follows what is under it: enemy, terrain, own building, the screen edge', async ({ page }) => {
  await startSkirmish(page);
  const w = await scene(page);
  await page.evaluate(() => window.__step(1));
  const at = async (p: { x: number; y: number }) => { await page.mouse.move(p.x, p.y, { steps: 2 }); return cursor(page); };
  expect(await at(await screenOf(page, w.foe[0], w.foe[1], 10))).toBe('attack');
  expect(await at(await screenOf(page, w.cy[0], w.cy[1]))).toBe('select');
  expect(await at(await screenOf(page, w.tank[0] - 2, w.tank[1] + 3))).toBe('move');
  const box = (await page.locator('canvas:not(.minimap)').first().boundingBox())!;
  expect(await at({ x: box.x + 6, y: box.y + box.height / 2 })).toBe('scroll-w');
  // Sell mode: own building yes, open ground no.
  await page.evaluate(() => window.__game.setMode('sell'));
  expect(await at(await screenOf(page, w.cy[0], w.cy[1]))).toBe('sell');
  expect(await at(await screenOf(page, w.tank[0] - 2, w.tank[1] + 3))).toBe('nope');
  // Every drawn cursor decodes (a broken SVG would silently fall back to the browser arrow).
  const bad = await page.evaluate(async () => {
    const { cursorCss } = await import('/src/game/cursors.ts');
    const names = ['select', 'move', 'nomove', 'attack', 'enter', 'capture', 'repair', 'sell', 'nope', 'deploy', 'target', 'place', 'scroll-n', 'scroll-ne', 'scroll-e', 'scroll-se', 'scroll-s', 'scroll-sw', 'scroll-w', 'scroll-nw'] as const;
    const out: string[] = [];
    for (const n of names) {
      const img = new Image(); img.src = cursorCss(n).match(/url\("(.+?)"\)/)![1];
      await img.decode().catch(() => out.push(n));
    }
    return out;
  });
  expect(bad).toEqual([]);
  // The cursor is a drawn image, not just the browser's own arrow.
  expect(await page.locator('canvas:not(.minimap)').first().evaluate((c) => (c as HTMLElement).style.cursor)).toContain('data:image/svg+xml');
});

test('orders leave a fading line from the unit to its target', async ({ page }) => {
  await startSkirmish(page);
  const w = await scene(page);
  const foe = await screenOf(page, w.foe[0], w.foe[1], 10);
  await page.mouse.click(foe.x, foe.y, { button: 'right' });
  const mk = await page.evaluate(() => window.__game.view.markers.at(-1));
  expect(mk.color).toBe('#ff4a3a');
  expect(mk.from).toHaveLength(1);
  await expect.poll(() => page.evaluate(() => window.__game.view.markers.length), { timeout: 3000 }).toBe(0); // gone within ~0.6 s
});

test.describe('snapshots', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'one renderer is enough for pixel baselines');

  test('selection, health pips, group number, low power, placement grid', async ({ page }) => {
    await startSkirmish(page, 4242); // fixed map: same picture every run
    await page.mouse.move(1300, 450); // over the sidebar: no hover, no edge scrolling
    await page.evaluate(() => { window.__game.paused = true; }); // nobody moves or shoots before the freeze
    const w = await scene(page);
    await page.evaluate(async ([tankId, foeId]) => {
      const { spawnBuilding } = await import('/src/game/core/entities.ts');
      const g = window.__game, s = g.s, cy = s.entities.find((e: any) => e.owner === 0 && e.def === 'cy');
      // Low power: a Refractor Tower and two radars on a base with no power plant.
      spawnBuilding(s, 'prismtower', 0, cy.x - 2, cy.y + 4);
      spawnBuilding(s, 'radar', 0, cy.x + 4, cy.y - 3);
      spawnBuilding(s, 'radar', 0, cy.x - 3, cy.y - 3);
      window.__freeze(12.75); // the low-power bolt blinks: this moment it is lit
      s.players[0].powerMade = 0; s.players[0].powerUsed = 150; // what the economy tick would say, without letting anyone shoot
      g.view.selected.add(foeId);
      g.view.groups = new Map([[tankId, 3]]);
      g.messages.length = 0; g.notify();
    }, [w.tankId, w.foeId]);
    const clip = async () => {
      const b = (await page.locator('canvas:not(.minimap)').first().boundingBox())!;
      return { x: b.x + b.width / 2 - 360, y: b.y + b.height / 2 - 230, width: 720, height: 460 };
    };
    await page.evaluate(() => window.__step(0));
    await expect(page).toHaveScreenshot('selection-lowpower.png', { clip: await clip(), maxDiffPixelRatio: 0.01 });
    // Placement: a Pillbox ghost half on the CY (red cells), its range, and the build-radius outline.
    await page.evaluate(([x, y]) => {
      const g = window.__game;
      g.view.selected.clear(); g.placing = 'pillbox';
      const [sx, sy] = g.cam.toScreen(x, y);
      g.ghostAt(sx, sy); window.__step(0);
    }, [w.cy[0] + 1.6, w.cy[1] + 0.6]);
    expect(await page.evaluate(() => window.__game.view.ghost.cells.some((c: boolean) => !c))).toBe(true);
    await expect(page).toHaveScreenshot('placement.png', { clip: await clip(), maxDiffPixelRatio: 0.01 });
  });
});
