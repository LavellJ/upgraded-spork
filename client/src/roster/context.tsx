// Roster context for multi-learner management

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Roster, 
  LearnerProfile, 
  loadRoster, 
  saveRoster, 
  createDefaultRoster, 
  setActiveLearner, 
  addLearner, 
  updateLearner, 
  deleteLearner, 
  getActiveLearner,
  generateLearnerId,
  DEFAULT_LEARNER_ID
} from './model';
import { migrateLegacyData, isMigrationCompleted } from '../storage/namespace';

interface RosterContextValue {
  roster: Roster | null;
  activeLearner: LearnerProfile | null;
  isLoading: boolean;
  
  // Actions
  switchLearner: (learnerId: string) => void;
  createLearner: (name: string, avatarId: string, ageBand: LearnerProfile['ageBand']) => Promise<LearnerProfile>;
  editLearner: (learnerId: string, updates: Partial<Omit<LearnerProfile, 'id' | 'createdAt'>>) => void;
  removeLearner: (learnerId: string) => void;
  
  // Cloud sync
  syncRosterToCloud: () => Promise<void>;
}

const RosterContext = createContext<RosterContextValue | null>(null);

interface RosterProviderProps {
  children: ReactNode;
}

export function RosterProvider({ children }: RosterProviderProps) {
  const [roster, setRoster] = useState<Roster | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize roster on mount
  useEffect(() => {
    async function initializeRoster() {
      try {
        // Check if migration is needed
        if (!isMigrationCompleted()) {
          console.log('Legacy data detected, performing migration...');
          migrateLegacyData(DEFAULT_LEARNER_ID);
        }

        // Load or create roster
        let loadedRoster = loadRoster();
        if (!loadedRoster) {
          console.log('No roster found, creating default roster');
          loadedRoster = createDefaultRoster();
        }

        setRoster(loadedRoster);
      } catch (error) {
        console.error('Failed to initialize roster:', error);
        // Create fallback roster
        const fallbackRoster = createDefaultRoster();
        setRoster(fallbackRoster);
      } finally {
        setIsLoading(false);
      }
    }

    initializeRoster();
  }, []);

  const activeLearner = roster ? getActiveLearner(roster) : null;

  // Don't provide context value until roster is fully loaded
  if (isLoading) {
    return <div className="flex items-center justify-center py-8 text-gray-500">Initializing roster...</div>;
  }

  const switchLearner = (learnerId: string) => {
    if (!roster) return;
    
    try {
      const updatedRoster = setActiveLearner(roster, learnerId);
      setRoster(updatedRoster);
    } catch (error) {
      console.error('Failed to switch learner:', error);
    }
  };

  const createLearner = async (name: string, avatarId: string, ageBand: LearnerProfile['ageBand']): Promise<LearnerProfile> => {
    if (!roster) throw new Error('Roster not initialized');

    const newLearner: Omit<LearnerProfile, 'createdAt' | 'updatedAt'> = {
      id: generateLearnerId(),
      name,
      avatarId,
      ageBand
    };

    try {
      const updatedRoster = addLearner(roster, newLearner);
      setRoster(updatedRoster);
      
      // Sync to cloud if available
      await syncRosterToCloud();
      
      return updatedRoster.learners.find(l => l.id === newLearner.id)!;
    } catch (error) {
      console.error('Failed to create learner:', error);
      throw error;
    }
  };

  const editLearner = (learnerId: string, updates: Partial<Omit<LearnerProfile, 'id' | 'createdAt'>>) => {
    if (!roster) return;

    try {
      const updatedRoster = updateLearner(roster, learnerId, updates);
      setRoster(updatedRoster);
      
      // Sync to cloud asynchronously
      syncRosterToCloud().catch(error => {
        console.warn('Failed to sync roster changes to cloud:', error);
      });
    } catch (error) {
      console.error('Failed to update learner:', error);
    }
  };

  const removeLearner = (learnerId: string) => {
    if (!roster) return;

    try {
      const updatedRoster = deleteLearner(roster, learnerId);
      setRoster(updatedRoster);
      
      // Sync to cloud asynchronously
      syncRosterToCloud().catch(error => {
        console.warn('Failed to sync roster changes to cloud:', error);
      });
    } catch (error) {
      console.error('Failed to delete learner:', error);
    }
  };

  const syncRosterToCloud = async () => {
    if (!roster) return;

    try {
      // Check if cloud sync is enabled
      const authData = localStorage.getItem('qi.auth.v1');
      if (!authData) return;

      const auth = JSON.parse(authData);
      if (!auth.enabled || !auth.verified || !auth.token) return;

      // Send roster to server
      const response = await fetch('/api/roster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(roster)
      });

      if (!response.ok) {
        throw new Error(`Roster sync failed: ${response.status}`);
      }

      console.log('Roster synced to cloud successfully');
    } catch (error) {
      console.error('Failed to sync roster to cloud:', error);
      // Don't throw - roster sync is optional
    }
  };

  const contextValue: RosterContextValue = {
    roster,
    activeLearner,
    isLoading,
    switchLearner,
    createLearner,
    editLearner,
    removeLearner,
    syncRosterToCloud
  };

  return (
    <RosterContext.Provider value={contextValue}>
      {children}
    </RosterContext.Provider>
  );
}

export function useRoster(): RosterContextValue {
  const context = useContext(RosterContext);
  if (!context) {
    throw new Error('useRoster must be used within a RosterProvider');
  }
  return context;
}