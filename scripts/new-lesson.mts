#!/usr/bin/env tsx

/**
 * CLI scaffolder for creating new hero lessons from blueprints
 * Usage: tsx scripts/new-lesson.mts --id math_frac_equiv_3 --std M.FRAC.EQ.3 --biome reef --title "Fraction equivalence"
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { parseArgs } from 'util';
import { nanoid } from 'nanoid';

// Import blueprint API
import { makeLessonFromBlueprint, validateBlueprint, type LessonBlueprintInput } from '../client/src/authoring/LessonBlueprint.js';

interface CLIArgs {
  id: string;
  std: string;
  biome: 'reef' | 'alpine' | 'forest' | 'desert';
  title: string;
  subject?: 'math' | 'english' | 'science';
  pack?: string;
}

/**
 * Parse command line arguments
 */
function parseCliArgs(): CLIArgs {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      id: { type: 'string' },
      std: { type: 'string' },
      biome: { type: 'string' },
      title: { type: 'string' },
      subject: { type: 'string' },
      pack: { type: 'string' },
      help: { type: 'boolean', short: 'h' }
    },
    allowPositionals: true
  });

  if (values.help) {
    console.log(`
Usage: tsx scripts/new-lesson.mts [options]

Required options:
  --id       Lesson ID (e.g., math_frac_equiv_3)
  --std      Standards tag (e.g., M.FRAC.EQ.3)
  --biome    Biome type (reef|alpine|forest|desert)
  --title    Lesson title (e.g., "Fraction equivalence")

Optional options:
  --subject  Subject area (math|english|science) - auto-detected from std
  --pack     Pack name (default: core-{subject})
  --help     Show this help message

Examples:
  tsx scripts/new-lesson.mts --id math_frac_equiv_3 --std M.FRAC.EQ.3 --biome reef --title "Fraction equivalence"
  tsx scripts/new-lesson.mts --id eng_main_idea_3 --std E.READ.MAIN.3 --biome desert --title "Finding main ideas"
    `);
    process.exit(0);
  }

  const required = ['id', 'std', 'biome', 'title'];
  const missing = required.filter(arg => !values[arg]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required arguments: ${missing.join(', ')}`);
    console.error('Use --help for usage information');
    process.exit(1);
  }

  // Auto-detect subject from standards tag
  let subject = values.subject as 'math' | 'english' | 'science';
  if (!subject) {
    if (values.std!.startsWith('M.')) subject = 'math';
    else if (values.std!.startsWith('E.')) subject = 'english';
    else if (values.std!.startsWith('SCI.')) subject = 'science';
    else {
      console.error('❌ Cannot auto-detect subject from standards tag. Please specify --subject');
      process.exit(1);
    }
  }

  // Validate biome
  if (!['reef', 'alpine', 'forest', 'desert'].includes(values.biome as string)) {
    console.error('❌ Invalid biome. Must be: reef, alpine, forest, or desert');
    process.exit(1);
  }

  return {
    id: values.id!,
    std: values.std!,
    biome: values.biome as 'reef' | 'alpine' | 'forest' | 'desert',
    title: values.title!,
    subject,
    pack: values.pack || `core-${subject}`
  };
}

/**
 * Generate example content for the lesson
 */
function generateExampleContent(args: CLIArgs): LessonBlueprintInput {
  const videoPath = `/videos/${args.biome}/${args.id}`;
  
  // Generate subject-specific examples
  const examples = {
    math: {
      steps: [
        {
          prompt: "Look at this fraction. What does the bottom number tell us?",
          correct: "The number of equal parts",
          distractors: ["The number of colored parts", "The total amount"],
          hintPrimary: "The denominator shows how many equal parts the whole is divided into.",
          hintAlt: "Think of it like cutting a pizza into equal slices.",
          miscueTag: "denominator_confusion"
        },
        {
          prompt: "If we have 1/4, how many equal parts is the whole divided into?",
          correct: "4",
          distractors: ["1", "3", "5"],
          hintPrimary: "Look at the bottom number of the fraction.",
          hintAlt: "The denominator (bottom number) tells us the total parts."
        },
        {
          prompt: "Which fraction shows one part out of three equal parts?",
          correct: "1/3",
          distractors: ["3/1", "1/2", "2/3"],
          hintPrimary: "We want 1 part out of 3 total parts.",
          hintAlt: "The first number is how many parts, the second is total parts."
        }
      ],
      bank: [
        { prompt: "What fraction is shown? [image of 1/2 circle]", kind: 'mc' as const, correct: "1/2", distractors: ["1/4", "2/1", "1/3"] },
        { prompt: "Which is larger: 1/2 or 1/4?", kind: 'mc' as const, correct: "1/2", distractors: ["1/4", "They are equal"] },
        { prompt: "How many fourths make one whole?", kind: 'input' as const, correct: "4", distractors: ["1", "2", "3"] },
        { prompt: "What does 3/4 mean?", kind: 'mc' as const, correct: "3 parts out of 4", distractors: ["4 parts out of 3", "3 plus 4"] },
        { prompt: "Which fraction shows half?", kind: 'mc' as const, correct: "1/2", distractors: ["2/1", "1/4", "2/4"] }
      ],
      exit: [
        { prompt: "A pizza is cut into 8 equal slices. You eat 3 slices. What fraction did you eat?", correct: "3/8", distractors: ["8/3", "3/5", "5/8"] }
      ]
    },
    english: {
      steps: [
        {
          prompt: "When you read a story, what is the main idea?",
          correct: "The most important message",
          distractors: ["The first sentence", "The longest paragraph"],
          hintPrimary: "The main idea is what the whole story is mostly about.",
          hintAlt: "Think about what the author really wants you to understand.",
          miscueTag: "main_idea_confusion"
        },
        {
          prompt: "Where can you usually find clues about the main idea?",
          correct: "Throughout the whole text",
          distractors: ["Only in the first sentence", "Only at the end"],
          hintPrimary: "Main idea clues appear in many parts of the text.",
          hintAlt: "Look for repeated words and important details everywhere."
        },
        {
          prompt: "What question should you ask to find the main idea?",
          correct: "What is this mostly about?",
          distractors: ["Who is the main character?", "When did this happen?"],
          hintPrimary: "The main idea tells us the overall topic or message.",
          hintAlt: "Think about the big picture, not small details."
        }
      ],
      bank: [
        { prompt: "Read this paragraph. What is the main idea? [paragraph text]", kind: 'mc' as const, correct: "Dogs need exercise", distractors: ["Dogs like treats", "Dogs are pets"] },
        { prompt: "Which detail supports the main idea about healthy eating?", kind: 'mc' as const, correct: "Fruits have vitamins", distractors: ["Pizza tastes good", "Ice cream is cold"] },
        { prompt: "What is this article mostly about? [article excerpt]", kind: 'mc' as const, correct: "Ocean conservation", distractors: ["Fish species", "Beach pollution"] },
        { prompt: "Which sentence states the main idea?", kind: 'mc' as const, correct: "Exercise is important for health", distractors: ["I like to run", "Yesterday was sunny"] },
        { prompt: "What do all these details have in common? [list of details]", kind: 'mc' as const, correct: "They are about friendship", distractors: ["They are about school", "They are about sports"] }
      ],
      exit: [
        { prompt: "After reading about recycling, what is the main message?", correct: "We should recycle to help Earth", distractors: ["Recycling is hard", "Paper comes from trees"] }
      ]
    },
    science: {
      steps: [
        {
          prompt: "What do all living things need to survive?",
          correct: "Food, water, shelter, air",
          distractors: ["Only food and water", "Only shelter"],
          hintPrimary: "Think about what plants and animals both need to live.",
          hintAlt: "Consider the basic needs for any living creature.",
          miscueTag: "basic_needs_confusion"
        },
        {
          prompt: "Where do desert animals find water?",
          correct: "From their food and stored in their bodies",
          distractors: ["From rivers", "They don't need water"],
          hintPrimary: "Desert animals have special ways to get and save water.",
          hintAlt: "Some animals get water from the food they eat."
        },
        {
          prompt: "How do polar bears stay warm in the Arctic?",
          correct: "Thick fur and fat layer",
          distractors: ["They migrate south", "They hibernate all winter"],
          hintPrimary: "Polar bears have special body features for cold weather.",
          hintAlt: "Think about what covers their body to keep heat in."
        }
      ],
      bank: [
        { prompt: "Which habitat has very little rain?", kind: 'mc' as const, correct: "Desert", distractors: ["Rainforest", "Ocean", "Wetland"] },
        { prompt: "What adaptation helps fish live underwater?", kind: 'mc' as const, correct: "Gills", distractors: ["Wings", "Thick fur", "Long legs"] },
        { prompt: "Which animal is adapted for cold climates?", kind: 'mc' as const, correct: "Penguin", distractors: ["Lizard", "Butterfly", "Snake"] },
        { prompt: "Where would you find the most plants?", kind: 'mc' as const, correct: "Rainforest", distractors: ["Desert", "Arctic", "Deep ocean"] },
        { prompt: "What do we call an animal's natural home?", kind: 'input' as const, correct: "Habitat", distractors: ["House", "Nest", "Territory"] }
      ],
      exit: [
        { prompt: "A cactus has thick, waxy skin. This helps it to...", correct: "Store water in the desert", distractors: ["Fly in the wind", "Hide from predators"] }
      ]
    }
  };

  return {
    id: args.id,
    title: args.title,
    stdTag: args.std,
    biome: args.biome,
    teach: {
      videoSrc: `${videoPath}.mp4`,
      captionsVtt: `${videoPath}.vtt`,
      transcript: `Welcome to this lesson on ${args.title.toLowerCase()}. Today we'll explore this important concept step by step, with plenty of practice to help you master it.`
    },
    steps: examples[args.subject!].steps,
    bank: examples[args.subject!].bank,
    exit: examples[args.subject!].exit,
    whyThis: `Understanding ${args.title.toLowerCase()} is essential for building strong ${args.subject} skills and will help you in more advanced topics.`
  };
}

