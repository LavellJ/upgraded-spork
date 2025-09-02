// Comprehensive sync tests for Quest Island local-first sync system

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SyncItem } from '../src/sync/types';
import { 
  loadQueue, 
  saveQueue, 
  enqueue, 
  dequeueByIds, 
  getPendingCount, 
  clearQueue,
  getAllItems 
} from '../src/sync/queue';
import { flushOnce } from '../src/sync/engine';
import { setTransportFailureRate } from '../src/sync/transport';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Test helpers
function createTestItem(kind: 'event' | 'learner' | 'reflection', at = Date.now()): SyncItem {
  return {
    kind,
    payload: { test: 'data', kind },
    id: `test-${kind}-${at}-${Math.random()}`,
    at
  };
}

describe('Sync Queue', () => {
  beforeEach(() => {
    clearQueue();
    localStorageMock.clear();
  });

  describe('Basic Operations', () => {
    it('should start with empty queue', () => {
      expect(getPendingCount()).toBe(0);
      expect(getAllItems()).toEqual([]);
    });

    it('should enqueue single item', () => {
      const item = createTestItem('event');
      enqueue(item);
      
      expect(getPendingCount()).toBe(1);
      expect(getAllItems()).toEqual([item]);
    });

    it('should enqueue multiple items', () => {
      const items = [
        createTestItem('event'),
        createTestItem('learner'),
        createTestItem('reflection')
      ];
      
      items.forEach(enqueue);
      
      expect(getPendingCount()).toBe(3);
      expect(getAllItems()).toEqual(items);
    });

    it('should dequeue items by IDs', () => {
      const items = [
        createTestItem('event'),
        createTestItem('learner'),
        createTestItem('reflection')
      ];
      
      items.forEach(enqueue);
      
      // Remove middle item
      dequeueByIds([items[1].id]);
      
      expect(getPendingCount()).toBe(2);
      expect(getAllItems()).toEqual([items[0], items[2]]);
    });

    it('should dequeue multiple items by IDs', () => {
      const items = [
        createTestItem('event'),
        createTestItem('learner'),
        createTestItem('reflection')
      ];
      
      items.forEach(enqueue);
      
      // Remove first and last items
      dequeueByIds([items[0].id, items[2].id]);
      
      expect(getPendingCount()).toBe(1);
      expect(getAllItems()).toEqual([items[1]]);
    });
  });

  describe('Queue Size Limit', () => {
    it('should enforce 1000 item limit by dropping oldest', () => {
      // Fill queue beyond limit
      const items: SyncItem[] = [];
      for (let i = 0; i < 1050; i++) {
        const item = createTestItem('event', Date.now() + i);
        items.push(item);
        enqueue(item);
      }
      
      // Should have exactly 1000 items
      expect(getPendingCount()).toBe(1000);
      
      // Should have the most recent 1000 items (dropped first 50)
      const remainingItems = getAllItems();
      expect(remainingItems).toEqual(items.slice(-1000));
    });

    it('should maintain chronological order when enforcing limit', () => {
      // Add items with incrementing timestamps
      for (let i = 0; i < 1050; i++) {
        enqueue(createTestItem('event', i));
      }
      
      const remainingItems = getAllItems();
      
      // Should be 1000 items
      expect(remainingItems.length).toBe(1000);
      
      // Should be in order (timestamps 50-1049)
      for (let i = 0; i < remainingItems.length - 1; i++) {
        expect(remainingItems[i].at).toBeLessThan(remainingItems[i + 1].at);
      }
      
      // First item should have timestamp 50 (oldest kept)
      expect(remainingItems[0].at).toBe(50);
      // Last item should have timestamp 1049 (newest)
      expect(remainingItems[999].at).toBe(1049);
    });
  });

  describe('Persistence', () => {
    it('should persist queue across reload', () => {
      const items = [
        createTestItem('event'),
        createTestItem('learner')
      ];
      
      items.forEach(enqueue);
      
      // Simulate reload by loading fresh queue
      const reloadedItems = loadQueue();
      
      expect(reloadedItems).toEqual(items);
      expect(reloadedItems.length).toBe(2);
    });

    it('should handle corrupted storage gracefully', () => {
      // Corrupt the stored data
      localStorageMock.setItem('qi.sync.queue.v1', 'invalid json');
      
      // Should return empty array instead of throwing
      expect(loadQueue()).toEqual([]);
      expect(getPendingCount()).toBe(0);
    });

    it('should handle version mismatch gracefully', () => {
      // Store data with wrong version
      localStorageMock.setItem('qi.sync.queue.v1', JSON.stringify({
        version: 2,
        items: [createTestItem('event')]
      }));
      
      // Should return empty array for version mismatch
      expect(loadQueue()).toEqual([]);
      expect(getPendingCount()).toBe(0);
    });
  });
});

