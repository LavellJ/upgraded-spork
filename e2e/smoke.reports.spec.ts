import { test, expect } from "@playwright/test";
import { forceRevealBodyIfCI } from "./helpers/ci";
import { installApiMocks } from "./mocks/api";

const BASE_URL = process.env.CI_BASE_URL ?? "http://127.0.0.1:4173";

// Allows overriding the path later if needed
const REPORTS_PATHS = [
  process.env.CI_REPORTS_PATH || "/teacher/reports",
  "/reports",
];

test("@ci smoke: reports route serves and trends request made", async ({
  page,
}) => {
  if (process.env.SKIP_E2E_LOCAL) test.skip(true, "Skipping locally");

  await installApiMocks(page);

  let trendsSeen = false;
  const stop = page.on("response", (res) => {
    const url = res.url();
    if (/reports.*trends/i.test(url) && res.status() === 200) {
      trendsSeen = true;
    }
  });

  for (const path of REPORTS_PATHS) {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await forceRevealBodyIfCI(page);

    // Give the app a moment to fetch, then bail early if we saw it
    await page.waitForTimeout(200);
    if (trendsSeen) break;
  }

  // Sanity: page rendered and body is visible
  await expect(page.locator("body")).toBeVisible();

  // Assert that our mocked trends endpoint was actually requested
  expect(trendsSeen).toBeTruthy();

  // clean listener
  page.off("response", stop as any);
});
