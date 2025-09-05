import type { JournalItem, SkillLevel, BandLevel } from '../schema/journal';
import { nanoid } from 'nanoid';
import { allBanks, getItemsForSkill, getAllAvailableSkills } from './banks';
import { getAdjustedDifficultyLevel } from '../authoring/tuning';
import type { AgeBand } from '../learning/model';

// Map mastery probability to difficulty level based on age band
export function mapMasteryToLevel(p: number, ageBand?: AgeBand): SkillLevel {
  // Base thresholds
  let easyThreshold = 0.45;
  let coreThreshold = 0.75;
  
  // Widen 'easy' threshold for younger age bands
  if (ageBand === '5-6' || ageBand === '7-8') {
    easyThreshold += 0.05; // easier threshold at 0.50
  }
  
  if (p < easyThreshold) {
    return 'easy';
  } else if (p < coreThreshold) {
    return 'core';
  } else {
    return 'stretch';
  }
}

// Generator interface for creating journal items
export interface JournalGenerator {
  generate(skillId: string, level: SkillLevel, n: number): Promise<JournalItem[]>;
  generateWithBands(skillTag: string, count: number, recentAccuracy?: number, recentMiscues?: Record<string, number>): Promise<JournalItem[]>;
  getAvailableSkills(): string[];
}

// Band weighting based on recent accuracy
function getBandWeights(recentAccuracy?: number): Record<BandLevel, number> {
  if (recentAccuracy === undefined) {
    return { easy: 0.2, med: 0.6, hard: 0.2 }; // Default balanced
  }
  
  if (recentAccuracy < 0.6) {
    return { easy: 0.7, med: 0.3, hard: 0.0 }; // Bias toward easy
  } else if (recentAccuracy > 0.85) {
    return { easy: 0.1, med: 0.4, hard: 0.5 }; // Bias toward hard
  } else {
    return { easy: 0.2, med: 0.6, hard: 0.2 }; // Standard balanced
  }
}

