// client/src/AppRouter.tsx
import * as React from "react";

/**
 * Minimal app shell.
 * We keep this dependency-free so the bundle compiles even when the CI DOM shim
 * handles routing for tests (via ?shim=1).
 */
export default function AppRouter() {
  return (
    <main id="app" data-testid="app-root" style={{ padding: 16 }}>
      <h1 style={{ margin: 0, fontWeight: 600 }}>Quest Island</h1>
      {/* Add your real router here later (wouter/react-router/etc.) */}
    </main>
  );
}