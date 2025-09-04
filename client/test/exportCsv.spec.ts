import { describe, it, expect } from 'vitest';
import { buildCsv, downloadCsv, getCsvStats } from '../src/guide/exportCsv';
import type { ProgressEvent } from '../src/progress/events';

// V2 Schema imports for testing standardized exports
import { 
  CSV_HEADERS,
  generateTrendsCSV,
  generateWeeklyEngagementCSV,
  generateTeacherDigestCSV,
  type TeacherDigestRow
} from '../src/guide/reports/exportCsv';
import type { CohortSlice } from '../src/progress/cohort';
import type { WeeklyEngagementRow } from '../src/analytics/weeklyEngagement';

describe('CSV export functionality', () => {
  describe('buildCsv', () => {
    it('returns headers and rows correctly', () => {
      const events: ProgressEvent[] = [
        {
          kind: 'lesson_finish',
          at: 1672531200000, // 2023-01-01 00:00:00 UTC
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        },
        {
          kind: 'journal_finish',
          at: 1672617600000, // 2023-01-02 00:00:00 UTC
          skillId: 'math.addition',
          n: 3,
          correct: 2,
          durationSec: 180
        }
      ];

      const csv = buildCsv(events);
      const lines = csv.split('\n');
      
      // Check headers
      expect(lines[0]).toBe('timestamp,date,time,event_type,lesson_id,skill_id,result,duration_sec,questions,correct,notes');
      
      // Check first data row (lesson)
      const row1 = lines[1].split(',');
      expect(row1[0]).toBe('1672531200000'); // timestamp
      expect(row1[1]).toBe('2023-01-01'); // date
      expect(row1[2]).toBe('00:00:00'); // time
      expect(row1[3]).toBe('lesson_finish'); // event_type
      expect(row1[4]).toBe('forest.counting.1'); // lesson_id
      expect(row1[5]).toBe(''); // skill_id (empty for lessons)
      expect(row1[6]).toBe('pass'); // result
      expect(row1[7]).toBe('120'); // duration_sec
      
      // Check second data row (journal)
      const row2 = lines[2].split(',');
      expect(row2[0]).toBe('1672617600000'); // timestamp
      expect(row2[3]).toBe('journal_finish'); // event_type
      expect(row2[4]).toBe(''); // lesson_id (empty for journals)
      expect(row2[5]).toBe('math.addition'); // skill_id
      expect(row2[7]).toBe('180'); // duration_sec
      expect(row2[8]).toBe('3'); // questions
      expect(row2[9]).toBe('2'); // correct
    });

    it('escapes commas in data fields correctly', () => {
      const events: ProgressEvent[] = [
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'forest.complex,lesson.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        }
      ];

      const csv = buildCsv(events);
      const lines = csv.split('\n');
      const row = lines[1];
      
      // Should quote fields containing commas
      expect(row).toContain('"forest.complex,lesson.1"');
    });

    it('escapes newlines in data fields correctly', () => {
      const events: ProgressEvent[] = [
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'forest.lesson\nwith\nnewlines',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        }
      ];

      const csv = buildCsv(events);
      const lines = csv.split('\n');
      const row = lines[1];
      
      // Should quote and escape newlines
      expect(row).toContain('"forest.lesson\nwith\nnewlines"');
    });

    it('escapes double quotes in data fields correctly', () => {
      const events: ProgressEvent[] = [
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'forest."quoted".lesson',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        }
      ];

      const csv = buildCsv(events);
      const lines = csv.split('\n');
      const row = lines[1];
      
      // Should escape quotes by doubling them
      expect(row).toContain('"forest.""quoted"".lesson"');
    });

    it('handles empty events array', () => {
      const csv = buildCsv([]);
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('timestamp,date,time,event_type,lesson_id,skill_id,result,duration_sec,questions,correct,notes');
      expect(lines.length).toBe(1);
    });

    it('handles mixed event types correctly', () => {
      const events: ProgressEvent[] = [
        {
          kind: 'lesson_start',
          at: Date.now(),
          lessonId: 'forest.counting.1',
          biomeId: 'forest'
        },
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        },
        {
          kind: 'journal_start',
          at: Date.now(),
          skillId: 'math.addition'
        },
        {
          kind: 'journal_finish',
          at: Date.now(),
          skillId: 'math.addition',
          n: 5,
          correct: 4,
          durationSec: 200
        }
      ];

      const csv = buildCsv(events);
      const lines = csv.split('\n');
      
      expect(lines.length).toBe(5); // Header + 4 events
      
      // Check lesson_start row
      const startRow = lines[1].split(',');
      expect(startRow[3]).toBe('lesson_start');
      expect(startRow[6]).toBe(''); // No result for start events
      expect(startRow[7]).toBe(''); // No duration for start events
      
      // Check journal_finish row  
      const journalRow = lines[4].split(',');
      expect(journalRow[3]).toBe('journal_finish');
      expect(journalRow[8]).toBe('5'); // questions
      expect(journalRow[9]).toBe('4'); // correct
    });

    it('formats timestamps correctly', () => {
      const testTimestamp = 1672531200000; // 2023-01-01 00:00:00 UTC
      const events: ProgressEvent[] = [
        {
          kind: 'lesson_finish',
          at: testTimestamp,
          lessonId: 'test.lesson',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 60
        }
      ];

      const csv = buildCsv(events);
      const lines = csv.split('\n');
      const row = lines[1].split(',');
      
      expect(row[0]).toBe(testTimestamp.toString()); // Raw timestamp
      expect(row[1]).toBe('2023-01-01'); // Date in YYYY-MM-DD format
      expect(row[2]).toBe('00:00:00'); // Time in HH:mm:ss format
    });
  });

  describe('getCsvStats', () => {
    it('calculates statistics correctly', () => {
      const events: ProgressEvent[] = [
        {
          kind: 'lesson_finish',
          at: 1672531200000, // 2023-01-01
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        },
        {
          kind: 'lesson_finish',
          at: 1672617600000, // 2023-01-02
          lessonId: 'desert.shapes.1',
          biomeId: 'desert',
          result: 'retry',
          durationSec: 90
        },
        {
          kind: 'journal_finish',
          at: 1672704000000, // 2023-01-03
          skillId: 'math.addition',
          n: 3,
          correct: 2,
          durationSec: 180
        }
      ];

      const stats = getCsvStats(events);
      
      expect(stats.totalEvents).toBe(3);
      expect(stats.lessonEvents).toBe(2);
      expect(stats.journalEvents).toBe(1);
      expect(stats.dateRange).toEqual({
        start: '2023-01-01',
        end: '2023-01-03'
      });
    });

    it('handles empty events array', () => {
      const stats = getCsvStats([]);
      
      expect(stats.totalEvents).toBe(0);
      expect(stats.lessonEvents).toBe(0);
      expect(stats.journalEvents).toBe(0);
      expect(stats.dateRange).toBeNull();
    });

    it('handles single event', () => {
      const events: ProgressEvent[] = [
        {
          kind: 'lesson_finish',
          at: 1672531200000,
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        }
      ];

      const stats = getCsvStats(events);
      
      expect(stats.totalEvents).toBe(1);
      expect(stats.lessonEvents).toBe(1);
      expect(stats.journalEvents).toBe(0);
      expect(stats.dateRange).toEqual({
        start: '2023-01-01',
        end: '2023-01-01'
      });
    });

    it('counts different event types correctly', () => {
      const events: ProgressEvent[] = [
        {
          kind: 'lesson_start',
          at: Date.now(),
          lessonId: 'forest.counting.1',
          biomeId: 'forest'
        },
        {
          kind: 'lesson_finish',
          at: Date.now(),
          lessonId: 'forest.counting.1',
          biomeId: 'forest',
          result: 'pass',
          durationSec: 120
        },
        {
          kind: 'journal_start',
          at: Date.now(),
          skillId: 'math.addition'
        },
        {
          kind: 'journal_finish',
          at: Date.now(),
          skillId: 'math.addition',
          n: 3,
          correct: 2,
          durationSec: 180
        }
      ];

      const stats = getCsvStats(events);
      
      expect(stats.totalEvents).toBe(4);
      expect(stats.lessonEvents).toBe(2); // lesson_start + lesson_finish
      expect(stats.journalEvents).toBe(2); // journal_start + journal_finish
    });
  });

  describe('CSV field escaping', () => {
    it('properly quotes fields with special characters', () => {
      const testCases = [
        { input: 'simple', expected: 'simple' },
        { input: 'with,comma', expected: '"with,comma"' },
        { input: 'with\nnewline', expected: '"with\nnewline"' },
        { input: 'with"quote', expected: '"with""quote"' },
        { input: 'with\r\nwindows\nnewlines', expected: '"with\r\nwindows\nnewlines"' },
        { input: 'complex,with"multiple\nspecial chars', expected: '"complex,with""multiple\nspecial chars"' }
      ];

      testCases.forEach(({ input, expected }) => {
        const events: ProgressEvent[] = [
          {
            kind: 'lesson_finish',
            at: Date.now(),
            lessonId: input,
            biomeId: 'forest',
            result: 'pass',
            durationSec: 60
          }
        ];

        const csv = buildCsv(events);
        const lines = csv.split('\n');
        const row = lines[1];
        
        expect(row).toContain(expected);
      });
    });
  });
});

