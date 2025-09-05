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
  parentId: varchar("parent_id"), // Link to parent account (nullable for demo)
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

// Lesson completions - track Scout lesson skeleton completions
export const lessonCompletions = pgTable("lesson_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  lessonId: text("lesson_id").notNull(), // from lesson skeleton system
  subject: text("subject").notNull(),
  challengeType: text("challenge_type").notNull(), // "multipleChoice", "fillBlank", "dragDrop"
  isCorrect: boolean("is_correct").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Learning Sessions - Teach → Try → Reflect → Create cycles
export const learningSessions = pgTable("learning_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  topicId: varchar("topic_id").notNull(),
  contentDescriptor: text("content_descriptor"), // Australian Curriculum code (e.g., "ACMNA056")
  currentPhase: text("current_phase").notNull(), // "teach", "try", "reflect", "create"
  phaseProgress: jsonb("phase_progress").default({}), // track completion of each phase
  sessionData: jsonb("session_data").default({}), // store phase-specific data
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  startedAt: timestamp("started_at").defaultNow(),
});

// Content for each learning phase
export const learningContent = pgTable("learning_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: varchar("topic_id").notNull(),
  contentDescriptor: text("content_descriptor"), // Australian Curriculum mapping
  phase: text("phase").notNull(), // "teach", "try", "reflect", "create"
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // phase-specific content structure
  ageGroup: text("age_group").notNull(),
  difficulty: integer("difficulty").default(3),
  estimatedDuration: integer("estimated_duration").default(5), // minutes
  prerequisites: jsonb("prerequisites").default([]), // array of content descriptor codes
  createdAt: timestamp("created_at").defaultNow(),
});

