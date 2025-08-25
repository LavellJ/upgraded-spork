import { useState, useRef, useCallback } from 'react';

interface SpeechOptions {
  rate?: number;
  pitch?: number;
  voice?: string;
  volume?: number;
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    if ('speechSynthesis' in window) {
      // Stop any current speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Scout's Australian voice settings - like Bluey!
      utterance.rate = options.rate || 1.0; // Natural Australian pace
      utterance.pitch = options.pitch || 1.3; // Higher pitch for youthful, excited Scout
      utterance.volume = options.volume || 0.9; // Confident and clear
      
      // Try to find Australian voice for Scout (like Bluey)
      const voices = window.speechSynthesis.getVoices();
      
      // Aggressively search for Australian voices
      let australianVoices = voices.filter(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        return lang.includes('en-au') || 
               lang.includes('australia') ||
               name.includes('australian') ||
               name.includes('australia') ||
               name.includes('karen') ||  // Often Australian on Windows
               name.includes('catherine') || // Often Australian 
               name.includes('hayley') ||    // Australian voice name
               name.includes('zoe')          // Australian voice name
      });
      
      // Enhanced British voices (closer to Australian accent)
      let britishVoices = voices.filter(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        return (lang.includes('en-gb') || 
                lang.includes('british') ||
                name.includes('british') ||
                name.includes('uk') ||
                name.includes('hazel') ||
                name.includes('serena')) &&
               !name.includes('american') &&
               !name.includes('us');
      });
      
      // High-quality female voices that might sound more Australian
      let qualityFemaleVoices = voices.filter(voice => {
        const name = voice.name.toLowerCase();
        return voice.lang.startsWith('en') && 
               (name.includes('google female') ||
                name.includes('microsoft zira') ||
                name.includes('samantha') ||
                name.includes('fiona') ||
                name.includes('moira')) &&
               !name.includes('american') &&
               !name.includes('us');
      });
      
      // Any decent English voice as final fallback
      let fallbackVoices = voices.filter(voice => 
        voice.lang.startsWith('en') && 
        !voice.name.toLowerCase().includes('american') &&
        !voice.name.toLowerCase().includes('us')
      );
      
      // Select the most Australian voice available
      const preferredVoice = australianVoices[0] || britishVoices[0] || qualityFemaleVoices[0] || fallbackVoices[0];
      
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
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
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