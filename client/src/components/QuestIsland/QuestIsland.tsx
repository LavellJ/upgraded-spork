import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { Scout } from "./Scout";
import { Biome } from "./Biome";
import { JourneyJournal } from "./JourneyJournal";
import { LessonNode } from "./LessonNode";

export interface Collectible {
  id: string;
  name: string;
  description: string;
  image: string;
  biome: string;
  collected: boolean;
  position: { x: number; y: number };
}

export interface LessonNodeData {
  id: string;
  title: string;
  biome: string;
  position: { x: number; y: number };
  completed: boolean;
  locked: boolean;
  inProgress?: boolean;
  progress?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedMinutes?: number;
  prerequisite?: string;
}

interface QuestIslandProps {
  onLessonSelect: (lessonId: string) => void;
}

export function QuestIsland({ onLessonSelect }: QuestIslandProps) {
  const [showJournal, setShowJournal] = useState(false);
  const [scoutPosition, setScoutPosition] = useState({ x: 8, y: 85 });
  const [scoutTarget, setScoutTarget] = useState<string | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, { completed: boolean; inProgress: boolean; progress: number }>>({});
  const [collectedItems, setCollectedItems] = useState<Set<string>>(new Set());
  const [recentCollection, setRecentCollection] = useState<string | null>(null);
  
  // Enhanced collectibles with interactive positions across the epic island  
  const baseCollectibles: Collectible[] = [
    {
      id: "seashell",
      name: "Seashell of Curiosity",
      description: "Represents curiosity and the start of the learning journey.",
      image: "/attached_assets/generated_images/Seashell_of_Curiosity_collectible_a28580d3.png",
      biome: "beach",
      collected: false,
      position: { x: 20, y: 70 }
    },
    {
      id: "leaf",
      name: "Leaf of Discovery", 
      description: "Discovery and growth through learning.",
      image: "/attached_assets/generated_images/Leaf_of_Discovery_collectible_143c8fae.png",
      biome: "jungle",
      collected: false,
      position: { x: 38, y: 48 }
    },
    {
      id: "ember",
      name: "Ember of Courage",
      description: "Represents bravery when tackling harder lessons.",
      image: "/attached_assets/generated_images/Ember_of_Courage_collectible_e0c2926b.png",
      biome: "volcano",
      collected: false,
      position: { x: 80, y: 25 }
    },
    {
      id: "blossom",
      name: "Blossom of Wisdom",
      description: "Wisdom earned through completing lessons.",
      image: "/attached_assets/generated_images/Blossom_of_Wisdom_collectible_be1aafdf.png",
      biome: "meadow", 
      collected: false,
      position: { x: 55, y: 35 }
    },
    {
      id: "moonstone",
      name: "Moonstone of Mastery",
      description: "Mastery of a subject or finishing a quest.",
      image: "/attached_assets/generated_images/Moonstone_of_Mastery_collectible_b09d1d33.png",
      biome: "lagoon",
      collected: false,
      position: { x: 65, y: 78 }
    }
  ];

  // Apply collection status to collectibles
  const collectibles = baseCollectibles.map(item => ({
    ...item,
    collected: collectedItems.has(item.id)
  }));

  // Handle collectible collection with celebration
  const handleCollectItem = (collectibleId: string) => {
    if (!collectedItems.has(collectibleId)) {
      setCollectedItems(prev => new Set([...prev, collectibleId]));
      setRecentCollection(collectibleId);
      
      // Clear recent collection after animation
      setTimeout(() => setRecentCollection(null), 2000);
      
      // Scout gets excited about the collection
      const collectible = collectibles.find(c => c.id === collectibleId);
      if (collectible) {
        setScoutTarget(collectible.biome);
      }
      
      console.log("Collected:", collectibleId);
    }
  };

  // Enhanced lesson data with progression and details
  const baseLessons: LessonNodeData[] = [
    // Beach biome (Mathematics) - Far southwest - Starting point
    { id: "beach-1", title: "Counting Shells", biome: "beach", position: { x: 12, y: 78 }, completed: false, locked: false, difficulty: 'easy', estimatedMinutes: 3 },
    { id: "beach-2", title: "Wave Patterns", biome: "beach", position: { x: 18, y: 75 }, completed: false, locked: true, difficulty: 'medium', estimatedMinutes: 5, prerequisite: "Counting Shells" },
    { id: "beach-3", title: "Treasure Sorting", biome: "beach", position: { x: 22, y: 80 }, completed: false, locked: true, difficulty: 'medium', estimatedMinutes: 7, prerequisite: "Wave Patterns" },
    
    // Jungle biome (Literacy) - Central west - Unlocks after beach-1
    { id: "jungle-1", title: "Animal Sounds", biome: "jungle", position: { x: 35, y: 45 }, completed: false, locked: true, difficulty: 'easy', estimatedMinutes: 4, prerequisite: "Counting Shells" },
    { id: "jungle-2", title: "Story Vines", biome: "jungle", position: { x: 42, y: 40 }, completed: false, locked: true, difficulty: 'medium', estimatedMinutes: 8, prerequisite: "Animal Sounds" },
    { id: "jungle-3", title: "Letter Hunt", biome: "jungle", position: { x: 48, y: 42 }, completed: false, locked: true, difficulty: 'hard', estimatedMinutes: 10, prerequisite: "Story Vines" },
    
    // Volcano biome (Science) - Far northeast - Unlocks after 2 completed lessons
    { id: "volcano-1", title: "Rock Formation", biome: "volcano", position: { x: 82, y: 18 }, completed: false, locked: true, difficulty: 'medium', estimatedMinutes: 6, prerequisite: "Complete 2 lessons" },
    { id: "volcano-2", title: "Heat & Cold", biome: "volcano", position: { x: 88, y: 15 }, completed: false, locked: true, difficulty: 'medium', estimatedMinutes: 8, prerequisite: "Rock Formation" },
    { id: "volcano-3", title: "Color Mixing", biome: "volcano", position: { x: 85, y: 22 }, completed: false, locked: true, difficulty: 'hard', estimatedMinutes: 12, prerequisite: "Heat & Cold" },
    
    // Lagoon biome (Social Studies) - Southeast - Final challenge area
    { id: "lagoon-1", title: "Community Pond", biome: "lagoon", position: { x: 68, y: 85 }, completed: false, locked: true, difficulty: 'easy', estimatedMinutes: 5, prerequisite: "Complete 4 lessons" },
    { id: "lagoon-2", title: "Helping Friends", biome: "lagoon", position: { x: 75, y: 82 }, completed: false, locked: true, difficulty: 'hard', estimatedMinutes: 15, prerequisite: "Community Pond" },
    { id: "lagoon-3", title: "Island Home", biome: "lagoon", position: { x: 72, y: 88 }, completed: false, locked: true, difficulty: 'hard', estimatedMinutes: 20, prerequisite: "Helping Friends" }
  ];

  // Apply progression logic to determine which lessons are unlocked
  const lessonNodes = useMemo(() => {
    const completedCount = Object.values(lessonProgress).filter(p => p.completed).length;
    
    return baseLessons.map(lesson => {
      const progressData = lessonProgress[lesson.id] || { completed: false, inProgress: false, progress: 0 };
      
      // Determine if lesson should be unlocked
      let unlocked = !lesson.locked; // beach-1 starts unlocked
      
      if (lesson.prerequisite) {
        if (lesson.prerequisite === "Complete 2 lessons") {
          unlocked = completedCount >= 2;
        } else if (lesson.prerequisite === "Complete 4 lessons") {
          unlocked = completedCount >= 4;
        } else {
          // Find prerequisite lesson by title
          const prereqLesson = baseLessons.find(l => l.title === lesson.prerequisite);
          if (prereqLesson) {
            const prereqProgress = lessonProgress[prereqLesson.id];
            unlocked = prereqProgress?.completed || false;
          }
        }
      }
      
      return {
        ...lesson,
        completed: progressData.completed,
        locked: !unlocked,
        inProgress: progressData.inProgress,
        progress: progressData.progress
      };
    });
  }, [baseLessons, lessonProgress]);

  // Enhanced lesson progression handling
  const handleLessonStart = (lessonId: string) => {
    setLessonProgress(prev => ({
      ...prev,
      [lessonId]: { 
        completed: false, 
        inProgress: true, 
        progress: 0 
      }
    }));
    
    // Navigate to lesson
    onLessonSelect(lessonId);
    console.log("Lesson started:", lessonId);
  };

  const handleLessonComplete = (lessonId: string) => {
    setLessonProgress(prev => ({
      ...prev,
      [lessonId]: { 
        completed: true, 
        inProgress: false, 
        progress: 100 
      }
    }));
    
    // Scout celebrates completion
    const lesson = lessonNodes.find(l => l.id === lessonId);
    if (lesson) {
      setScoutTarget(lesson.biome);
    }
    
    console.log("Lesson completed:", lessonId);
  };

  const updateLessonProgress = (lessonId: string, progress: number) => {
    setLessonProgress(prev => ({
      ...prev,
      [lessonId]: { 
        ...prev[lessonId],
        progress: Math.min(100, Math.max(0, progress))
      }
    }));
  };

  // Demo function to test progression - can be called from console or dev tools
  (window as any).testLessonCompletion = (lessonId: string) => {
    handleLessonComplete(lessonId);
    console.log(`Demo: Completed lesson ${lessonId}!`);
  };

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

            {/* Enhanced Lesson Nodes */}
            {lessonNodes.map(node => (
              <LessonNode
                key={node.id}
                {...node}
                onClick={() => {
                  if (!node.locked) {
                    handleLessonStart(node.id);
                  }
                }}
              />
            ))}
            
            {/* Connection Lines between lessons */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1200 900">
              {/* Beach progression line */}
              <motion.path
                d="M 144 702 Q 180 680, 216 675 Q 240 678, 264 720"
                stroke="rgba(34, 197, 94, 0.3)"
                strokeWidth="2"
                strokeDasharray="4,4"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: lessonProgress['beach-1']?.completed ? 1 : 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
              
              {/* Beach to Jungle connection */}
              <motion.path
                d="M 144 702 Q 250 550, 420 405"
                stroke="rgba(59, 130, 246, 0.3)"
                strokeWidth="2"
                strokeDasharray="4,4"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: lessonProgress['beach-1']?.completed ? 1 : 0 }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
              />
              
              {/* More connection lines can be added here */}
            </svg>

            {/* Enhanced Interactive Scout */}
            <Scout 
              position={scoutPosition}
              target={scoutTarget}
              onReachTarget={() => setScoutTarget(null)}
              ageGroup="pre-primary"
              currentBiome={scoutTarget}
              onScoutClick={() => {
                // Scout click provides contextual guidance
                console.log("Scout clicked! Providing guidance and encouragement.");
              }}
              lessonCount={Object.values(lessonProgress).filter(p => p.completed).length}
              collectibleCount={collectedItems.size}
            />

            {/* Interactive Collectibles */}
            {collectibles.map(collectible => (
              <motion.div
                key={collectible.id}
                className={`absolute cursor-pointer group ${collectible.collected ? 'pointer-events-none' : ''}`}
                style={{
                  left: collectible.position.x + "%",
                  top: collectible.position.y + "%",
                  transform: "translate(-50%, -50%)"
                }}
                onClick={() => handleCollectItem(collectible.id)}
                whileHover={!collectible.collected ? { scale: 1.2 } : {}}
                whileTap={!collectible.collected ? { scale: 0.9 } : {}}
                data-testid={`collectible-${collectible.id}`}
              >
                {!collectible.collected ? (
                  <>
                    {/* Collectible Visual */}
                    <motion.div
                      className="relative w-6 h-6 flex items-center justify-center"
                      animate={{ 
                        y: [0, -8, 0],
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: Math.random() * 2 
                      }}
                    >
                      {/* Different visual styles based on collectible type */}
                      {collectible.biome === 'beach' && (
                        <div className="w-5 h-5 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full border-2 border-white/60 shadow-lg flex items-center justify-center text-xs">🐚</div>
                      )}
                      {collectible.biome === 'jungle' && (
                        <div className="w-5 h-5 bg-gradient-to-br from-green-300 to-emerald-400 rounded-full border-2 border-white/60 shadow-lg flex items-center justify-center text-xs">🍃</div>
                      )}
                      {collectible.biome === 'volcano' && (
                        <div className="w-5 h-5 bg-gradient-to-br from-red-400 to-orange-500 rounded-full border-2 border-white/60 shadow-lg flex items-center justify-center text-xs">🔥</div>
                      )}
                      {collectible.biome === 'lagoon' && (
                        <div className="w-5 h-5 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full border-2 border-white/60 shadow-lg flex items-center justify-center text-xs">💎</div>
                      )}
                      {collectible.biome === 'meadow' && (
                        <div className="w-5 h-5 bg-gradient-to-br from-pink-300 to-purple-400 rounded-full border-2 border-white/60 shadow-lg flex items-center justify-center text-xs">🌸</div>
                      )}

                      {/* Glow effect */}
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{ 
                          boxShadow: [
                            "0 0 8px rgba(255, 255, 255, 0.4)",
                            "0 0 16px rgba(255, 255, 255, 0.6)",
                            "0 0 8px rgba(255, 255, 255, 0.4)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </motion.div>

                    {/* Hover Tooltip */}
                    <motion.div
                      className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm text-gray-800 text-xs px-3 py-2 rounded-xl shadow-xl border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 whitespace-nowrap"
                      initial={{ y: 5, scale: 0.9 }}
                      whileHover={{ y: 0, scale: 1 }}
                    >
                      <div className="font-semibold">{collectible.name}</div>
                      <div className="text-xs text-gray-600 mt-1">Click to collect!</div>
                      
                      {/* Arrow pointing up */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                        <div className="w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-white/95"></div>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  /* Collection animation */
                  recentCollection === collectible.id && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ 
                        scale: [1, 2, 0],
                        opacity: [1, 1, 0],
                        y: [0, -30, -50]
                      }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                      <div className="text-yellow-400 text-xl font-bold">+1</div>
                      <div className="absolute top-8 text-green-500 text-lg">✓</div>
                    </motion.div>
                  )
                )}
              </motion.div>
            ))}

            {/* Collection Celebration Effect */}
            {recentCollection && (
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              >
                <div className="bg-yellow-400/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl shadow-xl text-center">
                  <div className="text-lg font-bold">Collectible Found!</div>
                  <div className="text-sm opacity-90">
                    {collectibles.find(c => c.id === recentCollection)?.name}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* UI Controls */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-3">
        {/* Demo Buttons (for testing) */}
        <motion.button
          className="bg-gradient-to-br from-green-400 to-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
          onClick={() => {
            // Demo: Complete first lesson to see progression
            if (!lessonProgress['beach-1']?.completed) {
              handleLessonComplete('beach-1');
            } else if (!lessonProgress['jungle-1']?.completed) {
              handleLessonComplete('jungle-1');
            } else if (!lessonProgress['beach-2']?.completed) {
              handleLessonComplete('beach-2');
            }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          data-testid="button-demo-complete"
        >
          🎯 Demo Complete
        </motion.button>

        <motion.button
          className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
          onClick={() => {
            // Demo: Collect next available collectible
            const uncollected = collectibles.find(c => !c.collected);
            if (uncollected) {
              handleCollectItem(uncollected.id);
            }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          data-testid="button-demo-collect"
        >
          ✨ Demo Collect
        </motion.button>

        <motion.button
          className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
          onClick={() => {
            // Demo: Click Scout to see interactive messages
            const scoutElement = document.querySelector('[data-testid="scout-character"]') as HTMLElement;
            if (scoutElement) {
              scoutElement.click();
            }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          data-testid="button-demo-scout"
        >
          🤖 Click Scout
        </motion.button>

        {/* Journey Journal Button */}
        <motion.button
          className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => setShowJournal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          data-testid="button-journey-journal"
        >
          <i className="fas fa-book-open mr-2"></i>
          Journey Journal
        </motion.button>
      </div>

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