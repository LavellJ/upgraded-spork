// Sync queue management with local storage persistence

import type { SyncItem, SyncState } from './types';
import { STORAGE_KEY } from './types';

const MAX_QUEUE_SIZE = 1000;

// Load sync queue from localStorage
export function loadQueue(): SyncItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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
export function saveQueue(items: SyncItem[]): void {
  try {
    const state: SyncState = {
      version: 1,
      items
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save sync queue:', error);
  }
}

// Add item to queue, maintaining max size by dropping oldest
export function enqueue(item: SyncItem): void {
  const queue = loadQueue();
  
  // Add new item
  queue.push(item);
  
  // Enforce max size by removing oldest items
  if (queue.length > MAX_QUEUE_SIZE) {
    queue.splice(0, queue.length - MAX_QUEUE_SIZE);
  }
  
  saveQueue(queue);
}

// Remove items from queue by their IDs
export function dequeueByIds(ids: string[]): void {
  const queue = loadQueue();
  const idsSet = new Set(ids);
  const filtered = queue.filter(item => !idsSet.has(item.id));
  saveQueue(filtered);
}

// Get count of pending items in queue
export function getPendingCount(): number {
  return loadQueue().length;
}

// Clear all items from queue (for testing or emergency reset)
export function clearQueue(): void {
  saveQueue([]);
}

// Get all items from queue (for debugging)
export function getAllItems(): SyncItem[] {
  return loadQueue();
}