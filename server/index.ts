import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

// init DB (side-effect import is fine)
import "../shared/db.js";

// Import the routes registration function
import { registerRoutes } from "./routes.js";

const app = express();
app.use(cors());
app.use(express.json());

// --- start server ---
const HOST = "0.0.0.0";
const PORT = Number(process.env.PORT) || 5000;

// --- serve frontend from /dist ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist/public");

// Register all API routes and start the server
registerRoutes(app).then((server) => {
  // Mount static assets and SPA fallback AFTER API routes
  app.use(express.static(distDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });

  server.listen(PORT, HOST, () => {
    console.info(`Server (API + static) listening on ${HOST}:${PORT}`);
  });
}).catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});