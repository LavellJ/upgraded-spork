import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useRoute } from 'wouter';
import { TeachBlock } from './blocks/TeachBlock';
import { GuidedPractice } from './blocks/GuidedPractice';
import { IndependentPractice } from './blocks/IndependentPractice';
import { ExitTicket } from './blocks/ExitTicket';
import { Button } from '../components/ui/button';
import { ArrowLeft, Trophy, BookOpen } from 'lucide-react';
import type { 
  TeachBlockActivity, 
  GuidedPracticeActivity, 
  IndependentPracticeActivity, 
  ExitTicketActivity 
} from '../authoring/heroSchema';
import { pushEvent } from '../progress/events';
import { startOnTask, stopOnTask } from '../analytics/onTask';
import { useScoutQueue } from '../hooks/useScoutQueue';
import { pickScoutLine, triggerScoutEvent } from '../learning/scout';
import { useProfile } from '../profile/context';
import { useRoster } from '../roster/context';

interface HeroLessonData {
  version: 2;
  id: string;
  biomeId: string;
  title: { 'en-AU': string };
  summary?: { 'en-AU': string };
  skills: string[];
  activities: Array<
    | TeachBlockActivity
    | GuidedPracticeActivity 
    | IndependentPracticeActivity
    | ExitTicketActivity
  >;
  standards: Array<{
    framework: string;
    code: string;
  }>;
  meta: {
    estimatedDuration: number;
    difficultyLevel: string;
    prerequisiteSkills?: string[];
    learningObjectives?: string[];
    scoutCues?: {
      celebration?: string;
      encouragement?: string;
      nextSteps?: string;
    };
  };
}

interface HeroLessonRunnerProps {
  lessonData: HeroLessonData;
  onComplete: (results: LessonResults) => void;
  onExit: () => void;
}

interface LessonResults {
  lessonId: string;
  biomeId: string;
  completed: boolean;
  score: number;
  timeSpent: number;
  activityResults: ActivityResult[];
  compassNext?: {
    type: string;
    skillId?: string;
    lessonId?: string;
    rationale: string;
  };
}

interface ActivityResult {
  activityId: string;
  activityType: string;
  completed: boolean;
  score?: number;
  timeSpent: number;
  data?: any;
}

/**
 * HeroLessonRunner: Orchestrates hero lesson blocks with Scout integration and analytics
 * - Manages lesson flow through multiple activity blocks
 * - Integrates with Scout for contextual messages and encouragement
 * - Tracks comprehensive analytics for each interaction
 * - Handles Compass routing for next steps after completion
 */
