import { test, expect } from "@playwright/test";
import { installApiMocks } from "./mocks/api";
import { setUiPrefs, devLogin } from "./helpers/dev";
import { forceRevealBodyIfCI } from "./helpers/ci";

const BASE_URL = process.env.CI_BASE_URL ?? "http://127.0.0.1:4173";

test("@ci progress: finishing all biomes advances to next lap", async ({
  page,
}) => {
  if (process.env.SKIP_E2E_LOCAL) test.skip(true, "Skipping locally");

  await installApiMocks(page);
  await setUiPrefs(page, { density: "compact" });
  await devLogin(page);

  // Clean slate for the v2 store
  await page.addInitScript(() => localStorage.removeItem("island-progress-v2"));

  // Lap 1 targets are 3 per biome
  await page.goto(`${BASE_URL}/island`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await forceRevealBodyIfCI(page);
  await expect(page.getByTestId("lap-badge")).toContainText("Lap 1");

  const complete = async (biome: string, times: number) => {
    await page.getByTestId(`biome-${biome}`).click();
    for (let i = 0; i < times; i++) {
      await page.getByTestId("complete-lesson").click();
    }
    await page.goto(`${BASE_URL}/island`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await forceRevealBodyIfCI(page);
  };

  // Bring each biome to its target (3)
  await complete("forest", 3); // going beyond clamps to target
  await complete("tropics", 3);
  await complete("desert", 3);
  await complete("coast", 3);

  // After all biomes reach target for Lap 1, lap should advance
  await expect(page.getByTestId("lap-badge")).toContainText("Lap 2");
});
