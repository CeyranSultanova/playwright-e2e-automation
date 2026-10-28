import type { Page } from '@playwright/test';

export class ProductsPage {
  constructor(readonly page: Page) {}

  get heading() { return this.page.locator('.features_items > h2'); }
  get cards() { return this.page.locator('.features_items .product-image-wrapper'); }
  get names() { return this.cards.locator('.productinfo p'); }
  card(name: string) { return this.cards.filter({ has: this.page.getByText(name, { exact: true }) }); }

  async open() {
    await this.page.goto('/products', { waitUntil: 'domcontentloaded' });
  }

  async search(term: string) {
    await this.page.locator('#search_product').fill(term);
    const searchResponse = this.page.waitForResponse(response => {
      const url = new URL(response.url());
      return response.request().isNavigationRequest() &&
        url.pathname === '/products' &&
        (url.searchParams.get('search') ?? '') === term;
    });
    await this.page.locator('#submit_search').click({ noWaitAfter: true });
    const response = await searchResponse;
    if (!response.ok()) throw new Error(`Product search returned HTTP ${response.status()}`);
    await this.page.waitForURL(url => url.pathname === '/products' && url.searchParams.get('search') === term, {
      waitUntil: 'domcontentloaded',
    });
  }

  async openProduct(name: string) {
    await this.card(name).getByRole('link', { name: 'View Product' }).click({ noWaitAfter: true });
    // The cart button can be visible before its synchronous click handler is installed.
    await this.page.waitForURL(/\/product_details\/\d+$/, { waitUntil: 'domcontentloaded' });
  }
}
