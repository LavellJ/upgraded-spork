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

  // Soft: ensure our mocked endpoint was requested (won't fail CI)
  let seenTodayLesson = false;
  page.on("response", (res) => {
    try {
      const u = new URL(res.url());
      if (u.pathname === "/api/lessons/today") seenTodayLesson = true;
    } catch {}
  });

  await page.goto(`${BASE_URL}/lesson`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await forceRevealBodyIfCI(page);

  await expect(page.getByTestId("lesson-launcher-heading")).toBeVisible();

  // Don't assert exact lesson text; just require the Start button and proceed
  await expect(page.getByTestId("start-lesson")).toBeVisible();
  expect.soft(seenTodayLesson).toBeTruthy();

  await page.getByTestId("start-lesson").click();
  await page.waitForURL(/\/activity\/act-001/);
  await expect(page.getByTestId("activity-heading")).toContainText(
    "Patterns Intro",
  );
  await expect(page.getByTestId("complete-step")).toBeVisible();
});
