import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { AlertTriangle, Shield, Bell, Monitor } from 'lucide-react';
import { setGuardrailsEnabled } from '../hooks/useScoutQueue';

/**
 * FeatureFlagsPanel - Development feature toggles for safe pilot switches
 * Only available in development environment
 */
export function FeatureFlagsPanel() {
  // Only show in development
  const isDev = process.env.NODE_ENV === 'development';
  
  // Scout guardrails state
  const [scoutGuardrailsEnabled, setScoutGuardrailsEnabled] = useState(() => {
    return sessionStorage.getItem('qi.qa.scout') !== 'on';
  });
  
  // Assignment nudges state
  const [assignmentNudgesEnabled, setAssignmentNudgesEnabled] = useState(() => {
    return localStorage.getItem('qi.features.assignmentNudges') !== 'false';
  });
  
  // Projector mode state (without requiring provider)
  const [isProjectorMode, setIsProjectorMode] = useState(() => {
    return document.body.classList.contains('projector-mode');
  });
  
  // Projector mode default state
  const [projectorModeDefault, setProjectorModeDefault] = useState(() => {
    return localStorage.getItem('qi.features.projectorModeDefault') === 'true';
  });

  if (!isDev) return null;

  const handleScoutGuardrailsToggle = (enabled: boolean) => {
    setScoutGuardrailsEnabled(enabled);
    setGuardrailsEnabled(enabled);
    sessionStorage.setItem('qi.qa.scout', enabled ? 'off' : 'on');
  };

  const handleAssignmentNudgesToggle = (enabled: boolean) => {
    setAssignmentNudgesEnabled(enabled);
    localStorage.setItem('qi.features.assignmentNudges', enabled ? 'true' : 'false');
    // Dispatch custom event to notify assignment nudge system
    window.dispatchEvent(new CustomEvent('assignment-nudges-toggle', { 
      detail: { enabled } 
    }));
  };

  const toggleProjectorMode = () => {
    const body = document.body;
    const newMode = !isProjectorMode;
    
    if (newMode) {
      body.classList.add('projector-mode');
      body.classList.add('reduce-motion');
    } else {
      body.classList.remove('projector-mode');
      body.classList.remove('reduce-motion');
    }
    
    setIsProjectorMode(newMode);
  };

  const handleProjectorModeDefaultToggle = (enabled: boolean) => {
    setProjectorModeDefault(enabled);
    localStorage.setItem('qi.features.projectorModeDefault', enabled ? 'true' : 'false');
    
    // If enabling default and not currently in projector mode, turn it on
    if (enabled && !isProjectorMode) {
      toggleProjectorMode();
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-purple-600" />
          Feature Flags (DEV)
          <Badge variant="outline" className="text-xs">Pilot Controls</Badge>
        </CardTitle>
        <p className="text-sm text-purple-700">
          Safe pilot switches for classroom deployment. Changes take effect immediately.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Scout Guardrails */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <Label className="text-sm font-medium">Scout Guardrails</Label>
              <p className="text-xs text-gray-600 mt-1">
                Rate limiting for Scout messages. Disable for testing full message volume.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={scoutGuardrailsEnabled ? "default" : "destructive"} className="text-xs">
                  {scoutGuardrailsEnabled ? 'Protected' : 'QA Mode'}
                </Badge>
                {!scoutGuardrailsEnabled && (
                  <span className="text-xs text-red-600">High message volume</span>
                )}
              </div>
            </div>
          </div>
          <Switch
            checked={scoutGuardrailsEnabled}
            onCheckedChange={handleScoutGuardrailsToggle}
            data-testid="scout-guardrails-toggle"
          />
        </div>

        {/* Assignment Nudges */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <Label className="text-sm font-medium">Assignment Nudges</Label>
              <p className="text-xs text-gray-600 mt-1">
                Scout reminders for overdue and due-soon assignments. Disable for uninterrupted exploration.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={assignmentNudgesEnabled ? "default" : "secondary"} className="text-xs">
                  {assignmentNudgesEnabled ? 'Active' : 'Silent'}
                </Badge>
              </div>
            </div>
          </div>
          <Switch
            checked={assignmentNudgesEnabled}
            onCheckedChange={handleAssignmentNudgesToggle}
            data-testid="assignment-nudges-toggle"
          />
        </div>

        {/* Projector Mode Default */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
          <div className="flex items-start gap-3">
            <Monitor className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <Label className="text-sm font-medium">Projector Mode Default</Label>
              <p className="text-xs text-gray-600 mt-1">
                Start in presentation-safe mode: hide names, boost fonts, reduce animations.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isProjectorMode ? "default" : "secondary"} className="text-xs">
                  {isProjectorMode ? 'Projector Active' : 'Normal View'}
                </Badge>
                {projectorModeDefault && (
                  <span className="text-xs text-green-600">Auto-enabled</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Switch
              checked={projectorModeDefault}
              onCheckedChange={handleProjectorModeDefaultToggle}
              data-testid="projector-mode-default-toggle"
            />
            {!projectorModeDefault && (
              <button
                onClick={toggleProjectorMode}
                className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                data-testid="projector-mode-manual-toggle"
              >
                {isProjectorMode ? 'Exit Projector' : 'Enter Projector'}
              </button>
            )}
          </div>
        </div>

        {/* Status Summary */}
        <div className="p-3 rounded-lg bg-gray-50 border-t">
          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-medium">Current Pilot Configuration:</p>
            <div className="grid grid-cols-1 gap-1">
              <span>• Scout: {scoutGuardrailsEnabled ? 'Guardrails ON' : 'QA Mode (no limits)'}</span>
              <span>• Nudges: {assignmentNudgesEnabled ? 'Enabled' : 'Disabled'}</span>
              <span>• Display: {isProjectorMode ? 'Projector Mode' : 'Normal Mode'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}