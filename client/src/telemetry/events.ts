// In-memory event tracking for DEV telemetry
// Note: Events are NOT sent anywhere - this is for debugging onboarding funnel only

export interface TelemetryEvent {
  type: 'onboarding_start' | 'onboarding_complete' | 'profile_edit';
  timestamp: string;
  payload?: Record<string, any>;
}

class EventBuffer {
  private events: TelemetryEvent[] = [];
  private readonly maxSize = 200;

  track(type: TelemetryEvent['type'], payload?: Record<string, any>) {
    const event: TelemetryEvent = {
      type,
      timestamp: new Date().toISOString(),
      payload
    };

    this.events.push(event);

    // Keep buffer size under limit
    if (this.events.length > this.maxSize) {
      this.events = this.events.slice(-this.maxSize);
    }

    // Log in development for debugging
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[Telemetry]', event.type, event.payload || {});
    }
  }

  getBuffer(): TelemetryEvent[] {
    // Only expose buffer in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      return [...this.events]; // Return copy to prevent mutation
    }
    return [];
  }

  getLastEvents(count: number = 10): TelemetryEvent[] {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      return this.events.slice(-count);
    }
    return [];
  }

  clear() {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      this.events = [];
    }
  }
}

// Single global instance
const eventBuffer = new EventBuffer();

// Export the tracking function
export function track(type: TelemetryEvent['type'], payload?: Record<string, any>) {
  eventBuffer.track(type, payload);
}

// Export buffer access for DEV debugging
export function getEventBuffer(): TelemetryEvent[] {
  return eventBuffer.getBuffer();
}

export function getLastEvents(count: number = 10): TelemetryEvent[] {
  return eventBuffer.getLastEvents(count);
}

export function clearEvents() {
  eventBuffer.clear();
}