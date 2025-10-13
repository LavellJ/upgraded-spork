import { Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const fixturesDir = path.join(process.cwd(), "e2e", "fixtures");
const read = (name: string) =>
  fs.readFileSync(path.join(fixturesDir, name), "utf-8");

export async function installApiMocks(page: Page) {
  if (process.env.CI) {
    page.on("request", (r) => console.log("[req]", r.method(), r.url()));
    page.on("response", (res) => console.log("[res]", res.status(), res.url()));
  }

  const assignments = read("assignments-list.json");
  const trends = read("reports-trends.json");
  const island = read("island-progress.json");

  // Match ANY endpoint that contains "assignments" (covers /api/assignments, /api/teacher/assignments, etc)
  await page.route(/assignments/i, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: assignments,
    });
  });

  // Reports trends (looser match too)
  await page.route(/reports.*trends/i, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: trends,
    });
  });

  // Island progress
  await page.route(/\/api\/progress\/island/i, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: island,
    });
  });

  // Catch-all for the rest of /api/**
  await page.route("**/api/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
}
