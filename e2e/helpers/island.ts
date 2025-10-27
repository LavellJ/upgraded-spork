import { Page } from "@playwright/test";

/** Enables E2E-only UI controls on biome pages. */
export async function enableE2EControls(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("E2E_CONTROLS", "1");
    } catch {}
  });
}

/** Disables E2E controls (use if a test needs to revert). */
export async function disableE2EControls(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("E2E_CONTROLS");
    } catch {}
  });
}
