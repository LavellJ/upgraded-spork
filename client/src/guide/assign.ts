import { nanoid } from 'nanoid';
import { ns, BASE_KEYS } from '../storage/namespace';

// V1 Types (legacy)
export interface AssignedPath {
  id: string;
  name: string;
  lessonIds: string[];
  createdAt: number;
  expiresAt?: number;
}

// V2 Types
export type AssignedLessonStatus = 'not_started' | 'in_progress' | 'done';

export type AssignedLesson = {
  lessonId: string;
  status: AssignedLessonStatus;
  completedAt?: number;
  dueAt?: number; // optional, overrides path due at
};

export type AssignedPathV2 = {
  id: string;
  name: string;
  lessonIds: string[]; // keep for quick checks
  lessons: AssignedLesson[]; // source of truth for statuses/due
  createdAt: number;
  updatedAt: number;
  startAt?: number;
  dueAt?: number; // default due for all lessons unless overridden
  expiresAt?: number;
  priority?: 'low' | 'normal' | 'high';
  archived?: boolean;
};

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
 * Get active assigned lesson IDs for the currently active learner
 * Uses the roster context to get the active learner's ID
 */
export function getActiveAssignedLessonsForCurrentLearner(): string[] {
  // This function will be called from components that have access to roster context
  // For now, we'll use a fallback approach
  try {
    // Try to get the active learner from roster
    const rosterData = localStorage.getItem('qi.roster.v1');
    if (rosterData) {
      const roster = JSON.parse(rosterData);
      const activeLearnerId = roster.activeId;
      if (activeLearnerId) {
        return getActiveAssignedLessons(activeLearnerId);
      }
    }
  } catch (error) {
    console.warn('Failed to get active learner for assignments:', error);
  }
  
  // Fallback to legacy approach
  return getActiveAssignedLessons();
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

// =============================================================================
// V2 ASSIGNMENT PATH SYSTEM
// =============================================================================

/**
 * Load all assigned paths v2 from localStorage, filtering out expired ones
 */
export function loadPathsV2(learnerId: string): AssignedPathV2[] {
  try {
    const storageKey = ns(learnerId, 'assigned.paths.v2');
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    
    const paths = JSON.parse(stored) as AssignedPathV2[];
    const now = Date.now();
    
    // Filter out expired paths
    const activePaths = paths.filter(path => 
      !path.expiresAt || path.expiresAt > now
    );
    
    // Save back if we filtered anything
    if (activePaths.length !== paths.length) {
      localStorage.setItem(storageKey, JSON.stringify(activePaths));
    }
    
    return activePaths;
  } catch (error) {
    console.error('Failed to load assigned paths v2:', error);
    return [];
  }
}

/**
 * Save all assigned paths v2 to localStorage
 */
export function savePathsV2(paths: AssignedPathV2[], learnerId: string): void {
  try {
    const storageKey = ns(learnerId, 'assigned.paths.v2');
    localStorage.setItem(storageKey, JSON.stringify(paths));
  } catch (error) {
    console.error('Failed to save assigned paths v2:', error);
  }
}

/**
 * Upsert an assigned path v2
 */
export function upsertPathV2(path: AssignedPathV2, learnerId: string): void {
  try {
    const paths = loadPathsV2(learnerId);
    const existingIndex = paths.findIndex(p => p.id === path.id);
    
    path.updatedAt = Date.now();
    
    if (existingIndex >= 0) {
      paths[existingIndex] = path;
    } else {
      paths.push(path);
    }
    
    savePathsV2(paths, learnerId);
  } catch (error) {
    console.error('Failed to upsert assigned path v2:', error);
  }
}

/**
 * Delete an assigned path v2 by ID
 */
export function deletePathV2(id: string, learnerId: string): void {
  try {
    const paths = loadPathsV2(learnerId);
    const filtered = paths.filter(p => p.id !== id);
    savePathsV2(filtered, learnerId);
  } catch (error) {
    console.error('Failed to delete assigned path v2:', error);
  }
}

/**
 * Migrate from v1 to v2 format
 */
export function migrateFromV1(learnerId: string): void {
  try {
    // Check if v2 already exists
    const existingV2Paths = loadPathsV2(learnerId);
    if (existingV2Paths.length > 0) {
      return; // Already migrated
    }
    
    // Load v1 paths
    const v1StorageKey = ns(learnerId, BASE_KEYS.assignedPaths);
    const v1Stored = localStorage.getItem(v1StorageKey);
    if (!v1Stored) return;
    
    const v1Paths = JSON.parse(v1Stored) as AssignedPath[];
    
    // Convert to v2
    const convertedV2Paths: AssignedPathV2[] = v1Paths.map(v1Path => {
      const lessons: AssignedLesson[] = v1Path.lessonIds.map(lessonId => ({
        lessonId,
        status: 'not_started' as AssignedLessonStatus
      }));
      
      return {
        id: v1Path.id,
        name: v1Path.name,
        lessonIds: v1Path.lessonIds,
        lessons,
        createdAt: v1Path.createdAt,
        updatedAt: v1Path.createdAt,
        expiresAt: v1Path.expiresAt,
        priority: 'normal'
      };
    });
    
    // Save v2 and remove v1
    if (convertedV2Paths.length > 0) {
      savePathsV2(convertedV2Paths, learnerId);
      localStorage.removeItem(v1StorageKey);
    }
  } catch (error) {
    console.error('Failed to migrate from v1 to v2:', error);
  }
}

/**
 * Get active assignments for a learner
 */
export function getActiveAssignments(learnerId: string, options: { includeArchived?: boolean } = {}): AssignedPathV2[] {
  const paths = loadPathsV2(learnerId);
  
  if (options.includeArchived) {
    return paths;
  }
  
  return paths.filter(path => !path.archived);
}

/**
 * Get path progress
 */
export function getPathProgress(path: AssignedPathV2): { total: number; done: number; pct: number } {
  const total = path.lessons.length;
  const done = path.lessons.filter(lesson => lesson.status === 'done').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  
  return { total, done, pct };
}

/**
 * Get lesson assignment details
 */
export function getLessonAssignment(paths: AssignedPathV2[], lessonId: string): { pathId: string; dueAt?: number; status: AssignedLessonStatus } | null {
  for (const path of paths) {
    const lesson = path.lessons.find(l => l.lessonId === lessonId);
    if (lesson) {
      return {
        pathId: path.id,
        dueAt: lesson.dueAt || path.dueAt,
        status: lesson.status
      };
    }
  }
  return null;
}

/**
 * Check if due soon (≤48h)
 */
export function isDueSoon(dueAt?: number, now: number = Date.now()): boolean {
  if (!dueAt) return false;
  const hoursUntilDue = (dueAt - now) / (1000 * 60 * 60);
  return hoursUntilDue <= 48 && hoursUntilDue > 0;
}

/**
 * Check if overdue
 */
export function isOverdue(dueAt?: number, now: number = Date.now()): boolean {
  if (!dueAt) return false;
  return dueAt < now;
}

/**
 * Encode an assigned path v2 to a shareable link
 */
export function encodeToLinkV2(path: AssignedPathV2): string {
  try {
    const linkData = {
      id: path.id,
      name: path.name,
      lessonIds: path.lessonIds,
      startAt: path.startAt,
      dueAt: path.dueAt,
      expiresAt: path.expiresAt,
      priority: path.priority
    };
    
    const data = JSON.stringify(linkData);
    const encoded = btoa(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    return `${window.location.origin}${window.location.pathname}?assign=${encoded}`;
  } catch (error) {
    console.error('Failed to encode path v2 to link:', error);
    return '';
  }
}

/**
 * Decode an assigned path v2 from URL search parameters
 */
export function decodeFromQueryV2(search: string): AssignedPathV2 | null {
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
    const linkData = JSON.parse(data);
    
    // Validate the structure
    if (!linkData.id || !linkData.name || !Array.isArray(linkData.lessonIds)) {
      console.warn('Invalid assigned path v2 structure');
      return null;
    }
    
    // Check if expired
    if (linkData.expiresAt && linkData.expiresAt <= Date.now()) {
      console.warn('Assigned path v2 has expired');
      return null;
    }
    
    // Create v2 path skeleton (create lessons from ids)
    const lessons: AssignedLesson[] = linkData.lessonIds.map((lessonId: string) => ({
      lessonId,
      status: 'not_started' as AssignedLessonStatus
    }));
    
    const now = Date.now();
    const path: AssignedPathV2 = {
      id: linkData.id,
      name: linkData.name,
      lessonIds: linkData.lessonIds,
      lessons,
      createdAt: now,
      updatedAt: now,
      startAt: linkData.startAt,
      dueAt: linkData.dueAt,
      expiresAt: linkData.expiresAt,
      priority: linkData.priority || 'normal'
    };
    
    return path;
  } catch (error) {
    console.error('Failed to decode assigned path v2 from query:', error);
    return null;
  }
}