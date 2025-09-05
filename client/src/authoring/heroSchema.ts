/**
 * Extended schema definitions for hero lesson blocks
 * Extends the base schema v2 with new activity types for production lesson templates
 */

import { z } from 'zod';
import { I18nText } from './schema';

// ---- Re-define needed schemas locally for hero blocks ----

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

// Base activity with common a11y fields for hero blocks
const BaseActivityV2Schema = z.object({
  kind: z.string(), // Will be constrained in specific schemas
  id: z.string().min(1, 'Activity ID is required'),
  title: I18nText.optional(),
  description: I18nText.optional(),
  alt: z.string().optional(), // Alternative text for accessibility
  ariaLabel: z.string().optional(), // ARIA label for screen readers
});

// ---- Hero Lesson Block Types ----

// TeachBlock: Video instruction with transcript support
export const TeachBlockSchema = BaseActivityV2Schema.extend({
  kind: z.literal('teach_block'),
  title: I18nText,
  video: z.object({
    src: z.string().url('Video source must be a valid URL'),
    duration: z.number().positive('Duration must be positive'),
    poster: z.string().url().optional(),
    captions: z.array(CaptionTrackSchema).optional()
  }),
  transcript: z.object({
    text: I18nText,
    timestamps: z.array(z.object({
      time: z.number().min(0),
      text: z.string()
    })).optional()
  }).optional()
});

// GuidedPractice: Multi-step interactive practice with branching
export const GuidedPracticeSchema = BaseActivityV2Schema.extend({
  kind: z.literal('guided_practice'),
  title: I18nText,
  steps: z.array(z.object({
    id: z.string(),
    instruction: I18nText,
    question: I18nText,
    correctAnswer: z.union([z.string(), z.number()]),
    tolerance: z.number().optional(), // For numeric answers
    hints: z.array(I18nText).min(1),
    branchingPaths: z.record(z.object({
      condition: z.string(), // Expression like "answer < 0.3"
      remediation: I18nText,
      nextHint: I18nText.optional()
    })).optional()
  })).min(1, 'At least one step is required')
});

// IndependentPractice: Question bank with randomization
export const IndependentPracticeSchema = BaseActivityV2Schema.extend({
  kind: z.literal('independent_practice'),
  title: I18nText,
  questionBank: z.array(z.object({
    id: z.string(),
    question: I18nText,
    options: z.array(z.object({
      id: z.string(),
      text: I18nText
    })).min(2),
    correctAnswer: z.string(),
    explanation: I18nText,
    hint: I18nText.optional()
  })).min(1),
  randomize: z.boolean().default(true),
  questionsToShow: z.number().positive().optional(),
  passingScore: z.number().min(1).optional()
});

// ExitTicket: Mastery check with Compass routing
export const ExitTicketSchema = BaseActivityV2Schema.extend({
  kind: z.literal('exit_ticket'),
  title: I18nText,
  questions: z.array(z.discriminatedUnion('type', [
    z.object({
      id: z.string(),
      type: z.literal('ordering'),
      question: I18nText,
      items: z.array(z.object({
        id: z.string(),
        text: I18nText
      })).min(2),
      correctOrder: z.array(z.string()),
      explanation: I18nText.optional()
    }),
    z.object({
      id: z.string(),
      type: z.literal('open_response'),
      question: I18nText,
      rubric: z.object({
        key_concepts: z.array(z.string()),
        sample_response: z.string()
      }),
      explanation: I18nText.optional()
    }),
    z.object({
      id: z.string(),
      type: z.literal('multiple_choice'),
      question: I18nText,
      options: z.array(z.object({
        id: z.string(),
        text: I18nText
      })).min(2),
      correctAnswer: z.string(),
      explanation: I18nText.optional()
    })
  ])).min(1),
  masteryThreshold: z.number().min(0).max(1).default(0.8),
  compassLogic: z.object({
    onMastery: z.object({
      nextStep: z.enum(['journal_skill_practice', 'next_lesson', 'assessment']),
      skillId: z.string().optional(),
      lessonId: z.string().optional(),
      rationale: I18nText
    }),
    onNeedsPractice: z.object({
      nextStep: z.enum(['remediation_lesson', 'guided_practice_repeat', 'journal_review']),
      skillId: z.string().optional(), 
      lessonId: z.string().optional(),
      rationale: I18nText
    })
  })
});

// Extended Activity Schema including hero blocks
export const HeroActivitySchema = z.discriminatedUnion('kind', [
  TeachBlockSchema,
  GuidedPracticeSchema,
  IndependentPracticeSchema,
  ExitTicketSchema
]);

// ---- Type Exports ----
export type TeachBlockActivity = z.infer<typeof TeachBlockSchema>;
export type GuidedPracticeActivity = z.infer<typeof GuidedPracticeSchema>;
export type IndependentPracticeActivity = z.infer<typeof IndependentPracticeSchema>;
export type ExitTicketActivity = z.infer<typeof ExitTicketSchema>;
export type HeroActivity = z.infer<typeof HeroActivitySchema>;

// ---- Validation Utilities ----

/**
 * Validate hero lesson activity data
 */
export function validateHeroActivity(
  data: unknown,
  fileName?: string
): { success: true; data: HeroActivity } | { success: false; errors: string[] } {
  try {
    const result = HeroActivitySchema.safeParse(data);
    
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
 * Check if an activity is a hero lesson block type
 */
export function isHeroActivityType(activity: any): activity is HeroActivity {
  const heroKinds = ['teach_block', 'guided_practice', 'independent_practice', 'exit_ticket'];
  return activity && typeof activity === 'object' && heroKinds.includes(activity.kind);
}