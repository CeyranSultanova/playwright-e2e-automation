import { test, expect } from '../support/fixtures';

// Controlled ad responses exercise dismissal even when the live ad service serves nothing.
test('ADS-01 closes an ad overlay without closing the cart confirmation', async ({ page }) => {
  await page.route('https://googleads.g.doubleclick.net/test-overlay', route => route.fulfill({
    contentType: 'text/html',
    body: '<button id="dismiss-button" onclick="parent.postMessage(\'ad-dismissed\', \'*\')">Close ad</button>',
  }));
  await page.setContent(`
    <div id="cartModal"><h2>Added to cart</h2><button>Continue Shopping</button></div>
    <button id="next" onclick="this.textContent='Done'">Next</button>
    <iframe title="Advertisement" src="https://googleads.g.doubleclick.net/test-overlay"
      style="position:fixed;inset:0;width:100%;height:100%;background:white"></iframe>
    <script>addEventListener('message', event => {
      if (event.origin === 'https://googleads.g.doubleclick.net' && event.data === 'ad-dismissed')
        document.querySelector('iframe').remove();
    });</script>
  `);
  await page.locator('#next').click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('#next')).toHaveText('Done');
  await expect(page.locator('#cartModal')).toBeVisible();
});

test('ADS-02 closes ad tabs and preserves application tabs', async ({ page, context }) => {
  await context.route('https://googleads.g.doubleclick.net/test-popup', route => route.fulfill({ body: 'Advertisement' }));
  await context.route('https://automationexercise.com/test-popup', route => route.fulfill({ body: 'Application tab' }));
  await page.setContent('<a href="https://googleads.g.doubleclick.net/test-popup" target="_blank">Ad</a><a href="https://automationexercise.com/test-popup" target="_blank">Application</a>');
  const adOpened = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Ad', exact: true }).click();
  const ad = await adOpened;
  await expect.poll(() => ad.isClosed()).toBe(true);
  const applicationOpened = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Application', exact: true }).click();
  const application = await applicationOpened;
  await expect(application.locator('body')).toHaveText('Application tab');
  expect(application.isClosed()).toBe(false);
});
