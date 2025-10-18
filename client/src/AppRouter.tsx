import * as React from 'react';
import App from '@/App';

function wantShim() {
  try {
    // build-time flag
    if ((import.meta as any).env?.VITE_E2E_SHIM === '1') return true;
    // query param
    const p = new URLSearchParams(window.location.search);
    if (p.has('shim') && p.get('shim') !== '0') return true;
    // cookie fallback
    const hasCookie = document.cookie.split(';').some(c => c.trim() === 'e2e_shim=1');
    if (hasCookie) return true;
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
