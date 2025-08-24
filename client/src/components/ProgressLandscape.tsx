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

  const segments = getProgressSegments();
  const completedWidth = Math.max(5, segments.completed);
  const currentWidth = Math.max(5, segments.current);
  const futureWidth = Math.max(5, segments.future);

  return (
    <div className="floating-ui rounded-3xl p-8" data-testid="progress-landscape">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-display text-xl font-semibold text-white" data-testid="text-journey-title">
          Learning Journey
        </h3>
        <div className="text-white/70 text-sm" data-testid="text-overall-progress">
          <span>{getOverallProgress()}%</span> Complete
        </div>
      </div>
      
      {/* Enhanced Journey Visualization */}
      <div className="relative" data-testid="landscape-visualization">
        {/* Legend Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-teal-400"></div>
              <span className="text-white/80">Completed</span>
              <span className="text-green-400 font-medium">{segments.completed}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-red-400"></div>
              <span className="text-white/80">In Progress</span>
              <span className="text-orange-400 font-medium">{segments.current}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400/50 to-blue-400/50"></div>
              <span className="text-white/80">Future</span>
              <span className="text-purple-400 font-medium">{segments.future}%</span>
            </div>
          </div>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="text-white/60 hover:text-white transition-colors text-sm"
          >
            <i className="fas fa-info-circle mr-1"></i>
            {showLegend ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {/* Dynamic Progress Path */}
        <div className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/20 to-slate-800/20 border border-white/10">
          <svg viewBox="0 0 800 160" className="absolute inset-0 w-full h-full">
            {/* Dynamic paths based on actual progress */}
            {completedWidth > 0 && (
              <motion.path 
                d={`M0,160 L0,90 Q${completedWidth * 4},70 ${completedWidth * 8},80 L${completedWidth * 8},160 Z`}
                fill="url(#dynamicCompleted)" 
                className="cursor-pointer"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                onMouseEnter={() => setHoveredTopic('completed')}
                onMouseLeave={() => setHoveredTopic(null)}
              />
            )}
            
            {currentWidth > 0 && (
              <motion.path 
                d={`M${completedWidth * 8},160 L${completedWidth * 8},80 Q${(completedWidth + currentWidth/2) * 8},60 ${(completedWidth + currentWidth) * 8},75 L${(completedWidth + currentWidth) * 8},160 Z`}
                fill="url(#dynamicCurrent)"
                className="cursor-pointer"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                onMouseEnter={() => setHoveredTopic('current')}
                onMouseLeave={() => setHoveredTopic(null)}
              />
            )}
            
            {futureWidth > 0 && (
              <motion.path 
                d={`M${(completedWidth + currentWidth) * 8},160 L${(completedWidth + currentWidth) * 8},75 Q${(completedWidth + currentWidth + futureWidth/2) * 8},65 800,70 L800,160 Z`}
                fill="url(#dynamicFuture)"
                className="cursor-pointer"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                onMouseEnter={() => setHoveredTopic('future')}
                onMouseLeave={() => setHoveredTopic(null)}
              />
            )}
            
            {/* Floating progress indicators */}
            {topics.map((topic, index) => {
              const topicProgress = getProgressForTopic(topic.id);
              const completion = topicProgress?.completionPercentage || 0;
              const x = 50 + (index * (700 / Math.max(topics.length - 1, 1)));
              const y = 40 + Math.sin(index * 0.8) * 15;
              
              return (
                <motion.circle
                  key={topic.id}
                  cx={x}
                  cy={y}
                  r={completion >= 85 ? "8" : completion > 0 ? "6" : "4"}
                  fill={completion >= 85 ? "#10b981" : completion > 0 ? "#f59e0b" : "rgba(255,255,255,0.3)"}
                  className="cursor-pointer drop-shadow-lg"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 2 + index * 0.1 }}
                  whileHover={{ scale: 1.5 }}
                  onMouseEnter={() => setHoveredTopic(topic.id)}
                  onMouseLeave={() => setHoveredTopic(null)}
                />
              );
            })}
            
            <defs>
              <linearGradient id="dynamicCompleted" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="dynamicCurrent" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="dynamicFuture" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#7c3aed" />
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
                {hoveredTopic === 'completed' && `${topics.filter(t => (getProgressForTopic(t.id)?.completionPercentage || 0) >= 85).length} topics completed`}
                {hoveredTopic === 'current' && `${topics.filter(t => {
                  const p = getProgressForTopic(t.id)?.completionPercentage || 0;
                  return p > 0 && p < 85;
                }).length} topics in progress`}
                {hoveredTopic === 'future' && `${topics.filter(t => (getProgressForTopic(t.id)?.completionPercentage || 0) === 0).length} topics to explore`}
                {topics.find(t => t.id === hoveredTopic) && (
                  <span>
                    {topics.find(t => t.id === hoveredTopic)?.name}: {getProgressForTopic(hoveredTopic)?.completionPercentage || 0}% complete
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
                    {subjectTopics.filter(t => (getProgressForTopic(t.id)?.completionPercentage || 0) >= 85).length} of {subjectTopics.length} completed
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
                              {completionPercentage >= 85 ? '✓ Complete' :
                               completionPercentage > 0 ? '⏳ In Progress' :
                               isUnlocked ? '🔓 Available' : '🔒 Locked'}
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
                            {Math.round(completionPercentage)}% complete
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
      
      {/* Quick Summary Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="text-2xl font-bold text-green-400 mb-1">
            {topics.filter(t => (getProgressForTopic(t.id)?.completionPercentage || 0) >= 85).length}
          </div>
          <div className="text-white/70 text-sm">Topics Mastered</div>
        </div>
        
        <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="text-2xl font-bold text-orange-400 mb-1">
            {topics.filter(t => {
              const p = getProgressForTopic(t.id)?.completionPercentage || 0;
              return p > 0 && p < 85;
            }).length}
          </div>
          <div className="text-white/70 text-sm">In Progress</div>
        </div>
        
        <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="text-2xl font-bold text-accent-teal mb-1">
            {progress.reduce((sum, p) => sum + (p.questionsAnswered || 0), 0)}
          </div>
          <div className="text-white/70 text-sm">Questions Answered</div>
        </div>
        
        <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="text-2xl font-bold text-purple-400 mb-1">
            {progress.reduce((sum, p) => sum + (p.currentStreak || 0), 0)}
          </div>
          <div className="text-white/70 text-sm">Total Streak</div>
        </div>
      </div>
    </div>
  );
}
