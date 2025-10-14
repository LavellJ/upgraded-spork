import { test, expect } from "@playwright/test";
import { installApiMocks } from "./mocks/api";
import { setUiPrefs, devLogin } from "./helpers/dev";
import { forceRevealBodyIfCI } from "./helpers/ci";

const BASE_URL = process.env.CI_BASE_URL ?? "http://127.0.0.1:4173";

test("@ci smoke: lesson launcher -> activity stub", async ({ page }) => {
  if (process.env.SKIP_E2E_LOCAL) test.skip(true, "Skipping locally");
  await installApiMocks(page);
  await setUiPrefs(page, { density: "compact" });
  await devLogin(page);

  await page.goto(`${BASE_URL}/lesson`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await forceRevealBodyIfCI(page);

  await expect(page.getByTestId("lesson-launcher-heading")).toBeVisible();
  await expect(page.getByTestId("lesson-title")).toContainText("Patterns");

  await page.getByTestId("start-lesson").click();
  await page.waitForURL(/\/activity\/act-001/);
  await expect(page.getByTestId("activity-heading")).toContainText(
    "Patterns Intro",
  );
  await expect(page.getByTestId("complete-step")).toBeVisible();
});
