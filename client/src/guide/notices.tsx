// Guide acknowledgement notices system
// Adult-only critical path for destructive actions with audit logging

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { isGuide } from './auth';
import { pushEvent } from '../progress/events';

export interface GuideNoticeOptions {
  title: string;
  body: string;
  actions?: {
    acknowledge?: string; // Custom acknowledge button text (default: "Acknowledge")
    cancel?: string; // Custom cancel button text (default: "Cancel")
  };
}

interface GuideNoticeState {
  isOpen: boolean;
  noticeId: string;
  options: GuideNoticeOptions;
  onAcknowledge: () => void;
  onCancel?: () => void;
}

// Global state for notices
let globalNoticeState: GuideNoticeState | null = null;
let noticeUpdateCallback: (() => void) | null = null;

/**
 * Show a guide notice that requires explicit acknowledgement (Guide/Adult only)
 * Never shown to learners/kids - guarded by isGuide() check
 * 
 * @param noticeId Unique identifier for audit trail
 * @param options Notice content and button customization
 * @returns Promise that resolves to true if acknowledged, false if dismissed
 */
export function showGuideNotice(
  noticeId: string, 
  options: GuideNoticeOptions
): Promise<boolean> {
  // CRITICAL: Never show to non-guides (children)
  if (!isGuide()) {
    console.warn('Guide notice blocked - not in guide mode');
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    // Log that notice was shown
    pushEvent({
      kind: 'guide_ack',
      at: Date.now(),
      noticeId,
      action: 'shown',
      actor: 'guide'
    });

    globalNoticeState = {
      isOpen: true,
      noticeId,
      options,
      onAcknowledge: () => {
        // Log acknowledgement
        pushEvent({
          kind: 'guide_ack',
          at: Date.now(),
          noticeId,
          action: 'ack',
          actor: 'guide'
        });
        
        globalNoticeState = null;
        noticeUpdateCallback?.();
        resolve(true);
      },
      onCancel: () => {
        // Log dismissal
        pushEvent({
          kind: 'guide_ack',
          at: Date.now(),
          noticeId,
          action: 'dismiss',
          actor: 'guide'
        });
        
        globalNoticeState = null;
        noticeUpdateCallback?.();
        resolve(false);
      }
    };

    // Trigger UI update
    noticeUpdateCallback?.();
  });
}

/**
 * React component that renders the guide notice modal
 * Should be included once in the app root
 */
export function GuideNoticeProvider({ children }: { children: React.ReactNode }) {
  const [, forceUpdate] = useState({});

  // Register update callback
  React.useEffect(() => {
    noticeUpdateCallback = () => forceUpdate({});
    
    return () => {
      noticeUpdateCallback = null;
    };
  }, []);

  return (
    <>
      {children}
      {globalNoticeState && <GuideNoticeModal />}
    </>
  );
}

/**
 * Internal component that renders the actual modal
 */
function GuideNoticeModal() {
  if (!globalNoticeState) {
    return null;
  }

  const { isOpen, options, onAcknowledge, onCancel } = globalNoticeState;

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent 
        role="alertdialog" 
        aria-describedby="guide-notice-description"
        className="max-w-md"
      >
        <AlertDialogHeader>
          <AlertDialogTitle 
            aria-live="assertive" 
            className="text-orange-800 flex items-center gap-2"
          >
            ⚠️ {options.title}
          </AlertDialogTitle>
          <AlertDialogDescription id="guide-notice-description" className="text-gray-700">
            {options.body}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <AlertDialogCancel 
            onClick={onCancel}
            className="w-full sm:w-auto"
            data-testid="guide-notice-cancel"
          >
            {options.actions?.cancel || 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onAcknowledge}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
            data-testid="guide-notice-acknowledge"
          >
            {options.actions?.acknowledge || 'Acknowledge'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook to check if guide notices are currently supported
 */
export function useGuideNotices() {
  return {
    isGuide: isGuide(),
    showNotice: showGuideNotice
  };
}