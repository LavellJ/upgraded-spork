// Transport layer for sync - abstracts backend communication

import type { SyncItem, SyncResult } from './types';
import { loadAuth, isCloudSyncReady } from '../auth/model';
import { loadProfile } from '../profile/model';

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

// Cloud transport for authenticated users
class CloudTransport implements SyncTransport {
  private readonly CLOUD_ENDPOINT = '/api';
  
  async send(batch: SyncItem[], context: SyncContext): Promise<SyncResult> {
    try {
      const auth = loadAuth();
      
      if (!isCloudSyncReady(auth)) {
        return {
          ok: false,
          error: 'Cloud sync not ready'
        };
      }
      
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
      
      if (response.status === 401) {
        return {
          ok: false,
          error: 'Authentication failed - please verify your email'
        };
      }
      
      if (response.status === 429) {
        return {
          ok: false,
          error: 'Rate limited - retrying later'
        };
      }
      
      if (response.status >= 500) {
        return {
          ok: false,
          error: 'Server error - retrying later'
        };
      }
      
      if (!response.ok) {
        return {
          ok: false,
          error: `HTTP ${response.status} - ${response.statusText}`
        };
      }
      
      const result = await response.json();
      console.debug('Sync batch sent:', { accepted: result.accepted, total: batch.length });
      
      return { ok: true };
      
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Cloud sync failed'
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