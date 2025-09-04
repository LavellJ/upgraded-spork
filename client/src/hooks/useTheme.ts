import { useState, useEffect } from 'react';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type ContrastMode = 'normal' | 'high';
export type DensityMode = 'comfortable' | 'compact';

export interface AppearanceSettings {
  theme: ThemeMode;
  contrast: ContrastMode;
  density: DensityMode;
}

const STORAGE_KEY = 'qi.appearance.v2';

export function useTheme() {
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: 'auto',
    contrast: 'normal',
    density: 'comfortable'
  });

  useEffect(() => {
    // Load settings from localStorage on mount
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppearanceSettings;
        setSettings(parsed);
        applySettings(parsed);
      } catch (e) {
        console.warn('Failed to parse appearance settings:', e);
      }
    } else {
      // Check for legacy theme setting
      const legacy = localStorage.getItem('qi.theme');
      if (legacy === 'hc') {
        const legacySettings = { theme: 'auto' as ThemeMode, contrast: 'high' as ContrastMode, density: 'comfortable' as DensityMode };
        setSettings(legacySettings);
        applySettings(legacySettings);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(legacySettings));
      } else {
        applySettings(settings);
      }
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.theme === 'auto') {
        applyTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applySettings = (newSettings: AppearanceSettings) => {
    const resolvedTheme = newSettings.theme === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : newSettings.theme;
    
    applyTheme(resolvedTheme);
    applyContrast(newSettings.contrast);
    applyDensity(newSettings.density);
  };

  const applyTheme = (theme: 'light' | 'dark') => {
    document.documentElement.dataset.theme = theme;
  };

  const applyContrast = (contrast: ContrastMode) => {
    if (contrast === 'high') {
      document.documentElement.dataset.contrast = 'high';
    } else {
      delete document.documentElement.dataset.contrast;
    }
  };

  const applyDensity = (density: DensityMode) => {
    document.documentElement.dataset.density = density;
  };

  const updateSettings = (newSettings: Partial<AppearanceSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    applySettings(updated);
  };

  // Legacy compatibility
  const theme = settings.contrast === 'high' ? 'hc' : 'default';
  const toggleTheme = () => {
    updateSettings({ 
      contrast: settings.contrast === 'high' ? 'normal' : 'high' 
    });
  };

  return { 
    settings, 
    updateSettings,
    // Legacy compatibility
    theme, 
    toggleTheme 
  };
}