/**
 * Create lesson file and directories
 */
function createLessonFiles(args: CLIArgs, lessonData: any): void {
  const packDir = `client/src/data/packs/${args.pack}`;
  const lessonsDir = `${packDir}/lessons`;
  const mediaDir = `${packDir}/media/${args.id}`;

  // Create directories
  [packDir, lessonsDir, mediaDir].forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });

  // Write lesson JSON file
  const lessonPath = `${lessonsDir}/${args.id}.json`;
  writeFileSync(lessonPath, JSON.stringify(lessonData, null, 2));
  console.log(`📄 Created lesson file: ${lessonPath}`);

  // Create placeholder media files
  const videoPath = `${mediaDir}/${args.id}.mp4`;
  const vttPath = `${mediaDir}/${args.id}.vtt`;
  
  // Create placeholder VTT file
  const vttContent = `WEBVTT

00:00:01.000 --> 00:00:05.000
Welcome to this lesson on ${args.title.toLowerCase()}.

00:00:05.000 --> 00:00:10.000
Today we'll explore this important concept step by step.

00:00:10.000 --> 00:00:15.000
With plenty of practice to help you master it.`;

  writeFileSync(vttPath, vttContent);
  console.log(`📹 Created caption file: ${vttPath}`);
  
  // Create reminder for video file
  console.log(`📹 TODO: Add video file: ${videoPath}`);
}

