/**
 * Cloud Sync Error Display Component
 * Shows human-readable error messages with structured error handling
 */
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, X, WifiOff, Server, Clock, AlertTriangle } from 'lucide-react';

interface SyncError {
  code: string;
  message: string;
  details?: any;
  requestId?: string;
  timestamp: number;
  retryable: boolean;
}

interface CloudSyncErrorDisplayProps {
  errors: SyncError[];
  onRetry?: (error: SyncError) => void;
  onDismiss?: (errorId: string) => void;
  className?: string;
}

// Map error codes to user-friendly messages and icons
const errorConfig = {
  VALIDATION_ERROR: {
    icon: AlertTriangle,
    title: 'Invalid Data',
    description: 'The data being synced has formatting issues.',
    color: 'amber',
    retryable: false,
  },
  AUTH_ERROR: {
    icon: AlertCircle,
    title: 'Authentication Issue',
    description: 'Please log in again to continue syncing.',
    color: 'red',
    retryable: false,
  },
  RATE_LIMIT: {
    icon: Clock,
    title: 'Sync Rate Limit',
    description: 'Too many sync requests. Please wait a moment and try again.',
    color: 'yellow',
    retryable: true,
  },
  NETWORK_ERROR: {
    icon: WifiOff,
    title: 'Connection Problem',
    description: 'Check your internet connection and try again.',
    color: 'orange',
    retryable: true,
  },
  INTERNAL_ERROR: {
    icon: Server,
    title: 'Server Issue',
    description: 'Our servers are experiencing issues. We\'re working to fix this.',
    color: 'red',
    retryable: true,
  },
  NOT_FOUND: {
    icon: AlertCircle,
    title: 'Resource Not Found',
    description: 'The requested resource could not be found.',
    color: 'red',
    retryable: false,
  },
} as const;

function getErrorConfig(code: string) {
  return errorConfig[code as keyof typeof errorConfig] || errorConfig.INTERNAL_ERROR;
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) { // Less than 1 minute
    return 'Just now';
  } else if (diff < 3600000) { // Less than 1 hour
    return `${Math.floor(diff / 60000)}m ago`;
  } else if (diff < 86400000) { // Less than 1 day
    return `${Math.floor(diff / 3600000)}h ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
}

export function CloudSyncErrorDisplay({ 
  errors, 
  onRetry, 
  onDismiss, 
  className 
}: CloudSyncErrorDisplayProps) {
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());

  // Auto-dismiss certain errors after a timeout
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    errors.forEach(error => {
      if (error.code === 'RATE_LIMIT') {
        const timeout = setTimeout(() => {
          const errorId = `${error.code}-${error.timestamp}`;
          setDismissedErrors(prev => new Set(prev).add(errorId));
          onDismiss?.(errorId);
        }, 30000); // Auto-dismiss rate limit errors after 30 seconds
        
        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [errors, onDismiss]);

  const visibleErrors = errors.filter(error => {
    const errorId = `${error.code}-${error.timestamp}`;
    return !dismissedErrors.has(errorId);
  });

  if (visibleErrors.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`} data-testid="cloud-sync-errors">
      {visibleErrors.map(error => {
        const config = getErrorConfig(error.code);
        const Icon = config.icon;
        const errorId = `${error.code}-${error.timestamp}`;
        
        return (
          <Alert key={errorId} className="relative" data-testid={`error-${error.code.toLowerCase()}`}>
            <Icon className="h-4 w-4" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{config.title}</span>
                  <Badge 
                    variant={error.retryable ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {error.retryable ? 'Retryable' : 'Action Required'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(error.timestamp)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDismissedErrors(prev => new Set(prev).add(errorId));
                      onDismiss?.(errorId);
                    }}
                    className="h-6 w-6 p-0"
                    data-testid={`dismiss-error-${error.code.toLowerCase()}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <AlertDescription className="text-sm mb-3">
                {config.description}
              </AlertDescription>
              
              {error.message !== config.description && (
                <div className="text-xs text-muted-foreground mb-2 font-mono bg-muted p-2 rounded">
                  {error.message}
                </div>
              )}
              
              {error.details && (
                <details className="text-xs text-muted-foreground mb-2">
                  <summary className="cursor-pointer">Technical details</summary>
                  <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(error.details, null, 2)}
                  </pre>
                </details>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {error.requestId && (
                    <Badge variant="outline" className="text-xs font-mono">
                      ID: {error.requestId.slice(-8)}
                    </Badge>
                  )}
                </div>
                
                {error.retryable && onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRetry(error)}
                    className="h-7 text-xs"
                    data-testid={`retry-error-${error.code.toLowerCase()}`}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          </Alert>
        );
      })}
    </div>
  );
}

// Hook for managing sync errors
export function useSyncErrors() {
  const [errors, setErrors] = useState<SyncError[]>([]);

  const addError = (error: Omit<SyncError, 'timestamp' | 'retryable'>) => {
    const syncError: SyncError = {
      ...error,
      timestamp: Date.now(),
      retryable: ['RATE_LIMIT', 'NETWORK_ERROR', 'INTERNAL_ERROR'].includes(error.code),
    };
    
    setErrors(prev => [...prev, syncError]);
  };

  const retryError = (error: SyncError) => {
    // Remove the error from the list
    setErrors(prev => prev.filter(e => 
      !(e.code === error.code && e.timestamp === error.timestamp)
    ));
  };

  const dismissError = (errorId: string) => {
    const [code, timestamp] = errorId.split('-');
    setErrors(prev => prev.filter(e => 
      !(e.code === code && e.timestamp === parseInt(timestamp))
    ));
  };

  const clearAllErrors = () => {
    setErrors([]);
  };

  return {
    errors,
    addError,
    retryError,
    dismissError,
    clearAllErrors,
  };
}

export type { SyncError };