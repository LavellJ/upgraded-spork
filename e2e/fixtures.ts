import { test as base, expect as baseExpect, Page } from '@playwright/test';

function ensureShim(url: string | URL, origin = 'http://127.0.0.1:4173'): string {
  // Normalize relative paths and full URLs onto our origin, then ensure shim=1
  const u = new URL(typeof url === 'string' ? url : url.toString(), origin);
  if (!u.searchParams.has('shim')) u.searchParams.set('shim', '1');
  return u.toString();
}

export const test = base.extend({
  page: async ({ page }, use) => {
    // Make the app visible even if CSS tries to fade until boot
    await page.addInitScript(() => {
      try { document.documentElement.setAttribute('lang', document.documentElement.getAttribute('lang') || 'en-AU'); } catch {}
      try { document.body && (document.body.style.opacity = '1'); } catch {}
    });

    // Monkey-patch goto so tests don't need to remember ?shim=1
    const originalGoto = page.goto.bind(page);
    (page as Page).goto = (async (url: string | URL, options?: Parameters<Page['goto']>[1]) => {
      return originalGoto(ensureShim(url), options);
    }) as Page['goto'];

    await use(page);
  },
});

export const expect = baseExpect;
