import { test, expect } from '../support/fixtures';
import { createAccount } from '../support/accounts';
import { settings } from '../support/settings';

test.beforeEach(async ({ signup }) => {
  await signup.open();
  await expect(signup.heading).toBeVisible({ timeout: settings.navigationTimeout });
});

test('REG-01 @smoke creates an account and logs in', async ({ signup, account }) => {
  await signup.start(account);
  await expect(signup.detailsHeading).toBeVisible();
  await expect(signup.email).toHaveValue(account.email);
  await signup.fillDetails(account);
  await signup.create();
  account.markCreated();
  await expect(signup.createdMessage).toHaveText('Account Created!');
  await signup.continueToHome();
  await expect(signup.loggedInAs(account.name)).toBeVisible();
  await expect(signup.logoutLink).toBeVisible();
});

test('REG-02 @smoke rejects an already registered email', async ({ signup, request, account }) => {
  expect(await createAccount(request, account)).toMatchObject({ responseCode: 201, message: 'User created!' });
  account.markCreated();
  await signup.start(account);
  await expect(signup.duplicateEmailMessage).toBeVisible();
  await expect(signup.logoutLink).toHaveCount(0);
});

for (const field of ['name', 'email'] as const) {
  test(`REG-03-${field} requires ${field} to sign up`, async ({ page, signup, account }) => {
    await signup.start({ ...account, [field]: '' });
    const input = signup.signupField(field);
    expect(await input.evaluate((element: HTMLInputElement) => element.validity.valueMissing)).toBe(true);
    await expect(page).toHaveURL(/\/login$/);
  });
}

test('REG-04 rejects an email without @', async ({ page, signup, account }) => {
  await signup.start({ ...account, email: account.email.replace('@', '') });
  expect(await signup.signupField('email').evaluate((element: HTMLInputElement) => element.validity.typeMismatch)).toBe(true);
  await expect(page).toHaveURL(/\/login$/);
});

for (const field of ['password', 'first_name', 'address', 'mobile_number']) {
  test(`REG-05-${field} requires ${field.replaceAll('_', ' ')} to register`, async ({ page, signup, account }) => {
    await signup.start(account);
    await expect(signup.detailsHeading).toBeVisible();
    await signup.fillDetails(account);
    await signup.clearDetail(field);
    await signup.create();
    const input = signup.detailField(field);
    expect(await input.evaluate((element: HTMLInputElement) => element.validity.valueMissing)).toBe(true);
    await expect(page).toHaveURL(/\/signup$/);
  });
}
