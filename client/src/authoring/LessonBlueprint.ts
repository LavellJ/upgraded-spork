/**
 * Lesson Blueprint API for creating hero lessons from simplified input
 */

import { z } from 'zod';
import { nanoid } from 'nanoid';
import type { 
  HeroActivity, 
  TeachBlockActivity, 
  GuidedPracticeActivity, 
  IndependentPracticeActivity, 
  ExitTicketActivity 
} from './heroSchema';

// Blueprint input schema for simplified lesson creation
export const LessonBlueprintInputSchema = z.object({
  id: z.string().min(1, 'Lesson ID is required'),
  title: z.string().min(1, 'Title is required'),
  stdTag: z.string().min(1, 'Standards tag is required'), // e.g. "M.FRAC.NL.3"
  biome: z.enum(['reef', 'alpine', 'forest', 'desert']),
  
  // Teach block content
  teach: z.object({
    videoSrc: z.string().url('Video source must be valid URL'),
    captionsVtt: z.string().url('Captions VTT must be valid URL'),
    transcript: z.string().min(1, 'Transcript is required')
  }),
  
  // Guided practice steps
  steps: z.array(z.object({
    prompt: z.string().min(1, 'Step prompt is required'),
    correct: z.string().min(1, 'Correct answer is required'),
    distractors: z.array(z.string()).min(2, 'At least 2 distractors required'),
    hintPrimary: z.string().min(1, 'Primary hint is required'),
    hintAlt: z.string().optional(),
    miscueTag: z.string().optional() // For analytics tracking
  })).min(3, 'At least 3 guided steps required'),
  
  // Independent practice bank
  bank: z.array(z.object({
    prompt: z.string().min(1, 'Bank prompt is required'),
    kind: z.enum(['mc', 'input']).default('mc'),
    correct: z.string().min(1, 'Correct answer is required'),
    distractors: z.array(z.string()).optional(),
    hint: z.string().optional(),
    miscueTag: z.string().optional()
  })).min(5, 'At least 5 bank items required'),
  
  // Exit ticket items
  exit: z.array(z.object({
    prompt: z.string().min(1, 'Exit prompt is required'),
    correct: z.string().min(1, 'Correct answer is required'),
    distractors: z.array(z.string()).min(2, 'At least 2 distractors required')
  })).min(1, 'At least 1 exit item required'),
  
  // Metadata
  whyThis: z.string().min(1, 'WhyThis rationale is required'),
  nextStep: z.object({
    journalSkill: z.string().optional(),
    nextLessonId: z.string().optional()
  }).optional()
});

export type LessonBlueprintInput = z.infer<typeof LessonBlueprintInputSchema>;

/**
 * Create internationalized text object from string
 * Defaults to Australian English
 */
function createI18nText(text: string): Record<string, string> {
  return { 'en-AU': text };
}

/**
 * Generate unique activity ID
 */
function generateActivityId(prefix: string): string {
  return `${prefix}_${nanoid(8)}`;
}

/**
 * Create TeachBlock activity from blueprint
 */
function createTeachBlock(blueprint: LessonBlueprintInput): TeachBlockActivity {
  return {
    kind: 'teach_block' as const,
    id: generateActivityId('teach'),
    title: createI18nText(`Learn: ${blueprint.title}`),
    video: {
      src: blueprint.teach.videoSrc,
      duration: 90, // Default 90 seconds max for hero lessons
      captions: [{
        src: blueprint.teach.captionsVtt,
        srclang: 'en-AU',
        label: 'English (Australia)',
        default: true
      }]
    },
    transcript: {
      text: createI18nText(blueprint.teach.transcript)
    },
    alt: `Instructional video for ${blueprint.title}`,
    ariaLabel: `Interactive video player: ${blueprint.title}`
  };
}

/**
 * Create GuidedPractice activity from blueprint
 */
function createGuidedPractice(blueprint: LessonBlueprintInput): GuidedPracticeActivity {
  return {
    kind: 'guided_practice' as const,
    id: generateActivityId('guided'),
    title: createI18nText(`Practice: ${blueprint.title}`),
    steps: blueprint.steps.map((step, index) => ({
      id: generateActivityId(`step_${index + 1}`),
      instruction: createI18nText(`Step ${index + 1}`),
      question: createI18nText(step.prompt),
      correctAnswer: step.correct,
      hints: [
        createI18nText(step.hintPrimary),
        ...(step.hintAlt ? [createI18nText(step.hintAlt)] : [])
      ],
      branchingPaths: step.miscueTag ? {
        [step.miscueTag]: {
          condition: 'incorrect',
          remediation: createI18nText(`Let's try again. ${step.hintPrimary}`),
          nextHint: step.hintAlt ? createI18nText(step.hintAlt) : undefined
        }
      } : undefined
    }))
  };
}

/**
 * Create IndependentPractice activity from blueprint
 */
