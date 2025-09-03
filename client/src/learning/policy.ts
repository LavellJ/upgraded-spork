import registryData from '../data/registry.json';
import prototypesData from '../data/prototypes.json';
import type { LearnerState, SkillId, AgeBand } from './model';
import { 
  getNextAssignedLesson,
  getActiveAssignments,
  isDueSoon,
  isOverdue,
  type AssignedPathV2,
  type AssignedLesson
} from '../guide/assign';

type RegistryEntry = {
  url?: string;
  standards?: Record<string, string>;
  est?: string;
};

type LessonInfo = {
  biome: string;
  lessonId: string;
  data: RegistryEntry;
};

// Get all lessons from registry
function getAllLessons(): LessonInfo[] {
  const lessons: LessonInfo[] = [];
  
  for (const [loopId, loopData] of Object.entries(registryData)) {
    for (const [biome, biomeData] of Object.entries(loopData)) {
      for (const [lessonId, lessonData] of Object.entries(biomeData)) {
        lessons.push({
          biome,
          lessonId,
          data: lessonData as RegistryEntry
        });
      }
    }
  }
  
  return lessons;
}

// Infer skill IDs for a lesson
export function inferSkillIdsForLesson(lesson: LessonInfo): SkillId[] {
  const skillIds: SkillId[] = [];
  
  // First, try to use standards if available
  if (lesson.data.standards) {
    for (const [framework, standard] of Object.entries(lesson.data.standards)) {
      if (standard && standard.trim()) {
        // Create skill ID from framework + standard
        const skillId = `${framework.toLowerCase()}.${standard.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
        skillIds.push(skillId);
      }
    }
  }
  
  // If no standards found, fall back to general biome skill
  if (skillIds.length === 0) {
    skillIds.push(`general.${lesson.biome}`);
  }
  
  // Always include a biome-specific skill for broader tracking
  const biomeSkill = `biome.${lesson.biome}`;
  if (!skillIds.includes(biomeSkill)) {
    skillIds.push(biomeSkill);
  }
  
  return skillIds;
}

// Calculate average mastery for a lesson's skills
function getAverageMastery(lesson: LessonInfo, learner: LearnerState): number {
  const skillIds = inferSkillIdsForLesson(lesson);
  let totalMastery = 0;
  let count = 0;
  
  for (const skillId of skillIds) {
    const skill = learner.skills[skillId];
    if (skill) {
      totalMastery += skill.p;
      count++;
    } else {
      // Use default mastery for unseen skills
      totalMastery += 0.5;
      count++;
    }
  }
  
  return count > 0 ? totalMastery / count : 0.5;
}

// Get novelty bonus based on how much a lesson has been seen, with age band bias
function getNoveltyBonus(lesson: LessonInfo, learner: LearnerState, ageBand?: AgeBand): number {
  const skillIds = inferSkillIdsForLesson(lesson);
  let totalSeen = 0;
  
  for (const skillId of skillIds) {
    const skill = learner.skills[skillId];
    totalSeen += skill ? skill.seen : 0;
  }
  
  // Small bonus for less-seen content (max 0.1 bonus, decays with exposure)
  const averageSeen = totalSeen / skillIds.length;
  let noveltyBonus = Math.max(0, 0.1 * Math.exp(-averageSeen * 0.3));
  
  // Add age band curriculum bias
  if (ageBand) {
    const ageBandBonus = getAgeBandBonus(lesson, skillIds, ageBand);
    noveltyBonus += ageBandBonus;
  }
  
  return noveltyBonus;
}

// Calculate age-band specific curriculum bonus
function getAgeBandBonus(lesson: LessonInfo, skillIds: SkillId[], ageBand: AgeBand): number {
  // Define curriculum expectations by age band
  const curriculumFocus = {
    '5-6': ['literacy.phonics', 'literacy.sight-words', 'math.counting', 'general.forest', 'biome.forest'],
    '7-8': ['literacy.reading', 'math.addition', 'math.subtraction', 'general.desert', 'biome.desert'],
    '9-10': ['literacy.vocabulary', 'math.multiplication', 'science.observation', 'general.ocean', 'biome.ocean'],
    '11-12': ['literacy.comprehension', 'math.division', 'science.forces', 'general.night', 'biome.night']
  };
  
  const expectedSkills = curriculumFocus[ageBand] || [];
  
  // Count how many skills in this lesson align with age band expectations
  let alignedSkills = 0;
  for (const skillId of skillIds) {
    if (expectedSkills.some(expected => skillId.includes(expected) || expected.includes(skillId))) {
      alignedSkills++;
    }
  }
  
  // Bonus for age-appropriate content (0 to 0.15)
  return skillIds.length > 0 ? (alignedSkills / skillIds.length) * 0.15 : 0;
}

// Global variable for storing the recommendation reason (for DEV tooltips)
let _lastRecommendationReason: string = '';

// Get the reason for the last recommendation (for DEV mode)
export function getLastRecommendationReason(): string {
  return _lastRecommendationReason;
}

// Helper to find matching candidate for a lesson ID
function findCandidateForLesson(candidates: string[], lessonId: string): string | null {
  return candidates.find(candidate => {
    // Handle both "biome.lessonId" and "lessonId" formats
    const candidateLessonId = candidate.includes('.') ? candidate.split('.')[1] : candidate;
    return candidateLessonId === lessonId;
  }) || null;
}

// Recommend next lesson pin based on assignment priorities, then mastery and novelty
export function recommendNextPin(
  candidates: string[], 
  learner: LearnerState,
  currentLoop: number = 1,
  ageBand?: AgeBand,
  learnerId?: string
): string | null {
  if (candidates.length === 0) return null;
  
  // Check assignment priorities first if we have a learner ID
  if (learnerId) {
    const assignmentCandidates = getAssignmentPriorityCandidates(learnerId);
    
    // 1. Highest priority: Overdue assigned lessons
    if (assignmentCandidates.overdue.length > 0) {
      for (const candidate of assignmentCandidates.overdue) {
        const matchingCandidate = findCandidateForLesson(candidates, candidate.lessonId);
        if (matchingCandidate) {
          _lastRecommendationReason = `Overdue in "${candidate.pathName}"`;
          console.log('[Compass] Prioritizing overdue assigned lesson:', matchingCandidate, '- Reason:', _lastRecommendationReason);
          return matchingCandidate;
        }
      }
    }
    
    // 2. Second priority: Due soon assigned lessons (≤48h)
    if (assignmentCandidates.dueSoon.length > 0) {
      for (const candidate of assignmentCandidates.dueSoon) {
        const matchingCandidate = findCandidateForLesson(candidates, candidate.lessonId);
        if (matchingCandidate) {
          _lastRecommendationReason = `Due soon in "${candidate.pathName}"`;
          console.log('[Compass] Prioritizing due soon assigned lesson:', matchingCandidate, '- Reason:', _lastRecommendationReason);
          return matchingCandidate;
        }
      }
    }
    
    // 3. Third priority: Next assigned not_started lessons
    if (assignmentCandidates.assigned.length > 0) {
      for (const candidate of assignmentCandidates.assigned) {
        const matchingCandidate = findCandidateForLesson(candidates, candidate.lessonId);
        if (matchingCandidate) {
          _lastRecommendationReason = `Next in "${candidate.pathName}"`;
          console.log('[Compass] Prioritizing next assigned lesson:', matchingCandidate, '- Reason:', _lastRecommendationReason);
          return matchingCandidate;
        }
      }
    }
  }
  
  // Fallback: Legacy assignment check (for backward compatibility)
  const completedSet = new Set<string>();
  const nextAssignedLesson = getNextAssignedLesson(completedSet);
  
  if (nextAssignedLesson) {
    const assignedCandidate = findCandidateForLesson(candidates, nextAssignedLesson);
    if (assignedCandidate) {
      _lastRecommendationReason = 'Legacy assignment (V1)';
      console.log('[Compass] Prioritizing legacy assigned lesson:', assignedCandidate);
      return assignedCandidate;
    }
  }
  
  // 4. Normal policy fallback: Use learner model scoring
  _lastRecommendationReason = 'Learner model recommendation';
  
  const TARGET_MASTERY = 0.75;
  const allLessons = getAllLessons();
  
  // Map candidate IDs to lesson info
  const candidateLessons = candidates
    .map(candidateId => {
      // Parse candidate ID (format: "biome.lessonId" or just "lessonId")
      const parts = candidateId.includes('.') ? candidateId.split('.') : ['', candidateId];
      const lessonId = parts[parts.length - 1];
      const biome = parts.length > 1 ? parts[0] : '';
      
      // Find matching lesson in registry
      return allLessons.find(lesson => 
        lesson.lessonId === lessonId && 
        (biome === '' || lesson.biome === biome)
      );
    })
    .filter(Boolean) as LessonInfo[];
  
  if (candidateLessons.length === 0) {
    // Fallback: return first candidate if no matches found
    return candidates[0];
  }
  
  // Score each candidate
  const scoredCandidates = candidateLessons.map(lesson => {
    const avgMastery = getAverageMastery(lesson, learner);
    const noveltyBonus = getNoveltyBonus(lesson, learner, ageBand);
    
    // Score based on distance from target mastery + novelty
    const masteryDistance = Math.abs(TARGET_MASTERY - avgMastery);
    const masteryScore = 1 - (masteryDistance * masteryDistance); // Quadratic penalty
    
    const totalScore = masteryScore + noveltyBonus;
    
    return {
      lesson,
      score: totalScore,
      avgMastery,
      noveltyBonus
    };
  });
  
  // Sort by score (highest first) and return the lesson ID
  scoredCandidates.sort((a, b) => b.score - a.score);
  
  const bestCandidate = scoredCandidates[0];
  
  // Return in the format expected by the caller
  return `${bestCandidate.lesson.biome}.${bestCandidate.lesson.lessonId}`;
}

// Helper function to get lesson info by ID
export function getLessonById(lessonId: string): LessonInfo | null {
  const allLessons = getAllLessons();
  
  // Try exact match first
  let lesson = allLessons.find(l => l.lessonId === lessonId);
  
  // Try biome.lessonId format
  if (!lesson && lessonId.includes('.')) {
    const [biome, id] = lessonId.split('.');
    lesson = allLessons.find(l => l.biome === biome && l.lessonId === id);
  }
  
  return lesson || null;
}

// Get all skill IDs that exist in the system
export function getAllSkillIds(): SkillId[] {
  const allLessons = getAllLessons();
  const skillIds = new Set<SkillId>();
  
  for (const lesson of allLessons) {
    const lessonSkills = inferSkillIdsForLesson(lesson);
    lessonSkills.forEach(skillId => skillIds.add(skillId));
  }
  
  return Array.from(skillIds).sort();
}

// Assignment priority candidate with metadata
interface AssignmentCandidate {
  lessonId: string;
  pathName: string;
  dueAt?: number;
  priority: 'overdue' | 'due_soon' | 'assigned';
  pathOrder: number; // Position in the assignment path
}

// Get assignment priority candidates for a learner
export function getAssignmentPriorityCandidates(learnerId: string): {
  overdue: AssignmentCandidate[];
  dueSoon: AssignmentCandidate[];
  assigned: AssignmentCandidate[];
} {
  const now = Date.now();
  const assignments = getActiveAssignments(learnerId);
  
  const overdue: AssignmentCandidate[] = [];
  const dueSoon: AssignmentCandidate[] = [];
  const assigned: AssignmentCandidate[] = [];
  
  assignments.forEach(path => {
    path.lessons.forEach((lesson, index) => {
      // Skip completed lessons
      if (lesson.status === 'done') return;
      
      const effectiveDueAt = lesson.dueAt || path.dueAt;
      const candidate: AssignmentCandidate = {
        lessonId: lesson.lessonId,
        pathName: path.name,
        dueAt: effectiveDueAt,
        priority: 'assigned',
        pathOrder: index
      };
      
      // Categorize by due status
      if (effectiveDueAt && isOverdue(effectiveDueAt, now)) {
        candidate.priority = 'overdue';
        overdue.push(candidate);
      } else if (effectiveDueAt && isDueSoon(effectiveDueAt, now)) {
        candidate.priority = 'due_soon';
        dueSoon.push(candidate);
      } else {
        // Only include the next not_started lesson in path order
        if (lesson.status === 'not_started') {
          // Check if this is the first not_started lesson in this path
          const firstNotStarted = path.lessons.findIndex(l => l.status === 'not_started');
          if (firstNotStarted === index) {
            assigned.push(candidate);
          }
        }
      }
    });
  });
  
  // Sort each category by path order (earliest first)
  const sortByPathOrder = (a: AssignmentCandidate, b: AssignmentCandidate) => a.pathOrder - b.pathOrder;
  overdue.sort(sortByPathOrder);
  dueSoon.sort(sortByPathOrder);
  assigned.sort(sortByPathOrder);
  
  return { overdue, dueSoon, assigned };
}