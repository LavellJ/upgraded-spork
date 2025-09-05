import { useState, useEffect } from 'react';

export type Theme = 'parchment' | 'dark' | 'hc';

const THEME_KEY = 'qi.theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY) as Theme;
      return saved && ['parchment', 'dark', 'hc'].includes(saved) ? saved : 'parchment';
    } catch {
      return 'parchment';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Clear existing theme data attribute
    root.removeAttribute('data-theme');
    
    // Set new theme (parchment is default, no attribute needed)
    if (theme !== 'parchment') {
      root.dataset.theme = theme;
    }
    
    // Save to localStorage
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Storage might be disabled
    }
  }, [theme]);

  return {
    theme,
    setTheme,
    themes: [
      { value: 'parchment', label: 'Parchment Light' },
      { value: 'dark', label: 'Slate Dark' },
      { value: 'hc', label: 'High Contrast' }
    ] as const
  };
}