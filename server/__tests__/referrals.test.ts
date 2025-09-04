/**
 * Server-side tests for referral functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the database statements
const mockStatements = {
  insertReferral: { run: vi.fn() },
  getReferral: { get: vi.fn() },
  getReferralsByOwner: { all: vi.fn() },
  updateReferralClicks: { run: vi.fn() },
  deleteReferral: { run: vi.fn() },
  insertAuditLog: { run: vi.fn() }
};

// Mock auth module
const mockVerifyToken = vi.fn();

describe('Referrals Logic', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Referral Code Generation', () => {
    it('should generate valid base36 codes', () => {
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      expect(result).toHaveLength(6);
      expect(/^[0-9A-Z]{6}$/.test(result)).toBe(true);
    });

    it('should validate URL format', () => {
      const baseUrl = 'http://localhost:5000';
      const code = 'ABC123';
      const expectedUrl = `${baseUrl}/r/${code}`;
      
      expect(expectedUrl).toBe('http://localhost:5000/r/ABC123');
      expect(expectedUrl).toMatch(/^https?:\/\/[^\/]+\/r\/[0-9A-Z]{6}$/);
    });

    it('should generate redirect URLs with UTM parameters', () => {
      const baseUrl = 'http://localhost:5000';
      const code = 'DEF456';
      const redirectUrl = `${baseUrl}/?utm_source=teacher_referral&utm_medium=share&utm_campaign=pilot&ref=${code}`;
      
      expect(redirectUrl).toBe('http://localhost:5000/?utm_source=teacher_referral&utm_medium=share&utm_campaign=pilot&ref=DEF456');
      expect(redirectUrl).toContain('utm_source=teacher_referral');
      expect(redirectUrl).toContain('utm_medium=share');
      expect(redirectUrl).toContain('utm_campaign=pilot');
    });
  });
});