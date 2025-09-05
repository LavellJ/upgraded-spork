import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import type { GuidedPracticeActivity } from '../../authoring/heroSchema';

interface GuidedPracticeProps {
  activity: GuidedPracticeActivity;
  onComplete: (results: StepResult[]) => void;
  onEvent?: (eventType: string, data?: any) => void;
}

interface StepResult {
  stepId: string;
  userAnswer: string | number;
  isCorrect: boolean;
  hintsUsed: number;
  branchingPath?: string;
  timeSpent: number;
}

/**
 * GuidedPractice: Multi-step interactive practice with branching hints and remediation
 * - Step-by-step guided learning with immediate feedback
 * - Branching remediation based on answer patterns
 * - Progressive hint system
 * - Accessibility and keyboard navigation support
 */
export function GuidedPractice({ activity, onComplete, onEvent }: GuidedPracticeProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [stepResults, setStepResults] = useState<StepResult[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(-1);
  const [stepStartTime, setStepStartTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [branchingMessage, setBranchingMessage] = useState<string | null>(null);

  const currentStep = activity.steps[currentStepIndex];
  const isLastStep = currentStepIndex === activity.steps.length - 1;

  useEffect(() => {
    setStepStartTime(Date.now());
    onEvent?.('guided_step_started', { 
      stepId: currentStep.id,
      stepIndex: currentStepIndex 
    });
  }, [currentStepIndex, currentStep.id, onEvent]);

  const evaluateAnswer = (answer: string | number): boolean => {
    const correctAnswer = currentStep.correctAnswer;
    
    if (typeof correctAnswer === 'number' && typeof answer === 'string') {
      const numericAnswer = parseFloat(answer);
      if (isNaN(numericAnswer)) return false;
      
      // Apply tolerance if specified
      if (currentStep.tolerance) {
        return Math.abs(numericAnswer - correctAnswer) <= currentStep.tolerance;
      }
      return numericAnswer === correctAnswer;
    }
    
    return answer.toString().toLowerCase().trim() === correctAnswer.toString().toLowerCase().trim();
  };

  const checkBranchingPath = (answer: string | number): string | null => {
    if (!currentStep.branchingPaths) return null;

    for (const [pathKey, path] of Object.entries(currentStep.branchingPaths)) {
      try {
        // Simple condition evaluation - in production, use a safe expression evaluator
        const condition = path.condition.replace('answer', answer.toString());
        // This is a simplified evaluation - in production, use a proper expression parser
        if (eval(condition)) {
          return pathKey;
        }
      } catch (error) {
        console.warn('Error evaluating branching condition:', error);
      }
    }
    
    return null;
  };

  const handleSubmit = () => {
    const answer = userAnswer.trim();
    if (!answer) return;

    const timeSpent = Date.now() - stepStartTime;
    const isCorrect = evaluateAnswer(answer);
    const branchingPath = isCorrect ? null : checkBranchingPath(answer);

    const result: StepResult = {
      stepId: currentStep.id,
      userAnswer: answer,
      isCorrect,
      hintsUsed: Math.max(0, currentHintIndex + 1),
      branchingPath: branchingPath || undefined,
      timeSpent
    };

    // Set branching message if applicable
    if (branchingPath && currentStep.branchingPaths?.[branchingPath]) {
      const branchData = currentStep.branchingPaths[branchingPath];
      setBranchingMessage(branchData.remediation['en-AU']);
    } else {
      setBranchingMessage(null);
    }

    setStepResults(prev => [...prev, result]);
    setShowFeedback(true);

    onEvent?.('guided_step_submitted', {
      stepId: currentStep.id,
      stepIndex: currentStepIndex,
      userAnswer: answer,
      isCorrect,
      hintsUsed: result.hintsUsed,
      branchingPath,
      timeSpent
    });

    // Auto-advance after correct answer (with delay for feedback)
    if (isCorrect) {
      setTimeout(() => {
        if (isLastStep) {
          handleComplete();
        } else {
          handleNextStep();
        }
      }, 1500);
    }
  };

  const handleNextStep = () => {
    setCurrentStepIndex(prev => prev + 1);
    setUserAnswer('');
    setShowFeedback(false);
    setCurrentHintIndex(-1);
    setBranchingMessage(null);
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setUserAnswer('');
      setShowFeedback(false);
      setCurrentHintIndex(-1);
      setBranchingMessage(null);
    }
  };

  const handleShowHint = () => {
    const nextHintIndex = currentHintIndex + 1;
    if (nextHintIndex < currentStep.hints.length) {
      setCurrentHintIndex(nextHintIndex);
      onEvent?.('guided_hint_requested', {
        stepId: currentStep.id,
        hintIndex: nextHintIndex,
        hintText: currentStep.hints[nextHintIndex]['en-AU']
      });
    }
  };

  const handleTryAgain = () => {
    setShowFeedback(false);
    setBranchingMessage(null);
    setUserAnswer('');
    
    // Show next hint if available and this was from branching
    const lastResult = stepResults[stepResults.length - 1];
    if (lastResult?.branchingPath && currentStep.branchingPaths?.[lastResult.branchingPath]?.nextHint) {
      const branchData = currentStep.branchingPaths[lastResult.branchingPath];
      if (branchData.nextHint && currentHintIndex + 1 < currentStep.hints.length) {
        setCurrentHintIndex(prev => prev + 1);
      }
    }

    onEvent?.('guided_try_again', { stepId: currentStep.id });
  };

  const handleComplete = () => {
    setIsCompleted(true);
    onEvent?.('guided_practice_completed', { 
      totalSteps: activity.steps.length,
      results: stepResults 
    });
    onComplete(stepResults);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showFeedback) {
      handleSubmit();
    }
  };

  if (isCompleted) {
    return (
      <div 
        className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg text-center"
        data-testid="guided-practice-complete"
      >
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Great Work!</h3>
        <p className="text-gray-600 mb-4">
          You've completed all {activity.steps.length} guided practice steps.
        </p>
        <div className="text-sm text-gray-500">
          Steps completed: {stepResults.filter(r => r.isCorrect).length}/{stepResults.length}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg"
      data-testid="guided-practice-container"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="text-2xl font-bold text-gray-900"
            data-testid="guided-practice-title"
          >
            {activity.title['en-AU']}
          </h2>
          <div className="text-sm text-gray-500" data-testid="step-progress">
            Step {currentStepIndex + 1} of {activity.steps.length}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / activity.steps.length) * 100}%` }}
            data-testid="progress-bar"
          />
        </div>
      </div>

      {/* Current Step */}
      <div className="mb-6">
        <div className="mb-4">
          <p className="text-gray-700 mb-3" data-testid="step-instruction">
            {currentStep.instruction['en-AU']}
          </p>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {currentStep.question['en-AU']}
          </h3>
        </div>

        {/* Answer Input */}
        <div className="mb-4">
          <Input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your answer..."
            disabled={showFeedback}
            className="w-full text-lg p-3"
            aria-label={`Answer for: ${currentStep.question['en-AU']}`}
            data-testid="answer-input"
          />
        </div>

        {/* Submit Button */}
        {!showFeedback && (
          <Button
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white mb-4"
            data-testid="submit-answer-button"
          >
            Check Answer
          </Button>
        )}

        {/* Feedback */}
        {showFeedback && (
          <div className="mb-4">
            {stepResults[stepResults.length - 1]?.isCorrect ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                <CheckCircle size={20} />
                <span data-testid="correct-feedback">Correct! Well done.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={20} />
                  <span data-testid="incorrect-feedback">
                    Not quite right. Let's try again!
                  </span>
                </div>
                
                {/* Branching Message */}
                {branchingMessage && (
                  <div className="text-blue-700 bg-blue-50 p-3 rounded-lg">
                    <p data-testid="branching-message">{branchingMessage}</p>
                  </div>
                )}

                <Button
                  onClick={handleTryAgain}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="try-again-button"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Hints */}
        {currentHintIndex >= 0 && currentHintIndex < currentStep.hints.length && (
          <div className="mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <Lightbulb className="text-yellow-600 mt-1" size={16} />
              <div>
                <div className="text-sm font-medium text-yellow-800 mb-1">
                  Hint {currentHintIndex + 1}:
                </div>
                <p className="text-yellow-700" data-testid="current-hint">
                  {currentStep.hints[currentHintIndex]['en-AU']}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hint Button */}
        {!showFeedback && currentHintIndex + 1 < currentStep.hints.length && (
          <Button
            onClick={handleShowHint}
            variant="outline"
            className="mr-2"
            data-testid="show-hint-button"
          >
            <Lightbulb size={16} className="mr-2" />
            Show Hint
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          onClick={handlePreviousStep}
          disabled={currentStepIndex === 0}
          variant="outline"
          data-testid="previous-step-button"
        >
          <ArrowLeft size={16} className="mr-2" />
          Previous
        </Button>

        {showFeedback && stepResults[stepResults.length - 1]?.isCorrect && (
          <Button
            onClick={isLastStep ? handleComplete : handleNextStep}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="next-step-button"
          >
            {isLastStep ? 'Complete' : 'Next Step'}
            {!isLastStep && <ArrowRight size={16} className="ml-2" />}
          </Button>
        )}
      </div>
    </div>
  );
}