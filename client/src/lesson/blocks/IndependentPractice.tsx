import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Lightbulb, RotateCcw, Trophy } from 'lucide-react';
import type { IndependentPracticeActivity } from '../../authoring/heroSchema';

interface IndependentPracticeProps {
  activity: IndependentPracticeActivity;
  onComplete: (score: number, results: QuestionResult[]) => void;
  onEvent?: (eventType: string, data?: any) => void;
}

interface QuestionResult {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  hintUsed: boolean;
  timeSpent: number;
}

/**
 * IndependentPractice: Randomized question bank with scoring and immediate feedback
 * - Randomized question selection from bank
 * - Immediate feedback with explanations
 * - Optional hints for each question  
 * - Progress tracking and scoring
 * - Accessibility and keyboard support
 */
export function IndependentPractice({ activity, onComplete, onEvent }: IndependentPracticeProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<typeof activity.questionBank>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = selectedQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === selectedQuestions.length - 1;
  const questionsToShow = activity.questionsToShow || activity.questionBank.length;

  // Initialize selected questions on mount
  useEffect(() => {
    let questions = [...activity.questionBank];
    
    if (activity.randomize) {
      // Shuffle array using Fisher-Yates algorithm
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
    }
    
    // Take only the required number of questions
    questions = questions.slice(0, questionsToShow);
    setSelectedQuestions(questions);
    
    onEvent?.('independent_practice_started', {
      totalQuestions: questions.length,
      randomized: activity.randomize
    });
  }, [activity.questionBank, activity.randomize, questionsToShow, onEvent]);

  // Reset question state when question changes
  useEffect(() => {
    setSelectedAnswer('');
    setShowFeedback(false);
    setShowHint(false);
    setQuestionStartTime(Date.now());
    
    if (currentQuestion) {
      onEvent?.('question_started', {
        questionId: currentQuestion.id,
        questionIndex: currentQuestionIndex
      });
    }
  }, [currentQuestionIndex, currentQuestion, onEvent]);

  const handleAnswerSelect = (answerId: string) => {
    if (showFeedback) return;
    setSelectedAnswer(answerId);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !currentQuestion) return;

    const timeSpent = Date.now() - questionStartTime;
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    const result: QuestionResult = {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
      hintUsed: showHint,
      timeSpent
    };

    setResults(prev => [...prev, result]);
    setShowFeedback(true);

    // Update score
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    onEvent?.('question_answered', {
      questionId: currentQuestion.id,
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      hintUsed: showHint,
      timeSpent
    });

    // Auto-advance after a delay
    setTimeout(() => {
      if (isLastQuestion) {
        handleComplete();
      } else {
        handleNextQuestion();
      }
    }, 2000);
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const handleShowHint = () => {
    setShowHint(true);
    onEvent?.('hint_requested', {
      questionId: currentQuestion?.id,
      hintText: currentQuestion?.hint?.['en-AU']
    });
  };

  const handleComplete = () => {
    const finalScore = score;
    const hasPassed = activity.passingScore ? finalScore >= activity.passingScore : true;
    
    setIsCompleted(true);
    
    onEvent?.('independent_practice_completed', {
      score: finalScore,
      totalQuestions: selectedQuestions.length,
      passed: hasPassed,
      results
    });
    
    onComplete(finalScore, results);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowFeedback(false);
    setShowHint(false);
    setResults([]);
    setScore(0);
    setIsCompleted(false);
    
    onEvent?.('independent_practice_restarted');
  };

  // Loading state while questions are being prepared
  if (selectedQuestions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Preparing your practice questions...</p>
      </div>
    );
  }

  // Completion screen
  if (isCompleted) {
    const percentage = Math.round((score / selectedQuestions.length) * 100);
    const hasPassed = activity.passingScore ? score >= activity.passingScore : percentage >= 70;
    
    return (
      <div 
        className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg text-center"
        data-testid="independent-practice-complete"
      >
        <div className="mb-6">
          {hasPassed ? (
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          ) : (
            <RotateCcw className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          )}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {hasPassed ? 'Excellent Work!' : 'Good Effort!'}
          </h3>
          <p className="text-gray-600 mb-4">
            {hasPassed 
              ? 'You\'ve mastered this practice session!'
              : 'Keep practicing to improve your understanding.'
            }
          </p>
        </div>

        {/* Results Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600" data-testid="final-score">
                {score}/{selectedQuestions.length}
              </div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600" data-testid="final-percentage">
                {percentage}%
              </div>
              <div className="text-sm text-gray-600">Percentage</div>
            </div>
          </div>
          
          {activity.passingScore && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Passing score: {activity.passingScore}/{selectedQuestions.length} 
                ({Math.round((activity.passingScore / selectedQuestions.length) * 100)}%)
              </p>
            </div>
          )}
        </div>

        {!hasPassed && (
          <Button
            onClick={handleRestart}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="restart-practice-button"
          >
            <RotateCcw size={16} className="mr-2" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div 
      className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg"
      data-testid="independent-practice-container"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="text-2xl font-bold text-gray-900"
            data-testid="independent-practice-title"
          >
            {activity.title['en-AU']}
          </h2>
          <div className="text-sm text-gray-500" data-testid="question-progress">
            Question {currentQuestionIndex + 1} of {selectedQuestions.length}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / selectedQuestions.length) * 100}%` }}
            data-testid="question-progress-bar"
          />
        </div>
        
        {/* Score Display */}
        <div className="flex justify-between text-sm text-gray-600">
          <span data-testid="current-score">Score: {score}/{currentQuestionIndex}</span>
          {activity.passingScore && (
            <span data-testid="passing-score">
              Need: {activity.passingScore}/{selectedQuestions.length}
            </span>
          )}
        </div>
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4" data-testid="question-text">
            {currentQuestion.question['en-AU']}
          </h3>

          {/* Answer Options */}
          <div className="space-y-3 mb-4">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(option.id)}
                disabled={showFeedback}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  selectedAnswer === option.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                data-testid={`option-${option.id}`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-4 h-4 rounded-full border-2 ${
                      selectedAnswer === option.id 
                        ? 'border-blue-600 bg-blue-600' 
                        : 'border-gray-300'
                    }`}
                  />
                  <span>{option.text['en-AU']}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Submit Button */}
          {!showFeedback && (
            <Button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className="bg-blue-600 hover:bg-blue-700 text-white mb-4"
              data-testid="submit-question-button"
            >
              Submit Answer
            </Button>
          )}

          {/* Feedback */}
          {showFeedback && (
            <div className="mb-4 space-y-3">
              {results[results.length - 1]?.isCorrect ? (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                  <CheckCircle size={20} />
                  <span data-testid="correct-feedback">Correct!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg">
                  <XCircle size={20} />
                  <span data-testid="incorrect-feedback">
                    Incorrect. The correct answer was {
                      currentQuestion.options.find(o => o.id === currentQuestion.correctAnswer)?.text['en-AU']
                    }.
                  </span>
                </div>
              )}

              {/* Explanation */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-blue-900" data-testid="question-explanation">
                  {currentQuestion.explanation['en-AU']}
                </p>
              </div>
            </div>
          )}

          {/* Hint */}
          {showHint && currentQuestion.hint && (
            <div className="mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <Lightbulb className="text-yellow-600 mt-1" size={16} />
                <div>
                  <div className="text-sm font-medium text-yellow-800 mb-1">Hint:</div>
                  <p className="text-yellow-700" data-testid="question-hint">
                    {currentQuestion.hint['en-AU']}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Hint Button */}
          {!showFeedback && !showHint && currentQuestion.hint && (
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
      )}
    </div>
  );
}