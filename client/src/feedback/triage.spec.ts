/**
 * Tests for feedback triage system
 * Validates deduplication and severity bucketing logic
 */

import { buildTriage, type TriageItem } from './triage';
import type { Feedback } from './model';

// Mock feedback data for testing
const createMockFeedback = (overrides: Partial<Feedback> = {}): Feedback => ({
  id: `feedback-${Date.now()}-${Math.random()}`,
  at: Date.now(),
  kind: 'bug',
  text: 'Test feedback',
  meta: {
    appVersion: '1.0.0-test',
    userAgent: 'Test Agent',
    locale: 'en-US',
  },
  ...overrides,
});

describe('Triage System', () => {
  describe('buildTriage', () => {
    it('should deduplicate feedback with similar titles', () => {
      const feedback1 = createMockFeedback({
        kind: 'bug',
        text: 'Cannot save my work',
        at: 1000,
      });
      
      const feedback2 = createMockFeedback({
        kind: 'bug', 
        text: 'Cannot save my work!',
        at: 2000,
      });
      
      const feedback3 = createMockFeedback({
        kind: 'bug',
        text: 'cannot save my work...',
        at: 3000,
      });

      const result = buildTriage([feedback1, feedback2, feedback3], []);

      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(3);
      expect(result[0].title).toBe('Cannot save my work');
      expect(result[0].firstSeenAt).toBe(1000);
      expect(result[0].lastSeenAt).toBe(3000);
    });

    it('should assign correct severity based on keywords', () => {
      const p0Feedback = createMockFeedback({
        text: 'App crash when I click submit button',
        kind: 'bug',
      });

      const p1Feedback = createMockFeedback({
        text: 'I am stuck on this lesson and cannot proceed',
        kind: 'bug',
      });

      const p2Feedback = createMockFeedback({
        text: 'The design could be improved',
        kind: 'idea',
      });

      const result = buildTriage([p0Feedback, p1Feedback, p2Feedback], []);

      const p0Item = result.find(item => item.title.includes('crash'));
      const p1Item = result.find(item => item.title.includes('stuck'));
      const p2Item = result.find(item => item.title.includes('design'));

      expect(p0Item?.severity).toBe('p0');
      expect(p1Item?.severity).toBe('p1'); 
      expect(p2Item?.severity).toBe('p2');
    });

    it('should infer area based on keywords', () => {
      const testCases = [
        { text: 'Scout helper is not working', expectedArea: 'scout' },
        { text: 'Journal reflection prompt disappeared', expectedArea: 'journal' },
        { text: 'Assignment due date is wrong', expectedArea: 'assignments' },
        { text: 'Progress report is broken', expectedArea: 'reports' },
        { text: 'Class roster import failed', expectedArea: 'classroom' },
        { text: 'Login not working properly', expectedArea: 'auth' },
        { text: 'Video captions are missing', expectedArea: 'media' },
        { text: 'Random issue with colors', expectedArea: 'other' },
      ];

      const feedbacks = testCases.map(testCase => 
        createMockFeedback({ text: testCase.text })
      );

      const result = buildTriage(feedbacks, []);

      testCases.forEach((testCase, index) => {
        const item = result.find(item => item.title.includes(testCase.text.split(' ')[0]));
        expect(item?.area).toBe(testCase.expectedArea);
      });
    });

    it('should sort by severity then count', () => {
      const feedbacks = [
        // P2 with high count
        createMockFeedback({ text: 'Feature request A', kind: 'idea' }),
        createMockFeedback({ text: 'Feature request A', kind: 'idea' }),
        createMockFeedback({ text: 'Feature request A', kind: 'idea' }),
        
        // P1 with low count
        createMockFeedback({ text: 'I am stuck here', kind: 'bug' }),
        
        // P0 with medium count  
        createMockFeedback({ text: 'App crashes frequently', kind: 'bug' }),
        createMockFeedback({ text: 'App crashes frequently', kind: 'bug' }),
      ];

      const result = buildTriage(feedbacks, []);

      expect(result).toHaveLength(3);
      // P0 should come first regardless of count
      expect(result[0].severity).toBe('p0');
      expect(result[0].title).toContain('crashes');
      
      // Then P1
      expect(result[1].severity).toBe('p1');
      expect(result[1].title).toContain('stuck');
      
      // Then P2
      expect(result[2].severity).toBe('p2');
      expect(result[2].title).toContain('Feature request');
    });

    it('should normalize different feedback kinds correctly', () => {
      const feedbacks = [
        createMockFeedback({ kind: 'bug', text: 'Bug report' }),
        createMockFeedback({ kind: 'idea', text: 'Feature idea' }),
        createMockFeedback({ kind: 'confusion', text: 'I am confused' }),
        // Test unknown kind fallback
        createMockFeedback({ kind: 'unknown' as any, text: 'Unknown type' }),
      ];

      const result = buildTriage(feedbacks, []);

      expect(result).toHaveLength(4);
      
      const bugItem = result.find(item => item.title.includes('Bug'));
      const ideaItem = result.find(item => item.title.includes('Feature'));
      const confusionItem = result.find(item => item.title.includes('confused'));
      const unknownItem = result.find(item => item.title.includes('Unknown'));

      expect(bugItem?.kind).toBe('bug');
      expect(ideaItem?.kind).toBe('idea');
      expect(confusionItem?.kind).toBe('confusion');
      expect(unknownItem?.kind).toBe('bug'); // fallback to bug
    });

    it('should handle empty input arrays', () => {
      const result = buildTriage([], []);
      expect(result).toEqual([]);
    });

    it('should combine feed and issues arrays', () => {
      const feed = [createMockFeedback({ text: 'From feed', kind: 'bug' })];
      const issues = [createMockFeedback({ text: 'From issues', kind: 'bug' })];

      const result = buildTriage(feed, issues);

      expect(result).toHaveLength(2);
      expect(result.some(item => item.title.includes('feed'))).toBe(true);
      expect(result.some(item => item.title.includes('issues'))).toBe(true);
    });

    it('should generate appropriate titles from long text', () => {
      const longText = 'This is a very long feedback text that should be truncated properly when generating the title for the triage item because it exceeds our length limits.';
      
      const feedback = createMockFeedback({ text: longText });
      const result = buildTriage([feedback], []);

      expect(result).toHaveLength(1);
      expect(result[0].title.length).toBeLessThanOrEqual(63); // 60 chars + "..."
      expect(result[0].title).toContain('...');
    });

    it('should preserve sample with most context', () => {
      const shortFeedback = createMockFeedback({
        text: 'Short bug',
        kind: 'bug',
        at: 1000,
      });

      const detailedFeedback = createMockFeedback({
        text: 'Short bug with much more detailed context and information',
        kind: 'bug', 
        at: 2000,
      });

      const result = buildTriage([shortFeedback, detailedFeedback], []);

      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(2);
      expect(result[0].sample?.text).toBe(detailedFeedback.text);
    });
  });

  describe('helper functions', () => {
    it('should correctly classify P0 severity keywords', () => {
      const p0Keywords = ['crash', 'cannot', 'broken', 'error', 'failed', 'not working'];
      
      p0Keywords.forEach(keyword => {
        const feedback = createMockFeedback({ text: `App ${keyword} when saving` });
        const result = buildTriage([feedback], []);
        expect(result[0].severity).toBe('p0');
      });
    });

    it('should correctly classify P1 severity keywords', () => {
      const p1Keywords = ['stuck', 'slow', 'confusing', 'difficult', 'problem'];
      
      p1Keywords.forEach(keyword => {
        const feedback = createMockFeedback({ text: `This is very ${keyword}` });
        const result = buildTriage([feedback], []);
        expect(result[0].severity).toBe('p1');
      });
    });

    it('should default to P2 for unknown severity', () => {
      const feedback = createMockFeedback({ text: 'Nice colors in the interface' });
      const result = buildTriage([feedback], []);
      expect(result[0].severity).toBe('p2');
    });
  });
});