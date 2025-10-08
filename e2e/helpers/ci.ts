import type { Page } from '@playwright/test';

/** In CI some apps hide <body> until a client signal; this makes tests deterministic. */
export async function forceRevealBodyIfCI(page: Page) {
  if (process.env.CI) {
    await page.addStyleTag({
      content: 'body{visibility:visible!important;opacity:1!important}'
    });
  }
}