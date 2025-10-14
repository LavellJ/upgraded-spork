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

  // Clean slate
  await page.addInitScript(() => localStorage.removeItem("island-progress-v2"));

  const openIsland = async () => {
    await page.goto(`${BASE_URL}/island`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await forceRevealBodyIfCI(page);
  };

  await openIsland();
  await expect(page.getByTestId("lap-badge")).toContainText(/Lap\s+1/);

  const getCounts = (s: string) => {
    const m = s.match(/(\d+)\s*\/\s*(\d+)/);
    return {
      cur: m ? parseInt(m[1], 10) : 0,
      total: m ? parseInt(m[2], 10) : 3,
    };
  };

  const completeToTarget = async (biome: string) => {
    // Navigate into biome
    await page.getByTestId(`biome-${biome}`).click();
    await expect(page.getByTestId("biome-stub")).toContainText(biome);

    // Read current/total from the biome page
    const prog = page.getByTestId("biome-progress");
    const first = getCounts(await prog.innerText());
    for (let i = first.cur; i < first.total; i++) {
      await page.getByTestId("complete-lesson").click();
    }
    // Ensure biome page reached total/total
    await expect(prog).toHaveText(`${first.total}/${first.total}`);

    // Return to island and verify chip shows total/total
    await openIsland();
    await expect(page.getByTestId(`progress-${biome}`)).toHaveText(
      `${first.total}/${first.total}`,
      { timeout: 10000 },
    );
  };

  for (const b of ["forest", "tropics", "desert", "coast"]) {
    await completeToTarget(b);
  }

  // Island re-reads store and coerces lap if complete
  await openIsland();

  // Accept Lap > 1
  const badge = page.getByTestId("lap-badge");
  await expect(badge).toBeVisible();
  const label = await badge.innerText();
  const lap = parseInt(label.match(/Lap\s+(\d+)/)?.[1] ?? "1", 10);
  expect(lap).toBeGreaterThan(1);
});
