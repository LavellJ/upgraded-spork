import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import campfireHeaderImage from "@assets/2099b094-0d20-474a-9c0c-067c38a47fe7_1756291587519.png";
import { loadAuth, type Auth } from '../auth/model';
import { isTokenNearExpiry, isTokenExpired } from '../auth/api';

export function FloatingNavigation() {
  const [auth, setAuth] = useState<Auth>(() => loadAuth());
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const checkTokenStatus = () => {
      const currentAuth = loadAuth();
      setAuth(currentAuth);
      
      // Show reminder if token is near expiry or expired
      const shouldShow = Boolean(currentAuth.verified && currentAuth.token && 
                        (isTokenNearExpiry(currentAuth) || isTokenExpired(currentAuth)));
      setShowReminder(shouldShow);
    };

    // Check on mount
    checkTokenStatus();

    // Listen for auth changes
    window.addEventListener('storage', checkTokenStatus);
    window.addEventListener('auth-restored', checkTokenStatus);
    
    // Check periodically (every 5 minutes)
    const interval = setInterval(checkTokenStatus, 5 * 60 * 1000);
    
    return () => {
      window.removeEventListener('storage', checkTokenStatus);
      window.removeEventListener('auth-restored', checkTokenStatus);
      clearInterval(interval);
    };
  }, []);

  const handleRenewClick = () => {
    // Scroll to CloudSyncSettings or open settings
    // For now, dispatch a custom event that CloudSyncSettings can listen to
    window.dispatchEvent(new CustomEvent('show-auth-renewal'));
  };

  const handleDismiss = () => {
    // Hide reminder for this session
    setShowReminder(false);
  };

  return (
    <>
      <header className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50" data-testid="campfire-header">
        <img 
          src={campfireHeaderImage}
          alt="Campfire Learning Trail"
          className="w-auto object-contain"
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
            height: '276px',
            maxWidth: '1380px'
          }}
        />
      </header>
      
      {/* Token Renewal Reminder */}
      {showReminder && (
        <div className="fixed top-4 right-4 z-[60] max-w-sm">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-amber-800">
                  {isTokenExpired(auth) ? 'Session Expired' : 'Session Expiring Soon'}
                </h4>
                <p className="text-xs text-amber-700 mt-1">
                  {isTokenExpired(auth) 
                    ? 'Your authentication has expired. Please renew to continue syncing.'
                    : 'Your session will expire within 7 days. Renew now to avoid interruption.'}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleRenewClick}
                    className="h-7 text-xs bg-amber-600 hover:bg-amber-700"
                    data-testid="header-renew-session-button"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Renew Session
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="h-7 text-xs text-amber-700 hover:bg-amber-100"
                    data-testid="header-dismiss-reminder-button"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
