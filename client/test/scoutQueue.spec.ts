import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScoutQueue, resetScoutQueue, type ScoutQueueMessage } from '../src/hooks/useScoutQueue';

// Mock the profile context with configurable calm mode
const mockProfile = { calmMode: false };
vi.mock('../src/profile/context', () => ({
  useProfile: () => ({
    profile: mockProfile
  })
}));

// Mock analytics
vi.mock('../src/lib/analytics', () => ({
  logEvent: vi.fn()
}));

describe('useScoutQueue', () => {
  beforeEach(() => {
    resetScoutQueue();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    resetScoutQueue();
  });

  describe('basic queue functionality', () => {
    it('starts with empty queue', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      expect(result.current.current).toBeNull();
      expect(result.current.pendingCount).toBe(0);
    });

    it('enqueues and displays messages', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      act(() => {
        result.current.enqueue({
          id: 'test-1',
          text: 'Hello Explorer!',
          priority: 'info'
        });
      });
      
      expect(result.current.current).toEqual({
        id: 'test-1',
        text: 'Hello Explorer!',
        priority: 'info',
        timestamp: expect.any(Number)
      });
      expect(result.current.pendingCount).toBe(0);
    });

    it('processes queue in FIFO order', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      act(() => {
        result.current.enqueue({
          id: 'test-1',
          text: 'First message',
          priority: 'info'
        });
      });
      
      act(() => {
        result.current.enqueue({
          id: 'test-2',
          text: 'Second message',
          priority: 'info'
        });
      });
      
      expect(result.current.current?.text).toBe('First message');
      expect(result.current.pendingCount).toBe(1);
      
      act(() => {
        result.current.dismiss();
      });
      
      expect(result.current.current?.text).toBe('Second message');
      expect(result.current.pendingCount).toBe(0);
    });

    it('dismisses current message', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      act(() => {
        result.current.enqueue({
          id: 'test-1',
          text: 'Test message',
          priority: 'info'
        });
      });
      
      expect(result.current.current).toBeTruthy();
      
      act(() => {
        result.current.dismiss();
      });
      
      expect(result.current.current).toBeNull();
    });
  });

  describe('queue capacity and management', () => {
    it('respects queue capacity of 3', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      // Fill queue to capacity
      act(() => {
        result.current.enqueue({
          id: 'test-1',
          text: 'Message 1',
          priority: 'info'
        });
        result.current.enqueue({
          id: 'test-2', 
          text: 'Message 2',
          priority: 'info'
        });
        result.current.enqueue({
          id: 'test-3',
          text: 'Message 3',
          priority: 'info'
        });
        result.current.enqueue({
          id: 'test-4',
          text: 'Message 4',
          priority: 'info'
        });
      });
      
      expect(result.current.current?.text).toBe('Message 1');
      expect(result.current.pendingCount).toBe(3); // Capacity is 3, so 4th message replaces oldest
    });

    it('replaces oldest info message when queue is full', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      // Fill queue with info messages  
      act(() => {
        result.current.enqueue({
          id: 'test-1',
          text: 'Info 1',
          priority: 'info'
        });
        result.current.enqueue({
          id: 'test-2',
          text: 'Info 2',
          priority: 'info'
        });
        result.current.enqueue({
          id: 'test-3',
          text: 'Info 3',
          priority: 'info'
        });
        result.current.enqueue({
          id: 'test-4',
          text: 'Actionable 1',
          priority: 'actionable'
        });
      });
      
      expect(result.current.pendingCount).toBe(3);
      
      // Add one more message to trigger replacement
      act(() => {
        result.current.enqueue({
          id: 'test-5',
          text: 'Info 4',
          priority: 'info'
        });
      });
      
      // Should still have capacity of 3 in pending
      expect(result.current.pendingCount).toBe(3);
      
      // Process through queue to check what messages are present
      const messages: string[] = [];
      
      while (result.current.current) {
        messages.push(result.current.current.text);
        act(() => {
          result.current.dismiss();
        });
      }
      
      // Should contain actionable message (preserved due to higher priority)
      expect(messages).toContain('Actionable 1');
      // Should have exactly 4 messages total (1 current + 3 pending)
      expect(messages.length).toBe(4);
    });

    it('ignores new messages when queue is full and no info messages to replace', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      // Fill queue with actionable messages
      act(() => {
        result.current.enqueue({
          id: 'test-1',
          text: 'Actionable 1',
          priority: 'actionable'
        });
        result.current.enqueue({
          id: 'test-2',
          text: 'Actionable 2',
          priority: 'actionable'
        });
        result.current.enqueue({
          id: 'test-3',
          text: 'Actionable 3',
          priority: 'actionable'
        });
        result.current.enqueue({
          id: 'test-4',
          text: 'Actionable 4',
          priority: 'actionable'
        });
        // This should be ignored
        result.current.enqueue({
          id: 'test-5',
          text: 'Ignored',
          priority: 'info'
        });
      });
      
      expect(result.current.pendingCount).toBe(3);
      
      // Process through queue
      const messages: string[] = [];
      while (result.current.current) {
        messages.push(result.current.current.text);
        act(() => {
          result.current.dismiss();
        });
      }
      
      expect(messages).not.toContain('Ignored');
    });
  });

  describe('coalescing behavior', () => {
    it('coalesces duplicate messages within 30s window', () => {
      const { result } = renderHook(() => useScoutQueue());
      const startTime = Date.now();
      
      act(() => {
        result.current.enqueue({
          id: 'duplicate-test',
          text: 'First occurrence',
          priority: 'info'
        });
      });
      
      expect(result.current.current?.text).toBe('First occurrence');
      
      // Try to enqueue same ID within coalesce window
      act(() => {
        vi.setSystemTime(startTime + 15000); // 15 seconds later
        result.current.enqueue({
          id: 'duplicate-test',
          text: 'Second occurrence (should be ignored)',
          priority: 'info'
        });
      });
      
      expect(result.current.current?.text).toBe('First occurrence');
      expect(result.current.pendingCount).toBe(0);
    });

    it('allows duplicate messages after coalesce window expires', () => {
      const { result } = renderHook(() => useScoutQueue());
      const startTime = Date.now();
      
      act(() => {
        result.current.enqueue({
          id: 'duplicate-test',
          text: 'First occurrence',
          priority: 'info'
        });
      });
      
      act(() => {
        result.current.dismiss();
      });
      
      // Try to enqueue same ID after coalesce window
      act(() => {
        vi.setSystemTime(startTime + 35000); // 35 seconds later
        result.current.enqueue({
          id: 'duplicate-test',
          text: 'Second occurrence (should be allowed)',
          priority: 'info'
        });
      });
      
      expect(result.current.current?.text).toBe('Second occurrence (should be allowed)');
    });
  });

  describe('auto-dismiss timing', () => {
    it('auto-dismisses after 3000ms in normal mode', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      act(() => {
        result.current.enqueue({
          id: 'test-auto-dismiss',
          text: 'Auto dismiss test',
          priority: 'info'
        });
      });
      
      expect(result.current.current).toBeTruthy();
      
      act(() => {
        vi.advanceTimersByTime(2999);
      });
      
      expect(result.current.current).toBeTruthy();
      
      act(() => {
        vi.advanceTimersByTime(1);
      });
      
      expect(result.current.current).toBeNull();
    });

    it('pauses and resumes timer correctly', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      act(() => {
        result.current.enqueue({
          id: 'test-pause',
          text: 'Pause test',
          priority: 'info'
        });
      });
      
      // Advance time partway
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      
      // Pause timer
      act(() => {
        result.current.pauseTimer();
      });
      
      // Advance time further - should not dismiss
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      expect(result.current.current).toBeTruthy();
      
      // Resume timer
      act(() => {
        result.current.resumeTimer();
      });
      
      // Should dismiss after remaining time
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      
      expect(result.current.current).toBeNull();
    });
  });

  describe('critical message handling', () => {
    it('handles critical messages immediately', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      // Add some info messages to queue
      act(() => {
        result.current.enqueue({
          id: 'info-1',
          text: 'Info message',
          priority: 'info'
        });
        result.current.enqueue({
          id: 'info-2',
          text: 'Another info',
          priority: 'info'
        });
      });
      
      expect(result.current.current?.priority).toBe('info');
      expect(result.current.pendingCount).toBe(1);
      
      // Enqueue critical message
      act(() => {
        result.current.enqueue({
          id: 'critical-1',
          text: 'Critical message',
          priority: 'critical'
        });
      });
      
      // Critical message should be shown immediately
      expect(result.current.current?.priority).toBe('critical');
      expect(result.current.current?.text).toBe('Critical message');
    });

    it('bypasses queue for critical messages', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      act(() => {
        result.current.enqueue({
          id: 'critical-test',
          text: 'Critical bypass test',
          priority: 'critical'
        });
      });
      
      // Critical message should not increment pending count
      expect(result.current.current?.priority).toBe('critical');
      expect(result.current.pendingCount).toBe(0);
    });
  });

  describe('info message flushing', () => {
    it('flushes only info messages from queue', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      act(() => {
        result.current.enqueue({
          id: 'info-1',
          text: 'Info message 1',
          priority: 'info'
        });
        result.current.enqueue({
          id: 'actionable-1',
          text: 'Actionable message',
          priority: 'actionable'
        });
        result.current.enqueue({
          id: 'info-2',
          text: 'Info message 2',
          priority: 'info'
        });
      });
      
      expect(result.current.pendingCount).toBe(2);
      
      act(() => {
        result.current.flushInfoMessages();
      });
      
      // Should only have actionable message remaining in queue
      // The info message that was current should be dismissed
      expect(result.current.pendingCount).toBe(0);
      
      // Current message should now be the actionable one
      expect(result.current.current?.text).toBe('Actionable message');
      expect(result.current.current?.priority).toBe('actionable');
    });

    it('dismisses current info message when flushing', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      act(() => {
        result.current.enqueue({
          id: 'current-info',
          text: 'Current info message',
          priority: 'info'
        });
        result.current.enqueue({
          id: 'actionable-1',
          text: 'Next actionable',
          priority: 'actionable'
        });
      });
      
      expect(result.current.current?.priority).toBe('info');
      
      act(() => {
        result.current.flushInfoMessages();
      });
      
      // Should now show the actionable message
      expect(result.current.current?.priority).toBe('actionable');
      expect(result.current.current?.text).toBe('Next actionable');
    });
  });

  describe('CTA (Call-to-Action) support', () => {
    it('includes CTA in message when provided', () => {
      const { result } = renderHook(() => useScoutQueue());
      const mockOnClick = vi.fn();
      
      act(() => {
        result.current.enqueue({
          id: 'cta-test',
          text: 'Message with CTA',
          priority: 'actionable',
          cta: {
            label: 'Take Action',
            onClick: mockOnClick
          }
        });
      });
      
      expect(result.current.current?.cta).toEqual({
        label: 'Take Action',
        onClick: mockOnClick
      });
    });
  });

  describe('calm mode timing', () => {
    it('auto-dismisses after 4500ms in calm mode', () => {
      // Set calm mode
      mockProfile.calmMode = true;
      
      const { result } = renderHook(() => useScoutQueue());
      
      act(() => {
        result.current.enqueue({
          id: 'test-calm-dismiss',
          text: 'Calm mode test',
          priority: 'info'
        });
      });
      
      expect(result.current.current).toBeTruthy();
      
      // Should still be visible after 3 seconds in calm mode
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      
      expect(result.current.current).toBeTruthy();
      
      // Should dismiss after 4.5 seconds
      act(() => {
        vi.advanceTimersByTime(1500); // Total 4500ms
      });
      
      expect(result.current.current).toBeNull();
      
      // Reset calm mode
      mockProfile.calmMode = false;
    });
  });

  describe('inbox functionality', () => {
    it('adds actionable messages to inbox when auto-dismissed', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      act(() => {
        result.current.enqueue({
          id: 'actionable-auto',
          text: 'Actionable message',
          priority: 'actionable',
          cta: { label: 'Click', onClick: vi.fn() }
        });
      });
      
      expect(result.current.inbox.length).toBe(0);
      
      // Auto-dismiss via timer
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      
      expect(result.current.inbox.length).toBe(1);
      expect(result.current.inbox[0].id).toBe('actionable-auto');
    });

    it('adds actionable messages to inbox when manually dismissed', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      act(() => {
        result.current.enqueue({
          id: 'actionable-manual',
          text: 'Actionable message',
          priority: 'actionable',
          cta: { label: 'Click', onClick: vi.fn() }
        });
      });
      
      expect(result.current.inbox.length).toBe(0);
      
      // Manual dismiss
      act(() => {
        result.current.dismiss();
      });
      
      expect(result.current.inbox.length).toBe(1);
      expect(result.current.inbox[0].id).toBe('actionable-manual');
    });

    it('does not add info messages to inbox', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      act(() => {
        result.current.enqueue({
          id: 'info-no-inbox',
          text: 'Info message',
          priority: 'info'
        });
      });
      
      act(() => {
        result.current.dismiss();
      });
      
      expect(result.current.inbox.length).toBe(0);
    });

    it('keeps only last 5 inbox messages', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      // Add 6 actionable messages
      for (let i = 1; i <= 6; i++) {
        act(() => {
          result.current.enqueue({
            id: `inbox-${i}`,
            text: `Actionable ${i}`,
            priority: 'actionable',
            cta: { label: 'Click', onClick: vi.fn() }
          });
        });
        
        act(() => {
          result.current.dismiss();
        });
      }
      
      expect(result.current.inbox.length).toBe(5);
      expect(result.current.inbox[0].id).toBe('inbox-2'); // First should be removed
      expect(result.current.inbox[4].id).toBe('inbox-6'); // Last should remain
    });

    it('removes messages from inbox', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      act(() => {
        result.current.enqueue({
          id: 'remove-test',
          text: 'Remove test',
          priority: 'actionable',
          cta: { label: 'Click', onClick: vi.fn() }
        });
      });
      
      act(() => {
        result.current.dismiss();
      });
      
      expect(result.current.inbox.length).toBe(1);
      
      act(() => {
        result.current.removeFromInbox('remove-test');
      });
      
      expect(result.current.inbox.length).toBe(0);
    });
  });

  describe('accessibility compliance', () => {
    it('should not steal focus when messages appear', () => {
      // Create a test element to focus
      const testInput = document.createElement('input');
      testInput.setAttribute('data-testid', 'focus-test');
      document.body.appendChild(testInput);
      testInput.focus();
      
      const initialActiveElement = document.activeElement;
      
      const { result } = renderHook(() => useScoutQueue());
      
      // Enqueue a message
      act(() => {
        result.current.enqueue({
          id: 'focus-test',
          text: 'Should not steal focus',
          priority: 'info'
        });
      });
      
      // Focus should not change
      expect(document.activeElement).toBe(initialActiveElement);
      
      // Enqueue critical message
      act(() => {
        result.current.enqueue({
          id: 'critical-focus-test',
          text: 'Critical should not steal focus',
          priority: 'critical'
        });
      });
      
      // Focus should still not change
      expect(document.activeElement).toBe(initialActiveElement);
      
      // Cleanup
      document.body.removeChild(testInput);
    });

    it('should not interfere with keyboard navigation', () => {
      const { result } = renderHook(() => useScoutQueue());
      
      // Create multiple focusable elements
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      button1.setAttribute('data-testid', 'button-1');
      button2.setAttribute('data-testid', 'button-2');
      
      document.body.appendChild(button1);
      document.body.appendChild(button2);
      
      button1.focus();
      expect(document.activeElement).toBe(button1);
      
      // Enqueue message while tabbing
      act(() => {
        result.current.enqueue({
          id: 'tab-test',
          text: 'Should not interfere with tabbing',
          priority: 'actionable'
        });
      });
      
      // Simulate tab navigation
      button2.focus();
      expect(document.activeElement).toBe(button2);
      
      // Auto-dismiss shouldn't affect focus
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      
      expect(document.activeElement).toBe(button2);
      
      // Cleanup
      document.body.removeChild(button1);
      document.body.removeChild(button2);
    });
  });
});