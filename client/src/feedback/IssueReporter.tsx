// Issue Reporter form for structured bug reports with environment snapshot

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { X, Copy, Download, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import { buildEnvSnapshot, formatSnapshot, downloadSnapshot, copySnapshot, type EnvSnapshot } from './snapshot';
import { addFeedback } from './model';
import { useRosterOptional } from '../roster/context';

export interface IssueReport {
  summary: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  includeSnapshot: boolean;
  snapshot?: EnvSnapshot;
  reportedAt: number;
}

interface IssueReporterProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledSnapshot?: boolean;
}

export function IssueReporter({ isOpen, onClose, prefilledSnapshot = true }: IssueReporterProps) {
  const rosterContext = useRosterOptional();
  const activeLearner = rosterContext?.activeLearner;
  const [summary, setSummary] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [includeSnapshot, setIncludeSnapshot] = useState(prefilledSnapshot);
  const [snapshot, setSnapshot] = useState<EnvSnapshot | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Load snapshot when component mounts or when includeSnapshot changes
  useEffect(() => {
    if (isOpen && includeSnapshot && !snapshot) {
      loadSnapshot();
    }
  }, [isOpen, includeSnapshot, snapshot]);

  const loadSnapshot = async () => {
    setIsLoadingSnapshot(true);
    try {
      const envSnapshot = await buildEnvSnapshot();
      setSnapshot(envSnapshot);
    } catch (error) {
      console.error('Failed to build environment snapshot:', error);
    } finally {
      setIsLoadingSnapshot(false);
    }
  };

  const handleCopySnapshot = async () => {
    if (!snapshot) return;
    
    const success = await copySnapshot(snapshot);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownloadSnapshot = () => {
    if (!snapshot) return;
    
    const timestamp = new Date().toISOString().split('T')[0];
    downloadSnapshot(snapshot, `learnoz-bug-report-${timestamp}.json`);
  };

  const buildReport = (): IssueReport => {
    return {
      summary: summary.trim(),
      stepsToReproduce: stepsToReproduce.trim(),
      expectedBehavior: expectedBehavior.trim(),
      actualBehavior: actualBehavior.trim(),
      includeSnapshot,
      snapshot: includeSnapshot ? snapshot || undefined : undefined,
      reportedAt: Date.now()
    };
  };

  const handleSubmit = async () => {
    if (!summary.trim() || !actualBehavior.trim()) {
      return;
    }

    setSubmitStatus('loading');
    
    try {
      const report = buildReport();
      
      // Add to feedback system
      const userId = activeLearner?.id || 'anonymous';
      addFeedback(userId, {
        kind: 'bug',
        text: `Summary: ${report.summary}\n\nSteps: ${report.stepsToReproduce}\n\nExpected: ${report.expectedBehavior}\n\nActual: ${report.actualBehavior}`,
        meta: {
          appVersion: '1.0.0',
          userAgent: navigator.userAgent,
          locale: navigator.language,
          classActive: undefined,
          guardrailsOn: true,
          featureFlags: {},
          url: window.location.href,
          issueReport: report
        }
      });

      // Optional: POST to admin endpoint (would be implemented if needed)
      if (process.env.NODE_ENV === 'development') {
        try {
          await fetch('/api/admin/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'issue_report', data: report })
          });
        } catch (error) {
          console.warn('Failed to submit to admin endpoint:', error);
        }
      }

      setSubmitStatus('success');
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
      
    } catch (error) {
      console.error('Failed to submit issue report:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }
  };

  const resetForm = () => {
    setSummary('');
    setStepsToReproduce('');
    setExpectedBehavior('');
    setActualBehavior('');
    setIncludeSnapshot(prefilledSnapshot);
    setSnapshot(null);
    setSubmitStatus('idle');
    setCopySuccess(false);
  };

  const isFormValid = summary.trim().length > 0 && actualBehavior.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Report an Issue
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-issue-reporter"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary Field */}
          <div className="space-y-2">
            <label htmlFor="issue-summary" className="text-sm font-medium">
              Issue Summary *
            </label>
            <Input
              id="issue-summary"
              placeholder="Brief description of the problem..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              data-testid="input-issue-summary"
            />
          </div>

          {/* Steps to Reproduce */}
          <div className="space-y-2">
            <label htmlFor="steps-reproduce" className="text-sm font-medium">
              Steps to Reproduce
            </label>
            <Textarea
              id="steps-reproduce"
              placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              rows={3}
              data-testid="textarea-steps-reproduce"
            />
          </div>

          {/* Expected Behavior */}
          <div className="space-y-2">
            <label htmlFor="expected-behavior" className="text-sm font-medium">
              Expected Behavior
            </label>
            <Textarea
              id="expected-behavior"
              placeholder="What should happen..."
              value={expectedBehavior}
              onChange={(e) => setExpectedBehavior(e.target.value)}
              rows={2}
              data-testid="textarea-expected-behavior"
            />
          </div>

          {/* Actual Behavior */}
          <div className="space-y-2">
            <label htmlFor="actual-behavior" className="text-sm font-medium">
              Actual Behavior *
            </label>
            <Textarea
              id="actual-behavior"
              placeholder="What actually happens..."
              value={actualBehavior}
              onChange={(e) => setActualBehavior(e.target.value)}
              rows={2}
              data-testid="textarea-actual-behavior"
            />
          </div>

          {/* Environment Snapshot */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-snapshot"
                checked={includeSnapshot}
                onCheckedChange={(checked) => setIncludeSnapshot(checked as boolean)}
                data-testid="checkbox-include-snapshot"
              />
              <label htmlFor="include-snapshot" className="text-sm font-medium">
                Include Environment Snapshot
              </label>
              <Badge variant="secondary" className="text-xs">
                Recommended
              </Badge>
            </div>

            {includeSnapshot && (
              <div className="bg-muted/30 border rounded-lg p-3 space-y-2">
                {isLoadingSnapshot ? (
                  <div className="text-sm text-muted-foreground">
                    Building environment snapshot...
                  </div>
                ) : snapshot ? (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Environment snapshot ready ({(JSON.stringify(snapshot).length / 1024).toFixed(1)}KB)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopySnapshot}
                        className="flex items-center gap-1"
                        data-testid="button-copy-snapshot"
                      >
                        {copySuccess ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy JSON
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadSnapshot}
                        className="flex items-center gap-1"
                        data-testid="button-download-snapshot"
                      >
                        <Download className="h-3 w-3" />
                        Download .json
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSnapshot}
                    data-testid="button-load-snapshot"
                  >
                    Load Snapshot
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Submit Status */}
          {submitStatus === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Issue report submitted successfully. Thank you for helping improve LearnOz!
              </AlertDescription>
            </Alert>
          )}

          {submitStatus === 'error' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Failed to submit issue report. Please try copying the JSON and sharing it manually.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-report"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || submitStatus === 'loading'}
              className="flex items-center gap-1"
              data-testid="button-submit-report"
            >
              {submitStatus === 'loading' ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}