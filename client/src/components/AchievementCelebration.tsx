import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Sparkles, Award, Target, Zap, Heart, Crown, Medal, Gift } from "lucide-react";
import { StarIcon, TrophyIcon, SparkleIcon } from "@/components/GeometricIcons";

interface Achievement {
  id: string;
  type: "badge" | "milestone" | "streak" | "mastery" | "discovery" | "special";
  title: string;
  description: string;
  icon: React.ReactNode;
  reward?: {
    type: "badge" | "points" | "unlock" | "title";
    value: string | number;
  };
  rarity: "common" | "rare" | "epic" | "legendary";
  animated?: boolean;
}

interface AchievementCelebrationProps {
  achievement: Achievement | null;
  onClose: () => void;
  children?: React.ReactNode;
}

// Confetti particle component
const ConfettiParticle = ({ delay = 0, color = "#FFD700" }) => (
  <motion.div
    initial={{ 
      opacity: 0, 
      y: -20, 
      x: Math.random() * 100 - 50,
      rotate: 0,
      scale: 0 
    }}
    animate={{ 
      opacity: [0, 1, 1, 0], 
      y: [0, 150, 300],
      x: Math.random() * 200 - 100,
      rotate: 360,
      scale: [0, 1, 0.5, 0]
    }}
    transition={{ 
      duration: 3, 
      delay: delay / 1000,
      ease: "easeOut"
    }}
    className={`absolute w-3 h-3 rounded-sm`}
    style={{ backgroundColor: color }}
  />
);

// Sparkle component
const Sparkle = ({ delay = 0, size = "small" }) => {
  const sizeClass = size === "large" ? "w-4 h-4" : size === "medium" ? "w-3 h-3" : "w-2 h-2";
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0], 
        scale: [0, 1.5, 1, 0],
        rotate: [0, 180, 360]
      }}
      transition={{ 
        duration: 2, 
        delay: delay / 1000,
        ease: "easeInOut"
      }}
      className={`absolute ${sizeClass} pointer-events-none`}
    >
      <Sparkles className="w-full h-full text-yellow-300" />
    </motion.div>
  );
};

// Achievement type icons
const getAchievementIcon = (type: Achievement["type"], rarity: Achievement["rarity"]) => {
  const iconClass = `w-12 h-12 ${
    rarity === "legendary" ? "text-purple-400" :
    rarity === "epic" ? "text-orange-400" :
    rarity === "rare" ? "text-blue-400" :
    "text-green-400"
  }`;

  switch (type) {
    case "badge": return <Medal className={iconClass} />;
    case "milestone": return <Target className={iconClass} />;
    case "streak": return <Zap className={iconClass} />;
    case "mastery": return <Crown className={iconClass} />;
    case "discovery": return <Star className={iconClass} />;
    case "special": return <Gift className={iconClass} />;
    default: return <Trophy className={iconClass} />;
  }
};

// Rarity colors and effects
const getRarityStyles = (rarity: Achievement["rarity"]) => {
  switch (rarity) {
    case "legendary":
      return {
        borderGradient: "from-purple-500 via-pink-500 to-purple-500",
        bgGradient: "from-purple-900/40 via-pink-900/30 to-purple-900/40",
        glowColor: "purple-500",
        textColor: "text-purple-200"
      };
    case "epic":
      return {
        borderGradient: "from-orange-500 via-yellow-500 to-orange-500",
        bgGradient: "from-orange-900/40 via-yellow-900/30 to-orange-900/40",
        glowColor: "orange-500",
        textColor: "text-orange-200"
      };
    case "rare":
      return {
        borderGradient: "from-blue-500 via-cyan-500 to-blue-500",
        bgGradient: "from-blue-900/40 via-cyan-900/30 to-blue-900/40",
        glowColor: "blue-500",
        textColor: "text-blue-200"
      };
    default:
      return {
        borderGradient: "from-green-500 via-emerald-500 to-green-500",
        bgGradient: "from-green-900/40 via-emerald-900/30 to-green-900/40",
        glowColor: "green-500",
        textColor: "text-green-200"
      };
  }
};

