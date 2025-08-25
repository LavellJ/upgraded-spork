import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import {
  achievements,
  lessonCompletions,
  assets,
} from "../shared/schema";
import type {
  Achievement, InsertAchievement,
  LessonCompletion, InsertLessonCompletion,
  Asset, InsertAsset
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

  // Assets - Database-backed
  async getAllAssets(): Promise<Asset[]> {
    try {
      const result = await db.select().from(assets);
      return result;
    } catch (error) {
      console.error('Error fetching assets from database:', error);
      return [];
    }
  }

  async getAssetByAssetId(assetId: string): Promise<Asset | undefined> {
    try {
      const result = await db.select().from(assets).where(eq(assets.assetId, assetId));
      return result[0];
    } catch (error) {
      console.error('Error fetching asset from database:', error);
      return undefined;
    }
  }

  async getAssetsByCategory(category: string): Promise<Asset[]> {
    try {
      const result = await db.select().from(assets).where(eq(assets.category, category));
      return result;
    } catch (error) {
      console.error('Error fetching assets by category from database:', error);
      return [];
    }
  }

  async getAssetsBySubject(subject: string): Promise<Asset[]> {
    try {
      const result = await db.select().from(assets).where(eq(assets.subject, subject));
      return result;
    } catch (error) {
      console.error('Error fetching assets by subject from database:', error);
      return [];
    }
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    try {
      const [newAsset] = await db.insert(assets)
        .values({
          ...asset,
          createdAt: new Date()
        })
        .returning();
      return newAsset;
    } catch (error) {
      console.error('Error creating asset in database:', error);
      throw error;
    }
  }

  async createAssets(assetList: InsertAsset[]): Promise<Asset[]> {
    try {
      const newAssets = await db.insert(assets)
        .values(assetList.map(asset => ({
          ...asset,
          createdAt: new Date()
        })))
        .returning();
      return newAssets;
    } catch (error) {
      console.error('Error creating assets in database:', error);
      throw error;
    }
  }

  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset> {
    try {
      const [updatedAsset] = await db.update(assets)
        .set(updates)
        .where(eq(assets.id, id))
        .returning();
      return updatedAsset;
    } catch (error) {
      console.error('Error updating asset in database:', error);
      throw error;
    }
  }
}

export const databaseStorage = new DatabaseStorage();