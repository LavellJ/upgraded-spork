// Transport layer for sync - abstracts backend communication

import type { SyncItem, SyncResult } from './types';
import { loadAuth, isCloudSyncReady } from '../auth/model';
import { loadProfile } from '../profile/model';

// Transport configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterFactor: 0.1
};

// Error classification
export type ErrorType = 'fatal' | 'retryable' | 'network';

export interface TransportError {
  type: ErrorType;
  code: number;
  message: string;
  userMessage: string;
}

// Enhanced sync result with error details
export interface EnhancedSyncResult extends SyncResult {
  errorDetails?: TransportError;
}

// Dev telemetry buffer for debugging
const devErrorLog: Array<{ timestamp: number; error: TransportError; context: any }> = [];

function logSyncError(error: TransportError, context: any = {}): void {
  if (process.env.NODE_ENV === 'development') {
    const entry = { timestamp: Date.now(), error, context };
    devErrorLog.push(entry);
    
    // Keep only last 50 entries
    if (devErrorLog.length > 50) {
      devErrorLog.shift();
    }
    
    console.debug('🔄 Sync error logged:', entry);
  }
}

// Export dev error log for debugging
export function getDevErrorLog() {
  return process.env.NODE_ENV === 'development' ? [...devErrorLog] : [];
}

// Classify HTTP status codes
function classifyError(status: number, message: string): TransportError {
  if (status === 401) {
    return {
      type: 'fatal',
      code: status,
      message: 'Authentication expired',
      userMessage: 'Sign in again to continue syncing'
    };
  }
  
  if (status === 403) {
    return {
      type: 'fatal', 
      code: status,
      message: 'Access forbidden',
      userMessage: 'Access denied - check your permissions'
    };
  }
  
  if (status === 429) {
    return {
      type: 'retryable',
      code: status,
      message: 'Rate limited',
      userMessage: 'Sync will retry automatically'
    };
  }
  
  if (status >= 500) {
    return {
      type: 'retryable',
      code: status,
      message: `Server error (${status})`,
      userMessage: "We'll keep your progress safe offline"
    };
  }
  
  if (status >= 400) {
    return {
      type: 'fatal',
      code: status,
      message: `Client error (${status})`,
      userMessage: 'Something went wrong - please try again'
    };
  }
  
  return {
    type: 'network',
    code: 0,
    message: message || 'Network error',
    userMessage: "Connection issue - we'll keep trying"
  };
}

