import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { loadProfile, saveProfile, type Profile } from './model';
import { learnerCache } from '../learning/model';
import { track } from '../telemetry/events';

interface ProfileContextValue {
  profile: Profile;
  updateProfile: (updates: Partial<Profile>) => void;
  toggleCalmMode: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  
  // Debug: Log when useProfile is called and what context it finds
  console.log('useProfile called, context found:', context);
  
  if (!context) {
    console.error('useProfile called outside ProfileProvider - no context found');
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
  
  // Debug: Log when ProfileProvider renders
  console.log('ProfileProvider rendering with profile:', profile);

  const updateProfile = (updates: Partial<Profile>) => {
    const updatedProfile = {
      ...profile,
      ...updates,
      version: 1 as const,
      updatedAt: Date.now(),
    };
    setProfile(updatedProfile);
    saveProfile(updatedProfile);

    // Track profile edits
    track('profile_edit', {
      editedAt: new Date().toISOString(),
      fieldsChanged: Object.keys(updates),
      profileHasName: !!updatedProfile.name,
      ageBand: updatedProfile.ageBand
    });

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

  // Debug: Log the context value being provided
  console.log('ProfileProvider providing value:', value);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}