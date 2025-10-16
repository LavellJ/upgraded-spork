import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replit hosts change; allow all. Also set root to "client" so Vite reads the right index.html.
// Build goes to dist/public (matches your current output).
export default defineConfig({
  root: 'client',
  plugins: [react()],
  server: {
    host: true,              // listen on all interfaces
    port: 5173,
    allowedHosts: true,      // ✅ allow any host (Replit subdomains)
    hmr: { clientPort: 443 } // helps HMR through https tunnels
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true
  },
  build: {
    outDir: '../dist/public',
    emptyOutDir: true
  }
});
