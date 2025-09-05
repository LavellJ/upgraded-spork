# Content System Documentation

This document describes the content system architecture, tuning workflow, and lesson quality metrics for LearnOz.

## Table of Contents

- [Content Architecture](#content-architecture)
- [Lesson Types](#lesson-types)
- [Tuning System](#tuning-system)
- [Quality Metrics (KPIs)](#quality-metrics-kpis)
- [Testing Framework](#testing-framework)
- [Analytics Integration](#analytics-integration)

## Content Architecture

LearnOz implements a multi-layered content system designed for adaptive learning experiences:

### Core Components

1. **Hero Lessons**: Carefully crafted flagship lessons for key concepts (e.g., M.FRAC.NL.3)
2. **Template Lessons**: AI-generated lessons from standardized templates
3. **Journal Practice**: Reinforcement activities generated based on lesson performance
4. **Compass Navigation**: Adaptive learning path management

### Content Pipeline

```
Content Studio → Template Creation → AI Generation → Tuning → Analytics → Optimization
```

## Lesson Types

### Hero Lessons

Hero lessons are the premium, hand-crafted learning experiences:

- **Target**: Key mathematical concepts (fractions, number sense, etc.)
- **Features**: Rich interactivity, adaptive branching, comprehensive remediation
- **Example**: `M.FRAC.NL.3` - Number Line Fractions for Grade 3
- **Quality Assurance**: Extensive E2E testing, KPI monitoring

### Template Lessons

Generated lessons using proven templates:

- **Scalability**: Rapid content creation for curriculum coverage
- **Consistency**: Standardized learning patterns and assessment
- **Customization**: Subject-specific templates (Math, English, Science)
- **Integration**: Full analytics and tuning support

## Tuning System

The tuning system enables data-driven content optimization without full lesson rewrites.

### Tuning Notes Structure

```typescript
interface TuningNote {
  id: string;              // Lesson or template identifier
  at: number;              // Timestamp of tuning application
  kind: 'lesson' | 'template' | 'activity';
  change: {
    difficultyDelta?: number;     // -3 to +3 difficulty adjustment
    hintsAdded?: number;          // Additional hint count
    hasWording?: boolean;         // Improved instruction clarity
  };
  rationale?: string;       // Why this tuning was applied
  author: string;          // Who created the tuning note
}
```

### Tuning Workflow

#### 1. Performance Analysis
Monitor lesson KPIs to identify optimization opportunities:
- Pass rate below 70%
- High hint usage (>80%)
- Excessive completion time
- High remediation branching rate

#### 2. Tuning Note Creation
Create targeted adjustments using Content Studio:

```typescript
// Example: Reduce difficulty for struggling students
const tuningNote = {
  id: 'M.FRAC.NL.3',
  kind: 'lesson',
  change: { 
    difficultyDelta: -1,    // Make easier
    hintsAdded: 2           // Add scaffolding
  },
  rationale: 'High retry rate indicates excessive difficulty',
  author: 'Teacher Smith'
};
```

#### 3. Application and Measurement
- Tuning applies automatically during lesson generation
- Analytics track `tuning_applied` and `difficulty_adjusted` events
- A/B comparison of pre/post tuning performance

### Difficulty Adjustment Logic

```typescript
function getAdjustedDifficultyLevel(lessonId: string, baseDifficulty: number): number {
  const notes = getTuningNotesById(lessonId);
  const totalDelta = notes.reduce((sum, note) => sum + (note.change.difficultyDelta || 0), 0);
  
  // Apply bounds: difficulty stays within [1, 10]
  return Math.max(1, Math.min(10, baseDifficulty + totalDelta));
}
```

### Storage and Persistence

- **Location**: `localStorage` key `'qi.tuning.v1'`
- **Format**: JSON array of tuning notes
- **Capacity**: ~500 tuning notes before storage optimization needed
- **Backup**: Manual export/import through Content Studio

## Quality Metrics (KPIs)

LearnOz tracks lesson-level quality metrics to guide content optimization.

### Core KPIs

#### Pass Rate
- **Definition**: Percentage of lesson attempts ending in successful completion
- **Target Range**: 75-85% (optimal challenge level)
- **Calculation**: `(successful_completions / total_attempts) * 100`

#### Time on Task (Median)
- **Definition**: Middle value of lesson completion times
- **Target Range**: 3-7 minutes for primary grades
- **Use**: Identifies content that's too easy (quick) or too difficult (slow)

#### Hint Usage Rate
- **Definition**: Percentage of lesson attempts using Scout guidance
- **Target Range**: 40-60% (appropriate scaffolding)
- **Calculation**: `(sessions_with_hints / total_sessions) * 100`

#### Remediation Branch Rate
- **Definition**: Percentage of lessons requiring additional practice
- **Target Range**: 20-30% (healthy challenge with support)
- **Triggers**: Multiple incorrect answers, repeated hint requests

### KPI Analysis Functions

```typescript
// Get comprehensive KPIs for lesson optimization
const heroKPIs = getHeroLessonKPIs(14); // Last 14 days
const templateKPIs = getTemplateLessonsKPIs(7); // Last 7 days

// Quality trend analysis
const trend = getLessonQualityTrend(['M.FRAC.NL.3'], 28);
// Returns: 'improving' | 'declining' | 'stable'
```

### KPI Dashboard Integration

Quality metrics surface in the Teacher Panel Insights section:

- **Lesson Performance**: Individual lesson KPI cards
- **Trend Analysis**: Historical performance graphs
- **Comparison Views**: Hero vs template lesson quality
- **Alert System**: Notifications for declining performance

## Testing Framework

### End-to-End Test Coverage

#### Hero Lesson Tests (`e2e/hero-full.spec.ts`)
- Clean completion flows
- Remediation branching scenarios  
- Hint usage and Scout interventions
- Compass navigation verification
- Journal practice enqueueing

#### Template Lesson Tests (`e2e/template-lesson.spec.ts`)
- Content Studio creation workflow
- Template parameter validation
- Generated lesson completion
- KPI data collection

#### Offline Functionality (`e2e/offline-hero.spec.ts`)
- Network disconnection handling
- Local storage fallbacks
- Service worker caching
- Progressive enhancement

### Unit Test Coverage

#### KPI Calculations (`client/test/kpi.lessons.spec.ts`)
- Pass rate calculation accuracy
- Time on task median computation
- Hint usage rate validation
- Trend analysis algorithms

#### Tuning System (`client/test/tuning.integration.spec.ts`)
- Note creation and storage
- Difficulty adjustment application
- Analytics event generation
- Multi-note cumulative effects

## Analytics Integration

### Event Tracking

Key events for tuning and KPI analysis:

```typescript
// Lesson completion events
{
  kind: 'lesson_finish',
  lessonId: 'M.FRAC.NL.3',
  result: 'pass' | 'retry',
  durationSec: 180,
  at: timestamp
}

// Tuning application events  
{
  kind: 'tuning_applied',
  lessonId: 'M.FRAC.NL.3',
  tuningId: 'note-abc123',
  difficultyDelta: -1,
  at: timestamp
}

// Scout intervention events
{
  kind: 'scout_msg',
  messageId: 'hint-123',
  priority: 'actionable',
  text: 'Try counting the equal parts',
  at: timestamp
}
```

### Data Pipeline

```
User Interaction → Progress Events → Local Storage → KPI Calculation → Insights Dashboard
```

### Performance Monitoring

- **Bundle Size**: KPI calculations <30KB bundle impact
- **Computation Speed**: Sub-100ms KPI recalculation
- **Storage Efficiency**: Event data compression and cleanup
- **Accessibility**: Lighthouse score ≥95 for all content interfaces

## Best Practices

### Content Creation
1. Start with template lessons for broad coverage
2. Promote high-performing templates to hero lesson status
3. Use tuning notes for iterative optimization
4. Monitor KPIs weekly for performance insights

### Tuning Strategy
1. **Data-Driven**: Base tuning decisions on actual KPI data
2. **Incremental**: Make small adjustments (-1/+1 difficulty)
3. **Documented**: Always include rationale for future reference
4. **Measured**: Track before/after performance impact

### Quality Assurance
1. **E2E Testing**: All lesson types must pass comprehensive test suites
2. **KPI Monitoring**: Weekly review of lesson performance metrics
3. **User Feedback**: Integrate qualitative feedback with quantitative data
4. **Accessibility**: Ensure WCAG AA compliance for all content

---

*Last Updated: January 2025*  
*Documentation Version: 2.1*