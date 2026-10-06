// Phase 18: the whole shell in one go: menu → lobby → briefing → game → score → again → menu. Plus the live menu background.
import { expect, test } from './test';

declare global { interface Window { __game: any; __step: (n: number) => void } }

test('menu → lobby → briefing → game → score → play again → main menu', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Iron\s*Front/i })).toBeVisible();
  await expect(page.locator('.shell-ver')).toContainText(/^v\d+\.\d+\.\d+/);
  await page.getByRole('button', { name: 'Skirmish' }).click();

  // Lobby: pick Psi, two AI opponents with their own faction, level and colour; the map preview follows the slots.
  await page.locator('.faction[data-f="psi"]').click();
  await expect(page.locator('.faction[data-f="psi"]')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '+ Add AI opponent' }).click();
  await expect(page.locator('.slots > li.slot')).toHaveCount(3);
  await expect(page.getByRole('img', { name: /3 start positions/ })).toBeVisible();
  await page.getByLabel('General Kova faction').selectOption('soviets');
  await page.getByLabel('Marshal Brandt faction').selectOption('allies');
  await page.getByLabel('Marshal Brandt difficulty').selectOption('easy');
  const before = await page.locator('.slots > li.slot').nth(2).locator('.sw').evaluate((e) => getComputedStyle(e).backgroundColor);
  await page.getByRole('button', { name: 'Marshal Brandt colour: next' }).click();
  const after = await page.locator('.slots > li.slot').nth(2).locator('.sw').evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(after).not.toBe(before);
  await expect(page.locator('.seed input')).toBeHidden(); // folded away under Advanced
  await page.getByText('Advanced').click();
  await page.locator('.seed input').fill('777');
  await page.getByRole('button', { name: /Start skirmish/i }).click();

  // Briefing while the sprites bake: map, players, real load steps.
  await expect(page.locator('.briefing')).toBeVisible();
  await expect(page.locator('.briefing')).toContainText('Objective: destroy every enemy structure.');
  await expect(page.locator('.briefing .term')).toContainText(/Baking sprites… \d+\/\d+/);
  await expect(page.locator('.briefing .foes li')).toHaveCount(3);
  await page.waitForFunction(() => !!window.__game && !document.querySelector('.loading'), null, { timeout: 120_000 });
  const setup = await page.evaluate(() => {
    const g = window.__game;
    return { seed: g.s.settings.seed, factions: g.s.players.filter((p: any) => !p.neutral).map((p: any) => p.faction), levels: g.s.ai.map((a: any) => a.difficulty ?? g.s.settings.difficulty), colors: new Set(g.s.players.filter((p: any) => !p.neutral).map((p: any) => p.color)).size };
  });
  expect(setup).toEqual({ seed: 777, factions: ['psi', 'soviets', 'allies'], levels: ['normal', 'easy'], colors: 3 });

  // A decision of the human through the sidebar ends up in the telemetry (Fun Pass 20.4).
  await page.getByRole('button', { name: /^Bio Reactor,/ }).first().click(); // Psi's power plant
  // Win: the score screen counts up, ranks you, and offers another round.
  await page.evaluate(() => { const g = window.__game; g.openMenu?.(false); for (const e of g.s.entities) if (e.owner !== 0 && e.owner !== g.s.neutral) e.hp = 0; window.__step(5); });
  await expect(page.getByText('MISSION ACCOMPLISHED', { exact: true })).toBeVisible();
  await expect(page.locator('.score .rank')).toContainText(/Rank: \w/);
  // Export match data: a JSON file with build, AI version, the players and the human's decisions.
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export match data' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^iron-front-match-.*\.json$/);
  const rec = JSON.parse(await (await download.createReadStream()).toArray().then((c) => Buffer.concat(c).toString()));
  expect(rec).toMatchObject({ format: 'iron-front-match', winner: 0, aiVersion: 1, settings: { seed: 777 } });
  expect(rec.build).toMatch(/^\d+\.\d+\.\d+\+[0-9a-f]{8}/);
  expect(rec.players.map((p: any) => p.faction)).toEqual(['psi', 'soviets', 'allies']);
  expect(rec.telemetry.dec.some(([, owner, kind]: [number, number, string]) => owner === 0 && kind === 'queue')).toBe(true);
  await expect(page.locator('.score .standings li')).toHaveCount(3);
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.locator('.briefing')).toBeVisible();
  await page.waitForFunction(() => !!window.__game && !document.querySelector('.loading') && window.__game.s.tick < 100, null, { timeout: 120_000 });
  expect(await page.evaluate(() => window.__game.s.players.filter((p: any) => !p.neutral).map((p: any) => p.faction))).toEqual(['psi', 'soviets', 'allies']);

  // Lose this time, then back to the menu.
  await page.evaluate(() => { const g = window.__game; g.openMenu?.(false); for (const e of g.s.entities) if (e.owner === 0) e.hp = 0; window.__step(5); });
  await expect(page.getByText('MISSION FAILED', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Main menu' }).click();
  await expect(page.getByRole('button', { name: 'Skirmish' })).toBeVisible();
});

test('the menu background plays a live AI-vs-AI game and stops when you leave', async ({ page }) => {
  await page.goto('/?attract'); // tests switch it off by default (navigator.webdriver)
  await expect(page.locator('.attract-bg.live')).toBeAttached({ timeout: 120_000 });
  await expect(page.locator('.attract-tag')).toContainText(/Live · AI vs AI · \w/);
  // It is really moving: the picture changes.
  const a = await page.locator('.attract-bg').evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.waitForTimeout(1500);
  expect(await page.locator('.attract-bg').evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toBe(a);
  await page.getByRole('button', { name: 'Skirmish' }).click();
  await expect(page.locator('.attract-tag')).toHaveCount(0); // tag only on the main menu
  await expect(page.locator('.attract-bg')).toBeAttached(); // still running behind the lobby
  await page.getByRole('button', { name: /Start skirmish/i }).click();
  await expect(page.locator('.briefing')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.attract-bg')).toHaveCount(0);
});
