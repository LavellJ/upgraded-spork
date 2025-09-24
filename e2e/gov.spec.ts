
import { test, expect, type Page } from '@playwright/test';

// --- BEGIN: resilient helpers ---
async function waitForApp(page: Page, timeout = 20000) {
  // Prefer our BootMarker from AppRouter: #root[data-testid="app-loaded"] or body[data-app-loaded="1"]
  try {
    await page.waitForSelector(
      '#root[data-testid="app-loaded"], body[data-app-loaded="1"]',
      { timeout },
    );
    return;
  } catch {
    // Fallback: make sure document is interactive and network is mostly idle
    try {
      await page.waitForLoadState("domcontentloaded", { timeout: 5000 });
    } catch {}
    try {
      await page.waitForLoadState("networkidle", { timeout: 5000 });
    } catch {}
  }
}

// Normalize legacy/alias names used inside tests
function normalizeTab(tab: string): string {
  const t = (tab || "").toLowerCase();
  if (t === "home" || t === "index" || t === "") return "overview";
  if (t === "dev") return "debug";
  return t;
}

async function gotoTeacherTab(page: Page, tab: string) {
  const t = normalizeTab(tab);
  await page.goto(`/teacher/${t}`);
  // Heuristics: wait for page shell + main/content to be present
  await waitForApp(page);
  const main = page.locator(
    '[data-testid="teacher-main"], main, [role="main"]',
  );
  await expect(main.first()).toBeVisible({ timeout: 10000 });
  // If this tab usually renders an H1, give it a short chance (non-fatal)
  try {
    await page
      .getByRole("heading", { level: 1 })
      .first()
      .waitFor({ timeout: 2000 });
  } catch {}
}

/** Blocks app code from closing the test window (some toggles may call window.close in dev). */
async function blockWindowClose(page: Page) {
  await page.addInitScript(() => {
    // @ts-ignore
    window.__WINDOW_CLOSE_BLOCKED__ = true;
    const orig = window.close;
    // @ts-ignore
    window.close = () => {
      console.warn("[e2e] window.close() was called and blocked.");
      return;
    };
    // @ts-ignore
    window.__ORIG_WINDOW_CLOSE__ = orig;
  });
}

/** Waits for the app to be interactive after any reload/navigation. */
async function restabilizeApp(page: Page, { timeout = 15000 } = {}) {
  try {
    await page.waitForLoadState("domcontentloaded", { timeout });
  } catch {}
  try {
    await page.waitForLoadState("networkidle", { timeout });
  } catch {}
  await page.waitForSelector(
    '[data-testid="boot-marker"], [data-testid="app-loaded"], [data-app-root]',
    { timeout },
  );
}

/** Navigate to a teacher tab and confirm its content root is ready. */
async function gotoTeacherTabStable(page: Page, tab: string) {
  await gotoTeacherTab(page, tab); // existing helper
  await restabilizeApp(page);
  const roots = [
    `[data-testid="teacher-${tab}-root"]`,
    `[data-testid="teacher-root"]`,
    `[data-testid="panel-${tab}"]`,
  ];
  for (const sel of roots) {
    try {
      if (await page.locator(sel).first().isVisible({ timeout: 2000 })) return;
    } catch {}
  }
  await page.waitForURL(/\/teacher/, { timeout: 10000 });
}

/** Clicks a test id with self-healing: if the page tears down, re-nav to the tab and retry once. */
async function safeClickByTestId(
  page: Page,
  tab: string,
  testId: string,
  options?: Parameters<Page["click"]>[1],
) {
  const sel = `[data-testid="${testId}"]`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await page.waitForSelector(sel, { timeout: 8000 });
      await page.click(sel, options);
      return;
    } catch (err: any) {
      const msg = String(err?.message || err);
      const looksClosed =
        page.isClosed() ||
        /Target page.*has been closed|Execution context was destroyed|detached/i.test(
          msg,
        );
      if (attempt === 1 && looksClosed) {
        await restabilizeApp(page).catch(() => {});
        await gotoTeacherTabStable(page, tab);
        continue;
      }
      throw err;
    }
  }
}