describe('V2 CSV Export Schema', () => {
  describe('CSV_HEADERS constants', () => {
    it('should have stable trends headers', () => {
      const expectedTrendsHeaders = [
        'Week',
        'Week Start (ISO)',
        'Total Learners', 
        'Active Learners',
        'Avg On-Task Minutes',
        'Median On-Task Minutes',
        'Return Within 7 Days (%)',
        'Assignments Done (%)',
        'Assignments Due Soon',
        'Assignments Overdue',
        'Completions per Learner',
        'Streakers (%)'
      ];
      
      expect(CSV_HEADERS.TRENDS).toEqual(expectedTrendsHeaders);
    });

    it('should have stable weekly engagement headers', () => {
      const expectedWeeklyHeaders = [
        'Learner ID',
        'Learner Name',
        'Minutes',
        'Sessions', 
        'Return 7d',
        'Assignments Done',
        'Due Soon',
        'Overdue'
      ];
      
      expect(CSV_HEADERS.WEEKLY_ENGAGEMENT).toEqual(expectedWeeklyHeaders);
    });

    it('should have stable teacher digest headers', () => {
      const expectedDigestHeaders = [
        'Learner ID',
        'Learner Name',
        'Active Minutes',
        'Learning Sessions',
        'Assignments Completed',
        'Due Soon',
        'Overdue',
        'Has Learning Streak'
      ];
      
      expect(CSV_HEADERS.TEACHER_DIGEST).toEqual(expectedDigestHeaders);
    });
  });

  describe('generateTrendsCSV', () => {
    it('should generate CSV with correct headers and formatting', () => {
      const mockSeries: CohortSlice[] = [
        {
          weekStartISO: '2025-01-13',
          learners: 25,
          activeLearners: 22,
          avgOnTaskMins: 45.5,
          medianOnTaskMins: 42.0,
          return7dPct: 85.5,
          assignments: {
            donePct: 75.2,
            dueSoon: 3,
            overdue: 1
          },
          completionsPerLearner: 2.4,
          streakersPct: 68.2
        }
      ];

      const csv = generateTrendsCSV(mockSeries);
      const lines = csv.split('\n');
      
      // Check headers match schema
      const headerLine = lines[0];
      expect(headerLine).toBe(CSV_HEADERS.TRENDS.join(','));
      
      // Check data row contains expected values (using string contains instead of split)
      const dataLine = lines[1];
      expect(dataLine).toContain('"Jan 13-19, 2025"'); // Week display (quoted due to comma)
      expect(dataLine).toContain('2025-01-13'); // ISO date
      expect(dataLine).toContain('25'); // Total learners
      expect(dataLine).toContain('22'); // Active learners
      expect(dataLine).toContain('45.5'); // Avg minutes (1 decimal)
      expect(dataLine).toContain('42.0'); // Median minutes (1 decimal)
      expect(dataLine).toContain('85.5'); // Return % (1 decimal)
      expect(dataLine).toContain('75.2'); // Assignments done % (1 decimal)
      expect(dataLine).toContain('3'); // Due soon (integer)
      expect(dataLine).toContain('1'); // Overdue (integer)
      expect(dataLine).toContain('2.4'); // Completions per learner (1 decimal)
      expect(dataLine).toContain('68.2'); // Streakers % (1 decimal)
    });

    it('should handle empty series', () => {
      const csv = generateTrendsCSV([]);
      expect(csv).toBe('');
    });

    it('should format decimal precision correctly', () => {
      const mockSeries: CohortSlice[] = [
        {
          weekStartISO: '2025-01-13',
          learners: 20,
          activeLearners: 18,
          avgOnTaskMins: 33.456789, // Should round to 1 decimal
          medianOnTaskMins: 30.0,
          return7dPct: 90.555, // Should round to 1 decimal
          assignments: {
            donePct: 80.0,
            dueSoon: 2,
            overdue: 0
          },
          completionsPerLearner: 1.999, // Should round to 1 decimal
          streakersPct: 50.0
        }
      ];

      const csv = generateTrendsCSV(mockSeries);
      const lines = csv.split('\n');
      const dataLine = lines[1];
      
      expect(dataLine).toContain('33.5'); // avgOnTaskMins rounded
      expect(dataLine).toContain('90.6'); // return7dPct rounded  
      expect(dataLine).toContain('2.0'); // completionsPerLearner rounded
    });
  });

  describe('generateWeeklyEngagementCSV', () => {
    it('should generate CSV with correct headers and formatting', () => {
      const mockData: WeeklyEngagementRow[] = [
        {
          learnerId: 'learner_123',
          learnerName: 'Alice Smith',
          minutes: 45,
          sessions: 3,
          return7d: true,
          assignmentsDone: 2,
          dueSoon: 1,
          overdue: 0
        },
        {
          learnerId: 'learner_456',
          learnerName: 'Bob Johnson',
          minutes: 30,
          sessions: 2,
          return7d: false,
          assignmentsDone: 1,
          dueSoon: 2,
          overdue: 1
        }
      ];

      const csv = generateWeeklyEngagementCSV(mockData);
      const lines = csv.split('\n');
      
      // Check headers match schema
      const headers = lines[0].split(',');
      expect(headers).toEqual(CSV_HEADERS.WEEKLY_ENGAGEMENT);
      
      // Check first data row
      const row1 = lines[1].split(',');
      expect(row1[0]).toBe('learner_123'); // Learner ID
      expect(row1[1]).toBe('Alice Smith'); // Learner Name
      expect(row1[2]).toBe('45'); // Minutes
      expect(row1[3]).toBe('3'); // Sessions
      expect(row1[4]).toBe('Yes'); // Return 7d
      expect(row1[5]).toBe('2'); // Assignments Done
      expect(row1[6]).toBe('1'); // Due Soon
      expect(row1[7]).toBe('0'); // Overdue
      
      // Check second data row
      const row2 = lines[2].split(',');
      expect(row2[4]).toBe('No'); // Return 7d (false)
    });

    it('should handle empty data', () => {
      const csv = generateWeeklyEngagementCSV([]);
      expect(csv).toBe('');
    });

    it('should format boolean fields correctly', () => {
      const mockData: WeeklyEngagementRow[] = [
        {
          learnerId: 'test',
          learnerName: 'Test',
          minutes: 0,
          sessions: 0,
          return7d: true,
          assignmentsDone: 0,
          dueSoon: 0,
          overdue: 0
        }
      ];

      const csv = generateWeeklyEngagementCSV(mockData);
      const lines = csv.split('\n');
      const dataRow = lines[1].split(',');
      
      expect(dataRow[4]).toBe('Yes'); // true -> 'Yes'
    });
  });

  describe('generateTeacherDigestCSV', () => {
    it('should generate CSV with correct headers and formatting', () => {
      const mockData: TeacherDigestRow[] = [
        {
          learnerId: 'learner_789',
          name: 'Charlie Brown',
          minutes: 60,
          sessions: 4,
          assignmentsDone: 3,
          dueSoon: 1,
          overdue: 0,
          hasStreak: true
        },
        {
          learnerId: 'learner_101',
          name: 'Diana Prince',
          minutes: 20,
          sessions: 1,
          assignmentsDone: 0,
          dueSoon: 3,
          overdue: 2,
          hasStreak: false
        }
      ];

      const csv = generateTeacherDigestCSV(mockData);
      const lines = csv.split('\n');
      
      // Check headers match schema
      const headers = lines[0].split(',');
      expect(headers).toEqual(CSV_HEADERS.TEACHER_DIGEST);
      
      // Check first data row
      const row1 = lines[1].split(',');
      expect(row1[0]).toBe('learner_789'); // Learner ID
      expect(row1[1]).toBe('Charlie Brown'); // Learner Name
      expect(row1[2]).toBe('60'); // Active Minutes
      expect(row1[3]).toBe('4'); // Learning Sessions
      expect(row1[4]).toBe('3'); // Assignments Completed
      expect(row1[5]).toBe('1'); // Due Soon
      expect(row1[6]).toBe('0'); // Overdue
      expect(row1[7]).toBe('Yes'); // Has Learning Streak
      
      // Check second data row
      const row2 = lines[2].split(',');
      expect(row2[7]).toBe('No'); // Has Learning Streak (false)
    });

    it('should handle empty data', () => {
      const csv = generateTeacherDigestCSV([]);
      expect(csv).toBe('');
    });

    it('should handle special characters in names', () => {
      const mockData: TeacherDigestRow[] = [
        {
          learnerId: 'test',
          name: 'O\'Reilly, "Jane"',
          minutes: 30,
          sessions: 2,
          assignmentsDone: 1,
          dueSoon: 0,
          overdue: 0,
          hasStreak: false
        }
      ];

      const csv = generateTeacherDigestCSV(mockData);
      const lines = csv.split('\n');
      const dataRow = lines[1];
      
      // Should properly escape the name with quotes and apostrophe
      expect(dataRow).toContain('"O\'Reilly, ""Jane"""');
    });
  });

  describe('CSV Format Consistency', () => {
    it('should maintain consistent column count across all schemas', () => {
      // All CSV headers should have consistent structure
      expect(CSV_HEADERS.TRENDS.length).toBe(12);
      expect(CSV_HEADERS.WEEKLY_ENGAGEMENT.length).toBe(8);
      expect(CSV_HEADERS.TEACHER_DIGEST.length).toBe(8);
    });

    it('should have no duplicate column names within schemas', () => {
      // Check for duplicates in each schema
      const trendsSet = new Set(CSV_HEADERS.TRENDS);
      const weeklySet = new Set(CSV_HEADERS.WEEKLY_ENGAGEMENT);
      const digestSet = new Set(CSV_HEADERS.TEACHER_DIGEST);
      
      expect(trendsSet.size).toBe(CSV_HEADERS.TRENDS.length);
      expect(weeklySet.size).toBe(CSV_HEADERS.WEEKLY_ENGAGEMENT.length);
      expect(digestSet.size).toBe(CSV_HEADERS.TEACHER_DIGEST.length);
    });

    it('should maintain header ordering stability (snapshot test)', () => {
      // This test will catch any accidental reordering of columns
      const headerSnapshot = {
        trends: CSV_HEADERS.TRENDS.join(','),
        weeklyEngagement: CSV_HEADERS.WEEKLY_ENGAGEMENT.join(','),
        teacherDigest: CSV_HEADERS.TEACHER_DIGEST.join(',')
      };
      
      expect(headerSnapshot).toMatchSnapshot('csv-headers-v2-schema');
    });
  });
});