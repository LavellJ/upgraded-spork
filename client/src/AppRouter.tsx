import * as React from 'react';
import ShimRoutes from '@/e2e-shim/Routes';

/**
 * Accept both of these forms in CI:
 *   1) /?shim=1&... (normal)
 *   2) /?shim=1/<virtualPath> (what the logs show, e.g. "/?shim=1/progress")
 * We rewrite #2 into "/<virtualPath>?shim=1".
 */
function coerceWeirdShimUrlOnce() {
  try {
    const { search, pathname } = window.location;
    if (pathname !== '/') return false; // only fix when sitting at root
    if (!search) return false;

    // Strip leading "?" and parse raw value
    const raw = search.slice(1); // e.g. "shim=1/progress" or "shim=1/island"
    const [key, val] = raw.split('=', 2);
    if (key !== 'shim' || !val) return false;

    // If value starts with "1/" treat the part after it as a virtual path
    // e.g. "1/progress" -> "/progress?shim=1"
    if (val.startsWith('1/')) {
      const virtual = '/' + val.slice(2); // remove "1/"
      const fixed = virtual + '?shim=1';
      window.history.replaceState(null, '', fixed);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export default function AppRouter() {
  // Always render the shim in CI (VITE_E2E_SHIM) or when ?shim is present.
  const [ready, setReady] = React.useState(false);
  React.useLayoutEffect(() => {
    // First, normalize funky "/?shim=1/<path>" into "/<path>?shim=1"
    coerceWeirdShimUrlOnce();
    setReady(true);
  }, []);

  if (!ready) return null;

  const params = new URLSearchParams(window.location.search);
  const hasShim = params.has('shim') || import.meta.env.VITE_E2E_SHIM;

  if (hasShim) {
    return <ShimRoutes />;
  }

  // Dev shell fallback
  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold mb-3">Quest Island — Dev shell</h1>
        <p className="opacity-80 mb-6">If you’re seeing this, the Vite dev server is working.</p>
        <ul className="text-left space-y-2">
          <li>✅ Root <code>#root</code> mounted</li>
          <li>✅ Vite alias <code>@</code> is resolving</li>
          <li>🧪 Try visiting <code>/styleguide</code> if you added it</li>
        </ul>
      </div>
    </main>
  );
}
