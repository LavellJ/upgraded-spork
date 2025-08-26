import { motion, useAnimation } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import type { AgeGroup } from "@/components/AgeSelector";

// Import Scout character images - Only 2 versions used throughout entire app
import explorerDefault from '@assets/image_1756014874313.png';
import explorerExcited from '@assets/scout-excited.png';

interface ScoutProps {
  position: { x: number; y: number };
  target?: string | null;
  onReachTarget?: () => void;
  ageGroup?: AgeGroup;
  currentBiome?: string;
  onScoutClick?: () => void;
  lessonCount?: number;
  collectibleCount?: number;
}

type ScoutMood = 'neutral' | 'excited';

export function Scout({ 
  position, target, onReachTarget, ageGroup = "pre-primary", currentBiome,
  onScoutClick, lessonCount = 0, collectibleCount = 0 
}: ScoutProps) {
  const controls = useAnimation();
  const [scoutMood, setScoutMood] = useState<ScoutMood>('neutral');
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [showMessage, setShowMessage] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get Scout image based on mood - Only 2 versions used throughout entire app
  const getScoutImage = () => {
    switch (scoutMood) {
      case 'excited': return explorerExcited;
      default: return explorerDefault;
    }
  };

  // Enhanced contextual messages based on game state
  const getPersonalityMessage = useCallback(() => {
    const personalities = {
      "pre-primary": {
        biomeMessages: {
          beach: ["Ooh, shells! Let's count them!", "The waves are so pretty!", "I found something sparkly!"],
          jungle: ["So many animals to meet!", "What sounds do they make?", "Look at all these leaves!"],
          volcano: ["Wow, it's warm here!", "Pretty orange colors!", "Let's explore safely!"],
          lagoon: ["The water is so blue!", "Look at the fish!", "This is magical!"],
          general: ["G'day, mate! Ready to explore?", "This is so exciting!", "We're going on an adventure!"]
        },
        progressMessages: [
          `You've completed ${lessonCount} lessons! Amazing!`,
          `Found ${collectibleCount} treasures! Keep exploring!`,
          "Click on me for tips and encouragement!",
          "I love exploring with you!",
          lessonCount === 0 ? "Try clicking the glowing lesson to start!" : "You're doing great, explorer!"
        ]
      },
      "primary": {
        biomeMessages: {
          beach: ["I wonder how many shells we can find?", "The waves follow patterns!", "Let's investigate this treasure!"],
          jungle: ["There's so much to discover here!", "I hear different bird calls!", "Each leaf is unique!"],
          volcano: ["The rocks tell a story!", "I can feel the warmth!", "Science happens here!"],
          lagoon: ["This ecosystem is amazing!", "The water connects everything!", "Perfect for reflection!"],
          general: ["Ready for our next discovery?", "We make a great exploring team!", "What should we learn today?"]
        },
        progressMessages: [
          `Great progress! ${lessonCount} lessons completed!`,
          `Collected ${collectibleCount} items - well done!`,
          "Click me for helpful learning tips!",
          "Our adventure is just beginning!",
          lessonCount === 0 ? "Start with the bright lesson node!" : "You're becoming a skilled learner!"
        ]
      },
      "upper-primary": {
        biomeMessages: {
          beach: ["Each tide brings new mathematical patterns", "Coastal ecosystems are fascinating", "Let's study these formations"],
          jungle: ["Biodiversity creates complex systems", "Every sound has meaning here", "The relationships are intricate"],
          volcano: ["Geological processes shape our world", "Heat creates transformation", "Science in action!"],
          lagoon: ["Interconnected waterways support life", "Clear thinking comes from still waters", "Perfect for deep learning"],
          general: ["Our learning journey continues", "Each challenge builds our skills", "Ready to explore systematically?"]
        },
        progressMessages: [
          `Excellent work! ${lessonCount} concepts mastered!`,
          `${collectibleCount} discoveries made through exploration!`,
          "Click for strategic learning guidance!",
          "Each step builds upon the last!",
          lessonCount === 0 ? "Begin your learning journey with the first lesson!" : "Your knowledge grows with each challenge!"
        ]
      }
    };
    
    const personality = personalities[ageGroup];
    
    // Contextual messages based on progress or click
    if (isHovered || onScoutClick) {
      const progressMsgs = personality.progressMessages;
      return progressMsgs[Math.floor(Math.random() * progressMsgs.length)];
    }
    
    const messages = currentBiome ? personality.biomeMessages[currentBiome as keyof typeof personality.biomeMessages] : personality.biomeMessages.general;
    return messages[Math.floor(Math.random() * messages.length)];
  }, [ageGroup, currentBiome, isHovered, onScoutClick, lessonCount, collectibleCount]);

  // Handle Scout click interaction
  const handleScoutClick = () => {
    setScoutMood('excited');
    setCurrentMessage(getPersonalityMessage());
    setShowMessage(true);
    
    // Scout bounce animation
    controls.start({
      scale: [1, 1.1, 1],
      y: [0, -10, 0],
      transition: { duration: 0.6, ease: "easeOut" }
    });
    
    // Call optional callback
    onScoutClick?.();
    
    // Hide message after a moment
    setTimeout(() => {
      setShowMessage(false);
      setScoutMood('neutral');
    }, 5000);
  };

  // Handle movement to target
  useEffect(() => {
    if (target) {
      setScoutMood('excited');
      setCurrentMessage(getPersonalityMessage());
      setShowMessage(true);
      
      // Scout moves to target and points
      controls.start({
        x: position.x + "%",
        y: position.y + "%",
        transition: { duration: 2, ease: "easeInOut" }
      }).then(() => {
        setScoutMood('neutral');
        onReachTarget?.();
        
        // Hide message after reaching target
        setTimeout(() => {
          setShowMessage(false);
        }, 3000);
      });
    }
  }, [target, position, controls, onReachTarget, getPersonalityMessage]);

  // Periodic friendly messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      if (!target && !showMessage) {
        setScoutMood(Math.random() > 0.7 ? 'excited' : 'neutral');
        setCurrentMessage(getPersonalityMessage());
        setShowMessage(true);
        
        setTimeout(() => {
          setShowMessage(false);
          setScoutMood('neutral');
        }, 4000);
      }
    }, 12000); // Show message every 12 seconds

    return () => clearInterval(messageInterval);
  }, [target, showMessage, getPersonalityMessage]);

  return (
    <motion.div
      className="absolute z-20 cursor-pointer group"
      style={{ 
        left: position.x + "%", 
        top: position.y + "%",
        transform: "translate(-50%, -50%)"
      }}
      animate={controls}
      onClick={handleScoutClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      data-testid="scout-character"
    >
      {/* Scout Character */}
      <motion.div
        className="relative w-16 h-16"
        animate={{ 
          y: [0, -3, 0],
          rotate: [0, 1, -1, 0],
          scale: isHovered ? 1.1 : 1
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        {/* Scout Image */}
        <div className="relative w-16 h-16">
          <img
            src={getScoutImage()}
            alt="Scout Explorer"
            className="w-full h-full object-contain drop-shadow-lg"
          />
          
          {/* Enhanced glow effect - stronger when hovered */}
          <motion.div 
            className="absolute inset-0 bg-gradient-radial from-blue-200/10 via-transparent to-transparent pointer-events-none"
            animate={{
              opacity: isHovered ? 0.8 : 0.3,
              scale: isHovered ? 1.2 : 1
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Click indicator when hovered */}
          {isHovered && (
            <motion.div
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white/90 text-gray-700 text-xs px-2 py-1 rounded-lg shadow-md whitespace-nowrap"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
            >
              Click me for tips!
            </motion.div>
          )}
        </div>

        {/* Pointing Animation when target is selected */}
        {target && (
          <motion.div
            className="absolute -top-2 -right-2 text-yellow-400"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0, 1.3, 1, 0],
              rotate: [0, 15, -15, 0]
            }}
            transition={{ duration: 2, repeat: 2 }}
          >
            <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <i className="fas fa-arrow-right text-white text-xs"></i>
            </div>
          </motion.div>
        )}

        {/* Quest Island Speech Bubble */}
        {showMessage && currentMessage && (
          <motion.div
            className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white/95 text-gray-800 text-xs px-4 py-2 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20 whitespace-nowrap max-w-48"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <p className="font-medium leading-tight">{currentMessage}</p>
            <div className="text-xs text-gray-500 mt-1">Scout</div>
            
            {/* Speech bubble arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white/95"></div>
            </div>
          </motion.div>
        )}

        {/* Ambient sparkles around Scout */}
        <motion.div
          className="absolute -inset-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 w-1 h-1 bg-yellow-300/60 rounded-full"></div>
          <div className="absolute bottom-0 right-1/4 w-1 h-1 bg-blue-300/60 rounded-full"></div>
          <div className="absolute left-0 top-1/3 w-0.5 h-0.5 bg-purple-300/60 rounded-full"></div>
          <div className="absolute right-0 bottom-1/4 w-0.5 h-0.5 bg-green-300/60 rounded-full"></div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}