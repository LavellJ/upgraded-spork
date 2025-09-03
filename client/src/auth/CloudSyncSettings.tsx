// Cloud sync settings component for adult authentication

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Cloud, CheckCircle, AlertCircle, WifiOff, Timer, ShieldAlert } from 'lucide-react';
import type { Auth } from './model';
import { 
  loadAuth, 
  disableCloudSync, 
  isCloudSyncReady 
} from './model';
import { useSyncStatus } from '../sync/engine';
import { showGuideNotice } from '../guide/notices';
import { AuthFlow } from './AuthFlow';

interface CloudSyncSettingsProps {
  className?: string;
}

export function CloudSyncSettings({ className = '' }: CloudSyncSettingsProps) {
  const [auth, setAuth] = useState<Auth>(() => loadAuth());
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);
  const syncStatus = useSyncStatus();

  // Update auth state when it changes in localStorage (across tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      const newAuth = loadAuth();
      setAuth(newAuth);
    };

    // Listen for auth expiry events from transport layer
    const handleAuthExpired = (event: CustomEvent) => {
      showMessage('error', event.detail.message || 'Authentication expired');
    };

    // Listen for show auth renewal events from header
    const handleShowAuthRenewal = () => {
      // Scroll to this component or focus it
      const element = document.querySelector('[data-testid="cloud-sync-settings"]');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-expired', handleAuthExpired as EventListener);
    window.addEventListener('show-auth-renewal', handleShowAuthRenewal);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-expired', handleAuthExpired as EventListener);
      window.removeEventListener('show-auth-renewal', handleShowAuthRenewal);
    };
  }, []);

  const showMessage = (type: 'success' | 'error' | 'warning', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleToggleCloudSync = async () => {
    if (auth.enabled) {
      // Disable cloud sync - requires acknowledgement
      const confirmed = await showGuideNotice('cloud-sync-disable', {
        title: 'Sign Out',
        body: 'This will sign you out and disable cloud synchronization. Any future progress will be stored locally only.',
        actions: {
          acknowledge: 'Sign Out',
          cancel: 'Stay Signed In'
        }
      });

      if (confirmed) {
        const newAuth = disableCloudSync();
        setAuth(newAuth);
        showMessage('success', 'Signed out successfully. Your data stays local.');
      }
    } else {
      // Enable cloud sync - just set enabled flag, let AuthFlow handle email
      const newAuth = { ...auth, enabled: true };
      const { saveAuth } = await import('./model');
      saveAuth(newAuth);
      setAuth(newAuth);
      showMessage('success', 'Cloud sync enabled! Complete authentication to start syncing.');
    }
  };

  const handleAuthChange = (newAuth: Auth) => {
    setAuth(newAuth);
    if (newAuth.verified) {
      showMessage('success', 'Successfully authenticated! Cloud sync is now active.');
    }
  };

  const getStatusInfo = () => {
    if (!auth.enabled) {
      return { label: 'Local-only', variant: 'secondary' as const, icon: null };
    }
    
    if (auth.verified && auth.token) {
      return { label: 'Cloud enabled', variant: 'default' as const, icon: <CheckCircle className="w-3 h-3" /> };
    }
    
    return { label: 'Pending verification', variant: 'outline' as const, icon: <AlertCircle className="w-3 h-3" /> };
  };

  const status = getStatusInfo();
  
  // Render sync error banner based on error type
  const renderSyncErrorBanner = () => {
    if (!syncStatus.lastError || !syncStatus.lastErrorType) {
      return null;
    }
    
    const { lastErrorType, lastErrorUserMessage, lastErrorCode, isPaused } = syncStatus;
    
    if (lastErrorType === 'fatal' && lastErrorCode === 401) {
      return (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-800 font-medium">Authentication Expired</p>
              <p className="text-xs text-red-700 mt-0.5">
                {lastErrorUserMessage || 'Sign in again to continue syncing'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent('show-auth-renewal'))}
                className="mt-2 h-6 text-xs border-red-300 hover:bg-red-100"
              >
                Sign In Again
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    if (lastErrorType === 'retryable' && lastErrorCode === 429) {
      return (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Timer className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-amber-800 font-medium">Rate Limited</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {lastErrorUserMessage || 'Sync will retry automatically'}
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    if (lastErrorType === 'retryable' || lastErrorType === 'network') {
      return (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <WifiOff className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-blue-800 font-medium">
                {lastErrorType === 'network' ? 'Connection Issue' : 'Server Unavailable'}
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                {lastErrorUserMessage || "We'll keep your progress safe offline"}
              </p>
              {isPaused && (
                <div className="mt-1 text-xs text-blue-600">
                  <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-1 animate-pulse"></span>
                  Sync paused - will resume automatically
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    if (lastErrorType === 'fatal') {
      return (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-800 font-medium">Sync Error</p>
              <p className="text-xs text-red-700 mt-0.5">
                {lastErrorUserMessage || 'Something went wrong - please try again'}
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={className} data-testid="cloud-sync-settings">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-600" />
            Cloud Sync (Beta)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={status.variant} className="flex items-center gap-1">
              {status.icon}
              {status.label}
            </Badge>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="cloud-sync-toggle" className="text-sm font-medium">
              Enable cloud sync
            </Label>
            <Switch
              id="cloud-sync-toggle"
              checked={auth.enabled}
              onCheckedChange={handleToggleCloudSync}
              data-testid="cloud-sync-toggle"
            />
          </div>

          {/* Authentication Flow */}
          {auth.enabled && (
            <AuthFlow 
              onAuthChange={handleAuthChange}
              className="border-0 shadow-none p-0"
            />
          )}

          {/* Help text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>
              <strong>Local-first:</strong> Your data is stored safely on this device by default.
            </p>
            <p>
              <strong>Cloud sync:</strong> Optionally sync progress across devices (requires adult verification).
            </p>
          </div>

          {/* Sync error banner */}
          {renderSyncErrorBanner()}
          
          {/* Status message */}
          {message && (
            <div className={`text-sm p-3 rounded-lg ${{
              success: 'bg-green-50 text-green-700 border border-green-200',
              warning: 'bg-amber-50 text-amber-700 border border-amber-200',
              error: 'bg-red-50 text-red-700 border border-red-200'
            }[message.type]}`}>
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

