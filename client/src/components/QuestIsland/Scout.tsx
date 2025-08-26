import { motion, useAnimation } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import type { AgeGroup } from "@/components/AgeSelector";
import { getLearnerName } from "@/utils/learnerName";

// Import Scout character images - 3 versions used throughout entire app
import explorerDefault from '@assets/image_1756014874313.png';
import explorerExcited from '@assets/scout-excited.png';
import explorerThinking from '@assets/scout-thinking.png';

interface ScoutProps {
  position: { x: number; y: number };
  target?: string | null;
  onReachTarget?: () => void;
  ageGroup?: AgeGroup;
  currentBiome?: string;
}

type ScoutMood = 'neutral' | 'excited' | 'thinking';

export function Scout({ position, target, onReachTarget, ageGroup = "pre-primary", currentBiome }: ScoutProps) {
  const controls = useAnimation();
  const [scoutMood, setScoutMood] = useState<ScoutMood>('neutral');
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [showMessage, setShowMessage] = useState(false);
  const [isExploring, setIsExploring] = useState(false);
  const [basePosition, setBasePosition] = useState({ x: position.x, y: position.y });

  // Get Scout image based on mood - 3 versions used throughout entire app
  const getScoutImage = () => {
    switch (scoutMood) {
      case 'excited': return explorerExcited;
      case 'thinking': return explorerThinking;
      default: return explorerDefault;
    }
  };

  // Get personality-based messages for Quest Island
  const getPersonalityMessage = useCallback(() => {
    const learnerName = getLearnerName();
    const personalities = {
      "pre-primary": {
        biomeMessages: {
          beach: [`Ooh, shells! Let's count them, ${learnerName}!`, `The waves are so pretty, ${learnerName}!`, `I found something sparkly, ${learnerName}!`],
          jungle: [`So many animals to meet, ${learnerName}!`, `What sounds do they make, ${learnerName}?`, `Look at all these leaves, ${learnerName}!`],
          volcano: [`Wow, it's warm here, ${learnerName}!`, `Pretty orange colors, ${learnerName}!`, `Let's explore safely, ${learnerName}!`],
          lagoon: [`The water is so blue, ${learnerName}!`, `Look at the fish, ${learnerName}!`, `This is magical, ${learnerName}!`],
          general: [`G'day, ${learnerName}! Ready to explore?`, `This is so exciting, ${learnerName}!`, `We're going on an adventure, ${learnerName}!`]
        }
      },
      "primary": {
        biomeMessages: {
          beach: [`I wonder how many shells we can find, ${learnerName}?`, `The waves follow patterns, ${learnerName}!`, `Let's investigate this treasure, ${learnerName}!`],
          jungle: [`There's so much to discover here, ${learnerName}!`, `I hear different bird calls, ${learnerName}!`, `Each leaf is unique, ${learnerName}!`],
          volcano: [`The rocks tell a story, ${learnerName}!`, `I can feel the warmth, ${learnerName}!`, `Science happens here, ${learnerName}!`],
          lagoon: [`This ecosystem is amazing, ${learnerName}!`, `The water connects everything, ${learnerName}!`, `Perfect for reflection, ${learnerName}!`],
          general: [`Ready for our next discovery, ${learnerName}?`, `We make a great exploring team, ${learnerName}!`, `What should we learn today, ${learnerName}?`]
        }
      },
      "upper-primary": {
        biomeMessages: {
          beach: [`Each tide brings new mathematical patterns, ${learnerName}`, `Coastal ecosystems are fascinating, ${learnerName}`, `Let's study these formations, ${learnerName}`],
          jungle: [`Biodiversity creates complex systems, ${learnerName}`, `Every sound has meaning here, ${learnerName}`, `The relationships are intricate, ${learnerName}`],
          volcano: [`Geological processes shape our world, ${learnerName}`, `Heat creates transformation, ${learnerName}`, `Science in action, ${learnerName}!`],
          lagoon: [`Interconnected waterways support life, ${learnerName}`, `Clear thinking comes from still waters, ${learnerName}`, `Perfect for deep learning, ${learnerName}`],
          general: [`Our learning journey continues, ${learnerName}`, `Each challenge builds our skills, ${learnerName}`, `Ready to explore systematically, ${learnerName}?`]
        }
      }
    };
    
    const personality = personalities[ageGroup];
    const messages = currentBiome ? personality.biomeMessages[currentBiome as keyof typeof personality.biomeMessages] : personality.biomeMessages.general;
    return messages[Math.floor(Math.random() * messages.length)];
  }, [ageGroup, currentBiome]);

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

  // Curious exploration behavior - Scout wanders around when idle
  useEffect(() => {
    if (!target && !showMessage && !isExploring) {
      const exploreInterval = setInterval(() => {
        // Scout occasionally explores nearby areas
        if (Math.random() > 0.6) {
          setIsExploring(true);
          setScoutMood('thinking');
          
          // Small random movement within a radius
          const randomX = basePosition.x + (Math.random() - 0.5) * 8;
          const randomY = basePosition.y + (Math.random() - 0.5) * 6;
          
          // Keep Scout within reasonable bounds
          const boundedX = Math.max(10, Math.min(90, randomX));
          const boundedY = Math.max(15, Math.min(85, randomY));
          
          controls.start({
            x: boundedX + "%",
            y: boundedY + "%",
            transition: { 
              duration: 3 + Math.random() * 2, // Vary exploration speed
              ease: "easeInOut"
            }
          }).then(() => {
            // Return to base position
            setTimeout(() => {
              controls.start({
                x: basePosition.x + "%",
                y: basePosition.y + "%",
                transition: { duration: 2, ease: "easeInOut" }
              }).then(() => {
                setIsExploring(false);
                setScoutMood('neutral');
              });
            }, 1000 + Math.random() * 2000); // Pause at exploration spot
          });
        }
      }, 15000 + Math.random() * 10000); // Explore every 15-25 seconds

      return () => clearInterval(exploreInterval);
    }
  }, [target, showMessage, isExploring, basePosition, controls]);

  // Periodic friendly messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      if (!target && !showMessage && !isExploring) {
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
  }, [target, showMessage, isExploring, getPersonalityMessage]);
  
  // Update base position when target changes
  useEffect(() => {
    if (target) {
      setBasePosition({ x: position.x, y: position.y });
    }
  }, [position, target]);

  return (
    <motion.div
      className="absolute z-20"
      style={{ 
        left: `calc(${position.x}% - 32px)`, 
        top: `calc(${position.y}% - 32px)`
      }}
      animate={controls}
      data-testid="scout-character"
    >
      {/* Scout Character */}
      <motion.div
        className="relative w-16 h-16"
        animate={scoutMood === 'excited' ? {
          y: [0, -4, 0]
        } : scoutMood === 'thinking' ? {
          y: [0, -2, 0]
        } : {
          y: [0, -2, 0]
        }}
        transition={{ 
          duration: scoutMood === 'excited' ? 2.5 : scoutMood === 'thinking' ? 3.5 : 4, 
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
          
          {/* Subtle glow effect - removed to prevent blur */}
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

        {/* Ambient sparkles around Scout - Enhanced for different moods */}
        <motion.div
          className="absolute -inset-2"
          animate={{ 
            rotate: 360
          }}
          transition={{ 
            rotate: { duration: scoutMood === 'excited' ? 15 : 20, repeat: Infinity, ease: "linear" }
          }}
        >
          <motion.div 
            className="absolute top-0 left-1/2 w-1 h-1 bg-yellow-300/60 rounded-full"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 right-1/4 w-1 h-1 bg-blue-300/60 rounded-full"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <motion.div 
            className="absolute left-0 top-1/3 w-0.5 h-0.5 bg-purple-300/60 rounded-full"
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div 
            className="absolute right-0 bottom-1/4 w-0.5 h-0.5 bg-green-300/60 rounded-full"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
          
          {/* Extra sparkles when excited */}
          {scoutMood === 'excited' && (
            <>
              <motion.div 
                className="absolute top-1/4 right-1/2 w-1 h-1 bg-orange-300/70 rounded-full"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-pink-300/70 rounded-full"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              />
            </>
          )}
        </motion.div>
        
        {/* Curious exploring indicator */}
        {isExploring && (
          <motion.div
            className="absolute -top-3 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              y: [0, -5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-xs">🔍</div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}