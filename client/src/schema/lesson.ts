/**
 * Lesson content validation schemas using Zod
 * Provides type-safe validation for all lesson-related JSON files
 */

import { z } from 'zod';

// ---- Basic lesson item for loop data ----
export const BasicLessonSchema = z.object({
  id: z.string().min(1, 'Lesson ID is required'),
  title: z.string().min(1, 'Lesson title is required')
});

export type BasicLesson = z.infer<typeof BasicLessonSchema>;

// ---- Loop data schema (loop1.json, loop2.json) ----
export const LoopDataSchema = z.object({
  forest: z.array(BasicLessonSchema),
  desert: z.array(BasicLessonSchema),
  ocean: z.array(BasicLessonSchema),
  night: z.array(BasicLessonSchema)
});

export type LoopData = z.infer<typeof LoopDataSchema>;

// ---- Standards mapping for registry ----
export const StandardsSchema = z.object({
  Generic: z.string(),
  ACARA: z.string().optional(),
  NZC: z.string().optional()
});

export type Standards = z.infer<typeof StandardsSchema>;

// ---- Registry entry metadata ----
export const RegistryEntrySchema = z.object({
  url: z.string().url('Must be a valid URL'),
  standards: StandardsSchema,
  est: z.string().regex(/^\d+–\d+\s+min$/, 'Estimated time format: "6–8 min"')
});

export type RegistryEntry = z.infer<typeof RegistryEntrySchema>;

// ---- Registry data schema ----
export const RegistryDataSchema = z.record(
  z.string().regex(/^\d+$/, 'Loop number must be numeric'),
  z.object({
    forest: z.record(z.string(), RegistryEntrySchema),
    desert: z.record(z.string(), RegistryEntrySchema),
    ocean: z.record(z.string(), RegistryEntrySchema),
    night: z.record(z.string(), RegistryEntrySchema)
  })
);

export type RegistryData = z.infer<typeof RegistryDataSchema>;

// ---- Prototype quiz question ----
export const PrototypeQuestionSchema = z.object({
  q: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).min(2, 'At least 2 options required'),
  correct: z.number().int().min(0, 'Correct answer index must be non-negative'),
  explain: z.string().min(1, 'Explanation is required')
}).refine(
  (data) => data.correct < data.options.length,
  { message: 'Correct answer index must be within options range', path: ['correct'] }
);

export type PrototypeQuestion = z.infer<typeof PrototypeQuestionSchema>;

// ---- Prototypes data schema ----
export const PrototypesDataSchema = z.object({
  forest: z.record(z.string(), PrototypeQuestionSchema),
  desert: z.record(z.string(), PrototypeQuestionSchema),
  ocean: z.record(z.string(), PrototypeQuestionSchema),
  night: z.record(z.string(), PrototypeQuestionSchema)
});

export type PrototypesData = z.infer<typeof PrototypesDataSchema>;

// ---- Lesson step types ----
export const LessonStepSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('read'),
    text: z.string().min(1, 'Read step text is required')
  }),
  z.object({
    type: z.literal('activity'),
    prompt: z.string().min(1, 'Activity prompt is required')
  }),
  z.object({
    type: z.literal('quiz'),
    questionSetId: z.string().min(1, 'Question set ID is required')
  })
]);

export type LessonStep = z.infer<typeof LessonStepSchema>;

// ---- Full lesson content ----
export const LessonContentSchema = z.object({
  id: z.string().min(1, 'Lesson ID is required'),
  title: z.string().min(1, 'Lesson title is required'),
  ageBand: z.string().regex(/^\d+-\d+$/, 'Age band format: "5-7"'),
  steps: z.array(LessonStepSchema).min(1, 'At least one step is required')
});

export type LessonContent = z.infer<typeof LessonContentSchema>;

