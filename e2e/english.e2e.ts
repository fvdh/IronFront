// Phase 14: the whole game UI is English, and the faction theme switches with one attribute.
import { expect, test, type Page } from './test';

declare global { interface Window { __game: any; __step: (n: number) => void } }

// Common Dutch words that never appear in English UI copy (whole words, case-insensitive).
const DUTCH = /\b(het|een|niet|wordt|worden|jouw|klik|tegen|naar|voor|met|gebouw\w*|eenhe\w+|vijand\w*|stroom|bereik|seconden|minuten|tegels|infanterie|voertuig\w*|vereist|opslaan|laden|instellingen|hervat\w*|pauze|gepauzeerd|terug|overwinning|nederlaag|gereed|kaart|speler\w*|zwaar|sneller|langzaam|schade|orakel)\b/i;

const dutchIn = async (page: Page, where: string) => {
  const text = await page.evaluate(() => {
    const attrs = [...document.querySelectorAll('[title],[aria-label],[placeholder]')]
      .flatMap((e) => ['title', 'aria-label', 'placeholder'].map((a) => e.getAttribute(a) ?? ''));
    return [document.body.innerText, ...attrs].join('\n');
  });
  const hits = text.split('\n').filter((l) => DUTCH.test(l));
  expect(hits, `Dutch text on ${where}`).toEqual([]);
};

test('no Dutch text in menus, setup, HUD, tooltips and overlays', async ({ page }) => {
  await page.goto('/');
  await dutchIn(page, 'main menu');
  for (const name of [/settings|options/i, /credits/i]) {
    await page.getByRole('button', { name }).first().click();
    await dutchIn(page, String(name));
    await page.getByRole('button', { name: /back/i }).first().click();
  }
  await page.getByRole('button', { name: 'Skirmish' }).click();
  await dutchIn(page, 'skirmish setup');
  await page.getByRole('button', { name: /start skirmish/i }).click();
  await page.waitForFunction(() => !!window.__game && !document.querySelector('.loading'), null, { timeout: 120_000 });
  await page.evaluate(() => window.__game.openMenu?.(false));
  await dutchIn(page, 'HUD');
  // Every build tab, with a tooltip open on each cameo.
  for (const tab of await page.getByRole('tab').all()) {
    await tab.click();
    for (const cameo of await page.locator('.cameo').all()) { await cameo.hover(); await dutchIn(page, 'tooltip'); }
  }
  await page.keyboard.press('F1');
  await dutchIn(page, 'help overlay');
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.__game.openMenu(true));
  await dutchIn(page, 'pause menu');
});

test('faction theme comes from one data-faction attribute', async ({ page }) => {
  await page.goto('/');
  const glow = await page.evaluate(() => ['allies', 'soviets', 'psi'].map((f) => {
    const d = document.createElement('div');
    d.dataset.faction = f;
    document.body.append(d);
    const v = getComputedStyle(d).getPropertyValue('--glow').trim();
    d.remove();
    return v;
  }));
  expect(new Set(glow).size).toBe(3);
  await page.getByRole('button', { name: 'Skirmish' }).click();
  await page.getByRole('button', { name: /start skirmish/i }).click();
  await page.waitForFunction(() => !!window.__game && !document.querySelector('.loading'), null, { timeout: 120_000 });
  const f = await page.evaluate(() => [window.__game.me.faction, document.querySelector('.game')?.getAttribute('data-faction')]);
  expect(f[1]).toBe(f[0]);
});
