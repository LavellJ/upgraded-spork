import { expect, test } from 'vitest';
import LOOP1 from '../data/loop1.json';
import LOOP2 from '../data/loop2.json';

test('loop data has dynamic totals per biome', () => {
  const totals1 = Object.fromEntries(Object.entries(LOOP1).map(([k,v]) => [k, v.length]));
  const totals2 = Object.fromEntries(Object.entries(LOOP2).map(([k,v]) => [k, v.length]));
  
  // sanity — all biomes defined and non-negative
  for (const t of [totals1, totals2]) {
    for (const biome of ['forest','desert','ocean','night']) {
      expect(typeof t[biome]).toBe('number');
      expect(t[biome]).toBeGreaterThanOrEqual(0);
    }
  }

  // Ensure we actually have lessons (not empty arrays)
  for (const biome of ['forest','desert','ocean','night']) {
    expect(totals1[biome]).toBeGreaterThan(0);
    expect(totals2[biome]).toBeGreaterThan(0);
  }
});