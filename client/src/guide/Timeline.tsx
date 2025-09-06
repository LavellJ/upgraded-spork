import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, BookOpen, Target, Filter, ChevronDown, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { loadEvents, getEventsRange } from '../progress';
import type { ProgressEvent } from '../progress';
import registryData from '../data/registry.json';
import { STANDARDS } from '../data/meta';
import { loadJournalHistory } from '../journal/JournalSheet';
import { getReflectionAt } from '../reflections/model';
import { JournalReviewSheet } from '../journal/JournalReviewSheet';
import { TeacherLayoutV2 } from './teacher/TeacherLayoutV2';
import { useFlags } from '../config/flags';

interface TimelineProps {
  selectedStandard?: string;
  onStandardChange?: (standard: string) => void;
  onStartJournal?: (skillId: string) => void;
}

interface TimelineState {
  reviewSessionId: string | null;
}

type EventKind = 'all' | 'lessons' | 'journal' | 'scout';
type TimeRange = 7 | 30 | 90;

// Registry type for easier access
interface RegistryEntry {
  standards?: {
    Generic?: string;
    ACARA?: string;
    NZC?: string;
  };
  url?: string;
  est?: string;
}

interface RegistryData {
  [loop: string]: {
    [biome: string]: {
      [lessonId: string]: RegistryEntry;
    };
  };
}

const registry = registryData as RegistryData;

