// Guide authentication and permissions
// Controls access to adult-only features like privacy controls and audit logs

const GUIDE_STORAGE_KEY = 'qi.guide.v1';

export interface GuideAuth {
  enabled: boolean;
  enabledAt?: number;
  // No password/token required - this is just a local flag to prevent accidental access by children
}

/**
 * Load guide authentication state
 */
export function loadGuideAuth(): GuideAuth {
  try {
    const stored = localStorage.getItem(GUIDE_STORAGE_KEY);
    if (!stored) return { enabled: false };
    
    const auth = JSON.parse(stored) as GuideAuth;
    
    // Validate structure
    if (typeof auth.enabled !== 'boolean') {
      console.warn('Invalid guide auth data, resetting');
      return { enabled: false };
    }
    
    return auth;
  } catch (error) {
    console.error('Failed to load guide auth:', error);
    return { enabled: false };
  }
}

/**
 * Save guide authentication state
 */
export function saveGuideAuth(auth: GuideAuth): void {
  try {
    localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(auth));
  } catch (error) {
    console.error('Failed to save guide auth:', error);
  }
}

/**
 * Enable guide mode (adult verification)
 */
export function enableGuideMode(): GuideAuth {
  const auth: GuideAuth = {
    enabled: true,
    enabledAt: Date.now()
  };
  
  saveGuideAuth(auth);
  return auth;
}

/**
 * Disable guide mode
 */
export function disableGuideMode(): GuideAuth {
  const auth: GuideAuth = {
    enabled: false
  };
  
  saveGuideAuth(auth);
  return auth;
}

/**
 * Check if guide mode is currently enabled
 */
export function isGuide(): boolean {
  const auth = loadGuideAuth();
  return auth.enabled;
}

/**
 * Toggle guide mode state
 */
export function toggleGuideMode(): GuideAuth {
  const current = loadGuideAuth();
  
  if (current.enabled) {
    return disableGuideMode();
  } else {
    return enableGuideMode();
  }
}