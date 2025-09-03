import type { ProgressEvent } from '../progress';

/**
 * Get the current active learner ID from roster for CSV export
 */
function getCurrentLearnerId(): string {
  try {
    const rosterData = localStorage.getItem('qi.roster.v1');
    if (rosterData) {
      const roster = JSON.parse(rosterData);
      return roster.activeId || 'unknown';
    }
  } catch (error) {
    console.warn('Failed to get current learner ID for CSV export:', error);
  }
  return 'unknown';
}

export interface CsvExportOptions {
  includeHeaders?: boolean;
  dateFormat?: 'iso' | 'local';
  filename?: string;
}

export function buildCsv(events: ProgressEvent[], options: CsvExportOptions = {}): string {
  const {
    includeHeaders = true,
    dateFormat = 'iso'
  } = options;

  const headers = [
    'dateISO',
    'kind', 
    'biomeId',
    'lessonId',
    'skillId',
    'durationSec',
    'result',
    'n',
    'correct',
    'noticeId',
    'action',
    'actor',
    'learnerId'
  ];

  const rows: string[] = [];

  if (includeHeaders) {
    rows.push(headers.join(','));
  }

  events.forEach(event => {
    const row: (string | number | undefined)[] = [
      // dateISO
      dateFormat === 'iso' 
        ? new Date(event.at).toISOString()
        : new Date(event.at).toLocaleString(),
      
      // kind
      event.kind,
      
      // biomeId
      'biomeId' in event ? event.biomeId : '',
      
      // lessonId  
      'lessonId' in event ? event.lessonId : '',
      
      // skillId
      'skillId' in event ? event.skillId : '',
      
      // durationSec
      'durationSec' in event ? event.durationSec : '',
      
      // result
      'result' in event ? event.result : '',
      
      // n (number of questions in journal)
      'n' in event ? event.n : '',
      
      // correct (number of correct answers in journal)
      'correct' in event ? event.correct : '',
      
      // noticeId (for guide_ack events)
      'noticeId' in event ? event.noticeId : '',
      
      // action (for guide_ack events)
      'action' in event && event.kind === 'guide_ack' ? event.action : '',
      
      // actor (for guide_ack events)
      'actor' in event ? event.actor : '',
      
      // learnerId (from current active learner in roster)
      getCurrentLearnerId()
    ];

    // Escape values and handle commas/quotes
    const escapedRow = row.map(value => {
      if (value === undefined || value === null) {
        return '';
      }
      
      const stringValue = String(value);
      
      // If the value contains commas, quotes, or newlines, wrap in quotes and escape quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });

    rows.push(escapedRow.join(','));
  });

  return rows.join('\n');
}

export function downloadCsv(events: ProgressEvent[], options: CsvExportOptions = {}): void {
  const {
    filename = 'quest-island-progress.csv'
  } = options;

  const csvContent = buildCsv(events, options);
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    // Create object URL and download
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up object URL
    URL.revokeObjectURL(url);
  } else {
    // Fallback for older browsers
    const url = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    window.open(url);
  }
}

export function getCsvStats(events: ProgressEvent[]): {
  totalEvents: number;
  lessonEvents: number;
  journalEvents: number;
  guideAckEvents: number;
  dateRange: { start: string; end: string } | null;
} {
  const lessonEvents = events.filter(e => 
    e.kind === 'lesson_start' || e.kind === 'lesson_finish'
  ).length;
  
  const journalEvents = events.filter(e => 
    e.kind === 'journal_start' || e.kind === 'journal_finish'
  ).length;
  
  const guideAckEvents = events.filter(e => e.kind === 'guide_ack').length;

  let dateRange: { start: string; end: string } | null = null;
  
  if (events.length > 0) {
    const timestamps = events.map(e => e.at).sort((a, b) => a - b);
    dateRange = {
      start: new Date(timestamps[0]).toLocaleDateString(),
      end: new Date(timestamps[timestamps.length - 1]).toLocaleDateString()
    };
  }

  return {
    totalEvents: events.length,
    lessonEvents,
    journalEvents,
    guideAckEvents,
    dateRange
  };
}