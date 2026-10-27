import { randomUUID } from 'node:crypto';
import { test, expect } from '../support/fixtures';
import { ProductsPage } from '../pages/products-page';
import { data } from '../support/settings';

test('SEARCH-01 @smoke finds a product, verifies details and adds the selected quantity to cart', async ({ page }) => {
  const products = new ProductsPage(page);
  const product = data.product;
  await products.open();
  await products.search(product.name);
  await products.expectMatches(product.name);
  const card = products.cards.filter({ has: page.locator('.productinfo p', { hasText: new RegExp(`^${product.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }) });
  await expect(card).toHaveCount(1);
  await card.getByRole('link', { name: 'View Product' }).click();
  await expect(page).toHaveURL(new RegExp(`/product_details/${product.id}$`));
  const details = page.locator('.product-information');
  await expect(details.getByRole('heading', { name: product.name, exact: true })).toBeVisible();
  await expect(details.locator('span > span')).toHaveText(product.price);
  await expect(details.locator('p').filter({ hasText: 'Availability:' })).toHaveText(`Availability: ${product.availability}`);
  await expect(page.locator('#quantity')).toHaveValue('1');
  await page.locator('#quantity').fill(String(product.quantity));
  await expect(page.locator('#quantity')).toHaveValue(String(product.quantity));
  await details.getByRole('button', { name: 'Add to cart' }).click();
  const modal = page.locator('#cartModal');
  await expect(modal).toBeVisible();
  await expect(modal.getByText('Your product has been added to cart.')).toBeVisible();
  await modal.getByRole('link', { name: 'View Cart' }).click();
  const row = page.locator(`#product-${product.id}`);
  await expect(row.locator('.cart_description h4')).toHaveText(product.name);
  await expect(row.locator('.cart_price')).toHaveText(product.price);
  await expect(row.locator('.cart_quantity')).toHaveText(String(product.quantity));
  await expect(row.locator('.cart_total_price')).toHaveText(`Rs. ${product.unitPrice * product.quantity}`);
  await row.locator('.cart_quantity_delete').click();
  await expect(row).toHaveCount(0);
  await expect(page.getByText('Cart is empty!', { exact: false })).toBeVisible();
});

test('SEARCH-02 shows no product cards for a unique unmatched query and can recover', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.open();
  await products.search(`no-product-${randomUUID()}`);
  await expect(products.cards).toHaveCount(0);
  await products.search(data.product.name);
  await products.expectMatches(data.product.name);
});

for (const [variant, term] of [['partial', data.product.partialTerm], ['uppercase', data.product.name.toUpperCase()]]) {
  test(`SEARCH-03-${variant} returns only relevant products`, async ({ page }) => {
    const products = new ProductsPage(page);
    await products.open();
    await products.search(term);
    await products.expectMatches(term);
    await expect(products.cards.locator('.productinfo p').filter({ hasText: data.product.name })).toBeVisible();
  });
}

test('SEARCH-04 an empty query preserves the complete product catalogue', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.open();
  const initialNames = await products.cards.locator('.productinfo p').allTextContents();
  await products.search('');
  expect(await products.cards.locator('.productinfo p').allTextContents()).toEqual(initialNames);
});
