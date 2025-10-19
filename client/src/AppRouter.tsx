import * as React from 'react';
import ShimRoutes from '@/e2e-shim/Routes';

export default function AppRouter() {
  // Always render shim when ?shim=1 is present (CI) or when VITE_E2E_SHIM=1 (build-time).
  const hasShimParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('shim');
  if (hasShimParam || import.meta.env.VITE_E2E_SHIM) {
    return <ShimRoutes />;
  }

  // Dev shell fallback (fine for local dev)
  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold mb-3">Quest Island — Dev shell</h1>
        <p className="opacity-80 mb-6">
          If you’re seeing this, the Vite dev server is working.
        </p>
        <ul className="text-left space-y-2">
          <li>✅ Root <code>#root</code> mounted</li>
          <li>✅ Vite alias <code>@</code> is resolving</li>
          <li>🧪 Try visiting <code>/styleguide</code> if you added it</li>
        </ul>
      </div>
    </main>
  );
}
