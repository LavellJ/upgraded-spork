import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { AtmosphericBackground } from "@/components/AtmosphericBackground";
import { FloatingNavigation } from "@/components/FloatingNavigation";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { QuestionInterface } from "@/components/QuestionInterface";
import { BadgeNotification } from "@/components/BadgeNotification";
import { LearningPathRecommendations } from "@/components/LearningPathRecommendations";
import { ExplorerBuddy } from "@/components/ExplorerBuddy";
import { AchievementCelebration, useAchievementTrigger, ACHIEVEMENT_TEMPLATES } from "@/components/AchievementCelebration";
import type { Topic, Question } from "@shared/schema";
import type { AgeGroup } from "@/components/AgeSelector";

export default function Learning() {
  const [location] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [totalProgress, setTotalProgress] = useState({ correct: 0, total: 0 });
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("");
  const [newBadges, setNewBadges] = useState<Array<{badgeId: string; metadata?: any}>>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [studyStartTime] = useState<number>(Date.now());
  const queryClient = useQueryClient();

  // Achievement system
  const { currentAchievement, triggerAchievement, closeAchievement } = useAchievementTrigger();

  useEffect(() => {
    // Get age group from localStorage
    const storedAgeGroup = localStorage.getItem("selectedAgeGroup");
    if (storedAgeGroup) {
      setSelectedAgeGroup(storedAgeGroup);
    }
  }, []);
  
  // Get topic ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const topicId = urlParams.get('topic');

  // Fetch topic information  
  const { data: topic, isLoading: topicLoading } = useQuery<Topic>({
    queryKey: [`/api/topics/${topicId}`],
    enabled: !!topicId,
  });

  // Fetch questions for the topic
  const { data: questions = [], isLoading: questionsLoading, refetch: refetchQuestions } = useQuery<Question[]>({
    queryKey: [`/api/questions/${topicId}`],
    enabled: !!topicId,
  });

  // Fetch total progress across all topics for proper score display
  const { data: allProgress = [] } = useQuery<any[]>({
    queryKey: [`/api/progress/demo-student`],
    enabled: true,
  });

  // Calculate total progress across all topics
  useEffect(() => {
    if (allProgress.length > 0) {
      const totalCorrect = allProgress.reduce((sum, progress) => sum + progress.correctAnswers, 0);
      const totalAnswered = allProgress.reduce((sum, progress) => sum + progress.questionsAnswered, 0);
      setTotalProgress({ correct: totalCorrect, total: totalAnswered });
    }
  }, [allProgress]);

  // Generate new questions mutation with adaptive difficulty
  const generateQuestionsMutation = useMutation({
    mutationFn: async () => {
      // Calculate adaptive difficulty based on performance
      const totalCorrect = totalProgress.correct;
      const totalAnswered = totalProgress.total;
      const accuracy = totalAnswered > 0 ? totalCorrect / totalAnswered : 0.5;
      
      // Adaptive difficulty: 1-5 scale based on performance
      let adaptiveDifficulty = 3; // Start with medium
      if (accuracy > 0.8) adaptiveDifficulty = Math.min(5, adaptiveDifficulty + 1);
      else if (accuracy < 0.6) adaptiveDifficulty = Math.max(1, adaptiveDifficulty - 1);
      
      const response = await apiRequest("POST", "/api/questions/generate", {
        topicId,
        count: 5,
        difficulty: adaptiveDifficulty,
        ageGroup: selectedAgeGroup,
        studentPerformance: {
          accuracy,
          totalAnswered,
          recentStreak: score.correct
        }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${topicId}`] });
    },
  });

  // Progress tracking mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { correct: boolean }) => {
      const response = await apiRequest("POST", "/api/progress", {
        studentId: "demo-student", // In a real app, this would come from auth
        topicId,
        questionsAnswered: 1,
        correctAnswers: data.correct ? 1 : 0,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      // Check if new badges were earned
      if (data.newBadges && data.newBadges.length > 0) {
        setNewBadges(data.newBadges);
      }
      // Invalidate progress query to update total score
      queryClient.invalidateQueries({ queryKey: [`/api/progress/demo-student`] });
    },
  });

  // Generate questions if none exist
  useEffect(() => {
    if (topicId && questions.length === 0 && !questionsLoading && !generateQuestionsMutation.isPending) {
      generateQuestionsMutation.mutate();
    }
  }, [topicId, questions.length, questionsLoading, generateQuestionsMutation]);

  const handleAnswerSubmitted = (correct: boolean, selectedAnswer: number) => {
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }));

    // Achievement triggers
    const newCorrectCount = score.correct + (correct ? 1 : 0);
    const newTotalCount = score.total + 1;

    // First question ever achievement
    if (newTotalCount === 1) {
      triggerAchievement({
        ...ACHIEVEMENT_TEMPLATES.firstQuestion
      });
    }

    // Streak achievements (5 in a row)
    if (correct && newCorrectCount === 5 && newCorrectCount === newTotalCount) {
      triggerAchievement({
        ...ACHIEVEMENT_TEMPLATES.fiveStreak
      });
    }

    // Perfect score achievement (if completing topic)
    if (currentQuestionIndex === questions.length - 1) {
      const finalScore = newCorrectCount;
      
      if (finalScore === newTotalCount && newTotalCount >= 3) {
        triggerAchievement({
          ...ACHIEVEMENT_TEMPLATES.perfectScore
        });
      }
      
      // Topic completion achievement
      if (finalScore >= Math.ceil(newTotalCount * 0.8)) { // 80% completion threshold
        triggerAchievement({
          ...ACHIEVEMENT_TEMPLATES.firstTopic
        });
      }
    }

    updateProgressMutation.mutate({ correct });

    // Move to next question immediately (the QuestionInterface handles the delay with feedback)
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const generateMoreQuestions = () => {
    generateQuestionsMutation.mutate();
    setCurrentQuestionIndex(0);
  };

  if (!topicId) {
    return (
      <>
        <AtmosphericBackground />
        <FloatingNavigation />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-white mb-6">
              No topic selected
            </h2>
            <p className="text-white/80 mb-8">Please select a topic from the dashboard to start learning.</p>
            <a href="/dashboard" className="bg-gradient-to-r from-sunset-orange to-warm-orange text-white px-8 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300">
              Go to Dashboard
            </a>
          </div>
        </div>
      </>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isComplete = currentQuestionIndex >= questions.length;

  return (
    <>
      <AtmosphericBackground />
      <FloatingNavigation />
      
      <div className="relative z-10 min-h-screen pt-24 px-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12" data-testid="learning-header">
            {topicLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-white/20 rounded w-64 mx-auto mb-4"></div>
                <div className="h-4 bg-white/20 rounded w-48 mx-auto"></div>
              </div>
            ) : (
              <>
                <h1 className="font-display text-3xl md:text-5xl font-bold text-white mb-4" data-testid="text-topic-title">
                  {topic?.name}
                </h1>
                <div className="flex items-center justify-center space-x-6 text-white/80">
                  <span data-testid="text-progress">Question {isComplete ? questions.length : currentQuestionIndex + 1} of {questions.length}</span>
                  <span data-testid="text-score">Total Score: {totalProgress.correct}/{totalProgress.total} | This Topic: {score.correct}/{score.total}</span>
                </div>
              </>
            )}
          </div>

          {/* Learning Interface */}
          <div className="grid lg:grid-cols-4 gap-8">
            
            {/* Pomodoro Timer */}
            <div className="col-span-full lg:col-span-1" data-testid="timer-section">
              <PomodoroTimer 
                topicName={topic?.name || "Learning Session"} 
                autoStart={questions.length > 0}
              />
            </div>
            
            {/* Question Interface */}
            <div className="col-span-full lg:col-span-3" data-testid="question-section">
              {questionsLoading || generateQuestionsMutation.isPending ? (
                <div className="floating-ui rounded-3xl p-8">
                  <div className="animate-pulse space-y-6">
                    <div className="h-6 bg-white/20 rounded w-1/4"></div>
                    <div className="bg-white/10 rounded-2xl p-6">
                      <div className="h-20 bg-white/20 rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 bg-white/20 rounded-xl"></div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : isComplete ? (
                <div className="floating-ui rounded-3xl p-8 text-center" data-testid="completion-section">
                  <div className="mb-8">
                    <i className="fas fa-trophy text-6xl text-warm-orange mb-4"></i>
                    <h2 className="font-display text-3xl font-bold text-white mb-4">
                      Great Job!
                    </h2>
                    <p className="text-white/80 text-lg mb-2">
                      You completed all questions for this topic.
                    </p>
                    <p className="text-white/70">
                      Final Score: {score.correct} out of {score.total} correct
                      {score.total > 0 && (
                        <span className="text-warm-orange font-semibold ml-2">
                          ({Math.round((score.correct / score.total) * 100)}%)
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    <button 
                      onClick={() => setShowRecommendations(true)}
                      className="bg-gradient-to-r from-accent-teal to-sky-blue text-white px-8 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300"
                      data-testid="button-show-recommendations"
                    >
                      <i className="fas fa-route mr-2"></i>
                      What's Next?
                    </button>
                    <button 
                      onClick={generateMoreQuestions}
                      className="bg-gradient-to-r from-sunset-orange to-warm-orange text-white px-8 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300"
                      data-testid="button-more-questions"
                    >
                      <i className="fas fa-refresh mr-2"></i>
                      Generate More Questions
                    </button>
                    <a 
                      href="/dashboard"
                      className="bg-white/20 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors duration-300"
                      data-testid="button-back-dashboard"
                    >
                      <i className="fas fa-home mr-2"></i>
                      Back to Dashboard
                    </a>
                  </div>
                </div>
              ) : currentQuestion ? (
                <QuestionInterface 
                  key={currentQuestion.id} // Force re-render for each question
                  question={currentQuestion}
                  onAnswered={handleAnswerSubmitted}
                  studentId="demo-student"
                  ageGroup={selectedAgeGroup as "pre-primary" | "primary" | "upper-primary"}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={questions.length}
                />
              ) : (
                <div className="floating-ui rounded-3xl p-8 text-center">
                  <p className="text-white/80 mb-4">No questions available for this topic.</p>
                  <button 
                    onClick={generateMoreQuestions}
                    className="bg-gradient-to-r from-sunset-orange to-warm-orange text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300"
                    disabled={generateQuestionsMutation.isPending}
                    data-testid="button-generate-questions"
                  >
                    {generateQuestionsMutation.isPending ? 'Generating...' : 'Generate Questions'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Explorer Buddy - Persistent Learning Companion */}
      {selectedAgeGroup && (
        <ExplorerBuddy 
          ageGroup={selectedAgeGroup as AgeGroup}
          currentPage={location}
          isStudying={true}
          studyDuration={Date.now() - studyStartTime}
          recentProgress={{
            questionsAnswered: score.total,
            streakCount: score.correct,
            topicName: topic?.name
          }}
        />
      )}
      
      {/* Badge notifications disabled - too distracting during learning */}
      
      {/* Learning Path Recommendations Modal */}
      <LearningPathRecommendations
        studentId="demo-student"
        ageGroup={selectedAgeGroup as "pre-primary" | "primary" | "upper-primary"}
        show={showRecommendations}
        onClose={() => setShowRecommendations(false)}
      />
      
      {/* Achievement Celebration System */}
      <AchievementCelebration
        achievement={currentAchievement}
        onClose={closeAchievement}
      />
    </>
  );
}
