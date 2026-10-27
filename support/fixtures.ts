import { test as base, expect } from '@playwright/test';
import { newAccount, deleteAccount, type Account } from './accounts';

export const test = base.extend<{ account: Account; adIsolation: void }>({
  account: async ({ request }, use) => {
    const account = newAccount();
    try { await use(account); }
    finally { await deleteAccount(request, account); }
  },
  adIsolation: [async ({ context }, use) => {
    const adHosts = ['doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'adservice.google.com', 'googletagservices.com'];
    if (process.env.BLOCK_ADS !== 'false') {
      await context.route('**/*', async route => {
        const host = new URL(route.request().url()).hostname;
        if (adHosts.some(domain => host === domain || host.endsWith(`.${domain}`))) await route.abort();
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
