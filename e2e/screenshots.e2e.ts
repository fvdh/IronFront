// README screenshots (docs/screenshots). Not part of the normal run: SCREENSHOTS=1 npx playwright test e2e/screenshots.e2e.ts --project=chromium
import { expect, test } from './test';

declare global { interface Window { __game: any; __step: (n: number) => void } }
const out = (name: string) => `docs/screenshots/${name}.png`;

test.skip(!process.env.SCREENSHOTS, 'only on request');
test.setTimeout(300_000);

test('README screenshots', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium');
  await page.goto('/?attract');
  await expect(page.locator('.attract-bg.live')).toBeAttached({ timeout: 120_000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: out('menu') });

  await page.getByRole('button', { name: 'Skirmish' }).click();
  await page.locator('.faction[data-f="soviets"]').click();
  await page.getByRole('button', { name: '+ Add AI opponent' }).click();
  await page.getByLabel('General Kova faction').selectOption('allies');
  await page.getByLabel('Marshal Brandt faction').selectOption('psi');
  await page.getByLabel('General Kova difficulty').selectOption('hard');
  await page.getByText('Advanced').click();
  await page.locator('.seed input').fill('4242');
  await page.mouse.move(10, 890);
  await page.screenshot({ path: out('lobby') });

  await page.getByRole('button', { name: /Start skirmish/i }).click();
  await expect(page.locator('.briefing .term')).toContainText(/Baking sprites… [1-9]/);
  await page.waitForTimeout(600);
  await page.screenshot({ path: out('briefing') });
  await page.waitForFunction(() => !!window.__game && !document.querySelector('.loading'), null, { timeout: 120_000 });

  // A skirmish in progress: a base, two armies meeting, a selection with brackets and a group number.
  await page.evaluate(async () => {
    const { spawnBuilding, spawnUnit } = await import('/src/game/core/entities.ts');
    const { commandAttack } = await import('/src/game/systems/orders.ts');
    const g = window.__game, s = g.s, me = g.me, x = Math.floor(me.startX), y = Math.floor(me.startY);
    g.openMenu?.(false);
    for (const p of s.players) p.passive = p.id !== 0;
    s.ai.length = 0;
    spawnBuilding(s, 'power', 0, x + 3, y - 1); spawnBuilding(s, 'refinery', 0, x - 4, y - 5); spawnBuilding(s, 'barracks', 0, x + 3, y + 3);
    spawnBuilding(s, 'factory', 0, x - 1, y - 6); spawnBuilding(s, 'tower', 0, x + 7, y - 3);
    const mine = [0, 1, 2, 3, 4].map((k) => spawnUnit(s, 'tank_soviets', 0, x + 8 + (k % 3), y + 2 + Math.floor(k / 3)));
    const foes = [0, 1, 2, 3].map((k) => spawnUnit(s, 'tank_allies', 1, x + 14 + (k % 2), y + 1 + Math.floor(k / 2)));
    for (const k of [0, 1, 2]) spawnUnit(s, 'rifle', 0, x + 6 + k * 0.6, y + 5);
    for (let k = 0; k < me.visible.length; k++) me.visible[k] = me.explored[k] = 1;
    commandAttack(s, 0, mine.map((u: any) => u.id), foes[0].id);
    for (const u of mine) g.view.selected.add(u.id);
    g.groups.set(1, mine.map((u: any) => u.id));
    g.cam.centerOn(x + 7, y + 1);
    me.credits = 7350;
  });
  await page.mouse.move(700, 600);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: out('battle') });

  await page.evaluate(() => {
    const g = window.__game, st = g.me.stats;
    Object.assign(st, { harvested: 24600, unitsBuilt: 38, buildingsBuilt: 14, kills: 41, losses: 17 });
    for (const e of g.s.entities) if (e.owner !== 0 && e.owner !== g.s.neutral) e.hp = 0;
    window.__step(5);
  });
  await expect(page.locator('.score')).toBeVisible();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: out('score') });
});
