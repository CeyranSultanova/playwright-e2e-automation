import { test, expect } from '../support/fixtures';
import { settings } from '../support/settings';

const adOrigin = `https://${settings.adDomains[0]}`;
const adOverlayUrl = `${adOrigin}/test-overlay`;
const adPopupUrl = `${adOrigin}/test-popup`;
const applicationUrl = new URL('/test-popup', settings.baseURL).href;

// Serve the ad locally so these checks do not depend on live ad delivery.
test('ADS-01 closes the ad and keeps the cart confirmation open', async ({ page }) => {
  await page.route(adOverlayUrl, route => route.fulfill({
    contentType: 'text/html',
    body: '<button id="dismiss-button" onclick="parent.postMessage(\'ad-dismissed\', \'*\')">Close ad</button>',
  }));
  await page.setContent(`
    <div id="cartModal"><h2>Added to cart</h2><button>Continue Shopping</button></div>
    <button id="next" onclick="this.textContent='Done'">Next</button>
    <iframe title="Advertisement" src="${adOverlayUrl}"
      style="position:fixed;inset:0;width:100%;height:100%;background:white"></iframe>
    <script>addEventListener('message', event => {
      if (event.origin === '${adOrigin}' && event.data === 'ad-dismissed')
        document.querySelector('iframe').remove();
    });</script>
  `);
  await page.locator('#next').click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('#next')).toHaveText('Done');
  await expect(page.locator('#cartModal')).toBeVisible();
});

test('ADS-02 closes ad tabs and keeps application tabs open', async ({ page, context }) => {
  await context.route(adPopupUrl, route => route.fulfill({ body: 'Advertisement' }));
  await context.route(applicationUrl, route => route.fulfill({ body: 'Application tab' }));
  await page.setContent(`<a href="${adPopupUrl}" target="_blank">Ad</a><a href="${applicationUrl}" target="_blank">Application</a>`);
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
