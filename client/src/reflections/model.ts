import { z } from 'zod';

// Reflection data type
export const reflectionSchema = z.object({
  at: z.number(), // timestamp
  refType: z.enum(['lesson', 'journal']), // what activity this reflection is about
  refId: z.string(), // lesson ID or skill ID
  note: z.string().max(140) // reflection text, limited to 140 characters
});

export type Reflection = z.infer<typeof reflectionSchema>;

// Storage configuration
const STORAGE_KEY = 'qi.reflections.v1';

// Storage functions
export function saveReflection(reflection: Reflection): void {
  try {
    const reflections = loadReflections();
    reflections.push(reflection);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reflections));
  } catch (error) {
    console.error('Failed to save reflection:', error);
  }
}

export function loadReflections(): Reflection[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return z.array(reflectionSchema).parse(parsed);
  } catch (error) {
    console.error('Failed to load reflections:', error);
    return [];
  }
}

export function getReflectionsFor(refType: 'lesson' | 'journal', refId: string): Reflection[] {
  return loadReflections().filter(r => r.refType === refType && r.refId === refId);
}

// Get reflection for a specific timestamp (useful for timeline display)
export function getReflectionAt(timestamp: number): Reflection | null {
  const reflections = loadReflections();
  // Find reflection within a reasonable time window (5 minutes)
  const timeWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  return reflections.find(r => 
    Math.abs(r.at - timestamp) < timeWindow
  ) || null;
}

// Clear old reflections (optional cleanup function)
export function clearOldReflections(maxAgeMs: number = 90 * 24 * 60 * 60 * 1000): void {
  const cutoff = Date.now() - maxAgeMs;
  const reflections = loadReflections().filter(r => r.at > cutoff);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reflections));
}