/**
 * Tests for MediaPlayer component
 * Validates caption track error handling and fallback UI
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MediaPlayer } from './MediaPlayer';

// Mock track error events
const mockTrackErrorEvent = () => {
  const event = new Event('error') as any;
  const mockTarget = {
    style: { display: '' },
  };
  Object.defineProperty(event, 'target', { value: mockTarget });
  return { event, mockTarget };
};

describe('MediaPlayer', () => {
  const defaultProps = {
    src: 'test-video.mp4',
    type: 'video/mp4',
  };

  it('should render video element with correct attributes', () => {
    render(<MediaPlayer {...defaultProps} />);
    
    const video = screen.getByRole('application', { name: 'Video player' });
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAttribute('preload', 'metadata');
  });

  it('should render caption tracks when provided', () => {
    const captions = [
      {
        src: 'captions-en.vtt',
        srclang: 'en',
        label: 'English',
        default: true,
      },
      {
        src: 'captions-es.vtt', 
        srclang: 'es',
        label: 'Spanish',
      },
    ];

    const { container } = render(
      <MediaPlayer {...defaultProps} captions={captions} />
    );

    const tracks = container.querySelectorAll('track');
    expect(tracks).toHaveLength(2);
    
    expect(tracks[0]).toHaveAttribute('src', 'captions-en.vtt');
    expect(tracks[0]).toHaveAttribute('srcLang', 'en');
    expect(tracks[0]).toHaveAttribute('label', 'English');
    expect(tracks[0]).toHaveAttribute('default');

    expect(tracks[1]).toHaveAttribute('src', 'captions-es.vtt');
    expect(tracks[1]).toHaveAttribute('srcLang', 'es');
    expect(tracks[1]).toHaveAttribute('label', 'Spanish');
    expect(tracks[1]).not.toHaveAttribute('default');
  });

  it('should use srclang as fallback label when label not provided', () => {
    const captions = [
      {
        src: 'captions-fr.vtt',
        srclang: 'fr',
        // label not provided
      },
    ];

    const { container } = render(
      <MediaPlayer {...defaultProps} captions={captions} />
    );

    const track = container.querySelector('track');
    expect(track).toHaveAttribute('label', 'fr');
  });

  it('should hide failed tracks and show unavailable message', async () => {
    const captions = [
      {
        src: 'missing-captions.vtt',
        srclang: 'en',
        label: 'English',
      },
    ];

    const { container, rerender } = render(
      <MediaPlayer {...defaultProps} captions={captions} />
    );

    // Simulate track error
    const track = container.querySelector('track');
    expect(track).toBeInTheDocument();

    // Manually trigger the error handler with a mock event
    const { event, mockTarget } = mockTrackErrorEvent();
    
    // Get the onError handler and call it
    const trackElement = track as HTMLTrackElement;
    if (trackElement.onerror) {
      trackElement.onerror.call(trackElement, event);
    }

    // Verify track is hidden
    expect(mockTarget.style.display).toBe('none');

    // Force re-render to trigger the useEffect that shows the unavailable message
    rerender(<MediaPlayer {...defaultProps} captions={captions} />);

    // Wait for the "captions unavailable" message to appear
    await screen.findByText('Captions unavailable for this video');
    
    const warningMessage = screen.getByText('Captions unavailable for this video');
    expect(warningMessage).toBeInTheDocument();
    expect(warningMessage.parentElement).toHaveClass('text-orange-600');
  });

  it('should not show unavailable message when tracks load successfully', () => {
    const captions = [
      {
        src: 'working-captions.vtt',
        srclang: 'en', 
        label: 'English',
      },
    ];

    render(<MediaPlayer {...defaultProps} captions={captions} />);

    // Should not show unavailable message initially
    expect(screen.queryByText('Captions unavailable for this video')).not.toBeInTheDocument();
  });

  it('should only show unavailable message when ALL tracks fail', async () => {
    const captions = [
      {
        src: 'working-captions.vtt',
        srclang: 'en',
        label: 'English', 
      },
      {
        src: 'broken-captions.vtt',
        srclang: 'es',
        label: 'Spanish',
      },
    ];

    const { container } = render(
      <MediaPlayer {...defaultProps} captions={captions} />
    );

    const tracks = container.querySelectorAll('track');
    
    // Simulate only one track failing (not all)
    const { event, mockTarget } = mockTrackErrorEvent();
    const secondTrack = tracks[1] as HTMLTrackElement;
    
    if (secondTrack.onerror) {
      secondTrack.onerror.call(secondTrack, event);
    }

    // Should NOT show unavailable message since not all tracks failed
    expect(screen.queryByText('Captions unavailable for this video')).not.toBeInTheDocument();
  });

  it('should show transcript button when onShowTranscript provided', () => {
    const mockShowTranscript = jest.fn();
    
    render(
      <MediaPlayer {...defaultProps} onShowTranscript={mockShowTranscript} />
    );

    const transcriptButton = screen.getByRole('button', { name: 'Open video transcript' });
    expect(transcriptButton).toBeInTheDocument();
    expect(transcriptButton).toHaveTextContent('View transcript');
  });

  it('should call onShowTranscript when transcript button clicked', () => {
    const mockShowTranscript = jest.fn();
    
    render(
      <MediaPlayer {...defaultProps} onShowTranscript={mockShowTranscript} />
    );

    const transcriptButton = screen.getByRole('button', { name: 'Open video transcript' });
    transcriptButton.click();

    expect(mockShowTranscript).toHaveBeenCalledTimes(1);
  });

  it('should show both transcript button and unavailable message when applicable', async () => {
    const mockShowTranscript = jest.fn();
    const captions = [
      {
        src: 'broken-captions.vtt',
        srclang: 'en',
        label: 'English',
      },
    ];

    const { container, rerender } = render(
      <MediaPlayer 
        {...defaultProps} 
        captions={captions}
        onShowTranscript={mockShowTranscript} 
      />
    );

    // Simulate track error
    const track = container.querySelector('track');
    const { event } = mockTrackErrorEvent();
    const trackElement = track as HTMLTrackElement;
    
    if (trackElement.onerror) {
      trackElement.onerror.call(trackElement, event);
    }

    // Force re-render
    rerender(
      <MediaPlayer 
        {...defaultProps} 
        captions={captions}
        onShowTranscript={mockShowTranscript} 
      />
    );

    // Both elements should be present
    expect(screen.getByRole('button', { name: 'Open video transcript' })).toBeInTheDocument();
    await screen.findByText('Captions unavailable for this video');
  });

  it('should log track errors in development mode', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Set NODE_ENV to development
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const captions = [
      {
        src: 'test-captions.vtt',
        srclang: 'en',
        label: 'English',
      },
    ];

    const { container } = render(
      <MediaPlayer {...defaultProps} captions={captions} />
    );

    const track = container.querySelector('track');
    const { event } = mockTrackErrorEvent();
    const trackElement = track as HTMLTrackElement;
    
    if (trackElement.onerror) {
      trackElement.onerror.call(trackElement, event);
    }

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load caption track 0: test-captions.vtt',
      event
    );

    // Restore original environment and clean up
    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });

  it('should handle video without captions gracefully', () => {
    render(<MediaPlayer {...defaultProps} />);
    
    const video = screen.getByRole('application', { name: 'Video player' });
    expect(video).toBeInTheDocument();
    
    // Should not show any caption-related messages
    expect(screen.queryByText('Captions unavailable for this video')).not.toBeInTheDocument();
  });

  it('should forward ref correctly', () => {
    const mockRef = React.createRef<HTMLVideoElement>();
    
    render(<MediaPlayer {...defaultProps} ref={mockRef} />);
    
    expect(mockRef.current).toBeInstanceOf(HTMLVideoElement);
    expect(mockRef.current?.tagName).toBe('VIDEO');
  });
});