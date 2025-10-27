import type { Page } from "@playwright/test";

/** CI-only body reveal to avoid timing flakes from hidden <body> during boot. */
export async function forceRevealBodyIfCI(page: Page) {
  if (process.env.CI) {
    await page.addStyleTag({
      content: "body{visibility:visible!important;opacity:1!important}",
    });
  }
}
