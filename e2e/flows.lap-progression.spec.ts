import { test, expect } from "@playwright/test";
import { setUiPrefs, devLogin } from "./helpers/dev";
import { forceRevealBodyIfCI } from "./helpers/ci";
import { installApiMocks } from "./mocks/api";

const BASE_URL = process.env.CI_BASE_URL ?? "http://127.0.0.1:4173";
const target = 3;
const biomes = ["forest", "tropics", "desert", "coast"] as const;

test("@ci progress: finishing all biomes advances to next lap", async ({
  page,
}) => {
  if (process.env.SKIP_E2E_LOCAL) test.skip(true, "Skipping locally");

  await installApiMocks(page);
  await setUiPrefs(page, { density: "compact" });
  await devLogin(page);

  // Fresh state
  await page.goto(`${BASE_URL}/island`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => localStorage.removeItem("island-progress-v2"));
  await forceRevealBodyIfCI(page);

  // Complete target lessons in each biome via E2E control
  for (const biome of biomes) {
    await page.goto(`${BASE_URL}/island/${biome}?e2e=1`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle");
    for (let i = 0; i < target; i++) {
      await page.getByTestId("complete-lesson").click();
    }
  }

  // Assert lap advanced in storage (deterministic)
  const lap = await page.evaluate(() => {
    try {
      const raw = localStorage.getItem("island-progress-v2");
      if (!raw) return 1;
      const p = JSON.parse(raw);
      return Number(p?.currentLap ?? 1);
    } catch {
      return 1;
    }
  });
  expect(lap).toBeGreaterThan(1);

  // UI sanity (soft): badge shows Lap >= 2
  await page.goto(`${BASE_URL}/island`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await forceRevealBodyIfCI(page);
  const badge = page.getByTestId("lap-badge");
  await expect(badge).toBeVisible();
  const label = await badge.innerText();
  expect.soft(label).toMatch(/Lap\s+[2-9]/);
});
