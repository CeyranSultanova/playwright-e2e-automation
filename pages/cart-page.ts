import type { Page } from '@playwright/test';

export class CartPage {
  constructor(readonly page: Page) {}

  row(id: number) { return this.page.locator(`#product-${id}`); }
  name(id: number) { return this.row(id).locator('.cart_description h4'); }
  price(id: number) { return this.row(id).locator('.cart_price'); }
  quantity(id: number) { return this.row(id).locator('.cart_quantity'); }
  total(id: number) { return this.row(id).locator('.cart_total_price'); }
  get emptyMessage() { return this.page.getByText('Cart is empty!', { exact: false }); }

  async remove(id: number) { await this.row(id).locator('.cart_quantity_delete').click(); }
}
