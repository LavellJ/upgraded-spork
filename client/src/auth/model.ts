// Adult authentication model for optional cloud sync

export type Auth = {
  enabled: boolean;
  email?: string;
  verified: boolean;
  token?: string;
  exp?: number; // JWT expiration timestamp
  updatedAt: number;
};

const STORAGE_KEY = 'qi.auth.v1';

// Default auth state - local-first by default
const defaultAuth: Auth = {
  enabled: false,
  verified: false,
  updatedAt: Date.now()
};

/**
 * Load auth state from localStorage
 */
export function loadAuth(): Auth {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultAuth;
    
    const auth = JSON.parse(stored) as Auth;
    
    // Validate required fields
    if (typeof auth.enabled !== 'boolean' || 
        typeof auth.verified !== 'boolean' || 
        typeof auth.updatedAt !== 'number') {
      console.warn('Invalid auth data, resetting to default');
      return defaultAuth;
    }
    
    return auth;
  } catch (error) {
    console.error('Failed to load auth state:', error);
    return defaultAuth;
  }
}

/**
 * Save auth state to localStorage
 */
export function saveAuth(auth: Auth): void {
  try {
    const authToSave = {
      ...auth,
      updatedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authToSave));
  } catch (error) {
    console.error('Failed to save auth state:', error);
  }
}

/**
 * Enable cloud sync with email
 */
export function enableCloudSync(email: string): Auth {
  const auth: Auth = {
    enabled: true,
    email: email.trim().toLowerCase(),
    verified: false,
    updatedAt: Date.now()
  };
  
  saveAuth(auth);
  return auth;
}

/**
 * Send magic link (DEPRECATED - use requestMagicLink from ./api.ts instead)
 */
export function sendMagicLink(auth: Auth): Auth {
  console.warn('sendMagicLink is deprecated, use requestMagicLink from ./api.ts');
  
  if (!auth.enabled || !auth.email) {
    throw new Error('Cloud sync must be enabled with email first');
  }
  
  // In DEV: just generate a token and mark as verified
  const verifiedAuth: Auth = {
    ...auth,
    verified: true,
    token: `dev_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    updatedAt: Date.now()
  };
  
  saveAuth(verifiedAuth);
  
  // Log for development
  console.log('[Auth] Magic link sent (DEV mode):', {
    email: auth.email,
    token: verifiedAuth.token
  });
  
  return verifiedAuth;
}

/**
 * Disable cloud sync and return to local-only
 */
export function disableCloudSync(): Auth {
  const auth: Auth = {
    enabled: false,
    verified: false,
    updatedAt: Date.now()
  };
  
  saveAuth(auth);
  return auth;
}

/**
 * Check if user is authenticated for cloud sync
 */
export function isCloudSyncReady(auth: Auth): boolean {
  return auth.enabled && auth.verified && !!auth.token;
}

/**
 * Clear all auth data (for testing/reset)
 */
export function clearAuth(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
}