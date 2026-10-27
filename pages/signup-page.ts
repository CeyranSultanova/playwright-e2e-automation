import type { Page } from '@playwright/test';
import type { Account } from '../support/accounts';

export class SignupPage {
  constructor(readonly page: Page) {}

  get heading() { return this.page.getByRole('heading', { name: 'New User Signup!' }); }
  get detailsHeading() { return this.page.getByText('Enter Account Information', { exact: true }); }
  get email() { return this.page.getByTestId('email'); }
  get createdMessage() { return this.page.getByTestId('account-created'); }
  get duplicateEmailMessage() { return this.page.getByText('Email Address already exist!', { exact: true }); }
  get signupButton() { return this.page.getByTestId('signup-button'); }
  get logoutLink() { return this.page.getByRole('link', { name: /Logout$/ }); }
  loggedInAs(name: string) { return this.page.getByText(`Logged in as ${name}`, { exact: true }); }
  signupField(name: 'name' | 'email') { return this.page.getByTestId(`signup-${name}`); }
  detailField(name: string) { return this.page.getByTestId(name); }

  async open() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    // Readiness is checked by the test; a click should not wait for ad-related navigation.
    await this.page.getByRole('link', { name: 'Signup / Login' }).click({ noWaitAfter: true });
  }

  async start({ name, email }: Pick<Account, 'name' | 'email'>) {
    await this.signupField('name').fill(name);
    await this.signupField('email').fill(email);
    await this.signupButton.click({ noWaitAfter: true });
  }

  async fillDetails(account: Account) {
    await this.page.locator(`input[name="title"][value="${account.title}"]`).check();
    await this.detailField('password').fill(account.password);
    await this.page.getByTestId('days').selectOption(account.birth_date);
    await this.page.getByTestId('months').selectOption(account.birth_month);
    await this.page.getByTestId('years').selectOption(account.birth_year);
    const address = {
      first_name: account.firstname,
      last_name: account.lastname,
      company: account.company,
      address: account.address1,
      address2: account.address2,
      state: account.state,
      city: account.city,
      zipcode: account.zipcode,
      mobile_number: account.mobile_number,
    };
    for (const [field, value] of Object.entries(address)) {
      await this.detailField(field).fill(value);
    }
    await this.page.getByTestId('country').selectOption(account.country);
  }

  async clearDetail(field: string) { await this.detailField(field).clear(); }
  async create() { await this.page.getByTestId('create-account').click({ noWaitAfter: true }); }
  async continueToHome() { await this.page.getByTestId('continue-button').click({ noWaitAfter: true }); }
}
