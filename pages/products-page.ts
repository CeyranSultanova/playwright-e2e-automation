import { expect, type Page } from '@playwright/test';
export class ProductsPage {
  constructor(readonly page: Page) {}
  get cards() { return this.page.locator('.features_items .product-image-wrapper'); }
  async open() {
    await this.page.goto('/products', { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { name: 'All Products', exact: true })).toBeVisible();
    await expect(this.cards.first()).toBeVisible();
  }
  async search(term: string) {
    await this.page.locator('#search_product').fill(term);
    await this.page.locator('#submit_search').click();
    await expect(this.page.getByRole('heading', { name: term ? 'Searched Products' : 'All Products', exact: true })).toBeVisible();
  }
  async expectMatches(term: string) {
    await expect(this.cards.first()).toBeVisible();
    const names = await this.cards.locator('.productinfo p').allTextContents();
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(name.toLowerCase()).toContain(term.toLowerCase());
  }
}
