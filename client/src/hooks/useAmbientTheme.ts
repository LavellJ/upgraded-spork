import { useEffect } from 'react';

type Ambient = 'dawn' | 'day' | 'dusk' | 'night';

function pickAmbient(date = new Date()): Ambient {
  const h = date.getHours();
  if (h >= 5 && h < 9) return 'dawn';
  if (h >= 9 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

export function useAmbientTheme(root: HTMLElement | null, forced?: Ambient) {
  useEffect(() => {
    if (!root) return;
    const clazzes = ['ambient-dawn','ambient-day','ambient-dusk','ambient-night'];
    const apply = (amb: Ambient) => {
      clazzes.forEach(c => root.classList.remove(c));
      root.classList.add(`ambient-${amb}`);
    };

    const ambient = forced ?? pickAmbient();
    apply(ambient);

    const id = setInterval(() => apply(pickAmbient()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [root, forced]);
}
