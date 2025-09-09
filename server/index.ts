import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

// init DB (side-effect import is fine)
import "../shared/db.js";

const app = express();
app.use(cors());
app.use(express.json());

// --- API routes ---
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// --- serve frontend from /dist ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist/public");

app.use(express.static(distDir));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

// --- listen ---
const PORT = Number(process.env.PORT) || 3001;
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.info(`Backend API server listening on ${HOST}:${PORT}`);
});