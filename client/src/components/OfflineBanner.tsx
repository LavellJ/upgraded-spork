import React, { useState } from 'react';
import { useOnline } from '../pwa/useOnline';
import { X, CloudOff, Wifi } from 'lucide-react';
import { Button } from './ui/button';

export function OfflineBanner() {
  const { online } = useOnline();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when coming back online
  React.useEffect(() => {
    if (online && dismissed) {
      setDismissed(false);
    }
  }, [online, dismissed]);

  // Don't show banner if online or dismissed for this session
  if (online || dismissed) {
    return null;
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 bg-amber-100 border-b border-amber-200 px-4 py-3 flex items-center justify-between shadow-sm"
      role="alert"
      aria-live="polite"
      data-testid="offline-banner"
    >
      <div className="flex items-center gap-3">
        <CloudOff className="w-5 h-5 text-amber-700" aria-hidden="true" />
        <div className="text-sm">
          <span className="font-medium text-amber-800">You're offline</span>
          <span className="text-amber-700 ml-2">— progress will sync when you're back online</span>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDismissed(true)}
        className="text-amber-700 hover:text-amber-800 hover:bg-amber-200/50 h-auto p-1"
        aria-label="Dismiss offline notification"
        data-testid="dismiss-offline-banner"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}