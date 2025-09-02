import { describe, it, expect } from 'vitest';
import REGISTRY from '../data/registry.json';

const registryEntry = (loop: number, biome: string, id: string) =>
  (REGISTRY as any)?.[loop]?.[biome]?.[id] || null;

describe('registry mapping', () => {
  it('exposes url when present', () => {
    const e = registryEntry(1, 'forest', 'f1');
    expect(e?.url).toMatch(/^https?:\/\//);
  });

  it('maps standards by selected framework', () => {
    const e = registryEntry(1, 'desert', 'd1');
    expect(e?.standards?.ACARA || e?.standards?.Generic).toBeTruthy();
  });

  it('falls back to Generic when framework not available', () => {
    const e = registryEntry(1, 'forest', 'f4');
    expect(e?.standards?.Generic).toBeTruthy();
    expect(e?.standards?.NZC).toBeUndefined();
  });

  it('supports multiple frameworks for same lesson', () => {
    const e = registryEntry(1, 'forest', 'f1');
    expect(e?.standards?.Generic).toBeTruthy();
    expect(e?.standards?.ACARA).toBeTruthy(); 
    expect(e?.standards?.NZC).toBeTruthy();
  });

  it('handles missing entries gracefully', () => {
    const e = registryEntry(1, 'forest', 'nonexistent');
    expect(e).toBeNull();
  });

  it('provides estimated time from registry', () => {
    const e = registryEntry(1, 'forest', 'f1');
    expect(e?.est).toBe('6–8 min');
  });

  it('supports Loop 2 lessons', () => {
    const e = registryEntry(2, 'forest', 'f6');
    expect(e?.url).toMatch(/^https?:\/\//);
    expect(e?.standards?.Generic).toBeTruthy();
  });

  it('covers all biomes in Loop 1', () => {
    expect(registryEntry(1, 'forest', 'f1')).toBeTruthy();
    expect(registryEntry(1, 'desert', 'd1')).toBeTruthy();
    expect(registryEntry(1, 'ocean', 'o1')).toBeTruthy();
    expect(registryEntry(1, 'night', 'n1')).toBeTruthy();
  });

  it('ensures ACARA codes follow expected pattern', () => {
    const e = registryEntry(1, 'forest', 'f1');
    expect(e?.standards?.ACARA).toMatch(/^AC9[A-Z]+\d+$/);
  });

  it('has consistent URL patterns', () => {
    const e1 = registryEntry(1, 'forest', 'f1');
    const e2 = registryEntry(1, 'desert', 'd1');
    expect(e1?.url).toContain('activities.learnoz.com');
    expect(e2?.url).toContain('activities.learnoz.com');
  });
});