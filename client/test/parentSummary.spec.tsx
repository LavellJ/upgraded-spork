import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ParentSummary } from '../src/reports/parentSummary';
import type { ProgressEvent } from '../src/progress/events';

// Mock dependencies
vi.mock('../src/progress/events', () => ({
  loadEvents: vi.fn()
}));

vi.mock('../src/roster/model', () => ({
  loadRoster: vi.fn()
}));

vi.mock('../src/guide/assign', () => ({
  getActiveAssignments: vi.fn()
}));

vi.mock('../src/utils/streak', () => ({
  calcStreak: vi.fn()
}));

vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'MMM d') return 'Jan 15';
    if (formatStr === 'MMM d, yyyy') return 'Jan 15, 2025';
    if (formatStr === 'yyyy-MM-dd') return '2025-01-15';
    return 'Jan 15, 2025';
  })
}));

import { loadEvents } from '../src/progress/events';
import { loadRoster } from '../src/roster/model';
import { getActiveAssignments } from '../src/guide/assign';
import { calcStreak } from '../src/utils/streak';

const mockLoadEvents = vi.mocked(loadEvents);
const mockLoadRoster = vi.mocked(loadRoster);
const mockGetActiveAssignments = vi.mocked(getActiveAssignments);
const mockCalcStreak = vi.mocked(calcStreak);

// Mock window.print
const mockPrint = vi.fn();
Object.defineProperty(window, 'print', {
  value: mockPrint,
  writable: true
});

