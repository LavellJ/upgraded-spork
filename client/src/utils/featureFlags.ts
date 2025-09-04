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
  // Default to enabled in development, disabled in production
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  return localStorage.getItem('qi.features.enableSharePrompt') !== 'false';
}

/**
 * Check if rate prompts are enabled
 */
export function isRatePromptEnabled(): boolean {
  // Default to enabled in development, disabled in production
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  return localStorage.getItem('qi.features.enableRatePrompt') !== 'false';
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