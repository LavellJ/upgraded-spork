import { useState, useRef, useCallback } from 'react';

interface SpeechOptions {
  rate?: number;
  pitch?: number;
  voice?: string;
  volume?: number;
  useElevenLabs?: boolean;
  voiceId?: string;
}

// Scout's Voice ID - Your custom Australian Scout voice from ElevenLabs
const SCOUT_VOICE_ID = 'Pvq8a5ZuCdSHTAiFkvPI';

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, options: SpeechOptions = {}) => {
    // Use ElevenLabs by default for Scout's voice
    const useElevenLabs = options.useElevenLabs !== false; // Default to true
    const voiceId = options.voiceId || SCOUT_VOICE_ID;

    if (useElevenLabs && voiceId !== 'SCOUT_VOICE_ID_PLACEHOLDER') {
      try {
        // Stop any current audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        setIsSpeaking(true);
        setIsPaused(false);

        // Generate speech using ElevenLabs
        const response = await fetch('/api/speech/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            voiceId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate speech');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audioRef.current = audio;

        audio.onplay = () => {
          setIsSpeaking(true);
          setIsPaused(false);
        };

        audio.onended = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          URL.revokeObjectURL(audioUrl);
          console.error('Audio playback error');
        };

        await audio.play();
        
      } catch (error) {
        console.warn('ElevenLabs unavailable (likely out of credits), using browser speech:', error instanceof Error ? error.message : 'Unknown error');
        setIsSpeaking(false);
        setIsPaused(false);
        // Fall back to browser speech synthesis
        return speak(text, { ...options, useElevenLabs: false });
      }
    } else {
      // Fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        // Stop any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Generic childlike voice settings with normal cadence
        utterance.rate = options.rate || 1.0; // Normal speaking pace
        utterance.pitch = options.pitch || 1.2; // Slightly higher pitch for childlike quality
        utterance.volume = options.volume || 0.9; // Clear and audible
        
        // Try to find a suitable voice
        const voices = window.speechSynthesis.getVoices();
        
        // Look for a generic childlike voice - prioritize female/higher voices
        const childlikeVoice = voices.find(voice => 
          voice.lang.startsWith('en') && (
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('girl') ||
            voice.name.toLowerCase().includes('zira') ||
            voice.name.toLowerCase().includes('hazel') ||
            voice.name.toLowerCase().includes('samantha')
          )
        );
        
        // Fallback to any English voice
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
        
        // Select the best available voice
        const preferredVoice = childlikeVoice || englishVoice;
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
          console.log('Scout is using voice:', preferredVoice.name, preferredVoice.lang);
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPaused(true);
    } else if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setIsPaused(false);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    isSupported: 'speechSynthesis' in window
  };
}