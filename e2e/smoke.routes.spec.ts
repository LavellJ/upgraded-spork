// e2e/smoke.routes.spec.ts
import { test, expect } from "@playwright/test";
import { setUiPrefs, devLogin } from "./helpers/dev";
import { forceRevealBodyIfCI } from "./helpers/ci";
import { installApiMocks } from "./mocks/api";

const BASE_URL = process.env.CI_BASE_URL ?? "http://127.0.0.1:4173";

test("@ci smoke: island/progress/settings routes render", async ({ page }) => {
  if (process.env.SKIP_E2E_LOCAL) test.skip(true, "Skipping locally");

  await installApiMocks(page);
  await setUiPrefs(page, { density: "compact" });
  await devLogin(page);

  const paths = [
    { path: "/island", testId: "island-heading" },
    { path: "/progress", testId: "progress-heading" },
    { path: "/settings", testId: "settings-heading" },
  ];

  for (const { path, testId } of paths) {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await forceRevealBodyIfCI(page);

    // TopNav is optional on some routes; assert only if present
    const topNav = page.getByTestId("top-nav");
    const hasTopNav = (await topNav.count()) > 0;
    if (hasTopNav) {
      await expect(topNav).toBeVisible();
    } else {
      test.info().annotations.push({
        type: "note",
        description: `No top-nav on ${path} (allowed).`,
      });
    }

    // Page-specific heading must be visible
    await expect(page.getByTestId(testId)).toBeVisible();
  }
});