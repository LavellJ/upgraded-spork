import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Progress, Topic } from "@shared/schema";

interface ProgressLandscapeProps {
  progress: Progress[];
  topics: Topic[];
}

export function ProgressLandscape({ progress, topics }: ProgressLandscapeProps) {
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  const getProgressForTopic = (topicId: string) => {
    return progress.find(p => p.topicId === topicId);
  };

  const getOverallProgress = () => {
    if (progress.length === 0) return 0;
    const totalCompletion = progress.reduce((sum, p) => sum + (p.completionPercentage || 0), 0);
    return Math.round(totalCompletion / progress.length);
  };

  // Group topics by subject for better organization
  const topicsBySubject = topics.reduce((acc, topic) => {
    if (!acc[topic.subject]) acc[topic.subject] = [];
    acc[topic.subject].push(topic);
    return acc;
  }, {} as Record<string, Topic[]>);

  // Calculate progress segments based on actual data
  const getProgressSegments = () => {
    const totalTopics = topics.length;
    if (totalTopics === 0) return { completed: 0, current: 0, future: 100 };

    const completedTopics = topics.filter(topic => {
      const prog = getProgressForTopic(topic.id);
      return prog && (prog.completionPercentage || 0) >= 85;
    }).length;

    const inProgressTopics = topics.filter(topic => {
      const prog = getProgressForTopic(topic.id);
      return prog && (prog.completionPercentage || 0) > 0 && (prog.completionPercentage || 0) < 85;
    }).length;

    const futureTopics = totalTopics - completedTopics - inProgressTopics;

    return {
      completed: Math.round((completedTopics / totalTopics) * 100),
      current: Math.round((inProgressTopics / totalTopics) * 100),
      future: Math.round((futureTopics / totalTopics) * 100)
    };
  };

  // Get the current path environment based on progress (Alto's Odyssey inspired)
  const getCurrentPath = () => {
    const overallProgress = getOverallProgress();
    if (overallProgress >= 80) return { 
      name: 'Mountain Summit Path', 
      description: 'High peaks and endless views',
      color: 'from-purple-400 to-blue-500',
      emoji: '🏔️'
    };
    if (overallProgress >= 60) return { 
      name: 'Cloud Valley Trail', 
      description: 'Mystical paths through floating clouds',
      color: 'from-cyan-400 to-blue-400',
      emoji: '☁️'
    };
    if (overallProgress >= 40) return { 
      name: 'Forest Pathway', 
      description: 'Gentle trails through ancient woods',
      color: 'from-green-400 to-emerald-500',
      emoji: '🌲'
    };
    if (overallProgress >= 20) return { 
      name: 'Rolling Hills Route', 
      description: 'Peaceful paths across sunny meadows',
      color: 'from-yellow-400 to-green-400',
      emoji: '🌻'
    };
    return { 
      name: 'Garden Path', 
      description: 'Your learning journey begins here',
      color: 'from-orange-400 to-yellow-400',
      emoji: '🌱'
    };
  };

  // Create a winding path through the topics
  const getPathCoordinates = () => {
    if (topics.length === 0) return [];
    
    return topics.map((_, index) => {
      const progress = index / Math.max(topics.length - 1, 1);
      const x = 50 + progress * 700; // Horizontal progress
      const y = 80 + Math.sin(progress * Math.PI * 2) * 30; // Gentle sine wave
      return { x, y, progress };
    });
  };

  const segments = getProgressSegments();
  const completedWidth = Math.max(5, segments.completed);
  const currentWidth = Math.max(5, segments.current);
  const futureWidth = Math.max(5, segments.future);

  return (
    <div className="floating-ui rounded-3xl p-8" data-testid="progress-landscape">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getCurrentPath().emoji}</span>
          <div>
            <h3 className="font-display text-xl font-semibold text-white" data-testid="text-journey-title">
              {getCurrentPath().name}
            </h3>
            <p className="text-white/60 text-sm">{getCurrentPath().description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white/70 text-sm mb-1" data-testid="text-overall-progress">
            <span className="text-lg font-bold text-white">{getOverallProgress()}%</span> of the path
          </div>
          <div className="text-xs text-white/50">travelled</div>
        </div>
      </div>
      
      {/* Enhanced Journey Visualization */}
      <div className="relative" data-testid="landscape-visualization">
        {/* Legend Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-teal-400"></div>
              <span className="text-white/80">🚩 Reached</span>
              <span className="text-green-400 font-medium">{segments.completed}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-red-400"></div>
              <span className="text-white/80">👣 Walking</span>
              <span className="text-orange-400 font-medium">{segments.current}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400/50 to-blue-400/50"></div>
              <span className="text-white/80">🗺️ Ahead</span>
              <span className="text-purple-400 font-medium">{segments.future}%</span>
            </div>
          </div>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="text-white/60 hover:text-white transition-colors text-sm flex items-center space-x-1"
          >
            <span>🧭</span>
            <span>{showLegend ? 'Hide' : 'View'} Trail Map</span>
          </button>
        </div>

        {/* Journey Path Visualization */}
        <div className={`relative h-48 overflow-hidden rounded-2xl bg-gradient-to-r ${getCurrentPath().color}/10 border border-white/10`}>
          <svg viewBox="0 0 800 192" className="absolute inset-0 w-full h-full">
            {/* Winding trail path */}
            <motion.path
              d="M20,150 Q150,120 200,140 T400,130 Q550,110 650,125 T780,120"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="8,4"
              className="opacity-60"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            
            {/* Travelled path (completed portion) */}
            <motion.path
              d="M20,150 Q150,120 200,140 T400,130 Q550,110 650,125 T780,120"
              stroke="url(#trailCompleted)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: getOverallProgress() / 100 }}
              transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
            />
            
            {/* Trail waypoints (topic markers) */}
            {getPathCoordinates().map((coord, index) => {
              const topic = topics[index];
              const topicProgress = getProgressForTopic(topic.id);
              const completion = topicProgress?.completionPercentage || 0;
              const isUnlocked = topic.isUnlocked === "true";
              
              return (
                <g key={topic.id}>
                  {/* Waypoint marker */}
                  <motion.circle
                    cx={coord.x}
                    cy={coord.y}
                    r={completion >= 85 ? "12" : completion > 0 ? "10" : isUnlocked ? "8" : "6"}
                    fill={completion >= 85 ? "#10b981" : completion > 0 ? "#f59e0b" : isUnlocked ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)"}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer drop-shadow-lg"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.5 + index * 0.15, type: "spring", stiffness: 100 }}
                    whileHover={{ scale: 1.3 }}
                    onMouseEnter={() => setHoveredTopic(topic.id)}
                    onMouseLeave={() => setHoveredTopic(null)}
                  />
                  
                  {/* Waypoint flag for completed topics */}
                  {completion >= 85 && (
                    <motion.polygon
                      points={`${coord.x - 8},${coord.y - 15} ${coord.x + 5},${coord.y - 12} ${coord.x + 5},${coord.y - 8} ${coord.x - 8},${coord.y - 11}`}
                      fill="#10b981"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 2 + index * 0.15, type: "spring" }}
                    />
                  )}
                  
                  {/* Waypoint number */}
                  <motion.text
                    x={coord.x}
                    y={coord.y + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fill="white"
                    fontWeight="bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: completion >= 85 ? 0 : 1 }}
                    transition={{ delay: 2 + index * 0.15 }}
                  >
                    {index + 1}
                  </motion.text>
                </g>
              );
            })}
            
            <defs>
              <linearGradient id="trailCompleted" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#06d6a0" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Hover tooltips */}
          <AnimatePresence>
            {hoveredTopic && (
              <motion.div
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-sm rounded-lg px-3 py-2 backdrop-blur-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                {hoveredTopic === 'completed' && `🚩 ${topics.filter(t => (getProgressForTopic(t.id)?.completionPercentage || 0) >= 85).length} waypoints reached`}
                {hoveredTopic === 'current' && `👣 ${topics.filter(t => {
                  const p = getProgressForTopic(t.id)?.completionPercentage || 0;
                  return p > 0 && p < 85;
                }).length} paths being explored`}
                {hoveredTopic === 'future' && `🗺️ ${topics.filter(t => (getProgressForTopic(t.id)?.completionPercentage || 0) === 0).length} trails ahead`}
                {topics.find(t => t.id === hoveredTopic) && (
                  <span>
                    🏔️ {topics.find(t => t.id === hoveredTopic)?.name}: {getProgressForTopic(hoveredTopic)?.completionPercentage || 0}% of the trail
                  </span>
                )}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Detailed Progress by Subject */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            className="mt-8 grid gap-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {Object.entries(topicsBySubject).map(([subject, subjectTopics]) => (
              <motion.div
                key={subject}
                className="bg-white/5 rounded-2xl p-6 border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold text-lg capitalize">{subject}</h4>
                  <div className="text-white/60 text-sm">
                    {subjectTopics.filter(t => (getProgressForTopic(t.id)?.completionPercentage || 0) >= 85).length} of {subjectTopics.length} paths completed
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjectTopics.map((topic) => {
                    const topicProgress = getProgressForTopic(topic.id);
                    const completionPercentage = topicProgress?.completionPercentage || 0;
                    const questionsAnswered = topicProgress?.questionsAnswered || 0;
                    const correctAnswers = topicProgress?.correctAnswers || 0;
                    const isUnlocked = topic.isUnlocked === "true";
                    
                    return (
                      <motion.div
                        key={topic.id}
                        className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        data-testid={`card-topic-${topic.id}`}
                      >
                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white/80 text-sm font-medium">{topic.name}</span>
                            <span className="text-xs text-white/60">Level {topic.level}</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${
                                completionPercentage >= 85 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                                completionPercentage > 0 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                                'bg-white/20'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(2, completionPercentage)}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                            />
                          </div>
                        </div>
                        
                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3">
                            <span className={`${
                              completionPercentage >= 85 ? 'text-green-400' :
                              completionPercentage > 0 ? 'text-orange-400' :
                              isUnlocked ? 'text-white/60' : 'text-white/40'
                            }`}>
                              {completionPercentage >= 85 ? '🚩 Reached' :
                               completionPercentage > 0 ? '👣 Walking' :
                               isUnlocked ? '🗺️ Open Trail' : '🚫 Trail Closed'}
                            </span>
                          </div>
                          
                          {questionsAnswered > 0 && (
                            <div className="text-white/60">
                              {correctAnswers}/{questionsAnswered} correct
                            </div>
                          )}
                        </div>
                        
                        {completionPercentage > 0 && (
                          <div className="mt-2 text-xs text-white/50">
                            {Math.round(completionPercentage)}% of the trail
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Journey Summary Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:border-green-400/30 transition-colors">
          <div className="text-3xl mb-2">🚩</div>
          <div className="text-2xl font-bold text-green-400 mb-1">
            {topics.filter(t => (getProgressForTopic(t.id)?.completionPercentage || 0) >= 85).length}
          </div>
          <div className="text-white/70 text-sm">Waypoints Reached</div>
        </div>
        
        <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:border-orange-400/30 transition-colors">
          <div className="text-3xl mb-2">👣</div>
          <div className="text-2xl font-bold text-orange-400 mb-1">
            {topics.filter(t => {
              const p = getProgressForTopic(t.id)?.completionPercentage || 0;
              return p > 0 && p < 85;
            }).length}
          </div>
          <div className="text-white/70 text-sm">Paths Walking</div>
        </div>
        
        <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-400/30 transition-colors">
          <div className="text-3xl mb-2">⛰️</div>
          <div className="text-2xl font-bold text-cyan-400 mb-1">
            {progress.reduce((sum, p) => sum + (p.questionsAnswered || 0), 0)}
          </div>
          <div className="text-white/70 text-sm">Steps Taken</div>
        </div>
        
        <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-400/30 transition-colors">
          <div className="text-3xl mb-2">✨</div>
          <div className="text-2xl font-bold text-purple-400 mb-1">
            {progress.reduce((sum, p) => sum + (p.currentStreak || 0), 0)}
          </div>
          <div className="text-white/70 text-sm">Trail Energy</div>
        </div>
      </div>
    </div>
  );
}
