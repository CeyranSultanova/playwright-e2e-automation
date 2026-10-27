import { test, expect } from '../support/fixtures';
import { createAccount } from '../support/accounts';
import { SignupPage } from '../pages/signup-page';

test('REG-01 @smoke registers through the full form and starts an authenticated session', async ({ page, account, request }) => {
  const signup = new SignupPage(page);
  await signup.open();
  await signup.start(account);
  await signup.fillDetails(account);
  await page.getByTestId('create-account').click();
  await expect(page.getByTestId('account-created')).toHaveText('Account Created!');
  await page.getByTestId('continue-button').click();
  await expect(page.getByText(`Logged in as ${account.name}`)).toBeVisible();
  await expect(page.getByRole('link', { name: /Logout$/ })).toBeVisible();
  const response = await request.post('/api/verifyLogin', { form: { email: account.email, password: account.password } });
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toMatchObject({ responseCode: 200 });
});

test('REG-02 @smoke rejects an email belonging to an existing account', async ({ page, request, account }) => {
  await createAccount(request, account);
  const signup = new SignupPage(page);
  await signup.open();
  await signup.start(account);
  await expect(page.getByText('Email Address already exist!', { exact: true })).toBeVisible();
  await expect(page.getByTestId('signup-button')).toBeVisible();
  await expect(page.getByRole('link', { name: /Logout$/ })).toHaveCount(0);
});

for (const field of ['name', 'email'] as const) {
  test(`REG-03-${field} requires signup ${field}`, async ({ page, account }) => {
    await new SignupPage(page).open();
    await page.getByTestId('signup-name').fill(field === 'name' ? '' : account.name);
    await page.getByTestId('signup-email').fill(field === 'email' ? '' : account.email);
    await page.getByTestId('signup-button').click();
    const input = page.getByTestId(`signup-${field}`);
    await expect(input).toBeFocused();
    expect(await input.evaluate((element: HTMLInputElement) => element.validity.valueMissing)).toBe(true);
    await expect(page).toHaveURL(/\/login$/);
  });
}

test('REG-04 rejects a malformed email using native validation', async ({ page, account }) => {
  await new SignupPage(page).open();
  await page.getByTestId('signup-name').fill(account.name);
  await page.getByTestId('signup-email').fill(account.email.replace('@', ''));
  await page.getByTestId('signup-button').click();
  expect(await page.getByTestId('signup-email').evaluate((element: HTMLInputElement) => element.validity.typeMismatch)).toBe(true);
  await expect(page).toHaveURL(/\/login$/);
});

for (const field of ['password', 'first_name', 'last_name', 'address', 'state', 'city', 'zipcode', 'mobile_number']) {
  test(`REG-05-${field} prevents account creation without ${field}`, async ({ page, account }) => {
    const signup = new SignupPage(page);
    await signup.open();
    await signup.start(account);
    await signup.fillDetails(account);
    const input = page.getByTestId(field);
    await input.fill('');
    await page.getByTestId('create-account').click();
    await expect(input).toBeFocused();
    expect(await input.evaluate((element: HTMLInputElement) => element.validity.valueMissing)).toBe(true);
    await expect(page.getByTestId('account-created')).toHaveCount(0);
    await expect(page).toHaveURL(/\/signup$/);
  });
}
