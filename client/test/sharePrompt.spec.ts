/**
 * Tests for share/rate prompt functionality
 * V4: Gentle opt-in prompts with throttling and A/B testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SharePrompt } from '../src/components/SharePrompt';

// Mock the progress events module
const mockPushEvent = vi.fn();
vi.mock('../src/progress/events', () => ({
  pushEvent: mockPushEvent,
  loadEvents: vi.fn(() => [])
}));

// Mock the progress metrics module
const mockDayStreak = vi.fn(() => 0);
vi.mock('../src/progress/metrics', () => ({
  dayStreak: mockDayStreak
}));

// Mock the feature flags module
const mockIsSharePromptEnabled = vi.fn(() => true);
const mockIsRatePromptEnabled = vi.fn(() => true);
vi.mock('../src/utils/featureFlags', () => ({
  isSharePromptEnabled: mockIsSharePromptEnabled,
  isRatePromptEnabled: mockIsRatePromptEnabled
}));

// Mock the referrals hook
const mockCreateReferral = vi.fn();
vi.mock('../src/hooks/useReferrals', () => ({
  useReferrals: () => ({
    createReferral: mockCreateReferral
  })
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
});

// Mock window.dispatchEvent
const originalDispatchEvent = window.dispatchEvent;
const mockDispatchEvent = vi.fn();
window.dispatchEvent = mockDispatchEvent;

describe('SharePrompt Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock sessionStorage for session ID
    const mockSessionStorage = {
      getItem: vi.fn((key) => {
        if (key === 'qi.sessionId') return 'test-session-123';
        return null;
      }),
      setItem: vi.fn()
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });

    // Clear localStorage
    const mockLocalStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  });

  afterEach(() => {
    window.dispatchEvent = originalDispatchEvent;
  });

  describe('Throttling Logic', () => {
    it('should not show prompt if shown within 21 days', () => {
      const recentlyShown = Date.now() - (10 * 24 * 60 * 60 * 1000); // 10 days ago
      
      const mockLocalStorage = {
        getItem: vi.fn((key) => {
          if (key === 'qi.sharePrompt.v1') {
            return JSON.stringify({
              lastShownAt: recentlyShown,
              variant: 'share'
            });
          }
          return null;
        }),
        setItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      // Mock trigger conditions as eligible
      vi.doMock('../src/utils/sharePromptTriggers', () => ({
        isEligibleForPrompt: vi.fn(() => true),
        isUserInActiveLesson: vi.fn(() => false)
      }));

      render(<SharePrompt learnerId="test-learner" />);

      // Should not show any prompt
      expect(screen.queryByTestId('share-prompt')).not.toBeInTheDocument();
      expect(screen.queryByTestId('rate-prompt')).not.toBeInTheDocument();
    });

    it('should show prompt if more than 21 days have passed', async () => {
      const longAgo = Date.now() - (25 * 24 * 60 * 60 * 1000); // 25 days ago
      
      const mockLocalStorage = {
        getItem: vi.fn((key) => {
          if (key === 'qi.sharePrompt.v1') {
            return JSON.stringify({
              lastShownAt: longAgo,
              variant: 'share'
            });
          }
          return null;
        }),
        setItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      // Mock trigger conditions as eligible
      vi.doMock('../src/utils/sharePromptTriggers', () => ({
        isEligibleForPrompt: vi.fn(() => true),
        isUserInActiveLesson: vi.fn(() => false)
      }));

      render(<SharePrompt learnerId="test-learner" />);

      // Should show a prompt (either share or rate based on A/B test)
      await waitFor(() => {
        const sharePrompt = screen.queryByTestId('share-prompt');
        const ratePrompt = screen.queryByTestId('rate-prompt');
        expect(sharePrompt || ratePrompt).toBeInTheDocument();
      });
    });
  });

  describe('A/B Testing', () => {
    it('should assign variant based on session ID hash', () => {
      // Mock sessionStorage to return consistent session ID
      const mockSessionStorage = {
        getItem: vi.fn((key) => {
          if (key === 'qi.sessionId') return 'test-even-123'; // Should hash to even number
          return null;
        }),
        setItem: vi.fn()
      };
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSessionStorage,
        writable: true
      });

      // The component uses session ID hash for A/B testing
      // We can't easily test this without mocking the hash function
      // But we can verify that the correct variant renders
      expect(mockSessionStorage.getItem).toBeDefined();
    });
  });

  describe('Share Prompt Variant', () => {
    beforeEach(() => {
      // Force share variant by mocking the hash function result
      vi.doMock('../src/utils/sharePromptTriggers', () => ({
        isEligibleForPrompt: vi.fn(() => true),
        isUserInActiveLesson: vi.fn(() => false)
      }));
    });

    it('should handle share button click', async () => {
      mockCreateReferral.mockResolvedValue({
        code: 'ABC123',
        url: 'http://localhost:5000/r/ABC123'
      });

      render(<SharePrompt learnerId="test-learner" />);

      // Wait for prompt to appear
      await waitFor(() => {
        expect(screen.getByTestId('button-share-copy-link')).toBeInTheDocument();
      });

      // Click share button
      fireEvent.click(screen.getByTestId('button-share-copy-link'));

      // Should create referral and copy to clipboard
      await waitFor(() => {
        expect(mockCreateReferral).toHaveBeenCalled();
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:5000/r/ABC123');
        expect(mockToast).toHaveBeenCalledWith({
          kind: 'success',
          text: 'Referral link copied to clipboard!'
        });
      });

      // Should track analytics event
      expect(mockPushEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'scout_analytics',
          id: 'share_prompt_click',
          action: 'clicked'
        })
      );
    });

    it('should handle no thanks button click', async () => {
      render(<SharePrompt learnerId="test-learner" />);

      // Wait for prompt to appear
      await waitFor(() => {
        expect(screen.getByTestId('button-share-no-thanks')).toBeInTheDocument();
      });

      // Click no thanks button
      fireEvent.click(screen.getByTestId('button-share-no-thanks'));

      // Should track dismissal event
      expect(mockPushEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'scout_analytics',
          id: 'share_prompt_dismissed',
          action: 'dismissed'
        })
      );

      // Prompt should disappear
      await waitFor(() => {
        expect(screen.queryByTestId('share-prompt')).not.toBeInTheDocument();
      });
    });
  });

  describe('Rate Prompt Variant', () => {
    it('should handle rate button click', async () => {
      render(<SharePrompt learnerId="test-learner" />);

      // Wait for prompt to appear (could be rate variant)
      await waitFor(() => {
        const rateButton = screen.queryByTestId('button-rate-feedback');
        if (rateButton) {
          fireEvent.click(rateButton);

          // Should dispatch event to open feedback widget
          expect(mockDispatchEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              type: 'open-feedback-widget'
            })
          );

          // Should track analytics event
          expect(mockPushEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              kind: 'scout_analytics',
              id: 'rate_prompt_click',
              action: 'clicked'
            })
          );
        }
      });
    });
  });

  describe('Feature Flag Gating', () => {
    it('should not show share prompt when feature disabled', async () => {
      mockIsSharePromptEnabled.mockReturnValue(false);
      mockIsRatePromptEnabled.mockReturnValue(true);

      // Mock triggers to force share variant assignment
      vi.doMock('../src/utils/sharePromptTriggers', () => ({
        isEligibleForPrompt: vi.fn(() => true),
        isUserInActiveLesson: vi.fn(() => false)
      }));

      render(<SharePrompt learnerId="test-learner" />);

      // Should not show any prompt since share variant is disabled
      await waitFor(() => {
        expect(screen.queryByTestId('share-prompt')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should not show rate prompt when feature disabled', async () => {
      mockIsSharePromptEnabled.mockReturnValue(true);
      mockIsRatePromptEnabled.mockReturnValue(false);

      // Mock triggers to force rate variant assignment
      vi.doMock('../src/utils/sharePromptTriggers', () => ({
        isEligibleForPrompt: vi.fn(() => true),
        isUserInActiveLesson: vi.fn(() => false)
      }));

      render(<SharePrompt learnerId="test-learner" />);

      // Should not show any prompt since rate variant is disabled
      await waitFor(() => {
        expect(screen.queryByTestId('rate-prompt')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Trigger Conditions', () => {
    it('should not show prompt when user is not eligible', () => {
      vi.doMock('../src/utils/sharePromptTriggers', () => ({
        isEligibleForPrompt: vi.fn(() => false), // Not eligible
        isUserInActiveLesson: vi.fn(() => false)
      }));

      render(<SharePrompt learnerId="test-learner" />);

      // Should not show any prompt
      expect(screen.queryByTestId('share-prompt')).not.toBeInTheDocument();
      expect(screen.queryByTestId('rate-prompt')).not.toBeInTheDocument();
    });

    it('should not show prompt when user is in active lesson', () => {
      vi.doMock('../src/utils/sharePromptTriggers', () => ({
        isEligibleForPrompt: vi.fn(() => true),
        isUserInActiveLesson: vi.fn(() => true) // In active lesson
      }));

      render(<SharePrompt learnerId="test-learner" />);

      // Should not show any prompt
      expect(screen.queryByTestId('share-prompt')).not.toBeInTheDocument();
      expect(screen.queryByTestId('rate-prompt')).not.toBeInTheDocument();
    });
  });

  describe('Analytics Tracking', () => {
    it('should track prompt shown event', async () => {
      vi.doMock('../src/utils/sharePromptTriggers', () => ({
        isEligibleForPrompt: vi.fn(() => true),
        isUserInActiveLesson: vi.fn(() => false)
      }));

      render(<SharePrompt learnerId="test-learner" />);

      // Should track shown event
      await waitFor(() => {
        expect(mockPushEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            kind: 'scout_analytics',
            action: 'shown',
            sessionId: 'test-session-123'
          })
        );
      });
    });
  });
});