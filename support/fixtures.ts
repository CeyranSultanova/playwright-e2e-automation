import { test as base, expect } from '@playwright/test';
import { newAccount, deleteAccount, verifyAccount, type Account } from './accounts';
import { isAdUrl, handleAdOverlays, handleAdPopup } from './ads';
import { settings } from './settings';
import { SignupPage } from '../pages/signup-page';
import { ProductsPage } from '../pages/products-page';
import { ProductPage } from '../pages/product-page';
import { CartPage } from '../pages/cart-page';

type Fixtures = {
  account: Account & { markCreated(): void };
  signup: SignupPage;
  products: ProductsPage;
  product: ProductPage;
  cart: CartPage;
  adIsolation: void;
};

export const test = base.extend<Fixtures>({
  signup: async ({ page }, use) => { await use(new SignupPage(page)); },
  products: async ({ page }, use) => { await use(new ProductsPage(page)); },
  product: async ({ page }, use) => { await use(new ProductPage(page)); },
  cart: async ({ page }, use) => { await use(new CartPage(page)); },
  page: async ({ page }, use, testInfo) => {
    const navigation: { path: string; status: number; responseStartMs: number }[] = [];
    page.on('response', response => {
      const request = response.request();
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
        navigation.push({
          path: new URL(response.url()).pathname,
          status: response.status(),
          responseStartMs: request.timing().responseStart,
        });
      }
    });
    await handleAdOverlays(page);
    page.on('popup', handleAdPopup);
    try {
      await use(page);
    } finally {
      await testInfo.attach('navigation-timing', {
        body: JSON.stringify(navigation, null, 2),
        contentType: 'application/json',
      });
    }
  },
  account: [async ({ request }, use, testInfo) => {
    let created = false;
    const account = newAccount() as Account & { markCreated(): void };
    Object.defineProperty(account, 'markCreated', {
      value: () => { created = true; },
      enumerable: false,
    });
    try {
      await use(account);
    } finally {
      if (!created) return;
      // Creation can succeed before a test fails, so always attempt cleanup.
      const deleted = await deleteAccount(request, account);
      if (![200, 404].includes(deleted.responseCode)) {
        throw new Error(`Cleanup failed for ${account.email}: ${deleted.message}`);
      }
      const verified = await verifyAccount(request, account);
      if (verified.responseCode !== 404) {
        throw new Error(`Cleanup could not confirm account absence: ${account.email}`);
      }
      // Reporting must not prevent account deletion.
      await testInfo.attach('account-email', { body: account.email, contentType: 'text/plain' });
    }
  }, { timeout: settings.cleanupTimeout }],
  adIsolation: [async ({ context }, use) => {
    if (settings.blockAds) {
      await context.route('**/*', route => isAdUrl(route.request().url()) ? route.abort() : route.continue());
    }
    context.on('page', page => page.on('dialog', async dialog => {
      const message = dialog.message();
      await dialog.dismiss();
      throw new Error(`Unexpected ${dialog.type()} dialog: ${message}`);
    }));
    await use();
  }, { auto: true }],
});
export { expect };
