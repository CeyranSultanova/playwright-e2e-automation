import { defineConfig, devices } from '@playwright/test';
import { baseURL } from './support/settings';
const browsers = (process.env.BROWSERS || 'chromium').split(',');
const profiles = { chromium: devices['Desktop Chrome'], firefox: devices['Desktop Firefox'], webkit: devices['Desktop Safari'] };
const workers = Number(process.env.WORKERS || 2);
if (!Number.isInteger(workers) || workers < 1) throw new Error('WORKERS must be a positive integer');
export default defineConfig({
  testDir: './tests', fullyParallel: true, forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, workers, timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]],
  use: { baseURL, testIdAttribute: 'data-qa', actionTimeout: 15_000, navigationTimeout: 30_000,
    trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure', serviceWorkers: 'block' },
  projects: browsers.map(name => {
    if (!(name in profiles)) throw new Error(`Unsupported browser: ${name}`);
    return { name, use: { ...profiles[name as keyof typeof profiles] } };
  }),
});
