import type { LearnerState, SkillId, Mastery, AgeBand } from './model';
import { recommendNextPin } from './policy';
import { getGenerator } from '../journal/generator';
import REGISTRY from '../data/registry.json';

export interface SkillInsight {
  skillId: string;
  mastery: Mastery;
  percentage: number;
  trend?: 'up' | 'down' | 'stable';
  displayName: string;
}

export interface InsightsData {
  strengths: SkillInsight[];
  needs: SkillInsight[];
  suggestedNextStep: {
    lessonId: string;
    biome: string;
    reason: string;
  } | null;
}

// Helper to get framework-filtered lesson IDs
function getLessonIdsForFramework(framework: string): string[] {
  if (framework === 'Generic') {
    // Return all lesson IDs
    const allLessons: string[] = [];
    Object.values(REGISTRY).forEach(loop => {
      Object.entries(loop).forEach(([biome, lessons]) => {
        Object.keys(lessons).forEach(lessonId => {
          allLessons.push(lessonId);
        });
      });
    });
    return allLessons;
  }

  // Filter lessons that have the selected framework
  const filteredLessons: string[] = [];
  Object.values(REGISTRY).forEach(loop => {
    Object.entries(loop).forEach(([biome, lessons]) => {
      Object.entries(lessons).forEach(([lessonId, lesson]) => {
        if ((lesson as any).standards && (lesson as any).standards[framework]) {
          filteredLessons.push(lessonId);
        }
      });
    });
  });
  
  return filteredLessons;
}

// Helper to get skill ID from lesson ID (simplified mapping)
function getSkillIdFromLessonId(lessonId: string): string {
  // Map lesson patterns to skill IDs based on our generator mappings
  const skillMappings: Record<string, string> = {
    // Forest (Literacy)
    'f1': 'literacy.phonics',
    'f2': 'literacy.phonics', 
    'f3': 'literacy.sight-words',
    'f4': 'literacy.phonics',
    'f5': 'literacy.sight-words',
    
    // Desert (Math)
    'd1': 'math.number-bonds',
    'd2': 'math.addition',
    'd3': 'math.addition',
    'd4': 'math.number-bonds',
    'd5': 'math.addition',
    
    // Ocean (Science)
    'o1': 'science.forces',
    'o2': 'science.forces',
    'o3': 'science.forces',
    'o4': 'science.forces',
    'o5': 'science.forces'
  };
  
  return skillMappings[lessonId] || `unknown.${lessonId}`;
}

// Helper to create display name from skill ID
function getSkillDisplayName(skillId: string): string {
  const skillNames: Record<string, string> = {
    'literacy.phonics': 'Phonics & Sounds',
    'literacy.sight-words': 'Sight Words',
    'math.addition': 'Addition',
    'math.number-bonds': 'Number Bonds',
    'science.forces': 'Forces & Motion'
  };
  
  return skillNames[skillId] || skillId.replace('.', ' → ').replace(/\b\w/g, l => l.toUpperCase());
}

// Calculate trend based on recent performance (simplified)
function calculateTrend(mastery: Mastery): 'up' | 'down' | 'stable' {
  // For now, use streak as a proxy for trend
  if (mastery.streak >= 2) return 'up';
  if (mastery.streak === 0 && mastery.seen > 1) return 'down';
  return 'stable';
}

// Main insights computation
export function computeInsights(
  learnerState: LearnerState, 
  framework: string = 'Generic',
  currentLoop: number = 1,
  ageBand?: AgeBand
): InsightsData {
  const availableSkillIds = getGenerator().getAvailableSkills();
  
  // Filter skills based on framework
  const frameworkLessons = getLessonIdsForFramework(framework);
  const frameworkSkills = Array.from(new Set(frameworkLessons.map(getSkillIdFromLessonId)));
  
  // Only consider skills that exist in both our generator and the framework
  const relevantSkillIds = availableSkillIds.filter(skillId => 
    frameworkSkills.includes(skillId) || framework === 'Generic'
  );

  // Convert skills to insights
  const allInsights: SkillInsight[] = relevantSkillIds
    .map(skillId => {
      const mastery = learnerState.skills[skillId] || {
        p: 0.5,
        seen: 0,
        correct: 0,
        streak: 0
      };
      
      return {
        skillId,
        mastery,
        percentage: Math.round(mastery.p * 100),
        trend: mastery.seen > 0 ? calculateTrend(mastery) : undefined,
        displayName: getSkillDisplayName(skillId)
      };
    })
    .filter(insight => insight.mastery.seen > 0); // Only include skills with some activity

  // Compute strengths (highest p with seen >= 3)
  const strengths = allInsights
    .filter(insight => insight.mastery.seen >= 3)
    .sort((a, b) => b.mastery.p - a.mastery.p)
    .slice(0, 3);

  // Compute needs (lowest p with seen >= 1)
  const needs = allInsights
    .filter(insight => insight.mastery.seen >= 1)
    .sort((a, b) => a.mastery.p - b.mastery.p)
    .slice(0, 3);

  // Get suggested next step
  let suggestedNextStep: InsightsData['suggestedNextStep'] = null;
  
  try {
    // Bias recommendation toward needs if available
    const needSkillIds = needs.map(n => n.skillId);
    const needLessons = frameworkLessons.filter(lessonId => {
      const skillId = getSkillIdFromLessonId(lessonId);
      return needSkillIds.includes(skillId);
    });
    
    // Try to recommend from need lessons first, fallback to all lessons
    const candidateLessons = needLessons.length > 0 ? needLessons : frameworkLessons;
    const recommended = recommendNextPin(candidateLessons, learnerState, currentLoop, ageBand);
    
    if (recommended) {
      // Find biome for this lesson
      let biome = 'forest';
      Object.values(REGISTRY).forEach(loop => {
        Object.entries(loop).forEach(([biomeName, lessons]) => {
          if (lessons[recommended]) {
            biome = biomeName;
          }
        });
      });
      
      const isNeedsBased = needLessons.includes(recommended);
      const reason = isNeedsBased 
        ? 'Addresses a skill that needs attention'
        : 'Next recommended lesson based on your progress';
      
      suggestedNextStep = {
        lessonId: recommended,
        biome,
        reason
      };
    }
  } catch (error) {
    console.warn('Failed to compute suggested next step:', error);
  }

  return {
    strengths,
    needs,
    suggestedNextStep
  };
}