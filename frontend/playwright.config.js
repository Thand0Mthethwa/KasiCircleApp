import { defineConfig, devices } from '@playwright/test';

// Refuse shared/production databases: tests create accounts and promote one QA admin.
const databaseUrl = process.env.E2E_DATABASE_URL;
if (!databaseUrl) throw new Error('Set E2E_DATABASE_URL to an isolated local PostgreSQL database named kasicircle_qa.');
const database = new URL(databaseUrl);
if (!['localhost', '127.0.0.1'].includes(database.hostname) || database.pathname !== '/kasicircle_qa') {
  throw new Error('E2E_DATABASE_URL must use localhost/127.0.0.1 and database kasicircle_qa.');
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.E2E_CHROME_PATH ? { executablePath: process.env.E2E_CHROME_PATH } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: [
    {
      command: 'java -jar ../backend/target/backend-0.0.1-SNAPSHOT.jar --server.port=18081',
      url: 'http://127.0.0.1:18081/api/businesses',
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        DB_URL: `jdbc:postgresql://${database.hostname}:${database.port || '5432'}/kasicircle_qa`,
        DB_USERNAME: decodeURIComponent(database.username),
        DB_PASSWORD: decodeURIComponent(database.password) || 'qa-local-only',
        JWT_SECRET: 'Isolated-QA-only-signing-key-never-for-production-123456',
        APP_CORS_ALLOWED_ORIGIN: 'http://127.0.0.1:5174',
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: false,
      env: { VITE_API_BASE_URL: 'http://127.0.0.1:18081' },
    },
  ],
});