// Load schema v2 journal items from pack files
export async function loadPackJournalItems(packPath: string): Promise<JournalItem[]> {
  try {
    const response = await fetch(packPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch pack: ${response.status}`);
    }
    const items = await response.json();
    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.warn(`Failed to load journal pack from ${packPath}:`, error);
    return [];
  }
}

// Convert band level to skill level for compatibility
function bandToSkillLevel(band: BandLevel): SkillLevel {
  switch (band) {
    case 'easy': return 'easy';
    case 'med': return 'core';
    case 'hard': return 'stretch';
    default: return 'core';
  }
}

// Select items for a skill with band weighting and miscue targeting
export async function selectItemsForSkill(
  skillTag: string, 
  count: number, 
  recentMiscues?: Record<string, number>
): Promise<JournalItem[]> {
  // Try to load from pack files first
  const packPath = `/src/data/packs/core-math-hero/journal/frac_nl.json`;
  const packItems = await loadPackJournalItems(packPath);
  
  // Filter items by skill tag
  const relevantItems = packItems.filter(item => 
    item.tags?.includes(skillTag)
  );
  
  if (relevantItems.length === 0) {
    // Fallback to legacy generator with proper skill mapping
    const generator = new LocalGenerator();
    // Map M.FRAC.NL.3 to number.fractions or similar existing skill
    const mappedSkill = skillTag.includes('FRAC') ? 'number.fractions' : skillTag;
    return generator.generate(mappedSkill, 'core', count);
  }
  
  // Score items based on miscue relevance
  const scoredItems = relevantItems.map(item => {
    let miscueScore = 1.0; // Base score
    
    if (recentMiscues && item.miscue_types) {
      // Boost score for items that target recent miscues
      const relevantMiscues = item.miscue_types.filter(miscue => 
        recentMiscues[miscue] > 0
      );
      if (relevantMiscues.length > 0) {
        miscueScore += relevantMiscues.length * 0.5; // Boost for targeting miscues
      }
    }
    
    return { item, score: miscueScore };
  });
  
  // Sort by score (highest first) and select diverse items
  scoredItems.sort((a, b) => b.score - a.score);
  
  const selectedItems: JournalItem[] = [];
  const usedBands: Set<BandLevel> = new Set();
  
  // Select items ensuring band diversity
  for (const { item } of scoredItems) {
    if (selectedItems.length >= count) break;
    
    // Prioritize different bands for variety
    if (item.band && !usedBands.has(item.band) || selectedItems.length < count) {
      selectedItems.push({
        ...item,
        id: nanoid(), // Fresh ID
        skillId: skillTag // Ensure skillId is set
      });
      if (item.band) usedBands.add(item.band);
    }
  }
  
  // If we need more items, cycle through the scored items
  while (selectedItems.length < count && scoredItems.length > 0) {
    const nextItem = scoredItems[selectedItems.length % scoredItems.length];
    selectedItems.push({
      ...nextItem.item,
      id: nanoid(),
      skillId: skillTag
    });
  }
  
  return selectedItems;
}

// Legacy inline banks - now using external bank files
const LEGACY_ITEM_BANKS: Record<string, Record<SkillLevel, Array<Omit<JournalItem, 'id' | 'skillId'>>>> = {
  'literacy.phonics': {
    easy: [
      {
        prompt: "What sound does the letter 'm' make?",
        kind: 'mcq',
        options: ['/m/', '/n/', '/p/', '/b/'],
        answer: '0',
        explanation: "The letter 'm' makes the /m/ sound, like in 'mat' or 'mom'."
      },
      {
        prompt: "Which word starts with the /s/ sound?",
        kind: 'mcq',
        options: ['cat', 'sun', 'dog', 'hat'],
        answer: '1',
        explanation: "'sun' starts with the /s/ sound."
      }
    ],
    core: [
      {
        prompt: "Blend these sounds: c-a-t. What word do they make?",
        kind: 'short',
        answer: 'cat',
        explanation: "When you blend c-a-t together, you get the word 'cat'."
      },
      {
        prompt: "Which word rhymes with 'bat'?",
        kind: 'mcq',
        options: ['cat', 'dog', 'sun', 'big'],
        answer: '0',
        explanation: "'cat' and 'bat' both end with the same '-at' sound."
      }
    ],
    stretch: [
      {
        prompt: "Break this word into sounds: 'stop'. How many sounds do you hear?",
        kind: 'short',
        answer: '4',
        explanation: "The word 'stop' has 4 sounds: /s/-/t/-/o/-/p/."
      }
    ]
  },
  'literacy.sight-words': {
    easy: [
      {
        prompt: "Which is the sight word 'the'?",
        kind: 'mcq',
        options: ['cat', 'the', 'run', 'big'],
        answer: '1',
        explanation: "'the' is a common sight word we see in many sentences."
      }
    ],
    core: [
      {
        prompt: "Complete this sentence: 'I ___ a book.'",
        kind: 'mcq',
        options: ['read', 'blue', 'happy', 'jump'],
        answer: '0',
        explanation: "'read' makes sense in the sentence 'I read a book.'"
      }
    ],
    stretch: [
      {
        prompt: "Use the word 'because' in a sentence.",
        kind: 'short',
        answer: 'I stayed inside because it was raining.',
        explanation: "'because' connects a reason to an action or statement."
      }
    ]
  },
  'math.addition': {
    easy: [
      {
        prompt: "What is 2 + 1?",
        kind: 'mcq',
        options: ['2', '3', '4', '1'],
        answer: '1',
        explanation: "2 + 1 = 3. You can count: 2, then add 1 more to get 3."
      },
      {
        prompt: "Which equals 4?",
        kind: 'mcq',
        options: ['2 + 2', '1 + 1', '3 + 2', '1 + 0'],
        answer: '0',
        explanation: "2 + 2 = 4. You can use your fingers to count!"
      }
    ],
    core: [
      {
        prompt: "What is 5 + 3?",
        kind: 'short',
        answer: '8',
        explanation: "5 + 3 = 8. You can count up from 5: 6, 7, 8."
      },
      {
        prompt: "Tom has 4 apples. He gets 2 more. How many does he have now?",
        kind: 'short',
        answer: '6',
        explanation: "4 + 2 = 6 apples total."
      }
    ],
    stretch: [
      {
        prompt: "What is 8 + 7?",
        kind: 'short',
        answer: '15',
        explanation: "8 + 7 = 15. You can think of it as 8 + 2 = 10, then 10 + 5 = 15."
      }
    ]
  },
  'math.number-bonds': {
    easy: [
      {
        prompt: "Which two numbers make 5?",
        kind: 'mcq',
        options: ['2 and 3', '1 and 1', '3 and 3', '4 and 4'],
        answer: '0',
        explanation: "2 + 3 = 5, so 2 and 3 are number bonds to 5."
      }
    ],
    core: [
      {
        prompt: "What number goes with 3 to make 10?",
        kind: 'short',
        answer: '7',
        explanation: "3 + 7 = 10, so 7 is the number bond partner for 3 to make 10."
      }
    ],
    stretch: [
      {
        prompt: "Find all the ways to make 8 using two numbers.",
        kind: 'short',
        answer: '0+8, 1+7, 2+6, 3+5, 4+4',
        explanation: "All the number bond pairs for 8: 0+8, 1+7, 2+6, 3+5, 4+4."
      }
    ]
  },
  'science.forces': {
    easy: [
      {
        prompt: "Is opening a door a push or pull?",
        kind: 'mcq',
        options: ['push', 'pull', 'both', 'neither'],
        answer: '2',
        explanation: "Opening a door can be both push or pull, depending on which side you're on!"
      }
    ],
    core: [
      {
        prompt: "What force pulls things toward the ground?",
        kind: 'short',
        answer: 'gravity',
        explanation: "Gravity is the force that pulls objects toward Earth."
      }
    ],
    stretch: [
      {
        prompt: "Why do things slide faster on ice than on carpet?",
        kind: 'short',
        answer: 'Less friction on ice',
        explanation: "Ice has less friction than carpet, so objects slide more easily."
      }
    ]
  }
};

// Local generator implementation
class LocalGenerator implements JournalGenerator {
  async generateWithBands(skillTag: string, count: number, recentAccuracy?: number, recentMiscues?: Record<string, number>): Promise<JournalItem[]> {
    return selectItemsForSkill(skillTag, count, recentMiscues);
  }

  async generate(skillId: string, level: SkillLevel, n: number): Promise<JournalItem[]> {
    // Apply tuning adjustments to the requested difficulty level
    const adjustedLevel = getAdjustedDifficultyLevel(skillId, level);
    
    // First try to get items from the new bank files
    const bankItems = getItemsForSkill(skillId, adjustedLevel);
    
    if (bankItems.length > 0) {
      // Use items from bank files, cycling if needed
      return Array.from({ length: n }, (_, i) => {
        const sourceItem = bankItems[i % bankItems.length];
        return {
          ...sourceItem,
          id: nanoid(), // Generate fresh ID for each instance
          skillId // Ensure skillId matches what was requested
        };
      });
    }

    // Fallback to legacy banks for any missing skills
    const skillBank = LEGACY_ITEM_BANKS[skillId];
    if (!skillBank) {
      // Fallback to a generic skill if not found
      return this.generateFallback(skillId, adjustedLevel, n);
    }

    const levelBank = skillBank[adjustedLevel];
    if (!levelBank || levelBank.length === 0) {
      // Try other levels if current level is empty
      const allLevels: SkillLevel[] = ['easy', 'core', 'stretch'];
      for (const fallbackLevel of allLevels) {
        if (skillBank[fallbackLevel] && skillBank[fallbackLevel].length > 0) {
          return this.generate(skillId, fallbackLevel, n);
        }
      }
      return this.generateFallback(skillId, adjustedLevel, n);
    }

    // Select items (with repetition if needed)
    const items: JournalItem[] = [];
    for (let i = 0; i < n; i++) {
      const template = levelBank[i % levelBank.length];
      items.push({
        id: nanoid(),
        skillId,
        ...template
      });
    }

    return items;
  }

  getAvailableSkills(): string[] {
    return getAllAvailableSkills();
  }

  private async generateFallback(skillId: string, level: SkillLevel, n: number): Promise<JournalItem[]> {
    // Generic fallback items
    const fallbackItems: Array<Omit<JournalItem, 'id' | 'skillId'>> = [
      {
        prompt: `Let's practice ${skillId}. Can you think of an example?`,
        kind: 'short',
        answer: 'Any relevant example',
        explanation: 'Great thinking! Every example helps you practice.'
      },
      {
        prompt: `What do you find most interesting about ${skillId}?`,
        kind: 'short',
        answer: 'Personal interest',
        explanation: 'Connecting personal interests helps with learning!'
      },
      {
        prompt: `How would you explain ${skillId} to a friend?`,
        kind: 'short',
        answer: 'Simple explanation',
        explanation: 'Teaching others is a great way to learn!'
      }
    ];

    const items: JournalItem[] = [];
    for (let i = 0; i < n; i++) {
      const template = fallbackItems[i % fallbackItems.length];
      items.push({
        id: nanoid(),
        skillId,
        ...template
      });
    }

    return items;
  }
}

