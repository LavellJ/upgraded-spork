/**
 * Cloud Sync Error Display Component
 * Shows human-readable error messages with structured error handling
 */
import { useState, useEffect, useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, X, WifiOff, Server, Clock, AlertTriangle, CloudOff } from 'lucide-react';

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

// Degraded mode state interface
interface DegradedModeState {
  isActive: boolean;
  startTime: number | null;
  consecutiveFailures: number;
  lastSuccessTime: number;
}

// Enhanced hook with degraded mode detection
export function useSyncErrorsWithDegradedMode() {
  const [errors, setErrors] = useState<SyncError[]>([]);
  const [degradedMode, setDegradedMode] = useState<DegradedModeState>({
    isActive: false,
    startTime: null,
    consecutiveFailures: 0,
    lastSuccessTime: Date.now(),
  });

  const degradedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addError = (error: Omit<SyncError, 'timestamp' | 'retryable'>) => {
    const syncError: SyncError = {
      ...error,
      timestamp: Date.now(),
      retryable: ['RATE_LIMIT', 'NETWORK_ERROR', 'INTERNAL_ERROR'].includes(error.code),
    };
    
    setErrors(prev => [...prev, syncError]);

    // Check if this is a server error (5xx) or network error
    if (error.code.startsWith('5') || error.code === 'NETWORK_ERROR' || error.code === 'INTERNAL_ERROR') {
      setDegradedMode(prev => {
        const newConsecutiveFailures = prev.consecutiveFailures + 1;
        const newState = {
          ...prev,
          consecutiveFailures: newConsecutiveFailures,
        };

        // Start degraded mode timer if we have multiple consecutive failures
        if (newConsecutiveFailures >= 3 && !prev.isActive && !prev.startTime) {
          newState.startTime = Date.now();
          
          // Set timer for 5 minutes
          if (degradedTimeoutRef.current) {
            clearTimeout(degradedTimeoutRef.current);
          }
          
          degradedTimeoutRef.current = setTimeout(() => {
            setDegradedMode(prev => ({
              ...prev,
              isActive: true,
            }));
          }, 5 * 60 * 1000); // 5 minutes
        }

        return newState;
      });
    }
  };

  const recordSuccess = () => {
    const now = Date.now();
    setDegradedMode(prev => ({
      isActive: false,
      startTime: null,
      consecutiveFailures: 0,
      lastSuccessTime: now,
    }));

    // Clear any pending degraded mode timeout
    if (degradedTimeoutRef.current) {
      clearTimeout(degradedTimeoutRef.current);
      degradedTimeoutRef.current = null;
    }
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

  const dismissDegradedMode = () => {
    setDegradedMode(prev => ({
      ...prev,
      isActive: false,
    }));
  };

  const clearAllErrors = () => {
    setErrors([]);
  };

  useEffect(() => {
    return () => {
      if (degradedTimeoutRef.current) {
        clearTimeout(degradedTimeoutRef.current);
      }
    };
  }, []);

  return {
    errors,
    degradedMode,
    addError,
    recordSuccess,
    retryError,
    dismissError,
    dismissDegradedMode,
    clearAllErrors,
  };
}

// Degraded mode ribbon component
export function DegradedModeRibbon({ 
  isVisible, 
  onDismiss 
}: { 
  isVisible: boolean; 
  onDismiss: () => void; 
}) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white text-sm py-2 px-4 flex items-center justify-between shadow-md animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2">
        <CloudOff className="h-4 w-4" />
        <span className="font-medium">
          Cloud sync temporarily unavailable
        </span>
        <span className="opacity-90">
          • App remains fully functional offline
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        className="h-6 w-6 p-0 text-white hover:bg-orange-600"
        data-testid="button-dismiss-degraded-ribbon"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Example usage component combining error display and degraded mode
export function SyncErrorsContainer() {
  const { 
    errors, 
    degradedMode, 
    retryError, 
    dismissError, 
    dismissDegradedMode 
  } = useSyncErrorsWithDegradedMode();

  return (
    <>
      <DegradedModeRibbon
        isVisible={degradedMode.isActive}
        onDismiss={dismissDegradedMode}
      />
      
      <div className="fixed bottom-4 right-4 max-w-md z-40">
        <CloudSyncErrorDisplay
          errors={errors}
          onRetry={retryError}
          onDismiss={dismissError}
        />
      </div>
    </>
  );
}