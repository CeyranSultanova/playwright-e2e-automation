import { defineConfig, devices } from '@playwright/test';
import { settings } from './support/settings';

const profiles = {
  chromium: devices['Desktop Chrome'],
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: settings.workers,
  timeout: settings.testTimeout,
  expect: { timeout: settings.expectTimeout },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: settings.baseURL,
    testIdAttribute: 'data-qa',
    actionTimeout: settings.actionTimeout,
    navigationTimeout: settings.navigationTimeout,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  projects: settings.browsers.map(name => {
    if (!(name in profiles)) throw new Error(`Unsupported browser: ${name}`);
    return { name, use: { ...profiles[name as keyof typeof profiles] } };
  }),
});