// Calculate retry delay with exponential backoff and jitter
function calculateRetryDelay(attempt: number): number {
  const baseDelay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  const jitter = baseDelay * RETRY_CONFIG.jitterFactor * (Math.random() - 0.5);
  const delayWithJitter = baseDelay + jitter;
  return Math.min(delayWithJitter, RETRY_CONFIG.maxDelayMs);
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Context for sync operations
export interface SyncContext {
  userId: string;
  learnerId: string;
}

// Transport interface for sending batches to backend
export interface SyncTransport {
  send(batch: SyncItem[], context: SyncContext): Promise<SyncResult>;
}

// Helper functions for deriving IDs
function getUserId(): string {
  const auth = loadAuth();
  
  if (auth.enabled && auth.email) {
    // Use email hash for authenticated users
    return btoa(auth.email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }
  
  // Use dev-user for development
  return 'dev-user';
}

function getLearnerId(): string {
  const profile = loadProfile();
  
  // Create consistent learner ID based on profile data
  if (profile.name) {
    const nameHash = btoa(profile.name.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
    return `learner_${nameHash}_${profile.createdAt}`;
  }
  
  // Fallback to creation timestamp
  return `learner_${profile.createdAt}`;
}

// Get current sync context
export function getSyncContext(): SyncContext {
  return {
    userId: getUserId(),
    learnerId: getLearnerId()
  };
}

// Cloud transport for authenticated users with retry logic
class CloudTransport implements SyncTransport {
  private readonly CLOUD_ENDPOINT = '/api';
  
  async send(batch: SyncItem[], context: SyncContext): Promise<EnhancedSyncResult> {
    const auth = loadAuth();
    
    if (!isCloudSyncReady(auth)) {
      const error = classifyError(0, 'Cloud sync not ready');
      logSyncError(error, { context });
      return {
        ok: false,
        error: 'Cloud sync not ready',
        errorDetails: error
      };
    }
    
    return this.sendWithRetry(batch, context, 0);
  }
  
  private async sendWithRetry(batch: SyncItem[], context: SyncContext, attempt: number): Promise<EnhancedSyncResult> {
    try {
      const auth = loadAuth();
      
      const response = await fetch(`${this.CLOUD_ENDPOINT}/sync/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          userId: context.userId,
          learnerId: context.learnerId,
          items: batch
        })
      });
      
      // Handle authentication failure immediately
      if (response.status === 401) {
        const error = classifyError(401, 'Authentication expired');
        logSyncError(error, { context, attempt });
        
        // Mark auth as invalid and pause sync
        const { disableCloudSync } = await import('../auth/model');
        disableCloudSync();
        
        // Dispatch event to notify settings UI
        window.dispatchEvent(new CustomEvent('auth-expired', {
          detail: { message: error.userMessage }
        }));
        
        return {
          ok: false,
          error: error.message,
          authExpired: true,
          errorDetails: error
        };
      }
      
      // Handle retryable errors with exponential backoff
      if ((response.status === 429 || response.status >= 500) && attempt < RETRY_CONFIG.maxRetries) {
        const error = classifyError(response.status, `HTTP ${response.status}`);
        logSyncError(error, { context, attempt, willRetry: true });
        
        const delay = calculateRetryDelay(attempt);
        console.debug(`🔄 Retrying sync in ${delay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`);
        
        await sleep(delay);
        return this.sendWithRetry(batch, context, attempt + 1);
      }
      
      // Handle other errors
      if (!response.ok) {
        const error = classifyError(response.status, `HTTP ${response.status} - ${response.statusText}`);
        logSyncError(error, { context, attempt });
        
        return {
          ok: false,
          error: error.message,
          errorDetails: error
        };
      }
      
      // Success case
      const result = await response.json();
      console.debug('✅ Sync batch sent:', { accepted: result.accepted, total: batch.length, attempt });
      
      return { 
        ok: true,
        mergeData: result.mergeData || undefined
      };
      
    } catch (error) {
      const transportError = classifyError(0, error instanceof Error ? error.message : 'Network error');
      logSyncError(transportError, { context, attempt, networkError: true });
      
      // Retry network errors
      if (transportError.type === 'network' && attempt < RETRY_CONFIG.maxRetries) {
        const delay = calculateRetryDelay(attempt);
        console.debug(`🔄 Retrying after network error in ${delay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`);
        
        await sleep(delay);
        return this.sendWithRetry(batch, context, attempt + 1);
      }
      
      return {
        ok: false,
        error: transportError.message,
        errorDetails: transportError
      };
    }
  }
}

// Development stub transport that simulates backend calls
class StubTransport implements SyncTransport {
  private failureRate: number = 0; // 0-1, for testing failures
  
  async send(batch: SyncItem[], context: SyncContext): Promise<SyncResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Log the batch for debugging
    console.debug('SYNC batch (stub)', { context, batch });
    
    // Simulate occasional failures in dev mode
    if (this.failureRate > 0 && Math.random() < this.failureRate) {
      return {
        ok: false,
        error: 'Simulated network failure'
      };
    }
    
    return { ok: true };
  }
  
  // Set failure rate for testing (0-1)
  setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }
}

// Transport instances
const defaultTransport = new StubTransport();
const cloudTransport = new CloudTransport();

// Main send function - switches between local and cloud based on auth
export async function send(batch: SyncItem[]): Promise<SyncResult> {
  const auth = loadAuth();
  const context = getSyncContext();
  
  if (isCloudSyncReady(auth)) {
    // Use cloud transport when authenticated
    return cloudTransport.send(batch, context);
  } else {
    // Use local stub by default
    return defaultTransport.send(batch, context);
  }
}

// For testing - set failure rate
export function setTransportFailureRate(rate: number): void {
  defaultTransport.setFailureRate(rate);
}

// Manual test helper for browser console
// To test sync integration:
//   1. Enable cloud sync: localStorage.setItem('qi.auth.v1', JSON.stringify({enabled:true,verified:true,token:'test_token_123',email:'test@example.com',updatedAt:Date.now()}))
//   2. Reload page and enqueue test items: import('/src/sync/queue.js').then(({enqueue})=>{enqueue({kind:'event',id:'test-'+Date.now(),payload:{action:'test'},at:Date.now()})})
//   3. Trigger sync: import('/src/sync/engine.js').then(({flushOnce})=>{flushOnce()})
//   4. Check network tab for /api/sync/batch requests