export function Timeline({ selectedStandard, onStandardChange, onStartJournal }: TimelineProps) {
  const { teacherPanelV2 } = useFlags();
  const [kindFilter, setKindFilter] = useState<EventKind>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
  
  // Get events based on time range
  const events = useMemo(() => {
    return getEventsRange(timeRange);
  }, [timeRange]);
  
  // Filter events by kind and standard
  const filteredEvents = useMemo(() => {
    let filtered = events;
    
    // Filter by kind
    if (kindFilter === 'lessons') {
      filtered = filtered.filter(event => 
        event.kind === 'lesson_start' || event.kind === 'lesson_finish'
      );
    } else if (kindFilter === 'journal') {
      filtered = filtered.filter(event => 
        event.kind === 'journal_start' || event.kind === 'journal_finish'
      );
    } else if (kindFilter === 'scout') {
      filtered = filtered.filter(event => 
        event.kind === 'scout_msg'
      );
    }
    
    // Filter by standard if selected
    if (selectedStandard && selectedStandard !== 'all') {
      filtered = filtered.filter(event => {
        if (event.kind === 'lesson_start' || event.kind === 'lesson_finish') {
          // Check if lesson belongs to selected standard
          const lessonStandards = getLessonStandards('lessonId' in event ? event.lessonId : '');
          return lessonStandards.some(std => std.includes(selectedStandard));
        } else if (event.kind === 'journal_start' || event.kind === 'journal_finish') {
          // Check if skill belongs to selected standard  
          const skillId = 'skillId' in event ? event.skillId : '';
          const skillStandards = getSkillStandards(skillId);
          return skillStandards.some(std => std.includes(selectedStandard));
        }
        return false;
      });
    }
    
    return filtered;
  }, [events, kindFilter, selectedStandard]);
  
  // Group events by day
  const groupedEvents = useMemo(() => {
    const groups: { [date: string]: ProgressEvent[] } = {};
    
    filteredEvents.forEach(event => {
      const date = new Date(event.at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });
    
    // Sort dates in reverse chronological order
    const sortedDates = Object.keys(groups).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
    
    return sortedDates.map(date => ({
      date,
      events: groups[date].sort((a, b) => b.at - a.at) // Sort events within day by time (newest first)
    }));
  }, [filteredEvents]);
  
  const getLessonStandards = (lessonId: string): string[] => {
    // Find lesson in registry
    for (const loop of Object.values(registry)) {
      for (const biome of Object.values(loop)) {
        if (biome[lessonId]?.standards) {
          return Object.values(biome[lessonId].standards || {}).filter(Boolean);
        }
      }
    }
    return [];
  };
  
  const getSkillStandards = (skillId: string): string[] => {
    // Map journal skills to biomes and get standards
    // Assuming skillId format like "literacy.phonics" or "math.numbers"
    const [domain] = skillId.split('.');
    const biomeMap: { [key: string]: string } = {
      'literacy': 'forest',
      'math': 'desert', 
      'science': 'ocean',
      'hass': 'night'
    };
    
    const biome = biomeMap[domain];
    if (biome && selectedStandard && STANDARDS[selectedStandard as keyof typeof STANDARDS]) {
      const biomeStandards = STANDARDS[selectedStandard as keyof typeof STANDARDS];
      if (typeof biomeStandards === 'object' && biome in biomeStandards) {
        return [biomeStandards[biome as keyof typeof biomeStandards]];
      }
    }
    
    return [];
  };
  
  const getLessonTitle = (lessonId: string): string => {
    // Get lesson title from loop data or registry
    for (const loop of Object.values(registry)) {
      for (const biome of Object.values(loop)) {
        if (biome[lessonId]) {
          return lessonId; // Return lesson ID as title for now
        }
      }
    }
    return lessonId;
  };
  
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  const getEventIcon = (event: ProgressEvent): string => {
    switch (event.kind) {
      case 'lesson_start':
        return '▶️';
      case 'lesson_finish':
        return 'result' in event && event.result === 'pass' ? '✅' : '🔄';
      case 'journal_start':
        return '📝';
      case 'journal_finish':
        return '✍️';
      case 'scout_msg':
        if ('priority' in event) {
          switch (event.priority) {
            case 'critical': return '🔴';
            case 'actionable': return '🟡';
            case 'info': return '💬';
            default: return '🧭';
          }
        }
        return '🧭';
      default:
        return '📊';
    }
  };
  
  const getEventDescription = (event: ProgressEvent): string => {
    switch (event.kind) {
      case 'lesson_start':
        return `Started lesson: ${getLessonTitle('lessonId' in event ? event.lessonId : '')}`;
      case 'lesson_finish':
        const result = 'result' in event ? event.result : 'unknown';
        const duration = 'durationSec' in event ? ` (${formatDuration(event.durationSec)})` : '';
        return `${result === 'pass' ? 'Completed' : 'Attempted'} lesson: ${getLessonTitle('lessonId' in event ? event.lessonId : '')}${duration}`;
      case 'journal_start':
        return `Started practice: ${'skillId' in event ? event.skillId.replace('.', ' → ') : ''}`;
      case 'journal_finish':
        const correct = 'correct' in event ? event.correct : 0;
        const total = 'n' in event ? event.n : 0;
        const journalDuration = 'durationSec' in event ? ` (${formatDuration(event.durationSec)})` : '';
        return `Finished practice: ${'skillId' in event ? event.skillId.replace('.', ' → ') : ''} • ${correct}/${total} correct${journalDuration}`;
      case 'scout_msg':
        if ('text' in event && 'cta' in event) {
          const scoutText = `Scout: ${event.text}`;
          const ctaText = event.cta?.label ? ` • CTA: ${event.cta.label}` : '';
          return scoutText + ctaText;
        }
        return 'Scout intervention';
      default:
        return 'Activity';
    }
  };

  // Find journal session ID for review functionality
  const findJournalSessionId = (event: ProgressEvent): string | null => {
    if (event.kind !== 'journal_finish' || !('skillId' in event)) return null;
    
    const journalHistory = loadJournalHistory();
    const skillId = event.skillId;
    const eventTime = event.at;
    
    // Find the closest journal session by timestamp and skillId
    const matching = journalHistory.find(entry => 
      entry.skillId === skillId && 
      Math.abs(new Date(entry.date).getTime() - eventTime) < 5 * 60 * 1000 // Within 5 minutes
    );
    
    return matching?.sessionId || null;
  };

  const handleReviewSession = (sessionId: string) => {
    setReviewSessionId(sessionId);
  };
  
  // Standards options for filter
  const standardOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Standards' }];
    
    STANDARDS.frameworkOptions.forEach(framework => {
      const frameworkStandards = STANDARDS[framework as keyof typeof STANDARDS];
      if (typeof frameworkStandards === 'object') {
        Object.entries(frameworkStandards).forEach(([biome, standard]) => {
          options.push({
            value: framework,
            label: `${framework}: ${standard}`
          });
        });
      }
    });
    
    return options;
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Learning Timeline
          </CardTitle>
          <Badge variant="outline">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
          </Badge>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={kindFilter} onValueChange={(value) => setKindFilter(value as EventKind)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="lessons">Lessons</SelectItem>
                <SelectItem value="journal">Journal</SelectItem>
                <SelectItem value="scout">Scout</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(Number(value) as TimeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          {onStandardChange && (
            <Select value={selectedStandard || 'all'} onValueChange={onStandardChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by standard" />
              </SelectTrigger>
              <SelectContent>
                {standardOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {groupedEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="font-medium mb-1">No Activity Found</h3>
            <p className="text-sm">
              {selectedStandard && selectedStandard !== 'all' 
                ? 'No events match the selected standard filter.'
                : `No learning activity in the last ${timeRange} days.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6" role="feed" aria-label="Learning timeline">
            {groupedEvents.map(({ date, events: dayEvents }) => (
              <div key={date} className="relative">
                <div className="sticky top-0 bg-white/90 backdrop-blur-sm py-2 mb-3 border-b">
                  <h4 className="font-semibold text-sm text-gray-700">
                    {new Date(date).toLocaleDateString([], { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                </div>
                
                <div className="space-y-3 ml-4">
                  {dayEvents.map((event, index) => (
                    <motion.div
                      key={`${event.at}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      role="listitem"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          // Could open event details here
                        }
                      }}
                      aria-label={
                        event.kind === 'scout_msg' && 'priority' in event && 'text' in event
                          ? `Scout message, ${event.priority} priority, ${event.cta?.label ? 'CTA offered' : 'no CTA'}`
                          : event.kind === 'journal_finish'
                          ? 'Journal session, click to review'
                          : 'Learning activity'
                      }
                      data-testid={`timeline-event-${event.kind}`}
                    >
                      <div className="text-lg flex-shrink-0">
                        {getEventIcon(event)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium">
                          {getEventDescription(event)}
                        </p>
                        
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {formatTime(event.at)}
                            </span>
                            
                            {'biomeId' in event && event.biomeId && (
                              <Badge variant="secondary" className="text-xs">
                                {event.biomeId}
                              </Badge>
                            )}
                            
                            {/* Reflection indicator */}
                            {getReflectionAt(event.at) && (
                              <Badge variant="outline" className="text-xs">
                                💭 Reflection
                              </Badge>
                            )}
                          </div>
                          
                          {/* Review button for journal_finish events */}
                          {event.kind === 'journal_finish' && findJournalSessionId(event) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                const sessionId = findJournalSessionId(event);
                                if (sessionId) handleReviewSession(sessionId);
                              }}
                              className="text-xs h-6 px-2"
                              data-testid="review-session-button"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Journal Review Sheet */}
      <JournalReviewSheet
        open={!!reviewSessionId}
        onClose={() => setReviewSessionId(null)}
        sessionId={reviewSessionId}
        onStartRedo={onStartJournal}
      />
    </Card>
  );

  return teacherPanelV2 ? (
    <TeacherLayoutV2 
      activeTab="timeline" 
      onTabChange={() => {}} 
      onClose={() => {}}
      renderContent={() => (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-fg-base">Timeline</h1>
            <p className="text-fg-muted">Recent activity & notes</p>
          </div>
          {body}
        </div>
      )}
    />
  ) : body;
}