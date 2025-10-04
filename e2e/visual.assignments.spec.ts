import { test, expect } from "@playwright/test";
import { setUiPrefs, devLogin } from "./helpers/dev";
import { installApiMocks } from "./mocks/api";

test("Assignments — table @ci", async ({ page }) => {
  // Install API mocks before navigation
  await installApiMocks(page);

  // Set UI preferences
  await setUiPrefs(page, { theme: "light", density: "comfy" });

  // Login as test teacher
  await devLogin(page, { role: "teacher" });

  // Navigate to assignments page
  await page.goto("/teacher/assign");

  // Wait for page to load - use stable locator
  const heading = page.getByRole("heading", { level: 1, name: /assignments/i });
  await heading.waitFor({ timeout: 10000 });

  // Verify the heading is visible
  await expect(heading).toBeVisible();

  // Optionally verify the table is rendered with data-testid if available
  // If not available, check for generic table or list elements
  const contentArea = page.locator(
    '[data-testid="assignments-table"], table, [role="table"]',
  );
  await expect(contentArea.first()).toBeVisible({ timeout: 5000 });
});