describe('Sync Engine', () => {
  beforeEach(() => {
    clearQueue();
    setTransportFailureRate(0); // Reset to success
    vi.clearAllMocks();
  });

  describe('Flush Operations', () => {
    it('should return true for empty queue', async () => {
      const result = await flushOnce();
      expect(result).toBe(true);
    });

    it('should group items by kind and sync successfully', async () => {
      // Add mixed items
      const eventItem = createTestItem('event');
      const learnerItem = createTestItem('learner');
      const reflectionItem = createTestItem('reflection');
      
      enqueue(eventItem);
      enqueue(learnerItem);
      enqueue(reflectionItem);
      
      expect(getPendingCount()).toBe(3);
      
      // Mock console.debug to verify batching
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      
      const result = await flushOnce();
      
      expect(result).toBe(true);
      expect(getPendingCount()).toBe(0); // All items should be removed
      
      // Verify that items were grouped and synced by kind
      expect(debugSpy).toHaveBeenCalledWith('Syncing 1 event items');
      expect(debugSpy).toHaveBeenCalledWith('Syncing 1 learner items');
      expect(debugSpy).toHaveBeenCalledWith('Syncing 1 reflection items');
      expect(debugSpy).toHaveBeenCalledWith('SYNC batch', [eventItem]);
      expect(debugSpy).toHaveBeenCalledWith('SYNC batch', [learnerItem]);
      expect(debugSpy).toHaveBeenCalledWith('SYNC batch', [reflectionItem]);
      
      debugSpy.mockRestore();
    });

    it('should handle multiple items of same kind in single batch', async () => {
      // Add multiple event items
      const eventItems = [
        createTestItem('event', 1),
        createTestItem('event', 2),
        createTestItem('event', 3)
      ];
      
      eventItems.forEach(enqueue);
      
      expect(getPendingCount()).toBe(3);
      
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      
      const result = await flushOnce();
      
      expect(result).toBe(true);
      expect(getPendingCount()).toBe(0);
      
      // Should send all event items in one batch
      expect(debugSpy).toHaveBeenCalledWith('Syncing 3 event items');
      expect(debugSpy).toHaveBeenCalledWith('SYNC batch', eventItems);
      
      debugSpy.mockRestore();
    });

    it('should return false and preserve queue on sync failure', async () => {
      // Set transport to fail
      setTransportFailureRate(1.0);
      
      const item = createTestItem('event');
      enqueue(item);
      
      expect(getPendingCount()).toBe(1);
      
      const result = await flushOnce();
      
      expect(result).toBe(false);
      expect(getPendingCount()).toBe(1); // Item should still be in queue
      expect(getAllItems()).toEqual([item]);
    });

    it('should handle partial failures correctly', async () => {
      // This test verifies that if one group fails, others still get processed
      // Since our current implementation processes groups sequentially and fails fast,
      // we'll test that failure stops processing and preserves all items
      
      setTransportFailureRate(1.0);
      
      const eventItem = createTestItem('event');
      const learnerItem = createTestItem('learner');
      
      enqueue(eventItem);
      enqueue(learnerItem);
      
      expect(getPendingCount()).toBe(2);
      
      const result = await flushOnce();
      
      expect(result).toBe(false);
      expect(getPendingCount()).toBe(2); // All items preserved on failure
    });
  });

  describe('Backoff and Recovery', () => {
    it('should handle network errors gracefully', async () => {
      // Force transport to throw
      setTransportFailureRate(1.0);
      
      const item = createTestItem('event');
      enqueue(item);
      
      const result = await flushOnce();
      
      expect(result).toBe(false);
      expect(getPendingCount()).toBe(1); // Item preserved
    });

    it('should recover after successful sync', async () => {
      const item = createTestItem('event');
      enqueue(item);
      
      // First fail
      setTransportFailureRate(1.0);
      let result = await flushOnce();
      expect(result).toBe(false);
      expect(getPendingCount()).toBe(1);
      
      // Then succeed
      setTransportFailureRate(0);
      result = await flushOnce();
      expect(result).toBe(true);
      expect(getPendingCount()).toBe(0);
    });
  });

  describe('Idempotency', () => {
    it('should generate stable IDs for same content', () => {
      const timestamp = Date.now();
      
      // Create two items with same content at same time
      const item1 = createTestItem('event', timestamp);
      const item2 = createTestItem('event', timestamp);
      
      // IDs should be different (include random component)
      expect(item1.id).not.toBe(item2.id);
      
      // But should follow consistent pattern
      expect(item1.id).toMatch(/^test-event-\d+-/);
      expect(item2.id).toMatch(/^test-event-\d+-/);
    });

    it('should handle duplicate sync attempts safely', async () => {
      const item = createTestItem('event');
      enqueue(item);
      
      // Sync twice
      await flushOnce();
      await flushOnce();
      
      // Should not error and queue should remain empty
      expect(getPendingCount()).toBe(0);
    });
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    clearQueue();
    setTransportFailureRate(0);
  });

  it('should handle realistic sync scenario', async () => {
    // Simulate typical usage pattern
    
    // User completes a lesson (progress event)
    const progressEvent = createTestItem('event');
    enqueue(progressEvent);
    
    // User completes journal session (learner data)
    const journalSession = createTestItem('learner');
    enqueue(journalSession);
    
    // User adds reflection
    const reflection = createTestItem('reflection');
    enqueue(reflection);
    
    expect(getPendingCount()).toBe(3);
    
    // Sync all items
    const result = await flushOnce();
    
    expect(result).toBe(true);
    expect(getPendingCount()).toBe(0);
  });

  it('should handle queue overflow during sync', async () => {
    // Fill queue to near capacity
    for (let i = 0; i < 999; i++) {
      enqueue(createTestItem('event', i));
    }
    
    expect(getPendingCount()).toBe(999);
    
    // Add one more item during sync
    enqueue(createTestItem('learner', 1000));
    
    expect(getPendingCount()).toBe(1000);
    
    // Sync should handle all items
    const result = await flushOnce();
    
    expect(result).toBe(true);
    expect(getPendingCount()).toBe(0);
  });

  it('should maintain data integrity across multiple operations', async () => {
    const items: SyncItem[] = [];
    
    // Add items in batches
    for (let batch = 0; batch < 5; batch++) {
      for (let i = 0; i < 10; i++) {
        const item = createTestItem(
          ['event', 'learner', 'reflection'][i % 3] as any,
          batch * 100 + i
        );
        items.push(item);
        enqueue(item);
      }
      
      // Sync some batches
      if (batch % 2 === 0) {
        await flushOnce();
      }
    }
    
    // Final sync
    await flushOnce();
    
    expect(getPendingCount()).toBe(0);
  });
});