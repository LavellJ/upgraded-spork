/**
 * Service Level Objective (SLO) monitoring with rolling window metrics
 */
import { StructuredLogger } from '../log';

const log = new StructuredLogger();

interface MetricSample {
  timestamp: number;
  value: number;
}

interface SLOConfig {
  windowSizeMs: number;  // Rolling window size in milliseconds
  targetPercentile: number;  // Target percentile (e.g., 95 for 95th percentile)
  maxSamples: number;  // Maximum samples to keep in memory
}

/**
 * Rolling window SLO tracker
 */
class SLOTracker {
  private samples: MetricSample[] = [];
  private config: SLOConfig;
  private name: string;

  constructor(name: string, config: Partial<SLOConfig> = {}) {
    this.name = name;
    this.config = {
      windowSizeMs: 15 * 60 * 1000, // 15 minutes default
      targetPercentile: 95,
      maxSamples: 1000,
      ...config,
    };
  }

  /**
   * Add a new metric sample
   */
  addSample(value: number) {
    const now = Date.now();
    
    // Add new sample
    this.samples.push({ timestamp: now, value });
    
    // Remove old samples outside the window
    const cutoff = now - this.config.windowSizeMs;
    this.samples = this.samples.filter(sample => sample.timestamp >= cutoff);
    
    // Limit samples to prevent memory growth
    if (this.samples.length > this.config.maxSamples) {
      this.samples = this.samples.slice(-this.config.maxSamples);
    }

    // Log metric
    log.metric(`${this.name}_sample`, value, 'ms');
  }

  /**
   * Calculate percentile value
   */
  getPercentile(percentile: number = this.config.targetPercentile): number | null {
    if (this.samples.length === 0) {
      return null;
    }

    const sorted = this.samples.map(s => s.value).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get current SLO metrics
   */
  getMetrics() {
    const now = Date.now();
    const validSamples = this.samples.filter(
      sample => sample.timestamp >= now - this.config.windowSizeMs
    );

    if (validSamples.length === 0) {
      return {
        name: this.name,
        sampleCount: 0,
        windowSizeMs: this.config.windowSizeMs,
        percentile: this.config.targetPercentile,
        value: null,
        mean: null,
        min: null,
        max: null,
      };
    }

    const values = validSamples.map(s => s.value);
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      name: this.name,
      sampleCount: validSamples.length,
      windowSizeMs: this.config.windowSizeMs,
      percentile: this.config.targetPercentile,
      value: this.getPercentile(),
      mean: Math.round(values.reduce((sum, v) => sum + v, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Reset all samples
   */
  reset() {
    this.samples = [];
    log.info(`SLO tracker reset: ${this.name}`);
  }
}

/**
 * Global SLO metrics registry
 */
class SLORegistry {
  private trackers = new Map<string, SLOTracker>();

  /**
   * Get or create SLO tracker
   */
  getTracker(name: string, config?: Partial<SLOConfig>): SLOTracker {
    if (!this.trackers.has(name)) {
      this.trackers.set(name, new SLOTracker(name, config));
    }
    return this.trackers.get(name)!;
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const metrics: Record<string, any> = {};
    for (const [name, tracker] of this.trackers) {
      metrics[name] = tracker.getMetrics();
    }
    return metrics;
  }

  /**
   * Reset all trackers
   */
  resetAll() {
    for (const tracker of this.trackers.values()) {
      tracker.reset();
    }
  }
}

// Global registry instance
export const sloRegistry = new SLORegistry();

// Pre-configured trackers for common endpoints
export const syncBatchSLO = sloRegistry.getTracker('sync_batch_latency', {
  windowSizeMs: 15 * 60 * 1000, // 15 minutes
  targetPercentile: 95,
});

export const authSLO = sloRegistry.getTracker('auth_latency', {
  windowSizeMs: 10 * 60 * 1000, // 10 minutes
  targetPercentile: 90,
});

export const questionGenerationSLO = sloRegistry.getTracker('question_generation_latency', {
  windowSizeMs: 30 * 60 * 1000, // 30 minutes
  targetPercentile: 95,
});

/**
 * Middleware to track request latency for specific routes
 */
export function trackSLO(trackerName: string) {
  return (req: any, res: any, next: any) => {
    const startTime = process.hrtime();
    
    // Hook into response end
    const originalEnd = res.end;
    res.end = function(this: any, ...args: any[]) {
      // Calculate duration
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = Math.round(seconds * 1000 + nanoseconds / 1000000);
      
      // Track in SLO if successful response
      if (res.statusCode < 400) {
        const tracker = sloRegistry.getTracker(trackerName);
        tracker.addSample(duration);
      }
      
      // Call original end
      originalEnd.apply(this, args);
    };
    
    next();
  };
}