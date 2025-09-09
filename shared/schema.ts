// shared/schema.ts
import { integer, sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const lessons = sqliteTable("lessons", {
  id: integer("id").primaryKey(),
  biome: text("biome").notNull(),               // 'forest' | 'desert' | 'ocean' | 'night'
  title: text("title").notNull(),
  ageGroup: text("age_group").notNull(),        // 'pre-primary' | 'primary' | 'upper-primary'
  content: text("content").notNull()            // JSON string if needed
});

export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey(),
  studentId: text("student_id").notNull(),
  badgeId: text("badge_id"),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  category: text("category"),
  rarity: text("rarity"),
  ageGroups: text("age_groups"),
  earnedAt: integer("earned_at", { mode: 'timestamp' })
});

export const lessonCompletions = sqliteTable("lesson_completions", {
  id: integer("id").primaryKey(),
  studentId: text("student_id").notNull(),
  lessonId: text("lesson_id").notNull(),
  completedAt: integer("completed_at", { mode: 'timestamp' }),
  challengeType: text("challenge_type"),
  result: text("result"),
  durationSec: integer("duration_sec"),
  biomeId: text("biome_id")
});

export const assets = sqliteTable("assets", {
  id: integer("id").primaryKey(),
  assetId: text("asset_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  filePath: text("file_path"),
  assetType: text("asset_type"),
  category: text("category"),
  subject: text("subject"),
  ageGroup: text("age_group"),
  tags: text("tags"),
  createdAt: integer("created_at", { mode: 'timestamp' })
});

export type Lesson = InferSelectModel<typeof lessons>;
export type NewLesson = InferInsertModel<typeof lessons>;

export type Achievement = InferSelectModel<typeof achievements>;
export type InsertAchievement = InferInsertModel<typeof achievements>;

export type LessonCompletion = InferSelectModel<typeof lessonCompletions>;
export type InsertLessonCompletion = InferInsertModel<typeof lessonCompletions>;

export type Asset = InferSelectModel<typeof assets>;
export type InsertAsset = InferInsertModel<typeof assets>;