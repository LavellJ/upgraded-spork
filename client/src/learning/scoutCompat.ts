export type ScoutMsg = { 
  id: string; 
  text: string; 
  priority: 'info' | 'actionable' | 'critical'; 
  cta?: { label: string; onClick: () => void } 
};

export const warnCompat = (...args: any[]) => 
  console.warn('[scoutCompat] triggerScoutEvent was removed. Use useScoutQueue().enqueue(...) instead.', ...args);

export function triggerScoutEvent(...args: any[]) { 
  warnCompat(...args); 
}