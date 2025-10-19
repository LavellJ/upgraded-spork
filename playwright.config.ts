// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  reporter: [["line"], ["html", { open: "never" }]],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit",   use: { ...devices["Desktop Safari"] } }, // good for Replit
  ],
  use: {
    // Point all test navigations at the shimmed base.
    // e.g. page.goto('/island') -> '/?shim=1/island' -> bootstrap normalizes to '/island?shim=1'
    baseURL: "http://127.0.0.1:4173/?shim=1",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npx vite preview --port 4173 --host 127.0.0.1 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
