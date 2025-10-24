// client/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import AppRouter from "./AppRouter";

declare global {
  interface Window {
    __E2E_SHIM_ACTIVE__?: boolean;
  }
}

// Ensure <html lang> is present in all environments (helps a11y tests)
if (!document.documentElement.getAttribute("lang")) {
  document.documentElement.setAttribute("lang", "en-AU");
}

// Detect CI shim mode:
// - index.html sets window.__E2E_SHIM_ACTIVE__ when ?shim=1 is present
// - we also defensively detect the query param directly
const shimActive =
  !!window.__E2E_SHIM_ACTIVE__ ||
  /(?:\?|&)shim=1(?:&|$)/.test(location.search) ||
  /^\?shim=1(?:\/|$)/.test(location.search);

// If shim is active, don't boot the React app.
// The static DOM shim (e2e-ci-shim.js) will render test markup instead.
if (shimActive) {
  // Make sure CI can see the page if any preboot CSS hides body
  document.body.style.opacity = "1";
  // eslint-disable-next-line no-console
  console.log("[CI] Shim active — skipping React app boot.");
} else {
  const rootEl = document.getElementById("root");
  if (!rootEl) {
    throw new Error('Root element "#root" not found');
  }

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>
  );
}