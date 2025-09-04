import React, { useState, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Calendar, Mail, Eye, Printer, Users, Send, ArrowLeft } from 'lucide-react';
import { useRosterOptional } from '../roster/context';
import { getActiveClass } from '../roster/classes';

interface ParentEmailProps {
  onClose?: () => void;
}

interface LearnerSelection {
  id: string;
  name: string;
  selected: boolean;
}

interface EmailPreview {
  learnerName: string;
  subject: string;
  html: string;
  text: string;
}

export function ParentEmail({ onClose }: ParentEmailProps) {
  const rosterContext = useRosterOptional();
  const [parentEmail, setParentEmail] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(() => {
    // Default to current week's Monday
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday.toISOString().split('T')[0];
  });
  
  const [learners, setLearners] = useState<LearnerSelection[]>([]);
  const [previewData, setPreviewData] = useState<EmailPreview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Initialize learners from roster
  React.useEffect(() => {
    if (rosterContext?.roster?.learners) {
      const learnerList = rosterContext.roster.learners.map(learner => ({
        id: learner.id,
        name: learner.name,
        selected: false
      }));
      setLearners(learnerList);
    }
  }, [rosterContext?.roster?.learners]);

  // Helper functions
  const selectedLearners = useMemo(() => 
    learners.filter(learner => learner.selected),
    [learners]
  );

  const formatWeekRange = (weekStartISO: string) => {
    const start = new Date(weekStartISO);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const toggleLearnerSelection = (learnerId: string) => {
    setLearners(prev => prev.map(learner => 
      learner.id === learnerId 
        ? { ...learner, selected: !learner.selected }
        : learner
    ));
  };

  const toggleSelectAll = () => {
    const allSelected = learners.every(learner => learner.selected);
    setLearners(prev => prev.map(learner => ({ 
      ...learner, 
      selected: !allSelected 
    })));
  };

  const generatePreview = async () => {
    if (selectedLearners.length === 0) {
      alert('Please select at least one learner');
      return;
    }

    if (!parentEmail.trim()) {
      alert('Please enter parent email address');
      return;
    }

    setIsGenerating(true);
    try {
      // Use the first selected learner for preview
      const firstLearner = selectedLearners[0];
      
      const response = await fetch('/api/report/parent-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}` // Assuming token storage
        },
        body: JSON.stringify({
          email: parentEmail,
          learnerId: firstLearner.id,
          weekStartISO: selectedWeek
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate preview');
      }

      if (result.preview) {
        setPreviewData({
          learnerName: firstLearner.name,
          subject: result.preview.subject,
          html: result.preview.html,
          text: result.preview.text
        });
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      alert(`Error generating preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmails = async () => {
    if (selectedLearners.length === 0) {
      alert('Please select at least one learner');
      return;
    }

    if (!parentEmail.trim()) {
      alert('Please enter parent email address');
      return;
    }

    const confirmMessage = `Send parent summaries for ${selectedLearners.length} learner(s) to ${parentEmail}?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsSending(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Send emails sequentially to avoid overwhelming the server
      for (const learner of selectedLearners) {
        try {
          const response = await fetch('/api/report/parent-summary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
              email: parentEmail,
              learnerId: learner.id,
              weekStartISO: selectedWeek
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to send email for ${learner.name}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error sending email for ${learner.name}:`, error);
        }

        // Small delay between sends to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (successCount > 0) {
        alert(`Successfully sent ${successCount} parent summary email(s)${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      } else {
        alert('Failed to send parent summary emails. Please try again.');
      }

    } catch (error) {
      console.error('Error sending emails:', error);
      alert('Failed to send parent summary emails. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const printPreview = () => {
    if (!previewData) {
      alert('Please generate a preview first');
      return;
    }

    // Create a new window with the HTML content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(previewData.html);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  if (!rosterContext?.roster?.learners || learners.length === 0) {
    return (
      <div className="p-6" data-testid="parent-email">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No learners found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add learners to your roster to send parent summary emails.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="parent-email">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parent Summary Emails</h1>
          <p className="text-sm text-gray-500 mt-1">
            Send weekly learning summaries to parents and guardians
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Week Selection */}
          <Card data-testid="week-selection">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Select Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="week-picker" className="block text-sm font-medium text-gray-700 mb-2">
                  Week Starting (Monday)
                </label>
                <Input
                  id="week-picker"
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  data-testid="week-picker"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Week range: {formatWeekRange(selectedWeek)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parent Email */}
          <Card data-testid="parent-email-input">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Parent Email Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="email"
                placeholder="parent@example.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                data-testid="email-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                The same email will be sent for all selected learners
              </p>
            </CardContent>
          </Card>

          {/* Learner Selection */}
          <Card data-testid="learner-selection">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Select Learners ({selectedLearners.length} selected)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all-learners"
                  checked={learners.length > 0 && learners.every(learner => learner.selected)}
                  onCheckedChange={toggleSelectAll}
                  data-testid="select-all-learners"
                />
                <label htmlFor="select-all-learners" className="text-sm font-medium">
                  Select All Learners
                </label>
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {learners.map((learner) => (
                  <div key={learner.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`learner-${learner.id}`}
                      checked={learner.selected}
                      onCheckedChange={() => toggleLearnerSelection(learner.id)}
                      data-testid={`select-learner-${learner.id}`}
                    />
                    <label htmlFor={`learner-${learner.id}`} className="text-sm">
                      {learner.name}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card data-testid="actions">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Button
                  onClick={generatePreview}
                  disabled={isGenerating || selectedLearners.length === 0}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                  data-testid="generate-preview"
                >
                  <Eye className="w-4 h-4" />
                  {isGenerating ? 'Generating Preview...' : 'Generate Preview'}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={sendEmails}
                    disabled={isSending || selectedLearners.length === 0 || !parentEmail.trim()}
                    className="flex items-center gap-2"
                    data-testid="send-emails"
                  >
                    <Send className="w-4 h-4" />
                    {isSending ? 'Sending...' : 'Send Emails'}
                  </Button>

                  <Button
                    onClick={printPreview}
                    disabled={!previewData}
                    variant="outline"
                    className="flex items-center gap-2"
                    data-testid="print-preview"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card data-testid="preview-panel">
            <CardHeader>
              <CardTitle className="text-lg">Email Preview</CardTitle>
              {previewData && (
                <p className="text-sm text-gray-600">
                  Preview for {previewData.learnerName}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {previewData ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Subject:</label>
                    <p className="text-sm mt-1 p-2 bg-gray-50 rounded">{previewData.subject}</p>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
                    <div 
                      dangerouslySetInnerHTML={{ __html: previewData.html }}
                      className="email-preview print-friendly"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Generate a preview to see how the email will look</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Privacy Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900">Privacy & Consent</h4>
              <p className="text-sm text-blue-800 mt-1">
                Only send emails to parents who have consented to receive learning summaries. 
                All parent summary sends are logged for audit purposes. Contact support if you have 
                questions about privacy settings or data handling.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}