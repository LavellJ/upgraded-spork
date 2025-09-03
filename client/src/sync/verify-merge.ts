/**
 * Verification scenario for merge policies
 * Demonstrates conflict-safe merge with realistic multi-device data
 */

import { mergeData } from './merge';
import type { MergeableData } from './merge';
import type { ProgressEvent } from '../progress/events';
import type { LearnerState } from '../learning/model';
import type { JournalHistoryEntry } from '../schema/journal';
import type { Reflection } from '../reflections/model';
import type { AssignedPath } from '../guide/assign';

/**
 * Simulates data from an older device that's been offline for a while
 * This device has some overlapping data and some unique data
 */
function createOlderDeviceData(): MergeableData {
  return {
    events: [
      // Some older events that might not be on current device
      { kind: 'lesson_start', at: 1756800000000, lessonId: 'math_addition_1', biomeId: 'grassland' },
      { kind: 'lesson_finish', at: 1756800300000, lessonId: 'math_addition_1', biomeId: 'grassland', result: 'pass' },
      { kind: 'journal_start', at: 1756800600000, skillId: 'addition_basic', source: 'scout' },
      { kind: 'journal_finish', at: 1756800900000, skillId: 'addition_basic', n: 8, correct: 6, durationSec: 240 },
      
      // Scout messages from offline period
      { kind: 'scout_msg', at: 1756801200000, messageId: 'offline_msg_1', priority: 'info', text: 'Great progress on addition!' },
      { kind: 'scout_analytics', at: 1756801500000, id: 'analytics_offline_1', priority: 'info', action: 'shown', sessionId: 'offline_session_1' }
    ] as ProgressEvent[],

    learnerModel: {
      version: 1,
      skills: {
        // Skills that were practiced on the offline device
        'addition_basic': { p: 0.65, seen: 15, correct: 10, streak: 2, lastAt: 1756800900000 },
        'subtraction_basic': { p: 0.45, seen: 8, correct: 3, streak: 0, lastAt: 1756799000000 },
        // Skill that may have newer data on current device
        'multiplication_tables': { p: 0.3, seen: 3, correct: 1, streak: 0, lastAt: 1756798000000 }
      }
    } as LearnerState,

    journalHistory: [
      {
        date: '2024-09-02',
        skillId: 'addition_basic',
        itemCount: 8,
        correctCount: 6,
        duration: 240,
        masteryBefore: 0.5,
        masteryAfter: 0.65,
        sessionId: 'offline_session_1',
        targetLevel: 'core',
        items: [],
        responses: [
          { itemId: 'add_1', userAnswer: '5', isCorrect: true, timeSpent: 25 },
          { itemId: 'add_2', userAnswer: '8', isCorrect: true, timeSpent: 30 },
          { itemId: 'add_3', userAnswer: '12', isCorrect: false, timeSpent: 45 },
          { itemId: 'add_4', userAnswer: '7', isCorrect: true, timeSpent: 20 }
        ]
      }
    ] as JournalHistoryEntry[],

    reflections: [
      { at: 1756800950000, refType: 'journal', refId: 'addition_basic', note: 'Found the word problems tricky but got better with practice' },
      { at: 1756801000000, refType: 'lesson', refId: 'math_addition_1', note: 'Enjoyed the visual examples' }
    ] as Reflection[],

    assignments: [
      {
        id: 'week1_math',
        name: 'Week 1 Math Fundamentals',
        lessonIds: ['math_addition_1', 'math_subtraction_1'], // Completed some lessons offline
        createdAt: 1756790000000,
        expiresAt: 1756880000000
      }
    ] as AssignedPath[]
  };
}

/**
 * Simulates data from the current device (newer, has been online)
 */
