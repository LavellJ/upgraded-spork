/**
 * Schema v2 for lessons and registry with i18n support
 * Provides versioned schemas with locale-aware content fields
 */

import { z } from 'zod';

// ---- ID Validation ----
export const LessonId = z.string().regex(/^[a-z0-9_.-]+$/, 'Lesson ID must contain only lowercase letters, numbers, underscores, dots, and hyphens');
export const SkillId = z.string().regex(/^[a-z0-9_.-]+$/, 'Skill ID must contain only lowercase letters, numbers, underscores, dots, and hyphens');

// ---- Locale Support ----
export const Locale = z.enum(['en-AU', 'en-US', 'en-GB']);

export const I18nText = z.object({
  'en-AU': z.string().optional(),
  'en-US': z.string().optional(), 
  'en-GB': z.string().optional()
}).refine(
  v => Object.values(v).some(Boolean),
  'At least one locale string required'
);

// ---- Activity Schemas with A11y Fields ----

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

// Base activity with common a11y fields
const BaseActivityV2Schema = z.object({
  kind: z.enum(['video', 'read', 'quiz', 'manip']),
  title: I18nText.optional(),
  description: I18nText.optional(),
  alt: z.string().optional(), // Alternative text for accessibility
  ariaLabel: z.string().optional(), // ARIA label for screen readers
});

// Video activity with enhanced a11y support
const VideoActivityV2Schema = BaseActivityV2Schema.extend({
  kind: z.literal('video'),
  src: z.string().url('Video source must be a valid URL'),
  type: z.string().optional().default('video/mp4'),
  captions: z.array(CaptionTrackSchema).optional(),
  transcript: TranscriptSchema.optional(),
  audiodescription: z.string().url().optional(), // Audio description track
});

// Read activity
const ReadActivityV2Schema = BaseActivityV2Schema.extend({
  kind: z.literal('read'),
  content: I18nText,
});

// Quiz activity
const QuizActivityV2Schema = BaseActivityV2Schema.extend({
  kind: z.literal('quiz'),
  questionSetId: z.string().min(1, 'Question set ID is required'),
});

// Manipulative activity (interactive)
const ManipActivityV2Schema = BaseActivityV2Schema.extend({
  kind: z.literal('manip'),
  interactionType: z.string().min(1, 'Interaction type is required'),
  config: z.record(z.any()).optional(),
});

// Activity discriminated union
const ActivityV2Schema = z.discriminatedUnion('kind', [
  VideoActivityV2Schema,
  ReadActivityV2Schema,
  QuizActivityV2Schema,
  ManipActivityV2Schema
]);

// ---- Standards Schema ----
const StandardV2Schema = z.object({
  framework: z.string().min(1, 'Framework name is required'),
  code: z.string().min(1, 'Standard code is required')
});

// ---- Lesson Schema v2 ----
export const LessonV2 = z.object({
  version: z.literal(2),
  id: LessonId,
  biomeId: z.string().min(1, 'Biome ID is required'),
  title: I18nText,
  summary: I18nText.optional(),
  skills: z.array(SkillId).min(1, 'At least one skill is required'),
  activities: z.array(ActivityV2Schema).min(1, 'At least one activity is required'),
  standards: z.array(StandardV2Schema).optional(),
  assets: z.array(z.string()).optional(),
  meta: z.record(z.any()).optional()
});

// ---- Skill Schema ----
const SkillV2Schema = z.object({
  id: SkillId,
  label: I18nText
});

// ---- Registry Schema v2 ----
export const RegistryV2 = z.object({
  version: z.literal(2),
  lessons: z.array(LessonV2),
  skills: z.array(SkillV2Schema).optional(),
  frameworks: z.record(z.array(z.string())).optional() // mapping framework keys → codes
});

// ---- Type Exports ----
export type LessonV2 = z.infer<typeof LessonV2>;
export type RegistryV2 = z.infer<typeof RegistryV2>;
export type Locale = z.infer<typeof Locale>;
export type I18nText = z.infer<typeof I18nText>;
export type ActivityV2 = z.infer<typeof ActivityV2Schema>;
export type VideoActivityV2 = z.infer<typeof VideoActivityV2Schema>;
export type ReadActivityV2 = z.infer<typeof ReadActivityV2Schema>;
export type QuizActivityV2 = z.infer<typeof QuizActivityV2Schema>;
export type ManipActivityV2 = z.infer<typeof ManipActivityV2Schema>;
export type StandardV2 = z.infer<typeof StandardV2Schema>;
export type SkillV2 = z.infer<typeof SkillV2Schema>;
export type CaptionTrack = z.infer<typeof CaptionTrackSchema>;
export type Transcript = z.infer<typeof TranscriptSchema>;

// ---- Validation Utilities ----

/**
 * Validate registry v2 data with comprehensive error reporting
 */
export function validateRegistryV2(
  data: unknown,
  fileName?: string
): { success: true; data: RegistryV2 } | { success: false; errors: string[] } {
  try {
    const result = RegistryV2.safeParse(data);
    
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
 * Validate lesson v2 data
 */
export function validateLessonV2(
  data: unknown,
  fileName?: string
): { success: true; data: LessonV2 } | { success: false; errors: string[] } {
  try {
    const result = LessonV2.safeParse(data);
    
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

// ---- Export schemas for testing ----
export const schemasV2 = {
  LessonId,
  SkillId,
  Locale,
  I18nText,
  LessonV2,
  RegistryV2,
  ActivityV2Schema,
  VideoActivityV2Schema,
  ReadActivityV2Schema,
  QuizActivityV2Schema,
  ManipActivityV2Schema
} as const;