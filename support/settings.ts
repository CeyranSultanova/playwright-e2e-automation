import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import defaults from '../config/test-data.json';

function positiveInteger(name: string, fallback: number): number {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  return value;
}

export const settings = {
  baseURL: process.env.BASE_URL || 'https://automationexercise.com',
  workers: positiveInteger('WORKERS', 2),
  browsers: (process.env.BROWSERS || 'chromium').split(',').map(name => name.trim()),
  testTimeout: positiveInteger('TEST_TIMEOUT_MS', 60_000),
  expectTimeout: positiveInteger('EXPECT_TIMEOUT_MS', 15_000),
  actionTimeout: positiveInteger('ACTION_TIMEOUT_MS', 15_000),
  navigationTimeout: positiveInteger('NAVIGATION_TIMEOUT_MS', 30_000),
  apiTimeout: positiveInteger('API_TIMEOUT_MS', 15_000),
  cleanupTimeout: positiveInteger('CLEANUP_TIMEOUT_MS', 45_000),
  blockAds: process.env.BLOCK_ADS !== 'false',
  adDomains: (process.env.AD_DOMAINS || 'doubleclick.net,googlesyndication.com,googleadservices.com,adservice.google.com,googletagservices.com')
    .split(',').map(domain => domain.trim()).filter(Boolean),
};

if (!['http:', 'https:'].includes(new URL(settings.baseURL).protocol)) {
  throw new Error('BASE_URL must be HTTP(S)');
}

export const data: typeof defaults = JSON.parse(
  fs.readFileSync(path.resolve(process.env.TEST_DATA_FILE || 'config/test-data.json'), 'utf8'),
);

const optionalUserFields = new Set<string>(['company', 'address2']);
for (const key of Object.keys(defaults.user) as (keyof typeof defaults.user)[]) {
  const value = data.user?.[key];
  if (typeof value !== 'string') throw new Error(`user.${key} must be a string`);
  if (!optionalUserFields.has(key) && !value.trim()) throw new Error(`Missing user.${key} in test data`);
}

const product = data.product;
if (!product?.name || !product.price || !product.availability || !product.partialTerm ||
    !Number.isInteger(product.id) || product.id < 1 ||
    !Number.isInteger(product.quantity) || product.quantity < 2 ||
    !Number.isFinite(product.unitPrice) || product.unitPrice <= 0) {
  throw new Error('Invalid product test data');
}
