import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { motion, AnimatePresence } from 'framer-motion';
import type { JournalItem, JournalSession, JournalHistoryEntry, SkillLevel } from '../schema/journal';
import { getGenerator, getLevelFromMastery } from './generator';
import { learnerCache } from '../learning/model';
import { nanoid } from 'nanoid';
import { pushEvent, trackFunnelStep } from '../progress/events';
import { ReflectionPrompt } from '../reflections/ReflectionPrompt';
import { useOnline } from '../pwa/useOnline';
import { startOnTask, stopOnTask } from '../analytics/onTask';

interface JournalSheetProps {
  open: boolean;
  onClose: () => void;
  skillId?: string;
  calm?: boolean;
  onComplete?: () => void;
  source?: 'scout' | 'guide' | 'manual';
}

interface SessionResponse {
  itemId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

const JOURNAL_HISTORY_KEY = 'qi.journal.history.v1';

// Export function to load journal history for review functionality
export function loadJournalHistory(): JournalHistoryEntry[] {
  try {
    const stored = localStorage.getItem(JOURNAL_HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load journal history:', error);
    return [];
  }
}

// Get specific session for review
export function getJournalSession(sessionId: string): JournalHistoryEntry | null {
  const history = loadJournalHistory();
  return history.find(entry => entry.sessionId === sessionId) || null;
}

export function JournalSheet({ 
  open, 
  onClose, 
  skillId, 
  calm = false,
  onComplete,
  source = 'manual'
}: JournalSheetProps) {
  const { online } = useOnline();
  const [session, setSession] = useState<JournalSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState<SessionResponse[]>([]);
  const [itemStartTime, setItemStartTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [showReflection, setShowReflection] = useState(false);

  // Initialize session when opened
  useEffect(() => {
    if (open && !session) {
      initializeSession();
      
      // Start on-task tracking for journal
      startOnTask('journal');
    } else if (!open) {
      // Reset state when closed
      setSession(null);
      setCurrentIndex(0);
      setUserAnswer('');
      setShowFeedback(false);
      setResponses([]);
      setIsComplete(false);
      setShowReflection(false);
      
      // Stop on-task tracking when journal closes
      stopOnTask();
    }
  }, [open, skillId]);

  const initializeSession = async () => {
    if (!skillId) return;
    
    setIsLoading(true);
    try {
      const learnerState = learnerCache.getState();
      const skill = learnerState.skills[skillId];
      const mastery = skill?.p || 0.5;
      const level = getLevelFromMastery(mastery);
      
      const generator = getGenerator();
      const items = await generator.generate(skillId, level, 4); // 4 items for session
      
      const newSession: JournalSession = {
        id: nanoid(),
        skillId,
        targetLevel: level,
        items,
        startedAt: Date.now()
      };
      
      // Track journal session start
      pushEvent({
        kind: 'journal_start',
        at: newSession.startedAt,
        skillId,
        source
      });
      
      // Track first journal usage in funnel
      trackFunnelStep('first_journal');
      
      // Set current skill ID for Scout system
      import('../learning/scoutQueue').then(({ setCurrentSkillId }) => {
        setCurrentSkillId(skillId);
      });
      
      setSession(newSession);
      setItemStartTime(Date.now());
    } catch (error) {
      console.error('Failed to initialize journal session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAnswer = (item: JournalItem, answer: string): boolean => {
    if (item.kind === 'mcq') {
      return answer === item.answer;
    } else {
      // For short answers, do basic string comparison (case-insensitive)
      const cleanAnswer = answer.toLowerCase().trim();
      const correctAnswer = item.answer?.toLowerCase().trim() || '';
      
      // Allow some flexibility in short answers
      return cleanAnswer === correctAnswer || 
             cleanAnswer.includes(correctAnswer) ||
             correctAnswer.includes(cleanAnswer);
    }
  };

  const handleSubmitAnswer = () => {
    if (!session || !userAnswer.trim()) return;
    
    const currentItem = session.items[currentIndex];
    const isCorrect = checkAnswer(currentItem, userAnswer);
    const timeSpent = Date.now() - itemStartTime;
    
    // Record response
    const response: SessionResponse = {
      itemId: currentItem.id,
      userAnswer,
      isCorrect,
      timeSpent
    };
    
    setResponses(prev => [...prev, response]);
    
    // Update mastery immediately
    learnerCache.updateSkill(skillId!, isCorrect ? 'correct' : 'wrong');
    
    // Trigger Scout event for wrong answers
    if (!isCorrect) {
      import('../learning/scoutQueue').then(({ triggerScoutEvent }) => {
        const profile = JSON.parse(localStorage.getItem('qi.profile') || '{}');
        triggerScoutEvent('answerWrong', {
          ageBand: profile.ageBand,
          name: profile.name
        });
      });
    }
    
    setShowFeedback(true);
    
    // Auto-advance after showing feedback
    setTimeout(() => {
      if (currentIndex < session.items.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setUserAnswer('');
        setShowFeedback(false);
        setItemStartTime(Date.now());
      } else {
        completeSession();
      }
    }, calm ? 1500 : 2500);
  };

  const completeSession = () => {
    if (!session) return;
    
    const learnerState = learnerCache.getState();
    const skillBefore = learnerState.skills[skillId!];
    
    // Calculate session stats
    const correctCount = responses.filter(r => r.isCorrect).length;
    const totalDuration = Date.now() - session.startedAt;
    const durationSec = Math.round(totalDuration / 1000);
    
    // Track journal session completion
    pushEvent({
      kind: 'journal_finish',
      at: Date.now(),
      skillId: session.skillId,
      n: session.items.length,
      correct: correctCount,
      durationSec,
      source
    });
    
    // Save session history - extended with detailed data for review
    const historyEntry: JournalHistoryEntry = {
      date: new Date().toISOString(),
      skillId: session.skillId,
      itemCount: session.items.length,
      correctCount,
      duration: totalDuration,
      masteryBefore: skillBefore?.p || 0.5,
      masteryAfter: learnerState.skills[skillId!]?.p || 0.5,
      offline: !online, // Mark session as offline if not online
      // Extended fields for review functionality
      sessionId: session.id,
      targetLevel: session.targetLevel,
      items: session.items,
      responses: responses
    };
    
    saveSessionHistory(historyEntry);
    
    setIsComplete(true);
    
    // Show reflection prompt after completion
    setTimeout(() => {
      setShowReflection(true);
    }, 1000);
    
    // Auto-close after showing completion (extended time for reflection)
    setTimeout(() => {
      onComplete?.();
      
      // Clear current skill ID from Scout system
      import('../learning/scoutQueue').then(({ setCurrentSkillId }) => {
        setCurrentSkillId(null);
      });
      
      onClose();
    }, calm ? 8000 : 10000);
  };

  const saveSessionHistory = (entry: JournalHistoryEntry) => {
    try {
      const existing = JSON.parse(localStorage.getItem(JOURNAL_HISTORY_KEY) || '[]');
      const updated = [entry, ...existing].slice(0, 50); // Keep last 50 sessions
      localStorage.setItem(JOURNAL_HISTORY_KEY, JSON.stringify(updated));
      
      // Enqueue for sync to backend
      try {
        // Dynamic import to avoid circular dependencies
        import('../sync/queue').then(({ enqueue }) => {
          enqueue({
            kind: 'learner',
            payload: entry,
            id: `learner-${entry.sessionId}-${entry.date}`,
            at: Date.now()
          });
        });
      } catch (syncError) {
        console.warn('Failed to enqueue journal session for sync:', syncError);
      }
    } catch (error) {
      console.error('Failed to save journal history:', error);
    }
  };

  const currentItem = session?.items[currentIndex];
  const progress = session ? ((currentIndex + 1) / session.items.length) * 100 : 0;
  const correctSoFar = responses.filter(r => r.isCorrect).length;

  if (!open) return null;

  return (
    <BottomSheet 
      open={open} 
      onClose={onClose} 
      titleId="journal-title"
    >
      <div className="text-gray-800 p-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="journal-title" className="text-xl font-bold text-blue-800">
              Quick Practice Session
            </h2>
            <p className="text-sm text-gray-600">
              {session ? `${session.skillId.replace('.', ' → ')}` : 'Loading...'}
            </p>
          </div>
          
          {session && (
            <div className="text-right text-sm">
              <div className="font-medium">{currentIndex + 1} of {session.items.length}</div>
              <div className="text-gray-500">{correctSoFar} correct</div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {session && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <motion.div 
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: calm ? 0.3 : 0.5 }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <div className="text-lg">Preparing your practice session...</div>
            </motion.div>
          )}

          {isComplete && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <div className="text-2xl mb-2">🎉</div>
              <div className="text-xl font-bold text-green-700 mb-2">Session Complete!</div>
              <div className="text-gray-600">
                You got {correctSoFar} out of {responses.length} correct
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Your mastery level has been updated
              </div>
            </motion.div>
          )}

          {currentItem && !isComplete && !isLoading && (
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: calm ? 0.2 : 0.3 }}
              className="space-y-4"
            >
              {/* Question */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-lg font-medium leading-relaxed">
                  {currentItem.prompt}
                </p>
              </div>

              {/* Answer Input */}
              {!showFeedback && (
                <div className="space-y-3">
                  {currentItem.kind === 'mcq' ? (
                    <div className="space-y-2">
                      {currentItem.options?.map((option, index) => (
                        <label key={index} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="mcq-answer"
                            value={index.toString()}
                            checked={userAnswer === index.toString()}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            className="text-blue-600"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="short-answer" className="block text-sm font-medium text-gray-700 mb-2">
                        Your answer:
                      </label>
                      <input
                        id="short-answer"
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && userAnswer.trim() && handleSubmitAnswer()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type your answer here..."
                        autoFocus
                      />
                    </div>
                  )}

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    data-testid="journal-submit"
                  >
                    Submit Answer
                  </button>
                </div>
              )}

              {/* Feedback */}
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl p-4 border ${
                    responses[responses.length - 1]?.isCorrect
                      ? 'bg-green-50 border-green-200'
                      : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {responses[responses.length - 1]?.isCorrect ? '✅' : '💡'}
                    </span>
                    <span className="font-medium">
                      {responses[responses.length - 1]?.isCorrect ? 'Correct!' : 'Not quite right'}
                    </span>
                  </div>
                  
                  {currentItem.explanation && (
                    <p className="text-sm text-gray-700">
                      {currentItem.explanation}
                    </p>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-500">
                    {currentIndex < session!.items.length - 1 ? 'Next question coming up...' : 'Finishing session...'}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close Button */}
        {!isLoading && !isComplete && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              data-testid="journal-close"
            >
              Close Session
            </button>
          </div>
        )}
      </div>
      
      {/* Reflection Prompt */}
      <ReflectionPrompt
        open={showReflection}
        onClose={() => setShowReflection(false)}
        refType="journal"
        refId={session?.skillId || ''}
      />
    </BottomSheet>
  );
}