import * as React from 'react';
import App from '@/App';

export default function AppRouter() {
  // If CI sets VITE_E2E_SHIM=1, render the minimal routes with test IDs
  if (import.meta.env.VITE_E2E_SHIM === '1') {
    const Shim = React.lazy(() => import('@/e2e-shim/Routes'));
    return (
      <React.Suspense fallback={<div>Loading…</div>}>
        <Shim />
      </React.Suspense>
    );
  }
  // Otherwise, render your real app (whatever it includes: router, pages, etc.)
  return <App />;
}
