import type { Frame, Page } from '@playwright/test';

const adDomains = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'adservice.google.com',
  'googletagservices.com',
];

export function isAdUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return adDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function isAdFrame(frame: Frame): boolean {
  for (let current: Frame | null = frame; current; current = current.parentFrame()) {
    if (isAdUrl(current.url())) return true;
  }
  return false;
}

export async function handleAdOverlays(page: Page) {
  // Check before actions: ads can appear after navigation or a previous click.
  await page.addLocatorHandler(page.locator('body'), async () => {
    for (const frame of page.frames()) {
      if (frame === page.mainFrame() || !isAdFrame(frame)) continue;
      const close = frame.locator('#dismiss-button, [aria-label="Close ad"], [aria-label="Close Ad"]')
        .or(frame.getByRole('button', { name: /^(close|close ad|dismiss)$/i }));
      for (const button of await close.all()) {
        if (await button.isVisible()) {
          await button.click({ timeout: 3_000 });
          return;
        }
      }
    }
  }, { noWaitAfter: true });
}

export function handleAdPopup(popup: Page) {
  // A popup can start at about:blank before navigating to its destination.
  const closeIfAd = async () => {
    if (!popup.isClosed() && isAdUrl(popup.url())) await popup.close();
  };
  popup.on('framenavigated', frame => {
    if (frame === popup.mainFrame()) void closeIfAd();
  });
  return closeIfAd();
}
