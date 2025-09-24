// playwright.config.ts
// >>> BEGIN injected skip logic <<<
const SKIP_E2E_LOCAL =
  Boolean(
    process.env.REPLIT ||
      process.env.REPLIT_PROJECT_ID ||
      process.env.REPL_SLUG ||
      process.env.CODESPACES,
  ) && !process.env.CI;
// >>> END injected skip logic <<<

import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const isFull = process.env.FULL_E2E === "1";

// Load quarantine list (optional)
const quarantineFile = path.join(process.cwd(), ".ci", "quarantine.txt");
let quarantineGlobs: string[] = [];
if (fs.existsSync(quarantineFile)) {
  quarantineGlobs = fs
    .readFileSync(quarantineFile, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [["line"], ["html", { open: "never" }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // ✅ Define the chromium project so `--project=chromium` works
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Alternatively: browserName: 'chromium'
      },
    },
    // If you later want firefox/webkit, uncomment:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],

  // Skip E2E locally (Replit-like envs) and quarantine specs when not running full E2E
  testIgnore: SKIP_E2E_LOCAL ? ["e2e/**"] : isFull ? [] : quarantineGlobs,

  webServer: {
    // Build and start the server with required env
    command: `bash -lc 'set -euo pipefail; mkdir -p .data .backups; npm run build; \
      JWT_SECRET=ci_jwt_secret_please_rotate \
      DATABASE_URL=file:.data/qi.db \
      APP_BASE_URL=http://localhost:5000 \
      npx tsx server/index.ts'`,
    url: "http://localhost:5000",
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
