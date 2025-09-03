// Polished authentication flow with separate send/paste steps

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Key, 
  Send,
  Clock,
  RefreshCw
} from 'lucide-react';
import type { Auth } from './model';
import { loadAuth, enableCloudSync } from './model';
import { requestMagicLink, verifyAndStoreToken, isTokenNearExpiry, isTokenExpired } from './api';
import { showGuideNotice } from '../guide/notices';

type AuthState = 'idle' | 'sending' | 'sent' | 'verifying' | 'signed-in' | 'expired';

interface AuthFlowProps {
  className?: string;
  onAuthChange?: (auth: Auth) => void;
}

export function AuthFlow({ className = '', onAuthChange }: AuthFlowProps) {
  const [auth, setAuth] = useState<Auth>(() => loadAuth());
  const [email, setEmail] = useState(auth.email || '');
  const [token, setToken] = useState('');
  const [authState, setAuthState] = useState<AuthState>(() => {
    if (!auth.enabled) return 'idle';
    if (auth.verified && auth.token) {
      if (isTokenExpired(auth)) return 'expired';
      return 'signed-in';
    }
    return 'sent';
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

  // Update auth state when it changes
  useEffect(() => {
    const handleAuthChange = () => {
      const newAuth = loadAuth();
      setAuth(newAuth);
      setEmail(newAuth.email || '');
      
      // Update auth state based on current status
      if (!newAuth.enabled) {
        setAuthState('idle');
      } else if (newAuth.verified && newAuth.token) {
        if (isTokenExpired(newAuth)) {
          setAuthState('expired');
        } else {
          setAuthState('signed-in');
        }
      } else {
        setAuthState('sent');
      }
      
      onAuthChange?.(newAuth);
    };

    window.addEventListener('storage', handleAuthChange);
    return () => window.removeEventListener('storage', handleAuthChange);
  }, [onAuthChange]);

  const showMessage = (type: 'success' | 'error' | 'warning', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSendMagicLink = async () => {
    if (!isValidEmail(email.trim())) {
      showMessage('error', 'Please enter a valid email address.');
      return;
    }

    // First enable cloud sync if not already enabled
    if (!auth.enabled) {
      const confirmed = await showGuideNotice('cloud-sync-enable-consent', {
        title: 'Enable Cloud Sync & Data Processing',
        body: `This will enable cloud synchronization for learning data with the email: ${email.trim()}.\n\nPurpose: Backup progress across devices and enable teacher insights.\nRetention: Data stored for 1 year, then automatically deleted.\nAudit Trail: All sync activities are logged for transparency.\n\nYour data will be encrypted and only accessible by your classroom/family.`,
        actions: {
          acknowledge: 'I Consent to Cloud Sync',
          cancel: 'Keep Data Local Only'
        }
      });

      if (!confirmed) return;

      try {
        const newAuth = enableCloudSync(email.trim());
        setAuth(newAuth);
      } catch (error) {
        showMessage('error', 'Failed to enable cloud sync. Please try again.');
        return;
      }
    }

    try {
      setAuthState('sending');
      const result = await requestMagicLink(email.trim());
      
      if (result.success) {
        setAuthState('sent');
        if (result.token && process.env.NODE_ENV === 'development') {
          // In development, auto-verify for convenience
          try {
            const verifiedAuth = verifyAndStoreToken(result.token);
            setAuth(verifiedAuth);
            setAuthState('signed-in');
            showMessage('success', 'Development token verified automatically!');
          } catch (error) {
            showMessage('error', 'Failed to verify development token');
          }
        } else {
          showMessage('success', result.message);
        }
      } else {
        setAuthState(auth.enabled ? 'sent' : 'idle');
        showMessage('error', result.message);
      }
    } catch (error) {
      setAuthState(auth.enabled ? 'sent' : 'idle');
      showMessage('error', error instanceof Error ? error.message : 'Failed to send magic link');
    }
  };

  const handleVerifyToken = async () => {
    if (!token.trim()) {
      showMessage('error', 'Please enter your verification token.');
      return;
    }

    try {
      setAuthState('verifying');
      const verifiedAuth = verifyAndStoreToken(token.trim());
      setAuth(verifiedAuth);
      setToken('');
      setAuthState('signed-in');
      showMessage('success', 'Successfully signed in!');
    } catch (error) {
      setAuthState('sent');
      showMessage('error', error instanceof Error ? error.message : 'Invalid verification token');
    }
  };

  const handleRenewToken = async () => {
    if (!auth.email) return;
    
    try {
      setAuthState('sending');
      const result = await requestMagicLink(auth.email);
      
      if (result.success) {
        setAuthState('sent');
        if (result.token && process.env.NODE_ENV === 'development') {
          try {
            const verifiedAuth = verifyAndStoreToken(result.token);
            setAuth(verifiedAuth);
            setAuthState('signed-in');
            showMessage('success', 'Token renewed successfully!');
          } catch (error) {
            showMessage('error', 'Failed to verify renewed token');
          }
        } else {
          showMessage('success', result.message);
        }
      } else {
        setAuthState(auth.verified ? 'signed-in' : 'sent');
        showMessage('error', result.message || 'Failed to renew token');
      }
    } catch (error) {
      setAuthState(auth.verified ? 'signed-in' : 'sent');
      showMessage('error', error instanceof Error ? error.message : 'Failed to renew token');
    }
  };

  const getStateInfo = () => {
    switch (authState) {
      case 'idle':
        return {
          title: 'Sign In with Email',
          description: 'Enter your email to receive a secure sign-in link',
          badge: { label: 'Not signed in', variant: 'outline' as const },
          icon: <Mail className="w-4 h-4" />
        };
      case 'sending':
        return {
          title: 'Sending Magic Link',
          description: 'Please wait while we send your secure sign-in link',
          badge: { label: 'Sending...', variant: 'outline' as const },
          icon: <Loader className="w-4 h-4 animate-spin" />
        };
      case 'sent':
        return {
          title: 'Check Your Email',
          description: process.env.NODE_ENV === 'development' 
            ? 'In development mode, paste the token below' 
            : 'Click the link in your email or paste the token here',
          badge: { label: 'Email sent', variant: 'default' as const },
          icon: <Send className="w-4 h-4" />
        };
      case 'verifying':
        return {
          title: 'Verifying Token',
          description: 'Please wait while we verify your authentication',
          badge: { label: 'Verifying...', variant: 'outline' as const },
          icon: <Loader className="w-4 h-4 animate-spin" />
        };
      case 'signed-in':
        return {
          title: 'Successfully Signed In',
          description: 'Your account is authenticated and cloud sync is active',
          badge: { label: 'Signed in', variant: 'default' as const },
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'expired':
        return {
          title: 'Session Expired',
          description: 'Your authentication has expired. Please sign in again',
          badge: { label: 'Expired', variant: 'destructive' as const },
          icon: <AlertCircle className="w-4 h-4" />
        };
      default:
        return {
          title: 'Authentication',
          description: '',
          badge: { label: 'Unknown', variant: 'outline' as const },
          icon: <AlertCircle className="w-4 h-4" />
        };
    }
  };

  const stateInfo = getStateInfo();
  const showEmailStep = authState === 'idle' || authState === 'sending' || authState === 'expired';
  const showTokenStep = authState === 'sent' || authState === 'verifying';
  const showSignedIn = authState === 'signed-in';
  const showRenewalWarning = authState === 'signed-in' && auth.verified && isTokenNearExpiry(auth);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {stateInfo.icon}
            {stateInfo.title}
          </CardTitle>
          <Badge variant={stateInfo.badge.variant}>
            {stateInfo.badge.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {stateInfo.description}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Step 1: Email Input */}
        {showEmailStep && (
          <div className="space-y-3">
            <Label htmlFor="auth-email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="auth-email"
              type="email"
              placeholder="parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={authState === 'sending'}
              data-testid="auth-email-input"
            />
            <Button
              onClick={authState === 'expired' ? handleRenewToken : handleSendMagicLink}
              disabled={authState === 'sending' || !isValidEmail(email.trim())}
              className="w-full"
              data-testid="auth-send-link-button"
            >
              {authState === 'sending' ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  {process.env.NODE_ENV === 'development' ? 'Generating...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  {authState === 'expired' ? 'Send New Link' : 
                   process.env.NODE_ENV === 'development' ? 'Generate Dev Token' : 'Send Magic Link'}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Token Input */}
        {showTokenStep && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="auth-token" className="text-sm font-medium">
                Verification Token
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAuthState('idle')}
                className="text-xs"
                data-testid="auth-change-email-button"
              >
                Change email
              </Button>
            </div>
            <Input
              id="auth-token"
              type="text"
              placeholder="Paste your verification token here"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={authState === 'verifying'}
              data-testid="auth-token-input"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleVerifyToken}
                disabled={authState === 'verifying' || !token.trim()}
                className="flex-1"
                data-testid="auth-verify-token-button"
              >
                {authState === 'verifying' ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Verify & Sign In
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleSendMagicLink}
                disabled={authState === 'verifying'}
                data-testid="auth-resend-link-button"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {process.env.NODE_ENV === 'development' 
                ? 'In development, the token is generated automatically above.'
                : 'Check your email for the verification link or copy the token from the link.'}
            </p>
          </div>
        )}

        {/* Step 3: Signed In State */}
        {showSignedIn && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Signed in as {auth.email}
              </span>
            </div>
            
            {auth.exp && (
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Session expires in {getExpiryCountdown(auth)}
                </span>
              </div>
            )}
            
            {showRenewalWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-amber-800 font-medium">
                      Session Expiring Soon
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Your session will expire soon. Renew now to avoid interruption.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRenewToken}
                      className="mt-2 h-7 text-xs border-amber-300 hover:bg-amber-100"
                      data-testid="auth-renew-token-button"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Renew Session
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Status Message */}
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
  );
}

// Helper function for email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to get expiry countdown
function getExpiryCountdown(auth: Auth): string {
  if (!auth.exp) return '';
  
  const now = Math.floor(Date.now() / 1000);
  const remaining = auth.exp - now;
  
  if (remaining <= 0) return 'expired';
  
  const days = Math.floor(remaining / (24 * 60 * 60));
  const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
  
  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'}`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  } else {
    return 'less than 1 hour';
  }
}