import { useState, useEffect } from 'react';

interface ReadabilitySettings {
  dyslexiaMode: boolean;
  textScale: number;
  maxLineLength: boolean;
  reducedMotion: boolean;
}

const STORAGE_KEY = 'qi.readability';

const defaultSettings: ReadabilitySettings = {
  dyslexiaMode: false,
  textScale: 1.0,
  maxLineLength: false,
  reducedMotion: false,
};

export function useReadability() {
  const [settings, setSettings] = useState<ReadabilitySettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultSettings, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load readability settings:', error);
    }
    return defaultSettings;
  });

  // Apply settings to document on mount and when settings change
  useEffect(() => {
    applySettings(settings);
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save readability settings:', error);
    }
  }, [settings]);

  const applySettings = (newSettings: ReadabilitySettings) => {
    const { dyslexiaMode, textScale, maxLineLength, reducedMotion } = newSettings;
    
    // Apply dyslexia mode
    if (dyslexiaMode) {
      document.documentElement.dataset.readability = 'dyslexia';
    } else {
      delete document.documentElement.dataset.readability;
    }
    
    // Apply reduced motion
    if (reducedMotion) {
      document.documentElement.dataset.reducedMotion = 'true';
    } else {
      delete document.documentElement.dataset.reducedMotion;
    }
    
    // Apply text scale
    document.documentElement.style.setProperty('--text-scale', textScale.toString());
    
    // Apply line length constraint
    document.documentElement.style.setProperty(
      '--line-length-max', 
      maxLineLength ? '65ch' : 'none'
    );
  };

  const updateSettings = (updates: Partial<ReadabilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const toggleDyslexiaMode = () => {
    updateSettings({ dyslexiaMode: !settings.dyslexiaMode });
  };

  const setTextScale = (scale: number) => {
    // Clamp between 0.9 and 1.3
    const clampedScale = Math.max(0.9, Math.min(1.3, scale));
    updateSettings({ textScale: clampedScale });
  };

  const toggleMaxLineLength = () => {
    updateSettings({ maxLineLength: !settings.maxLineLength });
  };

  const toggleReducedMotion = () => {
    updateSettings({ reducedMotion: !settings.reducedMotion });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return {
    settings,
    toggleDyslexiaMode,
    setTextScale,
    toggleMaxLineLength,
    toggleReducedMotion,
    resetSettings,
    updateSettings,
  };
}