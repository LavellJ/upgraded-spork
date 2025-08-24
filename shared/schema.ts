import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Parent/Guardian accounts
export const parents = pgTable("parents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // hashed password
  name: text("name").notNull(),
  phone: text("phone"),
  isEmailVerified: boolean("is_email_verified").default(false),
  accountType: text("account_type").default("parent"), // "parent", "teacher"
  createdAt: timestamp("created_at").defaultNow(),
});

// Parent sessions for authentication
export const parentSessions = pgTable("parent_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull(),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ageGroup: text("age_group").notNull(), // "pre-primary", "primary", "upper-primary"
  currentLevel: integer("current_level").default(1),
  totalPoints: integer("total_points").default(0),
  parentId: varchar("parent_id").notNull(), // Link to parent account
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Parent control settings for children
export const parentControls = pgTable("parent_controls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull(),
  studentId: varchar("student_id").notNull(),
  dailyTimeLimit: integer("daily_time_limit").default(60), // minutes
  allowedSubjects: jsonb("allowed_subjects").default([]), // array of subjects
  blockedTopics: jsonb("blocked_topics").default([]), // array of topic IDs
  requiresApproval: boolean("requires_approval").default(false), // for new topics
  pomodoroEnabled: boolean("pomodoro_enabled").default(true),
  reportsEnabled: boolean("reports_enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Parent activity log for tracking oversight actions
export const parentActivityLog = pgTable("parent_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull(),
  studentId: varchar("student_id"), // optional, for student-specific actions
  action: text("action").notNull(), // "viewed_progress", "changed_settings", "approved_topic", etc
  details: jsonb("details"), // additional action details
  timestamp: timestamp("timestamp").defaultNow(),
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

export const insertParentSchema = createInsertSchema(parents).omit({
  id: true,
  createdAt: true,
});

export const insertParentSessionSchema = createInsertSchema(parentSessions).omit({
  id: true,
  createdAt: true,
});

export const insertParentControlsSchema = createInsertSchema(parentControls).omit({
  id: true,
  updatedAt: true,
});

export const insertParentActivityLogSchema = createInsertSchema(parentActivityLog).omit({
  id: true,
  timestamp: true,
});

// Types
export type Parent = typeof parents.$inferSelect;
export type InsertParent = z.infer<typeof insertParentSchema>;

export type ParentSession = typeof parentSessions.$inferSelect;
export type InsertParentSession = z.infer<typeof insertParentSessionSchema>;

export type ParentControls = typeof parentControls.$inferSelect;
export type InsertParentControls = z.infer<typeof insertParentControlsSchema>;

export type ParentActivityLog = typeof parentActivityLog.$inferSelect;
export type InsertParentActivityLog = z.infer<typeof insertParentActivityLogSchema>;

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
