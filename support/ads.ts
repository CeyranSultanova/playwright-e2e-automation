import type { Frame, Page } from '@playwright/test';
import { settings } from './settings';

export function isAdUrl(url: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return false;
  }
  return settings.adDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
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
    for (const frame of page.frames().filter(isAdFrame)) {
      const close = frame.locator('#dismiss-button, [aria-label="Close ad"], [aria-label="Close Ad"]')
        .or(frame.getByRole('button', { name: /^(close|close ad|dismiss)$/i }));
      const visibleClose = close.filter({ visible: true }).first();
      if (await visibleClose.isVisible()) {
        await visibleClose.click();
        return;
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
    if (frame === popup.mainFrame()) {
      void closeIfAd().catch(() => undefined);
    }
  });
  return closeIfAd().catch(() => undefined);
}
