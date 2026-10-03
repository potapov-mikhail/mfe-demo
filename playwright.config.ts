import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  workers: 1,
  use: { channel: 'chrome', headless: true, trace: 'retain-on-failure' },
  webServer: {
    command: process.env['TEST_PRODUCTION'] ? 'npm run serve:dist' : 'npm start',
    url: 'http://localhost:4202',
    timeout: 180_000,
    reuseExistingServer: !process.env['CI'] && !process.env['TEST_PRODUCTION'],
  },
});
