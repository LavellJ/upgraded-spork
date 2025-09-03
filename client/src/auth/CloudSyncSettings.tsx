// Cloud sync settings component for adult authentication

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Cloud, Mail, CheckCircle, AlertCircle, Loader, Copy, Clock, RefreshCw, WifiOff, Timer, ShieldAlert } from 'lucide-react';
import type { Auth } from './model';
import { 
  loadAuth, 
  enableCloudSync, 
  disableCloudSync, 
  isCloudSyncReady 
} from './model';
import { 
  requestMagicLink, 
  verifyAndStoreToken, 
  isTokenNearExpiry, 
  isTokenExpired, 
  getExpiryCountdown 
} from './api';
import { useSyncStatus } from '../sync/engine';
import { showGuideNotice } from '../guide/notices';
import { isGuide } from '../guide/auth';

interface CloudSyncSettingsProps {
  className?: string;
}

export function CloudSyncSettings({ className = '' }: CloudSyncSettingsProps) {
  const [auth, setAuth] = useState<Auth>(() => loadAuth());
  const [email, setEmail] = useState(auth.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [showTokenRenewal, setShowTokenRenewal] = useState(false);
  const syncStatus = useSyncStatus();

  // Update auth state when it changes in localStorage (across tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      const newAuth = loadAuth();
      setAuth(newAuth);
      setEmail(newAuth.email || '');
    };

    // Listen for auth expiry events from transport layer
    const handleAuthExpired = (event: CustomEvent) => {
      showMessage('error', event.detail.message || 'Authentication expired');
      setShowTokenRenewal(true);
      setGeneratedToken(null);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-expired', handleAuthExpired as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-expired', handleAuthExpired as EventListener);
    };
  }, []);

  const showMessage = (type: 'success' | 'error' | 'warning', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Check for token expiry on load and updates
  useEffect(() => {
    if (auth.verified && auth.token) {
      if (isTokenExpired(auth)) {
        showMessage('error', 'Your token has expired. Please sign in again.');
        setShowTokenRenewal(true);
      } else if (isTokenNearExpiry(auth)) {
        setShowTokenRenewal(true);
      }
    }
  }, [auth]);

  const handleToggleCloudSync = async () => {
    if (auth.enabled) {
      // Disable cloud sync - requires acknowledgement
      const { showGuideNotice } = await import('../guide/notices');
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
        setEmail('');
        setGeneratedToken(null);
        setShowTokenRenewal(false);
        showMessage('success', 'Signed out successfully. Your data stays local.');
      }
    } else {
      // Enable cloud sync - requires acknowledgement
      if (!email.trim()) {
        showMessage('error', 'Please enter your email address first.');
        return;
      }

      if (!isValidEmail(email.trim())) {
        showMessage('error', 'Please enter a valid email address.');
        return;
      }

      const confirmed = await showGuideNotice('cloud-sync-enable-consent', {
        title: 'Enable Cloud Sync & Data Processing',
        body: `This will enable cloud synchronization for learning data with the email: ${email.trim()}.\n\nPurpose: Backup progress across devices and enable teacher insights.\nRetention: Data stored for 1 year, then automatically deleted.\nAudit Trail: All sync activities are logged for transparency.\n\nYour data will be encrypted and only accessible by your classroom/family.`,
        actions: {
          acknowledge: 'I Consent to Cloud Sync',
          cancel: 'Keep Data Local Only'
        }
      });

      if (confirmed) {
        try {
          const newAuth = enableCloudSync(email.trim());
          setAuth(newAuth);
          showMessage('success', 'Cloud sync enabled. Send magic link to verify.');
        } catch (error) {
          showMessage('error', 'Failed to enable cloud sync. Please try again.');
        }
      }
    }
  };

  const handleSendMagicLink = async () => {
    if (!auth.enabled || !auth.email) {
      showMessage('error', 'Please enable cloud sync with an email first.');
      return;
    }

    try {
      setIsLoading(true);
      setGeneratedToken(null);
      
      const result = await requestMagicLink(auth.email!);
      
      if (result.success) {
        if (result.token) {
          // DEV mode: store token automatically and show it
          const verifiedAuth = verifyAndStoreToken(result.token);
          setAuth(verifiedAuth);
          setGeneratedToken(result.token);
          setShowTokenRenewal(false);
          showMessage('success', 'Development token generated and stored!');
        } else {
          // PROD mode: magic link sent to email
          showMessage('success', result.message);
        }
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to request magic link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = async () => {
    if (!generatedToken) return;
    
    try {
      await navigator.clipboard.writeText(generatedToken);
      showMessage('success', 'Token copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generatedToken;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showMessage('success', 'Token copied to clipboard!');
    }
  };

  const handleRenewToken = async () => {
    if (!auth.email) return;
    
    try {
      setIsLoading(true);
      setShowTokenRenewal(false);
      const result = await requestMagicLink(auth.email);
      
      if (result.success && result.token) {
        const verifiedAuth = verifyAndStoreToken(result.token);
        setAuth(verifiedAuth);
        setGeneratedToken(result.token);
        showMessage('success', 'Token renewed successfully!');
      } else {
        showMessage('error', result.message || 'Failed to renew token');
      }
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to renew token');
    } finally {
      setIsLoading(false);
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
              {!showTokenRenewal && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTokenRenewal(true)}
                  className="mt-2 h-6 text-xs border-red-300 hover:bg-red-100"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Sign In Again
                </Button>
              )}
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
    <Card className={className}>
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

        {/* Email input (when enabling) */}
        {auth.enabled && (
          <div className="space-y-2">
            <Label htmlFor="cloud-sync-email" className="text-xs text-gray-600">
              Adult email address
            </Label>
            <Input
              id="cloud-sync-email"
              type="email"
              placeholder="parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={auth.verified}
              data-testid="cloud-sync-email"
            />
            
            {auth.enabled && !auth.verified && (
              <>
                <p className="text-xs text-muted-foreground">
                  {process.env.NODE_ENV === 'development' 
                    ? 'Development mode: A token will be generated for testing.'
                    : 'We\'ll send a secure sign-in link to your email.'}
                </p>
                
                <Button
                  onClick={handleSendMagicLink}
                  disabled={isLoading || !isValidEmail(auth.email || '')}
                  size="sm"
                  className="w-full"
                  data-testid="send-magic-link"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      {process.env.NODE_ENV === 'development' ? 'Generating...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      {process.env.NODE_ENV === 'development' ? 'Generate Dev Token' : 'Send Magic Link'}
                    </>
                  )}
                </Button>
              </>
            )}
            
            {/* Development token display */}
            {process.env.NODE_ENV === 'development' && generatedToken && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-medium text-blue-900">Development Token</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyToken}
                    className="h-6 px-2 text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="bg-white p-2 rounded border text-xs font-mono break-all">
                  {generatedToken}
                </div>
              </div>
            )}

            {/* Verified state with token info */}
            {auth.verified && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Cloud sync is active</span>
                </div>
                
                {/* Token expiry info */}
                {auth.exp && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {getExpiryCountdown(auth)}
                    </span>
                  </div>
                )}
                
                {/* Token renewal warning */}
                {showTokenRenewal && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-amber-800 font-medium">
                          {isTokenExpired(auth) ? 'Token Expired' : 'Token Expiring Soon'}
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          {isTokenExpired(auth) 
                            ? 'Your authentication has expired. Please renew to continue syncing.'
                            : 'Your token will expire soon. Renew now to avoid interruption.'}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRenewToken}
                          disabled={isLoading}
                          className="mt-1 h-6 text-xs border-amber-300 hover:bg-amber-100"
                        >
                          {isLoading ? (
                            <><Loader className="w-3 h-3 mr-1 animate-spin" /> Renewing...</>
                          ) : (
                            <><RefreshCw className="w-3 h-3 mr-1" /> Renew Token</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Your learning progress is automatically backed up to the cloud.
                </p>
              </div>
            )}
          </div>
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
          <div className={`text-xs p-2 rounded ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : message.type === 'warning'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}