export function HeroLessonRunner({ lessonData, onComplete, onExit }: HeroLessonRunnerProps) {
  const [, setLocation] = useLocation();
  const { profile } = useProfile();
  const { activeLearner } = useRoster();
  const { enqueue } = useScoutQueue();

  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [lessonStartTime] = useState(Date.now());
  const [activityResults, setActivityResults] = useState<ActivityResult[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalResults, setFinalResults] = useState<LessonResults | null>(null);

  const currentActivity = lessonData.activities[currentActivityIndex];
  const isLastActivity = currentActivityIndex === lessonData.activities.length - 1;

  // Initialize lesson tracking and Scout welcome
  useEffect(() => {
    // Start analytics tracking
    startOnTask('lesson');
    
    // Log lesson start event
    pushEvent({
      kind: 'lesson_start',
      at: Date.now(),
      lessonId: lessonData.id,
      biomeId: lessonData.biomeId
    }, activeLearner?.id);

    // Trigger Scout lesson start event
    triggerScoutEvent('lessonStart', { 
      lessonId: lessonData.id, 
      biomeId: lessonData.biomeId 
    });

    // Send Scout welcome message
    const scoutLine = pickScoutLine(
      'lesson_welcome',
      { age: profile.age || 8, name: profile.name || 'Explorer' },
      { lessonTitle: lessonData.title['en-AU'] }
    );
    
    if (scoutLine) {
      enqueue({
        id: 'lesson_welcome',
        text: scoutLine.text,
        priority: 'info'
      });
    }

    // Activity ping to keep engagement tracking active
    const activityPingInterval = setInterval(() => {
      pingActivity();
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(activityPingInterval);
      stopOnTask();
    };
  }, [lessonData.id, lessonData.biomeId, lessonData.title, profile, rosterContext?.activeLearner?.id, enqueueMessage]);

  // Handle activity events and analytics
  const handleActivityEvent = (eventType: string, data?: any) => {
    const eventData = {
      lessonId: lessonData.id,
      biomeId: lessonData.biomeId,
      activityId: currentActivity.id,
      activityType: currentActivity.kind,
      activityIndex: currentActivityIndex,
      eventType,
      ...data
    };

    // Log activity-specific events as custom scout analytics
    pushEvent({
      kind: 'scout_analytics',
      at: Date.now(),
      id: `activity_${eventType}`,
      priority: 'info',
      action: 'shown',
      sessionId: `lesson_${lessonData.id}_${Date.now()}`,
      abVariant: eventData
    }, activeLearner?.id);

    // Send contextual Scout messages based on activity progress
    if (eventType === 'video_completed' || eventType === 'guided_practice_completed') {
      const encouragementLine = pickScoutLine(
        'activity_progress',
        { age: profile.age || 8, name: profile.name || 'Explorer' },
        { activityType: currentActivity.kind }
      );
      
      if (encouragementLine) {
        enqueue({
          id: `activity_${currentActivity.id}_progress`,
          text: encouragementLine.text,
          priority: 'info'
        });
      }
    }

    // Trigger Scout events for expression changes
    if (eventType === 'incorrect_answer') {
      triggerScoutEvent('firstMiss', { step: data?.step || 1, hintsUsed: data?.hintsUsed || 0 });
    }
    if (eventType === 'hint_requested') {
      triggerScoutEvent('hintUsed', { step: data?.step || 1, hintsUsed: (data?.hintsUsed || 0) + 1 });
    }
  };

  const handleActivityComplete = (activityResult: Omit<ActivityResult, 'activityId' | 'activityType'>) => {
    const result: ActivityResult = {
      activityId: currentActivity.id,
      activityType: currentActivity.kind,
      ...activityResult
    };

    const newResults = [...activityResults, result];
    setActivityResults(newResults);

    if (isLastActivity) {
      handleLessonComplete(newResults);
    } else {
      // Send Scout encouragement for activity completion
      const celebrationLine = pickScoutLine(
        'activity_complete',
        { age: profile.age || 8, name: profile.name || 'Explorer' },
        { activityType: currentActivity.kind }
      );
      
      if (celebrationLine) {
        enqueue({
          id: `activity_${currentActivity.id}_complete`,
          text: celebrationLine.text,
          priority: 'info'
        });
      }

      // Move to next activity
      setTimeout(() => {
        setCurrentActivityIndex(prev => prev + 1);
      }, 1500);
    }
  };

  const handleLessonComplete = (allResults: ActivityResult[]) => {
    const totalTimeSpent = Date.now() - lessonStartTime;
    const overallScore = allResults.length > 0 
      ? allResults.reduce((sum, result) => sum + (result.score || 0), 0) / allResults.length
      : 0;

    // Get Compass routing from ExitTicket if available
    const exitTicketResult = allResults.find(r => r.activityType === 'exit_ticket');
    const compassNext = exitTicketResult?.data?.nextStep;

    const lessonResults: LessonResults = {
      lessonId: lessonData.id,
      biomeId: lessonData.biomeId,
      completed: true,
      score: overallScore,
      timeSpent: Math.round(totalTimeSpent / 1000), // Convert to seconds
      activityResults: allResults,
      compassNext
    };

    // Log lesson completion
    pushEvent({
      kind: 'lesson_finish',
      at: Date.now(),
      lessonId: lessonData.id,
      biomeId: lessonData.biomeId,
      durationSec: Math.round(totalTimeSpent / 1000),
      result: overallScore >= 0.8 ? 'pass' : 'retry'
    }, activeLearner?.id);

    // Send final Scout celebration
    const celebrationMessage = lessonData.meta.scoutCues?.celebration || 
      pickScoutLine(
        'lesson_complete',
        { age: profile.age || 8, name: profile.name || 'Explorer' },
        { 
          lessonTitle: lessonData.title['en-AU'],
          score: Math.round(overallScore * 100)
        }
      )?.text;

    if (celebrationMessage) {
      enqueue({
        id: `lesson_${lessonData.id}_complete`,
        text: celebrationMessage,
        priority: 'info'
      });
    }

    setFinalResults(lessonResults);
    setIsCompleted(true);
    stopOnTask();
  };

  const handleExit = () => {
    // Log partial completion if exiting early
    if (!isCompleted) {
      const partialTimeSpent = Date.now() - lessonStartTime;
      pushEvent({
        kind: 'lesson_finish',
        at: Date.now(),
        lessonId: lessonData.id,
        biomeId: lessonData.biomeId,
        durationSec: Math.round(partialTimeSpent / 1000),
        result: 'retry'
      }, activeLearner?.id);

      stopOnTask();
    }
    
    onExit();
  };

  const handleContinue = () => {
    if (finalResults) {
      onComplete(finalResults);
    }
  };

  // Completion screen
  if (isCompleted && finalResults) {
    return (
      <div 
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
        data-testid="lesson-complete-screen"
      >
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4" data-testid="lesson-complete-title">
            Lesson Complete!
          </h1>
          
          <p className="text-xl text-gray-600 mb-6" data-testid="lesson-complete-summary">
            {lessonData.title['en-AU']}
          </p>

          {/* Results Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600" data-testid="lesson-score">
                  {Math.round(finalResults.score * 100)}%
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600" data-testid="lesson-duration">
                  {Math.round(finalResults.timeSpent / 60)}m
                </div>
                <div className="text-sm text-gray-600">Time Spent</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600" data-testid="activities-completed">
                Completed {finalResults.activityResults.filter(r => r.completed).length} of {lessonData.activities.length} activities
              </div>
            </div>
          </div>

          {/* Next Steps from Compass */}
          {finalResults.compassNext && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <BookOpen className="text-blue-600 mt-1" size={20} />
                <div className="text-left">
                  <div className="font-medium text-blue-900 mb-1">What's Next?</div>
                  <p className="text-blue-700" data-testid="compass-next-step">
                    {finalResults.compassNext.rationale}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            data-testid="continue-button"
          >
            Continue Learning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
      data-testid="hero-lesson-runner"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleExit}
            className="text-gray-600 hover:text-gray-800"
            data-testid="exit-lesson-button"
          >
            <ArrowLeft size={20} className="mr-2" />
            Exit Lesson
          </Button>
          
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900" data-testid="lesson-title">
              {lessonData.title['en-AU']}
            </h1>
            <p className="text-sm text-gray-500" data-testid="activity-progress">
              Activity {currentActivityIndex + 1} of {lessonData.activities.length}
            </p>
          </div>

          <div className="w-16" /> {/* Spacer for center alignment */}
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${((currentActivityIndex + 1) / lessonData.activities.length) * 100}%` 
              }}
              data-testid="lesson-progress-bar"
            />
          </div>
        </div>
      </div>

      {/* Activity Content */}
      <div className="p-6">
        {currentActivity.kind === 'teach_block' && (
          <TeachBlock
            activity={currentActivity as TeachBlockActivity}
            onComplete={() => handleActivityComplete({ 
              completed: true, 
              timeSpent: Math.round((Date.now() - lessonStartTime) / 1000) 
            })}
            onEvent={handleActivityEvent}
          />
        )}

        {currentActivity.kind === 'guided_practice' && (
          <GuidedPractice
            activity={currentActivity as GuidedPracticeActivity}
            onComplete={(stepResults) => {
              const score = stepResults.filter(r => r.isCorrect).length / stepResults.length;
              handleActivityComplete({ 
                completed: true, 
                score,
                timeSpent: Math.round((Date.now() - lessonStartTime) / 1000),
                data: { stepResults }
              });
            }}
            onEvent={handleActivityEvent}
          />
        )}

        {currentActivity.kind === 'independent_practice' && (
          <IndependentPractice
            activity={currentActivity as IndependentPracticeActivity}
            onComplete={(score, questionResults) => {
              const totalQuestions = (currentActivity as IndependentPracticeActivity).questionsToShow || 
                                   (currentActivity as IndependentPracticeActivity).questionBank.length;
              handleActivityComplete({ 
                completed: true, 
                score: score / totalQuestions,
                timeSpent: Math.round((Date.now() - lessonStartTime) / 1000),
                data: { questionResults }
              });
            }}
            onEvent={handleActivityEvent}
          />
        )}

        {currentActivity.kind === 'exit_ticket' && (
          <ExitTicket
            activity={currentActivity as ExitTicketActivity}
            onComplete={(exitResults) => {
              handleActivityComplete({ 
                completed: true, 
                score: exitResults.score,
                timeSpent: Math.round((Date.now() - lessonStartTime) / 1000),
                data: exitResults
              });
            }}
            onEvent={handleActivityEvent}
          />
        )}
      </div>
    </div>
  );
}