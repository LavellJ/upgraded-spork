import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Flame, BookOpen } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useProfile } from '../profile/context';
import { loadEvents, overallCompletion, biomeCompletion, dayStreak, lastJournalRecap } from '../progress';
import type { Lesson } from '../progress';

// Biome definitions matching ActivityPlayer
const BIOMES = {
  forest: { label: "Literacy", color: "#3B7D44", icon: "🌲" },
  desert: { label: "Math", color: "#C96A2B", icon: "🏜️" },
  ocean: { label: "Science", color: "#3BA7B6", icon: "🌊" },
  night: { label: "HASS", color: "#404A73", icon: "🌙" },
} as const;

// Generate lesson list from biome structure (5 lessons per biome)
const generateLessons = (): Lesson[] => {
  const lessons: Lesson[] = [];
  
  Object.keys(BIOMES).forEach(biomeId => {
    for (let i = 1; i <= 5; i++) {
      const lessonId = biomeId === 'forest' ? `f${i}` :
                      biomeId === 'desert' ? `d${i}` :
                      biomeId === 'ocean' ? `o${i}` : `n${i}`;
      
      lessons.push({
        id: lessonId,
        biomeId
      });
    }
  });
  
  return lessons;
};

const HUD_STORAGE_KEY = 'qi.ui.hudCollapsed';

interface ProgressHUDProps {
  className?: string;
}

export function ProgressHUD({ className = '' }: ProgressHUDProps) {
  const { profile } = useProfile();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(HUD_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  
  const [events, setEvents] = useState(() => loadEvents());
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastJournal, setLastJournal] = useState<ReturnType<typeof lastJournalRecap>>(null);
  
  // Auto-refresh events periodically to pick up new activity
  useEffect(() => {
    const refreshEvents = () => {
      const latestEvents = loadEvents();
      setEvents(latestEvents);
      setCurrentStreak(dayStreak(latestEvents));
      setLastJournal(lastJournalRecap(latestEvents));
    };
    
    // Initial calculation
    refreshEvents();
    
    // Refresh every 30 seconds to pick up new progress
    const interval = setInterval(refreshEvents, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const lessons = generateLessons();
  const overall = overallCompletion(lessons, events);
  
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    
    try {
      localStorage.setItem(HUD_STORAGE_KEY, newState.toString());
    } catch (error) {
      console.warn('Failed to save HUD collapsed state:', error);
    }
  };
  
  const formatJournalTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };
  
  const calmMode = profile.calmMode ?? false;
  
  return (
    <motion.div
      className={`fixed bottom-8 right-8 z-40 ${className}`}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        delay: calmMode ? 0.5 : 1.8, 
        duration: calmMode ? 0.3 : 0.6, 
        ease: "easeOut" 
      }}
    >
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-white/50 overflow-hidden max-w-sm">
        <CardContent className="p-0">
          {/* Header - Always Visible */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">
                  {overall.pct}%
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-800">
                  Progress
                </h3>
                <p className="text-xs text-gray-600">
                  {overall.completed}/{overall.total} lessons
                </p>
              </div>
            </div>
            
            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-full hover:bg-white/80 transition-colors"
              aria-label={isCollapsed ? 'Show progress details' : 'Hide progress details'}
              aria-expanded={!isCollapsed}
              data-testid="progress-hud-toggle"
            >
              {isCollapsed ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
          
          {/* Expandable Content */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ 
                  duration: calmMode ? 0.2 : 0.3, 
                  ease: "easeInOut" 
                }}
                className="overflow-hidden"
              >
                <div className="p-3 space-y-4">
                  {/* Biome Progress */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2">
                      Learning Areas
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(BIOMES).map(([biomeId, biome]) => {
                        const biomeLessons = lessons.filter(l => l.biomeId === biomeId);
                        const completion = biomeCompletion(biomeId, biomeLessons, events);
                        
                        return (
                          <div key={biomeId} className="flex items-center gap-2">
                            <span className="text-sm">{biome.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-700 truncate">
                                  {biome.label}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {completion.completed}/{completion.total}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <motion.div
                                  className="h-1.5 rounded-full"
                                  style={{ backgroundColor: biome.color }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${completion.pct}%` }}
                                  transition={{ 
                                    duration: calmMode ? 0.5 : 0.8, 
                                    ease: "easeOut",
                                    delay: calmMode ? 0 : 0.1 
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Day Streak */}
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                    <div 
                      className="flex items-center gap-1"
                      aria-live={currentStreak > 0 ? "polite" : "off"}
                    >
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-orange-700">
                        {currentStreak} day{currentStreak !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-xs text-orange-600">
                      {currentStreak > 0 ? 'streak!' : 'Start your streak!'}
                    </span>
                  </div>
                  
                  {/* Last Journal Session */}
                  {lastJournal && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                      <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-blue-700 truncate">
                          Last practice: {lastJournal.skillId.replace('.', ' → ')}
                        </div>
                        <div className="text-xs text-blue-600">
                          {lastJournal.correct}/{lastJournal.n} correct • {formatJournalTime(lastJournal.when)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}