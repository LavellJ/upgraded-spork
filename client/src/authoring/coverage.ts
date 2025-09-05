/**
 * Coverage analysis for content authoring
 * Provides reporting on lesson distribution across biomes, skills, and standards
 */

import type { RegistryV2, LessonV2 } from './schema';
import { getRegistry, getFrameworks } from './registry';

// Additional types for strand-level coverage tracking
export type CoverageLevel = 'none' | 'partial' | 'complete';

export interface StrandCoverage {
  strand: string;
  level: CoverageLevel;
  lessons: number;
  needed: number;
  completedStandards: string[];
  missingStandards: string[];
}

// Australian curriculum framework mapping
export interface FrameworkStrand {
  id: string;
  name: string;
  standards: string[];
  description: string;
  yearLevel: string;
}

// Define Australian curriculum strands for Grade 3
export const AUSTRALIAN_CURRICULUM_STRANDS: FrameworkStrand[] = [
  {
    id: 'math_fractions',
    name: 'Fractions & Decimals', 
    standards: ['M.FRAC.EQ.3', 'M.FRAC.COMP.3', 'M.FRAC.NL.3', 'M.FRAC.ADD.3'],
    description: 'Understanding fractions, equivalence, comparison, and basic operations',
    yearLevel: '3'
  },
  {
    id: 'math_number',
    name: 'Number & Place Value',
    standards: ['M.NUM.MUL.3', 'M.NUM.DIV.3', 'M.NUM.PLACE.3', 'M.NUM.ROUND.3'],
    description: 'Multiplication, division, place value, and number operations',
    yearLevel: '3'
  },
  {
    id: 'english_reading',
    name: 'Reading & Viewing', 
    standards: ['E.READ.MAIN.3', 'E.READ.DETAIL.3', 'E.READ.INFER.3', 'E.READ.TEXT.3'],
    description: 'Comprehension strategies, main ideas, details, and text analysis',
    yearLevel: '3'
  },
  {
    id: 'english_language',
    name: 'Language',
    standards: ['E.LANG.VOCAB.3', 'E.LANG.GRAM.3', 'E.LANG.SPELL.3', 'E.LANG.PUNCT.3'],
    description: 'Vocabulary, grammar, spelling, and punctuation skills',
    yearLevel: '3'
  },
  {
    id: 'science_living', 
    name: 'Living Things',
    standards: ['SCI.HABIT.3', 'SCI.LIFE.3', 'SCI.ADAPT.3', 'SCI.CYCLE.3'],
    description: 'Animal habitats, life cycles, adaptations, and ecosystems',
    yearLevel: '3'
  },
  {
    id: 'science_physical',
    name: 'Physical Sciences',
    standards: ['SCI.FORCE.3', 'SCI.HEAT.3', 'SCI.LIGHT.3', 'SCI.SOUND.3'],
    description: 'Forces, heat, light, sound, and physical properties',
    yearLevel: '3'
  }
];

export interface BiomeCoverage {
  lessons: number;
  skills: Set<string>;
  standards: Set<string>;
}

export interface SkillCoverage {
  lessons: number;
}

export interface FrameworkCoverage {
  codes: Set<string>;
  covered: Set<string>;
}

export interface CoverageReport {
  byBiome: Record<string, BiomeCoverage>;
  bySkill: Record<string, SkillCoverage>;
  byFramework: Record<string, FrameworkCoverage>;
}

/**
 * Build comprehensive coverage report from the active registry
 * Optionally filter by pack IDs for targeted analysis
 */
export function buildCoverage(registry?: RegistryV2, packFilter?: string[]): CoverageReport {
  const activeRegistry = registry || getRegistry();
  let lessons = activeRegistry.lessons || [];
  
  // Filter lessons by pack if specified
  if (packFilter && packFilter.length > 0) {
    lessons = lessons.filter(lesson => {
      // Check if lesson ID contains any of the pack prefixes
      return packFilter.some(packId => lesson.id.startsWith(`${packId}:`));
    });
  }
  const frameworks = activeRegistry.frameworks || {};

  // Initialize coverage data structures
  const byBiome: Record<string, BiomeCoverage> = {};
  const bySkill: Record<string, SkillCoverage> = {};
  const byFramework: Record<string, FrameworkCoverage> = {};

  // Initialize framework coverage with all known codes
  for (const [frameworkName, codes] of Object.entries(frameworks)) {
    byFramework[frameworkName] = {
      codes: new Set(codes),
      covered: new Set()
    };
  }

  // Process each lesson
  for (const lesson of lessons) {
    const biomeId = lesson.biomeId;
    const lessonSkills = lesson.skills || [];
    const lessonStandards = lesson.standards || [];

    // Update biome coverage
    if (!byBiome[biomeId]) {
      byBiome[biomeId] = {
        lessons: 0,
        skills: new Set(),
        standards: new Set()
      };
    }
    
    byBiome[biomeId].lessons++;
    lessonSkills.forEach(skill => byBiome[biomeId].skills.add(skill));
    
    // Add standards to biome coverage
    lessonStandards.forEach(standard => {
      if (typeof standard === 'string') {
        byBiome[biomeId].standards.add(standard);
      } else if (standard && typeof standard === 'object' && 'code' in standard) {
        byBiome[biomeId].standards.add(standard.code);
      }
    });

    // Update skill coverage
    lessonSkills.forEach(skillId => {
      if (!bySkill[skillId]) {
        bySkill[skillId] = { lessons: 0 };
      }
      bySkill[skillId].lessons++;
    });

    // Update framework coverage based on lesson standards
    lessonStandards.forEach(standard => {
      let standardCode: string | undefined;
      
      if (typeof standard === 'string') {
        standardCode = standard;
      } else if (standard && typeof standard === 'object' && 'code' in standard) {
        standardCode = standard.code;
      }

      if (standardCode) {
        // Find which framework this standard belongs to
        for (const [frameworkName, codes] of Object.entries(frameworks)) {
          if (codes.includes(standardCode)) {
            byFramework[frameworkName].covered.add(standardCode);
          }
        }
      }
    });
  }

  return {
    byBiome,
    bySkill,
    byFramework
  };
}

