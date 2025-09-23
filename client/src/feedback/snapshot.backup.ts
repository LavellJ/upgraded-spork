// Environment snapshot utility for bug reports with PII masking

import { getActiveLearnerIdFallback } from '../roster/model';

export interface EnvSnapshot {
  timestamp: number;
  ua: string;
  platform: string;
  locale: string;
  deviceMemory: number | null;
  hardwareConcurrency: number | null;
  sw: {
    registered: boolean;
    status: string | null;
  };
  storage: StorageEstimate | null;
  app: {
    version: string;
    packs: string[];
    guardrails: boolean;
    learnerCount: number; // PII-safe: count only
    activeLearnerHash: string | null; // PII-safe: hashed ID
  };
  sync: {
    lastError: string | null;
    lastSyncTime: number | null;
    status: 'online' | 'offline' | 'syncing' | 'error';
  };
  performance: {
    memory: any;
    timing: any;
  };
  viewport: {
    width: number;
    height: number;
    pixelRatio: number;
  };
}

/**
 * Get service worker registration status
 */
async function getSWStatus(): Promise<string | null> {
  try {
    if (!('serviceWorker' in navigator)) {
      return 'not_supported';
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return 'not_registered';
    }

    if (registration.active) {
      return 'active';
    } else if (registration.installing) {
      return 'installing';
    } else if (registration.waiting) {
      return 'waiting';
    }

    return 'unknown';
  } catch (error) {
    console.warn('Failed to get SW status:', error);
    return 'error';
  }
}

/**
 * Get current sync status (mocked - would integrate with actual sync system)
 */
function getCurrentSyncStatus(): EnvSnapshot['sync'] {
  try {
    // Check online status
    const isOnline = navigator.onLine;
    
    // Get stored sync state (if any)
    const storedSync = localStorage.getItem('qi.sync.status');
    const syncData = storedSync ? JSON.parse(storedSync) : {};
    
    return {
      lastError: syncData.lastError || null,
      lastSyncTime: syncData.lastSyncTime || null,
      status: isOnline ? 'online' : 'offline'
    };
  } catch (error) {
    console.warn('Failed to get sync status:', error);
    return {
      lastError: 'failed_to_read_status',
      lastSyncTime: null,
      status: 'error'
    };
  }
}

/**
 * Get active pack IDs (PII-safe)
 */
function getActivePackIds(): string[] {
  try {
    // Check for packs in localStorage or other registry
    const storedPacks = localStorage.getItem('qi.packs.active');
    if (storedPacks) {
      const packs = JSON.parse(storedPacks);
      return Array.isArray(packs) ? packs.map(p => p.id || p) : [];
    }
    return ['base-au']; // Default pack
  } catch (error) {
    console.warn('Failed to get pack IDs:', error);
    return ['base-au'];
  }
}

/**
 * Get guardrails enabled status
 */
function getGuardrailsEnabled(): boolean {
  try {
    const stored = localStorage.getItem('qi.guide.settings');
    if (stored) {
      const settings = JSON.parse(stored);
      return settings.guardrailsEnabled ?? true;
    }
    return true; // Default to enabled
  } catch (error) {
    console.warn('Failed to get guardrails status:', error);
    return true;
  }
}

/**
 * Create a hash from a string (simple hash for PII masking)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get learner statistics (PII-safe: counts and hashed IDs only)
 */
function getLearnerStats(): { count: number; activeHash: string | null } {
  try {
    // Get learner count from roster (if available)
    const stored = localStorage.getItem('qi.roster.learners');
    const learners = stored ? JSON.parse(stored) : [];
    
    // Get active learner (hash only for privacy)
    const activeLearner = getActiveLearnerIdFallback();
    const activeHash = activeLearner ? simpleHash(activeLearner) : null;
    
    return {
      count: Array.isArray(learners) ? learners.length : 0,
      activeHash
    };
  } catch (error) {
    console.warn('Failed to get learner stats:', error);
    return { count: 0, activeHash: null };
  }
}

/**
 * Build comprehensive environment snapshot for bug reports
 * All PII is masked (learner names → counts/hashes only)
 */
export async function buildEnvSnapshot(): Promise<EnvSnapshot> {
  const learnerStats = getLearnerStats();
  
  return {
    timestamp: Date.now(),
    ua: navigator.userAgent,
    platform: navigator.platform,
    locale: navigator.language,
    deviceMemory: (navigator as any).deviceMemory ?? null,
    hardwareConcurrency: navigator.hardwareConcurrency ?? null,
    sw: {
      registered: 'serviceWorker' in navigator,
      status: await getSWStatus()
    },
    storage: await navigator.storage?.estimate?.() ?? null,
    app: {
      version: '1.0.0', // Would be injected at build time
      packs: getActivePackIds(),
      guardrails: getGuardrailsEnabled(),
      learnerCount: learnerStats.count,
      activeLearnerHash: learnerStats.activeHash
    },
    sync: getCurrentSyncStatus(),
    performance: {
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null,
      timing: performance.timing ? {
        loadEventEnd: performance.timing.loadEventEnd,
        loadEventStart: performance.timing.loadEventStart,
        domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd,
        domContentLoadedEventStart: performance.timing.domContentLoadedEventStart,
        navigationStart: performance.timing.navigationStart
      } : null
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1
    }
  };
}

/**
 * Format snapshot as pretty JSON string
 */
export function formatSnapshot(snapshot: EnvSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

/**
 * Download snapshot as JSON file
 */
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

/**
 * Copy snapshot to clipboard
 */
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