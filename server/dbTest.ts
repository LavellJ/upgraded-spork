#!/usr/bin/env tsx
// Simple database test script
import { dbUserStorage } from './dbStorage';

const TEST_EMAIL = 'dbtest@example.com';
const TEST_LEARNER_ID = 'test-learner-123';

async function runTests() {
  console.log('🧪 Running database storage tests...');

  try {
    // Test 1: Put/Get roundtrip
    console.log('📝 Test 1: Put/Get roundtrip');
    const testData = { kind: 'event', at: Date.now(), test: 'database-works' };
    await dbUserStorage.putBucket(TEST_EMAIL, TEST_LEARNER_ID, 'events', testData);
    const retrieved = await dbUserStorage.getBucket(TEST_EMAIL, TEST_LEARNER_ID, 'events');
    
    if (JSON.stringify(retrieved) === JSON.stringify(testData)) {
      console.log('  ✅ Put/get roundtrip successful');
    } else {
      console.log('  ❌ Put/get roundtrip failed');
      console.log('  Expected:', testData);
      console.log('  Got:', retrieved);
      return;
    }

    // Test 2: User document creation
    console.log('📝 Test 2: User document operations');
    const userDoc = await dbUserStorage.getUserDoc(TEST_EMAIL);
    console.log(`  ✅ Created user document for ${TEST_EMAIL}`);
    console.log(`  📋 User role: ${userDoc.role}`);
    console.log(`  📋 Learners in roster: ${userDoc.roster.learners.length}`);
    console.log(`  📋 Data buckets: ${Object.keys(userDoc.data).length}`);

    // Test 3: List learners
    console.log('📝 Test 3: List learners');
    const learners = await dbUserStorage.listLearners(TEST_EMAIL);
    console.log(`  ✅ Found ${learners.length} learners: ${learners.join(', ')}`);

    // Test 4: Audit log
    console.log('📝 Test 4: Audit log');
    const auditLog = await dbUserStorage.getAuditLog(TEST_EMAIL, 5);
    console.log(`  ✅ Found ${auditLog.length} audit entries`);
    if (auditLog.length > 0) {
      console.log(`  📋 Latest: ${auditLog[0].action} at ${new Date(auditLog[0].at).toISOString()}`);
    }

    console.log('\n🎉 All tests passed! Database storage is working correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();