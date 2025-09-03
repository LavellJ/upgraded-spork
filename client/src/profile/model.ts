export type AgeBand = '5-6' | '7-8' | '9-10' | '11-12';

export type Profile = {
  version: 1;
  name?: string;
  avatarId?: string;
  ageBand?: AgeBand;
  calmMode: boolean;
  reducedMotion?: boolean;
  createdAt: number;
  updatedAt: number;
};

import { ns, BASE_KEYS } from '../storage/namespace';

export function loadProfile(learnerId?: string): Profile {
  try {
    const storageKey = learnerId ? ns(learnerId, BASE_KEYS.profile) : 'qi.profile.v1'; // fallback for legacy
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        version: 1, // Ensure version is always 1
      };
    }
  } catch (error) {
    console.warn('Failed to load profile from localStorage:', error);
  }

  // Return default profile
  const now = Date.now();
  return {
    version: 1,
    calmMode: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function saveProfile(profile: Profile, learnerId?: string): void {
  try {
    const toSave = {
      ...profile,
      version: 1,
      updatedAt: Date.now(),
    };
    const storageKey = learnerId ? ns(learnerId, BASE_KEYS.profile) : 'qi.profile.v1'; // fallback for legacy
    localStorage.setItem(storageKey, JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save profile to localStorage:', error);
  }
}