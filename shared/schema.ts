// shared/schema.ts
import { serial, pgTable, text, timestamp, varchar, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// Match existing database structure
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  badgeId: text("badge_id").notNull(),
  earnedAt: timestamp("earned_at"),
  metadata: jsonb("metadata")
});

export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: text("asset_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  filePath: text("file_path").notNull(),
  assetType: text("asset_type").notNull(),
  category: text("category").notNull(),
  subject: text("subject"),
  ageGroup: text("age_group"),
  tags: jsonb("tags"),
  isActive: boolean("is_active"),
  createdAt: timestamp("created_at")
});

export const lessonCompletions = pgTable("lesson_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  lessonId: text("lesson_id").notNull(),
  subject: text("subject").notNull(),
  challengeType: text("challenge_type").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  completedAt: timestamp("completed_at")
});

// Learning content and other core tables
export const learningContent = pgTable("learning_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: varchar("topic_id").notNull(),
  contentDescriptor: text("content_descriptor"),
  phase: text("phase").notNull(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(),
  ageGroup: text("age_group").notNull(),
  difficulty: integer("difficulty"),
  estimatedDuration: integer("estimated_duration"),
  prerequisites: jsonb("prerequisites"),
  createdAt: timestamp("created_at")
});

// Type exports
export type Achievement = InferSelectModel<typeof achievements>;
export type InsertAchievement = InferInsertModel<typeof achievements>;

export type LessonCompletion = InferSelectModel<typeof lessonCompletions>;
export type InsertLessonCompletion = InferInsertModel<typeof lessonCompletions>;

export type Asset = InferSelectModel<typeof assets>;
export type InsertAsset = InferInsertModel<typeof assets>;

export type LearningContent = InferSelectModel<typeof learningContent>;
export type InsertLearningContent = InferInsertModel<typeof learningContent>;

// Zod schemas for validation
export const insertAchievementSchema = createInsertSchema(achievements);
export const insertLessonCompletionSchema = createInsertSchema(lessonCompletions);
export const insertAssetSchema = createInsertSchema(assets);
export const insertLearningContentSchema = createInsertSchema(learningContent);