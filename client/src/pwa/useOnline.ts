import { useState, useEffect } from 'react';

interface OnlineState {
  online: boolean;
}

export function useOnline(): OnlineState {
  const [online, setOnline] = useState(navigator.onLine);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateOnlineStatus = (isOnline: boolean) => {
      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Debounce for 300ms to avoid flicker
      const timer = setTimeout(() => {
        setOnline(isOnline);
        setDebounceTimer(null);
      }, 300);

      setDebounceTimer(timer);
    };

    const handleOnline = () => updateOnlineStatus(true);
    const handleOffline = () => updateOnlineStatus(false);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return { online };
}