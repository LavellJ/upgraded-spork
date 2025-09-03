// Authentication API functions for cloud sync

import { saveAuth } from './model';
import type { Auth } from './model';

/**
 * Request magic link for authentication
 * In DEV: calls /api/dev/issue to get a JWT token
 * In PROD: stub that would send actual magic link email
 */
export async function requestMagicLink(email: string): Promise<{ success: boolean; token?: string; message: string }> {
  if (process.env.NODE_ENV === 'development') {
    try {
      const response = await fetch(`/api/dev/issue?email=${encodeURIComponent(email)}&role=guide`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        token: data.token,
        message: 'Development token generated successfully'
      };
    } catch (error) {
      console.error('Failed to request magic link:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate development token'
      };
    }
  } else {
    // Production: would send magic link email via backend
    return {
      success: true,
      message: 'Magic link sent to your email! Please check your inbox and click the link to sign in.'
    };
  }
}

/**
 * Verify JWT token and store it with expiration info
 */
export function verifyAndStoreToken(token: string): Auth {
  try {
    // Parse JWT payload (decode base64)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Decode payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    if (!payload.exp || !payload.sub) {
      throw new Error('Token missing required fields');
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      throw new Error('Token is expired');
    }
    
    const auth: Auth = {
      enabled: true,
      email: payload.sub,
      verified: true,
      token: token,
      exp: payload.exp, // Store expiration timestamp
      updatedAt: Date.now()
    };
    
    saveAuth(auth);
    return auth;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
}

/**
 * Check if token is close to expiry (7 days)
 */
export function isTokenNearExpiry(auth: Auth): boolean {
  if (!auth.exp) return false;
  
  const now = Math.floor(Date.now() / 1000);
  const sevenDaysInSeconds = 7 * 24 * 60 * 60;
  
  return (auth.exp - now) <= sevenDaysInSeconds;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(auth: Auth): boolean {
  if (!auth.exp) return false;
  
  const now = Math.floor(Date.now() / 1000);
  return auth.exp <= now;
}

/**
 * Get formatted expiry countdown text
 */
export function getExpiryCountdown(auth: Auth): string {
  if (!auth.exp) return '';
  
  const now = Math.floor(Date.now() / 1000);
  const remaining = auth.exp - now;
  
  if (remaining <= 0) return 'Expired';
  
  const days = Math.floor(remaining / (24 * 60 * 60));
  const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
  
  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'} remaining`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} remaining`;
  } else {
    return 'Less than 1 hour remaining';
  }
}