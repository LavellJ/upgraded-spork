import { useState } from "react";
import { motion } from "framer-motion";
import type { CurriculumTopic } from "@/lib/curriculum";

interface SkillTreeNodeProps {
  topic: CurriculumTopic;
  progress?: {
    questionsAnswered: number;
    correctAnswers: number;
    isCompleted: boolean;
  };
  position: { x: number; y: number };
  isUnlocked: boolean;
  onClick?: () => void;
  delay?: number;
}

export function SkillTreeNode({ 
  topic, 
  progress, 
  position, 
  isUnlocked, 
  onClick, 
  delay = 0 
}: SkillTreeNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const getNodeState = () => {
    if (!isUnlocked) return "locked";
    if (progress?.isCompleted) return "completed";
    if (progress && progress.questionsAnswered > 0) return "in-progress";
    return "unlocked";
  };

  const getNodeColors = () => {
    const state = getNodeState();
    switch (state) {
      case "locked":
        return {
          bg: "bg-white/10",
          border: "border-white/20",
          text: "text-white/40",
          glow: "shadow-none"
        };
      case "unlocked":
        return {
          bg: "bg-accent-teal/20",
          border: "border-accent-teal/40",
          text: "text-accent-teal",
          glow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        };
      case "in-progress":
        return {
          bg: "bg-gradient-to-br from-warm-orange/20 to-sunset-orange/20",
          border: "border-warm-orange/60",
          text: "text-warm-orange",
          glow: "shadow-[0_0_25px_rgba(251,146,60,0.4)]"
        };
      case "completed":
        return {
          bg: "bg-gradient-to-br from-success-green/20 to-emerald-400/20",
          border: "border-success-green/60",
          text: "text-success-green",
          glow: "shadow-[0_0_30px_rgba(34,197,94,0.5)]"
        };
      default:
        return {
          bg: "bg-white/10",
          border: "border-white/20",
          text: "text-white/40",
          glow: "shadow-none"
        };
    }
  };

  const getSubjectIcon = () => {
    switch (topic.subject) {
      case "mathematics":
        return "📊";
      case "literacy":
        return "📚";
      case "science":
        return "🔬";
      case "social-studies":
        return "🌏";
      default:
        return "📖";
    }
  };

  const getProgressPercentage = () => {
    if (!progress || progress.questionsAnswered === 0) return 0;
    return Math.round((progress.correctAnswers / progress.questionsAnswered) * 100);
  };

  const colors = getNodeColors();
  const state = getNodeState();

  return (
    <motion.div
      className="absolute"
      style={{ left: position.x, top: position.y }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        delay: delay,
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
      whileTap={{ scale: isUnlocked ? 0.95 : 1 }}
      data-testid={`skill-node-${topic.id}`}
    >
      <div
        className={`relative w-20 h-20 rounded-xl border-2 ${colors.bg} ${colors.border} ${colors.glow} 
          backdrop-blur-sm cursor-pointer transition-all duration-300 
          ${isUnlocked ? 'hover:scale-105' : 'cursor-not-allowed'}`}
        onClick={isUnlocked ? onClick : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Lock overlay for locked topics */}
        {state === "locked" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
            <i className="fas fa-lock text-white/60 text-lg"></i>
          </div>
        )}

        {/* Subject icon */}
        <div className="absolute top-1 left-1 text-lg">
          {getSubjectIcon()}
        </div>

        {/* Level indicator */}
        <div className={`absolute top-1 right-1 text-xs font-bold ${colors.text}`}>
          {topic.level}
        </div>

        {/* Completion check for completed topics */}
        {state === "completed" && (
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 bg-success-green rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.5, type: "spring" }}
          >
            <i className="fas fa-check text-white text-xs"></i>
          </motion.div>
        )}

        {/* Progress ring for in-progress topics */}
        {state === "in-progress" && (
          <div className="absolute inset-0 rounded-xl">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(251,146,60,0.2)"
                strokeWidth="3"
                fill="none"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgb(251,146,60)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                animate={{ 
                  strokeDashoffset: 2 * Math.PI * 45 * (1 - getProgressPercentage() / 100)
                }}
                transition={{ delay: delay + 0.3, duration: 1 }}
              />
            </svg>
          </div>
        )}

        {/* Glowing effect for unlocked/active topics */}
        {(state === "unlocked" || state === "in-progress") && (
          <motion.div
            className={`absolute inset-0 rounded-xl ${colors.bg} opacity-50`}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Topic name tooltip */}
        {isHovered && isUnlocked && (
          <motion.div
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
              bg-black/90 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap backdrop-blur-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            data-testid={`tooltip-${topic.id}`}
          >
            {topic.name}
            {progress && (
              <div className="text-xs opacity-75 mt-1">
                {getProgressPercentage()}% complete
              </div>
            )}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 
              border-4 border-transparent border-t-black/90"></div>
          </motion.div>
        )}
      </div>

      {/* Connection point for tree lines */}
      <div className="absolute top-1/2 left-1/2 w-2 h-2 transform -translate-x-1/2 -translate-y-1/2 
        rounded-full bg-white/20 pointer-events-none"></div>
    </motion.div>
  );
}