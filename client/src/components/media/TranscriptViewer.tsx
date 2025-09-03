import React from 'react';
import { X, Play } from 'lucide-react';
import type { Transcript } from '../../schema/lesson';

interface TranscriptEntry {
  type: 'timestamp' | 'text';
  startTime?: number;
  endTime?: number;
  text: string;
}

interface TranscriptViewerProps {
  transcript: Transcript;
  title?: string;
  onClose: () => void;
  onSeek?: (seconds: number) => void;
}

// Parse WebVTT-like timestamp format: "00:00:02.000 --> 00:00:05.000"
function parseTimestamp(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

// Parse transcript text into entries (either plain text or with timestamps)
function parseTranscriptContent(text: string): TranscriptEntry[] {
  const lines = text.split('\n').filter(line => line.trim());
  const entries: TranscriptEntry[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line contains WebVTT-like timestamp
    const timestampMatch = line.match(/^(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})$/);
    
    if (timestampMatch) {
      // This is a timestamp line, next line should be the text
      const startTime = parseTimestamp(timestampMatch[1].replace(',', '.'));
      const endTime = parseTimestamp(timestampMatch[2].replace(',', '.'));
      const textLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      
      if (textLine) {
        entries.push({
          type: 'timestamp',
          startTime,
          endTime,
          text: textLine
        });
        i++; // Skip the text line since we processed it
      }
    } else if (!line.match(/^\d+$/)) {
      // Not a sequence number, treat as regular text
      entries.push({
        type: 'text',
        text: line
      });
    }
  }
  
  // If no timestamp entries found, treat as paragraphs
  if (!entries.some(e => e.type === 'timestamp')) {
    return text.split('\n\n').filter(p => p.trim()).map(paragraph => ({
      type: 'text',
      text: paragraph.trim()
    }));
  }
  
  return entries;
}

export function TranscriptViewer({ transcript, title = 'Video Transcript', onClose, onSeek }: TranscriptViewerProps) {
  const [transcriptText, setTranscriptText] = React.useState<string>('');
  const [transcriptEntries, setTranscriptEntries] = React.useState<TranscriptEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (transcript.text) {
      setTranscriptText(transcript.text);
      setTranscriptEntries(parseTranscriptContent(transcript.text));
    } else if (transcript.src) {
      setLoading(true);
      fetch(transcript.src)
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch transcript');
          return response.text();
        })
        .then(text => {
          setTranscriptText(text);
          setTranscriptEntries(parseTranscriptContent(text));
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
        <div className="flex-1 overflow-y-auto p-6 font-readable">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 text-scalable">Loading transcript...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-scalable">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {transcriptEntries.length > 0 && !loading && !error && (
            <div 
              className="max-w-[65ch] mx-auto max-line-length"
              role="document"
              aria-label="Video transcript content"
            >
              {transcriptEntries.some(e => e.type === 'timestamp') ? (
                // Render as timestamped entries
                <ul className="space-y-4">
                  {transcriptEntries.map((entry, index) => (
                    <li key={index} className="leading-7">
                      {entry.type === 'timestamp' && entry.startTime !== undefined ? (
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <span className="text-gray-700 text-scalable leading-8">
                              {entry.text}
                            </span>
                          </div>
                          {onSeek && (
                            <button
                              onClick={() => onSeek(entry.startTime!)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                              aria-label={`Jump to ${Math.floor(entry.startTime! / 60)}:${String(Math.floor(entry.startTime! % 60)).padStart(2, '0')}`}
                            >
                              <Play className="w-3 h-3" />
                              Jump
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-700 text-scalable leading-8">
                          {entry.text}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                // Render as plain text paragraphs
                <div className="space-y-4">
                  {transcriptEntries.map((entry, index) => (
                    <p key={index} className="text-gray-700 text-scalable leading-8">
                      {entry.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {transcriptEntries.length === 0 && !loading && !error && (
            <div className="text-center py-8 text-gray-500">
              No transcript available for this video.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}