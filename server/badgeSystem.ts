import { type Achievement, type InsertAchievement } from "@shared/schema";
import { storage } from "./storage.js";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "milestone" | "streak" | "time" | "mastery";
  rarity: "common" | "rare" | "epic";
  ageGroups: ("pre-primary" | "primary" | "upper-primary")[];
  requirements: {
    type: "questions_answered" | "correct_answers" | "topics_completed" | 
          "daily_streak" | "pomodoro_sessions" | "perfect_score" | "study_time";
    value: number;
    timeframe?: "daily" | "weekly" | "total";
  };
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Common badges (weekly achievable)
  {
    id: "first_steps",
    name: "First Steps",
    description: "Answered your first 10 questions",
    icon: "👣",
    category: "milestone",
    rarity: "common",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "questions_answered", value: 10, timeframe: "total" }
  },
  {
    id: "daily_learner",
    name: "Daily Learner", 
    description: "Completed a learning session for 3 days in a row",
    icon: "📚",
    category: "streak",
    rarity: "common",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "daily_streak", value: 3, timeframe: "daily" }
  },
  {
    id: "focus_master",
    name: "Focus Master",
    description: "Completed 5 Pomodoro focus sessions",
    icon: "🎯",
    category: "time",
    rarity: "common",
    ageGroups: ["primary", "upper-primary"],
    requirements: { type: "pomodoro_sessions", value: 5, timeframe: "weekly" }
  },

  // Rare badges (bi-weekly achievable)
  {
    id: "knowledge_seeker",
    name: "Knowledge Seeker",
    description: "Answered 50 questions correctly",
    icon: "🔍",
    category: "mastery",
    rarity: "rare",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "correct_answers", value: 50, timeframe: "total" }
  },
  {
    id: "topic_champion",
    name: "Topic Champion",
    description: "Completed 3 topics with 80% accuracy",
    icon: "🏆",
    category: "mastery",
    rarity: "rare",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "topics_completed", value: 3, timeframe: "total" }
  },
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Learned something every day for a week",
    icon: "⭐",
    category: "streak",
    rarity: "rare",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "daily_streak", value: 7, timeframe: "daily" }
  },

  // Epic badges (monthly achievable)
  {
    id: "genius_streak",
    name: "Genius Streak",
    description: "Answered 15 questions correctly in a row",
    icon: "🧠",
    category: "mastery", 
    rarity: "epic",
    ageGroups: ["primary", "upper-primary"],
    requirements: { type: "perfect_score", value: 15, timeframe: "total" }
  },
  {
    id: "dedication_master",
    name: "Dedication Master",
    description: "Learned for 21 days straight",
    icon: "💎",
    category: "streak",
    rarity: "epic",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "daily_streak", value: 21, timeframe: "daily" }
  },
];

export class BadgeSystem {
  async checkAndAwardBadges(studentId: string, ageGroup: string): Promise<Achievement[]> {
    const newlyEarnedBadges: Achievement[] = [];
    const availableBadges = BADGE_DEFINITIONS.filter(badge => 
      badge.ageGroups.includes(ageGroup as any)
    );

    for (const badgeDefinition of availableBadges) {
      const hasEarned = await storage.hasAchievement(studentId, badgeDefinition.id);
      
      if (!hasEarned && await this.checkBadgeRequirements(studentId, badgeDefinition)) {
        const achievement = await storage.createAchievement({
          studentId,
          badgeId: badgeDefinition.id,
          metadata: {
            badgeName: badgeDefinition.name,
            category: badgeDefinition.category,
            rarity: badgeDefinition.rarity
          }
        });
        newlyEarnedBadges.push(achievement);
      }
    }

    return newlyEarnedBadges;
  }

  private async checkBadgeRequirements(studentId: string, badge: BadgeDefinition): Promise<boolean> {
    const { requirements } = badge;
    
    switch (requirements.type) {
      case "questions_answered": {
        const progress = await storage.getProgressByStudent(studentId);
        const totalQuestions = progress.reduce((sum, p) => sum + (p.questionsAnswered || 0), 0);
        return totalQuestions >= requirements.value;
      }

      case "correct_answers": {
        const progress = await storage.getProgressByStudent(studentId);
        const totalCorrect = progress.reduce((sum, p) => sum + (p.correctAnswers || 0), 0);
        return totalCorrect >= requirements.value;
      }

      case "topics_completed": {
        const progress = await storage.getProgressByStudent(studentId);
        const completedTopics = progress.filter(p => (p.completionPercentage || 0) >= 80).length;
        return completedTopics >= requirements.value;
      }

      case "daily_streak": {
        const progress = await storage.getProgressByStudent(studentId);
        const streaks = progress.map(p => p.currentStreak || 0).filter(s => s > 0);
        const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
        return maxStreak >= requirements.value;
      }

      case "pomodoro_sessions": {
        const sessions = await storage.getPomodoroSessionsByStudent(studentId);
        if (requirements.timeframe === "weekly") {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const recentSessions = sessions.filter(s => 
            s.completed === "true" && 
            s.sessionType === "focus" && 
            s.startedAt && s.startedAt >= weekAgo
          );
          return recentSessions.length >= requirements.value;
        }
        const completedSessions = sessions.filter(s => 
          s.completed === "true" && s.sessionType === "focus"
        );
        return completedSessions.length >= requirements.value;
      }

      case "perfect_score": {
        const progress = await storage.getProgressByStudent(studentId);
        const streaks = progress.map(p => p.bestStreak || 0).filter(s => s > 0);
        const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
        return maxStreak >= requirements.value;
      }

      default:
        return false;
    }
  }

  getBadgeDefinition(badgeId: string): BadgeDefinition | undefined {
    return BADGE_DEFINITIONS.find(badge => badge.id === badgeId);
  }
}

export const badgeSystem = new BadgeSystem();