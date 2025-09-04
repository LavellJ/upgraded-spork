import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { AlertTriangle, Shield, Bell, Monitor, MessageSquare, Star, Bug, Share2 } from 'lucide-react';
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

  // Feedback system flags
  const [feedbackWidgetEnabled, setFeedbackWidgetEnabled] = useState(() => {
    return localStorage.getItem('qi.features.enableFeedbackWidget') !== 'false';
  });

  const [npsEnabled, setNpsEnabled] = useState(() => {
    return localStorage.getItem('qi.features.enableNps') !== 'false';
  });

  const [issueReporterEnabled, setIssueReporterEnabled] = useState(() => {
    return localStorage.getItem('qi.features.enableIssueReporter') !== 'false';
  });

  // Share/Rate prompt flags
  const [sharePromptEnabled, setSharePromptEnabled] = useState(() => {
    return localStorage.getItem('qi.features.enableSharePrompt') === 'true';
  });

  const [ratePromptEnabled, setRatePromptEnabled] = useState(() => {
    return localStorage.getItem('qi.features.enableRatePrompt') === 'true';
  });

  // Growth feature flags
  const [coTeacherInvitesEnabled, setCoTeacherInvitesEnabled] = useState(() => {
    if (process.env.NODE_ENV !== 'development') {
      return localStorage.getItem('qi.features.enableCoTeacherInvites') === 'true';
    }
    return localStorage.getItem('qi.features.enableCoTeacherInvites') !== 'false';
  });

  const [referralsEnabled, setReferralsEnabled] = useState(() => {
    if (process.env.NODE_ENV !== 'development') {
      return localStorage.getItem('qi.features.enableReferrals') === 'true';
    }
    return localStorage.getItem('qi.features.enableReferrals') !== 'false';
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

  const handleFeedbackWidgetToggle = (enabled: boolean) => {
    setFeedbackWidgetEnabled(enabled);
    localStorage.setItem('qi.features.enableFeedbackWidget', enabled ? 'true' : 'false');
    // Dispatch custom event to notify feedback components
    window.dispatchEvent(new CustomEvent('feedback-widget-toggle', { 
      detail: { enabled } 
    }));
  };

  const handleNpsToggle = (enabled: boolean) => {
    setNpsEnabled(enabled);
    localStorage.setItem('qi.features.enableNps', enabled ? 'true' : 'false');
    // Dispatch custom event to notify NPS system
    window.dispatchEvent(new CustomEvent('nps-toggle', { 
      detail: { enabled } 
    }));
  };

  const handleIssueReporterToggle = (enabled: boolean) => {
    setIssueReporterEnabled(enabled);
    localStorage.setItem('qi.features.enableIssueReporter', enabled ? 'true' : 'false');
    // Dispatch custom event to notify issue reporter
    window.dispatchEvent(new CustomEvent('issue-reporter-toggle', { 
      detail: { enabled } 
    }));
  };

  const handleSharePromptToggle = (enabled: boolean) => {
    setSharePromptEnabled(enabled);
    localStorage.setItem('qi.features.enableSharePrompt', enabled ? 'true' : 'false');
    // Dispatch custom event to notify share prompt system
    window.dispatchEvent(new CustomEvent('share-prompt-toggle', { 
      detail: { enabled } 
    }));
  };

  const handleRatePromptToggle = (enabled: boolean) => {
    setRatePromptEnabled(enabled);
    localStorage.setItem('qi.features.enableRatePrompt', enabled ? 'true' : 'false');
    // Dispatch custom event to notify rate prompt system
    window.dispatchEvent(new CustomEvent('rate-prompt-toggle', { 
      detail: { enabled } 
    }));
  };

  const handleCoTeacherInvitesToggle = (enabled: boolean) => {
    setCoTeacherInvitesEnabled(enabled);
    localStorage.setItem('qi.features.enableCoTeacherInvites', enabled ? 'true' : 'false');
    // Dispatch custom event to notify growth components
    window.dispatchEvent(new CustomEvent('co-teacher-invites-toggle', { 
      detail: { enabled } 
    }));
  };

  const handleReferralsToggle = (enabled: boolean) => {
    setReferralsEnabled(enabled);
    localStorage.setItem('qi.features.enableReferrals', enabled ? 'true' : 'false');
    // Dispatch custom event to notify growth components
    window.dispatchEvent(new CustomEvent('referrals-toggle', { 
      detail: { enabled } 
    }));
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

        {/* Feedback System Flags */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Feedback Collection</span>
          </div>

          {/* Feedback Widget */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <Label className="text-sm font-medium">Enable Feedback Widget</Label>
                <p className="text-xs text-gray-600 mt-1">
                  Allow students to submit ideas, bug reports, and general feedback.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={feedbackWidgetEnabled ? "default" : "secondary"} className="text-xs">
                    {feedbackWidgetEnabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>
            <Switch
              checked={feedbackWidgetEnabled}
              onCheckedChange={handleFeedbackWidgetToggle}
              data-testid="feedback-widget-toggle"
            />
          </div>

          {/* NPS Surveys */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <Label className="text-sm font-medium">Enable NPS</Label>
                <p className="text-xs text-gray-600 mt-1">
                  Show satisfaction surveys after students reach engagement thresholds (throttled).
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={npsEnabled ? "default" : "secondary"} className="text-xs">
                    {npsEnabled ? 'Active' : 'Disabled'}
                  </Badge>
                  {npsEnabled && (
                    <span className="text-xs text-yellow-600">14-day throttle</span>
                  )}
                </div>
              </div>
            </div>
            <Switch
              checked={npsEnabled}
              onCheckedChange={handleNpsToggle}
              data-testid="nps-toggle"
            />
          </div>

          {/* Issue Reporter */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
            <div className="flex items-start gap-3">
              <Bug className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <Label className="text-sm font-medium">Enable Issue Reporter</Label>
                <p className="text-xs text-gray-600 mt-1">
                  Allow detailed technical bug reports with environment snapshots (PII-masked).
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={issueReporterEnabled ? "default" : "secondary"} className="text-xs">
                    {issueReporterEnabled ? 'Active' : 'Disabled'}
                  </Badge>
                  {issueReporterEnabled && (
                    <span className="text-xs text-red-600">PII protected</span>
                  )}
                </div>
              </div>
            </div>
            <Switch
              checked={issueReporterEnabled}
              onCheckedChange={handleIssueReporterToggle}
              data-testid="issue-reporter-toggle"
            />
          </div>

          {/* Share/Rate Prompts */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
            <div className="flex items-start gap-3">
              <Share2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <Label className="text-sm font-medium">Enable Share Prompts</Label>
                <p className="text-xs text-gray-600 mt-1">
                  Show gentle opt-in prompts to share referral links (NPS ≥ 9 OR streaker ≥ 40%).
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={sharePromptEnabled ? "default" : "secondary"} className="text-xs">
                    {sharePromptEnabled ? 'Active' : 'Disabled'}
                  </Badge>
                  {sharePromptEnabled && (
                    <span className="text-xs text-blue-600">21-day throttle</span>
                  )}
                </div>
              </div>
            </div>
            <Switch
              checked={sharePromptEnabled}
              onCheckedChange={handleSharePromptToggle}
              data-testid="share-prompt-toggle"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <Label className="text-sm font-medium">Enable Rate Prompts</Label>
                <p className="text-xs text-gray-600 mt-1">
                  Show gentle opt-in prompts to rate experience and give feedback.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={ratePromptEnabled ? "default" : "secondary"} className="text-xs">
                    {ratePromptEnabled ? 'Active' : 'Disabled'}
                  </Badge>
                  {ratePromptEnabled && (
                    <span className="text-xs text-orange-600">A/B testing</span>
                  )}
                </div>
              </div>
            </div>
            <Switch
              checked={ratePromptEnabled}
              onCheckedChange={handleRatePromptToggle}
              data-testid="rate-prompt-toggle"
            />
          </div>
        </div>

        {/* Growth Features */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
          <div className="flex items-start gap-3">
            <Share2 className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <Label className="text-sm font-medium">Co-teacher Invites</Label>
              <p className="text-xs text-gray-600 mt-1">
                Enable teachers to invite colleagues to collaborate on classes and share resources.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={coTeacherInvitesEnabled ? "default" : "secondary"} className="text-xs">
                  {coTeacherInvitesEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
                {coTeacherInvitesEnabled && (
                  <span className="text-xs text-blue-600">Collaboration</span>
                )}
              </div>
            </div>
          </div>
          <Switch
            checked={coTeacherInvitesEnabled}
            onCheckedChange={handleCoTeacherInvitesToggle}
            data-testid="co-teacher-invites-toggle"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
          <div className="flex items-start gap-3">
            <Share2 className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <Label className="text-sm font-medium">Referral Links</Label>
              <p className="text-xs text-gray-600 mt-1">
                Generate and track referral links for organic growth and teacher sharing.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={referralsEnabled ? "default" : "secondary"} className="text-xs">
                  {referralsEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
                {referralsEnabled && (
                  <span className="text-xs text-purple-600">Growth tracking</span>
                )}
              </div>
            </div>
          </div>
          <Switch
            checked={referralsEnabled}
            onCheckedChange={handleReferralsToggle}
            data-testid="referrals-toggle"
          />
        </div>

        {/* Status Summary */}
        <div className="p-3 rounded-lg bg-gray-50 border-t">
          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-medium">Current Pilot Configuration:</p>
            <div className="grid grid-cols-1 gap-1">
              <span>• Scout: {scoutGuardrailsEnabled ? 'Guardrails ON' : 'QA Mode (no limits)'}</span>
              <span>• Nudges: {assignmentNudgesEnabled ? 'Enabled' : 'Disabled'}</span>
              <span>• Display: {isProjectorMode ? 'Projector Mode' : 'Normal Mode'}</span>
              <span>• Feedback: {feedbackWidgetEnabled ? 'Enabled' : 'Disabled'}</span>
              <span>• NPS: {npsEnabled ? 'Enabled' : 'Disabled'}</span>
              <span>• Issues: {issueReporterEnabled ? 'Enabled' : 'Disabled'}</span>
              <span>• Share: {sharePromptEnabled ? 'Enabled' : 'Disabled'}</span>
              <span>• Rate: {ratePromptEnabled ? 'Enabled' : 'Disabled'}</span>
              <span>• Co-teacher: {coTeacherInvitesEnabled ? 'Enabled' : 'Disabled'}</span>
              <span>• Referrals: {referralsEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}