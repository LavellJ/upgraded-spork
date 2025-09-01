import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logEvent, getEvents, clearEvents, downloadEventsCSV, type QIEvent, type QIAction } from '../lib/analytics';

const KEY = 'qi_events';

// Mock localStorage if not available
Object.defineProperty(window, 'localStorage', {
  value: {
    store: {} as Record<string, string>,
    getItem(key: string) {
      return this.store[key] || null;
    },
    setItem(key: string, value: string) {
      this.store[key] = value;
    },
    removeItem(key: string) {
      delete this.store[key];
    },
    clear() {
      this.store = {};
    },
  },
  writable: true,
});

// Mock URL methods
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
});

// Mock Blob constructor
class MockBlob {
  private content: string;
  public type: string;
  
  constructor(parts: any[], options: { type?: string } = {}) {
    this.content = parts.join('');
    this.type = options.type || '';
  }
  
  async text(): Promise<string> {
    return this.content;
  }
}

// Replace global Blob with mock
Object.defineProperty(globalThis, 'Blob', {
  value: MockBlob,
  writable: true,
});

function resetLS() {
  localStorage.setItem(KEY, '[]');
}

beforeEach(() => {
  // Clean slate before each test
  resetLS();
  vi.restoreAllMocks();
});

// Helper to seed events quickly
function seed(n = 1) {
  const base: QIEvent[] = [];
  for (let i = 0; i < n; i++) {
    base.push({
      ts: new Date(1700000000000 + i).toISOString(),
      loop: 1,
      biome: 'forest',
      lessonId: `f${i + 1}`,
      action: (i === 0 ? 'start' : 'complete') as QIAction,
      meta: { i }
    });
  }
  localStorage.setItem(KEY, JSON.stringify(base));
}

describe('analytics: storage', () => {
  it('logEvent -> getEvents should append and read back', () => {
    expect(getEvents()).toEqual([]);

    logEvent({ ts: new Date().toISOString(), loop: 1, biome: 'forest', lessonId: 'f1', action: 'start' });
    logEvent({ ts: new Date().toISOString(), loop: 1, biome: 'forest', lessonId: 'f1', action: 'complete' });

    const events = getEvents();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBe(2);
    expect(events[0].action).toBe('start');
    expect(events[1].action).toBe('complete');
  });

  it('clearEvents empties the buffer', () => {
    logEvent({ ts: new Date().toISOString(), loop: 1, action: 'export' });
    expect(getEvents().length).toBe(1);
    clearEvents();
    expect(getEvents().length).toBe(0);
  });
});

describe('analytics: CSV export', () => {
  it('downloadEventsCSV builds a CSV from buffered events', async () => {
    seed(2); // two events

    // Spy URL.createObjectURL to capture the Blob
    let capturedBlob: MockBlob | null = null;
    const createSpy = vi.mocked(URL.createObjectURL).mockImplementation((blob: any) => {
      capturedBlob = blob as MockBlob;
      return 'blob://mock';
    });
    const revokeSpy = vi.mocked(URL.revokeObjectURL).mockImplementation(() => {});

    // Prevent real navigation
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadEventsCSV('test_events.csv');

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(capturedBlob).toBeTruthy();

    // Inspect CSV text
    const text = await (capturedBlob!).text();
    const lines = text.trim().split('\n');

    // Header + 2 rows
    expect(lines.length).toBe(1 + 2);
    expect(lines[0]).toContain('ts,loop,biome,lessonId,action,meta');

    // Should include our actions
    expect(text).toContain(',start,');
    expect(text).toContain(',complete,');
  });

  it('downloadEventsCSV still works when buffer is empty (header only)', async () => {
    resetLS();

    let capturedBlob: MockBlob | null = null;
    vi.mocked(URL.createObjectURL).mockImplementation((blob: any) => {
      capturedBlob = blob as MockBlob;
      return 'blob://mock';
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadEventsCSV('empty.csv');
    const text = await (capturedBlob!).text();
    const lines = text.trim().split('\n');

    // Header only
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('ts,loop,biome,lessonId,action,meta');
  });
});