import * as React from 'react';
import App from '@/App';

function wantShim() {
  try {
    if (import.meta.env.VITE_E2E_SHIM === '1') return true;
    const p = new URLSearchParams(window.location.search);
    if (p.has('shim') && p.get('shim') !== '0') return true;
  } catch {}
  return false;
}

export default function AppRouter() {
  if (wantShim()) {
    const Shim = React.lazy(() => import('@/e2e-shim/Routes'));
    return (
      <React.Suspense fallback={<div>Loading…</div>}>
        <Shim />
      </React.Suspense>
    );
  }
  return <App />;
}
