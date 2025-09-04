import React, { forwardRef, useState, useRef, useEffect } from 'react';

interface CaptionTrack {
  src: string;
  srclang: string;
  label?: string;
  default?: boolean;
}

interface MediaPlayerProps {
  src: string;
  type?: string;
  captions?: CaptionTrack[];
  onShowTranscript?: () => void;
}

export const MediaPlayer = forwardRef<HTMLVideoElement, MediaPlayerProps>(({ 
  src, 
  type = 'video/mp4', 
  captions, 
  onShowTranscript 
}, ref) => {
  const [failedTracks, setFailedTracks] = useState<Set<number>>(new Set());
  const [showCaptionsUnavailable, setShowCaptionsUnavailable] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if all caption tracks failed to load
  useEffect(() => {
    if (captions && failedTracks.size === captions.length && captions.length > 0) {
      setShowCaptionsUnavailable(true);
    }
  }, [failedTracks, captions]);

  const handleTrackError = (index: number) => (e: React.SyntheticEvent<HTMLTrackElement>) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Failed to load caption track ${index}: ${captions?.[index]?.src}`, e);
    }
    
    // Add to failed tracks set
    setFailedTracks(prev => new Set(prev).add(index));
    
    // Hide the track from the menu if it fails to load
    const trackElement = e.target as HTMLTrackElement;
    if (trackElement) {
      trackElement.style.display = 'none';
    }
  };

  return (
    <figure className="w-full">
      <video
        ref={ref || videoRef}
        controls
        preload="metadata"
        className="w-full rounded-2xl bg-white shadow-sm"
        aria-label="Video player"
      >
        <source src={src} type={type} />
        {captions?.map((track, index) => (
          <track
            key={index}
            kind="subtitles"
            src={track.src}
            srcLang={track.srclang}
            label={track.label ?? track.srclang}
            default={!!track.default}
            onError={handleTrackError(index)}
          />
        ))}
        Your browser does not support the video element.
      </video>
      {(onShowTranscript || showCaptionsUnavailable) && (
        <figcaption className="mt-2 text-sm text-gray-600 space-y-1">
          {onShowTranscript && (
            <button 
              type="button" 
              className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1" 
              onClick={onShowTranscript}
              aria-label="Open video transcript"
            >
              View transcript
            </button>
          )}
          {showCaptionsUnavailable && (
            <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs">
              <span>⚠️</span>
              <span>Captions unavailable for this video</span>
            </div>
          )}
        </figcaption>
      )}
    </figure>
  );
});