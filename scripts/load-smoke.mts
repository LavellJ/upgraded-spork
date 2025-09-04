#!/usr/bin/env tsx
/**
 * Load smoke test: 20 concurrent fake learners pushing batches for 2 minutes
 * Asserts <2% error rate for operational readiness
 */
import { performance } from 'perf_hooks';

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:5000',
  concurrentLearners: 20,
  testDurationMs: 2 * 60 * 1000, // 2 minutes
  batchIntervalMs: 5000, // Send batch every 5 seconds
  itemsPerBatch: 5,
  maxErrorRate: 0.02, // 2%
};

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  errorRate: number;
  averageLatency: number;
  p95Latency: number;
  maxLatency: number;
  minLatency: number;
}

interface RequestMetric {
  startTime: number;
  endTime: number;
  statusCode: number;
  error?: string;
}

class FakeLearner {
  private learnerId: string;
  private userId: string;
  private authToken: string;
  private isRunning: boolean = false;
  private metrics: RequestMetric[] = [];

  constructor(id: number) {
    this.learnerId = `learner-${id}`;
    this.userId = `user-${id}`;
    this.authToken = '';
  }

  async initialize(): Promise<void> {
    try {
      // Get authentication token
      const response = await fetch(
        `${CONFIG.baseUrl}/api/dev/issue?email=loadtest-${this.userId}@example.com&role=guide`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to get auth token: ${response.status}`);
      }
      
      const data = await response.json();
      this.authToken = data.token;
      
      console.log(`✅ Learner ${this.learnerId} initialized with token`);
    } catch (error) {
      console.error(`❌ Failed to initialize learner ${this.learnerId}:`, error);
      throw error;
    }
  }

  private generateSyncItems(count: number): any[] {
    const items = [];
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      items.push({
        id: `${this.learnerId}-item-${now}-${i}`,
        kind: Math.random() > 0.5 ? 'event' : 'reflection',
        payload: {
          action: 'learning_activity',
          topic: `topic-${Math.floor(Math.random() * 10)}`,
          score: Math.floor(Math.random() * 100),
          duration: Math.floor(Math.random() * 300) + 30,
        },
        at: now - Math.floor(Math.random() * 3600000), // Within last hour
      });
    }
    
    return items;
  }

  private async sendBatch(): Promise<void> {
    const startTime = performance.now();
    let statusCode = 0;
    let error: string | undefined;

    try {
      const items = this.generateSyncItems(CONFIG.itemsPerBatch);
      
      const response = await fetch(`${CONFIG.baseUrl}/api/sync/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          userId: this.userId,
          learnerId: this.learnerId,
          items,
        }),
      });

      statusCode = response.status;
      
      if (!response.ok) {
        const errorData = await response.text();
        error = `HTTP ${response.status}: ${errorData}`;
      } else {
        await response.json(); // Consume response
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      statusCode = 0; // Network error
    }

    const endTime = performance.now();
    
    this.metrics.push({
      startTime,
      endTime,
      statusCode,
      error,
    });

    if (error) {
      console.warn(`⚠️  ${this.learnerId} batch failed: ${error}`);
    }
  }

  async start(): Promise<void> {
    this.isRunning = true;
    console.log(`🚀 Starting learner ${this.learnerId}`);

    while (this.isRunning) {
      await this.sendBatch();
      
      if (this.isRunning) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.batchIntervalMs));
      }
    }
  }

  stop(): void {
    this.isRunning = false;
    console.log(`🛑 Stopping learner ${this.learnerId}`);
  }

  getMetrics(): RequestMetric[] {
    return [...this.metrics];
  }
}

class LoadTester {
  private learners: FakeLearner[] = [];
  private startTime: number = 0;

  async initialize(): Promise<void> {
    console.log(`🔧 Initializing ${CONFIG.concurrentLearners} fake learners...`);
    
    // Create learners
    for (let i = 1; i <= CONFIG.concurrentLearners; i++) {
      this.learners.push(new FakeLearner(i));
    }

    // Initialize all learners concurrently
    await Promise.all(this.learners.map(learner => learner.initialize()));
    
    console.log(`✅ All ${CONFIG.concurrentLearners} learners initialized`);
  }