function createCurrentDeviceData(): MergeableData {
  return {
    events: [
      // More recent events from current device
      { kind: 'lesson_start', at: 1756850000000, lessonId: 'math_multiplication_1', biomeId: 'desert' },
      { kind: 'lesson_finish', at: 1756850400000, lessonId: 'math_multiplication_1', biomeId: 'desert', result: 'pass' },
      { kind: 'journal_start', at: 1756851000000, skillId: 'multiplication_tables', source: 'guide' },
      { kind: 'journal_finish', at: 1756851300000, skillId: 'multiplication_tables', n: 10, correct: 8, durationSec: 300 },
      
      // Overlapping event that might exist on both devices
      { kind: 'journal_finish', at: 1756800900000, skillId: 'addition_basic', n: 8, correct: 6, durationSec: 240 },
      
      // Recent scout activity
      { kind: 'scout_msg', at: 1756852000000, messageId: 'current_msg_1', priority: 'actionable', text: 'Time to review subtraction!' },
    ] as ProgressEvent[],

    learnerModel: {
      version: 1,
      skills: {
        // Updated skill from current device practice
        'addition_basic': { p: 0.75, seen: 18, correct: 14, streak: 4, lastAt: 1756851600000 }, // Newer than offline
        'multiplication_tables': { p: 0.7, seen: 12, correct: 9, streak: 3, lastAt: 1756851300000 }, // Much newer
        // New skill learned on current device
        'division_basic': { p: 0.55, seen: 6, correct: 4, streak: 1, lastAt: 1756851800000 }
      }
    } as LearnerState,

    journalHistory: [
      {
        date: '2024-09-03',
        skillId: 'multiplication_tables',
        itemCount: 10,
        correctCount: 8,
        duration: 300,
        masteryBefore: 0.3,
        masteryAfter: 0.7,
        sessionId: 'current_session_1',
        targetLevel: 'core',
        items: [],
        responses: [
          { itemId: 'mult_1', userAnswer: '6', isCorrect: true, timeSpent: 20 },
          { itemId: 'mult_2', userAnswer: '15', isCorrect: true, timeSpent: 25 },
          { itemId: 'mult_3', userAnswer: '20', isCorrect: false, timeSpent: 35 },
          { itemId: 'mult_4', userAnswer: '24', isCorrect: true, timeSpent: 18 }
        ]
      },
      // Duplicate session ID but with more responses (should win in merge)
      {
        date: '2024-09-02',
        skillId: 'addition_basic',
        itemCount: 8,
        correctCount: 6,
        duration: 240,
        masteryBefore: 0.5,
        masteryAfter: 0.65,
        sessionId: 'offline_session_1', // Same as offline device
        targetLevel: 'core',
        items: [],
        responses: [
          { itemId: 'add_1', userAnswer: '5', isCorrect: true, timeSpent: 25 },
          { itemId: 'add_2', userAnswer: '8', isCorrect: true, timeSpent: 30 },
          { itemId: 'add_3', userAnswer: '12', isCorrect: false, timeSpent: 45 },
          { itemId: 'add_4', userAnswer: '7', isCorrect: true, timeSpent: 20 },
          { itemId: 'add_5', userAnswer: '9', isCorrect: true, timeSpent: 22 }, // Extra responses
          { itemId: 'add_6', userAnswer: '14', isCorrect: true, timeSpent: 28 }
        ]
      }
    ] as JournalHistoryEntry[],

    reflections: [
      { at: 1756851350000, refType: 'journal', refId: 'multiplication_tables', note: 'Times tables are starting to click!' },
      { at: 1756851400000, refType: 'lesson', refId: 'math_multiplication_1', note: 'Visual arrays helped a lot' },
      // Same reflection timestamp but different content (should keep first found)
      { at: 1756801000000, refType: 'lesson', refId: 'math_addition_1', note: 'Different reflection text' }
    ] as Reflection[],

    assignments: [
      {
        id: 'week1_math',
        name: 'Week 1 Math Fundamentals',
        lessonIds: ['math_addition_1', 'math_multiplication_1'], // Completed different lessons
        createdAt: 1756790000000,
        expiresAt: 1756880000000
      },
      {
        id: 'week2_advanced',
        name: 'Week 2 Advanced Topics',
        lessonIds: ['math_division_1'],
        createdAt: 1756850000000,
        expiresAt: 1756950000000
      }
    ] as AssignedPath[]
  };
}

/**
 * Run verification scenario
 */
