import { useQuery } from "@tanstack/react-query";
import type { Achievement } from "@shared/schema";

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "milestone" | "streak" | "time" | "mastery";
  rarity: "common" | "rare" | "epic";
  ageGroups: ("pre-primary" | "primary" | "upper-primary")[];
}

interface AchievementWithBadge extends Achievement {
  badge: BadgeDefinition;
}

interface BadgeDisplayProps {
  studentId: string;
  ageGroup: string;
  compact?: boolean;
}

export function BadgeDisplay({ studentId, ageGroup, compact = false }: BadgeDisplayProps) {
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<AchievementWithBadge[]>({
    queryKey: [`/api/achievements/${studentId}`],
    enabled: !!studentId,
  });

  const { data: availableBadges = [], isLoading: badgesLoading } = useQuery<BadgeDefinition[]>({
    queryKey: [`/api/badges?ageGroup=${ageGroup}`],
    enabled: !!ageGroup,
  });

  if (achievementsLoading || badgesLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-white/10 rounded w-24 mb-4"></div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/10 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const earnedBadgeIds = new Set(achievements.map(a => a.badgeId));
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "from-blue-400/20 to-blue-600/20 border-blue-400/30";
      case "rare": return "from-purple-400/20 to-purple-600/20 border-purple-400/30";
      case "epic": return "from-yellow-400/20 to-orange-500/20 border-yellow-400/30";
      default: return "from-gray-400/20 to-gray-600/20 border-gray-400/30";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "milestone": return "🎯";
      case "streak": return "🔥";
      case "time": return "⏰";
      case "mastery": return "⚡";
      default: return "⭐";
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <h3 className="text-white/80 font-medium text-sm" data-testid="text-recent-badges">
          Recent Badges
        </h3>
        <div className="flex gap-2">
          {achievements.slice(0, 3).map((achievement) => (
            <div
              key={achievement.id}
              className={`bg-gradient-to-br ${getRarityColor(achievement.badge.rarity)} 
                         backdrop-blur-sm rounded-xl p-3 border transition-transform hover:scale-105`}
              data-testid={`badge-compact-${achievement.badge.id}`}
            >
              <div className="text-2xl mb-1">{achievement.badge.icon}</div>
              <div className="text-xs font-medium text-white/90">{achievement.badge.name}</div>
            </div>
          ))}
          {achievements.length === 0 && (
            <div className="text-white/60 text-sm italic" data-testid="text-no-badges">
              Earn your first badge by completing questions!
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      <div>
        <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2" data-testid="text-earned-badges">
          🏆 Your Badges ({achievements.length})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`bg-gradient-to-br ${getRarityColor(achievement.badge.rarity)} 
                         backdrop-blur-sm rounded-xl p-4 border transition-all hover:scale-105 hover:shadow-lg`}
              data-testid={`badge-earned-${achievement.badge.id}`}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{achievement.badge.icon}</div>
                <h4 className="font-semibold text-white mb-1">{achievement.badge.name}</h4>
                <p className="text-xs text-white/70 mb-2">{achievement.badge.description}</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs">{getCategoryIcon(achievement.badge.category)}</span>
                  <span className="text-xs text-white/60 capitalize">{achievement.badge.rarity}</span>
                </div>
                <div className="text-xs text-white/50 mt-1">
                  {achievement.earnedAt ? new Date(achievement.earnedAt).toLocaleDateString() : "Recent"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Badges */}
      <div>
        <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2" data-testid="text-available-badges">
          ✨ Available Badges
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {availableBadges
            .filter(badge => !earnedBadgeIds.has(badge.id))
            .slice(0, 8) // Show first 8 unearned badges
            .map((badge) => (
              <div
                key={badge.id}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 
                         transition-all hover:bg-white/10 opacity-60 hover:opacity-80"
                data-testid={`badge-available-${badge.id}`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2 grayscale">{badge.icon}</div>
                  <h4 className="font-semibold text-white/70 mb-1">{badge.name}</h4>
                  <p className="text-xs text-white/50 mb-2">{badge.description}</p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs">{getCategoryIcon(badge.category)}</span>
                    <span className="text-xs text-white/40 capitalize">{badge.rarity}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}