// Student artifacts from Create phases
export const studentArtifacts = pgTable("student_artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  sessionId: varchar("session_id").notNull(),
  topicId: varchar("topic_id").notNull(),
  artifactType: text("artifact_type").notNull(), // "explanation", "project", "drawing", "voice_note"
  content: jsonb("content").notNull(), // artifact data
  aiAssessment: jsonb("ai_assessment"), // AI feedback and scoring
  parentVisible: boolean("parent_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
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

// Assets table for storing generated images and icons
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: text("asset_id").notNull().unique(), // readable identifier like "geometric-bear-counting"
  name: text("name").notNull(),
  description: text("description"),
  filePath: text("file_path").notNull(), // relative path to asset file
  assetType: text("asset_type").notNull(), // "icon", "illustration", "background", "avatar"
  category: text("category").notNull(), // "geometric-animal", "scout", "educational", "ui"
  subject: text("subject"), // "mathematics", "literacy", "science", null for general
  ageGroup: text("age_group"), // "pre-primary", "primary", "upper-primary", null for all ages
  tags: jsonb("tags").default([]), // array of descriptive tags
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scout's Workbook tables - second pillar of learning

// Workbook sessions - Pomodoro-timed practice sessions
export const workbookSessions = pgTable("workbook_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  subject: text("subject").notNull(), // "mathematics", "literacy", "science", "creative"
  sessionType: text("session_type").notNull(), // "focus", "break", "meditation"
  duration: integer("duration").notNull(), // in minutes  
  questionsAsked: integer("questions_asked").default(0),
  questionsCorrect: integer("questions_correct").default(0),
  completed: boolean("completed").default(false),
  interrupted: boolean("interrupted").default(false), // if session was stopped early
  difficultyLevel: integer("difficulty_level").default(3), // 1-5, adapts based on performance
  sessionData: jsonb("session_data").default({}), // store session-specific info
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// AI-generated workbook questions - separate from map questions
export const workbookQuestions = pgTable("workbook_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: text("subject").notNull(),
  ageGroup: text("age_group").notNull(),
  difficultyLevel: integer("difficulty_level").notNull(), // 1-5
  questionType: text("question_type").notNull(), // "multiple_choice", "true_false", "fill_blank", "counting", "matching"
  question: text("question").notNull(),
  options: jsonb("options"), // for multiple choice - array of strings
  correctAnswer: jsonb("correct_answer").notNull(), // flexible format based on question type
  explanation: text("explanation"),
  aiGenerated: boolean("ai_generated").default(true),
  tags: jsonb("tags").default([]), // topical tags like "counting", "shapes", "letters"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student workbook responses - track individual question attempts
export const workbookResponses = pgTable("workbook_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  studentId: varchar("student_id").notNull(),
  questionId: varchar("question_id").notNull(),
  studentAnswer: jsonb("student_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeSpent: integer("time_spent"), // seconds spent on question
  hintsUsed: integer("hints_used").default(0),
  answeredAt: timestamp("answered_at").defaultNow(),
});

// Workbook progress by subject - independent from map progress
export const workbookProgress = pgTable("workbook_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  subject: text("subject").notNull(),
  totalSessions: integer("total_sessions").default(0),
  totalQuestions: integer("total_questions").default(0),
  totalCorrect: integer("total_correct").default(0),
  currentDifficulty: integer("current_difficulty").default(3), // AI adapts this
  averageAccuracy: integer("average_accuracy").default(0), // percentage
  longestStreak: integer("longest_streak").default(0),
  currentStreak: integer("current_streak").default(0),
  totalFocusTime: integer("total_focus_time").default(0), // minutes
  lastSession: timestamp("last_session"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workbook badges and achievements - separate from map achievements  
export const workbookAchievements = pgTable("workbook_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  subject: text("subject").notNull(),
  achievementType: text("achievement_type").notNull(), // "streak", "accuracy", "focus_time", "sessions"
  achievementLevel: text("achievement_level").notNull(), // "bronze", "silver", "gold" 
  criteria: jsonb("criteria").notNull(), // what was needed to earn this
  metadata: jsonb("metadata"), // additional data like streak length, accuracy percentage
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
}).extend({
  parentId: z.string().optional(), // Make parentId optional for demo mode
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

export const insertLessonCompletionSchema = createInsertSchema(lessonCompletions).omit({
  id: true,
  completedAt: true,
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

export const insertLearningSessionSchema = createInsertSchema(learningSessions).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertLearningContentSchema = createInsertSchema(learningContent).omit({
  id: true,
  createdAt: true,
});

export const insertStudentArtifactSchema = createInsertSchema(studentArtifacts).omit({
  id: true,
  createdAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
});

// Workbook insert schemas
export const insertWorkbookSessionSchema = createInsertSchema(workbookSessions).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertWorkbookQuestionSchema = createInsertSchema(workbookQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertWorkbookResponseSchema = createInsertSchema(workbookResponses).omit({
  id: true,
  answeredAt: true,
});

export const insertWorkbookProgressSchema = createInsertSchema(workbookProgress).omit({
  id: true,
  lastSession: true,
  updatedAt: true,
});

export const insertWorkbookAchievementSchema = createInsertSchema(workbookAchievements).omit({
  id: true,
  earnedAt: true,
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

export type LessonCompletion = typeof lessonCompletions.$inferSelect;
export type InsertLessonCompletion = z.infer<typeof insertLessonCompletionSchema>;

export type LearningSession = typeof learningSessions.$inferSelect;
export type InsertLearningSession = z.infer<typeof insertLearningSessionSchema>;

export type LearningContent = typeof learningContent.$inferSelect;
export type InsertLearningContent = z.infer<typeof insertLearningContentSchema>;

export type StudentArtifact = typeof studentArtifacts.$inferSelect;
export type InsertStudentArtifact = z.infer<typeof insertStudentArtifactSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

// Workbook types
export type WorkbookSession = typeof workbookSessions.$inferSelect;
export type InsertWorkbookSession = z.infer<typeof insertWorkbookSessionSchema>;

export type WorkbookQuestion = typeof workbookQuestions.$inferSelect;
export type InsertWorkbookQuestion = z.infer<typeof insertWorkbookQuestionSchema>;

export type WorkbookResponse = typeof workbookResponses.$inferSelect;
export type InsertWorkbookResponse = z.infer<typeof insertWorkbookResponseSchema>;

export type WorkbookProgress = typeof workbookProgress.$inferSelect;
export type InsertWorkbookProgress = z.infer<typeof insertWorkbookProgressSchema>;

export type WorkbookAchievement = typeof workbookAchievements.$inferSelect;
export type InsertWorkbookAchievement = z.infer<typeof insertWorkbookAchievementSchema>;

// Retention policies for per-tenant data retention settings
export const retentionPolicies = pgTable("retention_policies", {
  email: text("email").primaryKey(), // user email (reference to parents.email)
  eventsDays: integer("events_days").notNull().default(90), // keep detailed events for N days
  auditDays: integer("audit_days").notNull().default(365), // keep audit logs for N days
  updatedAt: timestamp("updated_at").notNull().defaultNow(), // when policy was last updated
});

export const insertRetentionPolicySchema = createInsertSchema(retentionPolicies);
export type RetentionPolicy = typeof retentionPolicies.$inferSelect;
export type InsertRetentionPolicy = z.infer<typeof insertRetentionPolicySchema>;
