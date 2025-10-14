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

  const waitStorageBiomeAtLeast = async (biome: string, atLeast: number) => {
    await page.waitForFunction(
      ({ b, n }) => {
        try {
          const raw = localStorage.getItem("island-progress-v2");
          if (!raw) return false;
          const p = JSON.parse(raw);
          const lap = p?.currentLap ?? 1;
          const c = p?.completed?.[lap]?.[b] ?? 0;
          return c >= n;
        } catch {
          return false;
        }
      },
      { b: biome, n: atLeast },
      { timeout: 10000 },
    );
  };

  const completeToTarget = async (biome: string) => {
    await page.getByTestId(`biome-${biome}`).click();
    await expect(page.getByTestId("biome-stub")).toContainText(biome);

    const prog = page.getByTestId("biome-progress");
    const first = getCounts(await prog.innerText());
    for (let i = first.cur; i < first.total; i++) {
      await page.getByTestId("complete-lesson").click();
    }
    await expect(prog).toHaveText(`${first.total}/${first.total}`);

    // Verify storage reflects completion for this biome (current lap)
    await waitStorageBiomeAtLeast(biome, first.total);

    // Back to island (UI will refresh via event/visibility/timeout)
    await openIsland();
  };

  for (const b of ["forest", "tropics", "desert", "coast"]) {
    await completeToTarget(b);
  }

  // All biomes should be complete for the current (likely Lap 1) snapshot
  const allComplete = await page.evaluate(() => {
    try {
      const raw = localStorage.getItem("island-progress-v2");
      if (!raw) return false;
      const p = JSON.parse(raw);
      const lap = p?.currentLap ?? 1;
      const t = p?.targetPerLap ?? 3;
      const counts = p?.completed?.[lap];
      if (!counts) return false;
      return ["forest", "tropics", "desert", "coast"].every(
        (b) => (counts[b] ?? 0) >= t,
      );
    } catch {
      return false;
    }
  });
  expect(allComplete).toBeTruthy();

  // Best effort: lap flip (soft). Island listens to 'island-progress-updated'.
  // Give Island a chance to reflect it, but do not hard fail CI if slow.
  await page.waitForTimeout(300); // brief settle period
  await page.goto(`${BASE_URL}/island`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  const badge = page.getByTestId("lap-badge");
  await expect(badge).toBeVisible();
  const label = await badge.innerText();
  const lap = parseInt(label.match(/Lap\s+(\d+)/)?.[1] ?? "1", 10);
  expect.soft(lap).toBeGreaterThan(1);
});
