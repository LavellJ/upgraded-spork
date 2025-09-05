import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroLessonLoader } from '../HeroLessonLoader';
import { TeachBlock } from '../blocks/TeachBlock';
import { GuidedPractice } from '../blocks/GuidedPractice';
import { IndependentPractice } from '../blocks/IndependentPractice';
import { ExitTicket } from '../blocks/ExitTicket';
import type { 
  TeachBlockActivity, 
  GuidedPracticeActivity, 
  IndependentPracticeActivity,
  ExitTicketActivity 
} from '../../authoring/heroSchema';

// Mock fetch globally
global.fetch = vi.fn();

// Mock other dependencies
vi.mock('../../profile/context', () => ({
  useProfile: () => ({ profile: { age: 8, name: 'Test Explorer' } })
}));

vi.mock('../../roster/context', () => ({
  useRoster: () => ({ activeLearner: { id: 'test-learner' } })
}));

vi.mock('../../hooks/useScoutQueue', () => ({
  useScoutQueue: () => ({ enqueue: vi.fn() })
}));

vi.mock('../../learning/scout', () => ({
  pickScoutLine: () => ({ text: 'Great job, Explorer!' })
}));

vi.mock('../../progress/events', () => ({
  pushEvent: vi.fn()
}));

vi.mock('../../analytics/onTask', () => ({
  startOnTask: vi.fn(),
  stopOnTask: vi.fn()
}));

describe('HeroLessonLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <HeroLessonLoader
        packId="core-math-hero"
        lessonId="hero_fractions_numberline"
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByTestId('hero-lesson-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading Lesson')).toBeInTheDocument();
    expect(screen.getByText('Pack: core-math-hero • Lesson: hero_fractions_numberline')).toBeInTheDocument();
  });

  it('shows error when lesson not found', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    } as Response);

    render(
      <HeroLessonLoader
        packId="core-math-hero"
        lessonId="missing_lesson"
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('hero-lesson-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Unable to Load Lesson')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveTextContent('Lesson not found: core-math-hero/missing_lesson');
  });

  it('validates lesson structure and shows validation errors', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        version: 2,
        id: 'test-lesson',
        activities: [
          { kind: 'invalid_activity_type' } // Invalid activity
        ]
      })
    } as Response);

    render(
      <HeroLessonLoader
        packId="test-pack"
        lessonId="test-lesson"
        onComplete={vi.fn()}
        onExit={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('hero-lesson-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Lesson contains invalid activities. Please check the structure.')).toBeInTheDocument();
  });
});

