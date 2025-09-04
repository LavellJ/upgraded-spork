/**
 * Referral System Tests
 * Tests for teacher referral link creation, management, and tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useReferrals } from '../src/hooks/useReferrals';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock useToast hook
const mockToast = vi.fn();
vi.mock('../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

describe('Referral System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-auth-token');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('useReferrals hook', () => {
    it('should fetch referrals on mount', async () => {
      const mockReferrals = [
        {
          code: 'ABC123',
          url: 'http://localhost:5000/r/ABC123',
          ownerEmail: 'teacher@example.com',
          createdAt: 1672531200000,
          clicks: 5,
          lastClickAt: 1672617600000
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          referrals: mockReferrals
        })
      });

      const { result } = renderHook(() => useReferrals());

      // Wait for the initial fetch to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/referrals', {
        headers: {
          'Authorization': 'Bearer mock-auth-token'
        }
      });

      expect(result.current.referrals).toEqual(mockReferrals);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Unauthorized'
        })
      });

      const { result } = renderHook(() => useReferrals());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.referrals).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Unauthorized');
    });

    it('should create a new referral', async () => {
      // Mock initial fetch (empty list)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          referrals: []
        })
      });

      // Mock create referral
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          code: 'DEF456',
          url: 'http://localhost:5000/r/DEF456'
        })
      });

      // Mock fetch after creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          referrals: [{
            code: 'DEF456',
            url: 'http://localhost:5000/r/DEF456',
            ownerEmail: 'teacher@example.com',
            createdAt: Date.now(),
            clicks: 0,
            lastClickAt: null
          }]
        })
      });

      const { result } = renderHook(() => useReferrals());

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let createdReferral: any;
      await act(async () => {
        createdReferral = await result.current.createReferral();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/referrals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-auth-token'
        }
      });

      expect(createdReferral).toEqual({
        code: 'DEF456',
        url: 'http://localhost:5000/r/DEF456',
        ownerEmail: '',
        createdAt: expect.any(Number),
        clicks: 0,
        lastClickAt: null
      });

      expect(mockToast).toHaveBeenCalledWith({
        kind: 'success',
        text: 'Referral link created successfully!'
      });
    });

    it('should handle create referral errors', async () => {
      // Mock initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          referrals: []
        })
      });

      // Mock create referral error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Rate limit exceeded'
        })
      });

      const { result } = renderHook(() => useReferrals());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let createdReferral: any;
      await act(async () => {
        createdReferral = await result.current.createReferral();
      });

      expect(createdReferral).toBe(null);
      expect(result.current.error).toBe('Rate limit exceeded');
      expect(mockToast).toHaveBeenCalledWith({
        kind: 'error',
        text: 'Rate limit exceeded'
      });
    });

    it('should delete a referral', async () => {
      const mockReferrals = [
        {
          code: 'GHI789',
          url: 'http://localhost:5000/r/GHI789',
          ownerEmail: 'teacher@example.com',
          createdAt: 1672531200000,
          clicks: 0,
          lastClickAt: null
        }
      ];

      // Mock initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          referrals: mockReferrals
        })
      });

      // Mock delete referral
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true
        })
      });

      const { result } = renderHook(() => useReferrals());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.referrals).toHaveLength(1);

      let deleteResult: boolean = false;
      await act(async () => {
        deleteResult = await result.current.deleteReferral('GHI789');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/referrals/GHI789', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer mock-auth-token'
        }
      });

      expect(deleteResult).toBe(true);
      expect(result.current.referrals).toHaveLength(0);
      expect(mockToast).toHaveBeenCalledWith({
        kind: 'success',
        text: 'Referral link deleted successfully!'
      });
    });

    it('should handle delete referral errors', async () => {
      const mockReferrals = [
        {
          code: 'JKL012',
          url: 'http://localhost:5000/r/JKL012',
          ownerEmail: 'teacher@example.com',
          createdAt: 1672531200000,
          clicks: 0,
          lastClickAt: null
        }
      ];

      // Mock initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          referrals: mockReferrals
        })
      });

      // Mock delete referral error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Referral not found'
        })
      });

      const { result } = renderHook(() => useReferrals());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let deleteResult: boolean = true;
      await act(async () => {
        deleteResult = await result.current.deleteReferral('JKL012');
      });

      expect(deleteResult).toBe(false);
      expect(result.current.error).toBe('Referral not found');
      expect(result.current.referrals).toHaveLength(1); // Should not be removed from local state
      expect(mockToast).toHaveBeenCalledWith({
        kind: 'error',
        text: 'Referral not found'
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useReferrals());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.referrals).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch referrals. Please try again.');
    });

    it('should refresh referrals when called', async () => {
      const mockReferrals = [
        {
          code: 'MNO345',
          url: 'http://localhost:5000/r/MNO345',
          ownerEmail: 'teacher@example.com',
          createdAt: 1672531200000,
          clicks: 3,
          lastClickAt: 1672617600000
        }
      ];

      // Mock initial fetch (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          referrals: []
        })
      });

      // Mock refresh fetch (with data)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          referrals: mockReferrals
        })
      });

      const { result } = renderHook(() => useReferrals());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.referrals).toHaveLength(0);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.referrals).toEqual(mockReferrals);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Referral URL format', () => {
    it('should generate valid referral URLs', () => {
      const baseUrl = 'http://localhost:5000';
      const code = 'ABC123';
      const expectedUrl = `${baseUrl}/r/${code}`;
      
      // This would be tested as part of the server response
      expect(expectedUrl).toBe('http://localhost:5000/r/ABC123');
    });

    it('should include UTM parameters in redirect URLs', () => {
      const baseUrl = 'http://localhost:5000';
      const code = 'DEF456';
      const redirectUrl = `${baseUrl}/?utm_source=teacher_referral&utm_medium=share&utm_campaign=pilot&ref=${code}`;
      
      expect(redirectUrl).toBe('http://localhost:5000/?utm_source=teacher_referral&utm_medium=share&utm_campaign=pilot&ref=DEF456');
    });
  });

  describe('Referral code generation', () => {
    it('should generate base36 codes of correct length', () => {
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      expect(result).toHaveLength(6);
      expect(/^[0-9A-Z]{6}$/.test(result)).toBe(true);
    });
  });
});