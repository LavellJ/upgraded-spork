/**
 * Coverage analysis for content authoring
 * Provides reporting on lesson distribution across biomes, skills, and standards
 */

import type { RegistryV2, LessonV2 } from './schema';
import { getRegistry, getFrameworks } from './registry';

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
 */
export function buildCoverage(registry?: RegistryV2): CoverageReport {
  const activeRegistry = registry || getRegistry();
  const lessons = activeRegistry.lessons || [];
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