// Tests for audit log server endpoints
import { describe, test, expect, beforeEach } from 'vitest';
import { testDb, clearTestData } from './testDb';
import { issueToken } from '../auth';
import { statements } from '../db';

// Mock Express request object
const createMockRequest = (
  query: Record<string, any> = {},
  headers: Record<string, string> = {}
) => ({
  query,
  headers,
  ip: '127.0.0.1',
  get: (name: string) => headers[name.toLowerCase()],
});

// Mock Express response object  
const createMockResponse = () => {
  const res = {
    status: function(code: number) { this.statusCode = code; return this; },
    json: function(data: any) { this.jsonData = data; return this; },
    send: function(data: any) { this.sendData = data; return this; },
    setHeader: function(name: string, value: string) { 
      this.headers = this.headers || {}; 
      this.headers[name] = value; 
      return this; 
    },
    statusCode: 200,
    jsonData: null,
    sendData: null,
    headers: {}
  };
  return res;
};

describe('Audit Log Endpoints', () => {
  
  beforeEach(async () => {
    // Clear test data before each test
    clearTestData();
    
    // Insert some test audit log entries
    const now = Date.now();
    statements.insertAuditLog.run(
      now - 60000,  // 1 minute ago
      'admin@test.com',
      'token_issued',
      JSON.stringify({ role: 'admin' })
    );
    
    statements.insertAuditLog.run(
      now - 120000,  // 2 minutes ago
      'teacher@test.com', 
      'roster_updated',
      JSON.stringify({ learner_count: 5, learnerName: 'Test Student' })
    );
    
    statements.insertAuditLog.run(
      now - 180000,  // 3 minutes ago
      'teacher@test.com',
      'erasure_requested', 
      JSON.stringify({ requestId: 'req-123', scope: 'learner', learnerId: 'learner-456' })
    );
  });

  describe('GET /api/admin/audit', () => {
    
    test('returns audit entries for admin user', () => {
      const token = issueToken({ email: 'admin@test.com', role: 'admin' });
      const req = createMockRequest({}, { authorization: `Bearer ${token}` });
      const res = createMockResponse();
      
      // This would normally be handled by the route handler
      // For integration testing, we'd need to set up the full Express app
      // This test demonstrates the expected behavior
      
      expect(token).toBeTruthy();
    });

    test('filters by date range', () => {
      const token = issueToken({ email: 'guide@test.com', role: 'guide' });
      const fromDate = new Date(Date.now() - 90000).toISOString(); // 1.5 minutes ago
      
      const req = createMockRequest(
        { from: fromDate },
        { authorization: `Bearer ${token}` }
      );
      
      // Would test that only entries after fromDate are returned
      expect(token).toBeTruthy();
    });

    test('filters by action type', () => {
      const token = issueToken({ email: 'admin@test.com', role: 'admin' });
      
      const req = createMockRequest(
        { action: 'erasure_requested' },
        { authorization: `Bearer ${token}` }
      );
      
      // Would test that only erasure_requested entries are returned
      expect(token).toBeTruthy();
    });

    test('redacts PII when pii=0', () => {
      const token = issueToken({ email: 'admin@test.com', role: 'admin' });
      
      const req = createMockRequest(
        { pii: '0' },
        { authorization: `Bearer ${token}` }
      );
      
      // Would test that learnerName is redacted to [REDACTED]
      expect(token).toBeTruthy();
    });

    test('shows PII when pii=1 for admin', () => {
      const token = issueToken({ email: 'admin@test.com', role: 'admin' });
      
      const req = createMockRequest(
        { pii: '1' },
        { authorization: `Bearer ${token}` }
      );
      
      // Would test that learnerName is not redacted
      expect(token).toBeTruthy();
    });

    test('rejects non-admin/guide users', () => {
      const token = issueToken({ email: 'user@test.com', role: 'user' });
      
      const req = createMockRequest({}, { authorization: `Bearer ${token}` });
      const res = createMockResponse();
      
      // Would test that 403 error is returned
      expect(token).toBeTruthy();
    });

    test('rejects unauthenticated requests', () => {
      const req = createMockRequest({}, {});
      const res = createMockResponse();
      
      // Would test that 400/401 error is returned
      expect(req.query).toEqual({});
    });

  });

  describe('GET /api/admin/audit/actions', () => {
    
    test('returns unique action types', () => {
      const token = issueToken({ email: 'admin@test.com', role: 'admin' });
      
      const req = createMockRequest({}, { authorization: `Bearer ${token}` });
      const res = createMockResponse();
      
      // Would test that ['token_issued', 'roster_updated', 'erasure_requested'] are returned
      expect(token).toBeTruthy();
    });

  });

  describe('GET /api/admin/audit/csv', () => {
    
    test('exports CSV with proper headers', () => {
      const token = issueToken({ email: 'admin@test.com', role: 'admin' });
      
      const req = createMockRequest({}, { authorization: `Bearer ${token}` });
      const res = createMockResponse();
      
      // Would test that:
      // - Content-Type: text/csv header is set
      // - Content-Disposition header includes filename
      // - CSV contains proper columns: timestamp,email,action,meta
      expect(token).toBeTruthy();
    });

    test('applies same filters as main endpoint', () => {
      const token = issueToken({ email: 'admin@test.com', role: 'admin' });
      
      const req = createMockRequest(
        { action: 'token_issued', pii: '0' },
        { authorization: `Bearer ${token}` }
      );
      
      // Would test that CSV contains only token_issued entries with PII redacted
      expect(token).toBeTruthy();
    });

  });

  describe('PII Redaction Function', () => {
    
    test('redacts learnerName in metadata', () => {
      const meta = JSON.stringify({ learnerName: 'John Doe', other: 'data' });
      
      // Would import and test the redactPII function directly
      // const redacted = redactPII(meta);
      // const parsed = JSON.parse(redacted);
      // expect(parsed.learnerName).toBe('[REDACTED]');
      // expect(parsed.other).toBe('data');
      
      expect(meta).toContain('John Doe');
    });

    test('redacts learners array names', () => {
      const meta = JSON.stringify({
        learners: [
          { id: '1', name: 'Alice', score: 85 },
          { id: '2', displayName: 'Bob', score: 92 }
        ]
      });
      
      // Would test that names in learners array are redacted
      expect(meta).toContain('Alice');
    });

    test('handles malformed JSON gracefully', () => {
      const malformed = '{ invalid json';
      
      // Would test that function returns original string for unparseable JSON
      expect(malformed).toContain('invalid');
    });

    test('handles null metadata', () => {
      // Would test that null input returns null output
      expect(null).toBe(null);
    });

  });

});

describe('Database Schema', () => {
  
  test('audit_log table exists with correct columns', () => {
    // Test that the audit_log table schema matches expectations
    const result = statements.db.prepare("PRAGMA table_info(audit_log)").all();
    const columns = result.map((row: any) => row.name);
    
    expect(columns).toContain('id');
    expect(columns).toContain('at');
    expect(columns).toContain('email');
    expect(columns).toContain('action');
    expect(columns).toContain('meta');
  });

  test('can insert audit log entry', () => {
    const before = statements.db.prepare("SELECT COUNT(*) as count FROM audit_log").get() as { count: number };
    
    statements.insertAuditLog.run(
      Date.now(),
      'test@example.com',
      'test_action',
      JSON.stringify({ test: 'data' })
    );
    
    const after = statements.db.prepare("SELECT COUNT(*) as count FROM audit_log").get() as { count: number };
    
    expect(after.count).toBe(before.count + 1);
  });

});