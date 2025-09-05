import { z } from 'zod';

// Journal item schema for individual Q&A prompts
export const journalItem = z.object({
  id: z.string(),
  skillId: z.string().optional(), // Made optional for compatibility
  prompt: z.string(),
  kind: z.enum(['short', 'mcq', 'multiple_choice']), // Added multiple_choice alias
  image: z.string().nullable().optional(),
  choices: z.array(z.string()).optional(), // Alias for options
  correct: z.number().optional(), // Index of correct choice
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
  explanation: z.string().optional(),
  // Enhanced fields for schema v2
  band: z.enum(['easy', 'med', 'hard']).optional(),
  tags: z.array(z.string()).optional(),
  miscue_types: z.array(z.string()).optional(),
  hint: z.string().optional()
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
  offline: z.boolean().optional(), // Track if session was completed offline
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

// Band level for schema v2 items
export type BandLevel = 'easy' | 'med' | 'hard';