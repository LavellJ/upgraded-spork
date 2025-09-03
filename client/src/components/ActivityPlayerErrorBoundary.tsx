import React from 'react';
import { RefreshCw, AlertTriangle, Play } from 'lucide-react';
import { Button } from './ui/button';

interface ActivityPlayerErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ActivityPlayerErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  activityTitle?: string;
}

/**
 * ActivityPlayerErrorBoundary - Specialized error boundary for video/activity players
 * Provides friendly restart prompts for media playback issues
 */
export class ActivityPlayerErrorBoundary extends React.Component<
  ActivityPlayerErrorBoundaryProps, 
  ActivityPlayerErrorBoundaryState
> {
  constructor(props: ActivityPlayerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ActivityPlayerErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ActivityPlayer error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Track media errors for debugging
    if (error.message.includes('media') || error.message.includes('video')) {
      console.warn('Media playback error detected:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      const activityTitle = this.props.activityTitle || 'this activity';
      
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          
          <h3 className="text-lg font-medium text-amber-800 mb-2">
            Oops! {activityTitle} won't load
          </h3>
          
          <p className="text-sm text-amber-700 text-center mb-6 max-w-md">
            Sometimes videos need a moment to catch up. Let's try starting {activityTitle} again.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={this.handleRetry}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
              data-testid="activity-player-retry"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-100"
              data-testid="activity-player-refresh"
            >
              <Play className="w-4 h-4" />
              Refresh Page
            </Button>
          </div>
          
          {/* Help text for teachers */}
          <div className="mt-6 p-3 bg-white rounded-lg border border-amber-200 text-xs text-amber-600">
            <p className="font-medium mb-1">👨‍🏫 For teachers:</p>
            <p>Check your internet connection and try refreshing. If this keeps happening, the video might need to be re-uploaded.</p>
          </div>
          
          {/* Dev error details */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 w-full max-w-md">
              <summary className="text-xs text-amber-600 cursor-pointer hover:text-amber-800">
                🐛 Error details (dev only)
              </summary>
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                <div className="font-mono text-red-800 mb-2">
                  {this.state.error.name}: {this.state.error.message}
                </div>
                <pre className="text-red-600 whitespace-pre-wrap text-xs overflow-auto max-h-32">
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <div className="mt-2 pt-2 border-t border-red-300">
                    <div className="text-red-700 mb-1">Component Stack:</div>
                    <pre className="text-red-600 whitespace-pre-wrap text-xs overflow-auto max-h-20">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}