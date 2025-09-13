import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:5000",
    trace: "on-first-retry",
    viewport: { width: 1280, height: 800 },
    screenshot: "only-on-failure",
  },
  expect: {
    toHaveScreenshot: { maxDiffPixels: 120 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],webServer: {
  command: 'npm run dev',   // ignored because we start the server in the workflow
  port: 5000,
  timeout: 300000,
  reuseExistingServer: true,
},
use: { baseURL: 'http://127.0.0.1:5000' },
  
});
