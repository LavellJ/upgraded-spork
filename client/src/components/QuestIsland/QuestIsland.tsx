import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Scout } from "./Scout";
import { Biome } from "./Biome";
import { JourneyJournal } from "./JourneyJournal";
import { LessonNode } from "./LessonNode";
import { getLearnerName } from "@/utils/learnerName";
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
    refetchInterval: 5000, // Reduce aggressive polling to 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 2000, // Consider data fresh for 2 seconds
  });

  // Add temporary local state to track completions until backend issues are resolved
  const [localCompletions, setLocalCompletions] = useState<string[]>(() => {
    const stored = localStorage.getItem('quest-island-completions');
    return stored ? JSON.parse(stored) : [];
  });

  // Sync Quest Island progress with backend completion data + local fallback
  useEffect(() => {
    // Completed lessons from backend: completedLessons
    // Local completions: localCompletions
    
    const newProgress = { ...lessonProgress };
    const lessonOrder = ["beach-1", "beach-2", "beach-3", "jungle-1", "jungle-2", "jungle-3", "volcano-1", "volcano-2", "volcano-3", "lagoon-1", "lagoon-2", "lagoon-3"];
    
    // Reset progress to default state first
    lessonOrder.forEach((id, index) => {
      newProgress[id] = { completed: false, locked: index !== 0 };
    });
    
    // Mark completed lessons from backend data
    if (completedLessons.length > 0) {
      completedLessons.forEach(completion => {
        // Processing backend completion: completion
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
        // Processing local completion: lessonId
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
    
    // Final lesson progress: newProgress
    setLessonProgress(newProgress);
  }, [completedLessons, localCompletions]);

  // Show initial guidance when Quest Island loads
  useEffect(() => {
    const timer = setTimeout(() => {
      const learnerName = getLearnerName();
      setScoutMessage(`Welcome to Quest Island, ${learnerName}! Click on me anytime for guidance, or try your first lesson: Counting Shells!`);
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
      const learnerName = getLearnerName();
      setScoutMessage(`Amazing work on ${returnedFromLesson}, ${learnerName}! You're becoming a true explorer! 🎉`);
      setShowScoutMessage(true);
      setTimeout(() => setShowScoutMessage(false), 5000);
      
      // Immediately refetch lessons to show progress
      refetchLessons();
      
      // Clear the URL parameter
      window.history.replaceState({}, '', '/quest-island');
    }
  }, [refetchLessons]);
  
  // Dynamic collectibles database - organized by biome categories
  const collectiblesDatabase: Record<string, Collectible[]> = {
    beach: [
      {
        id: "beach-shell",
        name: "Golden Shell",
        description: "A perfect spiral shell with golden shimmer.",
        image: "", biome: "beach", collected: false,
        position: { x: 15, y: 82 },
        story: "This golden shell once held the whispers of counting waves. Each spiral teaches us about patterns in nature and numbers.",
        reward: "Math Focus +1"
      },
      {
        id: "beach-coral",
        name: "Rainbow Coral",
        description: "A piece of coral that glows with rainbow colors.",
        image: "", biome: "beach", collected: false,
        position: { x: 18, y: 85 },
        story: "Found in the shallow waters, this coral piece shows how life builds amazing structures through patience and time.",
        reward: "Pattern Recognition +1"
      },
      {
        id: "beach-glass",
        name: "Sea Glass",
        description: "Smooth glass polished by endless ocean waves.",
        image: "", biome: "beach", collected: false,
        position: { x: 12, y: 79 },
        story: "The ocean turned something sharp into something beautiful. It reminds us that challenges can shape us into something wonderful.",
        reward: "Resilience +1"
      }
    ],
    jungle: [
      {
        id: "jungle-leaf",
        name: "Whispering Leaf",
        description: "A leaf that rustles with ancient stories.",
        image: "", biome: "jungle", collected: false,
        position: { x: 38, y: 48 },
        story: "This magical leaf holds the stories that trees tell each other. When you listen closely, it teaches new words and their meanings.",
        reward: "Vocabulary +1"
      },
      {
        id: "jungle-seed",
        name: "Story Seed",
        description: "A seed that contains entire adventures.",
        image: "", biome: "jungle", collected: false,
        position: { x: 42, y: 45 },
        story: "Small but mighty, this seed holds complete stories waiting to grow. It teaches us that every great tale starts with a tiny idea.",
        reward: "Imagination +1"
      },
      {
        id: "jungle-flower",
        name: "Melody Flower",
        description: "A flower that hums with gentle sounds.",
        image: "", biome: "jungle", collected: false,
        position: { x: 35, y: 52 },
        story: "This flower sings the sounds of letters and words. Its petals dance to the rhythm of language and poetry.",
        reward: "Phonics +1"
      }
    ],
    volcano: [
      {
        id: "volcano-ember",
        name: "Curious Ember",
        description: "A warm ember that sparks with questions.",
        image: "", biome: "volcano", collected: false,
        position: { x: 85, y: 25 },
        story: "This glowing ember burns with endless curiosity. It encourages us to ask 'why?' and 'how?' about the world around us.",
        reward: "Wonder Spark +1"
      },
      {
        id: "volcano-crystal",
        name: "Wisdom Crystal",
        description: "A crystal that forms from deep earth pressure.",
        image: "", biome: "volcano", collected: false,
        position: { x: 88, y: 22 },
        story: "Formed deep underground through heat and pressure, this crystal teaches us how amazing things happen through natural processes.",
        reward: "Discovery +1"
      },
      {
        id: "volcano-stone",
        name: "Explorer Stone",
        description: "A volcanic stone with interesting textures.",
        image: "", biome: "volcano", collected: false,
        position: { x: 82, y: 28 },
        story: "This textured stone tells the story of Earth's power. Each bump and groove is a lesson about how our planet changes and grows.",
        reward: "Observation +1"
      }
    ],
    meadow: [
      {
        id: "meadow-butterfly",
        name: "Gentle Butterfly",
        description: "A delicate butterfly wing that shimmers softly.",
        image: "", biome: "meadow", collected: false,
        position: { x: 55, y: 65 },
        story: "This butterfly wing reminds us of transformation and growth. Like learning, it shows us that change can be beautiful and peaceful.",
        reward: "Growth Mindset +1"
      },
      {
        id: "meadow-dewdrop",
        name: "Morning Dewdrop",
        description: "A dewdrop that captures the morning light.",
        image: "", biome: "meadow", collected: false,
        position: { x: 58, y: 68 },
        story: "Each morning, this dewdrop reflects the whole world in its tiny sphere. It teaches us to see beauty in small, quiet moments.",
        reward: "Mindfulness +1"
      },
      {
        id: "meadow-pebble",
        name: "Harmony Pebble",
        description: "A smooth pebble that brings inner calm.",
        image: "", biome: "meadow", collected: false,
        position: { x: 52, y: 62 },
        story: "Worn smooth by wind and rain, this pebble holds peaceful energy. It reminds us that patience and kindness make everything better.",
        reward: "Calm Wisdom +1"
      }
    ],
    lagoon: [
      {
        id: "lagoon-pearl",
        name: "Friendship Pearl",
        description: "A pearl that glows with warm connection.",
        image: "", biome: "lagoon", collected: false,
        position: { x: 70, y: 88 },
        story: "This special pearl formed through layers of kindness and care. It teaches us that friendships grow stronger when we help each other learn.",
        reward: "Social Bond +1"
      },
      {
        id: "lagoon-scale",
        name: "Unity Scale",
        description: "A fish scale that sparkles with togetherness.",
        image: "", biome: "lagoon", collected: false,
        position: { x: 73, y: 85 },
        story: "Like fish swimming together, this scale reminds us that we're stronger when we work as a team and celebrate each other's success.",
        reward: "Cooperation +1"
      },
      {
        id: "lagoon-lily",
        name: "Sharing Lily",
        description: "A water lily petal soft as kindness.",
        image: "", biome: "lagoon", collected: false,
        position: { x: 68, y: 91 },
        story: "This lily pad petal floats gently on the water, supporting tiny creatures. It teaches us the joy of sharing and helping others.",
        reward: "Empathy +1"
      }
    ]
  };

  // Active collectibles state - only visible/discoverable collectibles
  const [discoveredCollectibles, setDiscoveredCollectibles] = useState<string[]>(() => {
    // Start with one collectible from first biome visible
    return ["beach-shell"];
  });

  const [collectibles, setCollectibles] = useState<Collectible[]>(() => {
    // Initialize with only the starting collectible
    return [collectiblesDatabase.beach[0]];
  });
  
  const [showCollectibleStory, setShowCollectibleStory] = useState(false);
  const [currentCollectible, setCurrentCollectible] = useState<Collectible | null>(null);
  const [newDiscovery, setNewDiscovery] = useState<string | null>(null);

  // Dynamic collectible discovery system
  const discoverNewCollectible = useCallback((completedLessonId: string) => {
    // 40% chance of discovering a new collectible after lesson completion
    if (Math.random() > 0.4) return null;
    
    // Get biome from completed lesson
    const completedBiome = completedLessonId.split('-')[0];
    const availableBiomes = ['beach', 'jungle', 'volcano', 'meadow', 'lagoon'];
    
    // 60% chance to find collectible from same biome, 40% chance from any biome
    const searchBiomes = Math.random() < 0.6 ? [completedBiome] : availableBiomes;
    
    // Find undiscovered collectibles from selected biomes
    const undiscoveredOptions: Collectible[] = [];
    searchBiomes.forEach(biome => {
      if (collectiblesDatabase[biome]) {
        collectiblesDatabase[biome].forEach(collectible => {
          if (!discoveredCollectibles.includes(collectible.id)) {
            undiscoveredOptions.push(collectible);
          }
        });
      }
    });
    
    if (undiscoveredOptions.length === 0) return null;
    
    // Randomly select one to discover
    const newCollectible = undiscoveredOptions[Math.floor(Math.random() * undiscoveredOptions.length)];
    
    // Add to discovered list and active collectibles
    setDiscoveredCollectibles(prev => [...prev, newCollectible.id]);
    setCollectibles(prev => [...prev, newCollectible]);
    
    // Store for discovery animation
    setNewDiscovery(newCollectible.id);
    
    return newCollectible;
  }, [discoveredCollectibles, collectiblesDatabase]);

  // Clear discovery animation after showing
  useEffect(() => {
    if (newDiscovery) {
      const timer = setTimeout(() => setNewDiscovery(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [newDiscovery]);

  // Tree structure - main trunk with branches radiating from each biome point
  const treeBranches = {
    beach: {
      trunkPoint: { x: 120, y: 650 }, // Point where branches connect to main trunk
      branches: [
        { 
          endpoint: { x: 80, y: 700 }, // Branch 1 - spreading outward like leaves seeking space
          lessonId: "beach-1",
          angle: 225 // degrees from trunk
        },
        { 
          endpoint: { x: 180, y: 720 }, // Branch 2 - positioned for maximum space
          lessonId: "beach-2", 
          angle: 315
        },
        { 
          endpoint: { x: 60, y: 600 }, // Branch 3 - avoiding overlap with other lessons
          lessonId: "beach-3",
          angle: 135
        }
      ]
    },
    jungle: {
      trunkPoint: { x: 420, y: 315 },
      branches: [
        { 
          endpoint: { x: 360, y: 270 }, // Branch spreading upward-left
          lessonId: "jungle-1",
          angle: 135
        },
        { 
          endpoint: { x: 480, y: 280 }, // Branch spreading upward-right  
          lessonId: "jungle-2",
          angle: 45
        },
        { 
          endpoint: { x: 380, y: 380 }, // Branch spreading downward
          lessonId: "jungle-3", 
          angle: 225
        }
      ]
    },
    volcano: {
      trunkPoint: { x: 1020, y: 135 },
      branches: [
        { 
          endpoint: { x: 960, y: 90 }, // Branch 1 - northwest spread (like jungle pattern)
          lessonId: "volcano-1",
          angle: 135
        },
        { 
          endpoint: { x: 1080, y: 100 }, // Branch 2 - northeast spread  
          lessonId: "volcano-2", 
          angle: 45
        },
        { 
          endpoint: { x: 980, y: 200 }, // Branch 3 - southwest spread
          lessonId: "volcano-3",
          angle: 225
        }
      ]
    },
    lagoon: {
      trunkPoint: { x: 840, y: 720 },
      branches: [
        { 
          endpoint: { x: 780, y: 670 }, // Branch 1 - northwest spread (like beach pattern)
          lessonId: "lagoon-1",
          angle: 135
        },
        { 
          endpoint: { x: 900, y: 790 }, // Branch 2 - southeast spread
          lessonId: "lagoon-2",
          angle: 315
        },
        { 
          endpoint: { x: 780, y: 790 }, // Branch 3 - southwest spread  
          lessonId: "lagoon-3", 
          angle: 225
        }
      ]
    }
  };

  // Generate lesson nodes positioned exactly at tree branch endpoints (SVG coords to percentage conversion)
  const lessonNodes: LessonNodeData[] = [
    // Beach biome - Lessons positioned exactly at branch endpoints
    { id: "beach-1", title: "Counting Shells", biome: "beach", position: { x: (treeBranches.beach.branches[0].endpoint.x/1200)*100, y: (treeBranches.beach.branches[0].endpoint.y/900)*100 }, completed: lessonProgress["beach-1"]?.completed || false, locked: lessonProgress["beach-1"]?.locked === undefined ? false : lessonProgress["beach-1"].locked },
    { id: "beach-2", title: "Ocean Wildlife", biome: "beach", position: { x: (treeBranches.beach.branches[1].endpoint.x/1200)*100, y: (treeBranches.beach.branches[1].endpoint.y/900)*100 }, completed: lessonProgress["beach-2"]?.completed || false, locked: lessonProgress["beach-2"]?.locked === undefined ? true : lessonProgress["beach-2"].locked },
    { id: "beach-3", title: "Treasure Sorting", biome: "beach", position: { x: (treeBranches.beach.branches[2].endpoint.x/1200)*100, y: (treeBranches.beach.branches[2].endpoint.y/900)*100 }, completed: lessonProgress["beach-3"]?.completed || false, locked: lessonProgress["beach-3"]?.locked === undefined ? true : lessonProgress["beach-3"].locked },
    
    // Jungle biome - Lessons positioned exactly at branch endpoints
    { id: "jungle-1", title: "Animal Sounds", biome: "jungle", position: { x: (treeBranches.jungle.branches[0].endpoint.x/1200)*100, y: (treeBranches.jungle.branches[0].endpoint.y/900)*100 }, completed: lessonProgress["jungle-1"]?.completed || false, locked: lessonProgress["jungle-1"]?.locked === undefined ? true : lessonProgress["jungle-1"].locked },
    { id: "jungle-2", title: "Story Vines", biome: "jungle", position: { x: (treeBranches.jungle.branches[1].endpoint.x/1200)*100, y: (treeBranches.jungle.branches[1].endpoint.y/900)*100 }, completed: lessonProgress["jungle-2"]?.completed || false, locked: lessonProgress["jungle-2"]?.locked === undefined ? true : lessonProgress["jungle-2"].locked },
    { id: "jungle-3", title: "Letter Hunt", biome: "jungle", position: { x: (treeBranches.jungle.branches[2].endpoint.x/1200)*100, y: (treeBranches.jungle.branches[2].endpoint.y/900)*100 }, completed: lessonProgress["jungle-3"]?.completed || false, locked: lessonProgress["jungle-3"]?.locked === undefined ? true : lessonProgress["jungle-3"].locked },
    
    // Volcano biome - Lessons positioned exactly at branch endpoints
    { id: "volcano-1", title: "Rock Formation", biome: "volcano", position: { x: (treeBranches.volcano.branches[0].endpoint.x/1200)*100, y: (treeBranches.volcano.branches[0].endpoint.y/900)*100 }, completed: lessonProgress["volcano-1"]?.completed || false, locked: lessonProgress["volcano-1"]?.locked === undefined ? true : lessonProgress["volcano-1"].locked },
    { id: "volcano-2", title: "Heat & Cold", biome: "volcano", position: { x: (treeBranches.volcano.branches[1].endpoint.x/1200)*100, y: (treeBranches.volcano.branches[1].endpoint.y/900)*100 }, completed: lessonProgress["volcano-2"]?.completed || false, locked: lessonProgress["volcano-2"]?.locked === undefined ? true : lessonProgress["volcano-2"].locked },
    { id: "volcano-3", title: "Color Mixing", biome: "volcano", position: { x: (treeBranches.volcano.branches[2].endpoint.x/1200)*100, y: (treeBranches.volcano.branches[2].endpoint.y/900)*100 }, completed: lessonProgress["volcano-3"]?.completed || false, locked: lessonProgress["volcano-3"]?.locked === undefined ? true : lessonProgress["volcano-3"].locked },
    
    // Lagoon biome - Lessons positioned exactly at branch endpoints  
    { id: "lagoon-1", title: "Community Pond", biome: "lagoon", position: { x: (treeBranches.lagoon.branches[0].endpoint.x/1200)*100, y: (treeBranches.lagoon.branches[0].endpoint.y/900)*100 }, completed: lessonProgress["lagoon-1"]?.completed || false, locked: lessonProgress["lagoon-1"]?.locked === undefined ? true : lessonProgress["lagoon-1"].locked },
    { id: "lagoon-2", title: "Helping Friends", biome: "lagoon", position: { x: (treeBranches.lagoon.branches[1].endpoint.x/1200)*100, y: (treeBranches.lagoon.branches[1].endpoint.y/900)*100 }, completed: lessonProgress["lagoon-2"]?.completed || false, locked: lessonProgress["lagoon-2"]?.locked === undefined ? true : lessonProgress["lagoon-2"].locked },
    { id: "lagoon-3", title: "Island Home", biome: "lagoon", position: { x: (treeBranches.lagoon.branches[2].endpoint.x/1200)*100, y: (treeBranches.lagoon.branches[2].endpoint.y/900)*100 }, completed: lessonProgress["lagoon-3"]?.completed || false, locked: lessonProgress["lagoon-3"]?.locked === undefined ? true : lessonProgress["lagoon-3"].locked }
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
    
    // Try to discover new collectible
    const newCollectible = discoverNewCollectible(lessonId);
    
    // Scout celebrates with special message if new collectible discovered
    if (newCollectible) {
      const learnerName = getLearnerName();
      setScoutMessage(`Crikey! Amazing lesson, ${learnerName}! 🎉 Something magical appeared - I can see a ${newCollectible.name} sparkling nearby! Have a look around!`);
    } else {
      setScoutMessage("Amazing work! You're becoming a real explorer!");
    }
    setShowScoutMessage(true);
    setTimeout(() => setShowScoutMessage(false), 6000);
  }, [discoverNewCollectible]);
  
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
      // Move Scout to suggest the next lesson (using exact branch endpoint positions)
      const lessonPositions: Record<string, { x: number; y: number }> = {
        "beach-1": { x: (treeBranches.beach.branches[0].endpoint.x/1200)*100, y: (treeBranches.beach.branches[0].endpoint.y/900)*100 },
        "beach-2": { x: (treeBranches.beach.branches[1].endpoint.x/1200)*100, y: (treeBranches.beach.branches[1].endpoint.y/900)*100 },
        "beach-3": { x: (treeBranches.beach.branches[2].endpoint.x/1200)*100, y: (treeBranches.beach.branches[2].endpoint.y/900)*100 },
        "jungle-1": { x: (treeBranches.jungle.branches[0].endpoint.x/1200)*100, y: (treeBranches.jungle.branches[0].endpoint.y/900)*100 },
        "jungle-2": { x: (treeBranches.jungle.branches[1].endpoint.x/1200)*100, y: (treeBranches.jungle.branches[1].endpoint.y/900)*100 },
        "jungle-3": { x: (treeBranches.jungle.branches[2].endpoint.x/1200)*100, y: (treeBranches.jungle.branches[2].endpoint.y/900)*100 },
        "volcano-1": { x: (treeBranches.volcano.branches[0].endpoint.x/1200)*100, y: (treeBranches.volcano.branches[0].endpoint.y/900)*100 },
        "volcano-2": { x: (treeBranches.volcano.branches[1].endpoint.x/1200)*100, y: (treeBranches.volcano.branches[1].endpoint.y/900)*100 },
        "volcano-3": { x: (treeBranches.volcano.branches[2].endpoint.x/1200)*100, y: (treeBranches.volcano.branches[2].endpoint.y/900)*100 },
        "lagoon-1": { x: (treeBranches.lagoon.branches[0].endpoint.x/1200)*100, y: (treeBranches.lagoon.branches[0].endpoint.y/900)*100 },
        "lagoon-2": { x: (treeBranches.lagoon.branches[1].endpoint.x/1200)*100, y: (treeBranches.lagoon.branches[1].endpoint.y/900)*100 },
        "lagoon-3": { x: (treeBranches.lagoon.branches[2].endpoint.x/1200)*100, y: (treeBranches.lagoon.branches[2].endpoint.y/900)*100 }
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
    },
    {
      id: "meadow",
      name: "Gentle Meadow",
      subject: "Creativity & Art",
      position: { x: 55, y: 58 }, // Central area
      color: "from-green-200 to-yellow-200",
      description: "Express yourself through art and music"
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
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 900" style={{ zIndex: 50, pointerEvents: "none" }}>
              {/* Base Path */}
              <motion.path
                d="M 120 650 Q 250 500, 420 315 Q 580 200, 780 135 Q 900 100, 1020 135 Q 1100 160, 1050 250 Q 1000 340, 900 450 Q 800 560, 720 650 Q 640 740, 840 720"
                stroke="url(#basePathGradient)"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                pointerEvents="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 4, ease: "easeInOut" }}
                style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.9))" }}
              />
              
              {/* Completed Progress Path */}
              <motion.path
                d="M 120 650 Q 250 500, 420 315 Q 580 200, 780 135 Q 900 100, 1020 135 Q 1100 160, 1050 250 Q 1000 340, 900 450 Q 800 560, 720 650 Q 640 740, 840 720"
                stroke="url(#progressGradient)"
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
                pointerEvents="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: (Object.values(lessonProgress).filter(p => p.completed).length / 12) * 1,
                  opacity: 1 
                }}
                transition={{ duration: 2, ease: "easeInOut" }}
                style={{ filter: "drop-shadow(0 0 8px rgba(255,215,0,0.8))" }}
              />
              
              {/* Animated Sparkles along completed path */}
              {Object.values(lessonProgress).filter(p => p.completed).length > 0 && (
                <motion.path
                  d="M 120 650 Q 250 500, 420 315 Q 580 200, 780 135 Q 900 100, 1020 135 Q 1100 160, 1050 250 Q 1000 340, 900 450 Q 800 560, 720 650 Q 640 740, 840 720"
                  stroke="url(#sparkleGradient)"
                  strokeWidth="18"
                  fill="none"
                  strokeLinecap="round"
                  pointerEvents="none"
                  pathLength={(Object.values(lessonProgress).filter(p => p.completed).length / 12) * 1}
                  animate={{ 
                    opacity: [0.4, 0.9, 0.4],
                    strokeWidth: [16, 22, 16]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,1))" }}
                />
              )}

              {/* Tree Branch System - Direct branches from trunk to lesson leaves */}
              {Object.entries(treeBranches).map(([biomeName, biomeData], biomeIndex) => 
                biomeData.branches.map((branch, branchIndex) => {
                  const lesson = lessonNodes.find(l => l.id === branch.lessonId);
                  if (!lesson) return null;

                  // Create direct branch path from trunk point to leaf endpoint
                  const branchPath = `M ${biomeData.trunkPoint.x} ${biomeData.trunkPoint.y} L ${branch.endpoint.x} ${branch.endpoint.y}`;

                  const isUnlocked = !lesson.locked;
                  const isCompleted = lesson.completed;
                  
                  return (
                    <motion.path
                      key={`branch-${lesson.id}`}
                      d={branchPath}
                      stroke={isCompleted ? "rgba(255,215,0,0.6)" : isUnlocked ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.5)"}
                      strokeWidth={isCompleted ? "6" : isUnlocked ? "5" : "4"}
                      fill="none"
                      strokeLinecap="round"
                      pointerEvents="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ 
                        pathLength: 1, // Tree branches - ALL lessons get branches (locked, unlocked, completed)
                        opacity: isCompleted ? 1.0 : isUnlocked ? 0.9 : 0.7
                      }}
                      transition={{ 
                        duration: 2,
                        delay: biomeIndex * 0.6 + branchIndex * 0.3,
                        ease: "easeInOut" 
                      }}
                      style={{ 
                        filter: isCompleted 
                          ? "drop-shadow(0 0 4px rgba(255,215,0,0.5))"
                          : isUnlocked 
                          ? "drop-shadow(0 0 2px rgba(255,255,255,0.3))"
                          : "drop-shadow(0 0 1px rgba(255,255,255,0.2))",
                        pointerEvents: "none"
                      }}
                    />
                  );
                })
              ).flat()}

              {/* Branch Energy Pulses - Flow from trunk through completed branches to leaves */}
              {Object.entries(treeBranches).map(([biomeName, biomeData], biomeIndex) => 
                biomeData.branches.map((branch, branchIndex) => {
                  const lesson = lessonNodes.find(l => l.id === branch.lessonId);
                  if (!lesson || !lesson.completed) return null;

                  const pathId = `branch-path-${lesson.id}`;
                  const branchPath = `M ${biomeData.trunkPoint.x} ${biomeData.trunkPoint.y} L ${branch.endpoint.x} ${branch.endpoint.y}`;
                  
                  return (
                    <g key={`branch-energy-${lesson.id}`}>
                      {/* Hidden path for energy flow animation */}
                      <path
                        id={pathId}
                        d={branchPath}
                        fill="none"
                        stroke="none"
                      />
                      
                      {/* Energy pulse flowing from trunk to leaf */}
                      <motion.circle
                        r="4"
                        fill="url(#energyPulseGradient)"
                        opacity="0.95"
                      >
                        <animateMotion
                          dur={`${2.5 + branchIndex * 0.5}s`}
                          repeatCount="indefinite"
                          begin={`${biomeIndex * 0.4}s`}
                        >
                          <mpath xlinkHref={`#${pathId}`} />
                        </animateMotion>
                        <animate
                          attributeName="r"
                          values="3;5;3"
                          dur="1.8s"
                          repeatCount="indefinite"
                        />
                      </motion.circle>
                    </g>
                  );
                })
              ).flat()}

              {/* Energy Flow Pulses - Only on completed path sections */}
              {Object.values(lessonProgress).filter(p => p.completed).length > 0 && (
                <>
                  {/* Hidden path for energy flow animation */}
                  <path
                    id="adventurePath"
                    d="M 120 650 Q 250 500, 420 315 Q 580 200, 780 135 Q 900 100, 1020 135 Q 1100 160, 1050 250 Q 1000 340, 900 450 Q 800 560, 720 650 Q 640 740, 840 720"
                    fill="none"
                    stroke="none"
                  />
                  
                  {/* Primary Energy Pulse */}
                  <motion.circle
                    r="6"
                    fill="url(#energyPulseGradient)"
                    opacity="0.8"
                  >
                    <animateMotion
                      dur="8s"
                      repeatCount="indefinite"
                    >
                      <mpath xlinkHref="#adventurePath" />
                    </animateMotion>
                    <animate
                      attributeName="r"
                      values="4;8;4"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.3;0.8;0.3"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </motion.circle>
                  
                  {/* Secondary Energy Pulse (offset) */}
                  <motion.circle
                    r="4"
                    fill="url(#energyPulse2Gradient)"
                    opacity="0.6"
                  >
                    <animateMotion
                      dur="12s"
                      repeatCount="indefinite"
                      begin="4s"
                    >
                      <mpath xlinkHref="#adventurePath" />
                    </animateMotion>
                    <animate
                      attributeName="r"
                      values="3;6;3"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </motion.circle>
                  
                  {/* Trailing Sparkles */}
                  {[...Array(3)].map((_, i) => (
                    <motion.circle
                      key={i}
                      r="2"
                      fill="rgba(255, 215, 0, 0.4)"
                      opacity="0.5"
                    >
                      <animateMotion
                        dur="10s"
                        repeatCount="indefinite"
                        begin={`${i * 2}s`}
                      >
                        <mpath xlinkHref="#adventurePath" />
                      </animateMotion>
                      <animate
                        attributeName="opacity"
                        values="0;0.6;0"
                        dur="4s"
                        repeatCount="indefinite"
                      />
                    </motion.circle>
                  ))}
                </>
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
                
                {/* Energy Flow Gradients */}
                <radialGradient id="energyPulseGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="1.0" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.4" />
                </radialGradient>
                <radialGradient id="energyPulse2Gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
                </radialGradient>
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

            {/* Biome Completion Effects - Positioned properly within map container */}
            {biomes.map(biome => {
              const biomeLessons = lessonNodes.filter(node => node.biome === biome.id);
              const completedInBiome = biomeLessons.filter(node => node.completed).length;
              const isUnlocked = biomeLessons.some(node => !node.locked);
              const isFullyCompleted = biomeLessons.length > 0 && biomeLessons.every(node => node.completed);
              
              return (
                <div key={`${biome.id}-effects`}>
                  {/* Biome completion indicator - positioned within map container */}
                  {isUnlocked && (
                    <motion.div
                      className="absolute z-10"
                      style={{
                        left: `calc(${biome.position.x}% + 20px)`,
                        top: `calc(${biome.position.y}% - 20px)`,
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
                  
                  {/* Biome completion celebration effect - positioned within map container */}
                  {isFullyCompleted && (
                    <motion.div
                      className="absolute pointer-events-none z-0"
                      style={{
                        left: `calc(${biome.position.x}% - 64px)`,
                        top: `calc(${biome.position.y}% - 64px)`,
                        width: '128px',
                        height: '128px',
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
                      <div className="w-full h-full bg-yellow-300 rounded-full opacity-20 blur-xl" />
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
                currentBiome={scoutTarget ?? undefined}
              />
            </div>
            
            {/* Scout Guidance Message */}
            {showScoutMessage && scoutMessage && (
              <motion.div
                className="fixed top-48 left-4 bg-white/95 text-gray-800 rounded-2xl shadow-lg backdrop-blur-sm border border-white/20 max-w-xl w-[28rem] z-50"
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <div className="flex items-start space-x-4 p-5">
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
                    <p 
                      className="font-medium leading-relaxed text-sm break-words hyphens-auto overflow-hidden"
                      style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                    >
                      {scoutMessage}
                    </p>
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
            {collectibles.filter(c => !c.collected).map((collectible) => {
              const isNewDiscovery = newDiscovery === collectible.id;
              
              return (
                <motion.div
                  key={collectible.id}
                  className={`absolute cursor-pointer transform transition-all duration-300 hover:scale-110 ${
                    isNewDiscovery ? 'w-10 h-10' : 'w-6 h-6'
                  }`}
                  style={{
                    left: `${collectible.position.x}%`,
                    top: `${collectible.position.y}%`,
                  }}
                  onClick={() => handleCollectibleClick(collectible)}
                  data-testid={`collectible-${collectible.id}`}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  animate={isNewDiscovery ? {
                    y: [0, -12, 0],
                    scale: [1, 1.3, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  } : {
                    y: [0, -6, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={isNewDiscovery ? {
                    duration: 1.5,
                    repeat: 3,
                    ease: "easeInOut"
                  } : {
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: Math.random() * 2
                  }}
                  initial={isNewDiscovery ? { scale: 0, rotate: -180 } : undefined}
                >
                  {/* Simple geometric collectibles matching Alto's style */}
                  <div className={`w-full h-full rounded-full ${getCollectibleStyle(collectible.biome)} border-2 border-white/50 shadow-lg`} />
                  
                  {/* Enhanced glow effect for discoveries */}
                  <motion.div
                    className={`absolute inset-0 rounded-full ${getCollectibleGlow(collectible.biome)} ${
                      isNewDiscovery ? 'opacity-90' : 'opacity-60'
                    }`}
                    animate={isNewDiscovery ? {
                      scale: [1, 1.8, 1.3, 1],
                      opacity: [0.9, 0.3, 0.8, 0.6]
                    } : {
                      scale: [1, 1.2, 1],
                      opacity: [0.4, 0.8, 0.4]
                    }}
                    transition={isNewDiscovery ? {
                      duration: 2,
                      repeat: 2,
                      ease: "easeInOut"
                    } : {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Special sparkle effects for new discoveries */}
                  {isNewDiscovery && (
                    <>
                      <motion.div
                        className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-300 rounded-full"
                        animate={{
                          scale: [0, 1.5, 0],
                          rotate: [0, 180, 360],
                          opacity: [1, 0.5, 1]
                        }}
                        transition={{
                          duration: 1,
                          repeat: 4,
                          ease: "easeInOut"
                        }}
                      />
                      <motion.div
                        className="absolute -bottom-2 -left-2 w-2 h-2 bg-white rounded-full"
                        animate={{
                          scale: [0, 1.2, 0],
                          opacity: [1, 0.3, 1]
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: 5,
                          ease: "easeInOut",
                          delay: 0.3
                        }}
                      />
                      <motion.div
                        className="absolute -top-3 left-1/2 w-1 h-1 bg-pink-300 rounded-full"
                        animate={{
                          scale: [0, 1.8, 0],
                          y: [0, -10, 0]
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: 3,
                          ease: "easeInOut",
                          delay: 0.6
                        }}
                      />
                    </>
                  )}
                </motion.div>
              );
            })}

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

      {/* Treasure Map Progress Indicator */}
      <motion.div
        className="fixed top-8 left-8 z-40"
        initial={{ opacity: 0, y: -20, rotate: -5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
      >
        {/* Manual Test Button for "Counting Shells" */}
        <button
          onClick={() => {
            const newCompletions = [...localCompletions];
            if (!newCompletions.includes('beach-1')) {
              newCompletions.push('beach-1');
              setLocalCompletions(newCompletions);
              localStorage.setItem('quest-island-completions', JSON.stringify(newCompletions));
              // Manually marked beach-1 as completed!
            }
          }}
          className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full text-xs hover:bg-green-600 transition-colors z-10"
          title="Test Counting Shells Completion"
        >
          ✓
        </button>
        
        {/* Treasure Map - Clean Style */}
        <div className="relative">
          <motion.img 
            src="/attached_assets/925fba67-25bb-45e9-8e91-eb6e19d9394c_1756186426342.png" 
            alt="Adventure Progress Map"
            className="w-32 h-32 object-contain drop-shadow-lg hover:drop-shadow-2xl transition-all duration-300"
            animate={{
              y: [0, -2, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Adventure Trail Sparkles */}
          {Object.values(lessonProgress).filter(p => p.completed).length > 0 && (
            <>
              <motion.div
                className="absolute top-4 right-6 w-1.5 h-1.5 bg-yellow-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute bottom-8 left-6 w-1 h-1 bg-amber-400 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.9, 0.5]
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.8
                }}
              />
            </>
          )}
          
          {/* Progress Counter */}
          <motion.div 
            className="absolute -bottom-2 -right-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5, duration: 0.5, ease: "backOut" }}
          >
            <div className="flex items-center space-x-1">
              <motion.span 
                className="text-lg font-bold text-amber-600"
                key={Object.values(lessonProgress).filter(p => p.completed).length}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {Object.values(lessonProgress).filter(p => p.completed).length}
              </motion.span>
              <span className="text-sm text-amber-500 font-medium">/12</span>
              <motion.div
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                ⭐
              </motion.div>
            </div>
          </motion.div>
          
          {/* Completion Celebration */}
          {Object.values(lessonProgress).filter(p => p.completed).length === 12 && (
            <motion.div
              className="absolute -inset-3 bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 rounded-3xl opacity-40 blur-xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </div>
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