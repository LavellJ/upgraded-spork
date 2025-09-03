import React from 'react';
import { X } from 'lucide-react';
import type { Transcript } from '../../schema/lesson';

interface TranscriptViewerProps {
  transcript: Transcript;
  title?: string;
  onClose: () => void;
}

export function TranscriptViewer({ transcript, title = 'Video Transcript', onClose }: TranscriptViewerProps) {
  const [transcriptText, setTranscriptText] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (transcript.text) {
      setTranscriptText(transcript.text);
    } else if (transcript.src) {
      setLoading(true);
      fetch(transcript.src)
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch transcript');
          return response.text();
        })
        .then(text => {
          setTranscriptText(text);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [transcript]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close transcript"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading transcript...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {transcriptText && !loading && !error && (
            <div className="prose prose-sm max-w-none">
              <div 
                className="whitespace-pre-wrap text-gray-700 leading-relaxed"
                role="document"
                aria-label="Video transcript content"
              >
                {transcriptText}
              </div>
            </div>
          )}

          {!transcriptText && !loading && !error && (
            <div className="text-center py-8 text-gray-500">
              No transcript available for this video.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}