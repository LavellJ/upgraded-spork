/**
 * A/B Testing Analytics
 * 
 * Provides metrics calculation functions for A/B test variants.
 * Analyzes scout_analytics events to compute CTR and dwell time by variant.
 */

import { getEventsByKind, getEventsRange } from '../progress/events';

export interface VariantMetrics {
  variant: string;
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate (clicks / impressions)
  medianDwellMs: number;
  avgDwellMs: number;
  dismissals: number;
  autoDismissals: number;
}

export interface ExperimentAnalytics {
  experimentKey: string;
  variants: VariantMetrics[];
  totalImpressions: number;
  dateRange: {
    start: string;
    end: string;
  };
}

/**
 * Calculate median from an array of numbers
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Get analytics for a specific A/B experiment over the last N days
 */
export function getExperimentAnalytics(
  experimentKey: string, 
  days: number = 7
): ExperimentAnalytics {
  const events = getEventsRange(days);
  const scoutAnalytics = events.filter(e => e.kind === 'scout_analytics');
  
  // Filter events that have variant data for this experiment
  const relevantEvents = scoutAnalytics.filter(e => 
    e.abVariant && e.abVariant[experimentKey]
  );
  
  // Group events by variant
  const variantGroups: Record<string, typeof relevantEvents> = {};
  
  relevantEvents.forEach(event => {
    const variant = event.abVariant![experimentKey];
    if (!variantGroups[variant]) {
      variantGroups[variant] = [];
    }
    variantGroups[variant].push(event);
  });
  
  // Calculate metrics for each variant
  const variants: VariantMetrics[] = Object.entries(variantGroups).map(([variant, events]) => {
    const impressions = events.filter(e => e.action === 'shown').length;
    const clicks = events.filter(e => e.action === 'clicked').length;
    const dismissals = events.filter(e => e.action === 'dismissed').length;
    const autoDismissals = events.filter(e => e.action === 'auto_dismiss').length;
    
    // Calculate dwell times (from events with dwellMs data)
    const dwellTimes = events
      .filter(e => e.dwellMs !== undefined && e.dwellMs > 0)
      .map(e => e.dwellMs!);
    
    const avgDwellMs = dwellTimes.length > 0 
      ? dwellTimes.reduce((sum, dwell) => sum + dwell, 0) / dwellTimes.length
      : 0;
    
    const medianDwellMs = calculateMedian(dwellTimes);
    
    const ctr = impressions > 0 ? clicks / impressions : 0;
    
    return {
      variant,
      impressions,
      clicks,
      ctr,
      medianDwellMs,
      avgDwellMs,
      dismissals,
      autoDismissals
    };
  });
  
  // Calculate date range
  const timestamps = relevantEvents.map(e => e.at);
  const startTime = timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
  const endTime = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
  
  return {
    experimentKey,
    variants: variants.sort((a, b) => a.variant.localeCompare(b.variant)),
    totalImpressions: variants.reduce((sum, v) => sum + v.impressions, 0),
    dateRange: {
      start: new Date(startTime).toLocaleDateString(),
      end: new Date(endTime).toLocaleDateString()
    }
  };
}

/**
 * Get analytics for all scout dwell experiments
 */
export function getScoutDwellAnalytics(days: number = 7): ExperimentAnalytics {
  return getExperimentAnalytics('scout.dwell', days);
}

/**
 * Get summary stats across all variants for a given experiment
 */
export function getExperimentSummary(analytics: ExperimentAnalytics) {
  const { variants } = analytics;
  
  if (variants.length === 0) {
    return {
      totalImpressions: 0,
      totalClicks: 0,
      overallCtr: 0,
      avgDwellMs: 0,
      bestVariant: null,
      worstVariant: null
    };
  }
  
  const totalImpressions = variants.reduce((sum, v) => sum + v.impressions, 0);
  const totalClicks = variants.reduce((sum, v) => sum + v.clicks, 0);
  const overallCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  
  const avgDwellMs = variants.reduce((sum, v) => sum + v.avgDwellMs * v.impressions, 0) / 
    Math.max(totalImpressions, 1);
  
  // Best variant by CTR (or dwell time if CTR is tied)
  const bestVariant = variants.reduce((best, current) => {
    if (current.ctr > best.ctr) return current;
    if (current.ctr === best.ctr && current.medianDwellMs > best.medianDwellMs) return current;
    return best;
  });
  
  // Worst variant by CTR (or dwell time if CTR is tied)
  const worstVariant = variants.reduce((worst, current) => {
    if (current.ctr < worst.ctr) return current;
    if (current.ctr === worst.ctr && current.medianDwellMs < worst.medianDwellMs) return current;
    return worst;
  });
  
  return {
    totalImpressions,
    totalClicks,
    overallCtr,
    avgDwellMs,
    bestVariant: bestVariant.variant,
    worstVariant: worstVariant.variant
  };
}