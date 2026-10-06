// Phase 19: options take effect, the HUD stays within its time budget, and pixel baselines per faction × desktop/tablet.
import { expect, test, type Page } from './test';

declare global { interface Window { __game: any; __step: (n: number) => void; __freeze: (t: number) => void; __hud?: { ms: number; commits: number } } }

async function startSkirmish(page: Page, faction = 0, seed?: number) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skirmish' }).click();
  await page.locator('.faction').nth(faction).click();
  if (seed !== undefined) { await page.getByText('Advanced').click(); await page.locator('.seed input').fill(String(seed)); }
  await page.getByRole('button', { name: /Start skirmish/i }).click();
  await page.waitForFunction(() => !!window.__game && !document.querySelector('.loading'), null, { timeout: 120_000 });
}

test('options: subtitles, interface size, reduce motion and the colour-blind palette take effect', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Options' }).click();
  for (const label of ['Subtitles', 'Interface size', 'Reduce motion', 'Colour-blind palette', 'Edge scrolling']) await expect(page.getByText(label, { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Reduce motion' }).check();
  await expect(page.locator('html')).toHaveClass(/reduce-motion/);
  await page.getByRole('slider', { name: /Interface size/ }).focus();
  for (let k = 0; k < 4; k++) await page.keyboard.press('ArrowRight'); // 100 % → 120 %
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim())).toBe('1.2');
  await page.getByRole('checkbox', { name: 'Colour-blind palette' }).check();
  await page.getByRole('checkbox', { name: 'Subtitles' }).uncheck();
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Skirmish' }).click();
  await page.getByRole('button', { name: /Start skirmish/i }).click();
  await page.waitForFunction(() => !!window.__game && !document.querySelector('.loading'), null, { timeout: 120_000 });
  const colors = await page.evaluate(() => window.__game.s.players.filter((p: any) => !p.neutral).map((p: any) => p.color));
  expect(colors).toEqual(['#0072b2', '#e69f00']);
  await expect(page.locator('.messages')).toHaveCount(0); // subtitles off; the log still has the lines
  expect(await page.evaluate(() => window.__game.log.length)).toBeGreaterThan(0);
  // UI scale: the sidebar grows, the minimap still lands where you click.
  await page.evaluate(() => { const g = window.__game; g.s.settings.mode = 'sandbox'; g.notify(); }); // radar without a Radar Array
  await expect(page.locator('.radar')).toHaveClass(/\bon\b/);
  await page.waitForTimeout(100); // shutters slide away (instant here: reduce motion is on)
  const box = (await page.locator('.minimap').boundingBox())!;
  expect(box.width).toBeGreaterThan(232 * 1.15);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const c = await page.evaluate(() => { const g = window.__game, [x, y] = g.cam.toWorld(g.cam.vw / 2, g.cam.vh / 2); return [x / g.s.map.w, y / g.s.map.h]; });
  expect(Math.abs(c[0] - 0.5)).toBeLessThan(0.08);
  expect(Math.abs(c[1] - 0.5)).toBeLessThan(0.08);
});

test('HUD React work stays under 1 ms per frame on average while a game runs', async ({ page }) => {
  await startSkirmish(page);
  await page.evaluate(() => { const g = window.__game; g.openMenu?.(false); g.me.credits = 20_000; g.speed = 2; });
  const r = await page.evaluate(() => new Promise<{ ms: number; frames: number; commits: number }>((done) => {
    window.__hud = { ms: 0, commits: 0 };
    let frames = 0;
    const t0 = performance.now();
    const f = () => { frames++; if (performance.now() - t0 < 6000) requestAnimationFrame(f); else done({ ms: window.__hud!.ms, frames, commits: window.__hud!.commits }); };
    requestAnimationFrame(f);
  }));
  console.log(`HUD: ${r.ms.toFixed(1)} ms over ${r.frames} frames (${r.commits} commits) = ${(r.ms / r.frames).toFixed(3)} ms/frame`);
  expect(r.commits).toBeGreaterThan(10);
  expect(r.ms / r.frames).toBeLessThan(1);
});

test.describe('pixel baselines', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'one renderer is enough for pixel baselines');
  const freeze = async (page: Page) => {
    await page.mouse.move(300, 600); // on the map, away from units, cameos and the screen edge
    await page.evaluate(() => {
      const g = window.__game;
      g.openMenu?.(false); g.paused = true; window.__freeze(0);
      g.messages.length = 0; g.view.selected.clear();
      g.cam.centerOn(g.me.startX + 2, g.me.startY + 2);
      window.__step(0);
    });
    await page.waitForTimeout(300); // odometer and React settle
  };
  for (const [i, f] of [[0, 'allies'], [1, 'soviets'], [2, 'psi']] as const) {
    test(`desktop HUD, ${f}`, async ({ page }) => {
      await startSkirmish(page, i, 4242);
      await freeze(page);
      await expect(page).toHaveScreenshot(`desktop-${f}.png`, { maxDiffPixelRatio: 0.01 });
    });
  }
  test.describe('tablet', () => {
    test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true });
    for (const [i, f] of [[0, 'allies'], [1, 'soviets'], [2, 'psi']] as const) {
      test(`tablet HUD with the drawer open, ${f}`, async ({ page }) => {
        await startSkirmish(page, i, 4242);
        await page.locator('.rail').tap();
        await expect(page.locator('.sidebar')).toHaveClass(/open/);
        await freeze(page);
        await expect(page).toHaveScreenshot(`tablet-${f}.png`, { maxDiffPixelRatio: 0.01 });
      });
    }
  });
});
