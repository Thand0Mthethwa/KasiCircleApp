import { defineConfig } from '@playwright/test';
import base from './playwright.map.config.js';
export default defineConfig({ ...base, testMatch: '**/location-ux.spec.js', outputDir: 'test-results/location-ux',
  use: { ...base.use, baseURL: 'http://127.0.0.1:5178', hasTouch: true },
  webServer: { ...base.webServer, command: 'npm run dev -- --host 127.0.0.1 --port 5178 --strictPort', url: 'http://127.0.0.1:5178',
    env: { VITE_API_BASE_URL: 'http://127.0.0.1:5178', VITE_MAP_TILE_URL: '/__ux_tiles/{z}/{x}/{y}.png', VITE_MAP_TILE_ATTRIBUTION: 'Controlled QA tiles' } },
});