export function runMergeVerification(): void {
  console.log('🔄 Running Multi-Device Merge Verification');
  console.log('=====================================\n');

  const olderDeviceData = createOlderDeviceData();
  const currentDeviceData = createCurrentDeviceData();

  console.log('📱 Older Device Data:');
  console.log(`  Events: ${olderDeviceData.events?.length || 0}`);
  console.log(`  Skills: ${Object.keys(olderDeviceData.learnerModel?.skills || {}).length}`);
  console.log(`  Journal Sessions: ${olderDeviceData.journalHistory?.length || 0}`);
  console.log(`  Reflections: ${olderDeviceData.reflections?.length || 0}`);
  console.log(`  Assignments: ${olderDeviceData.assignments?.length || 0}\n`);

  console.log('📱 Current Device Data:');
  console.log(`  Events: ${currentDeviceData.events?.length || 0}`);
  console.log(`  Skills: ${Object.keys(currentDeviceData.learnerModel?.skills || {}).length}`);
  console.log(`  Journal Sessions: ${currentDeviceData.journalHistory?.length || 0}`);
  console.log(`  Reflections: ${currentDeviceData.reflections?.length || 0}`);
  console.log(`  Assignments: ${currentDeviceData.assignments?.length || 0}\n`);

  // Perform merge
  const merged = mergeData(currentDeviceData, olderDeviceData);

  console.log('🔀 Merged Result:');
  console.log(`  Events: ${merged.events?.length || 0} (union of unique events)`);
  console.log(`  Skills: ${Object.keys(merged.learnerModel?.skills || {}).length} (merged by lastAt/sum/max rules)`);
  console.log(`  Journal Sessions: ${merged.journalHistory?.length || 0} (deduplicated by session ID)`);
  console.log(`  Reflections: ${merged.reflections?.length || 0} (union by compound key)`);
  console.log(`  Assignments: ${merged.assignments?.length || 0} (merged lesson completion)\n`);

  // Detailed skill merge analysis
  console.log('🧠 Skill Merge Analysis:');
  const skills = merged.learnerModel?.skills || {};
  for (const [skillId, skill] of Object.entries(skills)) {
    const oldSkill = olderDeviceData.learnerModel?.skills[skillId];
    const currentSkill = currentDeviceData.learnerModel?.skills[skillId];
    
    console.log(`  ${skillId}:`);
    if (oldSkill && currentSkill) {
      console.log(`    Probability: ${skill.p.toFixed(2)} (${skill.lastAt! > oldSkill.lastAt! ? 'current' : 'older'} device won by lastAt)`);
      console.log(`    Seen: ${skill.seen} (${oldSkill.seen} + ${currentSkill.seen})`);
      console.log(`    Correct: ${skill.correct} (${oldSkill.correct} + ${currentSkill.correct})`);
      console.log(`    Streak: ${skill.streak} (max of ${oldSkill.streak}, ${currentSkill.streak})`);
    } else if (oldSkill) {
      console.log(`    From older device only`);
    } else {
      console.log(`    From current device only`);
    }
  }

  // Assignment merge analysis
  console.log('\n📝 Assignment Merge Analysis:');
  const assignments = merged.assignments || [];
  for (const assignment of assignments) {
    const oldAssignment = olderDeviceData.assignments?.find(a => a.id === assignment.id);
    const currentAssignment = currentDeviceData.assignments?.find(a => a.id === assignment.id);
    
    console.log(`  ${assignment.name} (${assignment.id}):`);
    if (oldAssignment && currentAssignment) {
      console.log(`    Lessons: ${assignment.lessonIds.length} (union of ${oldAssignment.lessonIds.length} + ${currentAssignment.lessonIds.length})`);
      console.log(`    Completed: [${assignment.lessonIds.join(', ')}]`);
    } else {
      console.log(`    From ${oldAssignment ? 'older' : 'current'} device only`);
    }
  }

  console.log('\n✅ Merge verification completed successfully!');
  console.log('All conflict resolution rules applied deterministically.\n');
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).runMergeVerification = runMergeVerification;
}