/**
 * Tests for media accessibility components
 * Covers MediaPlayer track elements and TranscriptViewer VTT parsing
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MediaPlayer } from '../src/components/media/MediaPlayer';
import { TranscriptViewer } from '../src/components/media/TranscriptViewer';

describe('Media Accessibility Components', () => {
  describe('MediaPlayer', () => {
    it('renders video element with track elements for captions', () => {
      const captions = [
        {
          src: '/captions/lesson-001-en.vtt',
          srclang: 'en',
          label: 'English',
          default: true
        },
        {
          src: '/captions/lesson-001-es.vtt',
          srclang: 'es', 
          label: 'Spanish'
        }
      ];

      render(
        <MediaPlayer
          src="/videos/lesson-001.mp4"
          captions={captions}
        />
      );

      // Check video element exists
      const video = screen.getByLabelText('Video player');
      expect(video).toBeInTheDocument();

      // Check track elements are rendered
      const trackElements = video.querySelectorAll('track');
      expect(trackElements).toHaveLength(2);

      // Verify track attributes
      expect(trackElements[0]).toHaveAttribute('src', '/captions/lesson-001-en.vtt');
      expect(trackElements[0]).toHaveAttribute('srclang', 'en');
      expect(trackElements[0]).toHaveAttribute('label', 'English');
      expect(trackElements[0]).toHaveAttribute('default');

      expect(trackElements[1]).toHaveAttribute('src', '/captions/lesson-001-es.vtt');
      expect(trackElements[1]).toHaveAttribute('srclang', 'es');
      expect(trackElements[1]).toHaveAttribute('label', 'Spanish');
      expect(trackElements[1]).not.toHaveAttribute('default');
    });

    it('renders transcript button when onShowTranscript provided', () => {
      const onShowTranscript = vi.fn();

      render(
        <MediaPlayer
          src="/videos/lesson-001.mp4"
          onShowTranscript={onShowTranscript}
        />
      );

      const transcriptButton = screen.getByRole('button', { name: 'Open video transcript' });
      expect(transcriptButton).toBeInTheDocument();

      fireEvent.click(transcriptButton);
      expect(onShowTranscript).toHaveBeenCalledOnce();
    });

    it('does not render transcript button when onShowTranscript not provided', () => {
      render(
        <MediaPlayer
          src="/videos/lesson-001.mp4"
        />
      );

      const transcriptButton = screen.queryByRole('button', { name: 'Open video transcript' });
      expect(transcriptButton).not.toBeInTheDocument();
    });

    it('handles track loading errors gracefully in development', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const captions = [
        {
          src: '/captions/nonexistent.vtt',
          srclang: 'en',
          label: 'English'
        }
      ];

      render(
        <MediaPlayer
          src="/videos/lesson-001.mp4"
          captions={captions}
        />
      );

      const video = screen.getByLabelText('Video player');
      const trackElement = video.querySelector('track') as HTMLTrackElement;

      // Simulate track loading error with proper error event
      const errorEvent = new Event('error');
      Object.defineProperty(errorEvent, 'target', {
        value: trackElement,
        configurable: true
      });
      
      fireEvent(trackElement, errorEvent);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load caption track'),
        expect.any(Event)
      );

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('TranscriptViewer', () => {
    it('renders transcript content with inline text', () => {
      const transcript = {
        text: 'This is a sample transcript for testing purposes.'
      };

      const onClose = vi.fn();

      render(
        <TranscriptViewer
          transcript={transcript}
          title="Test Transcript"
          onClose={onClose}
        />
      );

      expect(screen.getByText('Test Transcript')).toBeInTheDocument();
      expect(screen.getByText('This is a sample transcript for testing purposes.')).toBeInTheDocument();

      // Test close button
      const closeButton = screen.getByRole('button', { name: 'Close transcript' });
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('parses VTT timestamps and renders Jump buttons', async () => {
      const vttContent = `WEBVTT

1
00:00:02.000 --> 00:00:05.000
Welcome to our lesson today.

2
00:00:05.500 --> 00:00:08.000
We'll be learning about addition.

3
00:00:10.000 --> 00:00:12.500
Let's start with simple examples.`;

      const transcript = { text: vttContent };
      const onSeek = vi.fn();

      render(
        <TranscriptViewer
          transcript={transcript}
          onClose={vi.fn()}
          onSeek={onSeek}
        />
      );

      // Check that Jump buttons are rendered for timestamped entries
      const jumpButtons = screen.getAllByText('Jump');
      expect(jumpButtons).toHaveLength(3);

      // Test transcript content is displayed
      expect(screen.getByText('Welcome to our lesson today.')).toBeInTheDocument();
      expect(screen.getByText('We\'ll be learning about addition.')).toBeInTheDocument();
      expect(screen.getByText('Let\'s start with simple examples.')).toBeInTheDocument();

      // Test timestamp display (they appear within Jump button labels)
      expect(screen.getByLabelText('Jump to 0:02')).toBeInTheDocument();
      expect(screen.getByLabelText('Jump to 0:05')).toBeInTheDocument();
      expect(screen.getByLabelText('Jump to 0:10')).toBeInTheDocument();

      // Test Jump button functionality
      fireEvent.click(jumpButtons[0]);
      expect(onSeek).toHaveBeenCalledWith(2); // 2 seconds

      fireEvent.click(jumpButtons[1]);
      expect(onSeek).toHaveBeenCalledWith(5.5); // 5.5 seconds

      fireEvent.click(jumpButtons[2]);
      expect(onSeek).toHaveBeenCalledWith(10); // 10 seconds
    });

    it('handles SRT format timestamps correctly', () => {
      const srtContent = `1
00:00:02,000 --> 00:00:05,000
Welcome to our lesson today.

2
00:00:05,500 --> 00:00:08,000
We'll be learning about addition.`;

      const transcript = { text: srtContent };
      const onSeek = vi.fn();

      render(
        <TranscriptViewer
          transcript={transcript}
          onClose={vi.fn()}
          onSeek={onSeek}
        />
      );

      const jumpButtons = screen.getAllByText('Jump');
      expect(jumpButtons).toHaveLength(2);

      // Test SRT comma parsing
      fireEvent.click(jumpButtons[0]);
      expect(onSeek).toHaveBeenCalledWith(2); // 2 seconds

      fireEvent.click(jumpButtons[1]);
      expect(onSeek).toHaveBeenCalledWith(5.5); // 5.5 seconds
    });

    it('displays loading state when fetching transcript from URL', async () => {
      global.fetch = vi.fn().mockImplementation(() =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              text: () => Promise.resolve('Fetched transcript content')
            } as Response);
          }, 100);
        })
      );

      const transcript = { src: '/transcripts/lesson-001-en.txt' };

      render(
        <TranscriptViewer
          transcript={transcript}
          onClose={vi.fn()}
        />
      );

      // Check loading state
      expect(screen.getByText('Loading transcript...')).toBeInTheDocument();

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByText('Fetched transcript content')).toBeInTheDocument();
      });

      expect(screen.queryByText('Loading transcript...')).not.toBeInTheDocument();

      vi.restoreAllMocks();
    });

    it('displays error state when transcript fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const transcript = { src: '/transcripts/nonexistent.txt' };

      render(
        <TranscriptViewer
          transcript={transcript}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });

      vi.restoreAllMocks();
    });

    it('handles plain text paragraphs without timestamps', () => {
      const transcript = {
        text: `Welcome to our educational video.

In this lesson, we will cover basic mathematical concepts.

Addition is one of the fundamental operations in mathematics.`
      };

      render(
        <TranscriptViewer
          transcript={transcript}
          onClose={vi.fn()}
        />
      );

      // Should render as paragraph entries without Jump buttons
      expect(screen.getByText('Welcome to our educational video.')).toBeInTheDocument();
      expect(screen.getByText('In this lesson, we will cover basic mathematical concepts.')).toBeInTheDocument();
      expect(screen.getByText('Addition is one of the fundamental operations in mathematics.')).toBeInTheDocument();

      // Should not have Jump buttons for plain text
      expect(screen.queryByText('Jump')).not.toBeInTheDocument();
    });
  });
});