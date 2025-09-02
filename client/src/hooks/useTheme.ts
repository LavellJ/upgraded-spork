import { useState, useEffect } from 'react';

type Theme = 'default' | 'hc';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('default');

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('qi.theme') as Theme;
    if (savedTheme && (savedTheme === 'default' || savedTheme === 'hc')) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'hc') {
      document.documentElement.dataset.theme = 'hc';
    } else {
      delete document.documentElement.dataset.theme;
    }
  };

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'default' ? 'hc' : 'default';
    setTheme(newTheme);
    localStorage.setItem('qi.theme', newTheme);
    applyTheme(newTheme);
  };

  return { theme, toggleTheme };
}