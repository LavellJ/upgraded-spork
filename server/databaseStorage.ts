import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import {
  achievements,
  lessonCompletions,
} from "../shared/schema";
import type {
  Achievement, InsertAchievement,
  LessonCompletion, InsertLessonCompletion
} from "../shared/schema";

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export class DatabaseStorage {
  // Achievements - Database-backed
  async getAchievementsByStudent(studentId: string): Promise<Achievement[]> {
    try {
      const result = await db.select().from(achievements).where(eq(achievements.studentId, studentId));
      return result;
    } catch (error) {
      console.error('Error fetching achievements from database:', error);
      return [];
    }
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    try {
      const [newAchievement] = await db.insert(achievements)
        .values({
          ...achievement,
          earnedAt: new Date()
        })
        .returning();
      return newAchievement;
    } catch (error) {
      console.error('Error creating achievement in database:', error);
      throw error;
    }
  }

  // Lesson Completion Methods - Database-backed
  async getCompletedLessons(studentId: string): Promise<LessonCompletion[]> {
    try {
      const result = await db.select().from(lessonCompletions).where(eq(lessonCompletions.studentId, studentId));
      return result;
    } catch (error) {
      console.error('Error fetching lesson completions from database:', error);
      return [];
    }
  }

  async createLessonCompletion(completion: InsertLessonCompletion): Promise<LessonCompletion> {
    try {
      const [newCompletion] = await db.insert(lessonCompletions)
        .values({
          ...completion,
          completedAt: new Date()
        })
        .returning();
      return newCompletion;
    } catch (error) {
      console.error('Error creating lesson completion in database:', error);
      throw error;
    }
  }
}

export const databaseStorage = new DatabaseStorage();