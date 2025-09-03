import type { AssignedPathV2 } from './assign';

/**
 * Build an ICS (iCalendar) string for an assignment path
 * Creates a calendar event with the assignment's due date
 */
export function buildAssignmentICS(path: AssignedPathV2): string {
  const now = new Date();
  const dtstamp = formatICSDate(now);
  
  // Use startAt if available, otherwise use createdAt as start time
  const startTime = path.startAt || path.createdAt;
  const dtstart = formatICSDate(new Date(startTime));
  
  // Use dueAt if available, otherwise set end time to 1 hour after start
  const endTime = path.dueAt || (startTime + (60 * 60 * 1000)); // 1 hour default
  const dtend = formatICSDate(new Date(endTime));
  
  // Create a unique UID for this event
  const uid = `assignment-${path.id}@learnoz.app`;
  
  // Build event summary
  const summary = `Assignment: ${path.name}`;
  
  // Build description with lesson details
  const totalLessons = path.lessons.length;
  const completedLessons = path.lessons.filter(l => l.status === 'done').length;
  const description = `Assignment Path: ${path.name}\\n` +
                     `Progress: ${completedLessons}/${totalLessons} lessons completed\\n` +
                     `Priority: ${path.priority || 'normal'}\\n` +
                     `Created: ${new Date(path.createdAt).toLocaleDateString()}`;
  
  // Build the ICS content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LearnOz//Assignment Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `PRIORITY:${getPriorityNumber(path.priority)}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\\r\\n');
  
  return icsContent;
}

/**
 * Format a Date object to ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Convert priority string to ICS priority number (1-9, where 1 is highest)
 */
function getPriorityNumber(priority?: string): number {
  switch (priority) {
    case 'high': return 3;
    case 'normal': return 5;
    case 'low': return 7;
    default: return 5;
  }
}

/**
 * Download an ICS file for an assignment
 */
export function downloadAssignmentICS(path: AssignedPathV2): void {
  try {
    const icsContent = buildAssignmentICS(path);
    
    // Create blob with ICS content
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    
    // Create download URL
    const url = URL.createObjectURL(blob);
    
    // Create temporary link element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `assignment-${path.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.ics`;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download ICS file:', error);
    throw new Error('Failed to generate calendar file');
  }
}

/**
 * Check if the browser supports downloading files
 */
export function canDownloadICS(): boolean {
  return typeof document !== 'undefined' && 
         typeof URL !== 'undefined' && 
         typeof Blob !== 'undefined';
}