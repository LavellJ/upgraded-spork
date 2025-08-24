import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Eye, ArrowRight } from "lucide-react";
import { ExplorerBuddy } from "../ExplorerBuddy";
import type { LearningContent } from "@shared/schema";
import type { AgeGroup } from "../AgeSelector";

interface TeachPhaseProps {
  content: LearningContent;
  ageGroup: AgeGroup;
  onPhaseComplete: (results: any) => void;
  previousData?: any;
}

interface TeachContent {
  title: string;
  scoutThinkAloud: {
    steps: Array<{
      id: string;
      text: string;
      reasoning: string;
      visualCue?: string;
      duration: number; // seconds
    }>;
    concept: string;
    example: string;
  };
  workedExample?: {
    problem: string;
    steps: Array<{
      step: string;
      explanation: string;
      highlight?: string;
    }>;
  };
  keyTakeaways: string[];
}

export function TeachPhase({ content, ageGroup, onPhaseComplete, previousData }: TeachPhaseProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showWorkedExample, setShowWorkedExample] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [understandingLevel, setUnderstandingLevel] = useState<"confused" | "okay" | "clear" | null>(null);
  
  const teachContent = content.content as TeachContent;
  const steps = teachContent.scoutThinkAloud.steps;

  // Auto-advance through think-aloud steps
  useEffect(() => {
    if (!isPlaying || currentStep >= steps.length) return;

    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsPlaying(false);
        setShowWorkedExample(true);
      }
    }, (steps[currentStep]?.duration || 3) * 1000 / playbackSpeed);

    return () => clearTimeout(timer);
  }, [currentStep, isPlaying, steps, playbackSpeed]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setShowWorkedExample(false);
  };

  const handleSpeedChange = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
  };

  const handleUnderstandingCheck = (level: "confused" | "okay" | "clear") => {
    setUnderstandingLevel(level);
  };

  const handlePhaseComplete = () => {
    const results = {
      stepsViewed: currentStep + 1,
      totalSteps: steps.length,
      workedExampleViewed: showWorkedExample,
      understandingLevel,
      playbackSpeed,
      timeSpent: Date.now() - (previousData?.startTime || Date.now()),
      conceptUnderstood: understandingLevel === "clear" || understandingLevel === "okay"
    };

    onPhaseComplete(results);
  };

  const getAgeAppropriateLanguage = () => {
    switch (ageGroup) {
      case "pre-primary":
        return {
          title: "Let's Learn Together!",
          instruction: "Watch Scout show you how to do this:",
          comprehensionPrompt: "How do you feel about this?",
          options: ["I'm confused 😕", "I think I get it 🤔", "That makes sense! 😊"]
        };
      case "primary":
        return {
          title: "Scout's Teaching Time",
          instruction: "Scout will walk through an example and explain the thinking:",
          comprehensionPrompt: "How well do you understand this?",
          options: ["I'm confused", "I sort of get it", "I understand!"]
        };
      case "upper-primary":
        return {
          title: "Learning with Scout",
          instruction: "Scout will demonstrate the method and reasoning process:",
          comprehensionPrompt: "Rate your understanding:",
          options: ["Need more help", "Getting there", "I've got it!"]
        };
      default:
        return {
          title: "Learning with Scout",
          instruction: "Scout will demonstrate the method and reasoning process:",
          comprehensionPrompt: "Rate your understanding:",
          options: ["Need more help", "Getting there", "I've got it!"]
        };
    }
  };

  const language = getAgeAppropriateLanguage();

  // Simplified for pre-primary - visual and audio first
  if (ageGroup === "pre-primary") {
    return (
      <div className="space-y-8">
        {/* Simple Visual Header */}
        <div className="floating-ui rounded-3xl p-8 text-center" data-testid="teach-phase-header">
          <div className="text-6xl mb-4">👋</div>
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Let's Learn Together!
          </h2>
          <div className="text-4xl">🦉</div>
        </div>

        {/* Big Simple Watch Button */}
        <div className="floating-ui rounded-3xl p-12 text-center" data-testid="simple-teach-content">
          <div className="space-y-6">
            <div className="text-8xl mb-8">📚</div>
            
            {!isPlaying ? (
              <button
                onClick={handlePlayPause}
                className="w-48 h-48 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-2xl hover:scale-105 transition-all duration-300 shadow-2xl"
                data-testid="button-big-play"
              >
                <div className="text-center">
                  <div className="text-6xl mb-2">▶️</div>
                  <div>Watch</div>
                </div>
              </button>
            ) : (
              <div className="space-y-6">
                <div className="text-6xl animate-bounce">🤔</div>
                <div className="bg-white/20 rounded-2xl p-8">
                  <div className="text-white text-3xl font-bold mb-4">
                    {steps[currentStep]?.visualCue || "💡"}
                  </div>
                  <div className="text-white text-xl leading-relaxed">
                    {steps[currentStep]?.text}
                  </div>
                </div>
                
                <button
                  onClick={handlePlayPause}
                  className="w-32 h-32 bg-red-400 rounded-full flex items-center justify-center text-white text-4xl hover:scale-105 transition-all"
                  data-testid="button-big-pause"
                >
                  ⏸️
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Simple Understanding Check - Visual Only */}
        {(currentStep >= steps.length - 1 || showWorkedExample) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="floating-ui rounded-3xl p-8 text-center"
            data-testid="simple-understanding-check"
          >
            <div className="text-4xl mb-6">How do you feel?</div>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => handleUnderstandingCheck("confused")}
                className={`w-24 h-24 rounded-full text-4xl transition-all ${
                  understandingLevel === "confused" ? 'bg-orange-400 scale-110' : 'bg-white/20 hover:bg-white/30'
                }`}
                data-testid="feeling-confused"
              >
                😕
              </button>
              <button
                onClick={() => handleUnderstandingCheck("okay")}
                className={`w-24 h-24 rounded-full text-4xl transition-all ${
                  understandingLevel === "okay" ? 'bg-yellow-400 scale-110' : 'bg-white/20 hover:bg-white/30'
                }`}
                data-testid="feeling-okay"
              >
                🤔
              </button>
              <button
                onClick={() => handleUnderstandingCheck("clear")}
                className={`w-24 h-24 rounded-full text-4xl transition-all ${
                  understandingLevel === "clear" ? 'bg-green-400 scale-110' : 'bg-white/20 hover:bg-white/30'
                }`}
                data-testid="feeling-good"
              >
                😊
              </button>
            </div>
            
            {understandingLevel && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handlePhaseComplete}
                className="mt-8 w-40 h-20 bg-gradient-to-r from-warm-orange to-sunset-orange text-white text-xl font-bold rounded-2xl hover:scale-105 transition-all"
                data-testid="button-simple-continue"
              >
                <div>✨</div>
                <div>Try It!</div>
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phase Header */}
      <div className="floating-ui rounded-2xl p-6 text-center" data-testid="teach-phase-header">
        <h2 className="font-display text-2xl font-bold text-white mb-2">
          {language.title}
        </h2>
        <p className="text-white/80 text-lg">
          {teachContent.title}
        </p>
        <p className="text-white/60 mt-2">
          {language.instruction}
        </p>
      </div>

      {/* Scout Think-Aloud Section */}
      <div className="floating-ui rounded-2xl p-8" data-testid="scout-think-aloud">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-xl font-semibold text-white">
            Scout's Think-Aloud: {teachContent.scoutThinkAloud.concept}
          </h3>
          
          {/* Playback Controls */}
          <div className="flex gap-2">
            <button
              onClick={handlePlayPause}
              className="bg-warm-orange hover:bg-sunset-orange text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              data-testid="button-play-pause"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? "Pause" : "Play"}
            </button>
            
            <button
              onClick={handleRestart}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
              data-testid="button-restart"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleSpeedChange}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              data-testid="button-speed"
            >
              {playbackSpeed}x
            </button>
          </div>
        </div>

        {/* Think-Aloud Steps */}
        <div className="space-y-4 mb-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: index <= currentStep ? 1 : 0.3,
                scale: index === currentStep ? 1.02 : 1
              }}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                index === currentStep 
                  ? 'bg-warm-orange/20 border-warm-orange/50' 
                  : index < currentStep
                  ? 'bg-green-400/20 border-green-400/50'
                  : 'bg-white/10 border-white/20'
              }`}
              data-testid={`think-aloud-step-${index}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === currentStep ? 'bg-warm-orange text-white' :
                  index < currentStep ? 'bg-green-400 text-white' :
                  'bg-white/20 text-white/60'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">{step.text}</p>
                  <p className="text-white/70 text-sm italic">
                    💭 {step.reasoning}
                  </p>
                  {step.visualCue && (
                    <p className="text-warm-orange text-sm mt-2">
                      👁️ {step.visualCue}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-warm-orange to-sunset-orange h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Worked Example */}
      {showWorkedExample && teachContent.workedExample && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="floating-ui rounded-2xl p-8"
          data-testid="worked-example"
        >
          <h3 className="font-display text-xl font-semibold text-white mb-4">
            Let's See the Full Solution
          </h3>
          
          <div className="bg-white/10 rounded-xl p-6 mb-6">
            <h4 className="text-white font-semibold mb-3">Problem:</h4>
            <p className="text-white/90 text-lg">{teachContent.workedExample.problem}</p>
          </div>

          <div className="space-y-4">
            {teachContent.workedExample.steps.map((step, index) => (
              <div key={index} className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <h5 className="text-white font-semibold">{step.step}</h5>
                </div>
                <p className="text-white/80 ml-9">{step.explanation}</p>
                {step.highlight && (
                  <p className="text-yellow-300 ml-9 mt-2 italic">
                    💡 {step.highlight}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Key Takeaways */}
      {(currentStep >= steps.length - 1 || showWorkedExample) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="floating-ui rounded-2xl p-8"
          data-testid="key-takeaways"
        >
          <h3 className="font-display text-xl font-semibold text-white mb-4">
            Key Things to Remember
          </h3>
          
          <div className="space-y-3 mb-6">
            {teachContent.keyTakeaways.map((takeaway, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm">✓</span>
                </div>
                <p className="text-white/90">{takeaway}</p>
              </div>
            ))}
          </div>

          {/* Understanding Check */}
          <div className="bg-white/10 rounded-xl p-6">
            <h4 className="text-white font-semibold mb-4">{language.comprehensionPrompt}</h4>
            <div className="flex gap-3 flex-wrap">
              {language.options.map((option, index) => {
                const levels: Array<"confused" | "okay" | "clear"> = ["confused", "okay", "clear"];
                const level = levels[index];
                return (
                  <button
                    key={level}
                    onClick={() => handleUnderstandingCheck(level)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      understandingLevel === level
                        ? 'bg-warm-orange text-white'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    data-testid={`understanding-${level}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Continue Button */}
          {understandingLevel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center mt-6"
            >
              <button
                onClick={handlePhaseComplete}
                className="bg-gradient-to-r from-warm-orange to-sunset-orange text-white px-8 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 flex items-center gap-2"
                data-testid="button-continue-to-try"
              >
                Ready to Try It Myself!
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}