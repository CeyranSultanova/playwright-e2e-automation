import { expect, type Page } from '@playwright/test';
import type { Account } from '../support/accounts';
export class SignupPage {
  constructor(readonly page: Page) {}
  async open() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.page.getByRole('link', { name: 'Signup / Login' }).click();
    await expect(this.page.getByRole('heading', { name: 'New User Signup!' })).toBeVisible();
  }
  async start(account: Account) {
    await this.page.getByTestId('signup-name').fill(account.name);
    await this.page.getByTestId('signup-email').fill(account.email);
    await this.page.getByTestId('signup-button').click();
  }
  async fillDetails(account: Account) {
    await expect(this.page.getByText('Enter Account Information', { exact: true })).toBeVisible();
    await this.page.locator(`input[name="title"][value="${account.title}"]`).check();
    await expect(this.page.getByTestId('email')).toHaveValue(account.email);
    await this.page.getByTestId('password').fill(account.password);
    await this.page.getByTestId('days').selectOption(account.birth_date);
    await this.page.getByTestId('months').selectOption(account.birth_month);
    await this.page.getByTestId('years').selectOption(account.birth_year);
    for (const [selector, value] of Object.entries({first_name: account.firstname, last_name: account.lastname,
      company: account.company, address: account.address1, address2: account.address2, state: account.state,
      city: account.city, zipcode: account.zipcode, mobile_number: account.mobile_number})) {
      await this.page.getByTestId(selector).fill(value);
    }
    await this.page.getByTestId('country').selectOption(account.country);
  }
}
