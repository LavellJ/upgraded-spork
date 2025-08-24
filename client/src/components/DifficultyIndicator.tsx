import { motion, AnimatePresence } from "framer-motion";

interface DifficultyIndicatorProps {
  currentDifficulty: number;
  maxDifficulty?: number;
  showAnimation?: boolean;
  ageGroup?: "pre-primary" | "primary" | "upper-primary";
}

export function DifficultyIndicator({ 
  currentDifficulty, 
  maxDifficulty = 5, 
  showAnimation = false,
  ageGroup = "primary" 
}: DifficultyIndicatorProps) {
  const getAgeAppropriateMaxDifficulty = () => {
    switch (ageGroup) {
      case "pre-primary": return 3;
      case "primary": return 4;
      case "upper-primary": return 5;
      default: return 5;
    }
  };

  const actualMaxDifficulty = Math.min(maxDifficulty, getAgeAppropriateMaxDifficulty());
  
  const getDifficultyColor = (level: number) => {
    if (level <= 1) return "from-emerald-400 to-emerald-500";
    if (level <= 2) return "from-blue-400 to-blue-500";
    if (level <= 3) return "from-amber-400 to-amber-500";
    if (level <= 4) return "from-orange-400 to-orange-500";
    return "from-red-400 to-red-500";
  };

  const getDifficultyLabel = () => {
    switch (ageGroup) {
      case "pre-primary":
        return ["Easy Peasy", "Getting Better", "Super Star"][currentDifficulty - 1] || "Super Star";
      case "primary":
        return ["Beginner", "Learning", "Getting Good", "Really Good"][currentDifficulty - 1] || "Really Good";
      case "upper-primary":
        return ["Foundation", "Developing", "Proficient", "Advanced", "Expert"][currentDifficulty - 1] || "Expert";
      default:
        return `Level ${currentDifficulty}`;
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {[...Array(actualMaxDifficulty)].map((_, index) => {
          const level = index + 1;
          const isActive = level <= currentDifficulty;
          
          return (
            <motion.div
              key={level}
              className={`w-3 h-3 rounded-full ${
                isActive 
                  ? `bg-gradient-to-r ${getDifficultyColor(currentDifficulty)} shadow-lg` 
                  : "bg-white/20"
              }`}
              initial={{ scale: 0.8, opacity: 0.7 }}
              animate={{ 
                scale: showAnimation && isActive ? [0.8, 1.2, 1] : 1,
                opacity: isActive ? 1 : 0.3
              }}
              transition={{ 
                duration: showAnimation ? 0.6 : 0.2,
                delay: showAnimation ? index * 0.1 : 0
              }}
            />
          );
        })}
      </div>
      
      <AnimatePresence>
        {showAnimation && (
          <motion.span
            className="text-xs text-white/80 font-medium"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ delay: 0.3 }}
          >
            {getDifficultyLabel()}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DifficultyFeedbackProps {
  feedback: {
    newDifficulty?: number;
    reasoning?: string;
    encouragement?: string;
    learningInsights?: string[];
    suggestedFocus?: string;
  };
  show: boolean;
  ageGroup?: "pre-primary" | "primary" | "upper-primary";
  onClose?: () => void;
}

export function DifficultyFeedback({ 
  feedback, 
  show, 
  ageGroup = "primary",
  onClose 
}: DifficultyFeedbackProps) {
  if (!show || !feedback.newDifficulty) return null;

  const getDifficultyChangeIcon = (newDifficulty: number, assumedOldDifficulty: number = 3) => {
    if (newDifficulty > assumedOldDifficulty) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </div>
      );
    } else if (newDifficulty < assumedOldDifficulty) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
          </svg>
        </div>
      );
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed top-4 right-4 max-w-sm bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl z-50"
          initial={{ opacity: 0, y: -50, x: 50 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -50, x: 50 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex items-start space-x-3">
            {getDifficultyChangeIcon(feedback.newDifficulty)}
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium text-sm">AI Tutor</h3>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                {feedback.encouragement && (
                  <p className="text-white/90 text-sm leading-relaxed">
                    {feedback.encouragement}
                  </p>
                )}
                
                <DifficultyIndicator
                  currentDifficulty={feedback.newDifficulty}
                  showAnimation={true}
                  ageGroup={ageGroup}
                />
                
                {feedback.learningInsights && feedback.learningInsights.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {feedback.learningInsights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-1 h-1 rounded-full bg-accent-teal mt-2"></div>
                        <span className="text-white/70 text-xs">{insight}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {feedback.suggestedFocus && (
                  <div className="mt-3 p-2 bg-accent-teal/20 rounded-lg">
                    <span className="text-accent-teal text-xs font-medium">Focus: </span>
                    <span className="text-white/80 text-xs">{feedback.suggestedFocus}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}