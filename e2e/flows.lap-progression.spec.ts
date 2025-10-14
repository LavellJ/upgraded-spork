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

  // UI-driven completion: read chip text, complete until target reached
  const completeUntilDone = async (biome: string) => {
    // Read chip text on island page (e.g., "0/3" or "2/3")
    const chipText = await page.getByTestId(`progress-${biome}`).textContent();
    const match = chipText?.match(/(\d+)\/(\d+)/);
    if (!match) throw new Error(`Invalid chip text for ${biome}: ${chipText}`);

    const [, current, target] = match;
    const remaining = parseInt(target) - parseInt(current);

    if (remaining > 0) {
      await page.getByTestId(`biome-${biome}`).click();
      await expect(page.getByTestId("biome-stub")).toContainText(biome);

      for (let i = 0; i < remaining; i++) {
        await page.getByTestId("complete-lesson").click();
      }

      await openIsland();

      // Verify chip now shows target/target
      await expect(page.getByTestId(`progress-${biome}`)).toContainText(
        `${target}/${target}`,
      );
    }
  };

  // Complete all four biomes to their targets
  await completeUntilDone("forest");
  await completeUntilDone("tropics");
  await completeUntilDone("desert");
  await completeUntilDone("coast");

  // After finishing all biomes, lap should advance (> 1)
  await openIsland();
  const lapText = await page.getByTestId("lap-badge").textContent();
  const lapMatch = lapText?.match(/Lap (\d+)/);
  if (!lapMatch) throw new Error(`Invalid lap badge: ${lapText}`);

  const lapNum = parseInt(lapMatch[1]);
  expect(lapNum).toBeGreaterThan(1);
});
