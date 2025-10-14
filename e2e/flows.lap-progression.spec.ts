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

  // Helper to open /island and ensure CI body visibility
  const openIsland = async () => {
    await page.goto(`${BASE_URL}/island`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await forceRevealBodyIfCI(page);
  };

  await openIsland();
  await expect(page.getByTestId("lap-badge")).toContainText("Lap 1");

  // Complete N lessons for a biome, then return to island
  const complete = async (biome: string, times: number) => {
    await page.getByTestId(`biome-${biome}`).click();
    await expect(page.getByTestId("biome-stub")).toContainText(biome);
    for (let i = 0; i < times; i++) {
      await page.getByTestId("complete-lesson").click();
    }
    await openIsland();
  };

  // Lap 1 targets are 3 per biome
  await complete("forest", 3);
  await complete("tropics", 3);
  await complete("desert", 3);
  await complete("coast", 3);

  // Wait for persisted state to show Lap 2,
  // then reload /island and assert the badge
  await page.waitForFunction(
    () => {
      try {
        const raw = localStorage.getItem("island-progress-v2");
        if (!raw) return false;
        const p = JSON.parse(raw);
        return p?.currentLap === 2;
      } catch {
        return false;
      }
    },
    { timeout: 5000 },
  );

  await openIsland();
  await expect(page.getByTestId("lap-badge")).toContainText("Lap 2");
});