describe('TeachBlock', () => {
  const mockTeachActivity: TeachBlockActivity = {
    id: 'teach-1',
    kind: 'teach_block',
    title: { 'en-AU': 'Introduction to Fractions' },
    content: {
      videoUrl: '/test-video.mp4',
      duration: 180,
      transcript: { 'en-AU': 'Welcome to fractions...' },
      captions: '/test-captions.vtt'
    }
  };

  it('renders video player with controls', () => {
    render(
      <TeachBlock
        activity={mockTeachActivity}
        onComplete={vi.fn()}
        onEvent={vi.fn()}
      />
    );

    expect(screen.getByTestId('teach-block-container')).toBeInTheDocument();
    expect(screen.getByTestId('teach-block-title')).toHaveTextContent('Introduction to Fractions');
    
    const video = screen.getByTestId('lesson-video');
    expect(video).toHaveAttribute('src', '/test-video.mp4');
    expect(video).toHaveAttribute('controls');
  });

  it('shows transcript when button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TeachBlock
        activity={mockTeachActivity}
        onComplete={vi.fn()}
        onEvent={vi.fn()}
      />
    );

    const transcriptButton = screen.getByTestId('show-transcript-button');
    await user.click(transcriptButton);

    expect(screen.getByTestId('transcript-content')).toBeInTheDocument();
    expect(screen.getByText('Welcome to fractions...')).toBeInTheDocument();
  });

  it('calls onComplete when continue is clicked', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    
    render(
      <TeachBlock
        activity={mockTeachActivity}
        onComplete={onComplete}
        onEvent={vi.fn()}
      />
    );

    const continueButton = screen.getByTestId('continue-button');
    await user.click(continueButton);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe('GuidedPractice', () => {
  const mockGuidedActivity: GuidedPracticeActivity = {
    id: 'guided-1',
    kind: 'guided_practice',
    title: { 'en-AU': 'Practice with Fractions' },
    steps: [
      {
        id: 'step-1',
        instruction: { 'en-AU': 'Look at the number line below.' },
        question: { 'en-AU': 'What fraction is shown at point A?' },
        correctAnswer: '1/4',
        tolerance: 0.01,
        hints: [
          { 'en-AU': 'Count the equal parts between 0 and 1.' },
          { 'en-AU': 'Point A is at the first mark.' }
        ],
        branchingPaths: {
          'common_error': {
            condition: 'answer === "1/2"',
            remediation: { 'en-AU': 'Remember to count all the equal parts, not just the ones before point A.' },
            nextHint: true
          }
        }
      }
    ]
  };

  it('renders first step with question and input', () => {
    render(
      <GuidedPractice
        activity={mockGuidedActivity}
        onComplete={vi.fn()}
        onEvent={vi.fn()}
      />
    );

    expect(screen.getByTestId('guided-practice-container')).toBeInTheDocument();
    expect(screen.getByTestId('guided-practice-title')).toHaveTextContent('Practice with Fractions');
    expect(screen.getByTestId('step-instruction')).toHaveTextContent('Look at the number line below.');
    expect(screen.getByText('What fraction is shown at point A?')).toBeInTheDocument();
    expect(screen.getByTestId('answer-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-answer-button')).toBeInTheDocument();
  });

  it('shows correct feedback for right answer', async () => {
    const user = userEvent.setup();
    
    render(
      <GuidedPractice
        activity={mockGuidedActivity}
        onComplete={vi.fn()}
        onEvent={vi.fn()}
      />
    );

    const input = screen.getByTestId('answer-input');
    const submitButton = screen.getByTestId('submit-answer-button');

    await user.type(input, '1/4');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('correct-feedback')).toBeInTheDocument();
    });

    expect(screen.getByText('Correct! Well done.')).toBeInTheDocument();
  });

  it('shows branching message for common error', async () => {
    const user = userEvent.setup();
    
    render(
      <GuidedPractice
        activity={mockGuidedActivity}
        onComplete={vi.fn()}
        onEvent={vi.fn()}
      />
    );

    const input = screen.getByTestId('answer-input');
    const submitButton = screen.getByTestId('submit-answer-button');

    await user.type(input, '1/2');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('incorrect-feedback')).toBeInTheDocument();
    });

    expect(screen.getByTestId('branching-message')).toHaveTextContent(
      'Remember to count all the equal parts, not just the ones before point A.'
    );
  });

  it('shows hint when hint button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <GuidedPractice
        activity={mockGuidedActivity}
        onComplete={vi.fn()}
        onEvent={vi.fn()}
      />
    );

    const hintButton = screen.getByTestId('show-hint-button');
    await user.click(hintButton);

    expect(screen.getByTestId('current-hint')).toHaveTextContent(
      'Count the equal parts between 0 and 1.'
    );
  });
});

