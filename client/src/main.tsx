// client/src/main.tsx
import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";

// If your project has these, keep them. If not, you can remove the imports.
import App from "./App";
import "./index.css";

/**
 * Runtime safety: ensure <html lang="en-AU"> exists in all environments.
 * (Helps a11y checks and avoids flakiness across hosts.)
 */
(function ensureLang() {
  try {
    const html = document.documentElement;
    if (!html.getAttribute("lang")) html.setAttribute("lang", "en-AU");
  } catch {
    /* no-op */
  }
})();

/**
 * Detect CI shim mode:
 * When URL contains ?shim=1, the static CI DOM shim takes over the page and
 * we intentionally DO NOT boot the React app to avoid double-rendering.
 */
function isCiShimActive(): boolean {
  try {
    const sp = new URLSearchParams(window.location.search);
    // truthy if param is present (treats ?shim=1 or ?shim as active)
    return sp.has("shim") && sp.get("shim") !== "0";
  } catch {
    return false;
  }
}

(function bootstrap() {
  // If the CI shim is active, skip React boot.
  if (isCiShimActive()) {
    // Small signal for tests or debugging if needed:
    (window as any).__app_boot_skipped_by_shim__ = true;
    return;
  }

  const rootEl = document.getElementById("root");
  if (!rootEl) {
    // Fail-safe: create a root if missing (shouldn’t happen in normal builds).
    const el = document.createElement("div");
    el.id = "root";
    document.body.appendChild(el);
  }

  const container = document.getElementById("root") as HTMLElement;
  const root = ReactDOM.createRoot(container);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  // Optional: expose a small flag for E2E sanity checks
  (window as any).__app_booted__ = true;
})();

// Hot Module Replacement (Vite)
if (import.meta && (import.meta as any).hot) {
  (import.meta as any).hot.accept?.();
}