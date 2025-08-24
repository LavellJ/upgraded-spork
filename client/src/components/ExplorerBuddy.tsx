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
      <svg viewBox="0 0 120 140" className="w-20 h-24">
        <defs>
          <linearGradient id="hatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D2691E" />
            <stop offset="50%" stopColor="#CD853F" />
            <stop offset="100%" stopColor="#8B4513" />
          </linearGradient>
          <linearGradient id="faceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F4E4BC" />
            <stop offset="100%" stopColor="#DEB887" />
          </linearGradient>
          <linearGradient id="shirtGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D2691E" />
            <stop offset="100%" stopColor="#A0522D" />
          </linearGradient>
          <linearGradient id="backpackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="100%" stopColor="#654321" />
          </linearGradient>
        </defs>
        
        {/* Shadow */}
        <ellipse cx="60" cy="130" rx="18" ry="3" fill="rgba(0,0,0,0.15)" />
        
        <motion.g
          animate={{ 
            y: buddyMood === 'excited' ? [-0.5, 0.5, -0.5] : 0,
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Backpack */}
          <path
            d="M42 50 Q35 45 30 52 L30 70 Q30 75 35 75 L45 75 Q50 75 50 70 L50 55"
            fill="url(#backpackGradient)"
            stroke="#654321"
            strokeWidth="1.5"
          />
          
          {/* Backpack strap */}
          <path
            d="M48 55 Q52 58 55 62"
            fill="none"
            stroke="#654321"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          {/* Boots */}
          <ellipse cx="54" cy="122" rx="8" ry="6" fill="#8B4513" />
          <ellipse cx="66" cy="122" rx="8" ry="6" fill="#8B4513" />
          
          {/* Legs */}
          <rect x="52" y="105" width="6" height="18" fill="#8B4513" rx="3" />
          <rect x="62" y="105" width="6" height="18" fill="#8B4513" rx="3" />
          
          {/* Belt */}
          <rect x="48" y="85" width="24" height="4" fill="#654321" rx="2" />
          <rect x="58" y="83" width="4" height="8" fill="#8B4513" rx="1" />
          
          {/* Shirt/vest */}
          <path
            d="M48 60 L72 60 L72 88 L48 88 Z"
            fill="url(#shirtGradient)"
          />
          
          {/* Shirt collar */}
          <path
            d="M54 58 L60 65 L66 58"
            fill="#D2691E"
            stroke="#A0522D"
            strokeWidth="1"
          />
          
          {/* Arms */}
          <motion.ellipse
            cx="42"
            cy="70"
            rx="5"
            ry="12"
            fill="url(#faceGradient)"
            animate={{ rotate: buddyMood === 'celebrating' ? [-8, 8, -8] : 0 }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <motion.ellipse
            cx="78"
            cy="70"
            rx="5"
            ry="12"
            fill="url(#faceGradient)"
            animate={{ rotate: buddyMood === 'celebrating' ? [8, -8, 8] : 0 }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          
          {/* Head */}
          <circle
            cx="60"
            cy="45"
            r="16"
            fill="url(#faceGradient)"
            stroke="#DEB887"
            strokeWidth="1"
          />
          
          {/* Explorer hat crown */}
          <ellipse
            cx="60"
            cy="32"
            rx="18"
            ry="10"
            fill="url(#hatGradient)"
            stroke="#8B4513"
            strokeWidth="1"
          />
          
          {/* Hat brim */}
          <ellipse
            cx="60"
            cy="42"
            rx="22"
            ry="5"
            fill="#A0522D"
            stroke="#8B4513"
            strokeWidth="1"
          />
          
          {/* Hat band */}
          <ellipse
            cx="60"
            cy="40"
            rx="18"
            ry="2"
            fill="#654321"
          />
          
          {/* Face features */}
          {/* Eyes */}
          <circle cx="56" cy="45" r="2" fill="#654321" />
          <circle cx="64" cy="45" r="2" fill="#654321" />
          <circle cx="56.5" cy="44.5" r="0.5" fill="white" />
          <circle cx="64.5" cy="44.5" r="0.5" fill="white" />
          
          {/* Rosy cheeks */}
          <circle cx="50" cy="48" r="3" fill="#FFB6C1" opacity="0.6" />
          <circle cx="70" cy="48" r="3" fill="#FFB6C1" opacity="0.6" />
          
          {/* Smile */}
          <motion.path
            d="M56 50 Q60 54 64 50"
            fill="none"
            stroke="#654321"
            strokeWidth="1.5"
            strokeLinecap="round"
            animate={{ 
              scaleY: buddyMood === 'celebrating' ? [1, 1.2, 1] : 1
            }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          
          {/* Ears */}
          <circle cx="44" cy="45" r="4" fill="url(#faceGradient)" />
          <circle cx="76" cy="45" r="4" fill="url(#faceGradient)" />
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
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 20, delay: 1 }}
      className="fixed bottom-6 right-6 z-50 max-w-sm"
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 flex items-start space-x-3 min-h-[100px]">
        <ExplorerCharacter />
        
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {currentMessage ? (
              <motion.div
                key={currentMessage.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p
                  className="text-sm text-gray-700 leading-relaxed font-medium mb-2"
                  data-testid={`buddy-message-${currentMessage.type}`}
                >
                  {currentMessage.text}
                </p>
                <div className="text-xs text-gray-400">Your explorer buddy</div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-sm text-gray-500 leading-relaxed font-medium mb-2">
                  {buddyMood === 'neutral' ? (
                    ageGroup === 'pre-primary' ? "Ready to explore together!" :
                    ageGroup === 'primary' ? "I'm here if you need me!" :
                    "Standing by, fellow explorer."
                  ) : "..."}
                </p>
                <div className="text-xs text-gray-400">Your explorer buddy</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}