/**
 * Tests for A/B Testing Analytics
 * 
 * Validates variant-specific metrics calculation and experiment analysis.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getExperimentAnalytics, getScoutDwellAnalytics, getExperimentSummary } from './analytics';
import { pushEvent, clearEvents } from '../progress/events';

describe('AB Analytics', () => {
  beforeEach(() => {
    clearEvents();
  });

  afterEach(() => {
    clearEvents();
  });

  describe('getExperimentAnalytics', () => {
    it('should return empty analytics when no events exist', () => {
      const analytics = getExperimentAnalytics('scout.dwell', 7);
      
      expect(analytics.experimentKey).toBe('scout.dwell');
      expect(analytics.variants).toEqual([]);
      expect(analytics.totalImpressions).toBe(0);
    });

    it('should ignore events without variant data', () => {
      // Add scout_analytics event without variant data
      pushEvent({
        kind: 'scout_analytics',
        at: Date.now(),
        id: 'msg-1',
        priority: 'info',
        action: 'shown',
        sessionId: 'sess-1'
      });

      const analytics = getExperimentAnalytics('scout.dwell', 7);
      expect(analytics.variants).toEqual([]);
    });

    it('should calculate correct metrics for single variant', () => {
      const now = Date.now();
      
      // Add events for variant A
      pushEvent({
        kind: 'scout_analytics',
        at: now,
        id: 'msg-1',
        priority: 'info',
        action: 'shown',
        sessionId: 'sess-1',
        abVariant: { 'scout.dwell': 'A' }
      });

      pushEvent({
        kind: 'scout_analytics',
        at: now + 1000,
        id: 'msg-1',
        priority: 'info',
        action: 'clicked',
        dwellMs: 2500,
        sessionId: 'sess-1',
        abVariant: { 'scout.dwell': 'A' }
      });

      pushEvent({
        kind: 'scout_analytics',
        at: now + 2000,
        id: 'msg-2',
        priority: 'info',
        action: 'shown',
        sessionId: 'sess-1',
        abVariant: { 'scout.dwell': 'A' }
      });

      pushEvent({
        kind: 'scout_analytics',
        at: now + 3000,
        id: 'msg-2',
        priority: 'info',
        action: 'auto_dismiss',
        dwellMs: 3000,
        sessionId: 'sess-1',
        abVariant: { 'scout.dwell': 'A' }
      });

      const analytics = getExperimentAnalytics('scout.dwell', 7);
      
      expect(analytics.variants).toHaveLength(1);
      
      const variantA = analytics.variants[0];
      expect(variantA.variant).toBe('A');
      expect(variantA.impressions).toBe(2);
      expect(variantA.clicks).toBe(1);
      expect(variantA.ctr).toBe(0.5); // 1 click / 2 impressions
      expect(variantA.dismissals).toBe(0);
      expect(variantA.autoDismissals).toBe(1);
      expect(variantA.medianDwellMs).toBe(2750); // Median of [2500, 3000]
      expect(variantA.avgDwellMs).toBe(2750); // Average of [2500, 3000]
    });

    it('should calculate correct metrics for multiple variants', () => {
      const now = Date.now();
      
      // Variant A: 2 impressions, 1 click
      pushEvent({
        kind: 'scout_analytics',
        at: now,
        id: 'msg-1',
        priority: 'info',
        action: 'shown',
        sessionId: 'sess-1',
        abVariant: { 'scout.dwell': 'A' }
      });

      pushEvent({
        kind: 'scout_analytics',
        at: now + 1000,
        id: 'msg-1',
        priority: 'info',
        action: 'clicked',
        dwellMs: 2000,
        sessionId: 'sess-1',
        abVariant: { 'scout.dwell': 'A' }
      });

      pushEvent({
        kind: 'scout_analytics',
        at: now + 2000,
        id: 'msg-2',
        priority: 'info',
        action: 'shown',
        sessionId: 'sess-1',
        abVariant: { 'scout.dwell': 'A' }
      });

      // Variant B: 1 impression, 0 clicks
      pushEvent({
        kind: 'scout_analytics',
        at: now + 3000,
        id: 'msg-3',
        priority: 'info',
        action: 'shown',
        sessionId: 'sess-1',
        abVariant: { 'scout.dwell': 'B' }
      });

      pushEvent({
        kind: 'scout_analytics',
        at: now + 4000,
        id: 'msg-3',
        priority: 'info',
        action: 'dismissed',
        dwellMs: 1500,
        sessionId: 'sess-1',
        abVariant: { 'scout.dwell': 'B' }
      });

      const analytics = getExperimentAnalytics('scout.dwell', 7);
      
      expect(analytics.variants).toHaveLength(2);
      expect(analytics.totalImpressions).toBe(3);
      
      // Sort variants for consistent testing
      const sortedVariants = analytics.variants.sort((a, b) => a.variant.localeCompare(b.variant));
      
      const variantA = sortedVariants[0];
      expect(variantA.variant).toBe('A');
      expect(variantA.impressions).toBe(2);
      expect(variantA.clicks).toBe(1);
      expect(variantA.ctr).toBe(0.5);
      
      const variantB = sortedVariants[1];
      expect(variantB.variant).toBe('B');
      expect(variantB.impressions).toBe(1);
      expect(variantB.clicks).toBe(0);
      expect(variantB.ctr).toBe(0);
      expect(variantB.dismissals).toBe(1);
    });

    it('should filter events by time range', () => {
      const now = Date.now();
      const eightDaysAgo = now - (8 * 24 * 60 * 60 * 1000);
      
      // Event outside range (8 days ago)
      pushEvent({
        kind: 'scout_analytics',
        at: eightDaysAgo,
        id: 'old-msg',
        priority: 'info',
        action: 'shown',
        sessionId: 'sess-1',
        abVariant: { 'scout.dwell': 'A' }
      });

      // Event within range (now)
      pushEvent({
        kind: 'scout_analytics',
        at: now,
        id: 'new-msg',
        priority: 'info',
        action: 'shown',
        sessionId: 'sess-1',
        abVariant: { 'scout.dwell': 'A' }
      });

      const analytics = getExperimentAnalytics('scout.dwell', 7);
      
      expect(analytics.variants).toHaveLength(1);
      expect(analytics.variants[0].impressions).toBe(1); // Only the recent event
    });
  });

  describe('getScoutDwellAnalytics', () => {
    it('should be shorthand for scout.dwell experiment', () => {
      const now = Date.now();
      
      pushEvent({
        kind: 'scout_analytics',
        at: now,
        id: 'msg-1',
        priority: 'info',
        action: 'shown',
        sessionId: 'sess-1',
        abVariant: { 'scout.dwell': 'C' }
      });

      const analytics = getScoutDwellAnalytics(7);
      
      expect(analytics.experimentKey).toBe('scout.dwell');
      expect(analytics.variants).toHaveLength(1);
      expect(analytics.variants[0].variant).toBe('C');
    });
  });

  describe('getExperimentSummary', () => {
    it('should handle empty analytics', () => {
      const analytics = {
        experimentKey: 'test',
        variants: [],
        totalImpressions: 0,
        dateRange: { start: '', end: '' }
      };

      const summary = getExperimentSummary(analytics);
      
      expect(summary.totalImpressions).toBe(0);
      expect(summary.totalClicks).toBe(0);
      expect(summary.overallCtr).toBe(0);
      expect(summary.avgDwellMs).toBe(0);
      expect(summary.bestVariant).toBeNull();
      expect(summary.worstVariant).toBeNull();
    });

    it('should calculate correct summary statistics', () => {
      const analytics = {
        experimentKey: 'test',
        variants: [
          {
            variant: 'A',
            impressions: 100,
            clicks: 10,
            ctr: 0.1,
            medianDwellMs: 2000,
            avgDwellMs: 2200,
            dismissals: 0,
            autoDismissals: 90
          },
          {
            variant: 'B',
            impressions: 80,
            clicks: 20,
            ctr: 0.25,
            medianDwellMs: 1800,
            avgDwellMs: 1900,
            dismissals: 5,
            autoDismissals: 55
          }
        ],
        totalImpressions: 180,
        dateRange: { start: '', end: '' }
      };

      const summary = getExperimentSummary(analytics);
      
      expect(summary.totalImpressions).toBe(180);
      expect(summary.totalClicks).toBe(30);
      expect(summary.overallCtr).toBe(30 / 180); // 0.1667
      expect(summary.bestVariant).toBe('B'); // Higher CTR
      expect(summary.worstVariant).toBe('A'); // Lower CTR
      
      // Weighted average dwell time
      const expectedAvgDwell = (2200 * 100 + 1900 * 80) / 180;
      expect(summary.avgDwellMs).toBeCloseTo(expectedAvgDwell, 1);
    });

    it('should break ties using dwell time', () => {
      const analytics = {
        experimentKey: 'test',
        variants: [
          {
            variant: 'A',
            impressions: 100,
            clicks: 10,
            ctr: 0.1,
            medianDwellMs: 3000, // Higher dwell
            avgDwellMs: 3000,
            dismissals: 0,
            autoDismissals: 90
          },
          {
            variant: 'B',
            impressions: 100,
            clicks: 10,
            ctr: 0.1, // Same CTR
            medianDwellMs: 2000, // Lower dwell
            avgDwellMs: 2000,
            dismissals: 0,
            autoDismissals: 90
          }
        ],
        totalImpressions: 200,
        dateRange: { start: '', end: '' }
      };

      const summary = getExperimentSummary(analytics);
      
      expect(summary.bestVariant).toBe('A'); // Higher dwell time wins tie
      expect(summary.worstVariant).toBe('B'); // Lower dwell time loses tie
    });
  });
});