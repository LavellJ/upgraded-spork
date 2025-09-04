import { useState, useEffect } from 'react';

interface CaptionSettings {
  textSize: 'S' | 'M' | 'L';
  backgroundOpacity: number; // 0-60%
  position: 'auto' | 'bottom';
}

interface ReadabilitySettings {
  dyslexiaMode: boolean;
  textScale: number;
  maxLineLength: boolean;
  reducedMotion: boolean;
  captions: CaptionSettings;
}

const STORAGE_KEY = 'qi.readability';
const CAPTIONS_STORAGE_KEY = 'qi.readability.captions';

const defaultCaptionSettings: CaptionSettings = {
  textSize: 'M',
  backgroundOpacity: 30,
  position: 'auto'
};

const defaultSettings: ReadabilitySettings = {
  dyslexiaMode: false,
  textScale: 1.0,
  maxLineLength: false,
  reducedMotion: false,
  captions: defaultCaptionSettings,
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
    const { dyslexiaMode, textScale, maxLineLength, reducedMotion, captions } = newSettings;
    
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
    
    // Apply caption settings
    applyCaptionSettings(captions);
  };
  
  const applyCaptionSettings = (captionSettings: CaptionSettings) => {
    const { textSize, backgroundOpacity, position } = captionSettings;
    
    // Set CSS variables for caption styling
    const fontSizeMap = { 'S': '0.875rem', 'M': '1rem', 'L': '1.25rem' };
    document.documentElement.style.setProperty('--caption-font-size', fontSizeMap[textSize]);
    document.documentElement.style.setProperty('--caption-bg-opacity', (backgroundOpacity / 100).toString());
    document.documentElement.style.setProperty('--caption-position', position === 'bottom' ? 'bottom' : 'auto');
    
    // Set data attributes for CSS selectors
    document.documentElement.setAttribute('data-caption-size', textSize);
    document.documentElement.setAttribute('data-caption-position', position);
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

  const setCaptionTextSize = (size: 'S' | 'M' | 'L') => {
    updateSettings({ captions: { ...settings.captions, textSize: size } });
  };
  
  const setCaptionBackgroundOpacity = (opacity: number) => {
    const clampedOpacity = Math.max(0, Math.min(60, opacity));
    updateSettings({ captions: { ...settings.captions, backgroundOpacity: clampedOpacity } });
  };
  
  const setCaptionPosition = (position: 'auto' | 'bottom') => {
    updateSettings({ captions: { ...settings.captions, position } });
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
    setCaptionTextSize,
    setCaptionBackgroundOpacity,
    setCaptionPosition,
    resetSettings,
    updateSettings,
  };
}