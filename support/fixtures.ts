import { test as base, expect } from '@playwright/test';
import { newAccount, deleteAccount, type Account } from './accounts';
import { isAdUrl, handleAdOverlays, handleAdPopup } from './ads';

export const test = base.extend<{ account: Account; adIsolation: void }>({
  page: async ({ page }, use) => {
    await handleAdOverlays(page);
    page.on('popup', handleAdPopup);
    await use(page);
  },
  account: async ({ request }, use) => {
    const account = newAccount();
    try { await use(account); }
    finally { await deleteAccount(request, account); }
  },
  adIsolation: [async ({ context }, use) => {
    if (process.env.BLOCK_ADS !== 'false') {
      await context.route('**/*', async route => {
        if (isAdUrl(route.request().url())) await route.abort();
        else await route.continue();
      });
    }
    // Unexpected JS dialogs fail the test; they are not silently accepted.
    context.on('page', page => page.on('dialog', async dialog => {
      const message = dialog.message();
      await dialog.dismiss();
      throw new Error(`Unexpected ${dialog.type()} dialog: ${message}`);
    }));
    await use();
  }, { auto: true }],
});
export { expect };
