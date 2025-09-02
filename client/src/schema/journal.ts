import { z } from 'zod';

// Journal item schema for individual Q&A prompts
export const journalItem = z.object({
  id: z.string(),
  skillId: z.string(),
  prompt: z.string(),
  kind: z.enum(['short', 'mcq']),
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
  explanation: z.string().optional()
});

export type JournalItem = z.infer<typeof journalItem>;

// Journal session schema
export const journalSession = z.object({
  id: z.string(),
  skillId: z.string(),
  targetLevel: z.enum(['easy', 'core', 'stretch']),
  items: z.array(journalItem),
  startedAt: z.number(),
  completedAt: z.number().optional(),
  responses: z.array(z.object({
    itemId: z.string(),
    userAnswer: z.string(),
    isCorrect: z.boolean(),
    timeSpent: z.number()
  })).optional()
});

export type JournalSession = z.infer<typeof journalSession>;

// Session history entry - extended to include detailed review data
export const journalHistoryEntry = z.object({
  date: z.string(),
  skillId: z.string(),
  itemCount: z.number(),
  correctCount: z.number(),
  duration: z.number(),
  masteryBefore: z.number(),
  masteryAfter: z.number(),
  // Extended fields for review functionality
  sessionId: z.string(),
  targetLevel: z.enum(['easy', 'core', 'stretch']),
  items: z.array(journalItem), // Store the actual items presented
  responses: z.array(z.object({
    itemId: z.string(),
    userAnswer: z.string(),
    isCorrect: z.boolean(),
    timeSpent: z.number()
  })) // Store user responses for review
});

export type JournalHistoryEntry = z.infer<typeof journalHistoryEntry>;

// Skill level enum for easier use
export type SkillLevel = 'easy' | 'core' | 'stretch';