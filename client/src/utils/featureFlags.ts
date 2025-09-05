// Feature flag utility functions
// Centralized logic for checking feature flags across the application

/**
 * Check if feedback widget is enabled
 */
export function isFeedbackWidgetEnabled(): boolean {
  // Default to enabled in development, disabled in production
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  return localStorage.getItem('qi.features.enableFeedbackWidget') !== 'false';
}

/**
 * Check if NPS surveys are enabled
 */
export function isNpsEnabled(): boolean {
  // Default to enabled in development, disabled in production
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  return localStorage.getItem('qi.features.enableNps') !== 'false';
}

/**
 * Check if issue reporter is enabled
 */
export function isIssueReporterEnabled(): boolean {
  // Default to enabled in development, disabled in production
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  return localStorage.getItem('qi.features.enableIssueReporter') !== 'false';
}

/**
 * Check if share prompts are enabled
 */
export function isSharePromptEnabled(): boolean {
  // Disabled if privacy strict mode is enabled
  if (isPrivacyStrictModeEnabled()) {
    return false;
  }
  
  // Default to disabled for pilot
  return localStorage.getItem('qi.features.enableSharePrompt') === 'true';
}

/**
 * Check if rate prompts are enabled
 */
export function isRatePromptEnabled(): boolean {
  // Disabled if privacy strict mode is enabled
  if (isPrivacyStrictModeEnabled()) {
    return false;
  }
  
  // Default to disabled for pilot
  return localStorage.getItem('qi.features.enableRatePrompt') === 'true';
}

/**
 * Check if privacy strict mode is enabled
 * When enabled: disable referrals/prompts, restrict analytics to essential (auth, sync, dsar/erasure)
 */
export function isPrivacyStrictModeEnabled(): boolean {
  // Default to disabled
  return localStorage.getItem('qi.features.privacyStrictMode') === 'true';
}

/**
 * Check if invites are enabled (co-teacher invites)
 */
export function isInvitesEnabled(): boolean {
  // Disabled if privacy strict mode is enabled
  if (isPrivacyStrictModeEnabled()) {
    return false;
  }
  
  // Default to enabled in development, disabled in production unless explicitly enabled
  if (process.env.NODE_ENV !== 'development') {
    return localStorage.getItem('qi.features.enableInvites') === 'true';
  }
  
  return localStorage.getItem('qi.features.enableInvites') !== 'false';
}

/**
 * Check if referral links are enabled
 */
export function isReferralsEnabled(): boolean {
  // Disabled if privacy strict mode is enabled
  if (isPrivacyStrictModeEnabled()) {
    return false;
  }
  
  // Default to enabled in development, disabled in production unless explicitly enabled
  if (process.env.NODE_ENV !== 'development') {
    return localStorage.getItem('qi.features.enableReferrals') === 'true';
  }
  
  return localStorage.getItem('qi.features.enableReferrals') !== 'false';
}

// Backwards compatibility - alias for invites
export function isCoTeacherInvitesEnabled(): boolean {
  return isInvitesEnabled();
}

/**
 * Listen for feature flag changes
 */
export function useFeatureFlagListener(
  flag: 'feedback-widget' | 'nps' | 'issue-reporter' | 'share-prompt' | 'rate-prompt',
  callback: (enabled: boolean) => void
): () => void {
  const eventName = `${flag}-toggle`;
  
  const handleToggle = (event: CustomEvent) => {
    callback(event.detail.enabled);
  };
  
  window.addEventListener(eventName, handleToggle as EventListener);
  
  // Return cleanup function
  return () => {
    window.removeEventListener(eventName, handleToggle as EventListener);
  };
}