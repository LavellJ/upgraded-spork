import express from "express";
import cors from "cors";
import { createServer } from "http";
import { setupVite, log } from "./vite";

// Import database initialization
import "./db";

// Import routes setup
import { registerRoutes } from "./routes";

async function startDevelopmentServer() {
  const app = express();
  const server = createServer(app);

  // Basic middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Setup API routes
  await registerRoutes(app);

  // Setup Vite development middleware (this handles the frontend)
  await setupVite(app, server);

  // Start server
  const HOST = "0.0.0.0";
  const PORT = Number(process.env.PORT) || 5000;

  server.listen(PORT, HOST, () => {
    log(`Development server running on ${HOST}:${PORT}`);
    log("Frontend: Vite dev server");
    log("Backend: Express API routes");
  });
}

startDevelopmentServer().catch(console.error);