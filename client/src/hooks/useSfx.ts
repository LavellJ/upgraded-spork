import { useCallback, useRef } from 'react';
import { getAsset } from '../lib/assetResolver';

// SFX sound IDs that can be played
export type SfxId = 'ui_open' | 'pin_unlock' | 'award_get' | 'step_nav';

// Audio cache to prevent re-creating Audio objects
const audioCache = new Map<SfxId, HTMLAudioElement>();

/**
 * Hook for playing sound effects with Calm Mode and user preference support
 * Respects accessibility settings and provides consistent audio experience
 */
export function useSfx() {
  const lastPlayTime = useRef<Record<SfxId, number>>({} as Record<SfxId, number>);

  const isAudioEnabled = useCallback(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return false;
    
    // Respect user's Calm Mode preference
    try {
      const calmMode = JSON.parse(localStorage.getItem('learnoz_calm') || 'false');
      if (calmMode) return false;
    } catch {
      // If we can't read calm mode, default to allowing audio
    }

    // Respect user's audio preference
    try {
      const audioEnabled = JSON.parse(localStorage.getItem('learnoz_audio_enabled') || 'true');
      if (!audioEnabled) return false;
    } catch {
      // Default to enabled if we can't read preference
    }

    // Check if user has interacted with the page (required for autoplay policy)
    return true;
  }, []);

  const getAudio = useCallback((id: SfxId): HTMLAudioElement | null => {
    if (!isAudioEnabled()) return null;

    // Check cache first
    if (audioCache.has(id)) {
      return audioCache.get(id)!;
    }

    // Create new audio element
    try {
      const audioSrc = getAsset('audio', `sfx-${id.replace('_', '-')}`);
      const audio = new Audio(audioSrc);
      
      // Configure audio settings
      audio.preload = 'auto';
      audio.volume = 0.3; // Default moderate volume
      
      // Cache the audio element
      audioCache.set(id, audio);
      
      return audio;
    } catch (error) {
      console.warn(`Failed to create audio for SFX: ${id}`, error);
      return null;
    }
  }, [isAudioEnabled]);

  const play = useCallback((id: SfxId, options?: { volume?: number; force?: boolean }) => {
    if (!isAudioEnabled() && !options?.force) return;

    const now = Date.now();
    const minInterval = 100; // Prevent rapid-fire sound spam

    // Throttle repeated sounds
    if (lastPlayTime.current[id] && (now - lastPlayTime.current[id]) < minInterval) {
      return;
    }

    const audio = getAudio(id);
    if (!audio) return;

    try {
      // Set volume if specified
      if (options?.volume !== undefined) {
        audio.volume = Math.max(0, Math.min(1, options.volume));
      }

      // Reset to beginning and play
      audio.currentTime = 0;
      
      const playPromise = audio.play();
      
      // Handle play promise (required for modern browsers)
      if (playPromise) {
        playPromise.catch(error => {
          // Silently fail - user may not have interacted with page yet
          console.debug(`SFX play blocked: ${id}`, error);
        });
      }

      lastPlayTime.current[id] = now;
    } catch (error) {
      console.warn(`Failed to play SFX: ${id}`, error);
    }
  }, [isAudioEnabled, getAudio]);

  const preload = useCallback((ids: SfxId[]) => {
    if (!isAudioEnabled()) return;

    ids.forEach(id => {
      // Trigger cache population
      getAudio(id);
    });
  }, [isAudioEnabled, getAudio]);

  const setAudioEnabled = useCallback((enabled: boolean) => {
    try {
      localStorage.setItem('learnoz_audio_enabled', JSON.stringify(enabled));
    } catch {
      // Storage unavailable
    }
  }, []);

  const isEnabled = useCallback(() => {
    return isAudioEnabled();
  }, [isAudioEnabled]);

  return {
    play,
    preload,
    setAudioEnabled,
    isEnabled
  };
}