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
  title?: string;
  content?: string;
  // Legacy support for old structure
  fadedExamples?: Array<{
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
  misconceptionDetector?: {
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

  const tryContent = content.content;
  
  // Handle both new Scout format (simple string) and legacy format
  const isScoutFormat = typeof tryContent === 'string';
  const scoutMessage = isScoutFormat ? tryContent : null;
  const legacyContent = !isScoutFormat ? tryContent as TryContent : null;
  const currentExample = legacyContent?.fadedExamples?.[currentExampleIndex];
  const currentStep = currentExample?.steps?.[currentStepIndex];

  const getStepKey = () => `${currentExampleIndex}-${currentStepIndex}`;

  const handleAnswerChange = (value: string) => {
    const key = getStepKey();
    setStepAnswers(prev => ({ ...prev, [key]: value }));
    
    // Check for misconceptions
    checkForMisconceptions(value);
  };

  const checkForMisconceptions = (answer: string) => {
    if (!currentStep?.answer || !legacyContent?.misconceptionDetector) return;

    const misconception = legacyContent.misconceptionDetector.commonErrors.find(
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
      if (currentExample && currentExample.steps && currentStepIndex < currentExample.steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else if (legacyContent?.fadedExamples && currentExampleIndex < legacyContent.fadedExamples.length - 1) {
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
    
    if (currentExample?.steps && currentStepIndex < currentExample.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (legacyContent?.fadedExamples && currentExampleIndex < legacyContent.fadedExamples.length - 1) {
      setCurrentExampleIndex(prev => prev + 1);
      setCurrentStepIndex(0);
    } else {
      handlePhaseComplete();
    }
  };

  const handlePhaseComplete = () => {
    // Handle Scout format vs legacy format
    if (isScoutFormat) {
      const results = {
        phase: 'try',
        format: 'scout',
        completed: true
      };
      onPhaseComplete(results);
      return;
    }

    const totalSteps = legacyContent?.fadedExamples?.reduce((sum: number, ex: any) => sum + ex.steps.length, 0) || 0;
    const completedSteps = Object.values(completed).filter(Boolean).length;
    const hintsUsedCount = Object.keys(hintsUsed).length;
    const totalAttempts = Object.values(attempts).reduce((sum: number, att: number) => sum + att, 0);

    const results = {
      examplesCompleted: currentExampleIndex + 1,
      totalExamples: legacyContent?.fadedExamples?.length || 0,
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

  // For Scout format, show simplified interaction
  if (isScoutFormat) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="floating-ui rounded-3xl p-8" data-testid="scout-try-phase">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
              <div className="text-white text-3xl">🤝</div>
            </div>
            <div className="text-white text-xl font-bold">
              Let's try this together!
            </div>
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="text-white text-lg leading-relaxed">
                {scoutMessage}
              </div>
            </div>
            <button
              onClick={() => handlePhaseComplete()}
              className="px-6 py-3 bg-gradient-to-r from-purple-400 to-blue-400 text-white font-medium rounded-2xl hover:scale-105 transition-all"
              data-testid="continue-button"
            >
              Let's keep exploring!
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentExample || !legacyContent) {
    return <div>Loading examples...</div>;
  }

  // Co-Learning phase for pre-primary following Scout's Teaching Cycle
  if (ageGroup === "pre-primary") {
    const [coLearningStep, setCoLearningStep] = useState<'buddy' | 'guided' | 'success'>('buddy');
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    
    const tryContent = content.content;
  
  const handleCoSolve = (choice: string) => {
      setSelectedChoice(choice);
      setCoLearningStep('guided');
      
      // After showing guidance, move to success
      setTimeout(() => {
        setCoLearningStep('success');
        setTimeout(() => {
          handlePhaseComplete();
        }, 2000);
      }, 3000);
    };
    
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Co-Learning (Buddy System) */}
        {coLearningStep === 'buddy' && (
          <div className="floating-ui rounded-3xl p-8" data-testid="co-learning">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                <div className="text-white text-3xl">🤝</div>
              </div>
              
              <div className="text-white text-xl font-bold">
                Let's figure this out together!
              </div>
              
              <div className="text-white/80 text-lg leading-relaxed">
                I'm not sure either... but I have an idea. Want to try it with me?
              </div>
              
              {/* Interactive Problem Solving */}
              <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="text-white text-base mb-6">
                  {typeof tryContent === 'string' 
                    ? tryContent.slice(0, 100) + '...' 
                    : 'Which one do you think we should choose?'
                  }
                </div>
                
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <button
                    onClick={() => handleCoSolve('first')}
                    className="p-6 bg-gradient-to-b from-green-400/30 to-green-400/20 hover:from-green-400/40 hover:to-green-400/30 rounded-2xl border-2 border-green-400/40 hover:border-green-400/60 transition-all hover:scale-105 flex flex-col items-center justify-center"
                    data-testid="choice-first"
                  >
                    <div className="text-3xl mb-2 text-white">✨</div>
                    <div className="text-white text-base font-medium">This one</div>
                  </button>
                  
                  <button
                    onClick={() => handleCoSolve('second')}
                    className="p-6 bg-gradient-to-b from-blue-400/30 to-blue-400/20 hover:from-blue-400/40 hover:to-blue-400/30 rounded-2xl border-2 border-blue-400/40 hover:border-blue-400/60 transition-all hover:scale-105 flex flex-col items-center justify-center"
                    data-testid="choice-second"
                  >
                    <div className="text-3xl mb-2 text-white">🌟</div>
                    <div className="text-white text-base font-medium">That one</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Guided Practice */}
        {coLearningStep === 'guided' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="floating-ui rounded-3xl p-8"
            data-testid="guided-practice"
          >
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center">
                <div className="text-white text-2xl">💬</div>
              </div>
              
              <div className="text-white text-lg font-bold">
                Great choice!
              </div>
              
              <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="text-white/90 text-base leading-relaxed">
                  I think you picked {selectedChoice === 'first' ? 'the sparkly one' : 'the star one'}! 
                  That makes sense because... <br/><br/>
                  <span className="text-green-300">You're learning to think through problems step by step!</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Success & Encouragement */}
        {coLearningStep === 'success' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="floating-ui rounded-3xl p-12 text-center"
            data-testid="co-learning-success"
          >
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center">
                <div className="text-white text-4xl">🎉</div>
              </div>
              
              <div className="text-white text-2xl font-bold">
                We did it together!
              </div>
              
              <div className="text-white/80 text-lg">
                You're getting really good at this exploring!
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
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