import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Question } from "@shared/schema";

interface QuestionInterfaceProps {
  question: Question;
  onAnswered: (correct: boolean, selectedAnswer: number) => void;
  studentId?: string;
  ageGroup?: "pre-primary" | "primary" | "upper-primary";
}

export function QuestionInterface({ question, onAnswered, studentId, ageGroup = "primary" }: QuestionInterfaceProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hint, setHint] = useState<string>("");
  const [isAnswered, setIsAnswered] = useState(false);
  const queryClient = useQueryClient();

  const hintMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/questions/hint", {
        questionId: question.id
      });
      return response.json();
    },
    onSuccess: (data) => {
      setHint(data.hint);
    },
  });

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    setIsAnswered(true);
    
    const isCorrect = answerIndex === question.correctAnswer;
    
    // Show result for 2 seconds before advancing to next question
    setTimeout(() => {
      onAnswered(isCorrect, answerIndex);
    }, 2000);
  };

  const getOptionClass = (optionIndex: number) => {
    if (!showResult) {
      return "bg-white/20 hover:bg-white/30 text-white transition-all duration-300";
    }
    
    if (optionIndex === question.correctAnswer) {
      return "bg-success-green/60 border-2 border-success-green text-white";
    }
    
    if (selectedAnswer === optionIndex && optionIndex !== question.correctAnswer) {
      return "bg-red-500/40 border-2 border-red-500 text-white";
    }
    
    return "bg-white/10 text-white/60";
  };

  const getAgeAppropriateAvatar = () => {
    switch (ageGroup) {
      case "pre-primary":
        return (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-warm-orange to-sunset-orange flex items-center justify-center animate-pulse-soft">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white">
              <path fill="currentColor" d="M12 2c3 0 6 2 6 6 0 2-1 3-2 4l2 8c0 1-1 2-2 2H8c-1 0-2-1-2-2l2-8c-1-1-2-2-2-4 0-4 3-6 6-6z"/>
              <circle cx="9" cy="7" r="1" fill="#333"/>
              <circle cx="15" cy="7" r="1" fill="#333"/>
            </svg>
          </div>
        );
      case "primary":
        return (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-teal to-sky-blue flex items-center justify-center animate-pulse-soft">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white">
              <path fill="currentColor" d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/>
            </svg>
          </div>
        );
      case "upper-primary":
        return (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-soft-purple to-deep-purple flex items-center justify-center animate-pulse-soft">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white">
              <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
              <path fill="currentColor" d="M12 6c-3.3 0-6 2.7-6 6h2c0-2.2 1.8-4 4-4s4 1.8 4 4h2c0-3.3-2.7-6-6-6z"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getEncouragementMessage = (isCorrect: boolean) => {
    switch (ageGroup) {
      case "pre-primary":
        return isCorrect ? 
          ["🌟 Amazing work!", "🎉 You're so smart!", "🦋 Beautiful job!"][Math.floor(Math.random() * 3)] :
          ["🌈 Good try!", "🌻 Let's try again!", "⭐ You're learning!"][Math.floor(Math.random() * 3)];
      case "primary":
        return isCorrect ?
          ["🚀 Excellent!", "🏆 Well done!", "⚡ Fantastic!"][Math.floor(Math.random() * 3)] :
          ["🎯 Keep going!", "🌟 Good effort!", "💪 You've got this!"][Math.floor(Math.random() * 3)];
      case "upper-primary":
        return isCorrect ?
          ["🧠 Outstanding thinking!", "🎯 Perfect reasoning!", "🔥 Brilliant work!"][Math.floor(Math.random() * 3)] :
          ["💡 Interesting approach!", "🤔 Let's explore this!", "📚 Great learning moment!"][Math.floor(Math.random() * 3)];
      default:
        return isCorrect ? "Correct!" : "Not quite right";
    }
  };

  return (
    <div className="floating-ui rounded-3xl p-8" data-testid="question-interface">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-semibold text-white" data-testid="text-topic-name">
          Question {question.difficulty}/5
        </h3>
        <div className="flex items-center space-x-2 text-white/70">
          <i className="fas fa-brain text-accent-teal"></i>
          <span className="text-sm" data-testid="text-ai-indicator">AI Generated</span>
        </div>
      </div>
      
      {/* Question */}
      <div className="space-y-6">
        <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm" data-testid="question-container">
          <p className="text-white text-lg leading-relaxed" data-testid="text-question">
            {question.question}
          </p>
        </div>
        
        {/* Answer Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="answer-options">
          {(question.options as string[]).map((option, index) => (
            <button
              key={index}
              className={`p-4 rounded-xl text-left font-medium ${getOptionClass(index)}`}
              onClick={() => handleAnswerSelect(index)}
              disabled={isAnswered}
              data-testid={`button-answer-${index}`}
            >
              {String.fromCharCode(65 + index)}) {option}
            </button>
          ))}
        </div>
        
        {/* Result and Explanation with Age-Appropriate Avatar */}
        {showResult && (
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm" data-testid="result-container">
            <div className="flex items-start space-x-4 mb-4">
              {getAgeAppropriateAvatar()}
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <i className={`fas ${selectedAnswer === question.correctAnswer ? 'fa-check-circle text-success-green' : 'fa-times-circle text-red-500'} mr-2`}></i>
                  <span className={`font-semibold text-lg ${selectedAnswer === question.correctAnswer ? 'text-success-green' : 'text-red-500'}`} data-testid="text-result">
                    {getEncouragementMessage(selectedAnswer === question.correctAnswer)}
                  </span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed" data-testid="text-explanation">
                  {question.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Hint */}
        {hint && (
          <div className="bg-accent-teal/20 rounded-2xl p-4 backdrop-blur-sm" data-testid="hint-container">
            <div className="flex items-center mb-2">
              <i className="fas fa-lightbulb text-accent-teal mr-2"></i>
              <span className="font-medium text-accent-teal">Hint</span>
            </div>
            <p className="text-white/80 text-sm" data-testid="text-hint">
              {hint}
            </p>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center justify-between">
          {!showResult && (
            <button 
              className="text-accent-teal hover:text-white transition-colors duration-300 text-sm"
              onClick={() => hintMutation.mutate()}
              disabled={hintMutation.isPending}
              data-testid="button-get-hint"
            >
              <i className="fas fa-lightbulb mr-2"></i>
              {hintMutation.isPending ? 'Getting hint...' : 'Get a hint'}
            </button>
          )}
          
          {showResult && (
            <button 
              className="bg-gradient-to-r from-sunset-orange to-warm-orange text-white px-6 py-2 rounded-lg text-sm hover:scale-105 transition-all duration-300 ml-auto"
              onClick={() => window.location.reload()} // This would be replaced with proper navigation in a real app
              data-testid="button-next-question"
            >
              Next Question
              <i className="fas fa-arrow-right ml-2"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