// Singleton instance
let generatorInstance: JournalGenerator | null = null;

export function getGenerator(): JournalGenerator {
  if (!generatorInstance) {
    generatorInstance = new LocalGenerator();
  }
  return generatorInstance;
}

// Helper function to determine appropriate level based on mastery (deprecated, use mapMasteryToLevel)
export function getLevelFromMastery(mastery: number): SkillLevel {
  return mapMasteryToLevel(mastery);
}

// Helper function to map skill IDs from lesson standards
export function inferSkillIdFromLesson(lessonId: string, biome: string): string {
  // Map lesson patterns to skill IDs
  const skillMappings: Record<string, string> = {
    // Forest (Literacy)
    'f1': 'literacy.phonics',
    'f2': 'literacy.phonics', 
    'f3': 'literacy.sight-words',
    'f4': 'literacy.sight-words',
    'f5': 'literacy.phonics',
    
    // Desert (Math)
    'd1': 'math.addition',
    'd2': 'math.number-bonds',
    'd3': 'math.addition',
    'd4': 'math.addition',
    'd5': 'math.addition',
    
    // Ocean (Science)
    'o1': 'science.forces',
    'o2': 'science.forces',
    'o3': 'science.forces',
    'o4': 'science.forces',
    'o5': 'science.forces'
  };
  
  return skillMappings[lessonId] || `${biome}.${lessonId}`;
}