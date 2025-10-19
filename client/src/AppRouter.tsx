import * as React from 'react';
import App from '@/App';

function normalizeWeirdShimUrl() {
  try {
    const { pathname, search } = window.location;
    // pattern: "/?shim=1/anything"
    if (pathname === '/' && search.startsWith('?shim=1/')) {
      const rest = search.slice('?shim=1'.length); // => "/island" etc
      const newUrl = `${rest}?shim=1`;
      window.history.replaceState({}, '', newUrl);
    }
  } catch {}
}

function wantShim() {
  try {
    if ((import.meta as any).env?.VITE_E2E_SHIM === '1') return true;
    const p = new URLSearchParams(window.location.search);
    if (p.has('shim') && p.get('shim') !== '0') return true;
    const hasCookie = document.cookie.split(';').some(c => c.trim() === 'e2e_shim=1');
    if (hasCookie) return true;
  } catch {}
  return false;
}

export default function AppRouter() {
  normalizeWeirdShimUrl();

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
