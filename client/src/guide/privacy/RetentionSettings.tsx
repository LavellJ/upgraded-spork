/**
 * RetentionSettings.tsx
 * 
 * User-facing UI for configuring per-tenant data retention policies.
 * Integrated into Settings → Privacy & Data with clean sliders and previews.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Slider } from '../../components/ui/slider';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { useToast } from '../../hooks/use-toast';
import { 
  Clock, 
  Database, 
  Shield, 
  RotateCcw, 
  Info, 
  Archive, 
  Trash2,
  Calendar
} from 'lucide-react';

type RetentionPolicy = {
  email: string;
  eventsDays: number;
  auditDays: number;
  updatedAt: string;
};

type RetentionDefaults = {
  eventsDays: number;
  auditDays: number;
};

type RetentionData = {
  policy: RetentionPolicy;
  defaults: RetentionDefaults;
  isCustom: boolean;
};

export function RetentionSettings() {
  // State
  const [retentionData, setRetentionData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventsDays, setEventsDays] = useState(90);
  const [auditDays, setAuditDays] = useState(365);
  const [hasChanges, setHasChanges] = useState(false);
  const [useCustomPolicy, setUseCustomPolicy] = useState(false);
  const { toast } = useToast();

  // Load current retention policy
  useEffect(() => {
    loadRetentionPolicy();
  }, []);

  // Track changes
  useEffect(() => {
    if (!retentionData) return;
    
    const changed = eventsDays !== retentionData.policy.eventsDays || 
                    auditDays !== retentionData.policy.auditDays;
    setHasChanges(changed);
  }, [eventsDays, auditDays, retentionData]);

  const loadRetentionPolicy = async () => {
    try {
      const response = await fetch('/api/retention/policy', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load retention policy: ${response.status}`);
      }
      
      const data: RetentionData = await response.json();
      setRetentionData(data);
      setEventsDays(data.policy.eventsDays);
      setAuditDays(data.policy.auditDays);
      setUseCustomPolicy(data.isCustom);
    } catch (error) {
      console.error('Error loading retention policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to load retention settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveRetentionPolicy = async () => {
    if (!hasChanges) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/retention/policy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          eventsDays,
          auditDays,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save retention policy: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Update state with saved policy
      setRetentionData(prev => prev ? {
        ...prev,
        policy: result.policy,
        isCustom: true
      } : null);
      
      setUseCustomPolicy(true);
      setHasChanges(false);
      
      toast({
        title: 'Settings saved',
        description: 'Your data retention preferences have been updated.',
      });
    } catch (error) {
      console.error('Error saving retention policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to save retention settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (!retentionData) return;
    
    setEventsDays(retentionData.defaults.eventsDays);
    setAuditDays(retentionData.defaults.auditDays);
    setUseCustomPolicy(false);
  };

  const formatDatePreview = (days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const daysDiff = Math.ceil((cutoffDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      relative: formatter.format(daysDiff, 'day'),
      absolute: cutoffDate.toLocaleDateString()
    };
  };

  const getRetentionInfo = (type: 'events' | 'audit', days: number) => {
    const preview = formatDatePreview(days);
    
    if (type === 'events') {
      return {
        title: 'Learning Activity Data',
        description: `Detailed learning progress, quiz results, and skill tracking`,
        action: `After ${days} days, detailed records become daily summaries`,
        cutoff: `Data older than ${preview.relative} (${preview.absolute}) gets compressed`
      };
    } else {
      return {
        title: 'Security & Access Logs',
        description: `Login activity, data access, and system events`,
        action: `After ${days} days, logs are permanently deleted`,
        cutoff: `Logs older than ${preview.relative} (${preview.absolute}) get deleted`
      };
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse" data-testid="retention-loading">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!retentionData) {
    return (
      <Card data-testid="retention-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Shield className="h-5 w-5" />
            Error Loading Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Unable to load retention settings. This may be a temporary issue.
          </p>
          <Button onClick={loadRetentionPolicy} size="sm" data-testid="button-retry">
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const eventsInfo = getRetentionInfo('events', eventsDays);
  const auditInfo = getRetentionInfo('audit', auditDays);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card data-testid="retention-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Data Retention Settings
          </CardTitle>
          <p className="text-sm text-gray-600">
            Control how long your data is kept in our system. 
            {useCustomPolicy ? ' Using custom policy.' : ' Using default policy.'}
          </p>
        </CardHeader>
      </Card>

      {/* Learning Data Retention */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4 text-blue-600" />
                {eventsInfo.title}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {eventsInfo.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {eventsDays}
              </div>
              <div className="text-xs text-gray-500">days</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>7 days</span>
                <Label htmlFor="events-slider" className="font-medium">
                  Keep detailed data for {eventsDays} days
                </Label>
                <span>365 days</span>
              </div>
              <Slider
                id="events-slider"
                min={7}
                max={365}
                step={7}
                value={[eventsDays]}
                onValueChange={(value) => setEventsDays(value[0])}
                className="w-full"
                data-testid="slider-events"
              />
            </div>
            
            {/* Preview */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-900">
                  {eventsInfo.action}
                </div>
                <div className="text-blue-700 mt-1">
                  {eventsInfo.cutoff}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Data Retention */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-orange-600" />
                {auditInfo.title}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {auditInfo.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">
                {auditDays}
              </div>
              <div className="text-xs text-gray-500">days</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>30 days</span>
                <Label htmlFor="audit-slider" className="font-medium">
                  Keep security logs for {auditDays} days
                </Label>
                <span>2555 days</span>
              </div>
              <Slider
                id="audit-slider"
                min={30}
                max={2555}
                step={30}
                value={[auditDays]}
                onValueChange={(value) => setAuditDays(value[0])}
                className="w-full"
                data-testid="slider-audit"
              />
            </div>
            
            {/* Preview */}
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <Trash2 className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-orange-900">
                  {auditInfo.action}
                </div>
                <div className="text-orange-700 mt-1">
                  {auditInfo.cutoff}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={resetToDefaults}
                variant="outline"
                size="sm"
                disabled={!hasChanges}
                data-testid="button-reset"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              
              {retentionData.isCustom && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Last updated: {new Date(retentionData.policy.updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
            
            <Button
              onClick={saveRetentionPolicy}
              disabled={!hasChanges || saving}
              data-testid="button-save"
            >
              {saving && <Clock className="h-4 w-4 mr-2 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
          
          {hasChanges && (
            <div className="flex items-center gap-2 mt-3 text-sm text-amber-600">
              <Info className="h-4 w-4" />
              You have unsaved changes to your retention policy.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-gray-600">
            <div className="font-medium">About retention policies:</div>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Learning data gets compressed to daily summaries after the retention period</li>
              <li>Security logs are permanently deleted after the audit period</li>
              <li>Changes apply immediately and cannot be undone</li>
              <li>Default settings meet privacy requirements for educational apps</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}