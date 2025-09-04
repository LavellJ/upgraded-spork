/**
 * CSV export utilities for trends data
 * Exports cohort metrics series to downloadable CSV format
 */

import type { CohortSlice } from '../../progress/cohort';
import { getWeekDisplayName } from '../../progress/util';

/**
 * Export trends data as CSV file
 * @param series - Array of cohort slices containing trend data
 * @param filename - Name for the downloaded file (without .csv extension)
 */
export function exportTrendsCSV(series: CohortSlice[], filename: string = 'cohort-trends'): void {
  if (series.length === 0) {
    console.warn('No trends data to export');
    return;
  }

  // CSV Headers
  const headers = [
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

  // Convert data to CSV rows
  const rows = series.map(slice => [
    getWeekDisplayName(slice.weekStartISO),
    slice.weekStartISO,
    slice.learners.toString(),
    slice.activeLearners.toString(),
    slice.avgOnTaskMins.toString(),
    slice.medianOnTaskMins.toString(),
    slice.return7dPct.toString(),
    slice.assignments.donePct.toString(),
    slice.assignments.dueSoon.toString(),
    slice.assignments.overdue.toString(),
    slice.completionsPerLearner.toString(),
    slice.streakersPct.toString()
  ]);

  // Combine headers and data
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => {
      // Escape cells containing commas, quotes, or newlines
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(','))
    .join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Get CSV data as string without triggering download
 * Useful for testing or custom processing
 */
export function getCsvContent(series: CohortSlice[]): string {
  if (series.length === 0) {
    return '';
  }

  const headers = [
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

  const rows = series.map(slice => [
    getWeekDisplayName(slice.weekStartISO),
    slice.weekStartISO,
    slice.learners.toString(),
    slice.activeLearners.toString(),
    slice.avgOnTaskMins.toString(),
    slice.medianOnTaskMins.toString(),
    slice.return7dPct.toString(),
    slice.assignments.donePct.toString(),
    slice.assignments.dueSoon.toString(),
    slice.assignments.overdue.toString(),
    slice.completionsPerLearner.toString(),
    slice.streakersPct.toString()
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(','))
    .join('\n');
}