import { defineConfig } from '@playwright/test';

const API_PORT = Number(process.env.API_PORT ?? 4100);
const API_BASE_URL = process.env.API_BASE_URL ?? `http://127.0.0.1:${API_PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    // retain-on-failure wins over on-first-retry locally, where retries are 0
    // and a first-run failure would otherwise leave no trace.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: API_BASE_URL },
    },
    // Browser projects are added with the storefront.
  ],
  webServer: {
    command: 'npm run start -w @wardaya/api',
    url: `${API_BASE_URL}/api/health`,
    reuseExistingServer: false,
    timeout: 30_000,
    env: {
      PORT: String(API_PORT),
      DATABASE_PATH: '.data/playwright.sqlite',
      ALLOW_TEST_ROUTES: '1',
      NODE_ENV: 'test',
    },
  },
});
