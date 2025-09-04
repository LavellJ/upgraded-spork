import { useState, useEffect } from 'react';
import { useRosterOptional } from '../roster/context';
import { ClassInfo, getActiveClass, setActiveClass, getAllClasses } from '../roster/classes';

interface UseActiveClassReturn {
  activeClass?: ClassInfo;
  allClasses: ClassInfo[];
  setActiveClass: (classId?: string) => void;
  isLoading: boolean;
}

/**
 * Hook for managing the active class context
 * Provides access to the currently active class and ability to switch classes
 * Also applies projector presets globally when active class changes
 */
export function useActiveClass(): UseActiveClassReturn {
  const rosterContext = useRosterOptional();
  const activeLearner = rosterContext?.activeLearner;
  const [activeClass, setActiveClassState] = useState<ClassInfo | undefined>();
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    if (!activeLearner) {
      setIsLoading(false);
      return;
    }

    try {
      const active = getActiveClass(activeLearner.id);
      const all = getAllClasses(activeLearner.id);
      
      setActiveClassState(active || undefined);
      setAllClasses(all);
    } catch (error) {
      console.error('Failed to load active class:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeLearner]);

  // Apply projector presets to HTML element when active class changes
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    if (activeClass?.projectorPreset) {
      const { hideNames, fontScale } = activeClass.projectorPreset;
      
      // Set data attributes for CSS styling
      htmlElement.setAttribute('data-projector-hide-names', hideNames ? 'true' : 'false');
      htmlElement.style.setProperty('--font-scale', fontScale?.toString() || '1.0');
      
      // Also set a class for easier CSS targeting
      if (hideNames) {
        htmlElement.classList.add('projector-hide-names');
      } else {
        htmlElement.classList.remove('projector-hide-names');
      }
      
      // Set font scale class
      htmlElement.setAttribute('data-font-scale', fontScale?.toString() || '1.0');
    } else {
      // Clear projector settings when no active class
      htmlElement.removeAttribute('data-projector-hide-names');
      htmlElement.removeAttribute('data-font-scale');
      htmlElement.style.removeProperty('--font-scale');
      htmlElement.classList.remove('projector-hide-names');
    }
  }, [activeClass]);

  // Handle setting active class
  const handleSetActiveClass = (classId?: string) => {
    if (!activeLearner) return;
    
    try {
      setActiveClass(activeLearner.id, classId);
      
      // Update local state
      if (classId) {
        const newActiveClass = allClasses.find(c => c.id === classId);
        setActiveClassState(newActiveClass);
      } else {
        setActiveClassState(undefined);
      }
    } catch (error) {
      console.error('Failed to set active class:', error);
    }
  };

  return {
    activeClass,
    allClasses,
    setActiveClass: handleSetActiveClass,
    isLoading
  };
}