describe('ParentSummary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    mockLoadRoster.mockReturnValue({
      learners: [
        { 
          id: 'learner_1', 
          name: 'Alice Smith', 
          avatarId: 'avatar_1', 
          ageBand: 'primary', 
          createdAt: Date.now(), 
          updatedAt: Date.now() 
        }
      ],
      activeId: 'learner_1'
    });
    
    mockLoadEvents.mockReturnValue([]);
    mockGetActiveAssignments.mockReturnValue([]);
    mockCalcStreak.mockReturnValue(0);
  });

  describe('Component Rendering', () => {
    it('should render with basic learner information', () => {
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('LearnOz Weekly Report')).toBeInTheDocument();
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Week of Jan 13-19, 2025')).toBeInTheDocument();
      expect(screen.getByText('Generated on Jan 15, 2025')).toBeInTheDocument();
    });

    it('should show fallback name for unknown learner', () => {
      mockLoadRoster.mockReturnValue({
        learners: [],
        activeId: 'unknown'
      });
      
      render(<ParentSummary learnerId="unknown_learner" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('Your Child')).toBeInTheDocument();
    });

    it('should display QR code', () => {
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      const qrImage = screen.getByAltText('QR Code to LearnOz');
      expect(qrImage).toBeInTheDocument();
      expect(qrImage).toHaveAttribute('src', expect.stringContaining('qrserver.com'));
    });

    it('should show print and download buttons', () => {
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
    });

    it('should show printing instructions', () => {
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('Printing Instructions')).toBeInTheDocument();
      expect(screen.getByText(/Choose "Print" or "Save as PDF"/)).toBeInTheDocument();
      expect(screen.getByText(/enable "Background graphics"/)).toBeInTheDocument();
    });
  });

  describe('Weekly Accomplishments', () => {
    it('should display completed lessons', () => {
      mockLoadEvents.mockReturnValue([
        {
          kind: 'lesson_finish',
          at: new Date('2025-01-14T10:00:00Z').getTime(),
          lessonId: 'forest.counting.basics',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 480
        },
        {
          kind: 'lesson_finish',
          at: new Date('2025-01-15T11:00:00Z').getTime(),
          lessonId: 'desert.shapes.introduction',
          biomeId: 'desert',
          result: 'pass',
          durationSec: 360
        }
      ] as ProgressEvent[]);
      
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('Lessons Completed (2)')).toBeInTheDocument();
      expect(screen.getByText('Literacy: counting basics')).toBeInTheDocument();
      expect(screen.getByText('Math: shapes introduction')).toBeInTheDocument();
    });

    it('should show message when no lessons completed', () => {
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('No lessons completed this week')).toBeInTheDocument();
    });

    it('should display journal sessions count', () => {
      mockLoadEvents.mockReturnValue([
        {
          kind: 'journal_finish',
          at: new Date('2025-01-14T10:00:00Z').getTime(),
          skillId: 'counting',
          durationSec: 300
        },
        {
          kind: 'journal_finish',
          at: new Date('2025-01-15T11:00:00Z').getTime(),
          skillId: 'shapes',
          durationSec: 240
        }
      ] as ProgressEvent[]);
      
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('Journal sessions completed: 2')).toBeInTheDocument();
    });

    it('should display Scout tips usage', () => {
      mockLoadEvents.mockReturnValue([
        {
          kind: 'scout_analytics',
          at: new Date('2025-01-14T10:00:00Z').getTime(),
          action: 'clicked',
          context: { tip: 'hint_1' }
        },
        {
          kind: 'scout_analytics',
          at: new Date('2025-01-15T11:00:00Z').getTime(),
          action: 'clicked',
          context: { tip: 'hint_2' }
        }
      ] as ProgressEvent[]);
      
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('Scout tips used: 2')).toBeInTheDocument();
    });

    it('should calculate on-task minutes from lesson durations', () => {
      mockLoadEvents.mockReturnValue([
        {
          kind: 'lesson_finish',
          at: new Date('2025-01-14T10:00:00Z').getTime(),
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 480 // 8 minutes
        },
        {
          kind: 'journal_finish',
          at: new Date('2025-01-15T11:00:00Z').getTime(),
          skillId: 'counting',
          durationSec: 300 // 5 minutes
        }
      ] as ProgressEvent[]);
      
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('On-task minutes this week: 13 minutes')).toBeInTheDocument();
    });

    it('should use fallback estimates when duration missing', () => {
      mockLoadEvents.mockReturnValue([
        {
          kind: 'lesson_finish',
          at: new Date('2025-01-14T10:00:00Z').getTime(),
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass'
          // No durationSec
        },
        {
          kind: 'journal_finish',
          at: new Date('2025-01-15T11:00:00Z').getTime(),
          skillId: 'counting'
          // No durationSec
        }
      ] as ProgressEvent[]);
      
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('On-task minutes this week: 13 minutes')).toBeInTheDocument();
    });

    it('should display learning streak', () => {
      mockCalcStreak.mockReturnValue(5);
      
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('Current learning streak:')).toBeInTheDocument();
      expect(screen.getByText('5 days')).toBeInTheDocument();
    });
  });

  describe('Assignments Section', () => {
    it('should display completed assignments', () => {
      mockLoadEvents.mockReturnValue([
        {
          kind: 'lesson_finish',
          at: new Date('2025-01-14T10:00:00Z').getTime(),
          lessonId: 'forest.counting.basics',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 480
        }
      ] as ProgressEvent[]);
      
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('Recently Completed')).toBeInTheDocument();
      expect(screen.getByText('✓ counting basics')).toBeInTheDocument();
    });

    it('should display upcoming assignments', () => {
      mockGetActiveAssignments.mockReturnValue([
        {
          id: 'assignment_1',
          name: 'Week 1 Tasks',
          createdAt: Date.now(),
          dueAt: new Date('2025-01-20').getTime(),
          lessons: [
            {
              lessonId: 'forest.counting.advanced',
              status: 'todo' as const,
              dueAt: new Date('2025-01-18').getTime()
            },
            {
              lessonId: 'desert.shapes.practice',
              status: 'todo' as const
            }
          ]
        }
      ]);
      
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('Coming Up')).toBeInTheDocument();
      expect(screen.getByText('• counting advanced (Due: Jan 15)')).toBeInTheDocument();
      expect(screen.getByText('• shapes practice')).toBeInTheDocument();
    });

    it('should show messages when no assignments exist', () => {
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('No assignments completed this week')).toBeInTheDocument();
      expect(screen.getByText('No upcoming assignments')).toBeInTheDocument();
    });

    it('should limit upcoming assignments to 5 items', () => {
      const manyLessons = Array.from({ length: 10 }, (_, i) => ({
        lessonId: `forest.counting.${i}`,
        status: 'todo' as const
      }));
      
      mockGetActiveAssignments.mockReturnValue([
        {
          id: 'assignment_1',
          name: 'Many Tasks',
          createdAt: Date.now(),
          dueAt: Date.now() + 86400000,
          lessons: manyLessons
        }
      ]);
      
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      const upcomingItems = screen.getAllByText(/• counting/);
      expect(upcomingItems).toHaveLength(5);
    });
  });

  describe('Learning Insights', () => {
    it('should show streak insight for active learners', () => {
      mockCalcStreak.mockReturnValue(7);
      
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('Great consistency! Alice Smith has been learning for 7 consecutive days.')).toBeInTheDocument();
    });

    it('should show focus time insight', () => {
      mockLoadEvents.mockReturnValue([
        {
          kind: 'lesson_finish',
          at: new Date('2025-01-14T10:00:00Z').getTime(),
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 900 // 15 minutes
        }
      ] as ProgressEvent[]);
      
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('Focus time: Spent 15 minutes actively learning this week.')).toBeInTheDocument();
    });

    it('should show Scout usage insight', () => {
      mockLoadEvents.mockReturnValue([
        {
          kind: 'scout_analytics',
          at: new Date('2025-01-14T10:00:00Z').getTime(),
          action: 'clicked',
          context: { tip: 'hint_1' }
        }
      ] as ProgressEvent[]);
      
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('Getting help: Used 1 Scout tips to overcome challenges.')).toBeInTheDocument();
    });

    it('should show encouragement for inactive learners', () => {
      // No events means no activity
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('Encouragement needed: No learning activity this week. Consider setting up a regular learning time together.')).toBeInTheDocument();
    });
  });

  describe('Print Functionality', () => {
    it('should call window.print when print button clicked', () => {
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      const printButton = screen.getByRole('button', { name: /print/i });
      fireEvent.click(printButton);
      
      expect(mockPrint).toHaveBeenCalled();
    });

    it('should call window.print when download PDF button clicked', () => {
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      const downloadButton = screen.getByRole('button', { name: /download pdf/i });
      fireEvent.click(downloadButton);
      
      expect(mockPrint).toHaveBeenCalled();
    });
  });

  describe('Print Stylesheet', () => {
    it('should include print styles in component', () => {
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      const styleElement = document.querySelector('style');
      expect(styleElement).toBeInTheDocument();
      
      const styles = styleElement?.textContent || '';
      expect(styles).toContain('@media print');
      expect(styles).toContain('.no-print');
      expect(styles).toContain('display: none !important');
    });

    it('should have print-specific classes', () => {
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      // Check for no-print class on action buttons
      const printButton = screen.getByRole('button', { name: /print/i });
      expect(printButton.closest('.no-print')).toBeInTheDocument();
      
      // Check for print-specific classes
      expect(document.querySelector('.parent-summary-container')).toBeInTheDocument();
      expect(document.querySelector('.print-header')).toBeInTheDocument();
      expect(document.querySelector('.print-section')).toBeInTheDocument();
    });

    it('should have proper page size and margins for A4', () => {
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      const styleElement = document.querySelector('style');
      const styles = styleElement?.textContent || '';
      
      expect(styles).toContain('@page');
      expect(styles).toContain('size: A4');
      expect(styles).toContain('margin: 1in');
    });

    it('should have grayscale-friendly design elements', () => {
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      const styleElement = document.querySelector('style');
      const styles = styleElement?.textContent || '';
      
      // Check for high contrast elements
      expect(styles).toContain('border-bottom: 2px solid #333');
      expect(styles).toContain('background: #f0f0f0');
      expect(styles).toContain('font-weight: bold');
    });

    it('should prevent page breaks inside sections', () => {
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      const styleElement = document.querySelector('style');
      const styles = styleElement?.textContent || '';
      
      expect(styles).toContain('page-break-inside: avoid');
    });
  });

  describe('Data Formatting', () => {
    it('should format lesson IDs for display', () => {
      mockLoadEvents.mockReturnValue([
        {
          kind: 'lesson_finish',
          at: new Date('2025-01-14T10:00:00Z').getTime(),
          lessonId: 'forest.counting.basic.addition',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 480
        }
      ] as ProgressEvent[]);
      
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('counting basic addition')).toBeInTheDocument();
    });

    it('should map biome IDs to display names', () => {
      mockLoadEvents.mockReturnValue([
        {
          kind: 'lesson_finish',
          at: new Date('2025-01-14T10:00:00Z').getTime(),
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 480
        },
        {
          kind: 'lesson_finish',
          at: new Date('2025-01-15T10:00:00Z').getTime(),
          lessonId: 'desert.shapes.1',
          biomeId: 'desert',
          result: 'pass',
          durationSec: 360
        },
        {
          kind: 'lesson_finish',
          at: new Date('2025-01-16T10:00:00Z').getTime(),
          lessonId: 'ocean.science.1',
          biomeId: 'ocean',
          result: 'pass',
          durationSec: 420
        },
        {
          kind: 'lesson_finish',
          at: new Date('2025-01-17T10:00:00Z').getTime(),
          lessonId: 'night.hass.1',
          biomeId: 'night',
          result: 'pass',
          durationSec: 300
        }
      ] as ProgressEvent[]);
      
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('Literacy:')).toBeInTheDocument();
      expect(screen.getByText('Math:')).toBeInTheDocument();
      expect(screen.getByText('Science:')).toBeInTheDocument();
      expect(screen.getByText('HASS:')).toBeInTheDocument();
    });

    it('should include app URL and footer information', () => {
      render(<ParentSummary learnerId="learner_1" weekStartISO="2025-01-13" />);
      
      expect(screen.getByText('LearnOz - Australian Curriculum Learning Platform')).toBeInTheDocument();
      expect(screen.getByText(/Visit .* or scan the QR code/)).toBeInTheDocument();
    });
  });
});