// Prefetch settings component for Privacy & Data section

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Download, Zap, Smartphone } from 'lucide-react';
import { 
  getPrefetchSettings, 
  savePrefetchSettings, 
  clearPrefetchCache 
} from '../pwa/prefetch';
import { getMemoryInfo, getConnectionInfo } from '../device/memory';

interface PrefetchSettingsProps {
  className?: string;
}

export function PrefetchSettings({ className = '' }: PrefetchSettingsProps) {
  const [settings, setSettings] = useState(() => getPrefetchSettings());
  const [deviceInfo] = useState(() => ({
    memory: getMemoryInfo(),
    connection: getConnectionInfo()
  }));

  // Update settings when they change in localStorage (across tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      const newSettings = getPrefetchSettings();
      setSettings(newSettings);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleTogglePrefetch = (enabled: boolean) => {
    const newSettings = {
      ...settings,
      enabled
    };
    
    setSettings(newSettings);
    savePrefetchSettings(newSettings);
    
    // Clear existing prefetch cache if disabling
    if (!enabled) {
      clearPrefetchCache();
    }
  };

  const getRecommendation = () => {
    if (deviceInfo.memory.isLowMemory) {
      return {
        color: 'amber',
        text: 'Disabled (recommended for your device)',
        icon: <Smartphone className="w-3 h-3" />
      };
    }
    
    return {
      color: 'green',
      text: 'Enabled (recommended)',
      icon: <Zap className="w-3 h-3" />
    };
  };

  const recommendation = getRecommendation();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="w-5 h-5 text-blue-600" />
          Lesson Prefetch
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="prefetch-toggle" className="text-sm font-medium">
            Prefetch lesson art
          </Label>
          <Switch
            id="prefetch-toggle"
            checked={settings.enabled}
            onCheckedChange={handleTogglePrefetch}
            data-testid="prefetch-toggle"
          />
        </div>

        {/* Status & Recommendation */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <Badge 
            variant={settings.enabled ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            {settings.enabled ? (
              <>
                <Zap className="w-3 h-3" />
                Active
              </>
            ) : (
              "Disabled"
            )}
          </Badge>
        </div>

        {/* Device Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center justify-between">
              <span>Recommendation:</span>
              <Badge 
                variant="outline" 
                className={`text-${recommendation.color}-700 border-${recommendation.color}-200 bg-${recommendation.color}-50 flex items-center gap-1`}
              >
                {recommendation.icon}
                {recommendation.text.split(' ')[0]}
              </Badge>
            </div>
            
            {deviceInfo.memory.supported && (
              <div className="flex items-center justify-between">
                <span>Device Memory:</span>
                <span className="font-medium">
                  {deviceInfo.memory.available}GB
                </span>
              </div>
            )}
            
            {deviceInfo.connection.effectiveType && (
              <div className="flex items-center justify-between">
                <span>Connection:</span>
                <span className="font-medium">
                  {deviceInfo.connection.effectiveType.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Help text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>What it does:</strong> Downloads images for the next 2 lessons ahead of time 
            so they load faster when you click on them.
          </p>
          <p>
            <strong>When disabled:</strong> Lessons still work perfectly, but images may take 
            a moment longer to appear on slower connections.
          </p>
        </div>

        {/* Debug info (DEV only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-400">Debug Info</summary>
            <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify({ 
                settings, 
                deviceInfo,
                lastUpdated: new Date(settings.lastUpdated).toLocaleString()
              }, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}