import { describe, it, expect, beforeEach } from 'vitest';
import { renderParentEmail, type ParentSummaryParams } from '../../server/emailTemplates/parentSummary';

describe('Parent Summary Email Template', () => {
  const mockSummaryData: ParentSummaryParams = {
    learnerName: 'Alice Johnson',
    weekStartISO: '2025-01-13',
    minutes: 45,
    sessions: 3,
    streak: { current: 5, best: 12 },
    accomplishments: [
      'Completed "Addition with Regrouping"',
      'Finished "Reading Comprehension: Animals"',
      'Mastered "Shapes and Patterns"'
    ],
    nextSteps: [
      'Try "Subtraction with Regrouping"',
      'Explore "Writing Stories: Beginning, Middle, End"'
    ],
    optOutLink: 'https://example.com/unsubscribe?token=abc123'
  };

  describe('Email Generation', () => {
    it('should generate email with correct subject line', () => {
      const { subject, html, text } = renderParentEmail(mockSummaryData);
      
      expect(subject).toContain('Alice Johnson');
      expect(subject).toContain('Jan 13');
      expect(subject).toMatch(/Learning Summary/);
    });

    it('should include learner name in both HTML and text versions', () => {
      const { html, text } = renderParentEmail(mockSummaryData);
      
      expect(html).toContain('Alice Johnson');
      expect(text).toContain('Alice Johnson');
    });

    it('should format learning time correctly', () => {
      const { html, text } = renderParentEmail(mockSummaryData);
      
      // 45 minutes should be formatted as "45 minutes"
      expect(html).toContain('45 minutes');
      expect(text).toContain('45 minutes');
    });

    it('should format hours and minutes correctly for longer durations', () => {
      const dataWithHours = {
        ...mockSummaryData,
        minutes: 125 // 2 hours 5 minutes
      };
      
      const { html, text } = renderParentEmail(dataWithHours);
      
      expect(html).toContain('2 hours 5 minutes');
      expect(text).toContain('2 hours 5 minutes');
    });

    it('should handle exact hours correctly', () => {
      const dataWithExactHours = {
        ...mockSummaryData,
        minutes: 120 // 2 hours exactly
      };
      
      const { html, text } = renderParentEmail(dataWithExactHours);
      
      expect(html).toContain('2 hours');
      expect(text).toContain('2 hours');
      expect(html).not.toContain('0 minutes');
    });

    it('should display accomplishments list', () => {
      const { html, text } = renderParentEmail(mockSummaryData);
      
      mockSummaryData.accomplishments.forEach(accomplishment => {
        expect(html).toContain(accomplishment);
        expect(text).toContain(accomplishment);
      });
    });

    it('should display next steps', () => {
      const { html, text } = renderParentEmail(mockSummaryData);
      
      mockSummaryData.nextSteps.forEach(step => {
        expect(html).toContain(step);
        expect(text).toContain(step);
      });
    });

    it('should show streak information', () => {
      const { html, text } = renderParentEmail(mockSummaryData);
      
      expect(html).toContain('5'); // current streak
      expect(html).toContain('12'); // best streak
      expect(text).toContain('5');
      expect(text).toContain('12');
    });

    it('should show fire emoji for streaks >= 3', () => {
      const { html } = renderParentEmail(mockSummaryData);
      
      expect(html).toContain('🔥 On Fire!');
    });

    it('should not show fire emoji for streaks < 3', () => {
      const dataWithLowStreak = {
        ...mockSummaryData,
        streak: { current: 2, best: 8 }
      };
      
      const { html } = renderParentEmail(dataWithLowStreak);
      
      expect(html).not.toContain('🔥 On Fire!');
    });

    it('should include opt-out link when provided', () => {
      const { html, text } = renderParentEmail(mockSummaryData);
      
      expect(html).toContain(mockSummaryData.optOutLink!);
      expect(text).toContain(mockSummaryData.optOutLink!);
    });

    it('should work without opt-out link', () => {
      const dataWithoutOptOut = {
        ...mockSummaryData,
        optOutLink: undefined
      };
      
      expect(() => {
        const { html, text } = renderParentEmail(dataWithoutOptOut);
        expect(html).toBeTruthy();
        expect(text).toBeTruthy();
      }).not.toThrow();
    });

    it('should handle empty accomplishments gracefully', () => {
      const dataWithNoAccomplishments = {
        ...mockSummaryData,
        accomplishments: []
      };
      
      const { html, text } = renderParentEmail(dataWithNoAccomplishments);
      
      expect(html).toContain('No lessons completed this week');
      expect(text).toContain('No lessons completed this week');
    });

    it('should handle empty next steps gracefully', () => {
      const dataWithNoNextSteps = {
        ...mockSummaryData,
        nextSteps: []
      };
      
      const { html, text } = renderParentEmail(dataWithNoNextSteps);
      
      expect(html).toBeTruthy();
      expect(text).toBeTruthy();
      // Should not contain next steps section when empty
      expect(html).not.toContain('🎯 Up Next');
    });
  });

  describe('Week Range Formatting', () => {
    it('should format week range correctly', () => {
      const { html, text } = renderParentEmail(mockSummaryData);
      
      // Week starting 2025-01-13 should show as "Jan 13 - Jan 19, 2025"
      expect(html).toContain('Jan 13');
      expect(html).toContain('Jan 19, 2025');
      expect(text).toContain('Jan 13');
      expect(text).toContain('Jan 19, 2025');
    });

    it('should handle cross-month weeks', () => {
      const crossMonthData = {
        ...mockSummaryData,
        weekStartISO: '2025-01-27' // Week spans Jan 27 - Feb 2
      };
      
      const { html, text } = renderParentEmail(crossMonthData);
      
      expect(html).toContain('Jan 27');
      expect(html).toContain('Feb 2, 2025');
      expect(text).toContain('Jan 27');
      expect(text).toContain('Feb 2, 2025');
    });
  });

  describe('Best Streak Display', () => {
    it('should show best streak section when best > current and best >= 3', () => {
      const { html, text } = renderParentEmail(mockSummaryData);
      
      expect(html).toContain('🏆 Best Learning Streak');
      expect(html).toContain('personal best is 12 days');
      expect(text).toContain('PERSONAL BEST STREAK: 12 days');
    });

    it('should not show best streak section when current equals best', () => {
      const dataWithCurrentEqualsBest = {
        ...mockSummaryData,
        streak: { current: 12, best: 12 }
      };
      
      const { html } = renderParentEmail(dataWithCurrentEqualsBest);
      
      expect(html).not.toContain('🏆 Best Learning Streak');
    });

    it('should not show best streak section when best < 3', () => {
      const dataWithLowBest = {
        ...mockSummaryData,
        streak: { current: 1, best: 2 }
      };
      
      const { html } = renderParentEmail(dataWithLowBest);
      
      expect(html).not.toContain('🏆 Best Learning Streak');
    });
  });

  describe('Email Structure', () => {
    it('should have valid HTML structure', () => {
      const { html } = renderParentEmail(mockSummaryData);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');
      expect(html).toMatch(/<title>.*<\/title>/);
    });

    it('should include viewport meta tag for mobile', () => {
      const { html } = renderParentEmail(mockSummaryData);
      
      expect(html).toContain('name="viewport"');
      expect(html).toContain('width=device-width, initial-scale=1');
    });

    it('should include proper CSS for email clients', () => {
      const { html } = renderParentEmail(mockSummaryData);
      
      expect(html).toContain('<style>');
      expect(html).toContain('font-family');
      expect(html).toContain('max-width');
      expect(html).toContain('@media print');
    });

    it('should have proper text fallback', () => {
      const { text } = renderParentEmail(mockSummaryData);
      
      expect(text).toContain('LearnOz Learning Summary');
      expect(text).toContain('LEARNING STATS:');
      expect(text).toContain('THIS WEEK\'S ACCOMPLISHMENTS:');
      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
    });
  });
});