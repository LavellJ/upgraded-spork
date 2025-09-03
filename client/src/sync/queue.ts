// Sync queue management with local storage persistence

import type { SyncItem, SyncState } from './types';
import { ns, BASE_KEYS } from '../storage/namespace';

const MAX_QUEUE_SIZE = 1000;
const LEGACY_STORAGE_KEY = 'qi.sync.queue.v1';

// Load sync queue from localStorage
export function loadQueue(learnerId?: string): SyncItem[] {
  try {
    const storageKey = learnerId ? ns(learnerId, BASE_KEYS.syncQueue) : LEGACY_STORAGE_KEY;
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    
    const state: SyncState = JSON.parse(stored);
    if (state.version !== 1) {
      console.warn('Sync queue version mismatch, clearing queue');
      return [];
    }
    
    return state.items || [];
  } catch (error) {
    console.error('Failed to load sync queue:', error);
    return [];
  }
}

// Save sync queue to localStorage
export function saveQueue(items: SyncItem[], learnerId?: string): void {
  try {
    const state: SyncState = {
      version: 1,
      items
    };
    const storageKey = learnerId ? ns(learnerId, BASE_KEYS.syncQueue) : LEGACY_STORAGE_KEY;
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save sync queue:', error);
  }
}

// Add item to queue, maintaining max size by dropping oldest
export function enqueue(item: SyncItem, learnerId?: string): void {
  const queue = loadQueue(learnerId);
  
  // Add new item
  queue.push(item);
  
  // Enforce max size by removing oldest items
  if (queue.length > MAX_QUEUE_SIZE) {
    queue.splice(0, queue.length - MAX_QUEUE_SIZE);
  }
  
  saveQueue(queue, learnerId);
}

// Remove items from queue by their IDs
export function dequeueByIds(ids: string[], learnerId?: string): void {
  const queue = loadQueue(learnerId);
  const idsSet = new Set(ids);
  const filtered = queue.filter(item => !idsSet.has(item.id));
  saveQueue(filtered, learnerId);
}

// Get count of pending items in queue
export function getPendingCount(learnerId?: string): number {
  return loadQueue(learnerId).length;
}

// Clear all items from queue (for testing or emergency reset)
export function clearQueue(learnerId?: string): void {
  saveQueue([], learnerId);
}

// Get all items from queue (for debugging)
export function getAllItems(learnerId?: string): SyncItem[] {
  return loadQueue(learnerId);
}