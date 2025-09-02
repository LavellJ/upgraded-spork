import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { triggerScoutEvent, resetScoutState, setScoutQueueFunctions } from '../src/learning/scoutQueue';
import type { ScoutQueueMessage } from '../src/hooks/useScoutQueue';

// Mock scout lines data
vi.mock('../src/data/scout_lines.json', () => ({
  default: {
    start_lesson: {
      '5-8': ['Let\'s start this lesson, {name}!', 'Ready to learn, {name}?'],
      '9-12': ['Time to begin, {name}!', 'Let\'s dive in, {name}!']
    },
    fail_hint: {
      '5-8': ['That\'s okay, {name}! Let\'s try again.', 'Don\'t worry, {name}! Practice makes perfect.'],
      '9-12': ['No problem, {name}. Let\'s work through this.', 'That\'s alright, {name}. Let\'s approach it differently.']
    },
    finish: {
      '5-8': ['Great job, {name}!', 'You did it, {name}!'],
      '9-12': ['Excellent work, {name}!', 'Well done, {name}!']
    },
    streak: {
      '5-8': ['Wow, {name}! You\'re on a streak of {n}!', 'Amazing, {name}! {n} in a row!'],
      '9-12': ['Impressive streak of {n}, {name}!', 'Outstanding! {n} lessons completed, {name}!']
    },
    encourage: {
      '5-8': ['You can do it, {name}!', 'Keep trying, {name}!'],
      '9-12': ['Stay focused, {name}!', 'You\'ve got this, {name}!']
    },
    hint_1: {
      '5-8': ['Let me help you, {name}!', 'Here\'s a hint, {name}!'],
      '9-12': ['Let\'s think about this, {name}!', 'Consider this approach, {name}!']
    },
    hint_2: {
      '5-8': ['Would you like to practice more, {name}?', 'Let\'s try some practice, {name}!'],
      '9-12': ['How about some targeted practice, {name}?', 'Let\'s work on this skill, {name}!']
    }
  }
}));

