import { randomUUID } from 'node:crypto';
import { test, expect } from '../support/fixtures';
import type { ProductsPage } from '../pages/products-page';
import { data, settings } from '../support/settings';

async function expectMatchingNames(products: ProductsPage, term: string) {
  await expect(products.heading).toHaveText('Searched Products');
  await expect(async () => {
    const names = await products.names.allTextContents();
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(name.toLowerCase()).toContain(term.toLowerCase());
  }).toPass({ timeout: settings.expectTimeout });
}

test.beforeEach(async ({ products }) => {
  await products.open();
  await expect(products.heading).toHaveText('All Products');
  await expect(products.names.first()).toBeVisible();
});

test('SEARCH-01 @smoke adds the searched product to the cart', async ({ page, products, product, cart }) => {
  const expected = data.product;
  await products.search(expected.name);
  await expectMatchingNames(products, expected.name);
  await products.openProduct(expected.name);
  await expect(product.name).toHaveText(expected.name);
  await expect(page).toHaveURL(new RegExp(`/product_details/${expected.id}$`));
  await expect(product.price).toHaveText(expected.price);
  await expect(product.availability).toHaveText(`Availability: ${expected.availability}`);
  await expect(product.quantity).toHaveValue('1');
  await product.setQuantity(expected.quantity);
  await product.addToCart();
  await expect(product.addedMessage).toBeVisible();
  await product.viewCart();
  await expect(cart.name(expected.id)).toHaveText(expected.name);
  await expect(cart.price(expected.id)).toHaveText(expected.price);
  await expect(cart.quantity(expected.id)).toHaveText(String(expected.quantity));
  await expect(cart.total(expected.id)).toHaveText(`Rs. ${expected.unitPrice * expected.quantity}`);
  await cart.remove(expected.id);
  await expect(cart.emptyMessage).toBeVisible();
});

test('SEARCH-02 can search again after no results', async ({ products }) => {
  await products.search(`no-product-${randomUUID()}`);
  await expect(products.heading).toHaveText('Searched Products');
  await expect(products.cards).toHaveCount(0);
  await products.search(data.product.name);
  await expectMatchingNames(products, data.product.name);
});

for (const [variant, term] of [['partial', data.product.partialTerm], ['uppercase', data.product.name.toUpperCase()]]) {
  test(`SEARCH-03-${variant} matches ${variant} search terms`, async ({ products }) => {
    await products.search(term);
    await expectMatchingNames(products, term);
    await expect(products.card(data.product.name)).toHaveCount(1);
  });
}

test('SEARCH-04 shows all products for an empty search', async ({ products }) => {
  const initialNames = await products.names.allTextContents();
  await products.search('');
  await expect(products.heading).toHaveText('All Products');
  await expect(products.names).toHaveText(initialNames);
});
