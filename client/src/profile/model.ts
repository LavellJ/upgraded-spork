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

const STORAGE_KEY = 'qi.profile.v1';

export function loadProfile(): Profile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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

export function saveProfile(profile: Profile): void {
  try {
    const toSave = {
      ...profile,
      version: 1,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save profile to localStorage:', error);
  }
}