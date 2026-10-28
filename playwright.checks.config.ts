import { defineConfig } from '@playwright/test';
import e2eConfig from './playwright.config';

export default defineConfig(e2eConfig, {
  testDir: './checks',
  outputDir: './test-results/checks',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report/checks' }],
    ['junit', { outputFile: 'test-results/checks/junit.xml' }],
  ],
});