function createIndependentPractice(blueprint: LessonBlueprintInput): IndependentPracticeActivity {
  return {
    kind: 'independent_practice' as const,
    id: generateActivityId('independent'),
    title: createI18nText(`Apply: ${blueprint.title}`),
    questionBank: blueprint.bank.map((item, index) => ({
      id: generateActivityId(`bank_${index + 1}`),
      question: createI18nText(item.prompt),
      options: [
        { id: 'correct', text: createI18nText(item.correct) },
        ...(item.distractors || []).map((distractor, idx) => ({
          id: `option_${idx + 1}`,
          text: createI18nText(distractor)
        }))
      ],
      correctAnswer: 'correct',
      explanation: createI18nText(item.hint || 'Great work!'),
      hint: item.hint ? createI18nText(item.hint) : undefined
    })),
    randomize: true,
    questionsToShow: Math.min(blueprint.bank.length, 6),
    passingScore: 0.7
  };
}

/**
 * Create ExitTicket activity from blueprint
 */
function createExitTicket(blueprint: LessonBlueprintInput): ExitTicketActivity {
  return {
    kind: 'exit_ticket' as const,
    id: generateActivityId('exit'),
    title: createI18nText(`Check: ${blueprint.title}`),
    questions: blueprint.exit.map((item, index) => ({
      id: generateActivityId(`exit_${index + 1}`),
      type: 'multiple_choice' as const,
      question: createI18nText(item.prompt),
      options: [
        { id: 'correct', text: createI18nText(item.correct) },
        ...item.distractors.map((distractor, idx) => ({
          id: `option_${idx + 1}`,
          text: createI18nText(distractor)
        }))
      ],
      correctAnswer: 'correct',
      explanation: createI18nText('Excellent understanding!')
    })),
    masteryThreshold: 0.8,
    compassLogic: {
      onMastery: {
        nextStep: blueprint.nextStep?.nextLessonId ? 'next_lesson' : 'journal_skill_practice',
        skillId: blueprint.nextStep?.journalSkill || blueprint.stdTag,
        lessonId: blueprint.nextStep?.nextLessonId,
        rationale: createI18nText(blueprint.whyThis)
      },
      onNeedsPractice: {
        nextStep: 'journal_review',
        skillId: blueprint.stdTag,
        rationale: createI18nText('Let\'s practice this concept more to build confidence.')
      }
    }
  };
}

/**
 * Create complete hero lesson from blueprint input
 */
export function makeLessonFromBlueprint(blueprint: LessonBlueprintInput) {
  // Validate input
  const validated = LessonBlueprintInputSchema.parse(blueprint);
  
  // Create activities in the hero lesson flow order
  const activities: HeroActivity[] = [
    createTeachBlock(validated),
    createGuidedPractice(validated),
    createIndependentPractice(validated),
    createExitTicket(validated)
  ];

  // Create the complete lesson structure
  return {
    version: 2 as const,
    id: validated.id,
    biomeId: validated.biome,
    title: createI18nText(validated.title),
    summary: createI18nText(`Learn ${validated.title} with interactive practice and assessment.`),
    skills: [validated.stdTag],
    activities,
    standards: [{
      framework: 'australian-curriculum',
      code: validated.stdTag
    }],
    meta: {
      estimatedDuration: 15, // 15 minutes default
      difficultyLevel: 'grade-3',
      prerequisiteSkills: [],
      learningObjectives: [validated.whyThis],
      scoutCues: {
        celebration: 'Fantastic work on mastering this concept!',
        encouragement: 'You\'re doing great! Keep practicing.',
        nextSteps: validated.whyThis
      }
    }
  };
}

/**
 * Validate blueprint input and return validation errors if any
 */
export function validateBlueprint(input: unknown): {
  success: boolean;
  data?: LessonBlueprintInput;
  errors?: string[];
} {
  try {
    const result = LessonBlueprintInputSchema.safeParse(input);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
  } catch (error) {
    return { 
      success: false, 
      errors: [`Validation error: ${error}`] 
    };
  }
}

/**
 * Get blueprint template for a given subject area
 */
export function getBlueprintTemplate(subject: 'math' | 'english' | 'science'): Partial<LessonBlueprintInput> {
  const templates = {
    math: {
      biome: 'alpine' as const,
      teach: {
        videoSrc: '/videos/math-template.mp4',
        captionsVtt: '/captions/math-template.vtt',
        transcript: 'Mathematical concept explanation...'
      },
      whyThis: 'This mathematical concept builds foundational understanding for advanced problem-solving.'
    },
    english: {
      biome: 'desert' as const,
      teach: {
        videoSrc: '/videos/english-template.mp4',
        captionsVtt: '/captions/english-template.vtt',
        transcript: 'Reading comprehension strategy explanation...'
      },
      whyThis: 'Strong reading skills are essential for success across all subjects.'
    },
    science: {
      biome: 'reef' as const,
      teach: {
        videoSrc: '/videos/science-template.mp4',
        captionsVtt: '/captions/science-template.vtt',
        transcript: 'Scientific concept and investigation...'
      },
      whyThis: 'Understanding science helps us make sense of the natural world.'
    }
  };

  return templates[subject];
}