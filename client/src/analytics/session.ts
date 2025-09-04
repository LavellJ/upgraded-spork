let cached: string | undefined

function fallbackUUID() {
  // RFC4122-ish, for older engines without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Stable within a single tab session (resets on full reload/new tab).
 * Uses a global to survive HMR during dev.
 */
export function getSessionId(): string {
  // reuse if HMR re-imports the module
  if ((globalThis as any).__qiSessionId) return (globalThis as any).__qiSessionId as string

  if (!cached) {
    // Prefer modern API; fallback if unavailable
    const id = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : fallbackUUID()
    cached = id
    // Store in global for HMR persistence
    (globalThis as any).__qiSessionId = id
  }
  return cached
}

/** For tests/dev only */
export function __resetSessionIdForTests() {
  cached = undefined
  // Clear DEV global
  delete (globalThis as any).__qiSessionId
}