/** Set flags so debug/strict-mode UI renders in test env. Idempotent. */
async function primeE2EFlags(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("e2e", "1");
      localStorage.setItem("dev", "1");
      localStorage.setItem("debug:enabled", "1");
      localStorage.setItem("feature:debugPanel", "true");
      localStorage.setItem("feature:privacyControls", "true");
      localStorage.setItem("feature:killSwitches", "true");
      // Avoid service worker surprises in tests:
      localStorage.setItem("sw:disable", "true");
    } catch {}
  });
}

/** Robust selector list for strict-mode toggle. */
function privacyToggleSelector(): string {
  return [
    '[data-testid="toggle-privacy-strict-mode"]',
    '[data-testid="privacy-strict-toggle"]',
    'role=switch[name="Privacy Strict Mode"]',
    '[aria-label="Privacy Strict Mode"]',
    "#privacy-strict-mode",
  ].join(", ");
}

/** Go straight to debug tab via URL and stabilize. */
async function openDebugTab(page: Page) {
  // Ensure flags are set before the first load:
  await primeE2EFlags(page);
  await page.goto("/teacher/debug?e2e=1&dev=1");
  await restabilizeApp(page);
  // Confirm some debug-root exists (fallback to teacher root)
  await page.waitForSelector(
    '[data-testid="teacher-debug-root"], [data-testid="teacher-root"], [data-testid="panel-debug"]',
    { timeout: 10000 },
  );
}

/** Click privacy strict toggle with full fallback and one recovery attempt. */
async function clickPrivacyStrictToggle(page: Page) {
  const sel = privacyToggleSelector();
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const loc = page.locator(sel).first();
      await loc.waitFor({ state: "visible", timeout: 8000 });
      await loc.click();
      return;
    } catch (err) {
      if (attempt === 1) {
        // Recover: re-prime flags, hard reload, re-open debug tab, retry
        await primeE2EFlags(page);
        await page.goto("/teacher/debug?e2e=1&dev=1");
        await restabilizeApp(page);
        continue;
      }
      throw err;
    }
  }
}
// --- END: resilient helpers ---

/**
 * Governance Feature E2E Tests
 * Tests privacy compliance features including DSAR, erasure, and privacy strict mode
 */

