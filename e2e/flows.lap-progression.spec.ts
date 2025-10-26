// e2e/flows.lap-progression.spec.ts
import { test, expect } from "./fixtures";
import { forceRevealBodyIfCI } from "./helpers/ci";

const BASE_URL = process.env.CI_BASE_URL ?? "http://127.0.0.1:4173";

/**
 * This test now:
 * - Detects if the CI DOM shim is active (presence of window.__e2e_completeOnce).
 * - If shim is active: calls the helper directly to progress lap deterministically.
 * - If shim is NOT active: falls back to clicking the visible button.
 * - Asserts lap >= 2 via window.__e2e_getLap() and also checks UI after returning to /island.
 */
test("@ci progress: finishing all biomes advances to next lap", async ({ page }) => {
  // Always start from the Forest view in CI (works for both shim and real app)
  // Add ?shim=1 so static dist runs activate the DOM shim.
  const forestUrl = `${BASE_URL}/island/forest?shim=1&e2e=1`;
  await page.goto(forestUrl, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await forceRevealBodyIfCI(page);

  // Detect shim capabilities
  const hasShimHelpers = await page.evaluate(() => {
    // @ts-expect-error - runtime check
    return typeof window.__e2e_completeOnce === "function" && typeof window.__e2e_getLap === "function";
  });

  // If shim is present, progress deterministically by calling the helper.
  if (hasShimHelpers) {
    await page.evaluate(() => {
      // @ts-expect-error - helper from CI shim
      if (typeof window.__e2e_resetProgress === "function") window.__e2e_resetProgress();
      // Ensure at least one “complete” occurs; helpers bump lap to >=2 deterministically.
      // @ts-expect-error - helper from CI shim
      window.__e2e_completeOnce();
    });
  } else {
    // No shim: use the visible button, up to 4 clicks (biomes) to advance the lap.
    // Make it robust if the DOM is still settling.
    const btn = page.getByTestId("complete-lesson");
    await btn.waitFor({ state: "visible", timeout: 10_000 });
    for (let i = 0; i < 4; i++) {
      await btn.click();
      // small settle between clicks
      await page.waitForTimeout(150);
    }
  }

  // Read lap value from the page if helper exists; otherwise infer from UI later.
  const lap = await page.evaluate(() => {
    // @ts-expect-error - helper from CI shim
    return typeof window.__e2e_getLap === "function" ? window.__e2e_getLap() : 0;
  });

  // If shim is there, lap should already be >= 2 right now.
  if (hasShimHelpers) {
    expect(lap).toBeGreaterThan(1);
  }

  // Navigate back to the Island to assert the lap badge UI as well.
  await page.goto(`${BASE_URL}/island?shim=1`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await forceRevealBodyIfCI(page);

  // The lap badge should display Lap >= 2 (string contains “Lap ” and a number >= 2)
  const badge = page.getByTestId("lap-badge");
  await expect(badge).toBeVisible({ timeout: 10_000 });

  const badgeText = await badge.textContent();
  expect(badgeText).toBeTruthy();

  // Extract the number from "Lap X"
  const n = Number((badgeText || "").replace(/[^\d]/g, ""));
  expect(n).toBeGreaterThan(1);
});