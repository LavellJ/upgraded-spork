import { test, expect } from "@playwright/test";
import { installApiMocks } from "./mocks/api";
import { setUiPrefs, devLogin } from "./helpers/dev";
import { forceRevealBodyIfCI } from "./helpers/ci";

const BASE_URL = process.env.CI_BASE_URL ?? "http://127.0.0.1:4173";

test("@ci island: renders scene & per-lap chips (no locks)", async ({
  page,
}) => {
  if (process.env.SKIP_E2E_LOCAL) test.skip(true, "Skipping locally");

  await installApiMocks(page);
  await setUiPrefs(page, { density: "compact" });
  await devLogin(page);

  // Reset any previous v2 progress
  await page.addInitScript(() => localStorage.removeItem("island-progress-v2"));

  await page.goto(`${BASE_URL}/island`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await forceRevealBodyIfCI(page);

  await expect(page.getByTestId("island-heading")).toBeVisible();
  await expect(page.getByTestId("scout-bubble")).toBeVisible();
  await expect(page.getByTestId("journal-btn")).toBeVisible();
  await expect(page.getByTestId("backpack-btn")).toBeVisible();
  await expect(page.getByTestId("lap-badge")).toContainText("Lap");

  // All four biomes + chips
  for (const id of ["forest", "tropics", "desert", "coast"]) {
    await expect(page.getByTestId(`biome-${id}`)).toBeVisible();
    await expect(page.getByTestId(`progress-${id}`)).toBeVisible();
  }
});
