import { describe, it, expect, beforeEach, vi } from 'vitest'
import { enqueue, dequeueByIds, clearQueue, getPendingCount } from '../src/sync/queue'
import type { SyncItem } from '../src/sync/types'

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('Scout queue system', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    clearQueue() // Clear any existing queue state
  })

  it('should enqueue items successfully', () => {
    const item: SyncItem = {
      id: 'test-item-1',
      kind: 'event',
      payload: { test: 'data' },
      at: Date.now()
    }

    enqueue(item)
    
    const count = getPendingCount()
    expect(count).toBe(1)
  })

  it('should dequeue items by IDs', () => {
    const item1: SyncItem = {
      id: 'test-item-1',
      kind: 'event', 
      payload: { test: 'data1' },
      at: Date.now()
    }
    
    const item2: SyncItem = {
      id: 'test-item-2',
      kind: 'event',
      payload: { test: 'data2' },
      at: Date.now()
    }

    // Enqueue two items
    enqueue(item1)
    enqueue(item2)
    expect(getPendingCount()).toBe(2)

    // Dequeue one item
    dequeueByIds(['test-item-1'])
    expect(getPendingCount()).toBe(1)

    // Dequeue remaining item
    dequeueByIds(['test-item-2'])
    expect(getPendingCount()).toBe(0)
  })

  it('should handle basic enqueue/dequeue flow without throwing', () => {
    const testFlow = () => {
      // Enqueue some items
      for (let i = 0; i < 5; i++) {
        const item: SyncItem = {
          id: `item-${i}`,
          kind: 'event',
          payload: { index: i },
          at: Date.now() + i
        }
        enqueue(item)
      }

      expect(getPendingCount()).toBe(5)

      // Dequeue a subset
      dequeueByIds(['item-1', 'item-3'])
      expect(getPendingCount()).toBe(3)

      // Clear all
      clearQueue()
      expect(getPendingCount()).toBe(0)
    }

    expect(testFlow).not.toThrow()
  })

  it('should prevent duplicate flood by maintaining queue size limit', () => {
    const MAX_QUEUE_SIZE = 1000

    // Enqueue more than max size
    for (let i = 0; i < MAX_QUEUE_SIZE + 100; i++) {
      const item: SyncItem = {
        id: `flood-item-${i}`,
        kind: 'event',
        payload: { index: i },
        at: Date.now() + i
      }
      enqueue(item)
    }

    // Should not exceed max size
    const count = getPendingCount()
    expect(count).toBeLessThanOrEqual(MAX_QUEUE_SIZE)
    expect(count).toBe(MAX_QUEUE_SIZE)
  })

  it('should handle dequeue of non-existent IDs gracefully', () => {
    const item: SyncItem = {
      id: 'existing-item',
      kind: 'event',
      payload: { test: 'data' },
      at: Date.now()
    }

    enqueue(item)
    expect(getPendingCount()).toBe(1)

    // Try to dequeue non-existent items
    dequeueByIds(['non-existent-1', 'non-existent-2'])
    
    // Original item should still be there
    expect(getPendingCount()).toBe(1)

    // Dequeue with mixed existing and non-existing IDs
    dequeueByIds(['existing-item', 'non-existent-3'])
    expect(getPendingCount()).toBe(0)
  })

  it('should persist queue state to localStorage', () => {
    const item: SyncItem = {
      id: 'persistent-item',
      kind: 'event',
      payload: { test: 'persistence' },
      at: Date.now()
    }

    enqueue(item)

    // Check localStorage directly - use the legacy key that the queue actually uses
    const stored = mockLocalStorage.getItem('qi.sync.queue') || mockLocalStorage.getItem('qi.sync.queue.legacy')
    expect(stored).toBeTruthy()
    
    if (stored) {
      const parsed = JSON.parse(stored)
      expect(parsed.version).toBe(1)
      expect(parsed.items).toBeDefined()
      expect(parsed.items.length).toBe(1)
      expect(parsed.items[0].id).toBe('persistent-item')
    }
  })

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    const originalSetItem = mockLocalStorage.setItem
    mockLocalStorage.setItem = vi.fn(() => {
      throw new Error('Storage quota exceeded')
    })

    const item: SyncItem = {
      id: 'error-item',
      kind: 'event',
      payload: { test: 'error' },
      at: Date.now()
    }

    // Should not throw even if localStorage fails
    expect(() => enqueue(item)).not.toThrow()

    // Restore original method
    mockLocalStorage.setItem = originalSetItem
  })

  it('should handle different item kinds', () => {
    const kinds: Array<SyncItem['kind']> = ['event', 'learner', 'reflection', 'journal', 'assignment']

    kinds.forEach((kind, index) => {
      const item: SyncItem = {
        id: `${kind}-item-${index}`,
        kind,
        payload: { type: kind },
        at: Date.now() + index
      }
      enqueue(item)
    })

    expect(getPendingCount()).toBe(kinds.length)

    // Clear all
    clearQueue()
    expect(getPendingCount()).toBe(0)
  })
})