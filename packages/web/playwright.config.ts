import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — runs tests against `vite preview` on port 4173.
 *
 * Tests mock all backend HTTP via `page.route()` (see e2e/fixtures.ts), so no
 * real server, DB, or bearer token is needed. The preview server only serves
 * the static SPA bundle.
 *
 * To run: `pnpm test:e2e` (builds + previews + runs).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Mobile viewport — app is mobile-first.
    viewport: { width: 430, height: 932 },
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
