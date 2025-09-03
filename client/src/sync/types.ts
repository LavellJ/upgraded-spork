// Sync system types for local-first queued writes

export type SyncItem =
  | { kind: 'event'; payload: any; id: string; at: number }
  | { kind: 'learner'; payload: any; id: string; at: number }
  | { kind: 'reflection'; payload: any; id: string; at: number }
  | { kind: 'journal'; payload: any; id: string; at: number }
  | { kind: 'assignment'; payload: any; id: string; at: number };

export type SyncState = {
  version: 1;
  items: SyncItem[];
};

export type SyncStatus = {
  pending: number;
  lastSuccess?: number;
  lastError?: string;
  isOnline: boolean;
  isSyncing: boolean;
};

export type SyncResult = {
  ok: boolean;
  error?: string;
  authExpired?: boolean; // Flag to indicate authentication failure
  // Optional server data for merging (when server has conflicting state)
  mergeData?: {
    kind: string;
    serverItems: any[];
  }[];
};

// Storage key for sync queue persistence
export const STORAGE_KEY = 'qi.sync.queue.v1';