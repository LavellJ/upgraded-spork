import { z } from 'zod';

// Reflection data type
export const reflectionSchema = z.object({
  at: z.number(), // timestamp
  refType: z.enum(['lesson', 'journal']), // what activity this reflection is about
  refId: z.string(), // lesson ID or skill ID
  note: z.string().max(140) // reflection text, limited to 140 characters
});

export type Reflection = z.infer<typeof reflectionSchema>;

import { ns, BASE_KEYS } from '../storage/namespace';

// Storage functions
export function saveReflection(reflection: Reflection, learnerId?: string): void {
  try {
    const reflections = loadReflections(learnerId);
    reflections.push(reflection);
    const storageKey = learnerId ? ns(learnerId, BASE_KEYS.reflections) : 'qi.reflections.v1'; // fallback for legacy
    localStorage.setItem(storageKey, JSON.stringify(reflections));
  } catch (error) {
    console.error('Failed to save reflection:', error);
  }
}

export function loadReflections(learnerId?: string): Reflection[] {
  try {
    const storageKey = learnerId ? ns(learnerId, BASE_KEYS.reflections) : 'qi.reflections.v1'; // fallback for legacy
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return z.array(reflectionSchema).parse(parsed);
  } catch (error) {
    console.error('Failed to load reflections:', error);
    return [];
  }
}

export function getReflectionsFor(refType: 'lesson' | 'journal', refId: string, learnerId?: string): Reflection[] {
  return loadReflections(learnerId).filter(r => r.refType === refType && r.refId === refId);
}

// Get reflection for a specific timestamp (useful for timeline display)
export function getReflectionAt(timestamp: number, learnerId?: string): Reflection | null {
  const reflections = loadReflections(learnerId);
  // Find reflection within a reasonable time window (5 minutes)
  const timeWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  return reflections.find(r => 
    Math.abs(r.at - timestamp) < timeWindow
  ) || null;
}

// Clear old reflections (optional cleanup function)
export function clearOldReflections(maxAgeMs: number = 90 * 24 * 60 * 60 * 1000, learnerId?: string): void {
  const cutoff = Date.now() - maxAgeMs;
  const reflections = loadReflections(learnerId).filter(r => r.at > cutoff);
  const storageKey = learnerId ? ns(learnerId, BASE_KEYS.reflections) : 'qi.reflections.v1'; // fallback for legacy
  localStorage.setItem(storageKey, JSON.stringify(reflections));
}