import { test, expect } from './fixtures';
import { forceRevealBodyIfCI } from "./helpers/ci";

const BASE_URL = process.env.CI_BASE_URL ?? "http://127.0.0.1:4173";

test("@ci smoke: teacher route serves", async ({ page }) => {
  if (process.env.SKIP_E2E_LOCAL) test.skip(true, "Skipping locally");
  await page.goto(`${BASE_URL}/teacher`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await forceRevealBodyIfCI(page);
  await expect(page.locator("body")).toBeVisible();
  // If a stable marker exists on /teacher, we could assert it here later.
});
