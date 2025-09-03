import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  TrendingUp,
  Filter,
  ExternalLink
} from 'lucide-react';
import { 
  getActiveAssignments, 
  getPathProgress, 
  getLessonAssignment,
  isDueSoon, 
  isOverdue,
  formatDue,
  upsertPathV2,
  type AssignedPathV2 
} from './assign';
import { useRosterOptional } from '../roster';
import registryData from '../data/registry.json';
import loop1Data from '../data/loop1.json';
import loop2Data from '../data/loop2.json';

interface AssignmentsSummaryProps {
  className?: string;
  onOpenJournal?: (skillId: string) => void;
}

export function AssignmentsSummary({ className = '', onOpenJournal }: AssignmentsSummaryProps) {
  const rosterContext = useRosterOptional();
  const learnerId = rosterContext?.activeLearner?.id;
  
  const [showDueOnly, setShowDueOnly] = useState(false);
  
  const assignments = useMemo(() => {
    if (!learnerId) return [];
    return getActiveAssignments(learnerId);
  }, [learnerId]);

  const summary = useMemo(() => {
    const now = Date.now();
    let totalLessons = 0;
    let completedLessons = 0;
    let dueSoonCount = 0;
    let overdueCount = 0;
    let highPriorityCount = 0;

    assignments.forEach(path => {
      const progress = getPathProgress(path);
      totalLessons += progress.total;
      completedLessons += progress.done;
      
      if (path.priority === 'high') highPriorityCount++;
      
      path.lessons.forEach(lesson => {
        if (lesson.status !== 'done') {
          const dueAt = lesson.dueAt || path.dueAt;
          if (dueAt) {
            if (isOverdue(dueAt, now)) {
              overdueCount++;
            } else if (isDueSoon(dueAt, now)) {
              dueSoonCount++;
            }
          }
        }
      });
    });

    return {
      totalPaths: assignments.length,
      totalLessons,
      completedLessons,
      dueSoonCount,
      overdueCount,
      highPriorityCount,
      completionRate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    };
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    if (!showDueOnly) return assignments;
    
    const now = Date.now();
    return assignments.filter(path => {
      return path.lessons.some(lesson => {
        if (lesson.status === 'done') return false;
        const dueAt = lesson.dueAt || path.dueAt;
        return dueAt && (isDueSoon(dueAt, now) || isOverdue(dueAt, now));
      });
    });
  }, [assignments, showDueOnly]);

  const markLessonDone = (pathId: string, lessonId: string) => {
    if (!learnerId) return;
    
    const path = assignments.find(p => p.id === pathId);
    if (!path) return;
    
    const updatedPath: AssignedPathV2 = {
      ...path,
      lessons: path.lessons.map(lesson => 
        lesson.lessonId === lessonId 
          ? { ...lesson, status: 'done', completedAt: Date.now() }
          : lesson
      ),
      updatedAt: Date.now()
    };
    
    upsertPathV2(updatedPath, learnerId);
    // Force re-render by updating the roster context or trigger a refresh
    window.location.reload();
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'low': return <Target className="w-4 h-4 text-gray-400" />;
      default: return <Target className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLessonInfo = (lessonId: string) => {
    // Try to find lesson in loop data
    const loopDataSets = [loop1Data, loop2Data];
    for (const loopData of loopDataSets) {
      for (const [biome, biomeData] of Object.entries(loopData)) {
        if (biomeData[lessonId]) {
          return {
            id: lessonId,
            title: biomeData[lessonId].title || lessonId,
            biome: biome,
            skillId: biomeData[lessonId].skillId || lessonId
          };
        }
      }
    }
    
    // Fallback to registry data
    for (const [loopNum, loopData] of Object.entries(registryData)) {
      for (const [biome, biomeData] of Object.entries(loopData)) {
        if (biomeData[lessonId]) {
          return {
            id: lessonId,
            title: lessonId,
            biome: biome,
            skillId: lessonId
          };
        }
      }
    }
    
    return null;
  };

  if (!learnerId) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        No active learner selected.
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <Target className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <div className="text-sm">No assignments found</div>
        <div className="text-xs text-gray-400">Create an assignment to get started</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Assignment Summary</h3>
        <button
          onClick={() => setShowDueOnly(!showDueOnly)}
          className={`flex items-center gap-1 px-2 py-1 text-xs border rounded ${
            showDueOnly ? 'bg-orange-50 border-orange-200 text-orange-700' : 'hover:bg-gray-50'
          }`}
        >
          <Filter className="w-3 h-3" />
          {showDueOnly ? 'Show All' : 'Due Soon/Overdue'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <div className="text-sm font-medium text-blue-800">Progress</div>
          </div>
          <div className="mt-1">
            <div className="text-lg font-bold text-blue-900">
              {summary.completedLessons}/{summary.totalLessons}
            </div>
            <div className="text-xs text-blue-700">
              {summary.completionRate}% complete • {summary.totalPaths} paths
            </div>
          </div>
        </div>

        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <div className="text-sm font-medium text-orange-800">Due Soon</div>
          </div>
          <div className="mt-1">
            <div className="text-lg font-bold text-orange-900">
              {summary.dueSoonCount}
            </div>
            <div className="text-xs text-orange-700">
              lessons within 48h
            </div>
          </div>
        </div>

        {summary.overdueCount > 0 && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div className="text-sm font-medium text-red-800">Overdue</div>
            </div>
            <div className="mt-1">
              <div className="text-lg font-bold text-red-900">
                {summary.overdueCount}
              </div>
              <div className="text-xs text-red-700">
                lessons past due
              </div>
            </div>
          </div>
        )}

        {summary.highPriorityCount > 0 && (
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <div className="text-sm font-medium text-purple-800">High Priority</div>
            </div>
            <div className="mt-1">
              <div className="text-lg font-bold text-purple-900">
                {summary.highPriorityCount}
              </div>
              <div className="text-xs text-purple-700">
                assignments
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assignment List */}
      <div className="space-y-3">
        {filteredAssignments.map((path) => {
          const progress = getPathProgress(path);
          const now = Date.now();
          
          return (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-white border rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getPriorityIcon(path.priority)}
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">{path.name}</h4>
                    {path.dueAt && (
                      <div className={`text-xs ${
                        isOverdue(path.dueAt, now) ? 'text-red-600' :
                        isDueSoon(path.dueAt, now) ? 'text-orange-600' : 'text-gray-500'
                      }`}>
                        Due {formatDue(path.dueAt)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  {progress.done}/{progress.total} ({progress.pct}%)
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>

              {/* Lessons */}
              <div className="space-y-1">
                {path.lessons.map((lesson) => {
                  const lessonInfo = getLessonInfo(lesson.lessonId);
                  const dueAt = lesson.dueAt || path.dueAt;
                  const isLessonOverdue = dueAt && isOverdue(dueAt, now);
                  const isLessonDueSoon = dueAt && isDueSoon(dueAt, now);
                  
                  if (showDueOnly && lesson.status === 'done') return null;
                  if (showDueOnly && !dueAt) return null;
                  if (showDueOnly && !isLessonOverdue && !isLessonDueSoon) return null;
                  
                  return (
                    <div 
                      key={lesson.lessonId}
                      className={`flex items-center justify-between p-2 rounded border text-xs ${
                        lesson.status === 'done' ? 'bg-green-50 border-green-200' :
                        isLessonOverdue ? 'bg-red-50 border-red-200' :
                        isLessonDueSoon ? 'bg-orange-50 border-orange-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full ${
                          lesson.status === 'done' ? 'bg-green-500' :
                          lesson.status === 'in_progress' ? 'bg-blue-500' :
                          'bg-gray-300'
                        }`} />
                        
                        <div className="truncate">
                          <div className="font-medium">
                            {lessonInfo?.title || lesson.lessonId}
                          </div>
                          {dueAt && (
                            <div className={`${
                              isLessonOverdue ? 'text-red-600' :
                              isLessonDueSoon ? 'text-orange-600' : 'text-gray-500'
                            }`}>
                              Due {formatDue(dueAt)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {lesson.status !== 'done' && (
                          <button
                            onClick={() => markLessonDone(path.id, lesson.lessonId)}
                            className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                            title="Mark as done"
                          >
                            ✓ Done
                          </button>
                        )}
                        
                        {lessonInfo && onOpenJournal && (
                          <button
                            onClick={() => onOpenJournal(lessonInfo.skillId)}
                            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                            title="Quick practice"
                          >
                            Journal
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {showDueOnly && filteredAssignments.length === 0 && (
        <div className="text-center py-6 text-gray-500 text-sm">
          <Clock className="w-6 h-6 mx-auto mb-2 text-gray-300" />
          <div>No due or overdue assignments</div>
          <div className="text-xs text-gray-400">Great job staying on track!</div>
        </div>
      )}
    </div>
  );
}