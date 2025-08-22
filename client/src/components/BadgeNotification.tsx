import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "milestone" | "streak" | "time" | "mastery";
  rarity: "common" | "rare" | "epic";
}

interface BadgeNotificationProps {
  badges: Array<{
    badgeId: string;
    metadata?: {
      badgeName: string;
      category: string;
      rarity: string;
    };
  }>;
  onClose: () => void;
}

export function BadgeNotification({ badges, onClose }: BadgeNotificationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (badges.length === 0) {
      onClose();
      return;
    }

    const timer = setTimeout(() => {
      if (currentIndex < badges.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsVisible(false);
        setTimeout(onClose, 500);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentIndex, badges.length, onClose]);

  if (badges.length === 0 || !isVisible) return null;

  const currentBadge = badges[currentIndex];
  const metadata = currentBadge.metadata;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "from-blue-400 to-blue-600";
      case "rare": return "from-purple-400 to-purple-600";  
      case "epic": return "from-yellow-400 to-orange-500";
      default: return "from-gray-400 to-gray-600";
    }
  };

  const getBadgeIcon = (badgeId: string) => {
    // Simple mapping based on common badge IDs
    const iconMap: Record<string, string> = {
      "first_steps": "👣",
      "daily_learner": "📚",
      "focus_master": "🎯",
      "knowledge_seeker": "🔍",
      "topic_champion": "🏆",
      "perfect_week": "⭐",
      "genius_streak": "🧠",
      "dedication_master": "💎",
    };
    return iconMap[badgeId] || "🌟";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.8 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        data-testid="badge-notification"
      >
        <div className={`bg-gradient-to-r ${getRarityColor(metadata?.rarity || "common")} 
                        rounded-2xl p-6 shadow-2xl text-white min-w-80 max-w-md mx-4`}>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
              className="text-6xl mb-3"
              data-testid={`badge-icon-${currentBadge.badgeId}`}
            >
              {getBadgeIcon(currentBadge.badgeId)}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-lg font-bold mb-1" data-testid="badge-notification-title">
                🎉 Badge Earned!
              </h3>
              <h4 className="text-xl font-semibold mb-2" data-testid={`badge-name-${currentBadge.badgeId}`}>
                {metadata?.badgeName || "Achievement Unlocked"}
              </h4>
              <div className="flex items-center justify-center gap-2 text-sm opacity-90">
                <span className="capitalize">{metadata?.rarity || "common"}</span>
                <span>•</span>
                <span className="capitalize">{metadata?.category || "achievement"}</span>
              </div>
            </motion.div>
          </div>

          {/* Progress indicator */}
          {badges.length > 1 && (
            <div className="flex justify-center gap-1 mt-4">
              {badges.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}