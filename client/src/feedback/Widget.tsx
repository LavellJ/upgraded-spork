import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Lightbulb, Bug, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  addFeedback, 
  submitFeedbackToCloud, 
  getCurrentMeta, 
  type FeedbackKind 
} from './model';
import { useRosterOptional } from '../roster/context';
import { getActiveClass } from '../roster/classes';
import { IssueReporter } from './IssueReporter';
import { isFeedbackWidgetEnabled, isIssueReporterEnabled, useFeatureFlagListener } from '../utils/featureFlags';

interface FeedbackWidgetProps {
  /** Only show in development mode */
  devMode?: boolean;
  /** Enable cloud submission */
  cloudEnabled?: boolean;
}

export function FeedbackWidget({ devMode = false, cloudEnabled = false }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showIssueReporter, setShowIssueReporter] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>('idea');
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [widgetEnabled, setWidgetEnabled] = useState(isFeedbackWidgetEnabled);
  const [issueReporterAccessible, setIssueReporterAccessible] = useState(isIssueReporterEnabled);

  const rosterContext = useRosterOptional();
  const activeLearner = rosterContext?.activeLearner;

  // Listen for feature flag changes
  useEffect(() => {
    const unsubscribeWidget = useFeatureFlagListener('feedback-widget', setWidgetEnabled);
    const unsubscribeIssues = useFeatureFlagListener('issue-reporter', setIssueReporterAccessible);
    
    return () => {
      unsubscribeWidget();
      unsubscribeIssues();
    };
  }, []);

  // Only show widget if dev mode AND feature flag enabled
  if (!devMode || !widgetEnabled) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim() || !activeLearner) return;

    setIsSubmitting(true);

    try {
      // Get current class context
      const activeClass = getActiveClass(activeLearner.id);
      const meta = getCurrentMeta(activeClass?.name);

      // Save locally first
      const feedback = addFeedback(activeLearner.id, {
        kind,
        text: text.trim(),
        email: email.trim() || undefined,
        meta,
      });

      // Optionally submit to cloud
      if (cloudEnabled) {
        await submitFeedbackToCloud(feedback);
      }

      // Show success and reset form
      setSubmitted(true);
      setText('');
      setEmail('');
      
      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypes = [
    { kind: 'idea' as const, icon: Lightbulb, label: 'Idea', color: 'text-yellow-600' },
    { kind: 'bug' as const, icon: Bug, label: 'Bug Report', color: 'text-red-600' },
    { kind: 'confusion' as const, icon: HelpCircle, label: 'Confused', color: 'text-blue-600' },
  ];

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
          data-testid="feedback-widget-open"
          title="Share feedback (DEV)"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-96 shadow-2xl border-2 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Share Feedback
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                DEV
              </span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              data-testid="feedback-widget-close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {submitted ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="font-semibold text-green-900 mb-2">Thanks for your feedback!</h3>
              <p className="text-sm text-green-700">
                Your input helps improve LearnOz for all students and teachers.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What type of feedback?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {feedbackTypes.map(({ kind: typeKind, icon: Icon, label, color }) => (
                    <button
                      key={typeKind}
                      type="button"
                      onClick={() => setKind(typeKind)}
                      className={`
                        p-3 rounded-lg border-2 text-center transition-all
                        ${kind === typeKind 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      data-testid={`feedback-type-${typeKind}`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
                      <div className="text-xs font-medium">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell us more
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Describe your idea, bug, or what's confusing..."
                  aria-label="Tell us more about your feedback"
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                  data-testid="feedback-text-input"
                />
              </div>

              {/* Optional Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="feedback-email-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only if you'd like a response from our team
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!text.trim() || isSubmitting}
                className="w-full flex items-center gap-2"
                data-testid="feedback-submit-button"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Feedback
                  </>
                )}
              </Button>
              
              {/* Issue Reporter Link */}
              {issueReporterAccessible && (
                <div className="pt-2 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsOpen(false);
                      setShowIssueReporter(true);
                    }}
                    className="w-full flex items-center gap-1 text-xs text-muted-foreground"
                    data-testid="button-open-issue-reporter"
                  >
                    <Bug className="w-3 h-3" />
                    Report Detailed Issue
                  </Button>
                </div>
              )}

              {/* Privacy Note */}
              <p className="text-xs text-gray-500 text-center">
                Feedback stored locally{cloudEnabled && ' and sent to admin team'}. 
                No sensitive data collected.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
      
      {/* Issue Reporter Modal */}
      <IssueReporter
        isOpen={showIssueReporter}
        onClose={() => setShowIssueReporter(false)}
        prefilledSnapshot={true}
      />
    </div>
  );
}