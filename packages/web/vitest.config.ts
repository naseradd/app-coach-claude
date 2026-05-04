import { defineConfig } from 'vitest/config';

// Vitest runs only the unit suite under test/. The e2e/ directory is
// reserved for Playwright (see playwright.config.ts).
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
});
