import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  position: { x: number; y: number };
  story: string;
  reward: string;
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
  
  // Fetch completed lessons from backend to sync progress
  const { data: completedLessons = [], refetch: refetchLessons } = useQuery<any[]>({
    queryKey: [`/api/lesson-completions/demo-student`],
    enabled: true,
    refetchInterval: 1000, // Refresh every 1 second to catch new completions faster
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Add temporary local state to track completions until backend issues are resolved
  const [localCompletions, setLocalCompletions] = useState<string[]>(() => {
    const stored = localStorage.getItem('quest-island-completions');
    return stored ? JSON.parse(stored) : [];
  });

  // Sync Quest Island progress with backend completion data + local fallback
  useEffect(() => {
    console.log('Completed lessons from backend:', completedLessons); // Debug log
    console.log('Local completions:', localCompletions); // Debug log
    
    const newProgress = { ...lessonProgress };
    const lessonOrder = ["beach-1", "beach-2", "beach-3", "jungle-1", "jungle-2", "jungle-3", "volcano-1", "volcano-2", "volcano-3", "lagoon-1", "lagoon-2", "lagoon-3"];
    
    // Reset progress to default state first
    lessonOrder.forEach((id, index) => {
      newProgress[id] = { completed: false, locked: index !== 0 };
    });
    
    // Mark completed lessons from backend data
    if (completedLessons.length > 0) {
      completedLessons.forEach(completion => {
        console.log('Processing backend completion:', completion); // Debug log
        if (completion.lessonId && newProgress[completion.lessonId]) {
          newProgress[completion.lessonId] = { completed: true, locked: false };
          
          // Unlock next lesson in sequence
          const currentIndex = lessonOrder.indexOf(completion.lessonId);
          if (currentIndex !== -1 && currentIndex < lessonOrder.length - 1) {
            const nextLessonId = lessonOrder[currentIndex + 1];
            if (newProgress[nextLessonId]) {
              newProgress[nextLessonId] = { completed: false, locked: false };
            }
          }
        }
      });
    }
    
    // ALSO mark completions from local storage (fallback during database issues)
    localCompletions.forEach(lessonId => {
      if (newProgress[lessonId]) {
        console.log('Processing local completion:', lessonId); // Debug log
        newProgress[lessonId] = { completed: true, locked: false };
        
        // Unlock next lesson in sequence
        const currentIndex = lessonOrder.indexOf(lessonId);
        if (currentIndex !== -1 && currentIndex < lessonOrder.length - 1) {
          const nextLessonId = lessonOrder[currentIndex + 1];
          if (newProgress[nextLessonId]) {
            newProgress[nextLessonId] = { completed: false, locked: false };
          }
        }
      }
    });
    
    console.log('Final lesson progress:', newProgress); // Debug log
    setLessonProgress(newProgress);
  }, [completedLessons, localCompletions]);

  // Show initial guidance when Quest Island loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setScoutMessage("Welcome to Quest Island! Click on me anytime for guidance, or try your first lesson: Counting Shells!");
      setShowScoutMessage(true);
      setTimeout(() => setShowScoutMessage(false), 6000);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Celebrate when kids return from completing a lesson
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const returnedFromLesson = urlParams.get('completed');
    if (returnedFromLesson) {
      setScoutMessage(`Amazing work on ${returnedFromLesson}! You're becoming a true explorer! 🎉`);
      setShowScoutMessage(true);
      setTimeout(() => setShowScoutMessage(false), 5000);
      
      // Immediately refetch lessons to show progress
      refetchLessons();
      
      // Clear the URL parameter
      window.history.replaceState({}, '', '/quest-island');
    }
  }, [refetchLessons]);
  
  // Interactive collectibles state with collection tracking - Simple Alto's style
  const [collectibles, setCollectibles] = useState<Collectible[]>([
    {
      id: "beach-orb",
      name: "Ocean Orb",
      description: "A crystal sphere that captures the essence of ocean waves.",
      image: "", // Using CSS styling instead
      biome: "beach",
      collected: false,
      position: { x: 15, y: 82 },
      story: "A crystal blue orb that holds the rhythm of ocean waves. When you hold it close, you can hear the gentle counting of each wave as it reaches the shore.",
      reward: "Math Focus +1"
    },
    {
      id: "jungle-gem",
      name: "Forest Gem", 
      description: "A green gem that pulses with forest life.",
      image: "", // Using CSS styling instead
      biome: "jungle",
      collected: false,
      position: { x: 38, y: 48 },
      story: "This emerald gem glows softly with the wisdom of ancient trees. It whispers the stories that leaves tell when they dance in the wind.",
      reward: "Reading Flow +1"
    },
    {
      id: "volcano-crystal",
      name: "Fire Crystal",
      description: "A warm crystal that burns with curiosity.",
      image: "", // Using CSS styling instead
      biome: "volcano",
      collected: false,
      position: { x: 85, y: 25 },
      story: "Warm to the touch, this amber crystal burns with endless curiosity. It helps brave explorers ask the right questions about how our world works.",
      reward: "Wonder Spark +1"
    },
    {
      id: "meadow-stone",
      name: "Harmony Stone",
      description: "A gentle stone that radiates peaceful energy.",
      image: "", // Using CSS styling instead
      biome: "meadow",
      collected: false,
      position: { x: 55, y: 65 },
      story: "Smooth and calming, this lavender stone brings peace to all who find it. It teaches us that wisdom grows slowly, like flowers in a garden.",
      reward: "Calm Wisdom +1"
    },
    {
      id: "lagoon-pearl",
      name: "Friendship Pearl",
      description: "A pearl that shimmers with connection.",
      image: "", // Using CSS styling instead
      biome: "lagoon",
      collected: false,
      position: { x: 70, y: 88 },
      story: "This pearl shimmers with all the colors of friendship. Found in the deepest part of the lagoon, it reminds us that learning together makes everything more beautiful.",
      reward: "Social Bond +1"
    }
  ]);
  
  const [showCollectibleStory, setShowCollectibleStory] = useState(false);
  const [currentCollectible, setCurrentCollectible] = useState<Collectible | null>(null);

  // Generate lesson nodes with current progress
  const lessonNodes: LessonNodeData[] = [
    // Beach biome (Mathematics) - Far southwest
    { id: "beach-1", title: "Counting Shells", biome: "beach", position: { x: 12, y: 78 }, completed: lessonProgress["beach-1"]?.completed || false, locked: lessonProgress["beach-1"]?.locked === undefined ? false : lessonProgress["beach-1"].locked },
    { id: "beach-2", title: "Ocean Wildlife", biome: "beach", position: { x: 18, y: 75 }, completed: lessonProgress["beach-2"]?.completed || false, locked: lessonProgress["beach-2"]?.locked === undefined ? true : lessonProgress["beach-2"].locked },
    { id: "beach-3", title: "Treasure Sorting", biome: "beach", position: { x: 22, y: 80 }, completed: lessonProgress["beach-3"]?.completed || false, locked: lessonProgress["beach-3"]?.locked === undefined ? true : lessonProgress["beach-3"].locked },
    
    // Jungle biome (Literacy) - Central west
    { id: "jungle-1", title: "Animal Sounds", biome: "jungle", position: { x: 35, y: 45 }, completed: lessonProgress["jungle-1"]?.completed || false, locked: lessonProgress["jungle-1"]?.locked === undefined ? true : lessonProgress["jungle-1"].locked },
    { id: "jungle-2", title: "Story Vines", biome: "jungle", position: { x: 42, y: 40 }, completed: lessonProgress["jungle-2"]?.completed || false, locked: lessonProgress["jungle-2"]?.locked === undefined ? true : lessonProgress["jungle-2"].locked },
    { id: "jungle-3", title: "Letter Hunt", biome: "jungle", position: { x: 48, y: 42 }, completed: lessonProgress["jungle-3"]?.completed || false, locked: lessonProgress["jungle-3"]?.locked === undefined ? true : lessonProgress["jungle-3"].locked },
    
    // Volcano biome (Science) - Far northeast  
    { id: "volcano-1", title: "Rock Formation", biome: "volcano", position: { x: 82, y: 18 }, completed: lessonProgress["volcano-1"]?.completed || false, locked: lessonProgress["volcano-1"]?.locked === undefined ? true : lessonProgress["volcano-1"].locked },
    { id: "volcano-2", title: "Heat & Cold", biome: "volcano", position: { x: 88, y: 15 }, completed: lessonProgress["volcano-2"]?.completed || false, locked: lessonProgress["volcano-2"]?.locked === undefined ? true : lessonProgress["volcano-2"].locked },
    { id: "volcano-3", title: "Color Mixing", biome: "volcano", position: { x: 85, y: 22 }, completed: lessonProgress["volcano-3"]?.completed || false, locked: lessonProgress["volcano-3"]?.locked === undefined ? true : lessonProgress["volcano-3"].locked },
    
    // Lagoon biome (Social Studies) - Southeast  
    { id: "lagoon-1", title: "Community Pond", biome: "lagoon", position: { x: 68, y: 85 }, completed: lessonProgress["lagoon-1"]?.completed || false, locked: lessonProgress["lagoon-1"]?.locked === undefined ? true : lessonProgress["lagoon-1"].locked },
    { id: "lagoon-2", title: "Helping Friends", biome: "lagoon", position: { x: 75, y: 82 }, completed: lessonProgress["lagoon-2"]?.completed || false, locked: lessonProgress["lagoon-2"]?.locked === undefined ? true : lessonProgress["lagoon-2"].locked },
    { id: "lagoon-3", title: "Island Home", biome: "lagoon", position: { x: 72, y: 88 }, completed: lessonProgress["lagoon-3"]?.completed || false, locked: lessonProgress["lagoon-3"]?.locked === undefined ? true : lessonProgress["lagoon-3"].locked }
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
  
  // Helper functions for collectible styling
  const getCollectibleStyle = (biome: string) => {
    switch(biome) {
      case 'beach': return 'bg-gradient-to-br from-blue-300 to-cyan-400';
      case 'jungle': return 'bg-gradient-to-br from-green-300 to-emerald-400';
      case 'volcano': return 'bg-gradient-to-br from-red-300 to-orange-400';
      case 'meadow': return 'bg-gradient-to-br from-pink-300 to-purple-400';
      case 'lagoon': return 'bg-gradient-to-br from-indigo-300 to-blue-400';
      default: return 'bg-gradient-to-br from-yellow-300 to-amber-400';
    }
  };

  const getCollectibleGlow = (biome: string) => {
    switch(biome) {
      case 'beach': return 'bg-cyan-200';
      case 'jungle': return 'bg-green-200';
      case 'volcano': return 'bg-orange-200';
      case 'meadow': return 'bg-purple-200';
      case 'lagoon': return 'bg-blue-200';
      default: return 'bg-yellow-200';
    }
  };

  // Handle collectible discovery
  const handleCollectibleClick = useCallback((collectible: Collectible) => {
    if (collectible.collected) return;
    
    setCollectibles(prev => 
      prev.map(c => 
        c.id === collectible.id 
          ? { ...c, collected: true }
          : c
      )
    );
    
    // Show the collectible story
    setCurrentCollectible(collectible);
    setShowCollectibleStory(true);
    
    // Scout celebrates the discovery
    setScoutMessage(`Amazing discovery! You found the ${collectible.name}! 🎉`);
    setShowScoutMessage(true);
    setTimeout(() => setShowScoutMessage(false), 3000);
  }, []);

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
            
            {/* Adventure Path with Progress */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 900">
              {/* Base Path */}
              <motion.path
                d="M 120 650 Q 250 500, 420 315 Q 580 200, 780 135 Q 900 100, 1020 135 Q 1100 160, 1050 250 Q 1000 340, 900 450 Q 800 560, 720 650 Q 640 740, 840 720"
                stroke="url(#basePathGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                transition={{ duration: 4, ease: "easeInOut" }}
              />
              
              {/* Completed Progress Path */}
              <motion.path
                d="M 120 650 Q 250 500, 420 315 Q 580 200, 780 135 Q 900 100, 1020 135 Q 1100 160, 1050 250 Q 1000 340, 900 450 Q 800 560, 720 650 Q 640 740, 840 720"
                stroke="url(#progressGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: (Object.values(lessonProgress).filter(p => p.completed).length / 12) * 1,
                  opacity: 0.9 
                }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              
              {/* Animated Sparkles along completed path */}
              {Object.values(lessonProgress).filter(p => p.completed).length > 0 && (
                <motion.path
                  d="M 120 650 Q 250 500, 420 315 Q 580 200, 780 135 Q 900 100, 1020 135 Q 1100 160, 1050 250 Q 1000 340, 900 450 Q 800 560, 720 650 Q 640 740, 840 720"
                  stroke="url(#sparkleGradient)"
                  strokeWidth="16"
                  fill="none"
                  strokeLinecap="round"
                  pathLength={(Object.values(lessonProgress).filter(p => p.completed).length / 12) * 1}
                  animate={{ 
                    opacity: [0.3, 0.8, 0.3],
                    strokeWidth: [14, 18, 14]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              
              <defs>
                <linearGradient id="basePathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#e5e7eb" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#d1d5db" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#9ca3af" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="1.0" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>

            {/* Biomes with Completion Effects */}
            {biomes.map(biome => {
              const biomeLessons = lessonNodes.filter(node => node.biome === biome.id);
              const completedInBiome = biomeLessons.filter(node => node.completed).length;
              const isUnlocked = biomeLessons.some(node => !node.locked);
              const isFullyCompleted = biomeLessons.length > 0 && biomeLessons.every(node => node.completed);
              
              return (
                <div key={biome.id} className="relative">
                  <Biome
                    {...biome}
                    onClick={() => setScoutTarget(biome.id)}
                  />
                  
                  {/* Biome completion indicator */}
                  {isUnlocked && (
                    <motion.div
                      className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full"
                      style={{
                        left: `${biome.position.x}%`,
                        top: `${biome.position.y - 15}%`,
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className={`
                        px-2 py-1 rounded-full text-xs font-bold shadow-lg
                        ${isFullyCompleted 
                          ? 'bg-green-500 text-white' 
                          : 'bg-blue-500 text-white opacity-80'
                        }
                      `}>
                        {isFullyCompleted ? '🏆' : `${completedInBiome}/${biomeLessons.length}`}
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Biome completion celebration effect */}
                  {isFullyCompleted && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        left: `${biome.position.x}%`,
                        top: `${biome.position.y}%`,
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <div className="w-32 h-32 bg-yellow-300 rounded-full opacity-20 blur-xl" />
                    </motion.div>
                  )}
                </div>
              );
            })}

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

            {/* Interactive Collectibles - Only show uncollected ones */}
            {collectibles.filter(c => !c.collected).map((collectible) => (
              <motion.div
                key={collectible.id}
                className="absolute w-6 h-6 cursor-pointer transform transition-all duration-300 hover:scale-110"
                style={{
                  left: `${collectible.position.x}%`,
                  top: `${collectible.position.y}%`,
                }}
                onClick={() => handleCollectibleClick(collectible)}
                data-testid={`collectible-${collectible.id}`}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                animate={{
                  y: [0, -6, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 2
                }}
              >
                {/* Simple geometric collectibles matching Alto's style */}
                <div className={`w-full h-full rounded-full ${getCollectibleStyle(collectible.biome)} border-2 border-white/50 shadow-lg`} />
                
                {/* Subtle glow effect */}
                <motion.div
                  className={`absolute inset-0 rounded-full ${getCollectibleGlow(collectible.biome)} opacity-60`}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.4, 0.8, 0.4]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            ))}

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

      {/* Enhanced Progress Indicator */}
      <motion.div
        className="fixed top-8 left-8 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl px-6 py-4 z-40 border border-white/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        {/* Manual Test Button for "Counting Shells" */}
        <button
          onClick={() => {
            const newCompletions = [...localCompletions];
            if (!newCompletions.includes('beach-1')) {
              newCompletions.push('beach-1');
              setLocalCompletions(newCompletions);
              localStorage.setItem('quest-island-completions', JSON.stringify(newCompletions));
              console.log('Manually marked beach-1 as completed!');
            }
          }}
          className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full text-xs hover:bg-green-600 transition-colors"
          title="Test Counting Shells Completion"
        >
          ✓
        </button>
        <div className="flex items-center space-x-4">
          <div className="text-2xl">🗺️</div>
          <div>
            <div className="text-sm font-bold text-gray-800 mb-1">Island Progress</div>
            <div className="flex items-center space-x-3">
              <div className="bg-gray-200 rounded-full h-3 w-40 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 h-3 rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(Object.values(lessonProgress).filter(p => p.completed).length / 12) * 100}%` 
                  }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                >
                  {/* Animated progress sparkle */}
                  <motion.div
                    className="absolute right-0 top-0 w-3 h-3 bg-yellow-300 rounded-full -translate-y-0.5 opacity-80"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-bold text-amber-600">
                  {Object.values(lessonProgress).filter(p => p.completed).length}
                </span>
                <span className="text-xs text-gray-500">/</span>
                <span className="text-xs text-gray-500">12</span>
                <motion.div
                  className="ml-1"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⭐
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Completion celebration */}
        {Object.values(lessonProgress).filter(p => p.completed).length === 12 && (
          <motion.div
            className="absolute -inset-2 bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 rounded-3xl opacity-30"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.div>

      {/* Scout's Backpack Button - Just the backpack image */}
      <motion.div
        className="fixed bottom-8 right-8 cursor-pointer"
        onClick={() => setShowJournal(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        data-testid="button-scout-backpack"
      >
        <img 
          src="/attached_assets/fd4dc3d1-ed79-4c91-a0b1-e71382387485_1756182003955.png"
          alt="Scout's Backpack"
          className="w-32 h-32 object-contain drop-shadow-lg hover:drop-shadow-2xl transition-all duration-300"
        />
      </motion.div>

      {/* Journey Journal Modal */}
      <AnimatePresence>
        {showJournal && (
          <JourneyJournal
            collectibles={collectibles}
            onClose={() => setShowJournal(false)}
          />
        )}
      </AnimatePresence>

      {/* Collectible Story Modal */}
      <AnimatePresence>
        {showCollectibleStory && currentCollectible && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCollectibleStory(false)}
          >
            <motion.div
              className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-md mx-4 overflow-hidden"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with collectible orb */}
              <div className="bg-gradient-to-br from-yellow-200 via-amber-100 to-orange-200 p-6 text-center">
                <motion.div
                  className="w-20 h-20 mx-auto mb-4"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", damping: 15 }}
                >
                  <div className={`w-full h-full rounded-full ${getCollectibleStyle(currentCollectible.biome)} border-4 border-white shadow-2xl`} />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {currentCollectible.name}
                </h3>
                <div className="inline-block bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  ✨ {currentCollectible.reward}
                </div>
              </div>

              {/* Story content */}
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed text-lg mb-6">
                  {currentCollectible.story}
                </p>
                
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowCollectibleStory(false)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-2xl font-medium hover:shadow-lg transition-all duration-300"
                    data-testid="button-close-story"
                  >
                    Continue Exploring! 🗺️
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}