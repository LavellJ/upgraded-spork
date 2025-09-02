// Transport layer for sync - abstracts backend communication

import type { SyncItem, SyncResult } from './types';

// Transport interface for sending batches to backend
export interface SyncTransport {
  send(batch: SyncItem[]): Promise<SyncResult>;
}

// Development stub transport that simulates backend calls
class StubTransport implements SyncTransport {
  private failureRate: number = 0; // 0-1, for testing failures
  
  async send(batch: SyncItem[]): Promise<SyncResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Log the batch for debugging
    console.debug('SYNC batch', batch);
    
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

// Default transport instance
const defaultTransport = new StubTransport();

// Main send function using default transport
export async function send(batch: SyncItem[]): Promise<SyncResult> {
  return defaultTransport.send(batch);
}

// For testing - set failure rate
export function setTransportFailureRate(rate: number): void {
  defaultTransport.setFailureRate(rate);
}

// Future: Real transport implementation would go here
// class ApiTransport implements SyncTransport {
//   async send(batch: SyncItem[]): Promise<SyncResult> {
//     try {
//       const response = await fetch('/api/sync', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ items: batch })
//       });
//       
//       if (!response.ok) {
//         return { ok: false, error: `HTTP ${response.status}` };
//       }
//       
//       return { ok: true };
//     } catch (error) {
//       return { ok: false, error: error.message };
//     }
//   }
// }