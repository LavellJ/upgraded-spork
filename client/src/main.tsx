// client/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppRouter from "./AppRouter";

// Optional global flag set by index.html when ?shim=1 is present
declare global {
  interface Window {
    __E2E_SHIM_ACTIVE__?: boolean;
  }
}

// Ensure <html lang> exists (stabilizes a11y checks)
if (!document.documentElement.getAttribute("lang")) {
  document.documentElement.setAttribute("lang", "en-AU");
}

/**
 * Detect CI shim mode.
 * - Primary: window.__E2E_SHIM_ACTIVE__ (set by index.html when ?shim=1)
 * - Fallbacks: handle both ?shim=1 and legacy ?shim=1/<path> forms
 */
const hasShimParam =
  /(?:^|\?|&)shim=1(?:$|[&#])/.test(location.search) ||
  /^\?shim=1(?:\/|$)/.test(location.search);

const shimActive = Boolean(window.__E2E_SHIM_ACTIVE__ || hasShimParam);

if (shimActive) {
  // Make sure the page is visible if any preboot CSS hides it
  document.body.hidden = false;
  document.body.style.opacity = "1";
  document.body.style.visibility = "visible";
  // Do NOT mount React — the static e2e-ci-shim.js will own the DOM.
  // eslint-disable-next-line no-console
  console.log("[CI] Shim active — skipping React app boot.");
} else {
  const rootEl = document.getElementById("root");
  if (!rootEl) {
    throw new Error('Root element "#root" not found');
  }

  createRoot(rootEl).render(
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>
  );
}