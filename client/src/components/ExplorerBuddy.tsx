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
  const [currentMessage, setCurrentMessage] = useState<BuddyMessage | null>(null);
  const [lastInteraction, setLastInteraction] = useState<number>(Date.now());
  const [buddyMood, setBuddyMood] = useState<'neutral' | 'excited' | 'thoughtful' | 'celebrating'>('neutral');

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
    if (now - lastInteraction < 15000) return null; // 15 seconds minimum
    
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
      console.log('Using fallback buddy message (AI unavailable)');
      
      // Fallback to personality examples (always works)
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

  // Update buddy messages periodically (always visible)
  useEffect(() => {
    const updateBuddy = async () => {
      const message = await generateMessage();
      if (message) {
        setCurrentMessage(message);
        setLastInteraction(Date.now());
        
        // Set mood based on message type
        setBuddyMood(
          message.type === 'celebration' ? 'celebrating' :
          message.type === 'curiosity' ? 'excited' :
          message.type === 'break_suggestion' ? 'thoughtful' :
          'neutral'
        );
        
        // Clear message after duration, but keep buddy visible
        setTimeout(() => {
          setCurrentMessage(null);
          setBuddyMood('neutral');
        }, message.duration);
      }
    };
    
    // Initial message, then periodic updates
    const initialTimeout = setTimeout(updateBuddy, 2000);
    const interval = setInterval(updateBuddy, 20000); // Update every 20 seconds
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [generateMessage]);

  // Explorer character visual design (Alto-inspired) with mood animations
  const ExplorerCharacter = () => (
    <motion.div
      className="relative cursor-pointer"
      animate={{ 
        scale: buddyMood === 'celebrating' ? [1, 1.1, 1] : 
               buddyMood === 'excited' ? [1, 1.05, 1] : 1,
        rotate: buddyMood === 'celebrating' ? [-2, 2, -2, 0] : 0
      }}
      transition={{ 
        duration: buddyMood === 'celebrating' ? 0.6 : buddyMood === 'excited' ? 1.2 : 2,
        repeat: buddyMood !== 'neutral' ? Infinity : 0,
        repeatType: "reverse"
      }}
      whileHover={{ scale: 1.05 }}
      onClick={() => {
        // Optional: trigger a friendly interaction
        setBuddyMood('excited');
        setTimeout(() => setBuddyMood('neutral'), 1000);
      }}
    >
      <svg viewBox="0 0 100 130" className="w-50 h-60">
        {/* Shadow */}
        <ellipse cx="50" cy="120" rx="18" ry="2" fill="rgba(0,0,0,0.15)" />
        
        <motion.g
          animate={{ 
            y: buddyMood === 'excited' ? [-0.5, 0.5, -0.5] : 0,
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Backpack - brown, simple rounded rectangle */}
          <rect
            x="30"
            y="55"
            width="12"
            height="18"
            rx="6"
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="2"
          />
          <rect x="33" y="50" width="6" height="8" rx="3" fill="#654321" />
          
          {/* Boots - simple brown ovals */}
          <ellipse cx="45" cy="110" rx="6" ry="4" fill="#8B4513" stroke="#654321" strokeWidth="2" />
          <ellipse cx="55" cy="110" rx="6" ry="4" fill="#8B4513" stroke="#654321" strokeWidth="2" />
          
          {/* Legs - brown shorts/pants */}
          <rect x="44" y="85" width="5" height="25" fill="#8B4513" stroke="#654321" strokeWidth="2" rx="2.5" />
          <rect x="51" y="85" width="5" height="25" fill="#8B4513" stroke="#654321" strokeWidth="2" rx="2.5" />
          
          {/* Belt */}
          <rect x="42" y="82" width="16" height="3" fill="#654321" rx="1.5" />
          <rect x="48.5" y="81" width="3" height="5" fill="#8B4513" rx="1.5" />
          
          {/* Body - orange/brown vest exactly like reference */}
          <rect
            x="44"
            y="55"
            width="12"
            height="27"
            rx="6"
            fill="#D2691E"
            stroke="#8B4513"
            strokeWidth="2"
          />
          
          {/* V-neck collar - orange triangle */}
          <path
            d="M48 55 L52 55 L50 62 Z"
            fill="#CD853F"
            stroke="#8B4513"
            strokeWidth="1.5"
          />
          
          {/* Arms - skin colored, simple */}
          <motion.ellipse
            cx="40"
            cy="65"
            rx="4"
            ry="10"
            fill="#F5DEB3"
            stroke="#D2691E"
            strokeWidth="2"
            animate={{ rotate: buddyMood === 'celebrating' ? [-8, 8, -8] : 0 }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <motion.ellipse
            cx="60"
            cy="65"
            rx="4"
            ry="10"
            fill="#F5DEB3"
            stroke="#D2691E"
            strokeWidth="2"
            animate={{ rotate: buddyMood === 'celebrating' ? [8, -8, 8] : 0 }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          
          {/* Head - perfectly round like reference */}
          <circle
            cx="50"
            cy="40"
            r="20"
            fill="#F5DEB3"
            stroke="#D2691E"
            strokeWidth="2.5"
          />
          
          {/* Hat - brown safari hat exactly like reference */}
          {/* Hat crown - rounded dome */}
          <path
            d="M32 35 Q32 25 50 25 Q68 25 68 35 Q68 40 50 40 Q32 40 32 35 Z"
            fill="#CD853F"
            stroke="#8B4513"
            strokeWidth="2.5"
          />
          
          {/* Hat brim - wide circular brim */}
          <ellipse
            cx="50"
            cy="37"
            rx="24"
            ry="6"
            fill="#A0522D"
            stroke="#8B4513"
            strokeWidth="2.5"
          />
          
          {/* Hat band */}
          <ellipse
            cx="50"
            cy="35"
            rx="18"
            ry="2"
            fill="#8B4513"
          />
          
          {/* Face features - exactly like reference */}
          {/* Eyes - simple small dark ovals */}
          <ellipse cx="45" cy="40" rx="1.5" ry="2" fill="#2F1B14" />
          <ellipse cx="55" cy="40" rx="1.5" ry="2" fill="#2F1B14" />
          
          {/* Nose - tiny dark oval */}
          <ellipse cx="50" cy="43" rx="0.8" ry="1.2" fill="#D2691E" />
          
          {/* Rosy cheeks - perfect circles like reference */}
          <circle cx="41" cy="45" r="3" fill="#FFB6C1" opacity="0.7" />
          <circle cx="59" cy="45" r="3" fill="#FFB6C1" opacity="0.7" />
          
          {/* Smile - simple curved line */}
          <motion.path
            d="M46 48 Q50 52 54 48"
            fill="none"
            stroke="#2F1B14"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ 
              scaleY: buddyMood === 'celebrating' ? [1, 1.2, 1] : 1
            }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          
          {/* Ears - small circles */}
          <circle cx="30" cy="40" r="4" fill="#F5DEB3" stroke="#D2691E" strokeWidth="2" />
          <circle cx="70" cy="40" r="4" fill="#F5DEB3" stroke="#D2691E" strokeWidth="2" />
        </motion.g>
        
          {/* Adventure sparkles - more active when excited */}
          <motion.circle
            cx="95"
            cy="25"
            r="1.5"
            fill="currentColor"
            className="text-yellow-400"
            animate={{ 
              opacity: buddyMood === 'celebrating' ? [0.5, 1, 0.5] : [0.3, 0.7, 0.3], 
              scale: buddyMood === 'celebrating' ? [1, 1.5, 1] : [0.8, 1.2, 0.8] 
            }}
            transition={{ 
              duration: buddyMood === 'celebrating' ? 0.8 : 2, 
              repeat: Infinity, 
              delay: 0 
            }}
          />
          <motion.circle
            cx="100"
            cy="45"
            r="1"
            fill="currentColor"
            className="text-cyan-400"
            animate={{ 
              opacity: buddyMood === 'excited' ? [0.6, 1, 0.6] : [0.4, 0.8, 0.4], 
              scale: [0.9, 1.1, 0.9] 
            }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
          />
          <motion.circle
            cx="90"
            cy="65"
            r="1.2"
            fill="currentColor"
            className="text-pink-400"
            animate={{ 
              opacity: [0.2, 0.7, 0.2], 
              scale: buddyMood === 'thoughtful' ? [0.5, 0.9, 0.5] : [0.7, 1.3, 0.7] 
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          />
      </svg>
    </motion.div>
  );

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Character overlay */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20, delay: 1 }}
        className="relative"
      >
        <ExplorerCharacter />
        
        {/* Message bubble that appears above the character */}
        <AnimatePresence mode="wait">
          {currentMessage && (
            <motion.div
              key={currentMessage.id}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-full right-0 mb-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-3 max-w-xs"
            >
              <p
                className="text-sm text-gray-700 leading-relaxed font-medium mb-1"
                data-testid={`buddy-message-${currentMessage.type}`}
              >
                {currentMessage.text}
              </p>
              <div className="text-xs text-gray-400">Your explorer buddy</div>
              
              {/* Speech bubble arrow */}
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white/95 border-r border-b border-white/20 rotate-45 backdrop-blur-sm"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}