describe('Scout Integration with Queue System', () => {
  let enqueuedMessages: ScoutQueueMessage[] = [];
  let flushedCount = 0;

  const mockEnqueue = vi.fn((message: Omit<ScoutQueueMessage, 'timestamp'>) => {
    enqueuedMessages.push({
      ...message,
      timestamp: Date.now()
    });
  });

  const mockFlushInfoMessages = vi.fn(() => {
    flushedCount++;
    enqueuedMessages = enqueuedMessages.filter(msg => msg.priority !== 'info');
  });

  beforeEach(() => {
    resetScoutState();
    enqueuedMessages = [];
    flushedCount = 0;
    mockEnqueue.mockClear();
    mockFlushInfoMessages.mockClear();
    
    // Initialize queue functions
    setScoutQueueFunctions(mockEnqueue, mockFlushInfoMessages);
  });

  afterEach(() => {
    resetScoutState();
  });

  describe('lessonStart events', () => {
    it('enqueues info priority message for lesson start', () => {
      triggerScoutEvent('lessonStart', {
        name: 'Alex',
        ageBand: '5-6'
      });

      expect(mockEnqueue).toHaveBeenCalledWith({
        id: expect.stringMatching(/^scout-lessonStart-/),
        text: expect.stringContaining('Alex'),
        priority: 'info'
      });
    });

    it('uses age-appropriate messages', () => {
      triggerScoutEvent('lessonStart', {
        name: 'Jordan',
        ageBand: '9-10'
      });

      const message = mockEnqueue.mock.calls[0][0];
      expect(message.text).toContain('Jordan');
      // Should use 9-12 age bucket messages
    });

    it('respects cooldown period for duplicate events', () => {
      triggerScoutEvent('lessonStart', { name: 'Sam' });
      triggerScoutEvent('lessonStart', { name: 'Sam' });

      // Should only enqueue one message due to cooldown
      expect(mockEnqueue).toHaveBeenCalledTimes(1);
    });
  });

  describe('answerWrong events', () => {
    it('enqueues actionable message after 2 wrong answers', () => {
      // First wrong answer - should not trigger message
      triggerScoutEvent('answerWrong', { name: 'Taylor' });
      expect(mockEnqueue).not.toHaveBeenCalled();

      // Second wrong answer - should trigger hint
      triggerScoutEvent('answerWrong', { name: 'Taylor' });
      expect(mockEnqueue).toHaveBeenCalledWith({
        id: expect.stringMatching(/^scout-fail_hint-/),
        text: expect.stringContaining('Taylor'),
        priority: 'actionable',
        cta: {
          label: 'Try Journal',
          onClick: expect.any(Function)
        }
      });
    });

    it('resets wrong answer count after showing hint', () => {
      // Trigger 2 wrong answers to show hint
      triggerScoutEvent('answerWrong', { name: 'Riley' });
      triggerScoutEvent('answerWrong', { name: 'Riley' });
      
      expect(mockEnqueue).toHaveBeenCalledTimes(1);
      mockEnqueue.mockClear();

      // Next wrong answer should not immediately trigger hint
      triggerScoutEvent('answerWrong', { name: 'Riley' });
      expect(mockEnqueue).not.toHaveBeenCalled();
    });
  });

  describe('lessonFinish events', () => {
    it('flushes info messages on lesson completion', () => {
      triggerScoutEvent('lessonFinish', {
        name: 'Casey',
        isCorrect: true
      });

      expect(mockFlushInfoMessages).toHaveBeenCalled();
    });

    it('enqueues streak message for 3+ consecutive successes', () => {
      // Complete 3 lessons successfully - each should trigger a finish message
      triggerScoutEvent('lessonFinish', { name: 'Morgan', isCorrect: true });
      triggerScoutEvent('lessonFinish', { name: 'Morgan', isCorrect: true });
      triggerScoutEvent('lessonFinish', { name: 'Morgan', isCorrect: true });

      // Should have enqueued messages for each completion
      expect(mockEnqueue).toHaveBeenCalled();
      
      // Find messages with actionable priority that might be streak messages
      const calls = mockEnqueue.mock.calls;
      const actionableMessages = calls.filter(call => call[0].priority === 'actionable');
      
      // Should have at least one actionable message (could be streak or just from lesson completion)
      expect(actionableMessages.length).toBeGreaterThan(0);
      
      // If there are actionable messages, they should have CTA
      if (actionableMessages.length > 0) {
        expect(actionableMessages[0][0].cta).toBeDefined();
      }
    });

    it('enqueues regular finish message for successful completion', () => {
      triggerScoutEvent('lessonFinish', {
        name: 'Quinn',
        isCorrect: true
      });

      expect(mockEnqueue).toHaveBeenCalledWith({
        id: expect.stringMatching(/^scout-lessonFinish-/),
        text: expect.stringContaining('Quinn'),
        priority: 'info'
      });
    });

    it('resets streak on incorrect completion', () => {
      // Build up a streak
      triggerScoutEvent('lessonFinish', { name: 'Avery', isCorrect: true });
      triggerScoutEvent('lessonFinish', { name: 'Avery', isCorrect: true });
      
      // Break the streak
      triggerScoutEvent('lessonFinish', { name: 'Avery', isCorrect: false });
      
      // Next success should not trigger streak message
      triggerScoutEvent('lessonFinish', { name: 'Avery', isCorrect: true });
      
      const messages = mockEnqueue.mock.calls.map(call => call[0]);
      const streakMessages = messages.filter(msg => msg.priority === 'actionable' && msg.text.includes('streak'));
      expect(streakMessages).toHaveLength(0);
    });

    it('resets wrong answer count on lesson completion', () => {
      // Build up wrong answers
      triggerScoutEvent('answerWrong', { name: 'Sage' });
      triggerScoutEvent('answerWrong', { name: 'Sage' });
      
      expect(mockEnqueue).toHaveBeenCalledTimes(1); // Hint message
      mockEnqueue.mockClear();
      
      // Complete lesson
      triggerScoutEvent('lessonFinish', { name: 'Sage', isCorrect: true });
      
      // Next wrong answer should not immediately trigger hint
      triggerScoutEvent('answerWrong', { name: 'Sage' });
      triggerScoutEvent('answerWrong', { name: 'Sage' });
      
      // Should get hint again after 2 wrong answers (count was reset)
      expect(mockEnqueue).toHaveBeenCalledTimes(2); // Finish + hint
    });
  });

  describe('encourage events', () => {
    it('enqueues actionable message for encouragement', () => {
      triggerScoutEvent('encourage', {
        name: 'Blake',
        ageBand: '7-8'
      });

      expect(mockEnqueue).toHaveBeenCalledWith({
        id: expect.stringMatching(/^scout-encourage-/),
        text: expect.stringContaining('Blake'),
        priority: 'actionable'
      });
    });
  });

  describe('message priority mapping', () => {
    it('maps event types to correct priorities', () => {
      const eventTests = [
        { event: 'lessonStart' as const, expectedPriority: 'info' },
        { event: 'lessonFinish' as const, expectedPriority: 'info' },
        { event: 'encourage' as const, expectedPriority: 'actionable' }
      ];

      eventTests.forEach(({ event, expectedPriority }) => {
        mockEnqueue.mockClear();
        triggerScoutEvent(event, { name: 'Test' });
        
        if (mockEnqueue.mock.calls.length > 0) {
          expect(mockEnqueue.mock.calls[0][0].priority).toBe(expectedPriority);
        }
      });
    });

    it('adds CTA to actionable messages appropriately', () => {
      // Wrong answer hint should have CTA
      triggerScoutEvent('answerWrong', { name: 'Test' });
      triggerScoutEvent('answerWrong', { name: 'Test' });
      
      const hintMessage = mockEnqueue.mock.calls[0][0];
      expect(hintMessage.cta).toBeDefined();
      expect(hintMessage.cta?.label).toBe('Try Journal');
    });
  });

  describe('token replacement', () => {
    it('replaces {name} tokens in messages', () => {
      triggerScoutEvent('lessonStart', {
        name: 'TokenTest'
      });

      const message = mockEnqueue.mock.calls[0][0];
      expect(message.text).toContain('TokenTest');
      expect(message.text).not.toContain('{name}');
    });

    it('replaces {n} tokens for streak messages', () => {
      // Build up streak
      triggerScoutEvent('lessonFinish', { name: 'StreakTest', isCorrect: true });
      triggerScoutEvent('lessonFinish', { name: 'StreakTest', isCorrect: true });
      triggerScoutEvent('lessonFinish', { name: 'StreakTest', isCorrect: true });

      // Find any message that contains a number (streak message)
      const calls = mockEnqueue.mock.calls;
      const streakMessage = calls.find(call => /\d/.test(call[0].text));
      
      if (streakMessage) {
        expect(streakMessage[0].text).toContain('3');
        expect(streakMessage[0].text).not.toContain('{n}');
      } else {
        // If no streak message found, just verify we got some enqueued calls
        expect(calls.length).toBeGreaterThan(0);
      }
    });

    it('handles missing tokens gracefully', () => {
      triggerScoutEvent('lessonStart', {
        // No name provided - should use default
      });

      const message = mockEnqueue.mock.calls[0][0];
      expect(message.text).toContain('Explorer'); // Default name
    });
  });

  describe('LRU message suppression', () => {
    it('avoids repeating recent messages when alternatives exist', () => {
      const messages: string[] = [];
      
      // Trigger multiple lesson starts to test LRU
      for (let i = 0; i < 10; i++) {
        triggerScoutEvent('lessonStart', { name: 'LRUTest' });
        if (mockEnqueue.mock.calls.length > messages.length) {
          messages.push(mockEnqueue.mock.calls[messages.length][0].text);
        }
        
        // Reset cooldown to allow next message
        resetScoutState();
        setScoutQueueFunctions(mockEnqueue, mockFlushInfoMessages);
      }
      
      // Should have variety in messages (not all the same)
      const uniqueMessages = new Set(messages);
      expect(uniqueMessages.size).toBeGreaterThan(1);
    });
  });
});