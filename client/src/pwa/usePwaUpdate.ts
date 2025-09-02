import { useState, useEffect } from 'react';

interface PwaUpdateState {
  updateAvailable: boolean;
  showInstallPrompt: boolean;
  cacheStatus: Record<string, number>;
  reloadApp: () => void;
  installApp: () => void;
}

export function usePwaUpdate(): PwaUpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [cacheStatus, setCacheStatus] = useState<Record<string, number>>({});

  useEffect(() => {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { data } = event;
        
        if (data.type === 'ASSET_CACHED') {
          console.log('New asset cached:', data.url);
          // Could show a subtle notification here
        }
      });

      // Check for waiting service worker
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          setUpdateAvailable(true);
        }
      });

      // Get initial cache status
      getCacheStatus();
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const getCacheStatus = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.active) {
          const messageChannel = new MessageChannel();
          
          messageChannel.port1.onmessage = (event) => {
            setCacheStatus(event.data);
          };

          registration.active.postMessage(
            { type: 'GET_CACHE_STATUS' },
            [messageChannel.port2]
          );
        }
      } catch (error) {
        console.log('Could not get cache status:', error);
      }
    }
  };

  const reloadApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
      window.location.reload();
    }
  };

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  return {
    updateAvailable,
    showInstallPrompt,
    cacheStatus,
    reloadApp,
    installApp
  };
}