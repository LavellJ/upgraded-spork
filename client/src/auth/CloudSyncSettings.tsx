// Cloud sync settings component for adult authentication

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Cloud, Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import type { Auth } from './model';
import { 
  loadAuth, 
  enableCloudSync, 
  sendMagicLink, 
  disableCloudSync, 
  isCloudSyncReady 
} from './model';

interface CloudSyncSettingsProps {
  className?: string;
}

export function CloudSyncSettings({ className = '' }: CloudSyncSettingsProps) {
  const [auth, setAuth] = useState<Auth>(() => loadAuth());
  const [email, setEmail] = useState(auth.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Update auth state when it changes in localStorage (across tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      const newAuth = loadAuth();
      setAuth(newAuth);
      setEmail(newAuth.email || '');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleToggleCloudSync = async () => {
    if (auth.enabled) {
      // Disable cloud sync
      const newAuth = disableCloudSync();
      setAuth(newAuth);
      setEmail('');
      showMessage('success', 'Cloud sync disabled. Your data stays local.');
    } else {
      // Enable cloud sync - need email first
      if (!email.trim()) {
        showMessage('error', 'Please enter your email address first.');
        return;
      }

      if (!isValidEmail(email.trim())) {
        showMessage('error', 'Please enter a valid email address.');
        return;
      }

      try {
        const newAuth = enableCloudSync(email.trim());
        setAuth(newAuth);
        showMessage('success', 'Cloud sync enabled. Send magic link to verify.');
      } catch (error) {
        showMessage('error', 'Failed to enable cloud sync. Please try again.');
      }
    }
  };

  const handleSendMagicLink = async () => {
    if (!auth.enabled || !auth.email) {
      showMessage('error', 'Please enable cloud sync first.');
      return;
    }

    setIsLoading(true);

    try {
      // In development, this just marks as verified
      const newAuth = sendMagicLink(auth);
      setAuth(newAuth);
      showMessage('success', 'Magic link sent! Check your email (DEV: auto-verified).');
    } catch (error) {
      showMessage('error', 'Failed to send magic link. Please try again.');
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
              <Button
                onClick={handleSendMagicLink}
                disabled={isLoading || !email.trim()}
                size="sm"
                className="w-full"
                data-testid="send-magic-link"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send magic link
                  </>
                )}
              </Button>
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

        {/* Status message */}
        {message && (
          <div className={`text-xs p-2 rounded ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
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