import type { Page } from '@playwright/test';

export class ProductPage {
  constructor(readonly page: Page) {}

  get details() { return this.page.locator('.product-information'); }
  get name() { return this.details.getByRole('heading'); }
  get price() { return this.details.locator('span > span'); }
  get availability() { return this.details.locator('p').filter({ hasText: 'Availability:' }); }
  get quantity() { return this.page.locator('#quantity'); }
  get addButton() { return this.details.getByRole('button', { name: 'Add to cart' }); }
  get confirmation() { return this.page.locator('#cartModal'); }
  get addedMessage() { return this.confirmation.getByText('Your product has been added to cart.'); }

  async setQuantity(quantity: number) { await this.quantity.fill(String(quantity)); }
  async addToCart() { await this.addButton.click(); }
  async viewCart() {
    await this.confirmation.getByRole('link', { name: 'View Cart' }).click({ noWaitAfter: true });
    await this.page.waitForURL(/\/view_cart$/, { waitUntil: 'domcontentloaded' });
  }
}
