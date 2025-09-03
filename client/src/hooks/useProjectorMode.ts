import { useState, useEffect, createContext, useContext } from 'react';

interface ProjectorModeContextType {
  isProjectorMode: boolean;
  toggleProjectorMode: () => void;
}

export const ProjectorModeContext = createContext<ProjectorModeContextType | null>(null);

/**
 * Hook for managing projector-safe mode
 * - Session-only persistence (not localStorage)
 * - Hides names/PII
 * - Boosts font sizes
 * - Disables confetti/SFX
 */
export function useProjectorMode() {
  const context = useContext(ProjectorModeContext);
  if (!context) {
    throw new Error('useProjectorMode must be used within ProjectorModeProvider');
  }
  return context;
}

/**
 * Session-only projector mode state
 * Resets when page is refreshed (intentionally not persisted)
 */
export function useProjectorModeState() {
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  const toggleProjectorMode = () => {
    setIsProjectorMode(prev => !prev);
  };

  // Apply CSS classes based on projector mode
  useEffect(() => {
    const body = document.body;
    
    if (isProjectorMode) {
      body.classList.add('projector-mode');
      // Disable animations and sound effects
      body.classList.add('reduce-motion');
    } else {
      body.classList.remove('projector-mode');
      body.classList.remove('reduce-motion');
    }

    return () => {
      body.classList.remove('projector-mode', 'reduce-motion');
    };
  }, [isProjectorMode]);

  return {
    isProjectorMode,
    toggleProjectorMode
  };
}

/**
 * Utility hook to get projector-safe display name
 * Hides real names when projector mode is active
 */
export function useProjectorSafeName(realName: string, fallback: string = 'Student') {
  const { isProjectorMode } = useProjectorMode();
  
  if (isProjectorMode) {
    // Hide real names - use generic fallback
    return fallback;
  }
  
  return realName;
}

/**
 * Utility hook to conditionally disable animations/effects
 */
export function useProjectorSafeEffects() {
  const { isProjectorMode } = useProjectorMode();
  
  return {
    shouldReduceMotion: isProjectorMode,
    shouldDisableSound: isProjectorMode,
    shouldDisableConfetti: isProjectorMode,
    shouldBoostFonts: isProjectorMode
  };
}