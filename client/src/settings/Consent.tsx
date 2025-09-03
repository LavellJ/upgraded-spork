import React, { useState } from 'react';
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
}

export function Consent({ open, onClose }: ConsentProps) {
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

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Privacy & Consent</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
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
    </BottomSheet>
  );
}