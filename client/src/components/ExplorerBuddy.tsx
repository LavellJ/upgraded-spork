import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AgeGroup } from "./AgeSelector";
// Import Scout character images - 3 versions used throughout entire app
import explorerDefault from '@assets/image_1756014874313.png';
import explorerExcited from '@assets/scout-excited.png';
import explorerThinking from '@assets/scout-thinking.png';

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
  const [buddyMood, setBuddyMood] = useState<'neutral' | 'excited' | 'thinking'>('neutral');

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
        
        // Set mood based on message type and context - 3 versions used
        setBuddyMood(
          message.type === 'celebration' ||
          message.type === 'encouragement' ||
          (recentProgress?.streakCount && recentProgress.streakCount > 3) ? 'excited' :
          message.type === 'break_suggestion' ? 'thinking' :
          message.type === 'curiosity' ? 'thinking' :
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

  // Get Scout image based on mood - 3 versions used throughout entire app
  const getExpressionImage = useCallback(() => {
    switch (buddyMood) {
      case 'excited': return explorerExcited;
      case 'thinking': return explorerThinking;
      default: return explorerDefault;
    }
  }, [buddyMood]);

  // Explorer character visual design (Alto-inspired) with mood animations
  const ExplorerCharacter = () => (
    <motion.div
      className="relative cursor-pointer"
      animate={{ 
        scale: buddyMood === 'excited' ? [1, 1.05, 1] : 1,
        rotate: buddyMood === 'excited' ? [-1, 1, -1, 0] : 
                buddyMood === 'thinking' ? [-0.5, 0.5, -0.5, 0] : 0
      }}
      transition={{ 
        duration: buddyMood === 'excited' ? 1.2 : buddyMood === 'thinking' ? 2.5 : 2,
        repeat: buddyMood !== 'neutral' ? Infinity : 0,
        repeatType: "reverse"
      }}
      whileHover={{ scale: 1.05 }}
      onClick={() => {
        // Cycle through Scout expressions on click
        const nextMood = buddyMood === 'neutral' ? 'excited' : 
                        buddyMood === 'excited' ? 'thinking' : 'neutral';
        setBuddyMood(nextMood);
        setTimeout(() => setBuddyMood('neutral'), 2000);
      }}
    >
      <motion.div
        className="relative w-50 h-60"
        style={{
          background: 'transparent',
          backdropFilter: 'none'
        }}
        animate={{ 
          y: buddyMood === 'excited' ? [-2, 2, -2] : [0, -1, 0],
          scale: buddyMood === 'excited' ? [1, 1.02, 1] : 1
        }}
        transition={{ 
          duration: buddyMood === 'excited' ? 1.5 : 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <img
          src={getExpressionImage()}
          alt="Scout - Explorer Buddy"
          className="w-full h-full object-contain"
          style={{
            filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.12))',
            background: 'transparent'
          }}
        />
      </motion.div>
      
      {/* Adventure sparkles - more active when excited */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-2 right-2 w-3 h-3 rounded-full bg-yellow-400"
          animate={{ 
            opacity: buddyMood === 'excited' ? [0.5, 1, 0.5] : [0.3, 0.7, 0.3], 
            scale: buddyMood === 'excited' ? [1, 1.3, 1] : [0.8, 1.2, 0.8] 
          }}
          transition={{ 
            duration: buddyMood === 'excited' ? 1 : 2, 
            repeat: Infinity, 
            delay: 0 
          }}
        />
        <motion.div
          className="absolute top-12 right-0 w-2 h-2 rounded-full bg-cyan-400"
          animate={{ 
            opacity: buddyMood === 'excited' ? [0.6, 1, 0.6] : [0.4, 0.8, 0.4], 
            scale: [0.9, 1.1, 0.9] 
          }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute top-20 right-4 w-2.5 h-2.5 rounded-full bg-pink-400"
          animate={{ 
            opacity: [0.2, 0.7, 0.2], 
            scale: buddyMood === 'excited' ? [0.8, 1.3, 0.8] : [0.7, 1.1, 0.7] 
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />
      </div>
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
              <div className="text-xs text-gray-400">Scout, your explorer buddy</div>
              
              {/* Speech bubble arrow */}
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white/95 border-r border-b border-white/20 rotate-45 backdrop-blur-sm"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}