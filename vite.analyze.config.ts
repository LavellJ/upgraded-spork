import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { analyzer } from "vite-bundle-analyzer";

// Separate config for bundle analysis
export default defineConfig({
  plugins: [
    react(),
    analyzer({
      analyzerMode: 'server',
      analyzerPort: 8888,
      openAnalyzer: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});