import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { loadProfile, saveProfile, type Profile } from './model';
import { learnerCache } from '../learning/model';

interface ProfileContextValue {
  profile: Profile;
  updateProfile: (updates: Partial<Profile>) => void;
  toggleCalmMode: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

interface ProfileProviderProps {
  children: ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const previousAgeBand = useRef(profile.ageBand);

  const updateProfile = (updates: Partial<Profile>) => {
    const updatedProfile = {
      ...profile,
      ...updates,
      version: 1 as const,
      updatedAt: Date.now(),
    };
    setProfile(updatedProfile);
    saveProfile(updatedProfile);

    // If age band changed, seed learner model
    if (updates.ageBand && updates.ageBand !== previousAgeBand.current) {
      learnerCache.seedForAgeBand(updates.ageBand);
      previousAgeBand.current = updates.ageBand;
    }
  };

  const toggleCalmMode = () => {
    updateProfile({ calmMode: !profile.calmMode });
  };

  // Save profile whenever it changes
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  const value: ProfileContextValue = {
    profile,
    updateProfile,
    toggleCalmMode,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}