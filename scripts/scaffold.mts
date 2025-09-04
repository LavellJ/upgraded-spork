#!/usr/bin/env tsx

/**
 * Authoring scaffolding CLI for lessons and journal entries
 * Generates schema-compliant boilerplate with accessibility defaults
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Types for CLI arguments
interface LessonArgs {
  packId: string;
  slug: string;
  skills: string[];
  biome: string;
  title: string;
}

interface JournalArgs {
  skillId: string;
  age: string;
  n: number;
}

// Biome mappings for lesson generation
const BIOME_MAP: Record<string, string> = {
  coast: 'ocean',
  reef: 'ocean',
  ocean: 'ocean',
  mountain: 'desert',
  alpine: 'desert',
  desert: 'desert',
  forest: 'forest',
  bush: 'forest',
  grassland: 'grassland',
  savanna: 'grassland'
};

/**
 * Generate a lesson JSON file with schema v2 boilerplate
 */
export async function generateLesson(args: LessonArgs): Promise<string> {
  const { packId, slug, skills, biome, title } = args;
  
  // Validate inputs
  if (!packId.match(/^[a-z0-9_.-]+$/)) {
    throw new Error('Pack ID must contain only lowercase letters, numbers, underscores, dots, and hyphens');
  }
  
  if (!slug.match(/^[a-z0-9_.-]+$/)) {
    throw new Error('Slug must contain only lowercase letters, numbers, underscores, dots, and hyphens');
  }
  
  // Map biome to valid biomeId
  const biomeId = BIOME_MAP[biome.toLowerCase()] || biome;
  
  // Generate lesson ID with version
  const lessonId = `${slug}-v1`;
  
  // Create lesson object with schema v2 structure and accessibility defaults
  const lesson = {
    version: 2,
    id: lessonId,
    biomeId,
    title: {
      'en-AU': title
    },
    summary: {
      'en-AU': `TODO: Add engaging summary for ${title}`
    },
    skills,
    activities: [
      {
        kind: 'read',
        title: {
          'en-AU': 'TODO: Add engaging introduction title'
        },
        content: {
          'en-AU': 'TODO: Add rich educational content that introduces the concepts. Make it engaging and age-appropriate.'
        },
        alt: 'Introductory reading content',
        ariaLabel: `Introduction to ${title}`
      },
      {
        kind: 'quiz',
        title: {
          'en-AU': 'TODO: Add practice quiz title'
        },
        questionSetId: `TODO-${slug}-questions`,
        alt: 'Interactive quiz activity',
        ariaLabel: `Practice questions for ${title}`
      },
      {
        kind: 'video',
        title: {
          'en-AU': 'TODO: Add video lesson title'
        },
        src: `https://example.com/TODO-${slug}.mp4`,
        type: 'video/mp4',
        captions: [
          {
            src: `assets/captions/${lessonId}-en-AU.vtt`,
            srclang: 'en-AU',
            default: true,
            label: 'English (Australia)'
          }
        ],
        transcript: {
          text: 'TODO: Add video transcript text for accessibility'
        },
        alt: 'Educational video content',
        ariaLabel: `Video lesson about ${title}`
      }
    ],
    standards: [
      {
        framework: 'ACARA',
        code: 'TODO-ADD-STANDARD-CODE'
      }
    ]
  };
  
  // Ensure pack directory exists
  const packDir = `public/packs/${packId}`;
  const lessonsDir = `${packDir}/lessons`;
  const captionsDir = `${packDir}/assets/captions`;
  
  await fs.mkdir(lessonsDir, { recursive: true });
  await fs.mkdir(captionsDir, { recursive: true });
  
  // Write lesson file
  const lessonPath = `${lessonsDir}/${lessonId}.json`;
  await fs.writeFile(lessonPath, JSON.stringify(lesson, null, 2));
  
  // Create caption file stub
  const captionPath = `${captionsDir}/${lessonId}-en-AU.vtt`;
  const captionContent = `WEBVTT

00:00:00.000 --> 00:00:04.000
TODO: Add caption text for video content

00:00:04.000 --> 00:00:08.000
TODO: Continue with timed captions for accessibility

00:00:08.000 --> 00:00:12.000
TODO: Ensure captions are descriptive and match audio
`;
  
  await fs.writeFile(captionPath, captionContent);
  
  return lessonPath;
}

/**
 * Generate journal item bank with age buckets and Q&A stubs
 */
