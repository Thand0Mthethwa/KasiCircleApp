import { defineConfig } from '@playwright/test';

// UI fixtures only. Real PostgreSQL journeys remain in playwright.config.js.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/ui.spec.js',
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  reporter: 'list',
  outputDir: 'test-results/design-migration',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    browserName: 'chromium',
    launchOptions: {
      executablePath: process.env.E2E_CHROME_PATH || '/usr/bin/google-chrome',
      args: ['--no-sandbox'],
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
