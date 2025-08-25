import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Eye, ArrowRight, Sparkles, Star, Heart } from "lucide-react";
import { ExplorerBuddy } from "../ExplorerBuddy";
import { ScoutSpeechButton } from "@/components/ScoutSpeechButton";
import type { LearningContent } from "@shared/schema";
import type { AgeGroup } from "../AgeSelector";

interface TeachPhaseProps {
  content: LearningContent;
  ageGroup: AgeGroup;
  onPhaseComplete: (results: any) => void;
  previousData?: any;
}

interface TeachContent {
  title?: string;
  content?: string;
  // Legacy support for old structure
  scoutThinkAloud?: {
    steps: Array<{
      id: string;
      text: string;
      reasoning: string;
      visualCue?: string;
      duration: number;
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
  keyTakeaways?: string[];
}

export function TeachPhase({ content, ageGroup, onPhaseComplete, previousData }: TeachPhaseProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showWorkedExample, setShowWorkedExample] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [understandingLevel, setUnderstandingLevel] = useState<"confused" | "okay" | "clear" | null>(null);
  
  const teachContent = content.content as TeachContent;
  
  // Handle both new Scout format (simple string) and legacy format
  const isScoutFormat = typeof teachContent === 'string';
  const scoutMessage = isScoutFormat ? teachContent : null;
  const steps = !isScoutFormat && teachContent.scoutThinkAloud ? teachContent.scoutThinkAloud.steps : [];

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

  // Adventure-based teaching for pre-primary following Scout's Universal Teaching Cycle
  if (ageGroup === "pre-primary") {
    const [teachingStep, setTeachingStep] = useState<'hook' | 'experience' | 'ready'>('hook');
    const [showVisualDemo, setShowVisualDemo] = useState(false);
    const [particleCount, setParticleCount] = useState(0);
    const [isInteracting, setIsInteracting] = useState(false);
    
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Adventure Hook */}
        <AnimatePresence mode="wait">
          {teachingStep === 'hook' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative"
            >
              {/* Floating particles background */}
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [-20, 20, -20],
                      x: [-10, 10, -10],
                      opacity: [0.3, 0.8, 0.3],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                      duration: 4 + Math.random() * 2,
                      repeat: Infinity,
                      delay: i * 0.5
                    }}
                  />
                ))}
              </div>
              
              <div className="floating-ui rounded-3xl p-8 relative overflow-hidden" data-testid="adventure-hook">
                {/* Animated background gradient */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-teal-500/20"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{ duration: 8, repeat: Infinity }}
                  style={{ backgroundSize: '200% 200%' }}
                />
                
                <div className="text-center space-y-6 relative z-10">
                  <motion.div
                    className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-dawn-pink to-warm-orange flex items-center justify-center relative"
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity }
                    }}
                  >
                    <div className="text-white text-3xl">🗺️</div>
                    
                    {/* Orbiting sparkles */}
                    {Array.from({ length: 3 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                        animate={{
                          rotate: [0, 360]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: i * 1,
                          ease: "linear"
                        }}
                        style={{
                          transformOrigin: '40px',
                          top: '50%',
                          left: '50%'
                        }}
                      />
                    ))}
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-white text-xl font-bold"
                  >
                    Hey explorer!
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-white/80 text-lg leading-relaxed"
                  >
                    I've got something amazing to show you. Want to go on an adventure together?
                  </motion.div>
                  
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    onClick={() => {
                      setParticleCount(prev => prev + 5);
                      setTimeout(() => setTeachingStep('experience'), 300);
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 10px 25px rgba(255, 165, 0, 0.3)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gradient-to-r from-warm-orange to-sunset-orange text-white text-lg font-medium rounded-2xl relative overflow-hidden group"
                    data-testid="start-adventure"
                  >
                    <motion.span
                      className="relative z-10 flex items-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Let's explore!
                      <Sparkles className="w-5 h-5" />
                    </motion.span>
                    
                    {/* Button shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6 }}
                    />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Teaching Through Experience */}
        <AnimatePresence mode="wait">
          {teachingStep === 'experience' && (
            <motion.div
              initial={{ opacity: 0, x: 100, rotateY: -15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -100, rotateY: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative"
            >
              {/* Magical aura background */}
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl"
                  animate={{
                    scale: [1, 1.02, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                
                {/* Floating magical elements */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [-30, 30, -30],
                      x: [-20, 20, -20],
                      rotate: [0, 360],
                      opacity: [0.2, 0.7, 0.2]
                    }}
                    transition={{
                      duration: 6 + Math.random() * 4,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  >
                    {i % 3 === 0 ? (
                      <Star className="w-3 h-3 text-yellow-400" />
                    ) : i % 3 === 1 ? (
                      <Sparkles className="w-2 h-2 text-blue-400" />
                    ) : (
                      <Heart className="w-2 h-2 text-pink-400" />
                    )}
                  </motion.div>
                ))}
              </div>
              
              <div className="floating-ui rounded-3xl p-8 relative overflow-hidden" data-testid="visual-teaching">
                <div className="space-y-6 relative z-10">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                  >
                    <motion.div
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center relative"
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(59, 130, 246, 0.5)",
                          "0 0 40px rgba(147, 51, 234, 0.7)",
                          "0 0 20px rgba(59, 130, 246, 0.5)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <motion.div
                        className="text-white text-2xl"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        👀
                      </motion.div>
                      
                      {/* Pulsing ring */}
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-blue-400"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.8, 0, 0.8]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-white text-lg font-medium mb-6"
                    >
                      Scout's Discovery
                    </motion.div>
                  </motion.div>
                  
                  {!showVisualDemo ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" }}
                      className="text-center"
                    >
                      <motion.button
                        onClick={() => {
                          setIsInteracting(true);
                          setTimeout(() => setShowVisualDemo(true), 600);
                        }}
                        whileHover={{ 
                          scale: 1.1,
                          rotateY: 5,
                          boxShadow: "0 20px 40px rgba(255, 255, 255, 0.2)"
                        }}
                        whileTap={{ scale: 0.9 }}
                        className="w-40 h-40 bg-gradient-to-b from-white/30 to-white/20 hover:from-white/40 hover:to-white/30 rounded-full flex items-center justify-center border-2 border-white/30 hover:border-white/50 transition-all duration-300 relative overflow-hidden group"
                        data-testid="show-demo"
                      >
                        {/* Animated play button */}
                        <motion.div
                          className="text-white text-4xl relative z-10"
                          animate={{
                            scale: isInteracting ? [1, 1.5, 0] : [1, 1.1, 1]
                          }}
                          transition={{
                            duration: isInteracting ? 0.6 : 2,
                            repeat: isInteracting ? 0 : Infinity
                          }}
                        >
                          ▶
                        </motion.div>
                        
                        {/* Ripple effect */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-white/50"
                          animate={{
                            scale: [1, 1.5],
                            opacity: [0.5, 0]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeOut"
                          }}
                        />
                        
                        {/* Inner glow */}
                        <motion.div
                          className="absolute inset-4 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-400/20"
                          animate={{
                            opacity: [0.3, 0.7, 0.3]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.button>
                    </motion.div>
                  ) : (
                <div className="space-y-6">
                  <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
                    <div className="flex items-start gap-4 mb-4">
                      <ScoutSpeechButton 
                        text={scoutMessage || (teachContent?.content) || "Here's what I discovered on my adventure!"}
                        autoSpeak={true}
                      />
                    </div>
                    <div className="text-white text-lg leading-relaxed">
                      {scoutMessage || (teachContent?.content) || "Here's what I discovered on my adventure!"}
                    </div>
                  </div>
                  
                  {/* Interactive Visual Element */}
                  <div className="bg-gradient-to-b from-white/20 to-white/10 rounded-2xl p-8 border-2 border-white/20">
                    <div className="text-center space-y-4">
                      <div className="text-white/80 text-base">Try exploring this:</div>
                      {/* Generate exploration options based on content */}
                      {(() => {
                        const getExplorationOptions = () => {
                          const message = scoutMessage || (teachContent?.content) || "";
                          const topicName = content.title || "";
                          
                          // Mathematics exploration options
                          if (topicName.toLowerCase().includes('count') || topicName.toLowerCase().includes('number') || message.toLowerCase().includes('count')) {
                            return [
                              { icon: '🔢', label: 'Count Objects', color: 'from-green-400/40 to-green-500/40', border: 'border-green-400/60' },
                              { icon: '👆', label: 'Point & Count', color: 'from-blue-400/40 to-blue-500/40', border: 'border-blue-400/60' }
                            ];
                          }
                          
                          if (topicName.toLowerCase().includes('shape') || topicName.toLowerCase().includes('color') || message.toLowerCase().includes('shape')) {
                            return [
                              { icon: '🔴', label: 'Find Shapes', color: 'from-red-400/40 to-red-500/40', border: 'border-red-400/60' },
                              { icon: '🎨', label: 'Match Colors', color: 'from-purple-400/40 to-purple-500/40', border: 'border-purple-400/60' }
                            ];
                          }
                          
                          // Science exploration options
                          if (message.toLowerCase().includes('animal') || message.toLowerCase().includes('nature') || topicName.toLowerCase().includes('animal')) {
                            return [
                              { icon: '🐾', label: 'Animal Sounds', color: 'from-green-400/40 to-green-500/40', border: 'border-green-400/60' },
                              { icon: '🌿', label: 'Where They Live', color: 'from-emerald-400/40 to-emerald-500/40', border: 'border-emerald-400/60' }
                            ];
                          }
                          
                          // Literacy exploration options  
                          if (message.toLowerCase().includes('letter') || message.toLowerCase().includes('read') || topicName.toLowerCase().includes('letter')) {
                            return [
                              { icon: '🔤', label: 'Letter Hunt', color: 'from-blue-400/40 to-blue-500/40', border: 'border-blue-400/60' },
                              { icon: '📖', label: 'Sound It Out', color: 'from-indigo-400/40 to-indigo-500/40', border: 'border-indigo-400/60' }
                            ];
                          }
                          
                          // Default exploration options
                          return [
                            { icon: '🔍', label: 'Explore More', color: 'from-orange-400/40 to-orange-500/40', border: 'border-orange-400/60' },
                            { icon: '🤔', label: 'Think About It', color: 'from-purple-400/40 to-purple-500/40', border: 'border-purple-400/60' }
                          ];
                        };
                        
                        const options = getExplorationOptions();
                        
                        return (
                          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                            {options.map((option, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  // Show encouraging feedback when exploration option is clicked
                                  const feedback = ["Great exploring!", "Nice discovery!", "You're so curious!", "Keep investigating!"];
                                  alert(feedback[Math.floor(Math.random() * feedback.length)]);
                                }}
                                className={`aspect-square bg-gradient-to-br ${option.color} rounded-2xl border-2 ${option.border} flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-all p-2`}
                                data-testid={`exploration-${index}`}
                              >
                                <div className="text-white text-2xl mb-1">{option.icon}</div>
                                <div className="text-white text-xs font-medium text-center leading-tight">{option.label}</div>
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={() => setTeachingStep('ready')}
                      className="px-6 py-3 bg-gradient-to-r from-purple-400 to-blue-400 text-white font-medium rounded-2xl hover:scale-105 transition-all"
                      data-testid="got-it"
                    >
                      I get it!
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Ready Check */}
        {teachingStep === 'ready' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="floating-ui rounded-3xl p-8"
            data-testid="ready-check"
          >
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center">
                <div className="text-white text-2xl">🤝</div>
              </div>
              
              <div className="text-white text-lg font-medium">
                Ready to try this together?
              </div>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleUnderstandingCheck("confused")}
                  className={`w-20 h-20 rounded-full transition-all border-2 flex items-center justify-center ${
                    understandingLevel === "confused" ? 'bg-orange-400/30 border-orange-400 scale-110' : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40'
                  }`}
                  data-testid="need-help"
                >
                  <div className="text-white text-2xl">?</div>
                </button>
                <button
                  onClick={() => handleUnderstandingCheck("clear")}
                  className={`w-20 h-20 rounded-full transition-all border-2 flex items-center justify-center ${
                    understandingLevel === "clear" ? 'bg-green-400/30 border-green-400 scale-110' : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40'
                  }`}
                  data-testid="ready-to-try"
                >
                  <div className="text-white text-2xl">✓</div>
                </button>
              </div>
              
              {understandingLevel && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handlePhaseComplete}
                  className="px-8 py-4 bg-gradient-to-r from-warm-orange to-sunset-orange text-white text-lg font-medium rounded-2xl hover:scale-105 transition-all"
                  data-testid="lets-try-together"
                >
                  Let's try together!
                </motion.button>
              )}
            </div>
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

      {/* Scout Think-Aloud Section - only show for legacy format */}
      {!isScoutFormat && (
      <div className="floating-ui rounded-2xl p-8" data-testid="scout-think-aloud">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-xl font-semibold text-white">
            Scout's Think-Aloud: {teachContent.scoutThinkAloud?.concept || "Learning Together"}
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
      )}

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
      {(currentStep >= steps.length - 1 || showWorkedExample) && teachContent.keyTakeaways && (
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
            {teachContent.keyTakeaways?.map((takeaway, index) => (
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