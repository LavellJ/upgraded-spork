/**
 * Utility functions for cohort and progress analysis
 * Provides week calculation and date manipulation helpers
 */

/**
 * Get the week start (Monday) for a given timestamp in local timezone
 * @param ts - Timestamp in milliseconds (default: current time)
 * @returns ISO date string (YYYY-MM-DD) for Monday of that week
 */
export function weekStartISO(ts = Date.now()): string {
  const date = new Date(ts);
  
  // Get Monday of the week containing the given date
  const dayOfWeek = date.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
  
  const monday = new Date(date);
  monday.setDate(date.getDate() + daysToMonday);
  
  // Set to start of day in local timezone
  monday.setHours(0, 0, 0, 0);
  
  return monday.toISOString().split('T')[0];
}

/**
 * Get array of previous week start dates going backwards from a given week
 * @param weekStartISO - ISO date string for a Monday (e.g., "2025-01-13")
 * @param n - Number of previous weeks to return
 * @returns Array of ISO date strings for Monday dates, in chronological order (earliest first)
 */
export function previousWeeks(weekStartISO: string, n: number): string[] {
  const weeks: string[] = [];
  const startDate = new Date(weekStartISO);
  
  for (let i = n; i >= 1; i--) {
    const previousWeek = new Date(startDate);
    previousWeek.setDate(startDate.getDate() - (i * 7));
    weeks.push(previousWeek.toISOString().split('T')[0]);
  }
  
  return weeks;
}

/**
 * Get week display name (e.g., "Jan 13-19, 2025")
 * @param weekStartISO - ISO date string for Monday of the week
 * @returns Human-readable week range
 */
export function getWeekDisplayName(weekStartISO: string): string {
  const weekStart = new Date(weekStartISO);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const startDay = weekStart.getDate();
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
  const endDay = weekEnd.getDate();
  const year = weekStart.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
}

/**
 * Check if a timestamp falls within a specific week
 * @param ts - Timestamp to check
 * @param weekStartISO - Monday start of week in ISO format
 * @returns True if timestamp is within the week (Monday 00:00 to Sunday 23:59)
 */
export function isInWeek(ts: number, weekStartISO: string): boolean {
  const weekStart = new Date(weekStartISO);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7); // Next Monday 00:00
  
  return ts >= weekStart.getTime() && ts < weekEnd.getTime();
}

/**
 * Get the date range for a week as millisecond timestamps
 * @param weekStartISO - Monday start of week in ISO format
 * @returns Object with start and end timestamps
 */
export function getWeekRange(weekStartISO: string): { start: number; end: number } {
  const weekStart = new Date(weekStartISO);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7); // Next Monday 00:00
  
  return {
    start: weekStart.getTime(),
    end: weekEnd.getTime()
  };
}