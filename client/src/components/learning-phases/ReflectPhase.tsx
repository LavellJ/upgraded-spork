import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Heart, Target, ArrowRight, Star } from "lucide-react";
import { ScoutSpeechButton } from "@/components/ScoutSpeechButton";
import type { LearningContent } from "@shared/schema";
import type { AgeGroup } from "../AgeSelector";

interface ReflectPhaseProps {
  content: LearningContent;
  ageGroup: AgeGroup;
  sessionData: any;
  onPhaseComplete: (results: any) => void;
  previousData?: any;
}

interface ReflectContent {
  title?: string;
  content?: string;
  // Legacy support for old structure
  metacognitionPrompts?: Array<{
    id: string;
    type: "difficulty" | "strategy" | "confidence" | "application";
    question: string;
    options?: string[];
    allowText?: boolean;
  }>;
  selfAssessment?: {
    criteria: Array<{
      skill: string;
      description: string;
      levels: string[];
    }>;
  };
}

export function ReflectPhase({ content, ageGroup, sessionData, onPhaseComplete, previousData }: ReflectPhaseProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [selfAssessmentComplete, setSelfAssessmentComplete] = useState(false);
  const [overallReflection, setOverallReflection] = useState("");

  const reflectContent = content.content;
  
  // Handle both new Scout format (simple string) and legacy format
  const isScoutFormat = typeof reflectContent === 'string';
  const scoutMessage = isScoutFormat ? reflectContent : null;
  const legacyContent = !isScoutFormat ? reflectContent as ReflectContent : null;
  const currentPrompt = legacyContent?.metacognitionPrompts?.[currentPromptIndex];

  const handleResponse = (promptId: string, response: any) => {
    setResponses(prev => ({ ...prev, [promptId]: response }));
  };

  const handleNextPrompt = () => {
    if (legacyContent?.metacognitionPrompts && currentPromptIndex < legacyContent.metacognitionPrompts.length - 1) {
      setCurrentPromptIndex(prev => prev + 1);
    } else {
      setSelfAssessmentComplete(true);
    }
  };

  const handlePhaseComplete = () => {
    const teachPhaseData = sessionData.teach || {};
    const tryPhaseData = sessionData.try || {};

    const results = {
      metacognitionResponses: responses,
      overallReflection,
      reflectionQuality: calculateReflectionQuality(),
      learningInsights: generateLearningInsights(),
      selfRegulationSkills: {
        awarenessOfDifficulty: responses.difficulty || "not-assessed",
        strategyIdentification: responses.strategy || "not-assessed",
        confidenceLevel: responses.confidence || "not-assessed"
      },
      timeSpent: Date.now() - (previousData?.startTime || Date.now())
    };

    onPhaseComplete(results);
  };

  const calculateReflectionQuality = () => {
    // Handle Scout format vs legacy format
    if (isScoutFormat) {
      return 100; // Scout experiences are always considered high quality
    }
    
    const textResponses = Object.values(responses).filter(r => typeof r === "string" && r.length > 10);
    const promptsLength = legacyContent?.metacognitionPrompts?.length || 1;
    const thoughtfulnessScore = textResponses.length / promptsLength;
    return Math.min(thoughtfulnessScore * 100, 100);
  };

  const generateLearningInsights = () => {
    // Handle Scout format vs legacy format
    if (isScoutFormat) {
      return ["Completed Scout adventure with engagement and curiosity"];
    }
    
    const insights = [];
    
    if (responses.difficulty === "easy") {
      insights.push("Student found the material manageable - ready for increased challenge");
    } else if (responses.difficulty === "hard") {
      insights.push("Student found the material challenging - may benefit from review or different approach");
    }

    if (responses.strategy && typeof responses.strategy === "string") {
      insights.push(`Student identified helpful strategy: ${responses.strategy}`);
    }

    return insights;
  };

  const getAgeAppropriateLanguage = () => {
    switch (ageGroup) {
      case "pre-primary":
        return {
          title: "How Did That Feel?",
          instruction: "Let's think about what we just learned!",
          continueButton: "Next question",
          finishButton: "I'm done thinking!"
        };
      case "primary":
        return {
          title: "Time to Reflect",
          instruction: "Take a moment to think about your learning",
          continueButton: "Continue",
          finishButton: "Finish reflecting"
        };
      case "upper-primary":
        return {
          title: "Learning Reflection",
          instruction: "Metacognition helps you become a better learner",
          continueButton: "Next reflection",
          finishButton: "Complete reflection"
        };
      default:
        return {
          title: "Time to Reflect",
          instruction: "Take a moment to think about your learning",
          continueButton: "Continue",
          finishButton: "Finish reflecting"
        };
    }
  };

  const language = getAgeAppropriateLanguage();

  // For Scout format, show simplified reflection
  if (isScoutFormat) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="floating-ui rounded-3xl p-8" data-testid="scout-reflect-phase">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
              <div className="text-white text-3xl">🌟</div>
            </div>
            <div className="text-white text-xl font-bold">
              What did we discover together?
            </div>
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <ScoutSpeechButton 
                  text={scoutMessage || "What did we discover together? Let's think about our amazing adventure!"}
                  autoSpeak={true}
                />
              </div>
              <div className="text-white text-lg leading-relaxed">
                {scoutMessage}
              </div>
            </div>
            <button
              onClick={() => handlePhaseComplete()}
              className="px-6 py-3 bg-gradient-to-r from-purple-400 to-blue-400 text-white font-medium rounded-2xl hover:scale-105 transition-all"
              data-testid="continue-reflection"
            >
              Ready for our next adventure!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Memory Anchors & Real-World Application for pre-primary
  if (ageGroup === "pre-primary") {
    const [reflectStep, setReflectStep] = useState<'memory' | 'realworld' | 'complete'>('memory');
    const [memoryAnchor, setMemoryAnchor] = useState<string | null>(null);
    
    const handleMemoryChoice = (anchor: string) => {
      setMemoryAnchor(anchor);
      setReflectStep('realworld');
    };
    
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Memory Anchors Phase */}
        {reflectStep === 'memory' && (
          <div className="floating-ui rounded-3xl p-8" data-testid="memory-anchors">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                <div className="text-white text-3xl">🧠</div>
              </div>
              
              <div className="text-white text-xl font-bold">
                Let's remember this adventure!
              </div>
              
              <div className="text-white/80 text-lg">
                What was the most fun part?
              </div>
              
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <button
                  onClick={() => handleMemoryChoice('discovery')}
                  className="p-6 bg-gradient-to-b from-blue-400/30 to-blue-400/20 hover:from-blue-400/40 hover:to-blue-400/30 rounded-2xl border-2 border-blue-400/40 hover:border-blue-400/60 transition-all hover:scale-105 flex flex-col items-center justify-center"
                  data-testid="memory-discovery"
                >
                  <div className="text-3xl mb-2 text-white">🔍</div>
                  <div className="text-white text-base font-medium">Exploring</div>
                </button>
                
                <button
                  onClick={() => handleMemoryChoice('solving')}
                  className="p-6 bg-gradient-to-b from-green-400/30 to-green-400/20 hover:from-green-400/40 hover:to-green-400/30 rounded-2xl border-2 border-green-400/40 hover:border-green-400/60 transition-all hover:scale-105 flex flex-col items-center justify-center"
                  data-testid="memory-solving"
                >
                  <div className="text-3xl mb-2 text-white">🧩</div>
                  <div className="text-white text-base font-medium">Solving</div>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Real-World Application */}
        {reflectStep === 'realworld' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="floating-ui rounded-3xl p-8"
            data-testid="real-world-connection"
          >
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-warm-orange to-sunset-orange flex items-center justify-center">
                <div className="text-white text-2xl">🏠</div>
              </div>
              
              <div className="text-white text-lg font-bold">
                Where might you use this at home?
              </div>
              
              <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="text-white/90 text-base leading-relaxed">
                  {memoryAnchor === 'discovery' 
                    ? "Next time you're playing, you could explore and discover new things just like we did!"
                    : "When you have a tricky problem at home, you can think it through step by step like we practiced!"
                  }
                </div>
              </div>
              
              <button
                onClick={() => {
                  handleResponse(currentPrompt?.id || 'memory', memoryAnchor || 'learned');
                  setReflectStep('complete');
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-400 text-white font-medium rounded-2xl hover:scale-105 transition-all"
                data-testid="understand-connection"
              >
                I get it!
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Completion with Reward */}
        {reflectStep === 'complete' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="floating-ui rounded-3xl p-12 text-center"
            data-testid="reflection-complete"
          >
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                <div className="text-white text-4xl">🏆</div>
              </div>
              
              <div className="text-white text-2xl font-bold">
                Explorer's Badge Earned!
              </div>
              
              <div className="text-white/80 text-lg">
                You're becoming a great learner!
              </div>
              
              <button
                onClick={handlePhaseComplete}
                className="px-8 py-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white text-lg font-medium rounded-2xl hover:scale-105 transition-all"
                data-testid="create-something"
              >
                Let's create something!
              </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phase Header */}
      <div className="floating-ui rounded-2xl p-6 text-center" data-testid="reflect-phase-header">
        <h2 className="font-display text-2xl font-bold text-white mb-2">
          {language.title}
        </h2>
        <p className="text-white/80 text-lg">
          {reflectContent.title}
        </p>
        <p className="text-white/60 mt-2">
          {language.instruction}
        </p>
        
        {/* Progress Indicator */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <span className="text-white/60">
            Question {currentPromptIndex + 1} of {reflectContent.metacognitionPrompts.length}
          </span>
          <div className="w-32 bg-white/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentPromptIndex + 1) / reflectContent.metacognitionPrompts.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {!selfAssessmentComplete ? (
        /* Metacognition Prompts */
        <motion.div
          key={currentPromptIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="floating-ui rounded-2xl p-8"
          data-testid="metacognition-prompt"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              {currentPrompt?.type === "difficulty" && <Target className="w-6 h-6 text-white" />}
              {currentPrompt?.type === "strategy" && <Brain className="w-6 h-6 text-white" />}
              {currentPrompt?.type === "confidence" && <Heart className="w-6 h-6 text-white" />}
              {currentPrompt?.type === "application" && <Star className="w-6 h-6 text-white" />}
            </div>
            <h3 className="font-display text-xl font-semibold text-white">
              {currentPrompt?.question}
            </h3>
          </div>

          {currentPrompt?.options ? (
            /* Multiple Choice Response */
            <div className="space-y-3 mb-6">
              {currentPrompt.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleResponse(currentPrompt.id, option)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    responses[currentPrompt.id] === option
                      ? 'bg-purple-400/20 border-purple-400/50 text-white'
                      : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/15'
                  }`}
                  data-testid={`option-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 transition-all ${
                      responses[currentPrompt.id] === option
                        ? 'bg-purple-400 border-purple-400'
                        : 'border-white/40'
                    }`}>
                      {responses[currentPrompt.id] === option && (
                        <div className="w-full h-full rounded-full bg-white/20" />
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Text Response */
            <div className="mb-6">
              <textarea
                value={responses[currentPrompt.id] || ""}
                onChange={(e) => handleResponse(currentPrompt.id, e.target.value)}
                placeholder={ageGroup === "pre-primary" ? "Tell me what you think..." : "Share your thoughts..."}
                aria-label="Enter your reflection response"
                className="w-full h-32 bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-purple-400 focus:outline-none resize-none"
                data-testid="text-response"
              />
            </div>
          )}

          {/* Continue Button */}
          {responses[currentPrompt.id] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center"
            >
              <button
                onClick={handleNextPrompt}
                className="bg-gradient-to-r from-purple-400 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 flex items-center gap-2"
                data-testid="button-continue-prompt"
              >
                {currentPromptIndex < reflectContent.metacognitionPrompts.length - 1 ? 
                  language.continueButton : "Review my learning"
                }
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </motion.div>
      ) : (
        /* Self-Assessment Summary */
        <div className="space-y-6">
          {/* Learning Summary */}
          <div className="floating-ui rounded-2xl p-8" data-testid="learning-summary">
            <h3 className="font-display text-xl font-semibold text-white mb-6">
              Your Learning Journey Summary
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Teach Phase Summary */}
              <div className="bg-blue-400/20 rounded-xl p-4">
                <h4 className="text-blue-400 font-semibold mb-2">📚 Learn Phase</h4>
                <p className="text-white/80 text-sm">
                  {sessionData.teach?.conceptUnderstood ? 
                    "You understood Scout's explanation well!" : 
                    "You're building understanding step by step."
                  }
                </p>
              </div>

              {/* Try Phase Summary */}
              <div className="bg-green-400/20 rounded-xl p-4">
                <h4 className="text-green-400 font-semibold mb-2">🎯 Practice Phase</h4>
                <p className="text-white/80 text-sm">
                  You completed {sessionData.try?.stepsCompleted || 0} out of {sessionData.try?.totalSteps || 0} practice steps
                  {sessionData.try?.accuracy > 0.8 && " with great accuracy!"}
                </p>
              </div>
            </div>
            
            {/* Self-Assessment Skills */}
            <div className="bg-white/10 rounded-xl p-6">
              <h4 className="text-white font-semibold mb-4">How I Learn Best</h4>
              <div className="space-y-3">
                {Object.entries(responses).map(([key, value], index) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-white/70 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="text-white font-medium">
                      {typeof value === "string" && value.length > 50 ? 
                        `${value.substring(0, 50)}...` : 
                        value
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Overall Reflection */}
          <div className="floating-ui rounded-2xl p-8" data-testid="overall-reflection">
            <h3 className="font-display text-xl font-semibold text-white mb-4">
              One Final Thought
            </h3>
            <p className="text-white/70 mb-4">
              {ageGroup === "pre-primary" ? 
                "What was the best part of learning this?" :
                "What's one thing you'll remember from this lesson?"
              }
            </p>
            <textarea
              value={overallReflection}
              onChange={(e) => setOverallReflection(e.target.value)}
              placeholder={ageGroup === "pre-primary" ? "I liked..." : "I learned that..."}
              className="w-full h-24 bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-purple-400 focus:outline-none resize-none mb-6"
              data-testid="overall-reflection-input"
            />
            
            <div className="flex justify-center">
              <button
                onClick={handlePhaseComplete}
                disabled={!overallReflection.trim()}
                className="bg-gradient-to-r from-purple-400 to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 flex items-center gap-2"
                data-testid="button-complete-reflection"
              >
                {language.finishButton}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}