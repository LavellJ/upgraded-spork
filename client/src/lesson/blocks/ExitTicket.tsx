import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertTriangle, ArrowRight, Trophy, BookOpen } from 'lucide-react';
import type { ExitTicketActivity } from '../../authoring/heroSchema';

interface ExitTicketProps {
  activity: ExitTicketActivity;
  onComplete: (results: ExitTicketResults) => void;
  onEvent?: (eventType: string, data?: any) => void;
}

interface ExitTicketResults {
  score: number;
  masteryAchieved: boolean;
  responses: QuestionResponse[];
  nextStep: {
    type: string;
    skillId?: string;
    lessonId?: string;
    rationale: string;
  };
}

interface QuestionResponse {
  questionId: string;
  type: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  timeSpent: number;
}

/**
 * ExitTicket: Mastery assessment with Compass routing logic
 * - Multiple question types (multiple choice, ordering, open response)
 * - Mastery threshold evaluation
 * - Compass logic for next steps based on performance
 * - Accessibility and comprehensive feedback
 */
export function ExitTicket({ activity, onComplete, onEvent }: ExitTicketProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string | string[]>('');
  const [orderingItems, setOrderingItems] = useState<string[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<ExitTicketResults | null>(null);

  const currentQuestion = activity.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === activity.questions.length - 1;

  // Initialize ordering items when question changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
    
    if (currentQuestion.type === 'ordering') {
      // Shuffle items initially (optional - could start in random order)
      const items = currentQuestion.items.map(item => item.id);
      setOrderingItems(items);
      setCurrentAnswer(items);
    } else {
      setCurrentAnswer('');
    }

    onEvent?.('exit_ticket_question_started', {
      questionId: currentQuestion.id,
      questionType: currentQuestion.type,
      questionIndex: currentQuestionIndex
    });
  }, [currentQuestionIndex, currentQuestion, onEvent]);

  const evaluateResponse = (question: typeof currentQuestion, answer: string | string[]): boolean => {
    switch (question.type) {
      case 'multiple_choice':
        return answer === question.correctAnswer;
      
      case 'ordering':
        const correctOrder = question.correctOrder;
        const userOrder = Array.isArray(answer) ? answer : [answer];
        return JSON.stringify(correctOrder) === JSON.stringify(userOrder);
      
      case 'open_response':
        // For open response, we'll use basic keyword matching
        // In production, this could use AI evaluation or teacher review
        const userText = (answer as string).toLowerCase();
        const keyConcepts = question.rubric.key_concepts;
        const matchedConcepts = keyConcepts.filter(concept => 
          userText.includes(concept.toLowerCase())
        );
        return matchedConcepts.length >= Math.ceil(keyConcepts.length * 0.6); // 60% concept coverage
      
      default:
        return false;
    }
  };

  const handleAnswerChange = (answer: string | string[]) => {
    setCurrentAnswer(answer);
  };

  const handleOrderingMove = (dragIndex: number, hoverIndex: number) => {
    const newItems = [...orderingItems];
    const draggedItem = newItems[dragIndex];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, draggedItem);
    setOrderingItems(newItems);
    setCurrentAnswer(newItems);
  };

  const handleSubmit = () => {
    const timeSpent = Date.now() - questionStartTime;
    const isCorrect = evaluateResponse(currentQuestion, currentAnswer);

    const response: QuestionResponse = {
      questionId: currentQuestion.id,
      type: currentQuestion.type,
      userAnswer: currentAnswer,
      isCorrect,
      timeSpent
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    onEvent?.('exit_ticket_question_answered', {
      questionId: currentQuestion.id,
      userAnswer: currentAnswer,
      isCorrect,
      timeSpent
    });

    if (isLastQuestion) {
      handleComplete(newResponses);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleComplete = (allResponses: QuestionResponse[]) => {
    const score = allResponses.filter(r => r.isCorrect).length / allResponses.length;
    const masteryAchieved = score >= activity.masteryThreshold;

    // Determine next step using Compass logic
    const nextStepConfig = masteryAchieved 
      ? activity.compassLogic.onMastery 
      : activity.compassLogic.onNeedsPractice;

    const exitResults: ExitTicketResults = {
      score,
      masteryAchieved,
      responses: allResponses,
      nextStep: {
        type: nextStepConfig.nextStep,
        skillId: nextStepConfig.skillId,
        lessonId: nextStepConfig.lessonId,
        rationale: nextStepConfig.rationale['en-AU']
      }
    };

    setResults(exitResults);
    setIsCompleted(true);

    onEvent?.('exit_ticket_completed', {
      score,
      masteryAchieved,
      nextStep: nextStepConfig.nextStep,
      totalQuestions: activity.questions.length
    });

    onComplete(exitResults);
  };

  const canSubmit = () => {
    if (currentQuestion.type === 'ordering') {
      return orderingItems.length > 0;
    }
    return currentAnswer !== '' && currentAnswer !== null;
  };

  // Completion screen
  if (isCompleted && results) {
    return (
      <div 
        className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg text-center"
        data-testid="exit-ticket-complete"
      >
        <div className="mb-6">
          {results.masteryAchieved ? (
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          ) : (
            <BookOpen className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          )}
          
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {results.masteryAchieved ? 'Mastery Achieved!' : 'Keep Learning!'}
          </h3>
          
          <p className="text-gray-600 mb-4">
            You scored {Math.round(results.score * 100)}% on this assessment.
          </p>

          {/* Score Display */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-3xl font-bold mb-2" data-testid="exit-score">
              {responses.filter(r => r.isCorrect).length}/{responses.length}
            </div>
            <div className="text-sm text-gray-600">
              Mastery threshold: {Math.round(activity.masteryThreshold * 100)}%
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            {results.masteryAchieved ? (
              <CheckCircle className="text-green-600 mt-1" size={20} />
            ) : (
              <AlertTriangle className="text-yellow-600 mt-1" size={20} />
            )}
            <div className="text-left">
              <div className="font-medium text-gray-900 mb-1">What's Next?</div>
              <p className="text-gray-700" data-testid="compass-rationale">
                {results.nextStep.rationale}
              </p>
              {results.nextStep.skillId && (
                <p className="text-sm text-blue-600 mt-2" data-testid="next-step-skill">
                  Skill: {results.nextStep.skillId}
                </p>
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={() => {/* Navigation handled by parent */}}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="continue-to-next-step"
        >
          Continue Learning
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg"
      data-testid="exit-ticket-container"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="text-2xl font-bold text-gray-900"
            data-testid="exit-ticket-title"
          >
            {activity.title['en-AU']}
          </h2>
          <div className="text-sm text-gray-500" data-testid="question-counter">
            Question {currentQuestionIndex + 1} of {activity.questions.length}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / activity.questions.length) * 100}%` }}
            data-testid="exit-progress-bar"
          />
        </div>
      </div>

      {/* Current Question */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4" data-testid="question-text">
          {currentQuestion.question['en-AU']}
        </h3>

        {/* Question-specific UI */}
        {currentQuestion.type === 'multiple_choice' && (
          <div className="space-y-3 mb-4">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswerChange(option.id)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  currentAnswer === option.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid={`mc-option-${option.id}`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-4 h-4 rounded-full border-2 ${
                      currentAnswer === option.id 
                        ? 'border-blue-600 bg-blue-600' 
                        : 'border-gray-300'
                    }`}
                  />
                  <span>{option.text['en-AU']}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {currentQuestion.type === 'ordering' && (
          <div className="space-y-3 mb-4">
            <p className="text-sm text-gray-600 mb-3">
              Drag and drop to arrange in the correct order:
            </p>
            {orderingItems.map((itemId, index) => {
              const item = currentQuestion.items.find(i => i.id === itemId);
              return (
                <div
                  key={itemId}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 cursor-move hover:bg-gray-100"
                  data-testid={`ordering-item-${itemId}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    handleOrderingMove(dragIndex, index);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm font-mono">
                      {index + 1}.
                    </span>
                    <span>{item?.text['en-AU']}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentQuestion.type === 'open_response' && (
          <div className="mb-4">
            <textarea
              value={currentAnswer as string}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Enter your response..."
              className="w-full min-h-[120px] p-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="open-response-textarea"
            />
            <p className="text-sm text-gray-500 mt-2">
              Think about: {currentQuestion.rubric.key_concepts.join(', ')}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="submit-exit-question-button"
        >
          {isLastQuestion ? 'Complete Assessment' : 'Next Question'}
        </Button>
      </div>
    </div>
  );
}