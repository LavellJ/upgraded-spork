/**
 * Share/Rate Prompt Component
 * Shows gentle opt-in prompts for sharing or rating after positive signals
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X, Copy, Star, Share2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { pushEvent } from '../progress/events';
import { isSharePromptEnabled, isRatePromptEnabled } from '../utils/featureFlags';
import { useReferrals } from '../hooks/useReferrals';
import { isEligibleForPrompt, isUserInActiveLesson } from '../utils/sharePromptTriggers';

// Storage namespace for share prompt state
const STORAGE_KEY = 'qi.sharePrompt.v1';

interface SharePromptState {
  lastShownAt: number;
  variant: 'share' | 'rate';
}

interface SharePromptProps {
  learnerId?: string;
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('qi.sessionId');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('qi.sessionId', sessionId);
  }
  return sessionId;
}

function getPromptState(): SharePromptState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setPromptState(state: SharePromptState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getVariantAssignment(): 'share' | 'rate' {
  // A/B test: 50/50 split based on session ID
  const sessionId = getSessionId();
  const hash = sessionId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return hash % 2 === 0 ? 'share' : 'rate';
}

function shouldShowPrompt(isEligible: boolean, isInActiveLesson: boolean): boolean {
  // Don't show if not eligible or in active lesson
  if (!isEligible || isInActiveLesson) {
    return false;
  }

  // Check throttling - once per 21 days
  const state = getPromptState();
  if (state) {
    const daysSinceLastShown = (Date.now() - state.lastShownAt) / (1000 * 60 * 60 * 24);
    if (daysSinceLastShown < 21) {
      return false;
    }
  }

  return true;
}

export function SharePrompt({ learnerId }: SharePromptProps) {
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<'share' | 'rate'>('share');
  const { toast } = useToast();
  const { createReferral } = useReferrals();

  useEffect(() => {
    // Check trigger conditions
    const isEligible = isEligibleForPrompt(learnerId);
    const isInActiveLesson = isUserInActiveLesson(learnerId);
    
    // Check if we should show the prompt
    if (!shouldShowPrompt(isEligible, isInActiveLesson)) {
      return;
    }

    // Check feature flags
    const assignedVariant = getVariantAssignment();
    const shareEnabled = isSharePromptEnabled();
    const rateEnabled = isRatePromptEnabled();

    // Skip if assigned variant is disabled
    if (assignedVariant === 'share' && !shareEnabled) {
      return;
    }
    if (assignedVariant === 'rate' && !rateEnabled) {
      return;
    }

    // Show the prompt
    setVariant(assignedVariant);
    setVisible(true);

    // Track that prompt was shown
    pushEvent({
      kind: 'scout_analytics',
      at: Date.now(),
      id: assignedVariant === 'share' ? 'share_prompt_shown' : 'rate_prompt_shown',
      priority: 'info',
      action: 'shown',
      sessionId: getSessionId(),
      abVariant: { type: assignedVariant }
    });

    // Update state to enforce throttling
    setPromptState({
      lastShownAt: Date.now(),
      variant: assignedVariant
    });
  }, [learnerId]);

  const handleDismiss = () => {
    setVisible(false);
  };

  const handleShareClick = async () => {
    try {
      // Track the share click
      pushEvent({
        kind: 'scout_analytics',
        at: Date.now(),
        id: 'share_prompt_click',
        priority: 'info',
        action: 'clicked',
        sessionId: getSessionId(),
        abVariant: { action: 'copy_referral_link' }
      });

      // Create a referral link if none exists
      const referral = await createReferral();
      if (referral) {
        // Copy to clipboard
        await navigator.clipboard.writeText(referral.url);
        toast({
          kind: 'success',
          text: 'Referral link copied to clipboard!'
        });
      } else {
        toast({
          kind: 'error',
          text: 'Failed to create referral link. Please try again.'
        });
      }
    } catch (err) {
      console.error('Failed to copy referral link:', err);
      toast({
        kind: 'error',
        text: 'Failed to copy link. Please try again.'
      });
    }
    
    setVisible(false);
  };

  const handleRateClick = () => {
    // Track the rate click
    pushEvent({
      kind: 'scout_analytics',
      at: Date.now(),
      id: 'rate_prompt_click',
      priority: 'info',
      action: 'clicked',
      sessionId: getSessionId(),
      abVariant: { action: 'open_feedback_widget' }
    });

    // Dispatch event to open feedback widget
    window.dispatchEvent(new CustomEvent('open-feedback-widget'));
    setVisible(false);
  };

  const handleNoThanks = () => {
    pushEvent({
      kind: 'scout_analytics',
      at: Date.now(),
      id: variant === 'share' ? 'share_prompt_dismissed' : 'rate_prompt_dismissed',
      priority: 'info',
      action: 'dismissed',
      sessionId: getSessionId(),
      abVariant: { action: 'no_thanks' }
    });
    
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
      data-testid={`${variant}-prompt`}
    >
      <div className="bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {variant === 'share' ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="w-4 h-4 text-[rgb(var(--fg-accent))]" />
                  <h3 className="font-medium">Share Quest Island with a colleague</h3>
                </div>
                <p className="text-sm text-[rgb(var(--fg-muted))] mb-3">
                  Help other teachers discover AI-powered learning for their students
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleShareClick}
                    data-testid="button-share-copy-link"
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Copy referral link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNoThanks}
                    data-testid="button-share-no-thanks"
                  >
                    No thanks
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-[rgb(var(--fg-accent))]" />
                  <h3 className="font-medium">Rate your experience</h3>
                </div>
                <p className="text-sm text-[rgb(var(--fg-muted))] mb-3">
                  Help us improve LearnOz by sharing your feedback
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleRateClick}
                    data-testid="button-rate-feedback"
                  >
                    <Star className="w-3 h-3 mr-2" />
                    Share feedback
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNoThanks}
                    data-testid="button-rate-later"
                  >
                    Later
                  </Button>
                </div>
              </>
            )}
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleDismiss}
            className="p-1 h-auto min-w-0"
            data-testid="button-dismiss-prompt"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}