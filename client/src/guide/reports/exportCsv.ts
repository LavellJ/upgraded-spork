/**
 * CSV export utilities for reporting data (v2 Schema)
 * Provides standardized, type-safe CSV exports with consistent column ordering
 */

import type { CohortSlice } from '../../progress/cohort';
import { getWeekDisplayName } from '../../progress/util';
import type { WeeklyEngagementRow } from '../../analytics/weeklyEngagement';

// V2 Schema: Standardized CSV column definitions
export const CSV_HEADERS = {
  // Trends CSV columns (v2 schema)
  TRENDS: [
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
  ] as const,

  // Weekly engagement CSV columns (v2 schema)
  WEEKLY_ENGAGEMENT: [
    'Learner ID',
    'Learner Name',
    'Minutes',
    'Sessions', 
    'Return 7d',
    'Assignments Done',
    'Due Soon',
    'Overdue'
  ] as const,

  // Teacher digest CSV columns (v2 schema)
  TEACHER_DIGEST: [
    'Learner ID',
    'Learner Name',
    'Active Minutes',
    'Learning Sessions',
    'Assignments Completed',
    'Due Soon',
    'Overdue',
    'Has Learning Streak'
  ] as const
} as const;

// Type-safe header validation
export type TrendsHeaders = typeof CSV_HEADERS.TRENDS[number];
export type WeeklyEngagementHeaders = typeof CSV_HEADERS.WEEKLY_ENGAGEMENT[number];
export type TeacherDigestHeaders = typeof CSV_HEADERS.TEACHER_DIGEST[number];

// Teacher digest data row type
export interface TeacherDigestRow {
  learnerId: string;
  name: string;
  minutes: number;
  sessions: number;
  assignmentsDone: number;
  dueSoon: number;
  overdue: number;
  hasStreak: boolean;
}

/**
 * Export trends data as CSV file using v2 schema
 * @param series - Array of cohort slices containing trend data
 * @param filename - Name for the downloaded file (without .csv extension)
 */
export function exportTrendsCSV(series: CohortSlice[], filename: string = 'cohort-trends'): void {
  if (series.length === 0) {
    console.warn('No trends data to export');
    return;
  }

  const csvContent = generateTrendsCSV(series);
  downloadCSVFile(csvContent, `${filename}.csv`);
}

/**
 * Generate trends CSV content with v2 schema (type-safe)
 */
export function generateTrendsCSV(series: CohortSlice[]): string {
  if (series.length === 0) {
    return '';
  }

  // Use standardized v2 headers
  const headers = [...CSV_HEADERS.TRENDS];

  // Convert data to CSV rows with consistent ordering
  const rows = series.map(slice => [
    getWeekDisplayName(slice.weekStartISO),
    slice.weekStartISO,
    slice.learners.toString(),
    slice.activeLearners.toString(),
    slice.avgOnTaskMins.toFixed(1),
    slice.medianOnTaskMins.toFixed(1),
    slice.return7dPct.toFixed(1),
    slice.assignments.donePct.toFixed(1),
    slice.assignments.dueSoon.toString(),
    slice.assignments.overdue.toString(),
    slice.completionsPerLearner.toFixed(1),
    slice.streakersPct.toFixed(1)
  ]);

  return formatCSVContent([headers, ...rows]);
}

/**
 * Export weekly engagement data as CSV file using v2 schema
 * @param data - Array of weekly engagement rows
 * @param weekStartISO - ISO date string for filename
 */
export function exportWeeklyEngagementCSV(data: WeeklyEngagementRow[], weekStartISO: string): void {
  if (data.length === 0) {
    console.warn('No weekly engagement data to export');
    return;
  }

  const csvContent = generateWeeklyEngagementCSV(data);
  downloadCSVFile(csvContent, `weekly_engagement_${weekStartISO}.csv`);
}

/**
 * Generate weekly engagement CSV content with v2 schema (type-safe)
 */
export function generateWeeklyEngagementCSV(data: WeeklyEngagementRow[]): string {
  if (data.length === 0) {
    return '';
  }

  // Use standardized v2 headers
  const headers = [...CSV_HEADERS.WEEKLY_ENGAGEMENT];

  // Convert data to CSV rows with consistent ordering
  const rows = data.map(row => [
    row.learnerId,
    row.learnerName,
    row.minutes.toString(),
    row.sessions.toString(),
    row.return7d ? 'Yes' : 'No',
    row.assignmentsDone.toString(),
    row.dueSoon.toString(),
    row.overdue.toString()
  ]);

  return formatCSVContent([headers, ...rows]);
}

/**
 * Export teacher digest data as CSV file using v2 schema
 * @param data - Array of teacher digest rows
 * @param className - Class name for filename
 * @param weekStartISO - ISO date string for filename
 */
export function exportTeacherDigestCSV(data: TeacherDigestRow[], className: string, weekStartISO: string): void {
  if (data.length === 0) {
    console.warn('No teacher digest data to export');
    return;
  }

  const csvContent = generateTeacherDigestCSV(data);
  const safeClassName = className.replace(/[^a-z0-9]/gi, '_');
  downloadCSVFile(csvContent, `${safeClassName}_${weekStartISO}.csv`);
}

/**
 * Generate teacher digest CSV content with v2 schema (type-safe)
 */
export function generateTeacherDigestCSV(data: TeacherDigestRow[]): string {
  if (data.length === 0) {
    return '';
  }

  // Use standardized v2 headers
  const headers = [...CSV_HEADERS.TEACHER_DIGEST];

  // Convert data to CSV rows with consistent ordering
  const rows = data.map(row => [
    row.learnerId,
    row.name,
    row.minutes.toString(),
    row.sessions.toString(),
    row.assignmentsDone.toString(),
    row.dueSoon.toString(),
    row.overdue.toString(),
    row.hasStreak ? 'Yes' : 'No'
  ]);

  return formatCSVContent([headers, ...rows]);
}

/**
 * Legacy function - maintained for backward compatibility
 * @deprecated Use generateTrendsCSV instead
 */
export function getCsvContent(series: CohortSlice[]): string {
  return generateTrendsCSV(series);
}

/**
 * Shared CSV formatting utility
 */
function formatCSVContent(rows: string[][]): string {
  return rows
    .map(row => row.map(cell => {
      // Escape cells containing commas, quotes, or newlines
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(','))
    .join('\n');
}

/**
 * Shared file download utility
 */
function downloadCSVFile(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}