  async runTest(): Promise<LoadTestResult> {
    console.log(`\n🔥 Starting load smoke test:`);
    console.log(`   • ${CONFIG.concurrentLearners} concurrent learners`);
    console.log(`   • ${CONFIG.testDurationMs / 1000}s duration`);
    console.log(`   • ${CONFIG.batchIntervalMs / 1000}s batch interval`);
    console.log(`   • ${CONFIG.itemsPerBatch} items per batch`);
    console.log(`   • Target error rate: <${CONFIG.maxErrorRate * 100}%\n`);

    this.startTime = Date.now();

    // Start all learners concurrently
    const learnerPromises = this.learners.map(learner => learner.start());

    // Run for specified duration
    await new Promise(resolve => setTimeout(resolve, CONFIG.testDurationMs));

    // Stop all learners
    this.learners.forEach(learner => learner.stop());

    // Wait for all learners to finish their current batch
    await Promise.allSettled(learnerPromises);

    return this.analyzeResults();
  }

  private analyzeResults(): LoadTestResult {
    const allMetrics: RequestMetric[] = [];
    
    this.learners.forEach(learner => {
      allMetrics.push(...learner.getMetrics());
    });

    const totalRequests = allMetrics.length;
    const errorRequests = allMetrics.filter(m => m.statusCode >= 400 || m.statusCode === 0).length;
    const successfulRequests = totalRequests - errorRequests;
    const errorRate = totalRequests > 0 ? errorRequests / totalRequests : 0;

    // Calculate latencies (only for successful requests)
    const successfulMetrics = allMetrics.filter(m => m.statusCode < 400 && m.statusCode > 0);
    const latencies = successfulMetrics.map(m => m.endTime - m.startTime);
    
    latencies.sort((a, b) => a - b);
    
    const averageLatency = latencies.length > 0 
      ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length 
      : 0;
    
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies.length > 0 ? latencies[p95Index] || 0 : 0;
    const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
    const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;

    return {
      totalRequests,
      successfulRequests,
      errorRequests,
      errorRate,
      averageLatency,
      p95Latency,
      maxLatency,
      minLatency,
    };
  }

  printResults(result: LoadTestResult): void {
    const duration = (Date.now() - this.startTime) / 1000;
    
    console.log(`\n📊 Load Smoke Test Results:`);
    console.log(`   Duration: ${duration.toFixed(1)}s`);
    console.log(`   Total Requests: ${result.totalRequests}`);
    console.log(`   Successful: ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%)`);
    console.log(`   Errors: ${result.errorRequests} (${(result.errorRate * 100).toFixed(2)}%)`);
    console.log(`   Throughput: ${(result.totalRequests / duration).toFixed(1)} req/s`);
    console.log(`\n⏱️  Latency Statistics:`);
    console.log(`   Average: ${result.averageLatency.toFixed(1)}ms`);
    console.log(`   P95: ${result.p95Latency.toFixed(1)}ms`);
    console.log(`   Min: ${result.minLatency.toFixed(1)}ms`);
    console.log(`   Max: ${result.maxLatency.toFixed(1)}ms`);
  }

  validateResults(result: LoadTestResult): boolean {
    const passed = result.errorRate <= CONFIG.maxErrorRate;
    
    if (passed) {
      console.log(`\n✅ SMOKE TEST PASSED`);
      console.log(`   Error rate: ${(result.errorRate * 100).toFixed(2)}% (target: <${CONFIG.maxErrorRate * 100}%)`);
    } else {
      console.log(`\n❌ SMOKE TEST FAILED`);
      console.log(`   Error rate: ${(result.errorRate * 100).toFixed(2)}% (target: <${CONFIG.maxErrorRate * 100}%)`);
      console.log(`   System is not ready for production load`);
    }
    
    return passed;
  }
}

async function main(): Promise<void> {
  try {
    // Check if server is running
    try {
      const healthResponse = await fetch(`${CONFIG.baseUrl}/health`);
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }
    } catch (error) {
      console.error(`❌ Server health check failed. Is the server running on ${CONFIG.baseUrl}?`);
      console.error(`   Error: ${error}`);
      process.exit(1);
    }

    const loadTester = new LoadTester();
    
    await loadTester.initialize();
    const result = await loadTester.runTest();
    
    loadTester.printResults(result);
    const passed = loadTester.validateResults(result);
    
    process.exit(passed ? 0 : 1);
    
  } catch (error) {
    console.error(`💥 Load smoke test failed with error:`, error);
    process.exit(1);
  }
}

// Run the load test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}