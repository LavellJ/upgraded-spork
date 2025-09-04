/**
 * Feedback model and storage functions
 * Stores feedback locally with optional cloud submission
 */

export type FeedbackKind = 'idea' | 'bug' | 'confusion';

export interface Feedback {
  id: string;
  at: number; // timestamp
  kind: FeedbackKind;
  text: string;
  email?: string;
  meta: {
    appVersion: string;
    userAgent: string;
    locale: string;
    classActive?: string;
    guardrailsOn?: boolean;
    featureFlags?: Record<string, boolean>;
    url?: string;
  };
}

/**
 * Get storage namespace for user feedback
 */
function getFeedbackStorageKey(userId: string): string {
  return `qi.feedback.v1.${userId}`;
}

/**
 * Add new feedback entry
 */
export function addFeedback(userId: string, feedback: Omit<Feedback, 'id' | 'at'>): Feedback {
  const newFeedback: Feedback = {
    ...feedback,
    id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    at: Date.now(),
  };

  const existingFeedback = listFeedback(userId);
  const updatedFeedback = [...existingFeedback, newFeedback];
  
  try {
    localStorage.setItem(getFeedbackStorageKey(userId), JSON.stringify(updatedFeedback));
    console.log('✅ Feedback saved locally:', newFeedback.id);
  } catch (error) {
    console.error('❌ Failed to save feedback locally:', error);
  }

  return newFeedback;
}

/**
 * List all feedback for user
 */
export function listFeedback(userId: string): Feedback[] {
  try {
    const stored = localStorage.getItem(getFeedbackStorageKey(userId));
    if (!stored) return [];
    
    const feedback = JSON.parse(stored) as Feedback[];
    // Sort by timestamp, newest first
    return feedback.sort((a, b) => b.at - a.at);
  } catch (error) {
    console.error('❌ Failed to load feedback from storage:', error);
    return [];
  }
}

/**
 * Clear all feedback for user (for testing/privacy)
 */
export function clearFeedback(userId: string): void {
  try {
    localStorage.removeItem(getFeedbackStorageKey(userId));
    console.log('✅ Feedback cleared for user:', userId);
  } catch (error) {
    console.error('❌ Failed to clear feedback:', error);
  }
}

/**
 * Export feedback as CSV string
 */
export function exportFeedbackCSV(userId: string): string {
  const feedback = listFeedback(userId);
  
  if (feedback.length === 0) {
    return 'No feedback data to export';
  }

  const headers = ['ID', 'Timestamp', 'Kind', 'Text', 'Email', 'App Version', 'User Agent', 'Locale', 'Class Active', 'URL'];
  const csvRows = [headers.join(',')];

  feedback.forEach(item => {
    const row = [
      `"${item.id}"`,
      `"${new Date(item.at).toISOString()}"`,
      `"${item.kind}"`,
      `"${item.text.replace(/"/g, '""')}"`, // Escape quotes in text
      `"${item.email || ''}"`,
      `"${item.meta.appVersion}"`,
      `"${item.meta.userAgent.substring(0, 50)}..."`, // Truncate long user agent
      `"${item.meta.locale}"`,
      `"${item.meta.classActive || ''}"`,
      `"${item.meta.url || ''}"`
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Get current app metadata for feedback
 */
export function getCurrentMeta(classActive?: string): Feedback['meta'] {
  return {
    appVersion: '1.0.0-pilot', // Could be from package.json or env
    userAgent: navigator.userAgent,
    locale: navigator.language || 'en-US',
    classActive,
    guardrailsOn: false, // TODO: get from app state
    featureFlags: {}, // TODO: get from feature flags
    url: window.location.href,
  };
}

/**
 * Submit feedback to cloud (optional)
 */
export async function submitFeedbackToCloud(feedback: Feedback): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    });

    if (response.ok) {
      console.log('✅ Feedback submitted to cloud:', feedback.id);
      return true;
    } else {
      console.warn('⚠️ Cloud feedback submission failed:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('⚠️ Cloud feedback submission error:', error);
    return false;
  }
}