import { describe, it, expect } from 'vitest';
import { buildCsv, downloadCsv, getCsvStats } from '../src/guide/exportCsv';
import type { ProgressEvent } from '../src/progress/events';

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