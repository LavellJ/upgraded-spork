import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Scout } from "./Scout";
import { Biome } from "./Biome";
import { JourneyJournal } from "./JourneyJournal";
import { LessonNode } from "./LessonNode";
import explorerDefault from '@assets/image_1756014874313.png';
import explorerThinking from '@assets/scout-thinking.png';

export interface Collectible {
  id: string;
  name: string;
  description: string;
  image: string;
  biome: string;
  collected: boolean;
}

export interface LessonNodeData {
  id: string;
  title: string;
  biome: string;
  position: { x: number; y: number };
  completed: boolean;
  locked: boolean;
}

interface QuestIslandProps {
  onLessonSelect: (lessonId: string) => void;
}

export function QuestIsland({ onLessonSelect }: QuestIslandProps) {
  const [, setLocation] = useLocation();
  const [showJournal, setShowJournal] = useState(false);
  const [scoutPosition, setScoutPosition] = useState({ x: 8, y: 85 });
  const [scoutTarget, setScoutTarget] = useState<string | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, { completed: boolean; locked: boolean }>>(() => {
    // Initialize with first lesson unlocked
    const initialProgress: Record<string, { completed: boolean; locked: boolean }> = {};
    const lessonIds = ["beach-1", "beach-2", "beach-3", "jungle-1", "jungle-2", "jungle-3", "volcano-1", "volcano-2", "volcano-3", "lagoon-1", "lagoon-2", "lagoon-3"];
    lessonIds.forEach((id, index) => {
      initialProgress[id] = { completed: false, locked: index !== 0 }; // Only first lesson unlocked
    });
    return initialProgress;
  });
  const [scoutMessage, setScoutMessage] = useState<string>("");
  const [showScoutMessage, setShowScoutMessage] = useState(false);
  
  // Show initial guidance when Quest Island loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setScoutMessage("Welcome to Quest Island! Click on me anytime for guidance, or try your first lesson: Counting Shells!");
      setShowScoutMessage(true);
      setTimeout(() => setShowScoutMessage(false), 6000);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const collectibles: Collectible[] = [
    {
      id: "seashell",
      name: "Seashell of Curiosity",
      description: "Represents curiosity and the start of the learning journey.",
      image: "/attached_assets/generated_images/Seashell_of_Curiosity_collectible_a28580d3.png",
      biome: "beach",
      collected: false
    },
    {
      id: "leaf",
      name: "Leaf of Discovery", 
      description: "Discovery and growth through learning.",
      image: "/attached_assets/generated_images/Leaf_of_Discovery_collectible_143c8fae.png",
      biome: "jungle",
      collected: false
    },
    {
      id: "ember",
      name: "Ember of Courage",
      description: "Represents bravery when tackling harder lessons.",
      image: "/attached_assets/generated_images/Ember_of_Courage_collectible_e0c2926b.png",
      biome: "volcano",
      collected: false
    },
    {
      id: "blossom",
      name: "Blossom of Wisdom",
      description: "Wisdom earned through completing lessons.",
      image: "/attached_assets/generated_images/Blossom_of_Wisdom_collectible_be1aafdf.png",
      biome: "meadow",
      collected: false
    },
    {
      id: "moonstone",
      name: "Moonstone of Mastery",
      description: "Mastery of a subject or finishing a quest.",
      image: "/attached_assets/generated_images/Moonstone_of_Mastery_collectible_b09d1d33.png",
      biome: "lagoon",
      collected: false
    }
  ];

  // Generate lesson nodes with current progress
  const lessonNodes: LessonNodeData[] = [
    // Beach biome (Mathematics) - Far southwest
    { id: "beach-1", title: "Counting Shells", biome: "beach", position: { x: 12, y: 78 }, completed: lessonProgress["beach-1"]?.completed || false, locked: lessonProgress["beach-1"]?.locked || false },
    { id: "beach-2", title: "Wave Patterns", biome: "beach", position: { x: 18, y: 75 }, completed: lessonProgress["beach-2"]?.completed || false, locked: lessonProgress["beach-2"]?.locked || true },
    { id: "beach-3", title: "Treasure Sorting", biome: "beach", position: { x: 22, y: 80 }, completed: lessonProgress["beach-3"]?.completed || false, locked: lessonProgress["beach-3"]?.locked || true },
    
    // Jungle biome (Literacy) - Central west
    { id: "jungle-1", title: "Animal Sounds", biome: "jungle", position: { x: 35, y: 45 }, completed: lessonProgress["jungle-1"]?.completed || false, locked: lessonProgress["jungle-1"]?.locked || true },
    { id: "jungle-2", title: "Story Vines", biome: "jungle", position: { x: 42, y: 40 }, completed: lessonProgress["jungle-2"]?.completed || false, locked: lessonProgress["jungle-2"]?.locked || true },
    { id: "jungle-3", title: "Letter Hunt", biome: "jungle", position: { x: 48, y: 42 }, completed: lessonProgress["jungle-3"]?.completed || false, locked: lessonProgress["jungle-3"]?.locked || true },
    
    // Volcano biome (Science) - Far northeast  
    { id: "volcano-1", title: "Rock Formation", biome: "volcano", position: { x: 82, y: 18 }, completed: lessonProgress["volcano-1"]?.completed || false, locked: lessonProgress["volcano-1"]?.locked || true },
    { id: "volcano-2", title: "Heat & Cold", biome: "volcano", position: { x: 88, y: 15 }, completed: lessonProgress["volcano-2"]?.completed || false, locked: lessonProgress["volcano-2"]?.locked || true },
    { id: "volcano-3", title: "Color Mixing", biome: "volcano", position: { x: 85, y: 22 }, completed: lessonProgress["volcano-3"]?.completed || false, locked: lessonProgress["volcano-3"]?.locked || true },
    
    // Lagoon biome (Social Studies) - Southeast  
    { id: "lagoon-1", title: "Community Pond", biome: "lagoon", position: { x: 68, y: 85 }, completed: lessonProgress["lagoon-1"]?.completed || false, locked: lessonProgress["lagoon-1"]?.locked || true },
    { id: "lagoon-2", title: "Helping Friends", biome: "lagoon", position: { x: 75, y: 82 }, completed: lessonProgress["lagoon-2"]?.completed || false, locked: lessonProgress["lagoon-2"]?.locked || true },
    { id: "lagoon-3", title: "Island Home", biome: "lagoon", position: { x: 72, y: 88 }, completed: lessonProgress["lagoon-3"]?.completed || false, locked: lessonProgress["lagoon-3"]?.locked || true }
  ];

  const handleLessonComplete = useCallback((lessonId: string) => {
    setLessonProgress(prev => {
      const newProgress = { ...prev };
      newProgress[lessonId] = { completed: true, locked: false };
      
      // Unlock next lesson in sequence
      const lessonOrder = ["beach-1", "beach-2", "beach-3", "jungle-1", "jungle-2", "jungle-3", "volcano-1", "volcano-2", "volcano-3", "lagoon-1", "lagoon-2", "lagoon-3"];
      const currentIndex = lessonOrder.indexOf(lessonId);
      if (currentIndex !== -1 && currentIndex < lessonOrder.length - 1) {
        const nextLessonId = lessonOrder[currentIndex + 1];
        newProgress[nextLessonId] = { completed: false, locked: false };
      }
      
      return newProgress;
    });
    
    // Scout celebrates!
    setScoutMessage("Amazing work! You're becoming a real explorer!");
    setShowScoutMessage(true);
    setTimeout(() => setShowScoutMessage(false), 4000);
  }, []);
  
  const handleLessonClick = useCallback((lessonId: string) => {
    const lesson = lessonProgress[lessonId];
    if (lesson?.locked) {
      setScoutMessage("Complete the previous lessons first! I'll guide you there.");
      setShowScoutMessage(true);
      setTimeout(() => setShowScoutMessage(false), 3000);
      return;
    }
    
    // Navigate to learning activity
    setLocation(`/learning?topic=${lessonId}`);
    onLessonSelect?.(lessonId);
  }, [lessonProgress, setLocation, onLessonSelect]);
  
  const getNextSuggestedLesson = useCallback(() => {
    const lessonOrder = ["beach-1", "beach-2", "beach-3", "jungle-1", "jungle-2", "jungle-3", "volcano-1", "volcano-2", "volcano-3", "lagoon-1", "lagoon-2", "lagoon-3"];
    return lessonOrder.find(id => !lessonProgress[id]?.completed && !lessonProgress[id]?.locked);
  }, [lessonProgress]);
  
  const handleScoutClick = useCallback(() => {
    const nextLesson = getNextSuggestedLesson();
    const lessonTitles: Record<string, string> = {
      "beach-1": "Counting Shells", "beach-2": "Wave Patterns", "beach-3": "Treasure Sorting",
      "jungle-1": "Animal Sounds", "jungle-2": "Story Vines", "jungle-3": "Letter Hunt",
      "volcano-1": "Rock Formation", "volcano-2": "Heat & Cold", "volcano-3": "Color Mixing",
      "lagoon-1": "Community Pond", "lagoon-2": "Helping Friends", "lagoon-3": "Island Home"
    };
    
    if (nextLesson) {
      setScoutMessage(`Ready for an adventure? Try "${lessonTitles[nextLesson]}" next!`);
      // Move Scout to suggest the next lesson
      const lessonPositions: Record<string, { x: number; y: number }> = {
        "beach-1": { x: 12, y: 78 }, "beach-2": { x: 18, y: 75 }, "beach-3": { x: 22, y: 80 },
        "jungle-1": { x: 35, y: 45 }, "jungle-2": { x: 42, y: 40 }, "jungle-3": { x: 48, y: 42 },
        "volcano-1": { x: 82, y: 18 }, "volcano-2": { x: 88, y: 15 }, "volcano-3": { x: 85, y: 22 },
        "lagoon-1": { x: 68, y: 85 }, "lagoon-2": { x: 75, y: 82 }, "lagoon-3": { x: 72, y: 88 }
      };
      const targetPosition = lessonPositions[nextLesson];
      if (targetPosition) {
        setScoutPosition({ x: targetPosition.x - 5, y: targetPosition.y - 8 });
      }
    } else {
      setScoutMessage("Wow! You've completed all the lessons! You're a true explorer!");
    }
    
    setShowScoutMessage(true);
    setTimeout(() => setShowScoutMessage(false), 5000);
  }, [getNextSuggestedLesson]);

  const biomes = [
    {
      id: "beach",
      name: "Seashell Beach",
      subject: "Mathematics",
      position: { x: 10, y: 72 }, // Far southwest corner
      color: "from-amber-200 to-orange-200",
      description: "Where numbers dance with the waves"
    },
    {
      id: "jungle",
      name: "Whisper Woods", 
      subject: "Literacy",
      position: { x: 35, y: 35 }, // Central-west
      color: "from-emerald-300 to-green-400",
      description: "Stories grow on every tree"
    },
    {
      id: "volcano",
      name: "Ember Peak",
      subject: "Science", 
      position: { x: 85, y: 15 }, // Far northeast peak
      color: "from-red-300 to-orange-400",
      description: "Discover how the world works"
    },
    {
      id: "lagoon",
      name: "Crystal Lagoon",
      subject: "Social Studies",
      position: { x: 70, y: 80 }, // Southeast waters
      color: "from-cyan-200 to-blue-300", 
      description: "Learn about our world together"
    }
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-sky-200 via-blue-100 to-sand-100">
      {/* Floating Clouds */}
      <motion.div
        className="absolute top-10 left-10 w-32 h-16 bg-white/40 rounded-full blur-sm"
        animate={{ x: [0, 20, 0], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-20 right-20 w-24 h-12 bg-white/30 rounded-full blur-sm"
        animate={{ x: [0, -15, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Quest Island Map Container */}
      <div className="relative w-full h-full">
        
        {/* Island Base */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[1200px] h-[900px]">
            
            {/* Island Shape */}
            <div className="absolute inset-0 bg-gradient-to-br from-sand-200 via-sand-100 to-green-200 rounded-full opacity-90 transform rotate-12 scale-110" />
            
            {/* Glowing Path */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 900">
              <motion.path
                d="M 120 650 Q 250 500, 420 315 Q 580 200, 780 135 Q 900 100, 1020 135 Q 1100 160, 1050 250 Q 1000 340, 900 450 Q 800 560, 720 650 Q 640 740, 840 720"
                stroke="url(#pathGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 4, ease: "easeInOut" }}
              />
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
                </linearGradient>
              </defs>
            </svg>

            {/* Biomes */}
            {biomes.map(biome => (
              <Biome
                key={biome.id}
                {...biome}
                onClick={() => setScoutTarget(biome.id)}
              />
            ))}

            {/* Lesson Nodes */}
            {lessonNodes.map(node => (
              <LessonNode
                key={node.id}
                {...node}
                onClick={() => handleLessonClick(node.id)}
              />
            ))}

            {/* Scout Character - Now Clickable for Guidance */}
            <div
              className="cursor-pointer"
              onClick={handleScoutClick}
              data-testid="scout-clickable"
            >
              <Scout 
                position={scoutPosition}
                target={scoutTarget}
                onReachTarget={() => setScoutTarget(null)}
                ageGroup="pre-primary"
                currentBiome={scoutTarget}
              />
            </div>
            
            {/* Scout Guidance Message */}
            {showScoutMessage && scoutMessage && (
              <motion.div
                className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white/95 text-gray-800 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20 max-w-md z-50"
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <div className="flex items-start space-x-4 p-6">
                  {/* Scout Image - Use thinking image for guidance */}
                  <div className="flex-shrink-0">
                    <img
                      src={explorerThinking}
                      alt="Scout"
                      className="w-16 h-16 object-contain drop-shadow-lg"
                    />
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-1 text-left">
                    <p className="font-medium leading-tight text-lg">{scoutMessage}</p>
                    <div className="text-sm text-gray-500 mt-2">Click me for guidance!</div>
                  </div>
                </div>
                
                {/* Speech bubble arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                  <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-white/95"></div>
                </div>
              </motion.div>
            )}

            {/* Ambient Elements - Spread across the epic journey */}
            <motion.div
              className="absolute top-48 left-96 w-3 h-3 bg-yellow-300 rounded-full opacity-70"
              animate={{ 
                y: [0, -10, 0],
                opacity: [0.4, 0.8, 0.4],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <motion.div
              className="absolute bottom-80 right-48 w-2 h-2 bg-purple-300 rounded-full opacity-60"
              animate={{ 
                y: [0, -15, 0],
                x: [0, 5, 0],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            
            <motion.div
              className="absolute top-24 right-64 w-2 h-2 bg-blue-300 rounded-full opacity-50"
              animate={{ 
                y: [0, -8, 0],
                x: [0, -3, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
            
            <motion.div
              className="absolute left-48 top-96 w-1 h-1 bg-green-300 rounded-full opacity-60"
              animate={{ 
                y: [0, -12, 0],
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.3, 1]
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            
            <motion.div
              className="absolute top-60 left-72 w-1.5 h-1.5 bg-orange-300 rounded-full opacity-40"
              animate={{ 
                y: [0, -6, 0],
                rotate: [0, 180, 360],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            />
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <motion.div
        className="fixed top-8 left-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg px-4 py-3 z-40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="text-sm font-medium text-gray-700 mb-1">Learning Progress</div>
        <div className="flex items-center space-x-2">
          <div className="bg-gray-200 rounded-full h-2 w-32">
            <motion.div
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ 
                width: `${(Object.values(lessonProgress).filter(p => p.completed).length / 12) * 100}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs text-gray-600">
            {Object.values(lessonProgress).filter(p => p.completed).length}/12
          </span>
        </div>
      </motion.div>

      {/* Journey Journal Button */}
      <motion.button
        className="fixed bottom-8 right-8 bg-gradient-to-br from-purple-400 to-indigo-500 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={() => setShowJournal(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        data-testid="button-journey-journal"
      >
        <i className="fas fa-book-open mr-2"></i>
        Journey Journal
      </motion.button>

      {/* Journey Journal Modal */}
      <AnimatePresence>
        {showJournal && (
          <JourneyJournal
            collectibles={collectibles}
            onClose={() => setShowJournal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}