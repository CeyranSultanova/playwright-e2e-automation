import type { APIRequestContext, APIResponse } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { data, settings } from './settings';

export type Account = ReturnType<typeof newAccount>;
type AccountResponse = { responseCode: number; message: string };

export function newAccount() {
  const { emailDomain, emailPrefix, ...template } = data.user;
  const suffix = randomUUID().replaceAll('-', '');
  return {
    ...template,
    name: `${template.name} ${suffix.slice(0, 6)}`,
    email: `${emailPrefix}+${suffix}@${emailDomain}`,
    password: `${template.password}-${suffix}`,
  };
}

async function readResponse(response: APIResponse): Promise<AccountResponse> {
  if (!response.ok()) throw new Error(`Account API returned HTTP ${response.status()}`);
  const body = await response.json();
  // This API can return HTTP 200 with an application error in responseCode.
  if (typeof body.responseCode !== 'number' || typeof body.message !== 'string') {
    throw new Error('Account API returned an unexpected response body');
  }
  return body;
}

export async function createAccount(api: APIRequestContext, account: Account) {
  return readResponse(await api.post('/api/createAccount', { form: account, timeout: settings.apiTimeout }));
}

export async function verifyAccount(api: APIRequestContext, account: Account) {
  return readResponse(await api.post('/api/verifyLogin', {
    form: { email: account.email, password: account.password },
    timeout: settings.apiTimeout,
  }));
}

export async function deleteAccount(api: APIRequestContext, account: Account) {
  return readResponse(await api.delete('/api/deleteAccount', {
    form: { email: account.email, password: account.password },
    timeout: settings.apiTimeout,
  }));
}
