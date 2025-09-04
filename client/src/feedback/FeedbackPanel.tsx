import React, { useState } from 'react';
import { Download, Trash2, MessageCircle, Clock, User, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  listFeedback, 
  clearFeedback, 
  exportFeedbackCSV, 
  type Feedback, 
  type FeedbackKind 
} from './model';
import { useRosterOptional } from '../roster/context';

export function FeedbackPanel() {
  const rosterContext = useRosterOptional();
  const activeLearner = rosterContext?.activeLearner;
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  // Load feedback on mount and when learner changes
  React.useEffect(() => {
    if (activeLearner) {
      const loadedFeedback = listFeedback(activeLearner.id);
      setFeedback(loadedFeedback);
    }
  }, [activeLearner]);

  const handleExportCSV = () => {
    if (!activeLearner) return;

    const csvData = exportFeedbackCSV(activeLearner.id);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const handleClearFeedback = () => {
    if (!activeLearner) return;
    
    const confirmed = confirm('Are you sure you want to clear all feedback? This action cannot be undone.');
    if (confirmed) {
      clearFeedback(activeLearner.id);
      setFeedback([]);
    }
  };

  const getFeedbackIcon = (kind: FeedbackKind) => {
    switch (kind) {
      case 'idea': return '💡';
      case 'bug': return '🐛';
      case 'confusion': return '❓';
      default: return '💬';
    }
  };

  const getFeedbackColor = (kind: FeedbackKind) => {
    switch (kind) {
      case 'idea': return 'bg-yellow-100 text-yellow-800';
      case 'bug': return 'bg-red-100 text-red-800';
      case 'confusion': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!activeLearner) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Please select a learner to view feedback.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Feedback Management
            <Badge variant="outline" className="text-xs">DEV</Badge>
          </h2>
          <p className="text-sm text-gray-600">
            View and export feedback collected from the in-app widget
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            disabled={feedback.length === 0}
            data-testid="export-feedback-csv"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          
          <Button
            onClick={handleClearFeedback}
            variant="outline"
            size="sm"
            disabled={feedback.length === 0}
            data-testid="clear-feedback"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Privacy Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">How we use feedback (pilot)</h3>
              <p className="text-sm text-blue-800">
                Feedback is stored locally and optionally sent to our development team for product improvement. 
                No personally identifiable information is collected beyond optional email addresses. 
                All feedback is used solely for improving the LearnOz platform.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      {feedback.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h3>
            <p className="text-gray-600 mb-4">
              Feedback will appear here when users submit it through the in-app widget.
            </p>
            <Badge variant="outline" className="text-xs">
              Widget only shows in development mode
            </Badge>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            {feedback.length} feedback item{feedback.length !== 1 ? 's' : ''} collected
          </div>
          
          {feedback.map((item) => (
            <Card key={item.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFeedbackIcon(item.kind)}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getFeedbackColor(item.kind)} variant="secondary">
                          {item.kind.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.at).toLocaleString()}
                        </span>
                      </div>
                      {item.email && (
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.email}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-right">
                    ID: {item.id.split('-')[1]}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-gray-900 whitespace-pre-wrap">{item.text}</p>
                </div>
                
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <strong>Class:</strong> {item.meta.classActive || 'None'}
                  </div>
                  <div>
                    <strong>Browser:</strong> {item.meta.userAgent.split(' ')[0]}
                  </div>
                  <div>
                    <strong>Locale:</strong> {item.meta.locale}
                  </div>
                  <div>
                    <strong>Version:</strong> {item.meta.appVersion}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}