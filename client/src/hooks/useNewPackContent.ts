/**
 * Hook for managing "New" content tags from newly enabled packs
 * Shows "New" tag on pins from newly-enabled packs for first 7 days
 */

import { useState, useEffect } from 'react';

const NEW_CONTENT_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const STORAGE_KEY = 'qi.packs.newlyEnabled';

interface NewlyEnabledPacks {
  [packId: string]: number; // timestamp when pack was enabled
}

export function useNewPackContent() {
  const [newlyEnabledPacks, setNewlyEnabledPacks] = useState<NewlyEnabledPacks>({});

  useEffect(() => {
    loadNewlyEnabledPacks();
  }, []);

  const loadNewlyEnabledPacks = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: NewlyEnabledPacks = JSON.parse(stored);
        const now = Date.now();
        const filtered: NewlyEnabledPacks = {};

        // Remove packs that were enabled more than 7 days ago
        Object.entries(parsed).forEach(([packId, timestamp]) => {
          if (now - timestamp < NEW_CONTENT_DURATION) {
            filtered[packId] = timestamp;
          }
        });

        // Update storage if we filtered anything out
        if (Object.keys(filtered).length !== Object.keys(parsed).length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        }

        setNewlyEnabledPacks(filtered);
      }
    } catch (error) {
      console.warn('Failed to load newly enabled packs:', error);
    }
  };

  const markPackAsNewlyEnabled = (packId: string) => {
    const timestamp = Date.now();
    const updated = { ...newlyEnabledPacks, [packId]: timestamp };
    
    setNewlyEnabledPacks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const removeNewPackStatus = (packId: string) => {
    const updated = { ...newlyEnabledPacks };
    delete updated[packId];
    
    setNewlyEnabledPacks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const isPackContentNew = (packId: string): boolean => {
    if (!newlyEnabledPacks[packId]) return false;
    
    const timeSinceEnabled = Date.now() - newlyEnabledPacks[packId];
    return timeSinceEnabled < NEW_CONTENT_DURATION;
  };

  const isLessonFromNewPack = (lessonId: string): boolean => {
    // Check if lesson belongs to any newly enabled pack
    // This is a simplified check - in a full implementation, you'd
    // cross-reference with the pack registry to see which pack contains this lesson
    const reefLessons = lessonId.includes('reef') || lessonId.includes('ocean') || lessonId.includes('coral');
    const alpineLessons = lessonId.includes('alpine') || lessonId.includes('mountain') || lessonId.includes('peak');
    
    if (reefLessons && isPackContentNew('reef-au')) return true;
    if (alpineLessons && isPackContentNew('alpine-au')) return true;
    
    return false;
  };

  const getDaysRemainingForNewTag = (packId: string): number => {
    if (!newlyEnabledPacks[packId]) return 0;
    
    const timeSinceEnabled = Date.now() - newlyEnabledPacks[packId];
    const timeRemaining = NEW_CONTENT_DURATION - timeSinceEnabled;
    
    return Math.max(0, Math.ceil(timeRemaining / (24 * 60 * 60 * 1000)));
  };

  const getNewlyEnabledPacksList = (): string[] => {
    return Object.keys(newlyEnabledPacks).filter(packId => isPackContentNew(packId));
  };

  return {
    newlyEnabledPacks,
    markPackAsNewlyEnabled,
    removeNewPackStatus,
    isPackContentNew,
    isLessonFromNewPack,
    getDaysRemainingForNewTag,
    getNewlyEnabledPacksList,
    refreshNewPackContent: loadNewlyEnabledPacks
  };
}