test.describe("Governance Features", () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await blockWindowClose(page);
    await primeE2EFlags(page);
    await page.goto("/");

    // Wait for app to load
    await waitForApp(page);
    await restabilizeApp(page);
  });

  test.describe("Privacy Strict Mode", () => {
    test("should hide Growth tab when privacy strict mode enabled", async () => {
      // Navigate to feature flags panel (development mode)
      await openDebugTab(page);
      await page.waitForSelector('[data-testid="panel-feature-flags"]');

      // Enable privacy strict mode
      await clickPrivacyStrictToggle(page);
      await page.waitForTimeout(500); // Allow state update

      // Navigate to Reports section
      await gotoTeacherTab(page, "reports");
      await page.waitForSelector('[data-testid="reports-tabs"]');

      // Verify Growth tab is hidden
      const growthTab = page.locator('[data-testid="tab-growth"]');
      await expect(growthTab).not.toBeVisible();

      // Verify Trends and Audit tabs are still visible
      await expect(page.locator('[data-testid="tab-trends"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-audit"]')).toBeVisible();
    });

    test("should restrict referral UI when privacy strict mode enabled", async () => {
      // Enable privacy strict mode
      await openDebugTab(page);
      await clickPrivacyStrictToggle(page);

      // Navigate to settings/growth area (if accessible)
      await page.goto("/settings");

      // Verify referral components are hidden
      const referralSection = page.locator('[data-testid="section-referrals"]');
      await expect(referralSection).not.toBeVisible();

      const inviteButton = page.locator(
        '[data-testid="button-invite-teacher"]',
      );
      await expect(inviteButton).not.toBeVisible();
    });

    test("should block non-essential analytics events in strict mode", async () => {
      // Setup console monitoring
      const consoleMessages: string[] = [];
      page.on("console", (msg) => {
        if (msg.text().includes("[Privacy] Blocked")) {
          consoleMessages.push(msg.text());
        }
      });

      // Enable privacy strict mode
      await openDebugTab(page);
      await clickPrivacyStrictToggle(page);

      // Trigger analytics events (scout interactions, etc.)
      await safeClickByTestId(page, "debug", "button-scout-help", {
        timeout: 5000,
      });

      // Wait for console message
      await page.waitForTimeout(1000);

      // Verify analytics events were blocked
      expect(consoleMessages.length).toBeGreaterThan(0);
      expect(consoleMessages[0]).toContain(
        "[Privacy] Blocked non-essential event",
      );
    });
  });

  test.describe("Data Subject Access Rights (DSAR)", () => {
    test("should submit DSAR request and generate export", async () => {
      // Navigate to Privacy Hub
      await page.click('[data-testid="link-privacy-hub"]');
      await page.waitForSelector('[data-testid="privacy-hub"]');

      // Click Data Export section
      await page.click('[data-testid="section-data-export"]');
      await page.waitForSelector('[data-testid="form-dsar-request"]');

      // Fill and submit DSAR form
      await page.fill('[data-testid="input-email"]', "test@example.com");
      await page.fill(
        '[data-testid="textarea-reason"]',
        "Requesting all my data for personal records",
      );

      await page.click('[data-testid="button-submit-dsar"]');

      // Verify success message
      await expect(
        page.locator('[data-testid="message-dsar-submitted"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="message-dsar-submitted"]'),
      ).toContainText("Data export request submitted successfully");

      // Verify request appears in management panel (if accessible)
      await page.click('[data-testid="tab-dsar-management"]');
      const requestRow = page.locator('[data-testid*="dsar-request-"]').first();
      await expect(requestRow).toBeVisible();
      await expect(requestRow).toContainText("test@example.com");
    });

    test("should generate and download CSV audit export", async () => {
      // Navigate to Privacy Hub → Audit Export
      await page.click('[data-testid="link-privacy-hub"]');
      await page.click('[data-testid="section-audit-export"]');

      // Configure export filters
      await page.selectOption('[data-testid="select-date-range"]', "30");
      await page.selectOption('[data-testid="select-action-type"]', "all");

      // Setup download handler
      const downloadPromise = page.waitForEvent("download");

      // Trigger CSV export
      await page.click('[data-testid="button-export-csv"]');

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/audit-export-.*\.csv/);

      // Verify download completed
      await download.path();
    });
  });

  test.describe("Data Erasure (Right to be Forgotten)", () => {
    test("should submit erasure request with grace period", async () => {
      // Navigate to Privacy Hub → Data Erasure
      await page.click('[data-testid="link-privacy-hub"]');
      await page.click('[data-testid="section-data-erasure"]');

      // Fill erasure form
      await page.fill('[data-testid="input-email"]', "erase@example.com");
      await page.fill(
        '[data-testid="textarea-erasure-reason"]',
        "No longer need the account",
      );

      // Acknowledge warnings
      await page.check('[data-testid="checkbox-confirm-erasure"]');
      await page.check('[data-testid="checkbox-understand-permanent"]');

      await page.click('[data-testid="button-submit-erasure"]');

      // Verify grace period notification
      await expect(
        page.locator('[data-testid="message-grace-period"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="grace-period-countdown"]'),
      ).toBeVisible();

      // Verify cancellation option available
      await expect(
        page.locator('[data-testid="button-cancel-erasure"]'),
      ).toBeVisible();
    });

    test("should allow cancellation during grace period", async () => {
      // Submit erasure request first
      await page.click('[data-testid="link-privacy-hub"]');
      await page.click('[data-testid="section-data-erasure"]');
      await page.fill('[data-testid="input-email"]', "cancel@example.com");
      await page.check('[data-testid="checkbox-confirm-erasure"]');
      await page.click('[data-testid="button-submit-erasure"]');

      // Cancel the request
      await page.click('[data-testid="button-cancel-erasure"]');

      // Confirm cancellation
      await page.click('[data-testid="button-confirm-cancel"]');

      // Verify cancellation success
      await expect(
        page.locator('[data-testid="message-erasure-cancelled"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="message-erasure-cancelled"]'),
      ).toContainText("Data erasure request has been cancelled");
    });
  });

  test.describe("Feature Flag Kill-Switches", () => {
    test("should disable growth features with kill-switches", async () => {
      // Access development panel
      await openDebugTab(page);
// Disable invite features
      await page.click('[data-testid="toggle-enable-invites"]');
      await page.click('[data-testid="toggle-enable-referrals"]');

      // Navigate to areas where these features would appear
      await page.goto("/settings");

      // Verify features are disabled
      const inviteSection = page.locator('[data-testid="section-invites"]');
      const referralSection = page.locator('[data-testid="section-referrals"]');

      await expect(inviteSection).not.toBeVisible();
      await expect(referralSection).not.toBeVisible();
    });

    test("should disable share/rate prompts with kill-switches", async () => {
      // Disable share and rate prompts
      await openDebugTab(page);
await page.click('[data-testid="toggle-enable-share-prompt"]');
      await page.click('[data-testid="toggle-enable-rate-prompt"]');

      // Trigger conditions that would normally show prompts
      // (complete lessons, achieve milestones, etc.)
      await page.click('[data-testid="button-complete-lesson"]', {
        timeout: 5000,
      });

      // Wait for any potential prompts
      await page.waitForTimeout(2000);

      // Verify prompts don't appear
      const sharePrompt = page.locator('[data-testid="modal-share-prompt"]');
      const ratePrompt = page.locator('[data-testid="modal-rate-prompt"]');

      await expect(sharePrompt).not.toBeVisible();
      await expect(ratePrompt).not.toBeVisible();
    });
  });

  test.describe("Audit System", () => {
    test("should log privacy-related events correctly", async () => {
      // Navigate to Audit Viewer
      await gotoTeacherTabStable(page, "reports");
      await page.click('[data-testid="tab-audit"]');

      // Clear existing logs for clean test
      await safeClickByTestId(page, "reports", "button-clear-filters");

      // Perform privacy-related actions
      await page.click('[data-testid="link-privacy-hub"]');
      await page.click('[data-testid="section-data-export"]');
      await page.fill('[data-testid="input-email"]', "audit@test.com");
      await page.click('[data-testid="button-submit-dsar"]');

      // Return to audit viewer
      await gotoTeacherTab(page, "reports");
      await page.click('[data-testid="tab-audit"]');

      // Verify DSAR event logged
      const auditEntry = page.locator('[data-testid*="audit-entry-"]').first();
      await expect(auditEntry).toBeVisible();
      await expect(auditEntry).toContainText("dsar_request");
      await expect(auditEntry).toContainText("audit@test.com");
    });

    test("should filter audit events in privacy strict mode", async () => {
      // Enable privacy strict mode
      await openDebugTab(page);
      await clickPrivacyStrictToggle(page);

      // Generate various events
      await safeClickByTestId(page, "debug", "button-scout-help", {
        timeout: 5000,
      });
      await page.click('[data-testid="link-lesson-1"]', { timeout: 5000 });

      // Check audit logs
      await gotoTeacherTab(page, "reports");
      await page.click('[data-testid="tab-audit"]');

      // Verify only essential events are shown
      const auditEntries = page.locator('[data-testid*="audit-entry-"]');
      const count = await auditEntries.count();

      // Should only see essential events (lesson_start, etc.)
      for (let i = 0; i < count; i++) {
        const entry = auditEntries.nth(i);
        const text = await entry.textContent();

        // Verify event type is in essential list
        const isEssential = [
          "lesson_start",
          "lesson_finish",
          "journal_start",
          "journal_finish",
          "tuning_applied",
          "difficulty_adjusted",
        ].some((eventType) => text?.includes(eventType));
        expect(isEssential).toBeTruthy();
      }
    });
  });

  test.afterEach(async () => {
    // Playwright manages the page fixture; no cleanup needed
  });
});

/**

test.beforeEach(async ({ page }) => {
  await blockWindowClose(page);
  await primeE2EFlags(page);
  await page.goto('/');
  await waitForApp(page);
  await restabilizeApp(page);
});


 * Helper function to simulate user interactions that generate events
 */
async function simulateUserActivity(page: Page) {
  // Complete a lesson
  await page.click('[data-testid="link-lesson-1"]', { timeout: 5000 });
  await page.waitForTimeout(1000);
  await page.click('[data-testid="button-start-lesson"]', { timeout: 5000 });
  await page.waitForTimeout(2000);
  await page.click('[data-testid="button-complete-lesson"]', { timeout: 5000 });

  // Use scout features
  await safeClickByTestId(page, 'debug', 'button-scout-help', { timeout: 5000 });
  await page.waitForTimeout(500);

  // Navigate between sections
  await page.click('[data-testid="link-journal"]', { timeout: 5000 });
  await page.waitForTimeout(500);
  await page.click('[data-testid="link-campfire"]', { timeout: 5000 });
}
