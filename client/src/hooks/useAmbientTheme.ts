import * as React from 'react';

type Theme = 'light' | 'dark';

type CtxType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const Ctx = React.createContext<CtxType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>('light');
  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return <Ctx.Provider value={{ theme, setTheme, toggle }}>{children}</Ctx.Provider>;
}

export function useAmbientTheme() {
  const ctx = React.useContext(Ctx);
  if (!ctx) {
    // Allow usage without explicit provider in dev
    return {
      theme: 'light' as Theme,
      setTheme: (_t: Theme) => {},
      toggle: () => {},
    };
  }
  return ctx;
}
