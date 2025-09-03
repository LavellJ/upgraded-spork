#!/usr/bin/env node
/**
 * Migration Helper - Convert v1 lesson data to v2 format
 * 
 * Usage: npm run migrate-v1-to-v2
 * 
 * Converts:
 * - String titles to I18nText format { 'en-AU': title }
 * - Version number from 1 to 2
 * - Adds required v2 fields with sensible defaults
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { mkdirSync } from 'fs';

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

interface BasicLessonV1 {
  id: string;
  title: string;
}

interface LoopDataV1 {
  forest: BasicLessonV1[];
  desert: BasicLessonV1[];
  ocean: BasicLessonV1[];
  night: BasicLessonV1[];
}

interface LessonV1 {
  id: string;
  title: string;
  biome?: string;
  skills?: string[];
  activities?: any[];
  standards?: any[];
  assets?: string[];
  meta?: Record<string, any>;
}

interface RegistryV1 {
  version?: number;
  lessons?: LessonV1[];
  skills?: any[];
  frameworks?: Record<string, string[]>;
}

/**
 * Convert string title to I18nText format
 */
function titleToI18n(title: string) {
  return {
    'en-AU': title
  };
}

/**
 * Convert basic lesson from v1 to v2
 */
function migrateBasicLesson(lesson: BasicLessonV1) {
  return {
    id: lesson.id,
    title: titleToI18n(lesson.title)
  };
}

/**
 * Convert loop data from v1 to v2
 */
function migrateLoopData(data: LoopDataV1) {
  return {
    forest: data.forest.map(migrateBasicLesson),
    desert: data.desert.map(migrateBasicLesson),
    ocean: data.ocean.map(migrateBasicLesson),
    night: data.night.map(migrateBasicLesson)
  };
}

/**
 * Convert lesson from v1 to v2
 */
function migrateLessonV1ToV2(lesson: LessonV1) {
  // Infer biome from lesson ID if not present
  let biomeId = lesson.biome;
  if (!biomeId) {
    if (lesson.id.startsWith('f')) biomeId = 'forest';
    else if (lesson.id.startsWith('d')) biomeId = 'desert';
    else if (lesson.id.startsWith('o')) biomeId = 'ocean';
    else if (lesson.id.startsWith('n')) biomeId = 'night';
    else biomeId = 'unknown';
  }

  // Create default activity if none exist
  let activities = lesson.activities || [];
  if (activities.length === 0) {
    activities = [{
      kind: 'read',
      content: titleToI18n(`Content for ${lesson.title}`)
    }];
  }

  // Ensure at least one skill
  let skills = lesson.skills || [];
  if (skills.length === 0) {
    skills = [`${biomeId}_basic`];
  }

  return {
    version: 2,
    id: lesson.id,
    biomeId,
    title: titleToI18n(lesson.title),
    skills,
    activities,
    standards: lesson.standards || [],
    assets: lesson.assets || [],
    meta: lesson.meta || {}
  };
}

/**
 * Convert registry from v1 to v2
 */
function migrateRegistryV1ToV2(registry: RegistryV1) {
  const lessons = (registry.lessons || []).map(migrateLessonV1ToV2);
  
  // Create default skills if none exist
  let skills = registry.skills || [];
  if (skills.length === 0 && lessons.length > 0) {
    const biomes = ['forest', 'desert', 'ocean', 'night'];
    const biomeLabels = {
      forest: 'Literacy',
      desert: 'Math', 
      ocean: 'Science',
      night: 'HASS'
    };
    
    skills = biomes.map(biome => ({
      id: `${biome}_basic`,
      label: titleToI18n(`Basic ${biomeLabels[biome as keyof typeof biomeLabels]}`)
    }));
  }

  return {
    version: 2,
    lessons,
    skills,
    frameworks: registry.frameworks || {}
  };
}

/**
 * Main migration function
 */
async function migrate() {
  console.log(`${colors.blue}🔄 Starting v1 to v2 migration...${colors.reset}\n`);

  const inputFiles = [
    { path: 'client/src/data/loop1.json', type: 'loop' as const },
    { path: 'client/src/data/loop2.json', type: 'loop' as const },
    { path: 'client/src/data/registry.json', type: 'registry' as const }
  ];

  const outputDir = 'tmp/migrated-v2';
  
  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  let migratedCount = 0;
  let errorCount = 0;

  for (const { path, type } of inputFiles) {
    try {
      if (!existsSync(path)) {
        console.log(`${colors.yellow}⚠️  Skipping ${path} (not found)${colors.reset}`);
        continue;
      }

      console.log(`📄 Processing ${path}...`);

      // Read and parse input file
      const inputData = JSON.parse(readFileSync(path, 'utf-8'));
      
      let outputData;
      const filename = path.split('/').pop()!;
      const outputPath = join(outputDir, filename);

      if (type === 'loop') {
        outputData = migrateLoopData(inputData as LoopDataV1);
      } else if (type === 'registry') {
        outputData = migrateRegistryV1ToV2(inputData as RegistryV1);
      }

      // Write migrated file
      writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
      
      console.log(`${colors.green}✅ Migrated ${path} → ${outputPath}${colors.reset}`);
      migratedCount++;

    } catch (error) {
      console.log(`${colors.red}❌ Failed to migrate ${path}: ${error}${colors.reset}`);
      errorCount++;
    }
  }

  console.log(`\n${colors.bold}Migration Summary:${colors.reset}`);
  console.log(`${colors.green}✅ ${migratedCount} file(s) migrated successfully${colors.reset}`);
  if (errorCount > 0) {
    console.log(`${colors.red}❌ ${errorCount} file(s) failed${colors.reset}`);
  }
  
  console.log(`\n📁 Migrated files saved to: ${outputDir}/`);
  console.log(`💡 Review the migrated files before replacing originals`);

  return errorCount === 0 ? 0 : 1;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error(`${colors.red}❌ Migration crashed: ${error}${colors.reset}`);
      process.exit(1);
    });
}