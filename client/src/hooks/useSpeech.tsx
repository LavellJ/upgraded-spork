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
      utterance.rate = options.rate || 1.2; // Faster, more energetic like Bluey
      utterance.pitch = options.pitch || 1.3; // Higher pitch for youthful, excited Scout
      utterance.volume = options.volume || 0.9; // Confident and clear
      
      // Try to find Australian voice for Scout (like Bluey)
      const voices = window.speechSynthesis.getVoices();
      
      // First priority: Australian English voices
      let australianVoices = voices.filter(voice => 
        voice.lang.includes('en-AU') || 
        voice.name.toLowerCase().includes('australian') ||
        voice.name.toLowerCase().includes('australia')
      );
      
      // Second priority: British English (closer to Australian than American)
      let britishVoices = voices.filter(voice => 
        voice.lang.includes('en-GB') ||
        voice.name.toLowerCase().includes('british') ||
        voice.name.toLowerCase().includes('uk')
      );
      
      // Third priority: Any female English voice
      let femaleVoices = voices.filter(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('woman') ||
         voice.name.toLowerCase().includes('zira') ||
         voice.name.toLowerCase().includes('samantha'))
      );
      
      // Fourth priority: Any English voice that sounds young/energetic
      let energeticVoices = voices.filter(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.toLowerCase().includes('google') || 
         voice.name.toLowerCase().includes('alex') ||
         voice.name.toLowerCase().includes('karen'))
      );
      
      // Select the best available voice
      const preferredVoice = australianVoices[0] || britishVoices[0] || femaleVoices[0] || energeticVoices[0];
      
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