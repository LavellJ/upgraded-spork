import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [showJournal, setShowJournal] = useState(false);
  const [scoutPosition, setScoutPosition] = useState({ x: 15, y: 80 });
  const [scoutTarget, setScoutTarget] = useState<string | null>(null);
  
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

  const lessonNodes: LessonNodeData[] = [
    // Beach biome (Mathematics)
    { id: "beach-1", title: "Counting Shells", biome: "beach", position: { x: 20, y: 75 }, completed: false, locked: false },
    { id: "beach-2", title: "Wave Patterns", biome: "beach", position: { x: 25, y: 70 }, completed: false, locked: true },
    { id: "beach-3", title: "Treasure Sorting", biome: "beach", position: { x: 30, y: 72 }, completed: false, locked: true },
    
    // Jungle biome (Literacy)
    { id: "jungle-1", title: "Animal Sounds", biome: "jungle", position: { x: 45, y: 60 }, completed: false, locked: true },
    { id: "jungle-2", title: "Story Vines", biome: "jungle", position: { x: 50, y: 55 }, completed: false, locked: true },
    { id: "jungle-3", title: "Letter Hunt", biome: "jungle", position: { x: 55, y: 58 }, completed: false, locked: true },
    
    // Volcano biome (Science)
    { id: "volcano-1", title: "Rock Formation", biome: "volcano", position: { x: 70, y: 40 }, completed: false, locked: true },
    { id: "volcano-2", title: "Heat & Cold", biome: "volcano", position: { x: 75, y: 35 }, completed: false, locked: true },
    { id: "volcano-3", title: "Color Mixing", biome: "volcano", position: { x: 80, y: 38 }, completed: false, locked: true },
    
    // Lagoon biome (Social Studies)
    { id: "lagoon-1", title: "Community Pond", biome: "lagoon", position: { x: 60, y: 80 }, completed: false, locked: true },
    { id: "lagoon-2", title: "Helping Friends", biome: "lagoon", position: { x: 65, y: 75 }, completed: false, locked: true },
    { id: "lagoon-3", title: "Island Home", biome: "lagoon", position: { x: 70, y: 78 }, completed: false, locked: true }
  ];

  const handleLessonComplete = (lessonId: string) => {
    // Update lesson completion and unlock next lessons
    console.log("Lesson completed:", lessonId);
  };

  const biomes = [
    {
      id: "beach",
      name: "Seashell Beach",
      subject: "Mathematics",
      position: { x: 15, y: 65 },
      color: "from-amber-200 to-orange-200",
      description: "Where numbers dance with the waves"
    },
    {
      id: "jungle",
      name: "Whisper Woods", 
      subject: "Literacy",
      position: { x: 40, y: 45 },
      color: "from-emerald-300 to-green-400",
      description: "Stories grow on every tree"
    },
    {
      id: "volcano",
      name: "Ember Peak",
      subject: "Science", 
      position: { x: 70, y: 25 },
      color: "from-red-300 to-orange-400",
      description: "Discover how the world works"
    },
    {
      id: "lagoon",
      name: "Crystal Lagoon",
      subject: "Social Studies",
      position: { x: 55, y: 70 },
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
          <div className="relative w-[800px] h-[600px]">
            
            {/* Island Shape */}
            <div className="absolute inset-0 bg-gradient-to-br from-sand-200 via-sand-100 to-green-200 rounded-full opacity-90 transform rotate-12 scale-110" />
            
            {/* Glowing Path */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600">
              <motion.path
                d="M 120 480 Q 200 400, 300 350 Q 400 300, 500 280 Q 600 260, 680 200 Q 720 180, 750 220 Q 780 260, 720 320 Q 660 380, 600 420 Q 540 460, 480 480"
                stroke="url(#pathGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 3, ease: "easeInOut" }}
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
                onClick={() => {
                  if (!node.locked) {
                    onLessonSelect(node.id);
                  }
                }}
              />
            ))}

            {/* Scout Character */}
            <Scout 
              position={scoutPosition}
              target={scoutTarget}
              onReachTarget={() => setScoutTarget(null)}
              ageGroup="pre-primary"
              currentBiome={scoutTarget}
            />

            {/* Ambient Elements */}
            <motion.div
              className="absolute top-32 left-80 w-3 h-3 bg-yellow-300 rounded-full opacity-70"
              animate={{ 
                y: [0, -10, 0],
                opacity: [0.4, 0.8, 0.4],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <motion.div
              className="absolute bottom-40 right-32 w-2 h-2 bg-purple-300 rounded-full opacity-60"
              animate={{ 
                y: [0, -15, 0],
                x: [0, 5, 0],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </div>
        </div>
      </div>

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