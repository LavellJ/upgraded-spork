import { describe, it, expect } from 'vitest';

// simple pure helper to emulate locking logic
const isLocked = (arr: {id:string}[], done: Set<string>, id: string, teacher=false) => {
  if (teacher) return false;
  const idx = arr.findIndex(x => x.id === id);
  if (idx <= 0) return false;
  return !done.has(arr[idx - 1].id);
};

describe('sequential locking', () => {
  const lessons = [{id:'a'}, {id:'b'}, {id:'c'}];

  it('first lesson is unlocked', () => {
    expect(isLocked(lessons, new Set(), 'a')).toBe(false);
  });

  it('second is locked until first done', () => {
    expect(isLocked(lessons, new Set(), 'b')).toBe(true);
    expect(isLocked(lessons, new Set(['a']), 'b')).toBe(false);
  });

  it('teacher mode bypasses', () => {
    expect(isLocked(lessons, new Set(), 'b', true)).toBe(false);
  });
});