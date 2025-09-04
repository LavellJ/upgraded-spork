// Basic tests for database storage layer
import { dbUserStorage } from '../dbStorage';
import { statements } from '../db';

const TEST_EMAIL = 'test@example.com';
const TEST_LEARNER_ID = 'learner-123';

describe('Database Storage', () => {
  beforeEach(() => {
    // Clean test data
    statements.db.exec('DELETE FROM audit_log WHERE email = ?', TEST_EMAIL);
    statements.db.exec('DELETE FROM user_docs WHERE email = ?', TEST_EMAIL);
    statements.db.exec('DELETE FROM users WHERE email = ?', TEST_EMAIL);
  });

  test('should create and retrieve user document', async () => {
    const testDoc = {
      email: TEST_EMAIL,
      role: 'guide',
      roster: { learners: [{ id: 'learner1', name: 'Test Learner', createdAt: Date.now(), updatedAt: Date.now() }] },
      data: {},
      updatedAt: Date.now(),
      version: 1
    };

    await dbUserStorage.saveUserDoc(TEST_EMAIL, testDoc);
    const retrieved = await dbUserStorage.getUserDoc(TEST_EMAIL);

    expect(retrieved.email).toBe(TEST_EMAIL);
    expect(retrieved.roster.learners).toHaveLength(1);
    expect(retrieved.roster.learners[0].name).toBe('Test Learner');
  });

  test('should handle bucket operations', async () => {
    const testData = { test: 'value', at: Date.now() };
    
    await dbUserStorage.putBucket(TEST_EMAIL, TEST_LEARNER_ID, 'events', testData);
    const retrieved = await dbUserStorage.getBucket(TEST_EMAIL, TEST_LEARNER_ID, 'events');

    expect(retrieved).toEqual(testData);
  });

  test('should list learners', async () => {
    await dbUserStorage.putBucket(TEST_EMAIL, 'learner1', 'events', { test: 1 });
    await dbUserStorage.putBucket(TEST_EMAIL, 'learner2', 'model', { test: 2 });
    
    const learners = await dbUserStorage.listLearners(TEST_EMAIL);
    
    expect(learners).toContain('learner1');
    expect(learners).toContain('learner2');
    expect(learners).toHaveLength(2);
  });

  test('should create audit log entries', async () => {
    await dbUserStorage.putBucket(TEST_EMAIL, TEST_LEARNER_ID, 'events', { test: 'audit' });
    
    const auditLog = await dbUserStorage.getAuditLog(TEST_EMAIL, 10);
    
    expect(auditLog.length).toBeGreaterThan(0);
    expect(auditLog[0].action).toBe('bucket_updated');
  });
});

// Run basic smoke test if called directly
if (require.main === module) {
  console.log('🧪 Running basic database storage tests...');
  
  // Simple put/get roundtrip test
  (async () => {
    try {
      const testData = { kind: 'event', at: Date.now(), test: true };
      await dbUserStorage.putBucket('test-user@example.com', 'test-learner', 'events', testData);
      const retrieved = await dbUserStorage.getBucket('test-user@example.com', 'test-learner', 'events');
      
      if (JSON.stringify(retrieved) === JSON.stringify(testData)) {
        console.log('✅ Put/get roundtrip test passed');
      } else {
        console.log('❌ Put/get roundtrip test failed');
        console.log('Expected:', testData);
        console.log('Got:', retrieved);
      }
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  })();
}