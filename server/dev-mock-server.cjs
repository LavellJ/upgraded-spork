// server/dev-mock-server.js
const path = require("path");
const fs = require("fs");
const express = require("express");

const app = express();
const PORT = 4173;

// --- Mock API payloads (mirror CI) ---
const islandFixturePath = path.join(process.cwd(), "e2e/fixtures/island-progress.json");
let islandProgress = { lap: 1, biomes: [] };
try {
  islandProgress = JSON.parse(fs.readFileSync(islandFixturePath, "utf8"));
} catch {
  islandProgress = {
    lap: 1,
    biomes: [
      { id: "forest", total: 3, done: 1 },
      { id: "tropics", total: 3, done: 3 },
      { id: "desert", total: 3, done: 0 },
      { id: "coast", total: 3, done: 0 },
    ],
  };
}

app.get("/api/progress/island", (_req, res) => {
  res.json(islandProgress);
});

app.get("/api/lessons/today", (_req, res) => {
  res.json({
    id: "les-001",
    displayTitle: "Patterns",
    firstActivityId: "act-001",
    firstActivityTitle: "Patterns Intro",
  });
});

// E2E helper: seed localStorage flag, then bounce to Island
app.get("/__seed", (_req, res) => {
  res.set("Content-Type", "text/html").send(`
<!doctype html><meta charset="utf-8"/>
<script>
  try { localStorage.setItem("E2E_CONTROLS","1"); } catch(e) {}
  location.replace("/island");
</script>`);
});

// --- Static build + SPA fallback ---
const distDir = path.join(process.cwd(), "dist");
app.use(express.static(distDir, { extensions: ["html"] }));
app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Dev Mock Server on http://127.0.0.1:${PORT}`);
});
