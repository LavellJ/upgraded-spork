import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  HardDrive, 
  Wifi, 
  Download, 
  RefreshCw, 
  Smartphone, 
  CheckCircle, 
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { getMemoryInfo, getConnectionInfo } from '../device/memory';
import { useOnline } from '../pwa/useOnline';

interface QAPanelProps {
  currentBiome?: 'forest' | 'desert' | 'ocean' | 'night';
}

interface CacheStatus {
  [cacheName: string]: number;
}

interface StorageEstimate {
  quota?: number;
  usage?: number;
  usageDetails?: {
    [storageType: string]: number;
  };
}

export function QAPanel({ currentBiome = 'forest' }: QAPanelProps) {
  const [swStatus, setSwStatus] = useState<'unsupported' | 'installing' | 'active' | 'error'>('unsupported');
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({});
  const [storageInfo, setStorageInfo] = useState<StorageEstimate>({});
  const [isPreloading, setIsPreloading] = useState(false);
  const [lastPreload, setLastPreload] = useState<string | null>(null);
  
  const { online } = useOnline();
  const memoryInfo = getMemoryInfo();
  const connectionInfo = getConnectionInfo();

  // Check service worker status
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setSwStatus('unsupported');
      return;
    }

    navigator.serviceWorker.ready.then(registration => {
      if (registration.active) {
        setSwStatus('active');
      } else if (registration.installing) {
        setSwStatus('installing');
      }
    }).catch(() => {
      setSwStatus('error');
    });

    // Listen for SW messages
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data.type === 'ASSET_CACHED') {
        refreshCacheStatus();
      }
    });
  }, []);

  // Get storage usage
  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        setStorageInfo(estimate);
      });
    }
  }, []);

  // Refresh cache status
  const refreshCacheStatus = async () => {
    if (!('serviceWorker' in navigator) || swStatus !== 'active') return;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        // Create a message channel for response
        const messageChannel = new MessageChannel();
        
        return new Promise((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            setCacheStatus(event.data);
            resolve(event.data);
          };

          registration.active.postMessage(
            { type: 'GET_CACHE_STATUS' },
            [messageChannel.port2]
          );
        });
      }
    } catch (error) {
      console.error('Failed to get cache status:', error);
    }
  };

  // Preload current biome assets
  const preloadBiome = async () => {
    if (!online) {
      alert('Cannot preload while offline');
      return;
    }

    setIsPreloading(true);
    try {
      const biomeAssets = getBiomeAssets(currentBiome);
      
      // Prefetch assets to trigger SW caching
      const prefetchPromises = biomeAssets.map(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
        
        // Clean up after a short delay
        setTimeout(() => {
          document.head.removeChild(link);
        }, 1000);
        
        return fetch(url).catch(() => null);
      });

      await Promise.all(prefetchPromises);
      setLastPreload(new Date().toLocaleTimeString());
      refreshCacheStatus();
    } catch (error) {
      console.error('Preload failed:', error);
    } finally {
      setIsPreloading(false);
    }
  };

  // Get biome-specific assets to preload
  const getBiomeAssets = (biome: string): string[] => {
    const baseAssets = [
      `/biomes/${biome}/background.webp`,
      `/biomes/${biome}/foreground.webp`,
      `/biomes/${biome}/midground.webp`,
      `/pins/${biome}/lesson-pin.svg`,
      `/pins/${biome}/completed-pin.svg`,
    ];

    // Add biome-specific lesson assets
    const lessonAssets = Array.from({ length: 10 }, (_, i) => 
      `/lessons/${biome}/lesson-${i + 1}.webp`
    );

    return [...baseAssets, ...lessonAssets];
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalAssets = (): number => {
    return Object.values(cacheStatus).reduce((total, count) => total + count, 0);
  };

  const getSwStatusColor = () => {
    switch (swStatus) {
      case 'active': return 'text-green-600';
      case 'installing': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSwStatusIcon = () => {
    switch (swStatus) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'installing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    refreshCacheStatus();
  }, [swStatus]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Device & Offline QA
        </h3>
        <Badge variant="secondary" className="text-xs">
          DEV ONLY
        </Badge>
      </div>

      {/* Service Worker Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Service Worker Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <div className={`flex items-center gap-1 ${getSwStatusColor()}`}>
              {getSwStatusIcon()}
              <span className="text-sm font-medium capitalize">{swStatus}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Online</span>
            <Badge variant={online ? "default" : "destructive"} className="text-xs">
              {online ? 'Connected' : 'Offline'}
            </Badge>
          </div>

          {connectionInfo.effectiveType && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Connection</span>
              <span className="text-xs font-mono">
                {connectionInfo.effectiveType}
                {connectionInfo.downlink && ` (${connectionInfo.downlink}Mbps)`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {storageInfo.usage !== undefined && storageInfo.quota !== undefined && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Used</span>
                <span className="text-xs font-mono">{formatBytes(storageInfo.usage)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Available</span>
                <span className="text-xs font-mono">{formatBytes(storageInfo.quota)}</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${(storageInfo.usage / storageInfo.quota) * 100}%` 
                  }}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Device Memory</span>
            <span className="text-xs font-mono">
              {memoryInfo.available ? `${memoryInfo.available}GB` : 'Unknown'}
              {memoryInfo.isLowMemory && (
                <Badge variant="destructive" className="ml-2 text-xs">Low</Badge>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Cache Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            Offline Assets ({getTotalAssets()} total)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(cacheStatus).map(([cacheName, count]) => (
            <div key={cacheName} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 truncate">{cacheName}</span>
              <Badge variant="outline" className="text-xs">
                {count} assets
              </Badge>
            </div>
          ))}

          <div className="pt-3 border-t">
            <Button 
              onClick={refreshCacheStatus} 
              variant="outline" 
              size="sm" 
              className="w-full mb-2"
              data-testid="refresh-cache-status"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh Status
            </Button>

            <Button 
              onClick={preloadBiome} 
              disabled={!online || isPreloading || swStatus !== 'active'}
              className="w-full"
              data-testid="preload-biome"
            >
              {isPreloading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Preloading {currentBiome}...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1" />
                  Preload {currentBiome} Biome
                </>
              )}
            </Button>

            {lastPreload && (
              <div className="text-xs text-gray-500 text-center mt-2">
                Last preload: {lastPreload}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device Recommendations */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-blue-900">Device Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs text-blue-800">
            {memoryInfo.isLowMemory && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 mt-0.5 text-amber-600" />
                <span>Low memory detected. Consider limiting concurrent biomes.</span>
              </div>
            )}
            
            {connectionInfo.effectiveType === 'slow-2g' || connectionInfo.effectiveType === '2g' && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 mt-0.5 text-amber-600" />
                <span>Slow connection. Preload assets when on WiFi.</span>
              </div>
            )}

            {!online && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 mt-0.5 text-red-600" />
                <span>Offline mode active. Some features may be limited.</span>
              </div>
            )}

            {swStatus === 'active' && getTotalAssets() > 0 && (
              <div className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 mt-0.5 text-green-600" />
                <span>Ready for offline use with {getTotalAssets()} cached assets.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}