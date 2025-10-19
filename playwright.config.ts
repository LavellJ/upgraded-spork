import { defineConfig, devices } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173";
const useStatic = process.env.E2E_STATIC === "1";

export default defineConfig({
  testDir: "e2e",
  reporter: [["html", { open: "never" }]],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: { baseURL: BASE },
  webServer: useStatic
    ? {
        command:
          'bash -lc "if [ -d ./client/dist/public ]; then DIST=./client/dist/public; elif [ -d ./client/dist ]; then DIST=./client/dist; else DIST=./dist/public; fi; npx http-server $DIST -p 4173 --silent"',
        url: BASE,
        reuseExistingServer: true,
        timeout: 60_000,
      }
    : {
        command: "npx vite preview --port 4173 --host 127.0.0.1 --strictPort",
        url: BASE,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
