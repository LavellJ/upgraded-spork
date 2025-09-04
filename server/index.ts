// Server with cloud-style API endpoints for development
// Start with: npm run dev
// Endpoints available:
// - POST /api/sync/batch (with Authorization: Bearer <token>)
// - GET /api/roster?userId=... (with Authorization: Bearer <token>)
// - POST /api/roster (with Authorization: Bearer <token>)
// Data persisted to .devdb.json automatically every 10 seconds

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log as viteLog } from "./vite";
import { requestTrackingMiddleware, userContextMiddleware } from "./middleware/requestTracking";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { log } from "./log";
import path from "path";

const app = express();

// Request tracking middleware (must be first)
app.use(requestTrackingMiddleware);

// Add CORS - tighter security for development
if (app.get("env") === "development") {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000', 'http://127.0.0.1:5000'],
    credentials: true
  }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// User context middleware for authenticated requests
app.use(userContextMiddleware);

(async () => {
  // Serve attached assets as static files
  app.use('/attached_assets', express.static(path.resolve(import.meta.dirname, '..', 'attached_assets')));

  const server = await registerRoutes(app);
  
  // Initialize cron jobs
  const { initializeCronJobs, startCronJobs, destroyCronJobs } = await import('./cron');
  initializeCronJobs();
  startCronJobs();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('📡 Received SIGINT, shutting down gracefully...');
    destroyCronJobs();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('📡 Received SIGTERM, shutting down gracefully...');
    destroyCronJobs();
    process.exit(0);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Add 404 handler for undefined routes (AFTER vite setup)
  app.use(notFoundHandler);
  
  // Global error handler (must be last middleware)
  app.use(errorHandler);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log.info(`Server running on port ${port}`, {
      environment: process.env.NODE_ENV || 'development',
      port,
    });
  });
})();
