// Phase 16: the recorded announcer and unit voices decode and play in every browser engine.
import { expect, test } from './test';

declare global { interface Window { __game: any; __step: (n: number) => void } }

test('announcer, unit answers and hero lines decode; the announcer speaks at the start', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  const durations = await page.evaluate(async () => {
    const ctx = new AudioContext();
    const files = ['announcer-allies/construction-complete', 'announcer-soviets/our-base-is-under-attack', 'announcer-psi/warning-enemy-dominion-engine-activated',
      'acks-allies/infantry-select-0', 'acks-soviets/vehicle-move-1', 'acks-psi/ship-attack-1', 'hero-nova/select-0', 'hero-grom/attack-0', 'hero-oracle/move-2'];
    return Promise.all(files.map(async (f) => (await ctx.decodeAudioData(await (await fetch(`/assets/audio/voice/${f}.m4a`)).arrayBuffer())).duration));
  });
  for (const d of durations) { expect(d).toBeGreaterThan(0.3); expect(d).toBeLessThan(4.5); }
  // In a game the announcer queue drains (speaking one line at a time) instead of piling up.
  await page.getByRole('button', { name: 'Skirmish' }).click();
  await page.getByRole('button', { name: /Start skirmish/i }).click();
  await page.waitForFunction(() => !!window.__game && !document.querySelector('.loading'), null, { timeout: 120_000 });
  await page.evaluate(() => { const g = window.__game; g.openMenu(false); g.say('Low power', 'warn'); g.say('Unit ready', 'good'); });
  await expect(page.getByText('Battle control online')).toBeVisible();
  await page.getByRole('button', { name: 'Log', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('Low power');
  expect(errors).toEqual([]);
});
