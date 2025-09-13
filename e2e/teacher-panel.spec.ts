import { test, expect } from "@playwright/test";

// Allow running against public URL or local Unified Server
const BASE =
  process.env.BASE_URL ||
  (process.env.PORT ? `http://localhost:${process.env.PORT}` : "http://localhost:5000");

// Helper: nuke localStorage flags so the page starts clean
async function clearFlags(page) {
  await page.addInitScript(() => {
    try { localStorage.removeItem('flags'); } catch {}
    try { localStorage.removeItem('featureFlags'); } catch {}
    try { localStorage.removeItem('qi.auth.v1'); } catch {}
  });
}

test.describe("Teacher Panel routing (unauth)", () => {
  test("visiting /teacher/referrals shows 'Sign in required'", async ({ page }) => {
    await clearFlags(page);
    await page.goto(`${BASE}/teacher/referrals`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/sign in required/i)).toBeVisible();
  });

  test("clicking Debug tab goes to /teacher/debug", async ({ page }) => {
    await clearFlags(page);
    await page.goto(`${BASE}/teacher/referrals`, { waitUntil: "domcontentloaded" });

    // Prefer a stable test-id if available; fallback to href selector
    const debugLink = page.locator('[data-testid="nav-debug-main"], a[href="/teacher/debug"]');
    await expect(debugLink).toBeVisible();
    await debugLink.first().click();

    await page.waitForURL(/\/teacher\/debug$/);
    await expect(page.getByText(/(debug|dev)/i)).toBeVisible();
  });
});