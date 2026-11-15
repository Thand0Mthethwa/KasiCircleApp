import { defineConfig } from '@playwright/test';

// Frontend-only controlled API/tile fixtures. No database or public tile traffic.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/map.spec.js',
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  reporter: 'list',
  outputDir: 'test-results/marketplace-map',
  use: {
    baseURL: 'http://127.0.0.1:5177',
    browserName: 'chromium',
    launchOptions: { executablePath: process.env.E2E_CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5177 --strictPort',
    url: 'http://127.0.0.1:5177',
    reuseExistingServer: false,
    env: { VITE_API_BASE_URL: 'http://127.0.0.1:5177', VITE_MAP_TILE_URL: '/__map_tiles/{z}/{x}/{y}.png', VITE_MAP_TILE_ATTRIBUTION: 'Local QA tile fixture — not geographic imagery' },
  },
});