export async function generateJournal(args: JournalArgs): Promise<string> {
  const { skillId, age, n } = args;
  
  // Validate skillId format
  if (!skillId.match(/^[a-z0-9_.-]+$/)) {
    throw new Error('Skill ID must contain only lowercase letters, numbers, underscores, dots, and hyphens');
  }
  
  // Parse age range
  const ageMatch = age.match(/^(\d+)-(\d+)$/);
  if (!ageMatch) {
    throw new Error('Age must be in format "7-8" or similar');
  }
  
  const [, minAge, maxAge] = ageMatch;
  
  // Generate item stubs for each difficulty level
  const generateItems = (level: string, count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${skillId}-${level}-${i + 1}`,
      skillId,
      prompt: `TODO: Add ${level} level question ${i + 1} for ages ${age}`,
      kind: i % 2 === 0 ? 'mcq' as const : 'short' as const,
      ...(i % 2 === 0 ? {
        options: [
          'TODO: Option A',
          'TODO: Option B', 
          'TODO: Option C',
          'TODO: Option D'
        ]
      } : {}),
      answer: 'TODO: Add correct answer',
      explanation: `TODO: Add age-appropriate explanation for ${level} level concept`
    }));
  };
  
  // Create journal bank structure with age-appropriate difficulty levels
  const journalBank = {
    [skillId]: {
      easy: generateItems('easy', Math.ceil(n / 3)),
      core: generateItems('core', Math.ceil(n / 3)),
      stretch: generateItems('stretch', Math.floor(n / 3))
    }
  };
  
  // Ensure directory exists
  const banksDir = 'client/src/journal/banks';
  await fs.mkdir(banksDir, { recursive: true });
  
  // Check if skill file already exists
  const skillFilePath = `${banksDir}/${skillId}.json`;
  
  try {
    await fs.access(skillFilePath);
    console.log(`⚠️  Journal bank file already exists: ${skillFilePath}`);
    console.log('   Use a different skill ID or manually edit the existing file.');
    return skillFilePath;
  } catch {
    // File doesn't exist, create it
    await fs.writeFile(skillFilePath, JSON.stringify(journalBank, null, 2));
    
    console.log(`✅ Created journal bank: ${skillFilePath}`);
    console.log(`   Generated ${n} total items across 3 difficulty levels`);
    console.log(`   Age range: ${age} years`);
    
    return skillFilePath;
  }
}

/**
 * Parse CLI arguments and route to appropriate generator
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📝 LearnOz Authoring Scaffold CLI

Usage:
  lesson <packId> <slug> --skills skill1,skill2 --biome coast --title "Title"
  journal <skillId> --age 7-8 --n 6

Examples:
  lesson reef-au coral-counting --skills number.counting,number.recognition --biome reef --title "Counting Coral"
  journal number.fractions --age 8-10 --n 6

Generated files follow schema v2 with accessibility defaults.
`);
    process.exit(1);
  }
  
  const command = args[0];
  
  try {
    if (command === 'lesson') {
      const packId = args[1];
      const slug = args[2];
      
      if (!packId || !slug) {
        throw new Error('Missing required arguments: lesson <packId> <slug>');
      }
      
      // Parse CLI flags
      const skillsIndex = args.indexOf('--skills');
      const biomeIndex = args.indexOf('--biome');
      const titleIndex = args.indexOf('--title');
      
      if (skillsIndex === -1 || biomeIndex === -1 || titleIndex === -1) {
        throw new Error('Missing required flags: --skills, --biome, --title');
      }
      
      const skills = args[skillsIndex + 1]?.split(',') || [];
      const biome = args[biomeIndex + 1] || '';
      const title = args[titleIndex + 1] || '';
      
      if (skills.length === 0 || !biome || !title) {
        throw new Error('All flags must have values');
      }
      
      const lessonPath = await generateLesson({ packId, slug, skills, biome, title });
      
      console.log(`✅ Generated lesson: ${lessonPath}`);
      console.log(`   ID: ${slug}-v1`);
      console.log(`   Skills: ${skills.join(', ')}`);
      console.log(`   Biome: ${biome}`);
      console.log(`   Caption stub created for accessibility`);
      
    } else if (command === 'journal') {
      const skillId = args[1];
      
      if (!skillId) {
        throw new Error('Missing required argument: journal <skillId>');
      }
      
      const ageIndex = args.indexOf('--age');
      const nIndex = args.indexOf('--n');
      
      if (ageIndex === -1 || nIndex === -1) {
        throw new Error('Missing required flags: --age, --n');
      }
      
      const age = args[ageIndex + 1] || '';
      const n = parseInt(args[nIndex + 1] || '0');
      
      if (!age || isNaN(n) || n <= 0) {
        throw new Error('Invalid flag values: --age must be "X-Y" format, --n must be positive number');
      }
      
      await generateJournal({ skillId, age, n });
      
    } else {
      throw new Error(`Unknown command: ${command}`);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}