import { describe, it, expect } from 'vitest';
import { validateHeroActivity } from '../../authoring/heroSchema';
import type {
  TeachBlockActivity,
  GuidedPracticeActivity,
  IndependentPracticeActivity,
  ExitTicketActivity
} from '../../authoring/heroSchema';

describe('Hero Lesson Schema Validation', () => {
  describe('TeachBlock validation', () => {
    it('validates correct teach block structure', () => {
      const validTeachBlock: TeachBlockActivity = {
        id: 'teach-1',
        kind: 'teach_block',
        title: { 'en-AU': 'Introduction to Fractions' },
        content: {
          videoUrl: '/videos/fractions-intro.mp4',
          duration: 180,
          transcript: { 'en-AU': 'Welcome to learning about fractions...' },
          captions: '/videos/fractions-intro.vtt'
        }
      };

      const result = validateHeroActivity(validTeachBlock, 'Test TeachBlock');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validTeachBlock);
    });

    it('rejects teach block with missing required fields', () => {
      const invalidTeachBlock = {
        id: 'teach-1',
        kind: 'teach_block',
        title: { 'en-AU': 'Introduction to Fractions' }
        // Missing content
      };

      const result = validateHeroActivity(invalidTeachBlock, 'Invalid TeachBlock');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid TeachBlock: Missing required field "content"');
    });

    it('rejects teach block with invalid video URL', () => {
      const invalidTeachBlock = {
        id: 'teach-1',
        kind: 'teach_block',
        title: { 'en-AU': 'Introduction to Fractions' },
        content: {
          videoUrl: '', // Empty URL
          duration: 180
        }
      };

      const result = validateHeroActivity(invalidTeachBlock, 'Invalid TeachBlock');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid TeachBlock: videoUrl must be a non-empty string');
    });

    it('rejects teach block with negative duration', () => {
      const invalidTeachBlock = {
        id: 'teach-1',
        kind: 'teach_block',
        title: { 'en-AU': 'Introduction to Fractions' },
        content: {
          videoUrl: '/test.mp4',
          duration: -10 // Negative duration
        }
      };

      const result = validateHeroActivity(invalidTeachBlock, 'Invalid TeachBlock');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid TeachBlock: duration must be a positive number');
    });
  });

  describe('GuidedPractice validation', () => {
    it('validates correct guided practice structure', () => {
      const validGuidedPractice: GuidedPracticeActivity = {
        id: 'guided-1',
        kind: 'guided_practice',
        title: { 'en-AU': 'Practice with Fractions' },
        steps: [
          {
            id: 'step-1',
            instruction: { 'en-AU': 'Look at the number line.' },
            question: { 'en-AU': 'What fraction is shown?' },
            correctAnswer: '1/4',
            hints: [
              { 'en-AU': 'Count the equal parts.' }
            ]
          }
        ]
      };

      const result = validateHeroActivity(validGuidedPractice, 'Test GuidedPractice');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validGuidedPractice);
    });

    it('rejects guided practice with empty steps array', () => {
      const invalidGuidedPractice = {
        id: 'guided-1',
        kind: 'guided_practice',
        title: { 'en-AU': 'Practice with Fractions' },
        steps: [] // Empty steps
      };

      const result = validateHeroActivity(invalidGuidedPractice, 'Invalid GuidedPractice');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid GuidedPractice: steps array cannot be empty');
    });

    it('validates step with branching paths', () => {
      const guidedPracticeWithBranching: GuidedPracticeActivity = {
        id: 'guided-1',
        kind: 'guided_practice',
        title: { 'en-AU': 'Practice with Fractions' },
        steps: [
          {
            id: 'step-1',
            instruction: { 'en-AU': 'Look at the number line.' },
            question: { 'en-AU': 'What fraction is shown?' },
            correctAnswer: 0.5,
            tolerance: 0.01,
            hints: [
              { 'en-AU': 'Count the equal parts.' }
            ],
            branchingPaths: {
              'wrong_answer': {
                condition: 'answer === 0.25',
                remediation: { 'en-AU': 'Look more carefully at the position.' },
                nextHint: true
              }
            }
          }
        ]
      };

      const result = validateHeroActivity(guidedPracticeWithBranching, 'Branching GuidedPractice');
      expect(result.success).toBe(true);
    });

    it('rejects step with invalid branching condition', () => {
      const invalidGuidedPractice = {
        id: 'guided-1',
        kind: 'guided_practice',
        title: { 'en-AU': 'Practice with Fractions' },
        steps: [
          {
            id: 'step-1',
            instruction: { 'en-AU': 'Look at the number line.' },
            question: { 'en-AU': 'What fraction is shown?' },
            correctAnswer: '1/4',
            hints: [{ 'en-AU': 'Count the equal parts.' }],
            branchingPaths: {
              'invalid': {
                condition: '', // Empty condition
                remediation: { 'en-AU': 'Try again.' }
              }
            }
          }
        ]
      };

      const result = validateHeroActivity(invalidGuidedPractice, 'Invalid Branching');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid Branching: branching condition cannot be empty');
    });
  });

  describe('IndependentPractice validation', () => {
    it('validates correct independent practice structure', () => {
      const validIndependentPractice: IndependentPracticeActivity = {
        id: 'independent-1',
        kind: 'independent_practice',
        title: { 'en-AU': 'Fraction Quiz' },
        questionsToShow: 3,
        randomize: true,
        passingScore: 2,
        questionBank: [
          {
            id: 'q1',
            question: { 'en-AU': 'Which equals 1/2?' },
            options: [
              { id: 'a', text: { 'en-AU': '2/4' } },
              { id: 'b', text: { 'en-AU': '1/3' } }
            ],
            correctAnswer: 'a',
            explanation: { 'en-AU': '2/4 simplifies to 1/2.' }
          },
          {
            id: 'q2',
            question: { 'en-AU': 'What is 1/4 + 1/4?' },
            options: [
              { id: 'a', text: { 'en-AU': '1/2' } },
              { id: 'b', text: { 'en-AU': '2/8' } }
            ],
            correctAnswer: 'a',
            explanation: { 'en-AU': '1/4 + 1/4 = 2/4 = 1/2.' }
          }
        ]
      };

      const result = validateHeroActivity(validIndependentPractice, 'Test IndependentPractice');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validIndependentPractice);
    });

    it('rejects independent practice with empty question bank', () => {
      const invalidIndependentPractice = {
        id: 'independent-1',
        kind: 'independent_practice',
        title: { 'en-AU': 'Fraction Quiz' },
        questionsToShow: 3,
        questionBank: [] // Empty question bank
      };

      const result = validateHeroActivity(invalidIndependentPractice, 'Invalid IndependentPractice');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid IndependentPractice: questionBank cannot be empty');
    });

    it('rejects question with invalid correctAnswer reference', () => {
      const invalidIndependentPractice = {
        id: 'independent-1',
        kind: 'independent_practice',
        title: { 'en-AU': 'Fraction Quiz' },
        questionBank: [
          {
            id: 'q1',
            question: { 'en-AU': 'Which equals 1/2?' },
            options: [
              { id: 'a', text: { 'en-AU': '2/4' } },
              { id: 'b', text: { 'en-AU': '1/3' } }
            ],
            correctAnswer: 'c', // References non-existent option
            explanation: { 'en-AU': 'Test explanation.' }
          }
        ]
      };

      const result = validateHeroActivity(invalidIndependentPractice, 'Invalid Question');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid Question: correctAnswer "c" does not match any option ID');
    });

    it('validates questionsToShow does not exceed question bank size', () => {
      const invalidIndependentPractice = {
        id: 'independent-1',
        kind: 'independent_practice',
        title: { 'en-AU': 'Fraction Quiz' },
        questionsToShow: 5, // More than available questions
        questionBank: [
          {
            id: 'q1',
            question: { 'en-AU': 'Test question' },
            options: [{ id: 'a', text: { 'en-AU': 'Option A' } }],
            correctAnswer: 'a',
            explanation: { 'en-AU': 'Test explanation.' }
          }
        ]
      };

      const result = validateHeroActivity(invalidIndependentPractice, 'Invalid QuestionsToShow');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid QuestionsToShow: questionsToShow (5) cannot exceed questionBank size (1)');
    });
  });

  describe('ExitTicket validation', () => {
    it('validates correct exit ticket structure', () => {
      const validExitTicket: ExitTicketActivity = {
        id: 'exit-1',
        kind: 'exit_ticket',
        title: { 'en-AU': 'Check Your Understanding' },
        masteryThreshold: 0.8,
        questions: [
          {
            id: 'exit-q1',
            type: 'multiple_choice',
            question: { 'en-AU': 'Which shows 3/4?' },
            options: [
              { id: 'a', text: { 'en-AU': 'Three parts shaded' } },
              { id: 'b', text: { 'en-AU': 'Four parts shaded' } }
            ],
            correctAnswer: 'a'
          }
        ],
        compassLogic: {
          onMastery: {
            nextStep: 'advance_skill',
            skillId: 'fractions_advanced',
            rationale: { 'en-AU': 'Ready for advanced concepts!' }
          },
          onNeedsPractice: {
            nextStep: 'repeat_practice',
            skillId: 'fractions_basic',
            rationale: { 'en-AU': 'More practice needed.' }
          }
        }
      };

      const result = validateHeroActivity(validExitTicket, 'Test ExitTicket');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validExitTicket);
    });

    it('validates ordering question type', () => {
      const exitTicketWithOrdering: ExitTicketActivity = {
        id: 'exit-1',
        kind: 'exit_ticket',
        title: { 'en-AU': 'Order the Steps' },
        masteryThreshold: 0.7,
        questions: [
          {
            id: 'exit-q1',
            type: 'ordering',
            question: { 'en-AU': 'Put these steps in the correct order:' },
            items: [
              { id: 'step1', text: { 'en-AU': 'Count the parts' } },
              { id: 'step2', text: { 'en-AU': 'Identify the denominator' } },
              { id: 'step3', text: { 'en-AU': 'Write the fraction' } }
            ],
            correctOrder: ['step1', 'step2', 'step3']
          }
        ],
        compassLogic: {
          onMastery: {
            nextStep: 'advance_skill',
            rationale: { 'en-AU': 'Great!' }
          },
          onNeedsPractice: {
            nextStep: 'repeat_practice',
            rationale: { 'en-AU': 'Try again!' }
          }
        }
      };

      const result = validateHeroActivity(exitTicketWithOrdering, 'Ordering ExitTicket');
      expect(result.success).toBe(true);
    });

    it('validates open response question type', () => {
      const exitTicketWithOpenResponse: ExitTicketActivity = {
        id: 'exit-1',
        kind: 'exit_ticket',
        title: { 'en-AU': 'Explain Your Thinking' },
        masteryThreshold: 0.6,
        questions: [
          {
            id: 'exit-q1',
            type: 'open_response',
            question: { 'en-AU': 'Explain what a fraction represents.' },
            rubric: {
              key_concepts: ['parts', 'whole', 'equal', 'denominator', 'numerator'],
              max_score: 5
            }
          }
        ],
        compassLogic: {
          onMastery: {
            nextStep: 'advance_skill',
            rationale: { 'en-AU': 'Excellent understanding!' }
          },
          onNeedsPractice: {
            nextStep: 'repeat_practice',
            rationale: { 'en-AU': 'More explanation practice needed.' }
          }
        }
      };

      const result = validateHeroActivity(exitTicketWithOpenResponse, 'Open Response ExitTicket');
      expect(result.success).toBe(true);
    });

    it('rejects exit ticket with invalid mastery threshold', () => {
      const invalidExitTicket = {
        id: 'exit-1',
        kind: 'exit_ticket',
        title: { 'en-AU': 'Check Your Understanding' },
        masteryThreshold: 1.5, // Invalid threshold > 1
        questions: [
          {
            id: 'exit-q1',
            type: 'multiple_choice',
            question: { 'en-AU': 'Test question' },
            options: [{ id: 'a', text: { 'en-AU': 'Option A' } }],
            correctAnswer: 'a'
          }
        ],
        compassLogic: {
          onMastery: {
            nextStep: 'advance_skill',
            rationale: { 'en-AU': 'Great!' }
          },
          onNeedsPractice: {
            nextStep: 'repeat_practice',
            rationale: { 'en-AU': 'Try again!' }
          }
        }
      };

      const result = validateHeroActivity(invalidExitTicket, 'Invalid ExitTicket');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid ExitTicket: masteryThreshold must be between 0 and 1');
    });

    it('rejects exit ticket without compass logic', () => {
      const invalidExitTicket = {
        id: 'exit-1',
        kind: 'exit_ticket',
        title: { 'en-AU': 'Check Your Understanding' },
        masteryThreshold: 0.8,
        questions: [
          {
            id: 'exit-q1',
            type: 'multiple_choice',
            question: { 'en-AU': 'Test question' },
            options: [{ id: 'a', text: { 'en-AU': 'Option A' } }],
            correctAnswer: 'a'
          }
        ]
        // Missing compassLogic
      };

      const result = validateHeroActivity(invalidExitTicket, 'Invalid ExitTicket');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid ExitTicket: Missing required field "compassLogic"');
    });
  });

  describe('General validation', () => {
    it('rejects activity with missing id', () => {
      const invalidActivity = {
        kind: 'teach_block',
        title: { 'en-AU': 'Test' }
        // Missing id
      };

      const result = validateHeroActivity(invalidActivity, 'Missing ID');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Missing ID: Missing required field "id"');
    });

    it('rejects activity with invalid kind', () => {
      const invalidActivity = {
        id: 'test-1',
        kind: 'invalid_kind',
        title: { 'en-AU': 'Test' }
      };

      const result = validateHeroActivity(invalidActivity, 'Invalid Kind');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid Kind: Unsupported activity kind "invalid_kind"');
    });

    it('rejects activity with missing localized title', () => {
      const invalidActivity = {
        id: 'test-1',
        kind: 'teach_block',
        title: {} // Empty title object
      };

      const result = validateHeroActivity(invalidActivity, 'Missing Title');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Missing Title: title must have "en-AU" localization');
    });
  });
});