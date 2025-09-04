let cached: string | undefined;

// Simple RFC4122-ish fallback
function fallbackUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function safeRandomUUID(): string {
  try {
    const c = (globalThis as any).crypto;
    if (c && typeof c.randomUUID === 'function') {
      return c.randomUUID(); // modern browsers
    }
  } catch {
    // ignore and fall back
  }
  return fallbackUUID();
}

/**
 * Stable within a single tab session (resets on full reload/new tab).
 * Uses a global to survive HMR during dev.
 */
export function getSessionId(): string {
  // Reuse if HMR re-imported this module
  const g = globalThis as any;
  if (typeof g.__qiSessionId === 'string') return (cached = g.__qiSessionId);

  if (!cached) {
    const sid = safeRandomUUID(); // <— avoid the name "id"
    cached = sid;
    g.__qiSessionId = sid; // persist for HMR
  }
  return cached;
}

/** For tests/dev only */
export function __resetSessionIdForTests() {
  const g = globalThis as any;
  delete g.__qiSessionId;
  cached = undefined;
}