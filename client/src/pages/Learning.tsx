import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { AtmosphericBackground } from "@/components/AtmosphericBackground";
import { FloatingNavigation } from "@/components/FloatingNavigation";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { LearningCycle } from "@/components/LearningCycle";
import { BadgeNotification } from "@/components/BadgeNotification";
import { LearningPathRecommendations } from "@/components/LearningPathRecommendations";
import { AchievementCelebration, useAchievementTrigger, ACHIEVEMENT_TEMPLATES } from "@/components/AchievementCelebration";
import type { Topic } from "@shared/schema";
import type { AgeGroup } from "@/components/AgeSelector";

export default function Learning() {
  const [location] = useLocation();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("");
  const [newBadges, setNewBadges] = useState<Array<{badgeId: string; metadata?: any}>>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionArtifacts, setSessionArtifacts] = useState<any[]>([]);
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

  // Fetch student progress for achievements
  const { data: allProgress = [] } = useQuery<any[]>({
    queryKey: [`/api/progress/demo-student`],
    enabled: true,
  });

  // Handle learning session completion
  const handleSessionComplete = (artifacts: any[]) => {
    setSessionArtifacts(artifacts);
    setSessionCompleted(true);
    
    // Trigger achievements based on session completion
    triggerAchievement({
      ...ACHIEVEMENT_TEMPLATES.firstTopic,
      title: "Learning Cycle Master!",
      description: `Completed the full Teach → Try → Reflect → Create cycle for ${topic?.name}!`
    });

    // Navigate back to Campfire learning trail after celebrating the completion
    setTimeout(() => {
      // Return to Campfire learning trail to see progress and continue adventure
      window.location.href = '/quest-island';
    }, 4000); // Give time for achievement celebration
  };

  // Progress tracking mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { sessionCompleted: boolean; artifactsCreated: number }) => {
      const response = await apiRequest("POST", "/api/progress", {
        studentId: "demo-student", // In a real app, this would come from auth
        topicId,
        questionsAnswered: 4, // One for each phase
        correctAnswers: data.sessionCompleted ? 4 : 0,
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

  // Track session completion for achievements
  useEffect(() => {
    if (sessionCompleted && sessionArtifacts.length > 0) {
      updateProgressMutation.mutate({
        sessionCompleted: true,
        artifactsCreated: sessionArtifacts.length
      });
    }
  }, [sessionCompleted, sessionArtifacts, updateProgressMutation]);

  const handleBadgeDismissed = () => {
    setNewBadges([]);
  };

  const handleStartNewSession = () => {
    setSessionCompleted(false);
    setSessionArtifacts([]);
    setShowRecommendations(false);
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
            <a href="/dashboard" className="bg-gradient-to-r from-sunset-orange to-warm-orange text-white px-8 py-3 rounded-xl font-semibold hover:bg-gradient-to-r hover:from-sunset-orange/80 hover:to-warm-orange/80 transition-all duration-500">
              Go to Dashboard
            </a>
          </div>
        </div>
      </>
    );
  }

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
                <p className="text-white/80 text-lg mb-2">
                  Teaching Cycle: Learn → Practice → Reflect → Create
                </p>
                <div className="flex items-center justify-center space-x-6 text-white/60">
                  <span>Age Group: {selectedAgeGroup || "Primary"}</span>
                  <span>Session Time: {Math.floor((Date.now() - studyStartTime) / 60000)}m</span>
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
                autoStart={true}
              />
            </div>
            
            {/* Learning Cycle Interface */}
            <div className="col-span-full lg:col-span-3" data-testid="learning-cycle-section">
              {topicLoading ? (
                <div className="floating-ui rounded-3xl p-8">
                  <div className="animate-pulse space-y-6">
                    <div className="h-6 bg-white/20 rounded w-1/4"></div>
                    <div className="bg-white/10 rounded-2xl p-6">
                      <div className="h-20 bg-white/20 rounded"></div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 bg-white/20 rounded-xl"></div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : sessionCompleted ? (
                <div className="floating-ui rounded-3xl p-8 text-center" data-testid="completion-section">
                  <div className="mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-warm-orange to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    </div>
                    <h2 className="font-display text-3xl font-bold text-white mb-4">
                      Learning Cycle Complete!
                    </h2>
                    <p className="text-white/80 text-lg mb-2">
                      You've mastered the full teaching cycle for this topic.
                    </p>
                    <p className="text-white/70">
                      Created {sessionArtifacts.length} learning artifacts
                      <span className="text-warm-orange font-semibold ml-2">
                        Well done!
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    <button 
                      onClick={() => setShowRecommendations(true)}
                      className="bg-gradient-to-r from-accent-teal to-sky-blue text-white px-8 py-3 rounded-xl font-semibold hover:bg-gradient-to-r hover:from-accent-teal/80 hover:to-sky-blue/80 transition-all duration-500"
                      data-testid="button-show-recommendations"
                    >
                      What's Next?
                    </button>
                    <button 
                      onClick={handleStartNewSession}
                      className="bg-gradient-to-r from-sunset-orange to-warm-orange text-white px-8 py-3 rounded-xl font-semibold hover:bg-gradient-to-r hover:from-sunset-orange/80 hover:to-warm-orange/80 transition-all duration-500"
                      data-testid="button-new-session"
                    >
                      Start New Session
                    </button>
                    <a 
                      href="/dashboard"
                      className="bg-white/20 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/25 transition-colors duration-500"
                      data-testid="button-back-dashboard"
                    >
                      Back to Dashboard
                    </a>
                  </div>
                </div>
              ) : (
                <LearningCycle
                  topicId={topicId}
                  ageGroup={selectedAgeGroup as AgeGroup || "primary"}
                  studentId="demo-student"
                  onSessionComplete={handleSessionComplete}
                />
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* Badge Notifications */}
      {newBadges.length > 0 && (
        <BadgeNotification
          badges={newBadges}
          onClose={handleBadgeDismissed}
        />
      )}

      {/* Achievement Celebration */}
      {currentAchievement && (
        <AchievementCelebration
          achievement={currentAchievement}
          onClose={closeAchievement}
        />
      )}

      {/* Learning Path Recommendations */}
      <LearningPathRecommendations 
        show={showRecommendations}
        onClose={() => setShowRecommendations(false)}
        ageGroup={selectedAgeGroup as AgeGroup}
      />
    </>
  );
}