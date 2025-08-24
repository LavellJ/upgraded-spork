import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Lightbulb, CheckCircle, ArrowRight, RotateCcw } from "lucide-react";
import type { LearningContent } from "@shared/schema";
import type { AgeGroup } from "../AgeSelector";

interface TryPhaseProps {
  content: LearningContent;
  ageGroup: AgeGroup;
  teachPhaseData: any;
  onPhaseComplete: (results: any) => void;
  previousData?: any;
}

interface TryContent {
  title: string;
  fadedExamples: Array<{
    id: string;
    problem: string;
    steps: Array<{
      stepText: string;
      support: "filled" | "hint" | "blank";
      answer?: string;
      hintLadder?: {
        nudge: string;
        strategy: string;
        workedStep: string;
        reveal: string;
      };
    }>;
    feedback: {
      success: string;
      encouragement: string;
    };
  }>;
  manipulatives?: {
    type: "number-line" | "fraction-circles" | "base-ten-blocks" | "geometry-sketch" | "spelling-tiles";
    instructions: string;
  };
  misconceptionDetector: {
    commonErrors: Array<{
      pattern: string;
      explanation: string;
      redirect: string;
    }>;
  };
}

type HintLevel = "nudge" | "strategy" | "workedStep" | "reveal";

export function TryPhase({ content, ageGroup, teachPhaseData, onPhaseComplete, previousData }: TryPhaseProps) {
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepAnswers, setStepAnswers] = useState<Record<string, string>>({});
  const [hintsUsed, setHintsUsed] = useState<Record<string, HintLevel>>({});
  const [showHint, setShowHint] = useState<string | null>(null);
  const [currentHintLevel, setCurrentHintLevel] = useState<HintLevel>("nudge");
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [misconceptionTriggered, setMisconceptionTriggered] = useState<string | null>(null);

  const tryContent = content.content as TryContent;
  const currentExample = tryContent.fadedExamples[currentExampleIndex];
  const currentStep = currentExample?.steps[currentStepIndex];

  const getStepKey = () => `${currentExampleIndex}-${currentStepIndex}`;

  const handleAnswerChange = (value: string) => {
    const key = getStepKey();
    setStepAnswers(prev => ({ ...prev, [key]: value }));
    
    // Check for misconceptions
    checkForMisconceptions(value);
  };

  const checkForMisconceptions = (answer: string) => {
    if (!currentStep?.answer) return;

    const misconception = tryContent.misconceptionDetector.commonErrors.find(
      error => answer.toLowerCase().includes(error.pattern.toLowerCase())
    );

    if (misconception && answer !== currentStep.answer) {
      setMisconceptionTriggered(misconception.explanation);
    } else {
      setMisconceptionTriggered(null);
    }
  };

  const handleHintRequest = () => {
    const key = getStepKey();
    const hintLevels: HintLevel[] = ["nudge", "strategy", "workedStep", "reveal"];
    const currentLevel = hintsUsed[key] || "nudge";
    const currentIndex = hintLevels.indexOf(currentLevel);
    const nextLevel = hintLevels[Math.min(currentIndex + 1, hintLevels.length - 1)];
    
    setHintsUsed(prev => ({ ...prev, [key]: nextLevel }));
    setCurrentHintLevel(nextLevel);
    setShowHint(key);
  };

  const handleSubmitStep = () => {
    const key = getStepKey();
    const answer = stepAnswers[key]?.trim() || "";
    const currentAttempts = attempts[key] || 0;
    
    if (currentStep?.answer && answer.toLowerCase() === currentStep.answer.toLowerCase()) {
      // Correct answer
      setCompleted(prev => ({ ...prev, [key]: true }));
      setMisconceptionTriggered(null);
      
      // Move to next step or example
      if (currentStepIndex < currentExample.steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else if (currentExampleIndex < tryContent.fadedExamples.length - 1) {
        setCurrentExampleIndex(prev => prev + 1);
        setCurrentStepIndex(0);
      } else {
        // All examples completed
        handlePhaseComplete();
      }
    } else {
      // Incorrect answer
      setAttempts(prev => ({ ...prev, [key]: currentAttempts + 1 }));
      
      if (currentAttempts >= 2) {
        // Auto-show hint after 3 attempts
        handleHintRequest();
      }
    }
  };

  const handleSkipStep = () => {
    const key = getStepKey();
    setCompleted(prev => ({ ...prev, [key]: false }));
    
    if (currentStepIndex < currentExample.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (currentExampleIndex < tryContent.fadedExamples.length - 1) {
      setCurrentExampleIndex(prev => prev + 1);
      setCurrentStepIndex(0);
    } else {
      handlePhaseComplete();
    }
  };

  const handlePhaseComplete = () => {
    const totalSteps = tryContent.fadedExamples.reduce((sum, ex) => sum + ex.steps.length, 0);
    const completedSteps = Object.values(completed).filter(Boolean).length;
    const hintsUsedCount = Object.keys(hintsUsed).length;
    const totalAttempts = Object.values(attempts).reduce((sum, att) => sum + att, 0);

    const results = {
      examplesCompleted: currentExampleIndex + 1,
      totalExamples: tryContent.fadedExamples.length,
      stepsCompleted: completedSteps,
      totalSteps,
      hintsUsed: hintsUsedCount,
      totalAttempts,
      accuracy: totalSteps > 0 ? completedSteps / totalSteps : 0,
      independence: hintsUsedCount === 0 ? 1 : Math.max(0, 1 - (hintsUsedCount / totalSteps)),
      stepData: {
        answers: stepAnswers,
        completed,
        hintsUsed,
        attempts
      }
    };

    onPhaseComplete(results);
  };

  const getAgeAppropriateLanguage = () => {
    switch (ageGroup) {
      case "pre-primary":
        return {
          title: "Your Turn to Try!",
          instruction: "Fill in the missing parts. Scout is here to help if you need it!",
          hintButton: "Help me, Scout!",
          submitButton: "Check my answer",
          skipButton: "I need more help"
        };
      case "primary":
        return {
          title: "Practice Time",
          instruction: "Complete the steps below. Use the hint ladder if you get stuck!",
          hintButton: "Get a hint",
          submitButton: "Submit answer",
          skipButton: "Skip this step"
        };
      case "upper-primary":
        return {
          title: "Apply What You've Learned",
          instruction: "Work through these examples step by step. Challenge yourself before using hints!",
          hintButton: "Request hint",
          submitButton: "Check answer",
          skipButton: "Move to next"
        };
      default:
        return {
          title: "Practice Time",
          instruction: "Complete the steps below. Use the hint ladder if you get stuck!",
          hintButton: "Get a hint",
          submitButton: "Submit answer",
          skipButton: "Skip this step"
        };
    }
  };

  const language = getAgeAppropriateLanguage();

  if (!currentExample) {
    return <div>Loading examples...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Phase Header */}
      <div className="floating-ui rounded-2xl p-6 text-center" data-testid="try-phase-header">
        <h2 className="font-display text-2xl font-bold text-white mb-2">
          {language.title}
        </h2>
        <p className="text-white/80 text-lg">
          {tryContent.title}
        </p>
        <p className="text-white/60 mt-2">
          {language.instruction}
        </p>
        
        {/* Progress Indicator */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <span className="text-white/60">
            Example {currentExampleIndex + 1} of {tryContent.fadedExamples.length}
          </span>
          <div className="w-32 bg-white/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentExampleIndex + 1) / tryContent.fadedExamples.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current Example */}
      <div className="floating-ui rounded-2xl p-8" data-testid="faded-example">
        <h3 className="font-display text-xl font-semibold text-white mb-4">
          {currentExample.problem}
        </h3>

        <div className="space-y-6">
          {currentExample.steps.map((step, index) => {
            const stepKey = `${currentExampleIndex}-${index}`;
            const isCurrentStep = index === currentStepIndex;
            const isCompleted = completed[stepKey];
            const isPast = index < currentStepIndex;
            
            return (
              <motion.div
                key={stepKey}
                initial={{ opacity: 0.5 }}
                animate={{ 
                  opacity: isCurrentStep ? 1 : isPast ? 0.8 : 0.5,
                  scale: isCurrentStep ? 1.02 : 1
                }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  isCurrentStep ? 'bg-green-400/20 border-green-400/50' :
                  isCompleted ? 'bg-blue-400/20 border-blue-400/50' :
                  isPast ? 'bg-white/10 border-white/30' :
                  'bg-white/5 border-white/20'
                }`}
                data-testid={`step-${index}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isCompleted ? 'bg-blue-400 text-white' :
                    isCurrentStep ? 'bg-green-400 text-white' :
                    'bg-white/20 text-white/60'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-white font-medium mb-3">{step.stepText}</p>
                    
                    {step.support === "filled" && step.answer && (
                      <div className="bg-blue-400/20 border border-blue-400/50 rounded-lg p-3">
                        <p className="text-white font-medium">{step.answer}</p>
                      </div>
                    )}
                    
                    {step.support === "blank" && isCurrentStep && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={stepAnswers[stepKey] || ""}
                          onChange={(e) => handleAnswerChange(e.target.value)}
                          placeholder="Your answer..."
                          className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:border-green-400 focus:outline-none"
                          data-testid={`answer-input-${index}`}
                        />
                        
                        <div className="flex gap-3">
                          <button
                            onClick={handleSubmitStep}
                            disabled={!stepAnswers[stepKey]?.trim()}
                            className="bg-green-400 hover:bg-green-500 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            data-testid="button-submit-step"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {language.submitButton}
                          </button>
                          
                          <button
                            onClick={handleHintRequest}
                            className="bg-warm-orange hover:bg-sunset-orange text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            data-testid="button-hint"
                          >
                            <HelpCircle className="w-4 h-4" />
                            {language.hintButton}
                          </button>
                          
                          <button
                            onClick={handleSkipStep}
                            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            data-testid="button-skip"
                          >
                            {language.skipButton}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {step.support === "hint" && isCurrentStep && (
                      <div className="bg-yellow-400/20 border border-yellow-400/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-medium">Hint Available</span>
                        </div>
                        <button
                          onClick={handleHintRequest}
                          className="text-white hover:text-yellow-400 transition-colors"
                        >
                          Click to reveal hint
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Current Example Progress */}
        <div className="mt-6 flex justify-between items-center">
          <span className="text-white/60">
            Step {currentStepIndex + 1} of {currentExample.steps.length}
          </span>
          <div className="w-48 bg-white/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentStepIndex + 1) / currentExample.steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Hint Ladder Modal */}
      <AnimatePresence>
        {showHint && currentStep?.hintLadder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowHint(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-8 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
              data-testid="hint-ladder-modal"
            >
              <h3 className="font-display text-xl font-semibold text-white mb-4">
                Hint Ladder
              </h3>
              
              <div className="space-y-4">
                {Object.entries(currentStep.hintLadder).map(([level, hint], index) => {
                  const levels: HintLevel[] = ["nudge", "strategy", "workedStep", "reveal"];
                  const currentLevelIndex = levels.indexOf(currentHintLevel);
                  const shouldShow = index <= currentLevelIndex;
                  
                  return (
                    <motion.div
                      key={level}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: shouldShow ? 1 : 0.3, x: 0 }}
                      className={`p-4 rounded-lg ${shouldShow ? 'bg-white/20' : 'bg-white/10'}`}
                    >
                      <h4 className="text-white font-medium capitalize mb-2">{level}:</h4>
                      <p className="text-white/90">{hint}</p>
                    </motion.div>
                  );
                })}
              </div>
              
              <button
                onClick={() => setShowHint(null)}
                className="w-full mt-6 bg-warm-orange hover:bg-sunset-orange text-white py-2 rounded-lg font-medium transition-colors"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Misconception Alert */}
      <AnimatePresence>
        {misconceptionTriggered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="floating-ui rounded-2xl p-6 bg-red-400/20 border border-red-400/50"
            data-testid="misconception-alert"
          >
            <h4 className="text-red-400 font-semibold mb-2">Quick Fix Needed!</h4>
            <p className="text-white">{misconceptionTriggered}</p>
            <button
              onClick={() => setMisconceptionTriggered(null)}
              className="mt-3 bg-red-400 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Thanks, Scout!
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}