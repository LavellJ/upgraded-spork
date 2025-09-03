// Sync engine with batching, backoff, and status management

import { useState, useEffect, useRef } from 'react';
import type { SyncItem, SyncStatus } from './types';
import { loadQueue, dequeueByIds, getPendingCount } from './queue';
import { send } from './transport';
import { useOnline } from '../pwa/useOnline';
import { mergeSyncPayloads } from './merge';

// Sync engine configuration
const DEFAULT_INTERVAL_MS = 5000;
const MIN_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 60000;

// Global sync status state
let syncStatus: SyncStatus = {
  pending: 0,
  isOnline: false,
  isSyncing: false
};

const statusListeners = new Set<(status: SyncStatus) => void>();

// Update sync status and notify listeners
function updateSyncStatus(updates: Partial<SyncStatus>): void {
  syncStatus = { ...syncStatus, ...updates };
  statusListeners.forEach(listener => listener(syncStatus));
}

// Hook to subscribe to sync status updates
export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(syncStatus);
  
  useEffect(() => {
    const listener = (newStatus: SyncStatus) => setStatus(newStatus);
    statusListeners.add(listener);
    
    // Update with current pending count on mount
    updateSyncStatus({ pending: getPendingCount() });
    
    return () => {
      statusListeners.delete(listener);
    };
  }, []);
  
  return status;
}

// Group sync items by kind for batched processing
function groupByKind(items: SyncItem[]): Record<string, SyncItem[]> {
  const groups: Record<string, SyncItem[]> = {};
  
  for (const item of items) {
    if (!groups[item.kind]) {
      groups[item.kind] = [];
    }
    groups[item.kind].push(item);
  }
  
  return groups;
}

// Single flush attempt - processes entire queue
export async function flushOnce(): Promise<boolean> {
  const items = loadQueue();
  
  if (items.length === 0) {
    updateSyncStatus({ pending: 0 });
    return true;
  }
  
  updateSyncStatus({ isSyncing: true });
  
  try {
    // Group items by kind for batched processing
    const groups = groupByKind(items);
    const allItemIds: string[] = [];
    
    // Process each group separately
    for (const [kind, groupItems] of Object.entries(groups)) {
      console.debug(`Syncing ${groupItems.length} ${kind} items`);
      
      const result = await send(groupItems);
      
      if (!result.ok) {
        updateSyncStatus({ 
          isSyncing: false,
          lastError: result.error || 'Sync failed'
        });
        
        // If authentication expired, pause the sync engine
        if (result.authExpired) {
          console.warn('Authentication expired, pausing sync engine');
          return false; // This will stop the sync loop
        }
        
        return false;
      }
      
      // Handle merge data if server provided it
      if (result.mergeData) {
        for (const mergeGroup of result.mergeData) {
          if (mergeGroup.kind === kind && mergeGroup.serverItems.length > 0) {
            console.debug(`Merging ${mergeGroup.serverItems.length} ${kind} items from server`);
            
            // Extract local payloads for this kind
            const localPayloads = groupItems.map(item => item.payload);
            
            // Merge with server data
            const mergedPayloads = mergeSyncPayloads(
              localPayloads,
              mergeGroup.serverItems,
              kind
            );
            
            // TODO: Save merged data back to local storage
            // This would require kind-specific save functions
            console.debug(`Merged ${kind} data:`, { 
              local: localPayloads.length,
              server: mergeGroup.serverItems.length,
              merged: mergedPayloads.length
            });
          }
        }
      }
      
      // Collect IDs for successful items
      allItemIds.push(...groupItems.map(item => item.id));
    }
    
    // Remove successfully synced items from queue
    dequeueByIds(allItemIds);
    
    // Update status with success
    updateSyncStatus({
      pending: getPendingCount(),
      isSyncing: false,
      lastSuccess: Date.now(),
      lastError: undefined
    });
    
    return true;
    
  } catch (error) {
    updateSyncStatus({
      isSyncing: false,
      lastError: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

// Sync engine with automatic retry and backoff
export function startSyncLoop({ intervalMs = DEFAULT_INTERVAL_MS } = {}) {
  let timeoutId: NodeJS.Timeout | null = null;
  let currentBackoffMs = MIN_BACKOFF_MS;
  let isRunning = false;
  
  // Update pending count on start
  updateSyncStatus({ pending: getPendingCount() });
  
  async function trySync(): Promise<void> {
    if (!syncStatus.isOnline || isRunning) {
      return;
    }
    
    isRunning = true;
    const success = await flushOnce();
    isRunning = false;
    
    if (success) {
      // Reset backoff on success
      currentBackoffMs = MIN_BACKOFF_MS;
      scheduleNext(intervalMs);
    } else {
      // Double backoff on failure, up to max
      currentBackoffMs = Math.min(currentBackoffMs * 2, MAX_BACKOFF_MS);
      console.debug(`Sync failed, backing off for ${currentBackoffMs}ms`);
      scheduleNext(currentBackoffMs);
    }
  }
  
  function scheduleNext(delayMs: number): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(trySync, delayMs);
  }
  
  // Start the sync loop
  trySync();
  
  // Return cleanup function
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    isRunning = false;
  };
}

// Hook to manage sync engine lifecycle
export function useSyncEngine({ intervalMs = DEFAULT_INTERVAL_MS } = {}) {
  const { online } = useOnline();
  const cleanupRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    // Update online status
    updateSyncStatus({ isOnline: online });
    
    if (online) {
      // Start sync engine when online
      cleanupRef.current = startSyncLoop({ intervalMs });
    } else {
      // Stop sync engine when offline
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      updateSyncStatus({ isSyncing: false });
    }
    
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [online, intervalMs]);
  
  // Update pending count when items might be added
  useEffect(() => {
    const updatePending = () => {
      updateSyncStatus({ pending: getPendingCount() });
    };
    
    // Listen for storage changes (across tabs)
    window.addEventListener('storage', updatePending);
    
    // Initial update
    updatePending();
    
    return () => {
      window.removeEventListener('storage', updatePending);
    };
  }, []);
}