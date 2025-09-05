import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Volume2, VolumeX, FileText } from 'lucide-react';
import type { TeachBlockActivity } from '../../authoring/heroSchema';

interface TeachBlockProps {
  activity: TeachBlockActivity;
  onComplete: () => void;
  onEvent?: (eventType: string, data?: any) => void;
}

/**
 * TeachBlock: Video instruction component with transcript and accessibility features
 * - Full video player controls with captions
 * - Toggle transcript viewer
 * - Keyboard navigation support
 * - Reduced motion respect
 * - Screen reader friendly
 */
export function TeachBlock({ activity, onComplete, onEvent }: TeachBlockProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Respect user's motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      onEvent?.('video_loaded', { duration: video.duration });
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setIsCompleted(true);
      onEvent?.('video_completed', { 
        duration: video.duration,
        watchTime: video.currentTime 
      });
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (!hasStarted) {
        setHasStarted(true);
        onEvent?.('video_started');
      }
      onEvent?.('video_play', { currentTime: video.currentTime });
    };

    const handlePause = () => {
      setIsPlaying(false);
      onEvent?.('video_pause', { currentTime: video.currentTime });
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [hasStarted, onEvent]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleRestart = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    setCurrentTime(0);
    onEvent?.('video_restarted');
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
    onEvent?.('video_mute_toggle', { muted: video.muted });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const seekTime = parseFloat(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
    onEvent?.('video_seek', { seekTime });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTranscriptToggle = () => {
    setShowTranscript(!showTranscript);
    onEvent?.('transcript_toggle', { visible: !showTranscript });
  };

  const handleContinue = () => {
    onEvent?.('teach_block_completed');
    onComplete();
  };

  // Get current transcript text based on timestamp
  const getCurrentTranscriptText = () => {
    if (!activity.transcript?.timestamps) return activity.transcript?.text['en-AU'] || '';
    
    const currentTimestamp = activity.transcript.timestamps
      .reverse()
      .find(ts => currentTime >= ts.time);
    
    return currentTimestamp?.text || '';
  };

  return (
    <div 
      className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg"
      data-testid="teach-block-container"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 
          className="text-2xl font-bold text-gray-900 mb-2"
          data-testid="teach-block-title"
        >
          {activity.title['en-AU']}
        </h2>
        {activity.description && (
          <p className="text-gray-600" data-testid="teach-block-description">
            {activity.description['en-AU']}
          </p>
        )}
      </div>

      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden mb-4">
        <video
          ref={videoRef}
          className="w-full aspect-video"
          src={activity.video.src}
          poster={activity.video.poster}
          preload="metadata"
          crossOrigin="anonymous"
          aria-label={activity.ariaLabel || `Video: ${activity.title['en-AU']}`}
          data-testid="teach-block-video"
        >
          {activity.video.captions?.map((caption, index) => (
            <track
              key={index}
              kind="captions"
              src={caption.src}
              srcLang={caption.srclang}
              label={caption.label}
              default={caption.default || index === 0}
            />
          ))}
          Your browser does not support the video element.
        </video>

        {/* Video Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-3 text-white">
            {/* Play/Pause Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPause}
              className="text-white hover:text-white hover:bg-white/20"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              data-testid="video-play-pause-button"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>

            {/* Restart Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestart}
              className="text-white hover:text-white hover:bg-white/20"
              aria-label="Restart video"
              data-testid="video-restart-button"
            >
              <RotateCcw size={16} />
            </Button>

            {/* Progress Bar */}
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm font-mono" data-testid="video-current-time">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-2 bg-white/30 rounded-full appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                          [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                aria-label="Video progress"
                data-testid="video-progress-slider"
              />
              <span className="text-sm font-mono" data-testid="video-duration">
                {formatTime(duration)}
              </span>
            </div>

            {/* Mute Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMuteToggle}
              className="text-white hover:text-white hover:bg-white/20"
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              data-testid="video-mute-button"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Transcript Toggle */}
      {activity.transcript && (
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={handleTranscriptToggle}
            className="mb-3"
            data-testid="transcript-toggle-button"
          >
            <FileText size={16} className="mr-2" />
            {showTranscript ? 'Hide' : 'Show'} Transcript
          </Button>

          {showTranscript && (
            <div 
              className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto"
              data-testid="transcript-viewer"
              role="region"
              aria-label="Video transcript"
            >
              {activity.transcript.timestamps ? (
                <p className="text-gray-800 leading-relaxed">
                  {getCurrentTranscriptText()}
                </p>
              ) : (
                <p className="text-gray-800 leading-relaxed">
                  {activity.transcript.text['en-AU']}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!hasStarted}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          data-testid="teach-block-continue-button"
        >
          {isCompleted ? 'Continue' : hasStarted ? 'Continue' : 'Watch video first'}
        </Button>
      </div>
    </div>
  );
}