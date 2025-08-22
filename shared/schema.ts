import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ageGroup: text("age_group").notNull(), // "pre-primary", "primary", "upper-primary"
  currentLevel: integer("current_level").default(1),
  totalPoints: integer("total_points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const topics = pgTable("topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject").notNull(), // "mathematics", "english", etc
  ageGroup: text("age_group").notNull(),
  level: integer("level").notNull(),
  isUnlocked: text("is_unlocked").default("false"), // stored as text for simplicity
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: varchar("topic_id").notNull(),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // string[]
  correctAnswer: integer("correct_answer").notNull(), // index of correct option
  explanation: text("explanation").notNull(),
  difficulty: integer("difficulty").notNull(), // 1-5
  createdAt: timestamp("created_at").defaultNow(),
});

export const progress = pgTable("progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  topicId: varchar("topic_id").notNull(),
  questionsAnswered: integer("questions_answered").default(0),
  correctAnswers: integer("correct_answers").default(0),
  currentStreak: integer("current_streak").default(0),
  bestStreak: integer("best_streak").default(0),
  completionPercentage: integer("completion_percentage").default(0),
  lastStudied: timestamp("last_studied").defaultNow(),
});

export const pomodoroSessions = pgTable("pomodoro_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  topicId: varchar("topic_id"),
  duration: integer("duration").notNull(), // in minutes
  completed: text("completed").default("false"), // stored as text for simplicity
  sessionType: text("session_type").notNull(), // "focus", "break"
  startedAt: timestamp("started_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  badgeId: text("badge_id").notNull(), // identifier for badge type
  earnedAt: timestamp("earned_at").defaultNow(),
  metadata: jsonb("metadata"), // optional data like streak length, topic completed, etc
});

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertProgressSchema = createInsertSchema(progress).omit({
  id: true,
  lastStudied: true,
});

export const insertPomodoroSessionSchema = createInsertSchema(pomodoroSessions).omit({
  id: true,
  startedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  earnedAt: true,
});

// Types
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Progress = typeof progress.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;

export type PomodoroSession = typeof pomodoroSessions.$inferSelect;
export type InsertPomodoroSession = z.infer<typeof insertPomodoroSessionSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