export function AchievementCelebration({ achievement, onClose }: AchievementCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiCount, setConfettiCount] = useState(0);

  useEffect(() => {
    if (achievement) {
      setShowConfetti(true);
      // More confetti for rarer achievements
      const count = achievement.rarity === "legendary" ? 50 : 
                   achievement.rarity === "epic" ? 35 : 
                   achievement.rarity === "rare" ? 25 : 15;
      setConfettiCount(count);

      // Auto-close after delay (longer for rarer achievements)
      const autoCloseDelay = achievement.rarity === "legendary" ? 8000 : 
                            achievement.rarity === "epic" ? 6000 : 
                            achievement.rarity === "rare" ? 5000 : 4000;
      
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  const rarityStyles = getRarityStyles(achievement.rarity);
  const confettiColors = [
    "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", 
    "#96CEB4", "#FCEA2B", "#FF9FF3", "#54A0FF"
  ];

  return (
    <AnimatePresence>
      {achievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Confetti particles */}
          {showConfetti && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(confettiCount)].map((_, i) => (
                <ConfettiParticle
                  key={i}
                  delay={i * 50}
                  color={confettiColors[i % confettiColors.length]}
                />
              ))}
            </div>
          )}

          {/* Sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <Sparkle
                key={i}
                delay={i * 100}
                size={i % 3 === 0 ? "large" : i % 2 === 0 ? "medium" : "small"}
              />
            ))}
          </div>

          {/* Achievement card */}
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 180, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 150, 
              damping: 10,
              duration: 0.6
            }}
            className="relative max-w-md w-full"
          >
            <Card className={`
              relative overflow-hidden border-4 border-transparent
              bg-gradient-to-br ${rarityStyles.bgGradient}
              backdrop-blur-sm shadow-2xl
            `}>
              {/* Animated border */}
              <div className={`
                absolute inset-0 rounded-lg bg-gradient-to-r ${rarityStyles.borderGradient}
                opacity-75 animate-pulse-soft
              `} style={{ margin: '-2px' }} />
              
              {/* Glow effect */}
              <div className={`
                absolute inset-0 rounded-lg bg-${rarityStyles.glowColor}/20 
                blur-xl scale-110 animate-pulse-soft
              `} />

              <div className="relative bg-gray-900/60 backdrop-blur-sm rounded-lg">
                <CardHeader className="text-center pb-4">
                  {/* Achievement type badge */}
                  <div className="flex justify-center mb-4">
                    <Badge 
                      className={`
                        ${rarityStyles.textColor} bg-white/10 backdrop-blur-sm
                        border border-white/20 px-3 py-1 text-xs font-bold
                        ${achievement.rarity === "legendary" ? "animate-pulse" : ""}
                      `}
                    >
                      {achievement.rarity.toUpperCase()} {achievement.type.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Achievement icon */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: achievement.rarity === "legendary" ? [0, 360] : 0
                    }}
                    transition={{ 
                      duration: achievement.rarity === "legendary" ? 2 : 1.5, 
                      repeat: Infinity 
                    }}
                    className="flex justify-center mb-4"
                  >
                    <div className="relative">
                      {getAchievementIcon(achievement.type, achievement.rarity)}
                      
                      {/* Icon sparkles */}
                      <div className="absolute -top-2 -right-2">
                        <motion.div
                          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Sparkles className="w-4 h-4 text-yellow-300" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Achievement title */}
                  <CardTitle className={`text-2xl font-bold ${rarityStyles.textColor} mb-2`}>
                    {achievement.title}
                  </CardTitle>

                  {/* Emoji decoration */}
                  <div className="text-4xl mb-2">
                    {achievement.icon}
                  </div>
                </CardHeader>

                <CardContent className="text-center space-y-4">
                  {/* Description */}
                  <p className="text-white/80 text-lg leading-relaxed">
                    {achievement.description}
                  </p>

                  {/* Reward section */}
                  {achievement.reward && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <h4 className="text-white font-semibold mb-2 flex items-center justify-center gap-2">
                        <Gift className="w-4 h-4" />
                        Reward Unlocked!
                      </h4>
                      <div className="flex items-center justify-center gap-2">
                        {achievement.reward.type === "badge" && <Medal className="w-5 h-5 text-yellow-400" />}
                        {achievement.reward.type === "points" && <Star className="w-5 h-5 text-blue-400" />}
                        {achievement.reward.type === "unlock" && <Award className="w-5 h-5 text-purple-400" />}
                        {achievement.reward.type === "title" && <Crown className="w-5 h-5 text-orange-400" />}
                        <span className="text-white/90 font-medium">
                          {achievement.reward.value}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 justify-center pt-4">
                    <Button
                      onClick={onClose}
                      className={`
                        bg-gradient-to-r ${rarityStyles.borderGradient} 
                        text-white font-semibold px-6 py-2
                        hover:scale-105 transition-all duration-300
                        shadow-lg hover:shadow-xl
                      `}
                      data-testid="button-close-achievement"
                    >
                      <div className="flex items-center gap-2">
                        Awesome! <SparkleIcon size={20} className="text-yellow-300" />
                      </div>
                    </Button>
                  </div>

                  {/* Share encouragement */}
                  <p className="text-white/60 text-sm">
                    <div className="flex items-center gap-2">
                      Keep exploring to unlock more achievements!
                      <StarIcon size={20} className="text-yellow-300" />
                    </div>
                  </p>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Hook for triggering achievements
export function useAchievementTrigger() {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

  const triggerAchievement = (achievement: Achievement) => {
    setCurrentAchievement(achievement);
  };

  const closeAchievement = () => {
    setCurrentAchievement(null);
  };

  return {
    currentAchievement,
    triggerAchievement,
    closeAchievement
  };
}

// Pre-defined achievement templates
export const ACHIEVEMENT_TEMPLATES = {
  firstQuestion: {
    id: "first-question",
    type: "milestone" as const,
    title: "First Steps!",
    description: "You answered your very first question! Every expert was once a beginner.",
    icon: <StarIcon size={24} />,
    rarity: "common" as const,
    reward: { type: "points" as const, value: 10 }
  },
  
  perfectScore: {
    id: "perfect-score",
    type: "mastery" as const,
    title: "Perfect Explorer!",
    description: "You got every question right in this topic! Absolutely brilliant!",
    icon: <TrophyIcon size={24} />,
    rarity: "epic" as const,
    reward: { type: "badge" as const, value: "Perfect Score Master" }
  },
  
  fiveStreak: {
    id: "five-streak",
    type: "streak" as const,
    title: "On Fire!",
    description: "Five correct answers in a row! You're unstoppable!",
    icon: <SparkleIcon size={24} />,
    rarity: "rare" as const,
    reward: { type: "points" as const, value: 50 }
  },
  
  firstTopic: {
    id: "first-topic-complete",
    type: "milestone" as const,
    title: "Topic Master!",
    description: "You completed your first topic! Ready for the next adventure?",
    icon: <StarIcon size={24} />,
    rarity: "rare" as const,
    reward: { type: "unlock" as const, value: "New Learning Path" }
  },
  
  tenTopics: {
    id: "ten-topics",
    type: "mastery" as const,
    title: "Learning Legend!",
    description: "Ten topics mastered! You're becoming a true scholar!",
    icon: <TrophyIcon size={24} />,
    rarity: "legendary" as const,
    reward: { type: "title" as const, value: "Learning Legend" }
  },
  
  curious: {
    id: "curious-mind",
    type: "discovery" as const,
    title: "Curious Mind!",
    description: "You explored 5 different subjects! Your curiosity knows no bounds!",
    icon: <StarIcon size={24} />,
    rarity: "rare" as const,
    reward: { type: "badge" as const, value: "Curious Explorer" }
  }
} as const;