/**
 * Update pack registry
 */
async function updatePackRegistry(args: CLIArgs): Promise<void> {
  const registryPath = `client/src/data/packs/${args.pack}/registry.json`;
  
  let registry: any = { lessons: [], journal: {}, media: { videos: [], images: [] } };
  
  if (existsSync(registryPath)) {
    try {
      const fs = await import('fs');
      registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    } catch (error) {
      console.warn(`⚠️  Could not read existing registry: ${registryPath}`);
    }
  }

  // Add lesson to registry
  const lessonEntry = {
    id: args.id,
    title: args.title,
    skillTag: args.std,
    difficulty: 'introductory',
    estimatedMinutes: 15
  };

  registry.lessons = registry.lessons || [];
  registry.lessons.push(lessonEntry);

  // Add media references
  registry.media = registry.media || { videos: [], images: [] };
  registry.media.videos.push(`media/${args.id}/${args.id}.mp4`);

  writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  console.log(`📋 Updated registry: ${registryPath}`);
}

/**
 * Validate created files
 */
function validateFiles(args: CLIArgs): void {
  const checks = [
    { file: `client/src/data/packs/${args.pack}/lessons/${args.id}.json`, desc: 'Lesson JSON' },
    { file: `client/src/data/packs/${args.pack}/media/${args.id}/${args.id}.vtt`, desc: 'Caption file' },
    { file: `client/src/data/packs/${args.pack}/registry.json`, desc: 'Registry file' }
  ];

  console.log('\n🔍 Validation checklist:');
  checks.forEach(check => {
    const exists = existsSync(check.file);
    console.log(`${exists ? '✅' : '❌'} ${check.desc}: ${check.file}`);
  });

  const videoPath = `client/src/data/packs/${args.pack}/media/${args.id}/${args.id}.mp4`;
  console.log(`🎥 Manual TODO: Add video file: ${videoPath}`);
}

/**
 * Main scaffolding function
 */
async function main(): Promise<void> {
  try {
    console.log('🚀 LearnOz Lesson Scaffolder\n');
    
    const args = parseCliArgs();
    console.log(`📝 Creating lesson: ${args.title} (${args.id})`);
    console.log(`📊 Standards: ${args.std}`);
    console.log(`🏞️  Biome: ${args.biome}`);
    console.log(`📦 Pack: ${args.pack}\n`);

    // Generate blueprint input
    const blueprintInput = generateExampleContent(args);
    
    // Validate blueprint
    const validation = validateBlueprint(blueprintInput);
    if (!validation.success) {
      console.error('❌ Blueprint validation failed:');
      validation.errors?.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }

    // Create lesson from blueprint
    const lessonData = makeLessonFromBlueprint(validation.data!);
    
    // Create files
    createLessonFiles(args, lessonData);
    await updatePackRegistry(args);
    
    // Validate creation
    validateFiles(args);

    console.log(`\n✅ Successfully created lesson: ${args.id}`);
    console.log('\n📋 Next steps:');
    console.log('1. Add the actual video file (.mp4)');
    console.log('2. Review and customize the generated content');
    console.log('3. Test the lesson in the app');
    console.log('4. Update main registry.json if needed');

  } catch (error) {
    console.error('❌ Error creating lesson:', error);
    process.exit(1);
  }
}

// Run the scaffolder
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}