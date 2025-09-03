import { nanoid } from 'nanoid';
import { ns, BASE_KEYS } from '../storage/namespace';

export interface AssignedPath {
  id: string;
  name: string;
  lessonIds: string[];
  createdAt: number;
  expiresAt?: number;
}

/**
 * Save an assigned path to localStorage
 */
export function savePath(path: AssignedPath, learnerId?: string): void {
  try {
    const paths = loadPaths(learnerId);
    const existingIndex = paths.findIndex(p => p.id === path.id);
    
    if (existingIndex >= 0) {
      paths[existingIndex] = path;
    } else {
      paths.push(path);
    }
    
    const storageKey = learnerId ? ns(learnerId, BASE_KEYS.assignedPaths) : 'qi.assigned.paths.v1'; // fallback for legacy
    localStorage.setItem(storageKey, JSON.stringify(paths));
  } catch (error) {
    console.error('Failed to save assigned path:', error);
  }
}

/**
 * Load all assigned paths from localStorage, filtering out expired ones
 */
export function loadPaths(learnerId?: string): AssignedPath[] {
  try {
    const storageKey = learnerId ? ns(learnerId, BASE_KEYS.assignedPaths) : 'qi.assigned.paths.v1'; // fallback for legacy
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    
    const paths = JSON.parse(stored) as AssignedPath[];
    const now = Date.now();
    
    // Filter out expired paths
    const activePaths = paths.filter(path => 
      !path.expiresAt || path.expiresAt > now
    );
    
    // Save back if we filtered anything
    if (activePaths.length !== paths.length) {
      const storageKey = learnerId ? ns(learnerId, BASE_KEYS.assignedPaths) : 'qi.assigned.paths.v1'; // fallback for legacy
      localStorage.setItem(storageKey, JSON.stringify(activePaths));
    }
    
    return activePaths;
  } catch (error) {
    console.error('Failed to load assigned paths:', error);
    return [];
  }
}

/**
 * Delete an assigned path by ID
 */
export function deletePath(id: string, learnerId?: string): void {
  try {
    const paths = loadPaths(learnerId);
    const filtered = paths.filter(p => p.id !== id);
    const storageKey = learnerId ? ns(learnerId, BASE_KEYS.assignedPaths) : 'qi.assigned.paths.v1'; // fallback for legacy
    localStorage.setItem(storageKey, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete assigned path:', error);
  }
}

/**
 * Create a new assigned path
 */
export function createPath(
  name: string, 
  lessonIds: string[], 
  expiryDays?: number,
  learnerId?: string
): AssignedPath {
  const now = Date.now();
  const path: AssignedPath = {
    id: nanoid(),
    name,
    lessonIds,
    createdAt: now,
    expiresAt: expiryDays ? now + (expiryDays * 24 * 60 * 60 * 1000) : undefined
  };
  
  savePath(path, learnerId);
  return path;
}

/**
 * Encode an assigned path to a shareable link
 */
export function encodeToLink(path: AssignedPath): string {
  try {
    const data = JSON.stringify(path);
    const encoded = btoa(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    return `${window.location.origin}${window.location.pathname}?assign=${encoded}`;
  } catch (error) {
    console.error('Failed to encode path to link:', error);
    return '';
  }
}

/**
 * Generate a short code for offline sharing (first 6 chars of path ID)
 */
export function generateShortCode(path: AssignedPath): string {
  return path.id.substring(0, 6).toUpperCase();
}

/**
 * Decode an assigned path from URL search parameters
 */
export function decodeFromQuery(search: string): AssignedPath | null {
  try {
    const params = new URLSearchParams(search);
    const assignParam = params.get('assign');
    
    if (!assignParam) return null;
    
    // Restore base64 padding
    const padded = assignParam
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padding = padded.length % 4;
    const base64 = padding ? padded + '='.repeat(4 - padding) : padded;
    
    const data = atob(base64);
    const path = JSON.parse(data) as AssignedPath;
    
    // Validate the structure
    if (!path.id || !path.name || !Array.isArray(path.lessonIds)) {
      console.warn('Invalid assigned path structure');
      return null;
    }
    
    // Check if expired
    if (path.expiresAt && path.expiresAt <= Date.now()) {
      console.warn('Assigned path has expired');
      return null;
    }
    
    return path;
  } catch (error) {
    console.error('Failed to decode assigned path from query:', error);
    return null;
  }
}

/**
 * Get active assigned lesson IDs (non-expired assignments)
 */
export function getActiveAssignedLessons(learnerId?: string): string[] {
  const paths = loadPaths(learnerId);
  const lessonIds = new Set<string>();
  
  paths.forEach(path => {
    path.lessonIds.forEach(id => lessonIds.add(id));
  });
  
  return Array.from(lessonIds);
}

/**
 * Get the next assigned lesson that hasn't been completed
 */
export function getNextAssignedLesson(completedLessons: Set<string>, learnerId?: string): string | null {
  const paths = loadPaths(learnerId);
  
  // Sort by creation date (oldest first)
  const sortedPaths = paths.sort((a, b) => a.createdAt - b.createdAt);
  
  for (const path of sortedPaths) {
    for (const lessonId of path.lessonIds) {
      if (!completedLessons.has(lessonId)) {
        return lessonId;
      }
    }
  }
  
  return null;
}

/**
 * Mark assignment as completed if all lessons are done
 */
export function checkAndCompleteAssignments(completedLessons: Set<string>, learnerId?: string): string[] {
  const paths = loadPaths(learnerId);
  const completedPaths: string[] = [];
  
  const remainingPaths = paths.filter(path => {
    const allCompleted = path.lessonIds.every(id => completedLessons.has(id));
    if (allCompleted) {
      completedPaths.push(path.name);
      return false; // Remove from active assignments
    }
    return true;
  });
  
  if (remainingPaths.length !== paths.length) {
    const storageKey = learnerId ? ns(learnerId, BASE_KEYS.assignedPaths) : 'qi.assigned.paths.v1'; // fallback for legacy
    localStorage.setItem(storageKey, JSON.stringify(remainingPaths));
  }
  
  return completedPaths;
}

/**
 * Get assignment progress for a specific path
 */
export function getAssignmentProgress(pathId: string, completedLessons: Set<string>, learnerId?: string): {
  total: number;
  completed: number;
  nextLesson: string | null;
} | null {
  const paths = loadPaths(learnerId);
  const path = paths.find(p => p.id === pathId);
  
  if (!path) return null;
  
  const completed = path.lessonIds.filter(id => completedLessons.has(id)).length;
  const nextLesson = path.lessonIds.find(id => !completedLessons.has(id)) || null;
  
  return {
    total: path.lessonIds.length,
    completed,
    nextLesson
  };
}