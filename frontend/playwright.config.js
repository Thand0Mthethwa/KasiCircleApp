import { defineConfig, devices } from "@playwright/test";

import { randomBytes } from "node:crypto";
import { loadE2EEnvironment, parseTestDatabase, testDatabaseSQL } from "./scripts/e2e-database.mjs";

loadE2EEnvironment();
const database = parseTestDatabase(process.env.E2E_DATABASE_URL);
// A live identity/marker check must succeed before Spring Boot can run Flyway.
testDatabaseSQL();
const jdbcUrl = `jdbc:postgresql://${database.host}:${database.port}/${database.name}`;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results/real-backend",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5176",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: process.env.E2E_CHROME_PATH
      ? { executablePath: process.env.E2E_CHROME_PATH }
      : {},
  },
  projects: [
    {
      name: "desktop",
      testMatch: "**/marketplace.spec.js",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testMatch: "**/marketplace.spec.js",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
    {
      name: "responsive",
      testMatch: "**/ui.spec.js",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command:
        `java -jar ../backend/target/backend-0.0.1-SNAPSHOT.jar --server.port=18081 --spring.datasource.url=${jdbcUrl} --spring.flyway.url=${jdbcUrl} --spring.profiles.active=e2e`,
      url: "http://127.0.0.1:18081/api/businesses",
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        DB_URL: jdbcUrl,
        SPRING_DATASOURCE_URL: jdbcUrl,
        SPRING_DATASOURCE_USERNAME: database.username,
        SPRING_DATASOURCE_PASSWORD: database.password,
        SPRING_PROFILES_ACTIVE: "e2e",
        SPRING_FLYWAY_USER: database.username,
        SPRING_FLYWAY_PASSWORD: database.password,
        DB_USERNAME: database.username,
        DB_PASSWORD: database.password,
        JWT_SECRET: randomBytes(48).toString("base64"),
        CLOUDINARY_CLOUD_NAME: "",
        CLOUDINARY_API_KEY: "",
        CLOUDINARY_API_SECRET: "",
        APP_CORS_ALLOWED_ORIGIN: "http://127.0.0.1:5176",
      },
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5176 --strictPort",
      url: "http://127.0.0.1:5176",
      reuseExistingServer: false,
      env: { VITE_API_BASE_URL: "http://127.0.0.1:18081" },
    },
  ],
});
