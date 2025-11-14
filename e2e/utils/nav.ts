import type { Page } from '@playwright/test';

export async function gotoShim(page: Page, url: string | URL) {
  const u = new URL(typeof url === 'string' ? url : url.toString(), 'http://127.0.0.1:4173');
  if (!u.searchParams.has('shim')) u.searchParams.set('shim', '1');
  await page.goto(u.toString());
}
