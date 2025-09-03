import React from 'react';

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

export function MediaPlayer({ 
  src, 
  type = 'video/mp4', 
  captions, 
  onShowTranscript 
}: MediaPlayerProps) {
  return (
    <figure className="w-full">
      <video
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
          />
        ))}
        Your browser does not support the video element.
      </video>
      {onShowTranscript && (
        <figcaption className="mt-2 text-sm text-gray-600">
          <button 
            type="button" 
            className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1" 
            onClick={onShowTranscript}
            aria-label="Open video transcript"
          >
            View transcript
          </button>
        </figcaption>
      )}
    </figure>
  );
}