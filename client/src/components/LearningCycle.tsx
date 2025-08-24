import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { TeachPhase } from "./learning-phases/TeachPhase";
import { TryPhase } from "./learning-phases/TryPhase";
import { ReflectPhase } from "./learning-phases/ReflectPhase";
import { CreatePhase } from "./learning-phases/CreatePhase";
import { ExplorerBuddy } from "./ExplorerBuddy";
import { Play, BookOpen, Target, Sparkles, CheckCircle } from "lucide-react";
import type { LearningSession, LearningContent } from "@shared/schema";
import type { AgeGroup } from "./AgeSelector";

interface LearningCycleProps {
  topicId: string;
  ageGroup: AgeGroup;
  studentId: string;
  onSessionComplete?: (artifacts: any[]) => void;
}

type LearningPhase = "teach" | "try" | "reflect" | "create";

interface PhaseData {
  [key: string]: any;
}

export function LearningCycle({ topicId, ageGroup, studentId, onSessionComplete }: LearningCycleProps) {
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [currentPhase, setCurrentPhase] = useState<LearningPhase>("teach");
  const [phaseData, setPhaseData] = useState<Record<LearningPhase, PhaseData>>({
    teach: {},
    try: {},
    reflect: {},
    create: {}
  });
  const [sessionArtifacts, setSessionArtifacts] = useState<any[]>([]);
  const queryClient = useQueryClient();

  // Fetch or create learning session
  const { data: session, isLoading: sessionLoading } = useQuery<LearningSession>({
    queryKey: [`/api/learning-sessions/${topicId}/${studentId}`],
    enabled: !!topicId && !!studentId,
  });

  // Fetch learning content for current phase
  const { data: content, isLoading: contentLoading } = useQuery<LearningContent>({
    queryKey: [`/api/learning-content/${topicId}/${currentPhase}/${ageGroup}`],
    enabled: !!topicId && !!currentPhase,
  });

  // Create or update learning session
  const updateSessionMutation = useMutation({
    mutationFn: async (updates: Partial<LearningSession>) => {
      const response = await apiRequest("PATCH", `/api/learning-sessions/${session?.id}`, updates);
      return response.json();
    },
    onSuccess: (updatedSession) => {
      setCurrentSession(updatedSession);
      queryClient.invalidateQueries({ queryKey: [`/api/learning-sessions/${topicId}/${studentId}`] });
    }
  });

  // Save student artifact
  const saveArtifactMutation = useMutation({
    mutationFn: async (artifact: any) => {
      const response = await apiRequest("POST", "/api/student-artifacts", {
        studentId,
        sessionId: session?.id,
        topicId,
        ...artifact
      });
      return response.json();
    },
    onSuccess: (artifact) => {
      setSessionArtifacts(prev => [...prev, artifact]);
    }
  });

  // Initialize session if needed
  useEffect(() => {
    if (session) {
      setCurrentSession(session);
      setCurrentPhase(session.currentPhase as LearningPhase);
    }
  }, [session]);

  const handlePhaseComplete = async (phaseResults: PhaseData) => {
    // Save phase data
    const updatedPhaseData = {
      ...phaseData,
      [currentPhase]: phaseResults
    };
    setPhaseData(updatedPhaseData);

    // Save any artifacts from this phase
    if (phaseResults.artifacts) {
      for (const artifact of phaseResults.artifacts) {
        await saveArtifactMutation.mutateAsync(artifact);
      }
    }

    // Determine next phase
    const phaseOrder: LearningPhase[] = ["teach", "try", "reflect", "create"];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    const nextPhase = phaseOrder[currentIndex + 1];

    if (nextPhase) {
      // Move to next phase
      setCurrentPhase(nextPhase);
      await updateSessionMutation.mutateAsync({
        currentPhase: nextPhase,
        phaseProgress: {
          ...(session?.phaseProgress || {}),
          [currentPhase]: { completed: true, completedAt: new Date().toISOString(), data: phaseResults }
        }
      });
    } else {
      // Complete session
      await updateSessionMutation.mutateAsync({
        isCompleted: true,
        completedAt: new Date(),
        phaseProgress: {
          ...(session?.phaseProgress || {}),
          [currentPhase]: { completed: true, completedAt: new Date().toISOString(), data: phaseResults }
        }
      });

      // Notify parent component
      onSessionComplete?.(sessionArtifacts);
    }
  };

  const getPhaseIcon = (phase: LearningPhase) => {
    switch (phase) {
      case "teach": return <BookOpen className="w-5 h-5" />;
      case "try": return <Play className="w-5 h-5" />;
      case "reflect": return <Target className="w-5 h-5" />;
      case "create": return <Sparkles className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getPhaseColor = (phase: LearningPhase) => {
    switch (phase) {
      case "teach": return "from-blue-400 to-blue-600";
      case "try": return "from-green-400 to-green-600";
      case "reflect": return "from-purple-400 to-purple-600";
      case "create": return "from-orange-400 to-orange-600";
      default: return "from-blue-400 to-blue-600";
    }
  };

  const isPhaseCompleted = (phase: LearningPhase) => {
    const phaseProgress = session?.phaseProgress as Record<string, any> || {};
    return phaseProgress[phase]?.completed || false;
  };

  if (sessionLoading || contentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-orange mx-auto mb-4"></div>
          <p className="text-white/70">Preparing your learning adventure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Learning Cycle Progress Bar */}
      <div className="floating-ui rounded-2xl p-6" data-testid="learning-cycle-progress">
        <h3 className="font-display text-xl font-semibold text-white mb-6 text-center">
          Learning Journey: {content?.title || "Exploring Ideas"}
        </h3>
        
        <div className="flex justify-between items-center">
          {(["teach", "try", "reflect", "create"] as LearningPhase[]).map((phase, index) => (
            <div key={phase} className="flex flex-col items-center relative">
              {/* Connection line */}
              {index < 3 && (
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-white/20 z-0" />
              )}
              
              {/* Phase indicator */}
              <motion.div
                className={`relative z-10 w-12 h-12 rounded-full bg-gradient-to-r ${getPhaseColor(phase)} 
                            flex items-center justify-center mb-2 transition-all duration-300
                            ${currentPhase === phase ? 'ring-4 ring-white/30 scale-110' : ''}
                            ${isPhaseCompleted(phase) ? 'bg-gradient-to-r from-green-400 to-green-600' : ''}`}
                whileHover={{ scale: 1.05 }}
                data-testid={`phase-indicator-${phase}`}
              >
                {isPhaseCompleted(phase) ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <div className="text-white">
                    {getPhaseIcon(phase)}
                  </div>
                )}
              </motion.div>
              
              <span className={`text-sm font-medium capitalize transition-colors
                              ${currentPhase === phase ? 'text-white' : 'text-white/60'}`}>
                {phase}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Phase Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhase}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[500px]"
        >
          {currentPhase === "teach" && content && (
            <TeachPhase
              content={content}
              ageGroup={ageGroup}
              onPhaseComplete={handlePhaseComplete}
              previousData={phaseData.teach}
            />
          )}
          
          {currentPhase === "try" && content && (
            <TryPhase
              content={content}
              ageGroup={ageGroup}
              teachPhaseData={phaseData.teach}
              onPhaseComplete={handlePhaseComplete}
              previousData={phaseData.try}
            />
          )}
          
          {currentPhase === "reflect" && content && (
            <ReflectPhase
              content={content}
              ageGroup={ageGroup}
              sessionData={phaseData}
              onPhaseComplete={handlePhaseComplete}
              previousData={phaseData.reflect}
            />
          )}
          
          {currentPhase === "create" && content && (
            <CreatePhase
              content={content}
              ageGroup={ageGroup}
              sessionData={phaseData}
              onPhaseComplete={handlePhaseComplete}
              previousData={phaseData.create}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Scout Buddy - Learning Companion */}
      <ExplorerBuddy 
        ageGroup={ageGroup}
        currentPage={`/learning-cycle/${currentPhase}`}
        isStudying={true}
        studyDuration={Date.now() - (session?.startedAt ? new Date(session.startedAt).getTime() : Date.now())}
        recentProgress={{
          completedPhases: Object.keys(session?.phaseProgress || {}).filter(
            phase => (session?.phaseProgress as any)?.[phase]?.completed
          ).length,
          artifactsCreated: sessionArtifacts.length
        }}
      />
    </div>
  );
}