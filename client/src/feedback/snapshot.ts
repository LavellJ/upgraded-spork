/**
 * Snapshot builder for issue reports.
 * - Masks sensitive keys with "[REDACTED]".
 * - If a value *looks* like JSON but fails to parse, we also return "[REDACTED]".
 * - Keeps non-sensitive UI prefs (e.g., theme) intact so tests can assert on them.
 */

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const REDACTED = "[REDACTED]";

// Define what we consider sensitive by key name (case-insensitive).
const SENSITIVE_KEY_MATCHERS: RegExp[] = [
  /password/i,
  /secret/i,
  /token/i,
  /email/i,
  /sensitive/i,
  /roster/i, // matches qi.roster.v1 and similar
];

// This function decides if a given localStorage key should be redacted.
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_MATCHERS.some((rx) => rx.test(key));
}

// Return "[REDACTED]" if it looks like JSON but we cannot parse it.
function parseJsonOrRedact(raw: string): Json | typeof REDACTED {
  const trimmed = raw.trim();
  const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");
  if (!looksJson) return raw; // plain string, keep as-is

  try {
    return JSON.parse(trimmed) as Json;
  } catch {
    return REDACTED; // IMPORTANT: tests require "[REDACTED]" on parse failure
  }
}

// Build a safe dump of localStorage without leaking sensitive values.
function buildSafeLocalStorageDump(): Record<string, Json | typeof REDACTED> {
  const dump: Record<string, Json | typeof REDACTED> = {};

  // Some environments don't have localStorage (SSR, strict mode, etc.)
  if (typeof window === "undefined" || !("localStorage" in window)) {
    return dump;
  }

  for (const key of Object.keys(window.localStorage)) {
    try {
      const value = window.localStorage.getItem(key);
      if (value == null) {
        dump[key] = null;
        continue;
      }

      if (isSensitiveKey(key)) {
        // Always redact known sensitive keys
        dump[key] = REDACTED;
        continue;
      }

      // Try to keep non-sensitive prefs readable
      dump[key] = parseJsonOrRedact(value);
    } catch {
      // Any unexpected error still results in redaction
      dump[key] = REDACTED;
    }
  }

  return dump;
}

// Public API: returns an object suitable for JSON.stringify in the reporter
export function buildIssueSnapshot() {
  const snapshot = {
    localStorage: buildSafeLocalStorageDump(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    timestamp: new Date().toISOString(),
  };
  return snapshot;
}

// Convenience helper if callers expect a string
export function buildIssueSnapshotString(): string {
  return JSON.stringify(buildIssueSnapshot());
}

export default buildIssueSnapshot;

// Legacy compatibility - maintain interface for existing code
export type EnvSnapshot = {
  timestamp: string;
  url?: string;
  userAgent?: string;
  localStorage: Record<string, Json | typeof REDACTED>;
};

// Legacy function names for compatibility
export async function buildEnvSnapshot(): Promise<EnvSnapshot> {
  return buildIssueSnapshot() as EnvSnapshot;
}

export function formatSnapshot(snapshot: EnvSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function downloadSnapshot(snapshot: EnvSnapshot, filename?: string): void {
  const json = formatSnapshot(snapshot);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `learnoz-env-snapshot-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export async function copySnapshot(snapshot: EnvSnapshot): Promise<boolean> {
  try {
    const json = formatSnapshot(snapshot);
    await navigator.clipboard.writeText(json);
    return true;
  } catch (error) {
    console.warn('Failed to copy to clipboard:', error);
    return false;
  }
}