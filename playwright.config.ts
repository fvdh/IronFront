import { defineConfig, devices } from '@playwright/test';

// End-to-end release test in real browser engines: npx playwright test
// Runs against the Vite dev server (it exposes the window.__game / __step test hooks).
export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  timeout: 240_000,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:5231', viewport: { width: 1440, height: 900 } },
  webServer: { command: 'npx vite --port 5231 --strictPort', url: 'http://localhost:5231', reuseExistingServer: true },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
  ],
});
