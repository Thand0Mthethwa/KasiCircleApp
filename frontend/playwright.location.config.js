import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config.js';

// Real API + guarded QA PostgreSQL; tile bytes only come from controlled browser fixtures.
export default defineConfig({
  ...base,
  testMatch: '**/location.spec.js',
  outputDir: 'test-results/business-location',
  timeout: 90000,
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], viewport: { width: 375, height: 950 }, defaultBrowserType: 'chromium' } },
  ],
  webServer: base.webServer.map(server => ({ ...server, env: { ...server.env,
    ...(server.url.includes('18081') ? { JAVA_TOOL_OPTIONS: '-Xmx384m' }
      : { VITE_MAP_TILE_URL: '/__qa_location_tiles/{z}/{x}/{y}.png', VITE_MAP_TILE_ATTRIBUTION: 'Local QA tile fixture — temporary test businesses' }),
  } })),
});
