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
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportAll, importAll, clearAll, getDataSummary, downloadBackup } from './backup';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dataSummary = getDataSummary();

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

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const text = await file.text();
      
      // Ask user about merge vs replace
      const shouldMerge = window.confirm(
        'Would you like to keep your current progress and add the imported data? ' +
        'Click OK to keep both, or Cancel to replace everything.'
      );
      
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

  const handleClearAll = () => {
    if (clearConfirmText !== 'CLEAR') {
      showStatus('error', 'Please type CLEAR exactly to confirm.');
      return;
    }

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
              LearnOz keeps all your learning progress right on your device. Nothing gets sent to our servers - 
              it's all yours and stays private!
            </p>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <p className="font-medium text-gray-800">What's Saved:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Your profile & settings</li>
                  <li>• Learning progress & skills</li>
                  <li>• Practice sessions</li>
                  <li>• Your reflections</li>
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

        {/* Data Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Your Learning Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profile Setup</span>
                  <Badge variant={dataSummary.profile ? "default" : "secondary"}>
                    {dataSummary.profile ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Learning Progress</span>
                  <Badge variant={dataSummary.learner ? "default" : "secondary"}>
                    {dataSummary.learner ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Activities</span>
                  <Badge variant={dataSummary.eventsCount > 0 ? "default" : "secondary"}>
                    {dataSummary.eventsCount}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Practice Sessions</span>
                  <Badge variant={dataSummary.journalSessionsCount > 0 ? "default" : "secondary"}>
                    {dataSummary.journalSessionsCount}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reflections</span>
                  <Badge variant={dataSummary.reflectionsCount > 0 ? "default" : "secondary"}>
                    {dataSummary.reflectionsCount}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Size</span>
                  <Badge variant="outline">
                    {formatDataSize(dataSummary.totalSize)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup & Restore */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Backup & Restore</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                Save Backup
              </Button>
              
              <Button
                variant="outline"
                onClick={handleImport}
                disabled={isProcessing}
                className="flex items-center gap-2"
                data-testid="import-data-button"
              >
                <Upload className="w-4 h-4" />
                Load Backup
              </Button>
            </div>

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