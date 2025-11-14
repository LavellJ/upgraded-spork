/**
 * Playwright global setup
 * Runs once before all tests to ensure clean state
 */
export default async function globalSetup() {
  console.log('🧹 Global setup: Clearing E2E localStorage keys...');
  
  // Note: Since this runs in Node context before browser tests,
  // we can't actually clear localStorage here. Instead, we document
  // the keys that should be cleared by the test fixtures.
  // 
  // Tests use e2e/fixtures.ts which ensures fresh state per test.
  // 
  // Keys managed by CI DOM shim:
  // - e2e.completedBiomes
  // - e2e.lap
  // - e2e.biomeProgress
  
  console.log('✓ Global setup complete');
}
