/**
 * Content Pack Settings Component
 * 
 * Manages content pack discovery, installation, and locale-specific activation.
 * Integrates with the pack system to provide a user-friendly interface for
 * managing educational content bundles.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Package, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Globe, 
  Info,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { 
  listPacks, 
  getEnabledPacks, 
  togglePack, 
  enablePacksByLocale, 
  getActiveLocale, 
  findPackConflicts,
  fetchAvailablePacks,
  installPack,
  type LoadedPack,
  type PackIndexEntry
} from '../authoring/packs';
import type { Locale } from '../authoring/schema';

interface ContentPackSettingsProps {
  className?: string;
}

export function ContentPackSettings({ className = '' }: ContentPackSettingsProps) {
  const [loadedPacks, setLoadedPacks] = useState<LoadedPack[]>([]);
  const [availablePacks, setAvailablePacks] = useState<PackIndexEntry[]>([]);
  const [activeLocale, setActiveLocale] = useState<Locale>('en-AU');
  const [conflicts, setConflicts] = useState<Array<{ lessonId: string; packs: string[] }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Load pack data on mount
  useEffect(() => {
    loadPackData();
  }, []);

  const loadPackData = async () => {
    try {
      setIsLoading(true);
      
      // Load installed packs
      const packs = listPacks();
      setLoadedPacks(packs);
      
      // Load available packs from index
      const available = await fetchAvailablePacks();
      setAvailablePacks(available);
      
      // Get current locale and conflicts
      setActiveLocale(getActiveLocale());
      setConflicts(findPackConflicts());
      
    } catch (error) {
      showStatus('error', 'Failed to load pack information');
      console.error('Failed to load pack data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showStatus = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleLocaleChange = (locale: Locale) => {
    try {
      enablePacksByLocale(locale);
      setActiveLocale(locale);
      setConflicts(findPackConflicts());
      showStatus('success', `Switched to ${locale} locale`);
      
      // Refresh pack list to update enabled status
      setLoadedPacks(listPacks());
    } catch (error) {
      showStatus('error', 'Failed to change locale');
      console.error('Failed to change locale:', error);
    }
  };

  const handlePackToggle = (packId: string, enabled: boolean) => {
    try {
      togglePack(packId, enabled);
      setLoadedPacks(listPacks());
      setConflicts(findPackConflicts());
      
      // Track newly enabled packs for "New" tag feature
      if (enabled) {
        const newlyEnabled = JSON.parse(localStorage.getItem('qi.packs.newlyEnabled') || '{}');
        newlyEnabled[packId] = Date.now();
        localStorage.setItem('qi.packs.newlyEnabled', JSON.stringify(newlyEnabled));
      } else {
        // Remove from newly enabled when disabled
        const newlyEnabled = JSON.parse(localStorage.getItem('qi.packs.newlyEnabled') || '{}');
        delete newlyEnabled[packId];
        localStorage.setItem('qi.packs.newlyEnabled', JSON.stringify(newlyEnabled));
      }

      // Store pack preferences
      const enabledPacks = getEnabledPacks();
      const enabledList = enabledPacks.map(pack => pack.id);
      localStorage.setItem('qi.packs.enabled', JSON.stringify(enabledList));
      
      const pack = loadedPacks.find(p => p.id === packId);
      const action = enabled ? 'enabled' : 'disabled';
      showStatus('success', `${pack?.name || packId} ${action}`);
    } catch (error) {
      showStatus('error', `Failed to ${enabled ? 'enable' : 'disable'} pack`);
      console.error('Failed to toggle pack:', error);
    }
  };

  const handleInstallPack = async (packEntry: PackIndexEntry) => {
    try {
      setIsLoading(true);
      await installPack(packEntry);
      await loadPackData(); // Refresh data
      showStatus('success', `${packEntry.name} installed successfully`);
    } catch (error) {
      showStatus('error', `Failed to install ${packEntry.name}`);
      console.error('Failed to install pack:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enabledPacks = getEnabledPacks();
  const installedPackIds = new Set(loadedPacks.map(p => p.id));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="text-lg font-semibold">Content Packs</h2>
          <p className="text-sm text-gray-600">
            Manage educational content for different locales and frameworks
          </p>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <Alert className={`border-l-4 ${
          statusMessage.type === 'success' ? 'border-green-500 bg-green-50' :
          statusMessage.type === 'error' ? 'border-red-500 bg-red-50' :
          'border-blue-500 bg-blue-50'
        }`}>
          <AlertDescription className="text-sm">
            {statusMessage.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Locale Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-5 w-5" />
            Active Locale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['en-AU', 'en-US', 'en-GB'] as Locale[]).map((locale) => (
              <Button
                key={locale}
                variant={activeLocale === locale ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLocaleChange(locale)}
                disabled={isLoading}
                data-testid={`locale-${locale}`}
              >
                {locale === 'en-AU' ? '🇦🇺 Australian' :
                 locale === 'en-US' ? '🇺🇸 American' :
                 '🇬🇧 British'}
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Content packs for the selected locale will be automatically enabled
          </p>
        </CardContent>
      </Card>

      {/* Conflicts Warning */}
      {conflicts.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm">
            <strong>Pack Conflicts Detected:</strong>
            <ul className="mt-1 space-y-1">
              {conflicts.map((conflict, index) => (
                <li key={index} className="text-xs">
                  Lesson "{conflict.lessonId}" appears in: {conflict.packs.join(', ')}
                </li>
              ))}
            </ul>
            <p className="text-xs mt-1 text-amber-700">
              The last enabled pack takes priority for conflicting content.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Installed Packs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Installed Packs ({loadedPacks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadedPacks.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No content packs installed</p>
            </div>
          ) : (
            loadedPacks.map((pack) => (
              <div
                key={pack.id}
                className="flex items-center justify-between p-3 border rounded-lg"
                data-testid={`pack-${pack.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-medium text-sm">{pack.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {pack.locale}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          v{pack.version}
                        </Badge>
                        {pack.isBuiltIn && (
                          <Badge variant="secondary" className="text-xs">
                            Built-in
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {pack.lessons.length} lesson(s) • 
                        {pack.lessons.reduce((total, lesson) => total + (lesson.activities?.length || 0), 0)} activities •
                        Loaded {new Date(pack.loadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={pack.isEnabled || false}
                    onCheckedChange={(enabled) => handlePackToggle(pack.id, enabled)}
                    disabled={isLoading || pack.isBuiltIn}
                    data-testid={`toggle-pack-${pack.id}`}
                  />
                  {!pack.isBuiltIn && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement pack removal
                        showStatus('info', 'Pack removal not yet implemented');
                      }}
                      disabled={isLoading}
                      data-testid={`remove-pack-${pack.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Available Packs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-5 w-5 text-blue-600" />
            Available Packs ({availablePacks.filter(p => !installedPackIds.has(p.id)).length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {availablePacks.filter(p => !installedPackIds.has(p.id)).length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">All available packs are installed</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadPackData}
                disabled={isLoading}
                className="mt-2"
                data-testid="refresh-packs"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          ) : (
            availablePacks
              .filter(pack => !installedPackIds.has(pack.id))
              .map((pack) => (
                <div
                  key={pack.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`available-pack-${pack.id}`}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{pack.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {pack.locale}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        v{pack.version}
                      </Badge>
                      {pack.size && (
                        <Badge variant="secondary" className="text-xs">
                          {(pack.size / 1024 / 1024).toFixed(1)}MB
                        </Badge>
                      )}
                    </div>
                    {pack.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {pack.description}
                      </p>
                    )}
                    {pack.author && (
                      <p className="text-xs text-gray-400 mt-1">
                        by {pack.author}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInstallPack(pack)}
                    disabled={isLoading}
                    data-testid={`install-pack-${pack.id}`}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Install
                  </Button>
                </div>
              ))
          )}
        </CardContent>
      </Card>

      {/* Pack Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-5 w-5 text-gray-600" />
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Enabled Packs</p>
              <p className="font-medium">{enabledPacks.length}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Lessons</p>
              <p className="font-medium">
                {enabledPacks.reduce((total, pack) => total + pack.lessons.length, 0)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Active Locale</p>
              <p className="font-medium">{activeLocale}</p>
            </div>
            <div>
              <p className="text-gray-500">Conflicts</p>
              <p className={`font-medium ${conflicts.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {conflicts.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}