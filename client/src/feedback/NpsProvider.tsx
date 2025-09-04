// client/src/feedback/NpsProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { NpsSurvey } from './NpsSurvey';
import { shouldAskNps } from './nps';
import { isNpsEnabled, useFeatureFlagListener } from '../utils/featureFlags';

interface NpsContextType {
  triggerNpsCheck: (learnerId?: string) => void;
}

const NpsContext = createContext<NpsContextType | null>(null);

export function useNps() {
  const context = useContext(NpsContext);
  if (!context) {
    throw new Error('useNps must be used within NpsProvider');
  }
  return context;
}

interface NpsProviderProps {
  children: React.ReactNode;
}

export function NpsProvider({ children }: NpsProviderProps) {
  const [showSurvey, setShowSurvey] = useState(false);
  const [currentLearnerId, setCurrentLearnerId] = useState<string | undefined>();
  const [npsFeatureEnabled, setNpsFeatureEnabled] = useState(isNpsEnabled);

  // Listen for NPS feature flag changes
  useEffect(() => {
    const unsubscribe = useFeatureFlagListener('nps', setNpsFeatureEnabled);
    return unsubscribe;
  }, []);

  const triggerNpsCheck = (learnerId?: string) => {
    // Check both dev mode AND feature flag
    if (process.env.NODE_ENV !== 'development' || !npsFeatureEnabled) {
      return;
    }

    if (shouldAskNps(learnerId)) {
      console.log('🎯 NPS survey triggered for learner:', learnerId);
      setCurrentLearnerId(learnerId);
      setShowSurvey(true);
    } else {
      console.log('⏸️ NPS survey skipped (throttled or insufficient engagement)');
    }
  };

  const handleCloseSurvey = () => {
    setShowSurvey(false);
    setCurrentLearnerId(undefined);
  };

  return (
    <NpsContext.Provider value={{ triggerNpsCheck }}>
      {children}
      <NpsSurvey 
        isOpen={showSurvey}
        onClose={handleCloseSurvey}
        learnerId={currentLearnerId}
      />
    </NpsContext.Provider>
  );
}