describe('IndependentPractice', () => {
  const mockIndependentActivity: IndependentPracticeActivity = {
    id: 'independent-1',
    kind: 'independent_practice',
    title: { 'en-AU': 'Fraction Quiz' },
    questionsToShow: 2,
    randomize: true,
    passingScore: 2,
    questionBank: [
      {
        id: 'q1',
        question: { 'en-AU': 'Which fraction equals 1/2?' },
        options: [
          { id: 'a', text: { 'en-AU': '2/4' } },
          { id: 'b', text: { 'en-AU': '1/3' } },
          { id: 'c', text: { 'en-AU': '3/4' } }
        ],
        correctAnswer: 'a',
        explanation: { 'en-AU': '2/4 simplifies to 1/2 because 2÷2 = 1 and 4÷2 = 2.' },
        hint: { 'en-AU': 'Think about which fraction has the same value as 1/2.' }
      },
      {
        id: 'q2',
        question: { 'en-AU': 'What is 1/4 + 1/4?' },
        options: [
          { id: 'a', text: { 'en-AU': '1/2' } },
          { id: 'b', text: { 'en-AU': '2/8' } },
          { id: 'c', text: { 'en-AU': '1/8' } }
        ],
        correctAnswer: 'a',
        explanation: { 'en-AU': '1/4 + 1/4 = 2/4 = 1/2.' }
      }
    ]
  };

  it('renders question with multiple choice options', async () => {
    render(
      <IndependentPractice
        activity={mockIndependentActivity}
        onComplete={vi.fn()}
        onEvent={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('independent-practice-container')).toBeInTheDocument();
    });

    expect(screen.getByTestId('independent-practice-title')).toHaveTextContent('Fraction Quiz');
    expect(screen.getByTestId('question-text')).toBeInTheDocument();
    expect(screen.getByTestId('submit-question-button')).toBeInTheDocument();
  });

  it('shows feedback after answer submission', async () => {
    const user = userEvent.setup();
    
    render(
      <IndependentPractice
        activity={mockIndependentActivity}
        onComplete={vi.fn()}
        onEvent={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('option-a')).toBeInTheDocument();
    });

    const optionA = screen.getByTestId('option-a');
    await user.click(optionA);

    const submitButton = screen.getByTestId('submit-question-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('correct-feedback')).toBeInTheDocument();
    });
  });

  it('completes practice session after all questions', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    
    render(
      <IndependentPractice
        activity={mockIndependentActivity}
        onComplete={onComplete}
        onEvent={vi.fn()}
      />
    );

    // Answer first question
    await waitFor(() => {
      expect(screen.getByTestId('option-a')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('option-a'));
    await user.click(screen.getByTestId('submit-question-button'));

    // Wait for auto-advance to second question
    await waitFor(() => {
      expect(screen.getByTestId('question-text')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Answer second question
    await waitFor(() => {
      expect(screen.getByTestId('option-a')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('option-a'));
    await user.click(screen.getByTestId('submit-question-button'));

    // Should complete and call onComplete
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(2, expect.any(Array));
    }, { timeout: 5000 });
  });
});

describe('ExitTicket', () => {
  const mockExitActivity: ExitTicketActivity = {
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
          { id: 'a', text: { 'en-AU': 'Three out of four parts shaded' } },
          { id: 'b', text: { 'en-AU': 'Four out of three parts shaded' } }
        ],
        correctAnswer: 'a'
      }
    ],
    compassLogic: {
      onMastery: {
        nextStep: 'advance_skill',
        skillId: 'fractions_advanced',
        rationale: { 'en-AU': 'Great work! You\'re ready for more advanced fraction concepts.' }
      },
      onNeedsPractice: {
        nextStep: 'repeat_practice',
        skillId: 'fractions_basic',
        rationale: { 'en-AU': 'Let\'s practice more with basic fractions to build your confidence.' }
      }
    }
  };

  it('renders assessment questions', () => {
    render(
      <ExitTicket
        activity={mockExitActivity}
        onComplete={vi.fn()}
        onEvent={vi.fn()}
      />
    );

    expect(screen.getByTestId('exit-ticket-container')).toBeInTheDocument();
    expect(screen.getByTestId('exit-ticket-title')).toHaveTextContent('Check Your Understanding');
    expect(screen.getByTestId('question-text')).toHaveTextContent('Which shows 3/4?');
    expect(screen.getByTestId('mc-option-a')).toBeInTheDocument();
    expect(screen.getByTestId('mc-option-b')).toBeInTheDocument();
  });

  it('shows mastery results with compass routing', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    
    render(
      <ExitTicket
        activity={mockExitActivity}
        onComplete={onComplete}
        onEvent={vi.fn()}
      />
    );

    // Answer correctly
    await user.click(screen.getByTestId('mc-option-a'));
    await user.click(screen.getByTestId('submit-exit-question-button'));

    await waitFor(() => {
      expect(screen.getByTestId('exit-ticket-complete')).toBeInTheDocument();
    });

    expect(screen.getByText('Mastery Achieved!')).toBeInTheDocument();
    expect(screen.getByTestId('compass-rationale')).toHaveTextContent(
      'Great work! You\'re ready for more advanced fraction concepts.'
    );

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        masteryAchieved: true,
        nextStep: expect.objectContaining({
          type: 'advance_skill',
          skillId: 'fractions_advanced'
        })
      })
    );
  });
});

describe('Integration: Full Lesson Flow', () => {
  const mockLessonData = {
    version: 2,
    id: 'test-lesson',
    biomeId: 'forest',
    title: { 'en-AU': 'Test Lesson' },
    skills: ['fractions'],
    activities: [
      {
        id: 'teach-1',
        kind: 'teach_block',
        title: { 'en-AU': 'Introduction' },
        content: {
          videoUrl: '/test.mp4',
          duration: 60,
          transcript: { 'en-AU': 'Test transcript' }
        }
      }
    ],
    standards: [],
    meta: {
      estimatedDuration: 300,
      difficultyLevel: 'beginner'
    }
  };

  it('tracks lesson completion events', async () => {
    const mockPushEvent = vi.mocked(await import('../../progress/events')).pushEvent;
    const user = userEvent.setup();
    const onComplete = vi.fn();
    
    const { HeroLessonRunner } = await import('../HeroLessonRunner');
    
    render(
      <HeroLessonRunner
        lessonData={mockLessonData as any}
        onComplete={onComplete}
        onExit={vi.fn()}
      />
    );

    // Should log lesson start
    expect(mockPushEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'lesson_start',
        lessonId: 'test-lesson',
        biomeId: 'forest'
      }),
      'test-learner'
    );

    // Complete the teach block
    const continueButton = screen.getByTestId('continue-button');
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId('lesson-complete-screen')).toBeInTheDocument();
    });

    // Should log lesson finish
    expect(mockPushEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'lesson_finish',
        lessonId: 'test-lesson',
        biomeId: 'forest',
        result: 'pass'
      }),
      'test-learner'
    );
  });
});