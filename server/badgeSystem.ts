import { type Achievement, type InsertAchievement, type LessonCompletion, type InsertLessonCompletion } from "@shared/schema";
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
    type: "lessons_completed" | "subject_lessons" | "challenge_type_mastery" | 
          "daily_streak" | "pomodoro_sessions" | "perfect_score" | "study_time" | "correct_lessons";
    value: number;
    subject?: "Math" | "English" | "Science";
    challengeType?: "multipleChoice" | "fillBlank" | "dragDrop";
    timeframe?: "daily" | "weekly" | "total";
  };
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Milestone badges - lesson completion focused
  {
    id: "first_steps",
    name: "First Steps",
    description: "Completed your first 3 lessons with Scout!",
    icon: "🐰",
    category: "milestone",
    rarity: "common",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "lessons_completed", value: 3, timeframe: "total" }
  },
  {
    id: "daily_learner",
    name: "Daily Learner", 
    description: "Completed lessons for 3 days in a row",
    icon: "🐿️",
    category: "streak",
    rarity: "common",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "daily_streak", value: 3, timeframe: "daily" }
  },
  {
    id: "focus_master",
    name: "Focus Master",
    description: "Completed 5 Pomodoro focus sessions",
    icon: "🦉",
    category: "time",
    rarity: "common",
    ageGroups: ["primary", "upper-primary"],
    requirements: { type: "pomodoro_sessions", value: 5, timeframe: "weekly" }
  },

  // Subject-specific badges
  {
    id: "math_master",
    name: "Math Master",
    description: "Completed 5 Math lessons with Scout",
    icon: "🔢",
    category: "mastery",
    rarity: "rare",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "subject_lessons", value: 5, subject: "Math", timeframe: "total" }
  },
  {
    id: "english_expert",
    name: "English Expert",
    description: "Completed 5 English lessons with Scout",
    icon: "📚",
    category: "mastery",
    rarity: "rare",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "subject_lessons", value: 5, subject: "English", timeframe: "total" }
  },
  {
    id: "science_explorer",
    name: "Science Explorer",
    description: "Completed 5 Science lessons with Scout",
    icon: "🔬",
    category: "mastery",
    rarity: "rare",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "subject_lessons", value: 5, subject: "Science", timeframe: "total" }
  },

  // Challenge type mastery badges
  {
    id: "choice_champion",
    name: "Choice Champion",
    description: "Mastered 10 multiple choice challenges",
    icon: "✅",
    category: "mastery",
    rarity: "rare",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "challenge_type_mastery", value: 10, challengeType: "multipleChoice", timeframe: "total" }
  },
  {
    id: "word_wizard",
    name: "Word Wizard",
    description: "Mastered 10 fill-in-the-blank challenges",
    icon: "✏️",
    category: "mastery",
    rarity: "rare",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "challenge_type_mastery", value: 10, challengeType: "fillBlank", timeframe: "total" }
  },
  {
    id: "drag_master",
    name: "Drag & Drop Master",
    description: "Mastered 10 drag & drop challenges",
    icon: "🎯",
    category: "mastery",
    rarity: "rare",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "challenge_type_mastery", value: 10, challengeType: "dragDrop", timeframe: "total" }
  },

  // Accuracy-based badges
  {
    id: "accuracy_ace",
    name: "Accuracy Ace",
    description: "Completed 10 lessons correctly in a row",
    icon: "🎯",
    category: "mastery",
    rarity: "epic",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "correct_lessons", value: 10, timeframe: "total" }
  },
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Learned something every day for a week",
    icon: "🐾",
    category: "streak",
    rarity: "rare",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "daily_streak", value: 7, timeframe: "daily" }
  },

  // Epic achievement badges
  {
    id: "dedication_master",
    name: "Dedication Master",
    description: "Learned for 21 days straight",
    icon: "🐺",
    category: "streak",
    rarity: "epic",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "daily_streak", value: 21, timeframe: "daily" }
  },

  // Lesson-specific badges
  {
    id: "scout_apprentice",
    name: "Scout Apprentice",
    description: "Completed your first lesson with Scout!",
    icon: "🏴‍☠️",
    category: "milestone",
    rarity: "common",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "lessons_completed", value: 1, timeframe: "total" }
  },
  {
    id: "lesson_explorer",
    name: "Lesson Explorer",
    description: "Completed 5 Scout adventure lessons",
    icon: "🗺️",
    category: "milestone",
    rarity: "common",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "lessons_completed", value: 5, timeframe: "total" }
  },
  {
    id: "adventure_veteran",
    name: "Adventure Veteran",
    description: "Completed 10 Scout adventure lessons",
    icon: "⚔️",
    category: "milestone",
    rarity: "rare",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "lessons_completed", value: 10, timeframe: "total" }
  },
  {
    id: "master_adventurer",
    name: "Master Adventurer",
    description: "Completed all 15 Scout adventure lessons!",
    icon: "👑",
    category: "milestone",
    rarity: "epic",
    ageGroups: ["pre-primary", "primary", "upper-primary"],
    requirements: { type: "lessons_completed", value: 15, timeframe: "total" }
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
      case "lessons_completed": {
        const completedLessons = await storage.getCompletedLessons(studentId);
        return completedLessons.length >= requirements.value;
      }

      case "subject_lessons": {
        const completedLessons = await storage.getCompletedLessons(studentId);
        if (!requirements.subject) return false;
        const subjectLessons = completedLessons.filter(lesson => lesson.subject === requirements.subject);
        return subjectLessons.length >= requirements.value;
      }

      case "challenge_type_mastery": {
        const completedLessons = await storage.getCompletedLessons(studentId);
        if (!requirements.challengeType) return false;
        const challengeTypeLessons = completedLessons.filter(lesson => 
          lesson.challengeType === requirements.challengeType && lesson.isCorrect
        );
        return challengeTypeLessons.length >= requirements.value;
      }

      case "correct_lessons": {
        const completedLessons = await storage.getCompletedLessons(studentId);
        const correctLessons = completedLessons.filter(lesson => lesson.isCorrect);
        // Check for consecutive correct lessons
        let consecutiveCount = 0;
        let maxConsecutive = 0;
        
        // Sort by completion date to check sequence
        const sortedLessons = [...completedLessons].sort((a, b) => 
          new Date(a.completedAt || 0).getTime() - new Date(b.completedAt || 0).getTime()
        );
        
        for (const lesson of sortedLessons) {
          if (lesson.isCorrect) {
            consecutiveCount++;
            maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
          } else {
            consecutiveCount = 0;
          }
        }
        
        return maxConsecutive >= requirements.value;
      }

      case "daily_streak": {
        const completedLessons = await storage.getCompletedLessons(studentId);
        if (completedLessons.length === 0) return false;
        
        // Group lessons by date
        const lessonsByDate = new Map<string, boolean>();
        completedLessons.forEach(lesson => {
          if (lesson.completedAt) {
            const date = new Date(lesson.completedAt).toDateString();
            lessonsByDate.set(date, true);
          }
        });
        
        // Check for consecutive days
        const dates = Array.from(lessonsByDate.keys()).sort();
        let currentStreak = 0;
        let maxStreak = 0;
        let lastDate: Date | null = null;
        
        for (const dateStr of dates) {
          const currentDate = new Date(dateStr);
          if (lastDate && 
              currentDate.getTime() - lastDate.getTime() === 24 * 60 * 60 * 1000) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
          maxStreak = Math.max(maxStreak, currentStreak);
          lastDate = currentDate;
        }
        
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
        // This is now handled by correct_lessons for consecutive correct answers
        const completedLessons = await storage.getCompletedLessons(studentId);
        const correctLessons = completedLessons.filter(lesson => lesson.isCorrect);
        return correctLessons.length >= requirements.value;
      }

      case "study_time": {
        // Keep this for any future time-based requirements
        return false; // Not implemented yet
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