import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { motion } from 'framer-motion';

interface ScoutSpeechButtonProps {
  text: string;
  className?: string;
  autoSpeak?: boolean;
}

export function ScoutSpeechButton({ text, className = "", autoSpeak = false }: ScoutSpeechButtonProps) {
  const { speak, pause, resume, stop, isSpeaking, isPaused, isSupported } = useSpeech();
  const [hasSpoken, setHasSpoken] = useState(false);

  if (!isSupported) {
    return null;
  }

  const handleToggleSpeech = () => {
    if (isSpeaking && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      speak(text);
      setHasSpoken(true);
    }
  };

  const handleStop = () => {
    stop();
    setHasSpoken(false);
  };

  // Auto-speak on first render if enabled
  useEffect(() => {
    if (autoSpeak && !hasSpoken && text) {
      setTimeout(() => {
        speak(text);
        setHasSpoken(true);
      }, 500);
    }
  }, [autoSpeak, hasSpoken, text, speak]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggleSpeech}
        className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 border-2 border-blue-400/40 hover:border-blue-400/60 backdrop-blur-sm flex items-center justify-center transition-all group"
        data-testid="scout-speak-button"
        title="Scout will read this to you!"
      >
        {isSpeaking && !isPaused ? (
          <Pause className="w-5 h-5 text-blue-300 group-hover:text-blue-200" />
        ) : isPaused ? (
          <Play className="w-5 h-5 text-blue-300 group-hover:text-blue-200" />
        ) : (
          <Volume2 className="w-5 h-5 text-blue-300 group-hover:text-blue-200" />
        )}
      </motion.button>

      {isSpeaking && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStop}
          className="w-8 h-8 rounded-full bg-gradient-to-r from-red-400/20 to-orange-400/20 border-2 border-red-400/40 hover:border-red-400/60 backdrop-blur-sm flex items-center justify-center transition-all"
          data-testid="scout-stop-button"
          title="Stop Scout's voice"
        >
          <VolumeX className="w-4 h-4 text-red-300 hover:text-red-200" />
        </motion.button>
      )}

      {isSpeaking && (
        <div className="flex items-center gap-1">
          <motion.div
            className="w-1.5 h-1.5 bg-blue-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <motion.div
            className="w-1.5 h-1.5 bg-purple-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-1.5 h-1.5 bg-pink-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
          />
          <span className="text-xs text-white/60 ml-2">Scout is speaking...</span>
        </div>
      )}
    </div>
  );
}