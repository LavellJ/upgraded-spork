import { useEffect, useRef } from 'react';
import { useScoutQueue } from '../hooks/useScoutQueue';

/**
 * RouteListener component that flushes info messages when routes change.
 * This prevents message buildup during navigation.
 * Since App.tsx doesn't use wouter routing directly, we'll hook into browser navigation events.
 */
export function RouteListener() {
  const { flushInfoMessages } = useScoutQueue();
  const lastLocationRef = useRef(window.location.pathname);

  useEffect(() => {
    const handleNavigation = () => {
      const currentLocation = window.location.pathname;
      if (currentLocation !== lastLocationRef.current) {
        lastLocationRef.current = currentLocation;
        flushInfoMessages();
      }
    };

    // Listen for browser navigation events
    window.addEventListener('popstate', handleNavigation);
    
    // Also set up a periodic check for programmatic navigation
    const intervalId = setInterval(handleNavigation, 1000);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      clearInterval(intervalId);
    };
  }, [flushInfoMessages]);

  return null; // This is a utility component with no UI
}