import { expect, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { data } from './settings';
export type Account = ReturnType<typeof newAccount>;
export function newAccount() {
  const { emailDomain, emailPrefix, ...fields } = data.user;
  const suffix = randomUUID().replaceAll('-', '').slice(0, 16);
  return { ...fields, email: `${emailPrefix}+${suffix}@${emailDomain}` };
}
export async function createAccount(api: APIRequestContext, account: Account) {
  const response = await api.post('/api/createAccount', { form: account });
  expect(response.ok(), 'Create account HTTP status').toBeTruthy();
  // The API reports application status in the response body too.
  expect(await response.json()).toMatchObject({ responseCode: 201, message: 'User created!' });
}
export async function deleteAccount(api: APIRequestContext, account: Account) {
  // Account creation may succeed even if the next UI step fails.
  const response = await api.delete('/api/deleteAccount', { form: { email: account.email, password: account.password } });
  expect(response.ok(), 'Cleanup HTTP status').toBeTruthy();
  const result = await response.json();
  expect([200, 404], 'Cleanup must delete the account or confirm it does not exist').toContain(result.responseCode);
  const verification = await api.post('/api/verifyLogin', { form: { email: account.email, password: account.password } });
  expect(verification.ok()).toBeTruthy();
  expect(await verification.json(), 'Account must not survive teardown').toMatchObject({ responseCode: 404 });
}