/**
 * Find missing standards for a specific framework
 */
export function missingStandards(framework: string, allCodes: string[]): string[] {
  const coverage = buildCoverage();
  const frameworkCoverage = coverage.byFramework[framework];
  
  if (!frameworkCoverage) {
    // If framework not found in coverage, assume all codes are missing
    return [...allCodes];
  }

  const missing: string[] = [];
  for (const code of allCodes) {
    if (!frameworkCoverage.covered.has(code)) {
      missing.push(code);
    }
  }

  return missing.sort();
}

/**
 * Get all framework codes for a specific framework
 */
export function getFrameworkCodes(framework: string): string[] {
  const frameworks = getFrameworks();
  return frameworks[framework] || [];
}

/**
 * Export coverage data as CSV format
 */
export function exportBiomeCoverageCSV(): string {
  const coverage = buildCoverage();
  const rows = ['Biome,Lessons,Skills,Standards'];
  
  for (const [biomeId, data] of Object.entries(coverage.byBiome)) {
    rows.push(`${biomeId},${data.lessons},${data.skills.size},${data.standards.size}`);
  }
  
  return rows.join('\n');
}

/**
 * Export skill coverage data as CSV format
 */
export function exportSkillCoverageCSV(): string {
  const coverage = buildCoverage();
  const rows = ['Skill,Lessons'];
  
  // Sort skills by lesson count (ascending)
  const sortedSkills = Object.entries(coverage.bySkill)
    .sort(([,a], [,b]) => a.lessons - b.lessons);
  
  for (const [skillId, data] of sortedSkills) {
    rows.push(`${skillId},${data.lessons}`);
  }
  
  return rows.join('\n');
}

/**
 * Export framework coverage data as CSV format
 */
export function exportFrameworkCoverageCSV(framework: string): string {
  const coverage = buildCoverage();
  const frameworkCoverage = coverage.byFramework[framework];
  
  if (!frameworkCoverage) {
    return 'Code,Status\n';
  }
  
  const rows = ['Code,Status'];
  const allCodes = Array.from(frameworkCoverage.codes);
  
  for (const code of allCodes.sort()) {
    const status = frameworkCoverage.covered.has(code) ? 'Covered' : 'Missing';
    rows.push(`${code},${status}`);
  }
  
  return rows.join('\n');
}

/**
 * Download CSV data as a file
 */
export function downloadCSV(filename: string, csvData: string): void {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Get coverage summary statistics
 */
export function getCoverageSummary(): {
  totalLessons: number;
  totalBiomes: number;
  totalSkills: number;
  avgLessonsPerBiome: number;
  avgLessonsPerSkill: number;
} {
  const coverage = buildCoverage();
  const totalLessons = Object.values(coverage.byBiome).reduce((sum, biome) => sum + biome.lessons, 0);
  const totalBiomes = Object.keys(coverage.byBiome).length;
  const totalSkills = Object.keys(coverage.bySkill).length;
  
  return {
    totalLessons,
    totalBiomes,
    totalSkills,
    avgLessonsPerBiome: totalBiomes > 0 ? totalLessons / totalBiomes : 0,
    avgLessonsPerSkill: totalSkills > 0 ? totalLessons / totalSkills : 0
  };
}

/**
 * Get strand-level coverage for Australian curriculum
 */
export function getStrandCoverage(framework = 'australian-curriculum'): StrandCoverage[] {
  const coverage = buildCoverage();
  const frameworkCoverage = coverage.byFramework[framework];
  
  if (!frameworkCoverage) {
    return AUSTRALIAN_CURRICULUM_STRANDS.map(strand => ({
      strand: strand.name,
      level: 'none' as CoverageLevel,
      lessons: 0,
      needed: strand.standards.length,
      completedStandards: [],
      missingStandards: [...strand.standards]
    }));
  }

  return AUSTRALIAN_CURRICULUM_STRANDS.map(strand => {
    const completedStandards = strand.standards.filter(std => 
      frameworkCoverage.covered.has(std)
    );
    const missingStandards = strand.standards.filter(std => 
      !frameworkCoverage.covered.has(std)
    );
    
    let level: CoverageLevel = 'none';
    if (completedStandards.length === strand.standards.length) {
      level = 'complete';
    } else if (completedStandards.length > 0) {
      level = 'partial';
    }

    return {
      strand: strand.name,
      level,
      lessons: completedStandards.length,
      needed: strand.standards.length,
      completedStandards,
      missingStandards
    };
  });
}

/**
 * Get strand coverage summary for progress tracking
 */
export function getStrandSummary(): {
  complete: number;
  partial: number;
  none: number;
  total: number;
  percentComplete: number;
} {
  const strands = getStrandCoverage();
  const complete = strands.filter(s => s.level === 'complete').length;
  const partial = strands.filter(s => s.level === 'partial').length;
  const none = strands.filter(s => s.level === 'none').length;
  const total = strands.length;
  
  return {
    complete,
    partial,
    none,
    total,
    percentComplete: total > 0 ? (complete / total) * 100 : 0
  };
}