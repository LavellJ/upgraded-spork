import { describe, it, expect } from 'vitest';
import { formatDue, isDueSoon, isOverdue, startOfDay } from '../src/guide/assign';

describe('formatDue', () => {
  const now = new Date('2025-09-03T10:00:00').getTime();
  const day = 86_400_000;

  it('labels today/tomorrow/yesterday', () => {
    expect(formatDue(startOfDay(now), now)).toBe('today');
    expect(formatDue(startOfDay(now + day), now)).toBe('tomorrow');
    expect(formatDue(startOfDay(now - day), now)).toBe('yesterday');
  });

  it('labels near future/past in days', () => {
    expect(formatDue(startOfDay(now + 2*day), now)).toBe('in 2 days');
    expect(formatDue(startOfDay(now - 3*day), now)).toBe('3 days ago');
  });

  it('falls back to short date for far dates', () => {
    const label = formatDue(startOfDay(now + 20*day), now);
    expect(label.length).toBeGreaterThan(0); // locale-dependent
  });

  it('isDueSoon and isOverdue', () => {
    expect(isDueSoon(startOfDay(now + day), now)).toBe(true);
    expect(isDueSoon(startOfDay(now + 5*day), now)).toBe(false);
    expect(isOverdue(startOfDay(now - day), now)).toBe(true);
  });
});