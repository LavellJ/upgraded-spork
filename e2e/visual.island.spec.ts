import { test, expect } from "@playwright/test";
import { installApiMocks } from "./mocks/api";
import { setUiPrefs, devLogin } from "./helpers/dev";
import { forceRevealBodyIfCI } from "./helpers/ci";

const BASE_URL = process.env.CI_BASE_URL ?? "http://127.0.0.1:4173";

test("@ci island: renders scene & locks with mocked progress", async ({
  page,
}) => {
  if (process.env.SKIP_E2E_LOCAL) test.skip(true, "Skipping locally");

  await installApiMocks(page);
  await setUiPrefs(page, { density: "compact" });
  await devLogin(page);

  await page.goto(`${BASE_URL}/island`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await forceRevealBodyIfCI(page);

  // Core elements
  await expect(page.getByTestId("island-heading")).toBeVisible();
  await expect(page.getByTestId("scout-bubble")).toBeVisible();
  await expect(page.getByTestId("journal-btn")).toBeVisible();
  await expect(page.getByTestId("backpack-btn")).toBeVisible();

  // Biomes
  await expect(page.getByTestId("biome-forest")).toBeVisible();
  await expect(page.getByTestId("biome-tropics")).toBeVisible();
  await expect(page.getByTestId("biome-desert")).toBeVisible();
  await expect(page.getByTestId("biome-coast")).toBeVisible();

  // Progress & locks (from fixture)
  await expect(page.getByTestId("progress-forest")).toHaveText("1/3");
  await expect(page.getByTestId("progress-tropics")).toHaveText("3/3");
  await expect(page.getByTestId("lock-desert")).toBeVisible();
  await expect(page.getByTestId("lock-coast")).toBeVisible();

  // Click-through stub
  await page.getByTestId("biome-forest").click();
  await expect(page.getByTestId("biome-stub")).toContainText("forest");
});
