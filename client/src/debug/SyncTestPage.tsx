// Debug page for testing transport hardening and error UX
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useSyncStatus, getSyncDebugInfo, forceSyncResume } from '../sync/engine';
import { getDevErrorLog } from '../sync/transport';
import { enqueue } from '../sync/queue';
import { Bug, PlayCircle, RotateCcw, Database, Wifi, Shield, Timer } from 'lucide-react';

export function SyncTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const syncStatus = useSyncStatus();
  
  const addResult = (message: string) => {
    setTestResults(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)]);
  };
  
  const simulateAuthError = async () => {
    addResult('🔐 Simulating auth error (401)...');
    
    // Temporarily corrupt the auth token to trigger 401
    const originalAuth = localStorage.getItem('qi.auth.v1');
    if (originalAuth) {
      const auth = JSON.parse(originalAuth);
      auth.token = 'invalid-token-' + Date.now();
      localStorage.setItem('qi.auth.v1', JSON.stringify(auth));
      
      // Queue a test item to trigger sync
      enqueue({
        kind: 'event',
        id: 'test-auth-error-' + Date.now(),
        payload: { action: 'test-401-error', testType: 'auth' },
        at: Date.now()
      });
      
      addResult('✅ Auth error test queued - watch for 401 response');
      
      // Restore original auth after a delay
      setTimeout(() => {
        if (originalAuth) {
          localStorage.setItem('qi.auth.v1', originalAuth);
          addResult('🔄 Auth restored');
        }
      }, 5000);
    }
  };
  
  const simulateRateLimit = async () => {
    addResult('⏱️ Simulating rate limit would require server-side changes');
    addResult('ℹ️ Rate limit testing requires backend 429 simulation');
  };
  
  const simulateServerError = async () => {
    addResult('🌐 Simulating server error would require server-side changes');
    addResult('ℹ️ Server error testing requires backend 500 simulation');
  };
  
  const testRetryLogic = async () => {
    addResult('🔄 Testing retry logic with network simulation...');
    
    // Queue multiple items to test batching and retry
    for (let i = 0; i < 3; i++) {
      enqueue({
        kind: 'event',
        id: 'test-retry-' + Date.now() + '-' + i,
        payload: { action: 'test-retry', batch: i },
        at: Date.now() + i
      });
    }
    
    addResult('✅ Retry test items queued');
  };
  
  const clearResults = () => {
    setTestResults([]);
  };
  
  const debugInfo = process.env.NODE_ENV === 'development' ? getSyncDebugInfo() : null;
  const errorLog = process.env.NODE_ENV === 'development' ? getDevErrorLog() : [];
  
  const getStatusBadge = () => {
    if (syncStatus.isPaused) {
      return <Badge variant="destructive">Paused</Badge>;
    }
    if (syncStatus.isSyncing) {
      return <Badge variant="default">Syncing</Badge>;
    }
    if (syncStatus.pending > 0) {
      return <Badge variant="secondary">Pending ({syncStatus.pending})</Badge>;
    }
    return <Badge variant="outline">Idle</Badge>;
  };
  
  const getErrorTypeBadge = (type?: string) => {
    if (!type) return null;
    
    const variants = {
      fatal: 'destructive',
      retryable: 'secondary', 
      network: 'outline'
    } as const;
    
    return <Badge variant={variants[type as keyof typeof variants] || 'outline'}>{type}</Badge>;
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Sync Transport Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button onClick={simulateAuthError} variant="outline" size="sm">
              <Shield className="w-4 h-4 mr-2" />
              Auth Error
            </Button>
            <Button onClick={simulateRateLimit} variant="outline" size="sm" disabled>
              <Timer className="w-4 h-4 mr-2" />
              Rate Limit
            </Button>
            <Button onClick={simulateServerError} variant="outline" size="sm" disabled>
              <Wifi className="w-4 h-4 mr-2" />
              Server Error
            </Button>
            <Button onClick={testRetryLogic} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Test Retry
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <Button onClick={forceSyncResume} variant="outline" size="sm">
              <PlayCircle className="w-4 h-4 mr-2" />
              Force Resume
            </Button>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sync Status</span>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Online:</span> {syncStatus.isOnline ? '✅' : '❌'}
            </div>
            <div>
              <span className="font-medium">Pending:</span> {syncStatus.pending}
            </div>
            <div>
              <span className="font-medium">Paused:</span> {syncStatus.isPaused ? '✅' : '❌'}
            </div>
            <div>
              <span className="font-medium">Syncing:</span> {syncStatus.isSyncing ? '✅' : '❌'}
            </div>
          </div>
          
          {syncStatus.lastError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-red-800">Last Error</span>
                {getErrorTypeBadge(syncStatus.lastErrorType)}
              </div>
              <div className="text-sm text-red-700">{syncStatus.lastError}</div>
              {syncStatus.lastErrorUserMessage && (
                <div className="text-xs text-red-600 mt-1">
                  User message: {syncStatus.lastErrorUserMessage}
                </div>
              )}
              {syncStatus.lastErrorCode && (
                <div className="text-xs text-red-600">
                  Code: {syncStatus.lastErrorCode}
                </div>
              )}
            </div>
          )}
          
          {syncStatus.lastSuccess && (
            <div className="text-xs text-green-600">
              Last success: {new Date(syncStatus.lastSuccess).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Test Results</span>
            <Button onClick={clearResults} variant="outline" size="sm">
              Clear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-sm text-gray-500">No test results yet</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-xs font-mono bg-gray-50 p-2 rounded">
                  {result}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      {process.env.NODE_ENV === 'development' && errorLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Dev Error Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {errorLog.map((entry, index) => (
                <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                  <div className="font-medium">
                    {new Date(entry.timestamp).toLocaleTimeString()} - 
                    {getErrorTypeBadge(entry.error.type)}
                  </div>
                  <div className="text-red-600">{entry.error.message}</div>
                  <div className="text-blue-600">{entry.error.userMessage}</div>
                  {entry.context && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-gray-600">Context</summary>
                      <pre className="mt-1 text-xs">{JSON.stringify(entry.context, null, 2)}</pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}