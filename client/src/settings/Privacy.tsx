import React, { useState, useRef } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { 
  Shield, 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  FileText,
  Database,
  X,
  CheckCircle,
  Users,
  Cloud,
  RefreshCw,
  User,
  FileCheck,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportAll, importAll, clearAll, getDataSummary, downloadBackup, importServerSnapshot } from './backup';
import { useRosterOptional } from '@/roster';

interface PrivacyProps {
  open: boolean;
  onClose: () => void;
}

export function Privacy({ open, onClose }: PrivacyProps) {
  const [includeTelemetry, setIncludeTelemetry] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showServerImport, setShowServerImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rosterContext = useRosterOptional();
  if (!rosterContext) {
    return <div className="p-4 text-sm text-fg-muted">No roster context available. Please ensure the RosterProvider wraps the app.</div>;
  }
  const { roster } = rosterContext;
  const dataSummary = getDataSummary();
  const isDev = process.env.NODE_ENV === 'development';

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      downloadBackup(includeTelemetry);
      showStatus('success', 'Your learning data has been saved!');
    } catch (error) {
      showStatus('error', 'Oops! Could not save your data. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    // Import requires acknowledgement since it can overwrite data
    const { showGuideNotice } = await import('../guide/notices');
    const confirmed = await showGuideNotice('data-import', {
      title: 'Import Learning Data',
      body: 'This will import data from a backup file. You can choose to merge with existing data or replace everything. This action cannot be undone.',
      actions: {
        acknowledge: 'Continue Import',
        cancel: 'Cancel'
      }
    });

    if (confirmed) {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const text = await file.text();
      
      const parsed = JSON.parse(text);
      const isV2 = parsed.version === '2.0';
      
      // Ask user about merge vs replace with better messaging for roster imports
      let message = 'Would you like to keep your current progress and add the imported data? ' +
                    'Click OK to keep both, or Cancel to replace everything.';
      
      if (isV2 && parsed.roster && parsed.roster.learners.length > 1) {
        message = `This backup contains ${parsed.roster.learners.length} learners. ` +
                  'Would you like to merge them with your current data? ' +
                  'Click OK to merge, or Cancel to replace everything.';
      }
      
      const shouldMerge = window.confirm(message);
      
      importAll(text, { merge: shouldMerge });
      showStatus('success', 'Your data has been imported successfully!');
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      showStatus('error', 'Could not import the file. Please check it\'s a valid LearnOz backup.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleServerSnapshot = async () => {
    if (!isDev) return;
    
    try {
      setIsProcessing(true);
      
      // Fetch roster and snapshot data from server
      const [rosterResponse, snapshotResponse] = await Promise.all([
        fetch('/api/roster'),
        fetch('/api/snapshot').catch(() => null) // Optional endpoint
      ]);
      
      if (!rosterResponse.ok) {
        throw new Error('Failed to fetch roster from server');
      }
      
      const roster = await rosterResponse.json();
      let snapshotData = null;
      
      if (snapshotResponse && snapshotResponse.ok) {
        snapshotData = await snapshotResponse.json();
      }
      
      const serverData = {
        roster,
        data: (snapshotData as any)?.data || {},
        telemetryBuffer: (snapshotData as any)?.telemetryBuffer
      };
      
      // Ask user about merge vs replace
      const shouldMerge = window.confirm(
        'Import server snapshot data? ' +
        'Click OK to merge with local data, or Cancel to replace everything.'
      );
      
      await importServerSnapshot(serverData, { merge: shouldMerge });
      showStatus('success', 'Server snapshot imported successfully!');
    } catch (error) {
      console.error('Server snapshot import failed:', error);
      showStatus('error', 'Could not import server snapshot. Make sure the server is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAuditDownload = async () => {
    try {
      setIsProcessing(true);
      
      // Get auth token for the request
      const authData = localStorage.getItem('qi.auth.v1');
      if (!authData) {
        showStatus('error', 'Authentication required. Please enable cloud sync first.');
        return;
      }
      
      const auth = JSON.parse(authData);
      if (!auth.token) {
        showStatus('error', 'No authentication token found. Please sign in.');
        return;
      }
      
      // Request audit log from server
      const response = await fetch('/api/admin/log', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.jsonl`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showStatus('success', 'Audit trail downloaded successfully!');
    } catch (error) {
      console.error('Audit download failed:', error);
      showStatus('error', `Could not download audit trail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = async () => {
    if (clearConfirmText !== 'CLEAR') {
      showStatus('error', 'Please type CLEAR exactly to confirm.');
      return;
    }

    // Clear all requires final acknowledgement
    const { showGuideNotice } = await import('../guide/notices');
    const confirmed = await showGuideNotice('data-clear-all', {
      title: 'Clear All Learning Data',
      body: 'This will permanently delete ALL learning progress, settings, reflections, and personal data. This action cannot be undone. Please ensure you have a backup if you want to keep anything.',
      actions: {
        acknowledge: 'Delete Everything',
        cancel: 'Keep My Data'
      }
    });

    if (confirmed) {
      try {
        setIsProcessing(true);
        clearAll();
        showStatus('success', 'All data has been cleared. Starting fresh!');
        setShowClearConfirm(false);
        setClearConfirmText('');
        
        // Close privacy panel after clearing
        setTimeout(() => onClose(), 2000);
      } catch (error) {
        showStatus('error', 'Could not clear all data. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const formatDataSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <BottomSheet 
      open={open} 
      onClose={onClose}
      titleId="privacy-title"
    >
      <div className="p-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <h1 id="privacy-title" className="text-xl font-bold text-gray-900">
                Privacy & Data
              </h1>
              <p className="text-sm text-gray-600">
                Your learning data stays safe on your device
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            data-testid="close-privacy-button"
          >
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
              className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                statusMessage.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{statusMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Local-First Explanation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              How Your Data Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-700">
              LearnOz keeps all your learning progress right on your device by default. Nothing gets sent to our servers 
              unless you choose to enable cloud sync - it's all yours and stays private!
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium mb-1">🔄 Optional Cloud Sync</p>
              <p className="text-xs text-blue-700">
                Optionally sync your progress across devices with adult verification. 
                Cloud sync requires a magic link sent to an adult's email.
              </p>
            </div>
            
            {isDev && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-800">Analytics Dictionary</p>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  View detailed information about what learning data is collected and how it's used.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/docs/ANALYTICS_DICTIONARY.md', '_blank')}
                  className="text-xs"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  View Analytics Documentation
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <p className="font-medium text-gray-800">What's Saved:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Your profile & settings</li>
                  <li>• Learning progress & skills</li>
                  <li>• Practice sessions</li>
                  <li>• Your reflections</li>
                  <li>• Focus time & engagement</li>
                </ul>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-gray-800">Where It's Stored:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• On your device only</li>
                  <li>• Not shared with anyone</li>
                  <li>• You control everything</li>
                  <li>• Can backup anytime</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Summary - Roster Aware */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Learning Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Roster Overview */}
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Roster Status</span>
                <Badge variant={dataSummary.hasRoster ? "default" : "secondary"}>
                  {dataSummary.hasRoster ? `${dataSummary.learnerCount} Learners` : 'No Roster'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Global Profile</span>
                  <Badge variant={dataSummary.globalProfile ? "default" : "secondary"} className="text-xs">
                    {dataSummary.globalProfile ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Total Size</span>
                  <Badge variant="outline" className="text-xs">
                    {formatDataSize(dataSummary.totalSize)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Per-Learner Breakdown */}
            {dataSummary.learners.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-800">Learner Data Breakdown</h4>
                {dataSummary.learners.map((learner) => (
                  <div key={learner.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium">{learner.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatDataSize(learner.size)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Activities</span>
                        <Badge variant={learner.eventsCount > 0 ? "default" : "secondary"} className="text-xs">
                          {learner.eventsCount}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Sessions</span>
                        <Badge variant={learner.journalSessionsCount > 0 ? "default" : "secondary"} className="text-xs">
                          {learner.journalSessionsCount}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Reflections</span>
                        <Badge variant={learner.reflectionsCount > 0 ? "default" : "secondary"} className="text-xs">
                          {learner.reflectionsCount}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Assignments</span>
                        <Badge variant={learner.assignedPathsCount > 0 ? "default" : "secondary"} className="text-xs">
                          {learner.assignedPathsCount}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {dataSummary.learners.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No learner data found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup & Restore */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Backup & Restore</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Backup Info */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800 font-medium mb-1">📋 Roster-Aware Backups (V2)</p>
              <p className="text-xs text-amber-700">
                Exports include all learners and their namespaced data. 
                {dataSummary.learnerCount > 1 && ` Backing up ${dataSummary.learnerCount} learners.`}
              </p>
            </div>

            {/* Telemetry Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex-1">
                <p className="text-sm font-medium">Include Anonymous Usage Data</p>
                <p className="text-xs text-gray-600">
                  Help improve LearnOz by including anonymous usage patterns
                </p>
              </div>
              <Switch
                checked={includeTelemetry}
                onCheckedChange={setIncludeTelemetry}
                data-testid="telemetry-toggle"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleExport}
                disabled={isProcessing}
                className="flex items-center gap-2"
                data-testid="export-data-button"
              >
                <Download className="w-4 h-4" />
                Export All ({dataSummary.learnerCount > 1 ? 'Roster' : 'Single'})
              </Button>
              
              <Button
                variant="outline"
                onClick={handleImport}
                disabled={isProcessing}
                className="flex items-center gap-2"
                data-testid="import-data-button"
              >
                <Upload className="w-4 h-4" />
                Import Data
              </Button>
            </div>

            {/* Server Snapshot (DEV Only) */}
            {isDev && (
              <div className="pt-3 border-t border-gray-200">
                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 mb-3">
                  <p className="text-sm text-purple-800 font-medium mb-1">🔧 Development Tools</p>
                  <p className="text-xs text-purple-700">
                    Development utilities for testing and audit oversight
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={handleServerSnapshot}
                    disabled={isProcessing}
                    className="w-full flex items-center gap-2 text-purple-700 border-purple-300 hover:bg-purple-50"
                    data-testid="server-snapshot-button"
                  >
                    <Cloud className="w-4 h-4" />
                    Pull Server Snapshot
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleAuditDownload}
                    disabled={isProcessing}
                    className="w-full flex items-center gap-2 text-orange-700 border-orange-300 hover:bg-orange-50"
                    data-testid="audit-download-button"
                  >
                    <FileCheck className="w-4 h-4" />
                    Download Audit Trail (DEV)
                  </Button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="file-input"
            />
          </CardContent>
        </Card>

        {/* Clear Data Section */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Reset Everything
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              This will permanently delete all your progress, settings, and reflections. 
              Make sure to create a backup first if you want to keep anything!
            </p>

            {!showClearConfirm ? (
              <Button
                variant="destructive"
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center gap-2"
                data-testid="show-clear-button"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Data
              </Button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label htmlFor="clear-confirm" className="block text-sm font-medium text-gray-700 mb-2">
                    Type "CLEAR" to confirm:
                  </label>
                  <input
                    id="clear-confirm"
                    type="text"
                    value={clearConfirmText}
                    onChange={(e) => setClearConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Type CLEAR here"
                    data-testid="clear-confirm-input"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={handleClearAll}
                    disabled={clearConfirmText !== 'CLEAR' || isProcessing}
                    className="flex-1"
                    data-testid="confirm-clear-button"
                  >
                    Yes, Clear Everything
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowClearConfirm(false);
                      setClearConfirmText('');
                    }}
                    className="flex-1"
                    data-testid="cancel-clear-button"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Spacing */}
        <div className="h-4" />
      </div>
    </BottomSheet>
  );
}