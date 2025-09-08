// server/index.ts
import express from "express";
import cors from "cors";

// Ensure schema loads and DB is ready (side-effect import is OK)
import "../shared/db.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

const PORT = Number(process.env.PORT) || 5000;

if (process.env.START_SERVER === "true") {
  app.listen(PORT, () => {
    console.info(`Backend listening on :${PORT}`);
  });
} else {
  console.info("Backend disabled (START_SERVER not set)");
}

export default app;