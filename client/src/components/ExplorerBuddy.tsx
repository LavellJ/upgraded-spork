import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AgeGroup } from "./AgeSelector";

interface ExplorerBuddyProps {
  ageGroup: AgeGroup;
  currentPage: string;
  isStudying?: boolean;
  studyDuration?: number;
  recentProgress?: {
    topicName?: string;
    questionsAnswered?: number;
    streakCount?: number;
    completedTopics?: number;
  };
}

interface BuddyMessage {
  id: string;
  text: string;
  type: "encouragement" | "break_suggestion" | "celebration" | "curiosity" | "companionship";
  duration: number;
}

export function ExplorerBuddy({ 
  ageGroup, 
  currentPage, 
  isStudying = false, 
  studyDuration = 0,
  recentProgress = {}
}: ExplorerBuddyProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<BuddyMessage | null>(null);
  const [lastInteraction, setLastInteraction] = useState<number>(Date.now());

  // Get personality traits based on age group
  const getPersonality = useCallback(() => {
    const personalities = {
      "pre-primary": {
        tone: "excited",
        vocabulary: "simple",
        curiosityLevel: "high",
        examples: {
          encouragement: ["We're doing great!", "Look what we found!", "This is fun!"],
          break_suggestion: ["I'm getting sleepy, should we play?", "Let's go explore outside!"],
          celebration: ["Yay! We did it!", "We're so clever!", "High five!"],
          curiosity: ["Ooh, what's this?", "I wonder...", "Let's see what happens!"],
          companionship: ["I'm here with you!", "We make a good team!", "I like learning with you!"]
        }
      },
      "primary": {
        tone: "curious",
        vocabulary: "moderate", 
        curiosityLevel: "investigative",
        examples: {
          encouragement: ["We're figuring this out together!", "I think we're onto something!", "Nice work, teammate!"],
          break_suggestion: ["My brain needs a rest too - want to take a break?", "I bet a quick walk would help us both!"],
          celebration: ["We crushed that!", "Look how much we've learned!", "We're getting really good at this!"],
          curiosity: ["I wonder if there's a pattern here...", "This reminds me of something...", "What if we try..."],
          companionship: ["I'm stuck on this part too", "Let's think about this together", "We've got this!"]
        }
      },
      "upper-primary": {
        tone: "thoughtful",
        vocabulary: "advanced",
        curiosityLevel: "strategic",
        examples: {
          encouragement: ["We're building some serious skills here", "I can see us both improving", "This challenge is making us stronger"],
          break_suggestion: ["I think we've earned a proper break", "Sometimes stepping away helps me see things differently"],
          celebration: ["We've made real progress together", "I'm proud of how we tackled that", "We're becoming quite the explorers!"],
          curiosity: ["I'm noticing some interesting connections...", "This might relate to what we learned before", "I have a theory about this..."],
          companionship: ["We're in this together", "I find this challenging too", "Let's approach this systematically"]
        }
      }
    };
    return personalities[ageGroup];
  }, [ageGroup]);

  // Generate AI-powered contextual messages based on current situation
  const generateMessage = useCallback(async (): Promise<BuddyMessage | null> => {
    const now = Date.now();
    
    // Don't show messages too frequently
    if (now - lastInteraction < 30000) return null; // 30 seconds minimum
    
    let messageType: BuddyMessage['type'] = 'companionship';
    let duration = 4000;
    
    // Study duration-based messages
    if (isStudying && studyDuration > 25 * 60 * 1000) { // 25+ minutes
      messageType = 'break_suggestion';
      duration = 6000;
    }
    // Recent progress celebrations
    else if (recentProgress.completedTopics && recentProgress.completedTopics > 0) {
      messageType = 'celebration';
      duration = 5000;
    }
    // Encouragement during study
    else if (isStudying && studyDuration > 10 * 60 * 1000) { // 10+ minutes
      messageType = 'encouragement';
      duration = 4000;
    }
    // Curiosity on dashboard/journey pages
    else if (currentPage === "/dashboard" || currentPage.includes("/journey")) {
      messageType = 'curiosity';
      duration = 4000;
    }
    
    try {
      // Fetch AI-generated message
      const response = await fetch('/api/buddy/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ageGroup,
          currentPage,
          studyDuration,
          recentProgress,
          messageType,
          studentName: 'friend' // Could be customizable
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch buddy message');
      }
      
      const { message: aiMessage } = await response.json();
      
      return {
        id: `${messageType}-${now}`,
        text: aiMessage,
        type: messageType,
        duration
      };
    } catch (error) {
      console.error('Failed to generate AI buddy message:', error);
      
      // Fallback to personality examples
      const personality = getPersonality();
      const fallbackText = personality.examples[messageType][Math.floor(Math.random() * personality.examples[messageType].length)];
      
      return {
        id: `fallback-${messageType}-${now}`,
        text: fallbackText,
        type: messageType,
        duration
      };
    }
  }, [ageGroup, currentPage, isStudying, studyDuration, recentProgress, lastInteraction, getPersonality]);

  // Show buddy periodically
  useEffect(() => {
    const showBuddy = async () => {
      const message = await generateMessage();
      if (message) {
        setCurrentMessage(message);
        setIsVisible(true);
        setLastInteraction(Date.now());
        
        // Auto-hide after message duration
        setTimeout(() => {
          setIsVisible(false);
          setCurrentMessage(null);
        }, message.duration);
      }
    };
    
    // Initial delay, then periodic checks
    const initialTimeout = setTimeout(showBuddy, 5000);
    const interval = setInterval(showBuddy, 60000); // Check every minute
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [generateMessage]);

  // Explorer character visual design (Alto-inspired)
  const ExplorerCharacter = () => (
    <motion.div
      className="relative"
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 10 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      <svg viewBox="0 0 120 120" className="w-16 h-16">
        {/* Explorer silhouette */}
        <g className="text-indigo-600">
          {/* Body */}
          <ellipse cx="60" cy="85" rx="18" ry="25" fill="currentColor" className="animate-pulse-soft" />
          
          {/* Head */}
          <circle cx="60" cy="45" r="20" fill="currentColor" />
          
          {/* Backpack */}
          <ellipse cx="75" cy="70" rx="8" ry="15" fill="currentColor" className="opacity-80" />
          <rect x="72" y="60" width="6" height="8" rx="2" fill="currentColor" className="opacity-60" />
          
          {/* Explorer hat/cap */}
          <ellipse cx="60" cy="30" rx="22" ry="8" fill="currentColor" className="opacity-90" />
          <ellipse cx="58" cy="28" rx="18" ry="6" fill="currentColor" />
          
          {/* Flowing scarf */}
          <motion.path
            d="M42,50 Q35,60 30,75 Q28,85 32,90"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="opacity-70"
            animate={{ d: ["M42,50 Q35,60 30,75 Q28,85 32,90", "M42,50 Q38,58 35,72 Q30,82 35,88", "M42,50 Q35,60 30,75 Q28,85 32,90"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Simple facial features */}
          <circle cx="54" cy="42" r="2" fill="white" className="opacity-80" />
          <circle cx="66" cy="42" r="2" fill="white" className="opacity-80" />
          <ellipse cx="60" cy="48" rx="1" ry="2" fill="white" className="opacity-60" />
          
          {/* Adventure sparkles */}
          <motion.circle
            cx="90"
            cy="30"
            r="1.5"
            fill="currentColor"
            className="text-yellow-400 opacity-70"
            animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
          />
          <motion.circle
            cx="95"
            cy="50"
            r="1"
            fill="currentColor"
            className="text-cyan-400 opacity-70"
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
          />
          <motion.circle
            cx="85"
            cy="65"
            r="1.2"
            fill="currentColor"
            className="text-pink-400 opacity-70"
            animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.7, 1.3, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          />
        </g>
      </svg>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isVisible && currentMessage && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 flex items-start space-x-3">
            <ExplorerCharacter />
            
            <div className="flex-1">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-gray-700 leading-relaxed font-medium"
                data-testid={`buddy-message-${currentMessage.type}`}
              >
                {currentMessage.text}
              </motion.p>
              
              <button
                onClick={() => {
                  setIsVisible(false);
                  setCurrentMessage(null);
                }}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                data-testid="buddy-dismiss-button"
              >
                Thanks, buddy! ✨
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}