// ---- Quiz question types ----
const MultipleChoiceQuestionSchema = z.object({
  id: z.string().min(1, 'Question ID is required'),
  type: z.literal('mc'),
  q: z.string().min(1, 'Question text is required'),
  choices: z.array(z.string()).min(2, 'At least 2 choices required'),
  answer: z.number().int().min(0, 'Answer index must be non-negative')
}).refine(
  (data) => data.answer < data.choices.length,
  { message: 'Answer index must be within choices range', path: ['answer'] }
);

const OpenQuestionSchema = z.object({
  id: z.string().min(1, 'Question ID is required'),
  type: z.literal('open'),
  q: z.string().min(1, 'Question text is required')
});

export const QuizQuestionSchema = z.union([
  MultipleChoiceQuestionSchema,
  OpenQuestionSchema
]);

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

// ---- Question set schema ----
export const QuestionSetSchema = z.object({
  id: z.string().min(1, 'Question set ID is required'),
  timeLimitSec: z.number().int().positive('Time limit must be positive'),
  questions: z.array(QuizQuestionSchema).min(1, 'At least one question is required')
});

export type QuestionSet = z.infer<typeof QuestionSetSchema>;

// ---- Activity schemas ----

// Caption/subtitle track for video activities
const CaptionTrackSchema = z.object({
  src: z.string().url('Caption track source must be a valid URL'),
  srclang: z.string().min(1, 'Language code is required'),
  label: z.string().optional(),
  default: z.boolean().optional()
});

// Transcript for video activities
const TranscriptSchema = z.object({
  src: z.string().url().optional(),
  text: z.string().optional()
}).refine(
  (data) => data.src || data.text,
  { message: 'Either src or text must be provided for transcript', path: ['src'] }
);

// Base activity schema
const BaseActivitySchema = z.object({
  kind: z.string().min(1, 'Activity kind is required'),
  title: z.string().min(1, 'Activity title is required')
});

// Video activity with captions and transcript support
const VideoActivitySchema = BaseActivitySchema.extend({
  kind: z.literal('video'),
  src: z.string().url('Video source must be a valid URL'),
  type: z.string().optional().default('video/mp4'),
  captions: z.array(CaptionTrackSchema).optional(),
  transcript: TranscriptSchema.optional()
});

// General activity schema (discriminated union for different kinds)
export const activitySchema = z.discriminatedUnion('kind', [
  VideoActivitySchema
  // Add other activity types here as needed
]);

export type Activity = z.infer<typeof activitySchema>;
export type VideoActivity = z.infer<typeof VideoActivitySchema>;
export type CaptionTrack = z.infer<typeof CaptionTrackSchema>;
export type Transcript = z.infer<typeof TranscriptSchema>;

// ---- Schema validation utilities ----

/**
 * Validate any lesson-related data with proper error handling
 */
export function validateLessonData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fileName?: string
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errors = result.error.errors.map(err => {
        const path = err.path.join('.');
        const location = fileName ? `${fileName}${path ? ` → ${path}` : ''}` : path;
        return `${location}: ${err.message}`;
      });
      
      return { success: false, errors };
    }
  } catch (error) {
    return { 
      success: false, 
      errors: [`${fileName || 'Data'}: Invalid JSON or unexpected error - ${error}`] 
    };
  }
}

/**
 * Batch validate multiple lesson files
 */
export function validateLessonFiles(
  validations: Array<{ schema: z.ZodSchema<any>; data: unknown; fileName: string }>
): { valid: boolean; errors: string[] } {
  const allErrors: string[] = [];
  
  for (const { schema, data, fileName } of validations) {
    const result = validateLessonData(schema, data, fileName);
    if (!result.success) {
      allErrors.push(...result.errors);
    }
  }
  
  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
}

// ---- Export all schemas for testing ----
export const schemas = {
  BasicLessonSchema,
  LoopDataSchema,
  StandardsSchema,
  RegistryEntrySchema,
  RegistryDataSchema,
  PrototypeQuestionSchema,
  PrototypesDataSchema,
  LessonStepSchema,
  LessonContentSchema,
  QuizQuestionSchema,
  QuestionSetSchema,
  activitySchema
} as const;