import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import defaults from '../config/test-data.json';

export const data: typeof defaults = JSON.parse(fs.readFileSync(path.resolve(process.env.TEST_DATA_FILE || 'config/test-data.json'), 'utf8'));
for (const key of Object.keys(defaults.user) as (keyof typeof defaults.user)[]) {
  if (typeof data.user?.[key] !== 'string' || !data.user[key]) throw new Error(`Missing user.${key} in test data`);
}
if (!data.product?.name || !data.product.price || !data.product.availability || !data.product.partialTerm ||
    !Number.isInteger(data.product.id) || !Number.isInteger(data.product.quantity) || data.product.quantity < 2 ||
    !Number.isFinite(data.product.unitPrice) || data.product.unitPrice <= 0) throw new Error('Invalid product test data');
export const baseURL = process.env.BASE_URL || 'https://automationexercise.com';
if (!['http:', 'https:'].includes(new URL(baseURL).protocol)) throw new Error('BASE_URL must be HTTP(S)');
