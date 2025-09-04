/**
 * Class deep link utilities
 * Handles ?class=CODE URL parameter for direct class joining
 */

export interface ClassJoinResult {
  classCode: string;
  className?: string;
  success: boolean;
  message: string;
}

/**
 * Check if URL has class code parameter and extract it
 */
export function getClassCodeFromURL(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('class');
}

/**
 * Store class code for later processing after user setup
 */
export function storeLastClassCode(classCode: string): void {
  try {
    localStorage.setItem('qi.lastClassCode', classCode);
    console.log('✅ Class code stored for later:', classCode);
  } catch (error) {
    console.warn('⚠️ Failed to store class code:', error);
  }
}

/**
 * Get and clear stored class code
 */
export function getAndClearLastClassCode(): string | null {
  try {
    const classCode = localStorage.getItem('qi.lastClassCode');
    if (classCode) {
      localStorage.removeItem('qi.lastClassCode');
      console.log('✅ Retrieved and cleared class code:', classCode);
    }
    return classCode;
  } catch (error) {
    console.warn('⚠️ Failed to retrieve class code:', error);
    return null;
  }
}

/**
 * Clear class code parameter from URL without reload
 */
export function clearClassCodeFromURL(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('class');
  
  // Update URL without page reload
  window.history.replaceState({}, document.title, url.toString());
}

/**
 * Process class deep link on app initialization
 */
export function processClassDeepLink(): string | null {
  const classCode = getClassCodeFromURL();
  
  if (classCode) {
    console.log('🔗 Class deep link detected:', classCode);
    
    // Store for later processing
    storeLastClassCode(classCode);
    
    // Clean URL
    clearClassCodeFromURL();
    
    return classCode;
  }
  
  return null;
}

/**
 * Create a shareable class URL
 */
export function createClassURL(classCode: string, baseUrl: string = window.location.origin): string {
  const url = new URL(baseUrl);
  url.searchParams.set('class', classCode);
  return url.toString();
}