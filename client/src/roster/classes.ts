// Class management for roster import and organization

import { ns } from '../storage/namespace';

export type ClassId = string;

export type ClassInfo = {
  id: ClassId;
  name: string;
  createdAt: number;
  updatedAt: number;
  projectorPreset?: {
    fontScale?: number;
    hideNames?: boolean;
    muteSFX?: boolean;
    largeCursor?: boolean;
  };
  code?: string; // short alphanumeric, e.g. 6 chars
  owners?: string[]; // email addresses of class owners
};

export type ClassesV1 = {
  classes: ClassInfo[];
  activeClassId?: ClassId;
};

/**
 * Generate a short class code (A-Z2-9, no confusing chars)
 * Excludes: O, 0, I, 1 to avoid confusion
 */
export function makeClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get storage key for classes data
 */
function getStorageKey(userId: string): string {
  return ns(userId, 'classes.v1');
}

/**
 * Load classes from localStorage
 */
export function loadClasses(userId: string): ClassesV1 | null {
  try {
    const data = localStorage.getItem(getStorageKey(userId));
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load classes:', error);
    return null;
  }
}

/**
 * Save classes to localStorage
 */
export function saveClasses(userId: string, classes: ClassesV1): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(classes));
  } catch (error) {
    console.error('Failed to save classes:', error);
  }
}

/**
 * Create a new class or update existing one
 */
export function upsertClass(userId: string, classInfo: Omit<ClassInfo, 'createdAt' | 'updatedAt'>): ClassInfo {
  const currentClasses = loadClasses(userId) || { classes: [] };
  const now = Date.now();
  
  const existingIndex = currentClasses.classes.findIndex(c => c.id === classInfo.id);
  
  let updatedClass: ClassInfo;
  
  if (existingIndex >= 0) {
    // Update existing class
    updatedClass = {
      ...currentClasses.classes[existingIndex],
      ...classInfo,
      updatedAt: now
    };
    currentClasses.classes[existingIndex] = updatedClass;
  } else {
    // Create new class
    updatedClass = {
      ...classInfo,
      createdAt: now,
      updatedAt: now,
      code: classInfo.code || makeClassCode()
    };
    currentClasses.classes.push(updatedClass);
  }
  
  saveClasses(userId, currentClasses);
  return updatedClass;
}

/**
 * Delete a class by ID
 */
export function deleteClass(userId: string, classId: ClassId): boolean {
  const currentClasses = loadClasses(userId);
  if (!currentClasses) return false;
  
  const initialLength = currentClasses.classes.length;
  currentClasses.classes = currentClasses.classes.filter(c => c.id !== classId);
  
  // If this was the active class, clear active class
  if (currentClasses.activeClassId === classId) {
    currentClasses.activeClassId = undefined;
  }
  
  if (currentClasses.classes.length < initialLength) {
    saveClasses(userId, currentClasses);
    return true;
  }
  
  return false;
}

/**
 * Find a class by its code
 */
export function findByCode(userId: string, code: string): ClassInfo | null {
  const currentClasses = loadClasses(userId);
  if (!currentClasses) return null;
  
  return currentClasses.classes.find(c => c.code === code.toUpperCase()) || null;
}

/**
 * Set the active class
 */
export function setActiveClass(userId: string, classId?: ClassId): void {
  const currentClasses = loadClasses(userId) || { classes: [] };
  
  if (classId) {
    // Verify the class exists
    const classExists = currentClasses.classes.some(c => c.id === classId);
    if (!classExists) {
      throw new Error(`Class ${classId} not found`);
    }
  }
  
  currentClasses.activeClassId = classId;
  saveClasses(userId, currentClasses);
}

/**
 * Get all classes for a user
 */
export function getAllClasses(userId: string): ClassInfo[] {
  const currentClasses = loadClasses(userId);
  return currentClasses?.classes || [];
}

/**
 * Get the active class
 */
export function getActiveClass(userId: string): ClassInfo | null {
  const currentClasses = loadClasses(userId);
  if (!currentClasses?.activeClassId) return null;
  
  return currentClasses.classes.find(c => c.id === currentClasses.activeClassId) || null;
}