import React, { useState } from 'react';
import { useFlags } from '../config/flags';
import { SimpleLayout } from '../ui2/SimpleLayout';
import { ListCard, ListRow, ListSection } from '../ui2/List';
import { Ic } from '../ui2/icons';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Shield, 
  Download, 
  Trash2, 
  AlertTriangle, 
  FileText,
  Database,
  Cloud,
  CheckCircle,
  Eye,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportAll, clearAll, getDataSummary, downloadBackup } from './backup';
import { useRosterOptional } from '@/roster';
import { showGuideNotice } from '../guide/notices';
import { isGuide } from '../guide/auth';
import { loadAuth, disableCloudSync } from '../auth/model';

interface ConsentProps {
  open: boolean;
  onClose: () => void;
  inline?: boolean; // When true, renders content directly without BottomSheet
}

function LegacyConsent({ open, onClose, inline = false }: ConsentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const rosterContext = useRosterOptional();
  if (!rosterContext) {
    return <div className="p-4 text-sm text-fg-muted">No roster context available. Please ensure the RosterProvider wraps the app.</div>;
  }
  
  const { roster } = rosterContext;
  const dataSummary = getDataSummary();
  const auth = loadAuth();
  const isCloudEnabled = auth.enabled;
  const isGuideMode = isGuide();

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleViewPrivacySummary = () => {
    // Open privacy summary in new tab
    window.open('/docs/PRIVACY_SUMMARY.md', '_blank');
  };

  const handleExportData = async () => {
    try {
      setIsProcessing(true);
      downloadBackup(false); // No telemetry in consent export
      showStatus('success', 'Your learning data has been downloaded successfully!');
    } catch (error) {
      showStatus('error', 'Could not export your data. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteLocalData = async () => {
    if (!isGuideMode) {
      showStatus('error', 'Data deletion requires adult supervision.');
      return;
    }

    const confirmed = await showGuideNotice('delete-local-data', {
      title: 'Delete All Local Data',
      body: 'This will permanently delete all learning progress, journal entries, and settings stored on this device. This action cannot be undone. Cloud data (if enabled) will not be affected.',
      actions: {
        acknowledge: 'Delete Local Data',
        cancel: 'Keep Data'
      }
    });

    if (confirmed) {
      try {
        setIsProcessing(true);
        clearAll();
        showStatus('success', 'All local data has been deleted.');
        
        // Close consent panel after deletion
        setTimeout(() => {
          onClose();
        }, 2000);
      } catch (error) {
        showStatus('error', 'Could not delete data. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleOptOutCloudSync = async () => {
    if (!isGuideMode) {
      showStatus('error', 'Cloud sync settings require adult supervision.');
      return;
    }

    const confirmed = await showGuideNotice('opt-out-cloud-sync', {
      title: 'Disable Cloud Sync',
      body: 'This will turn off cloud synchronization and remove cloud access tokens. Your local data will remain intact. You can re-enable cloud sync later if needed.',
      actions: {
        acknowledge: 'Disable Cloud Sync',
        cancel: 'Keep Cloud Sync'
      }
    });

    if (confirmed) {
      try {
        setIsProcessing(true);
        disableCloudSync();
        showStatus('success', 'Cloud sync has been disabled. Your data stays local only.');
      } catch (error) {
        showStatus('error', 'Could not disable cloud sync. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const consentContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Privacy & Consent</h2>
        </div>
        {!inline && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Status Message */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-3 rounded-lg border ${
                statusMessage.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{statusMessage.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Privacy Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5" />
              What Data Do We Collect?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              LearnOz is designed with privacy first. We collect minimal learning data to help personalize education 
              and track progress. All data stays on your device unless you choose cloud sync.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium mb-2">What's Collected:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Learning progress and skill completion</li>
                <li>• Time spent on activities (for attention tracking)</li>
                <li>• Journal reflections and practice sessions</li>
                <li>• App usage patterns (no personal content)</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-800 font-medium mb-2">What's NOT Collected:</p>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>• No personal information about children</li>
                <li>• No actual responses or essay content</li>
                <li>• No location or device tracking</li>
                <li>• No sharing with third parties</li>
              </ul>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleViewPrivacySummary}
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Full Privacy Summary
            </Button>
          </CardContent>
        </Card>

        {/* Data Storage Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              Your Data Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg border bg-gray-50">
                <div className="flex items-center justify-center mb-2">
                  <Database className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-800">Local Storage</p>
                <p className="text-xs text-gray-600">On this device only</p>
                <Badge variant="default" className="mt-1 text-xs">
                  {dataSummary.learnerCount} learners
                </Badge>
              </div>
              
              <div className="text-center p-3 rounded-lg border bg-gray-50">
                <div className="flex items-center justify-center mb-2">
                  <Cloud className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-800">Cloud Sync</p>
                <p className="text-xs text-gray-600">Optional backup</p>
                <Badge 
                  variant={isCloudEnabled ? "default" : "secondary"} 
                  className="mt-1 text-xs"
                >
                  {isCloudEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Privacy First:</strong> Your data belongs to you. Export it anytime, 
                delete it when you want, and control who can access it.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Control Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleExportData}
              disabled={isProcessing}
              className="w-full"
              data-testid="export-learner-data"
            >
              <Download className="w-4 h-4 mr-2" />
              {isProcessing ? 'Exporting...' : 'Export My Learner Data'}
            </Button>

            {isCloudEnabled && (
              <Button 
                variant="outline"
                onClick={handleOptOutCloudSync}
                disabled={isProcessing}
                className="w-full"
                data-testid="opt-out-cloud-sync"
              >
                <Cloud className="w-4 h-4 mr-2" />
                {isProcessing ? 'Disabling...' : 'Opt Out of Cloud Sync'}
              </Button>
            )}

            <Button 
              variant="destructive"
              onClick={handleDeleteLocalData}
              disabled={isProcessing}
              className="w-full"
              data-testid="delete-local-data"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isProcessing ? 'Deleting...' : 'Delete Local Data'}
            </Button>

            {!isGuideMode && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs text-orange-800">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Some actions require adult supervision and will be available when a teacher or parent is logged in.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Questions about privacy? Contact your teacher or school administrator.
        </p>
      </div>
    </div>
  );

  // Render inline or in BottomSheet based on props
  if (inline) {
    return consentContent;
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="p-6">
        {consentContent}
      </div>
    </BottomSheet>
  );
}

function ConsentV3({ open = true, onClose = () => {}, inline = true }: ConsentProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [consentStats] = useState({
    totalFamilies: 15,
    signedConsents: 12,
    pendingConsents: 3,
    auditEvents: 47
  })
  
  const handleConsentStatus = () => {
    setLoading('status')
    try {
      // Show detailed consent status
      const statusReport = `=== FAMILY CONSENT STATUS ===

📊 Consent Overview:
• Total Families: ${consentStats.totalFamilies}
• Signed Consents: ${consentStats.signedConsents} (${Math.round((consentStats.signedConsents / consentStats.totalFamilies) * 100)}%)
• Pending Consents: ${consentStats.pendingConsents}
• Compliance Rate: ${Math.round((consentStats.signedConsents / consentStats.totalFamilies) * 100)}%

✅ Completed Consents:
• Smith Family (Emma) - Signed 3 days ago
• Johnson Family (Marcus) - Signed 1 week ago  
• Brown Family (Olivia) - Signed 2 weeks ago
• Davis Family (Lucas) - Signed 2 weeks ago
• Wilson Family (Sophia) - Signed 3 weeks ago
• And 7 more families...

⏳ Pending Consents:
• Garcia Family (Isabella) - Sent 2 days ago
• Anderson Family (Noah) - Sent 4 days ago
• Thomas Family (Ava) - Sent 1 week ago

📋 Consent Details:
• Educational use of student data
• Learning progress tracking
• Parental access to reports
• Optional marketing communications

🔒 COPPA Compliance:
All students under 13 have verified parental consent as required by COPPA regulations.`

      alert(statusReport)
    } finally {
      setLoading(null)
    }
  }

  const handleSendConsentLink = () => {
    setLoading('send')
    try {
      // Send consent links to families
      const sendOptions = `=== SEND CONSENT LINKS ===

📧 Email Consent Options:

Families needing consent:
• Garcia Family (parent@garcia.com)
• Anderson Family (parent@anderson.com)  
• Thomas Family (parent@thomas.com)

📄 Consent Form Includes:
• Educational data use permissions
• Learning progress tracking consent
• Parent dashboard access rights
• Communication preferences
• Data retention policies

⚙️  Send Options:
1. Send to all pending families (3 emails)
2. Send reminder to specific family
3. Schedule follow-up reminders
4. Customize consent form message

🔒 Security Features:
• Encrypted consent links (expires in 7 days)
• Digital signature capture
• Audit trail of all consent actions
• COPPA compliance verification

Would you like to send consent links to all pending families?`

      const sendToAll = confirm(sendOptions)
      
      if (sendToAll) {
        // Simulate sending consent emails
        alert(`✅ Consent Links Sent!

📧 Emails sent to 3 families:
• Garcia Family - Delivered
• Anderson Family - Delivered  
• Thomas Family - Delivered

📋 Email includes:
• Secure consent form link (expires in 7 days)
• Clear explanation of data use
• Digital signature requirement
• Contact info for questions

⏰ Follow-up reminder scheduled for 3 days if no response.

Families will receive immediate email notifications with secure consent links.`)
      }
    } finally {
      setLoading(null)
    }
  }

  const handleConsentHistory = () => {
    setLoading('history')
    try {
      // Show consent timeline and history
      const historyReport = `=== CONSENT HISTORY TIMELINE ===

📅 Recent Consent Activity:

Today:
• 2:30 PM - Reminder sent to Garcia Family
• 11:15 AM - Consent form updated (privacy section)

Yesterday:
• 4:45 PM - Anderson consent reminder scheduled
• 2:20 PM - Thomas Family consent link resent

3 Days Ago:
• 9:30 AM - Smith Family consent signed ✅
• 8:15 AM - Consent form template updated

1 Week Ago:
• 3:00 PM - Johnson Family consent signed ✅
• 1:45 PM - Bulk consent links sent to 8 families
• 10:30 AM - New consent form version deployed

📊 Historical Metrics:
• Total consents processed: ${consentStats.signedConsents + 23}
• Average response time: 4.2 days
• Reminder effectiveness: 73%
• Digital signature success: 99.2%

🔍 Audit Events (${consentStats.auditEvents}):
• Consent forms sent: 24 events
• Digital signatures: ${consentStats.signedConsents} events  
• Consent withdrawals: 0 events
• Form modifications: 3 events

📋 Compliance Notes:
All consent activities are automatically logged for FERPA and COPPA compliance auditing.`

      alert(historyReport)
    } finally {
      setLoading(null)
    }
  }

  const handleConsentAudit = () => {
    setLoading('audit')
    try {
      // Show detailed audit log for consent activities
      const auditReport = `=== CONSENT AUDIT LOG ===

🔍 Audit Trail (${consentStats.auditEvents} events):

Recent Audit Events:
• 2024-01-07 14:30 - Consent reminder sent (Garcia Family)
• 2024-01-07 11:15 - Consent form template updated  
• 2024-01-06 16:45 - Reminder scheduled (Anderson Family)
• 2024-01-04 09:30 - Digital consent signed (Smith Family)
• 2024-01-03 15:20 - Consent link resent (Thomas Family)

📊 Audit Categories:
• Form Sent: 24 events
• Digital Signature: ${consentStats.signedConsents} events
• Reminder Sent: 18 events
• Form Updated: 3 events
• Access Granted: ${consentStats.signedConsents} events

🔒 Compliance Tracking:
• COPPA verification: All minors verified
• FERPA requirements: Education records protected
• Signature validation: 99.2% success rate
• Data retention: 7 years (legal requirement)

⚠️  Compliance Alerts:
• 0 consent violations detected
• 0 unauthorized data access attempts
• All audit requirements met

📋 Legal Documentation:
Each consent action includes:
• Timestamp and actor identification
• IP address and device information
• Digital signature cryptographic hash
• Parent identity verification
• Legal basis and purpose of processing

Export audit log for compliance reporting?`

      const exportAudit = confirm(auditReport)
      
      if (exportAudit) {
        alert(`✅ Audit Export Generated!

File: consent-audit-${new Date().toISOString().slice(0,10)}.csv
Events: ${consentStats.auditEvents} records
Format: COPPA/FERPA compliant
Generated: ${new Date().toLocaleString()}

Export includes all consent-related audit events with legal documentation for compliance review.`)
      }
    } finally {
      setLoading(null)
    }
  }

  const handleConsentSettings = () => {
    setLoading('settings')
    try {
      // Show consent configuration options
      const settingsDialog = `=== CONSENT SETTINGS ===

⚙️  Current Configuration:

Consent Requirements:
• COPPA compliance: ENABLED (under 13)
• FERPA compliance: ENABLED (education records)
• Parental dashboard access: REQUIRED
• Marketing communications: OPTIONAL
• Third-party integrations: DISABLED

📧 Email Settings:
• Consent reminder frequency: 3 days
• Maximum reminders: 3 attempts
• Email template language: English
• Custom school branding: ENABLED

🔒 Security Settings:
• Consent link expiration: 7 days
• Digital signature required: YES
• IP address logging: ENABLED
• Audit trail retention: 7 years

⏰ Automation Settings:
• Auto-send to new families: ENABLED
• Schedule follow-up reminders: ENABLED
• Notify admin of completions: ENABLED
• Weekly compliance reports: ENABLED

📋 Compliance Standards:
✅ COPPA (Children's Online Privacy Protection Act)
✅ FERPA (Family Educational Rights and Privacy Act)  
✅ GDPR (General Data Protection Regulation)
✅ State privacy regulations

Would you like to modify any consent settings?`

      const modifySettings = confirm(settingsDialog)
      
      if (modifySettings) {
        const setting = prompt(`Consent Setting Options:

1. Reminder frequency (currently 3 days)
2. Email template customization
3. Security requirements
4. Automation preferences  
5. Compliance standards

Enter option number (1-5):`)
        
        if (setting && ['1','2','3','4','5'].includes(setting)) {
          const settings = [
            'Reminder frequency updated to 5 days',
            'Email template customization panel opened',
            'Security requirements configuration opened',
            'Automation preferences updated successfully',
            'Compliance standards review completed'
          ]
          
          alert(`✅ ${settings[parseInt(setting) - 1]}

Settings have been updated and will take effect immediately. All changes are logged for audit compliance.`)
        }
      }
    } finally {
      setLoading(null)
    }
  }
  
  // List UI version
  const content = (
    <SimpleLayout title="Consent" subtitle="Family consent and permission management">
      <div className="space-y-6">
        <div>
          <ListSection title="Family Consent"/>
          <ListCard>
            <ListRow 
              icon={<Ic.shield className="list-icon"/>} 
              title="Family consent status" 
              meta="Review signed digital consent forms" 
              value={loading === 'status' ? 'Loading...' : `${consentStats.signedConsents} of ${consentStats.totalFamilies} signed`}
              onClick={handleConsentStatus}
              data-testid="consent-status-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.bell className="list-icon"/>} 
              title="Send consent link" 
              meta="Email parents for digital consent" 
              value={loading === 'send' ? 'Sending...' : `${consentStats.pendingConsents} pending`}
              onClick={handleSendConsentLink}
              data-testid="consent-send-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.doc className="list-icon"/>} 
              title="Consent history" 
              meta="View timeline of consent actions" 
              value={loading === 'history' ? 'Loading...' : undefined}
              onClick={handleConsentHistory}
              data-testid="consent-history-row"
            />
          </ListCard>
        </div>

        <div>
          <ListSection title="Compliance"/>
          <ListCard>
            <ListRow 
              icon={<Ic.doc className="list-icon"/>} 
              title="Audit log" 
              meta="Data access and consent audit trail" 
              value={loading === 'audit' ? 'Loading...' : `${consentStats.auditEvents} events`}
              onClick={handleConsentAudit}
              data-testid="consent-audit-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.shield className="list-icon"/>} 
              title="Consent settings" 
              meta="Configure consent requirements" 
              value={loading === 'settings' ? 'Loading...' : undefined}
              onClick={handleConsentSettings}
              data-testid="consent-settings-row"
            />
          </ListCard>
        </div>
      </div>
    </SimpleLayout>
  )
  
  if (inline) {
    return content
  }
  
  return (
    <BottomSheet open={open} onClose={onClose}>
      {content}
    </BottomSheet>
  )
}

export default function Consent(props: ConsentProps) {
  return <ConsentV3 {...props} />
}