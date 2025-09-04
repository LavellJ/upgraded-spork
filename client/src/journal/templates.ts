/**
 * Template utilities for generating parameterized journal items
 * Provides functions for creating MCQ and open-ended questions with variants
 */

import { nanoid } from 'nanoid';
import type { JournalItem } from '../schema/journal';

// Type definitions for template utilities
export interface MCQOptions {
  stem: string;
  choices: string[];
  answerIdx: number;
  explanation?: string;
}

export interface OpenOptions {
  prompt: string;
  rubricHint: string;
  sampleAnswer?: string;
}

export interface AgeBandItem {
  prompt: string;
  kind: 'mcq' | 'short';
  options?: string[];
  answer: string;
  explanation: string;
}

export interface ParametricItem {
  id: string;
  skillId: string;
  ageBands: {
    "5-8": AgeBandItem[];
    "9-12": AgeBandItem[];
  };
  difficulty: 1 | 2 | 3;
}

/**
 * Create a multiple choice question with specified stem, choices, and correct answer
 */
export function makeMCQ({ stem, choices, answerIdx, explanation }: MCQOptions): Omit<JournalItem, 'id' | 'skillId'> {
  if (answerIdx < 0 || answerIdx >= choices.length) {
    throw new Error(`Answer index ${answerIdx} is out of range for ${choices.length} choices`);
  }

  return {
    prompt: stem,
    kind: 'mcq',
    options: choices,
    answer: answerIdx.toString(),
    explanation: explanation || `The correct answer is "${choices[answerIdx]}".`
  };
}

/**
 * Create an open-ended question with rubric hint for assessment
 */
export function makeOpen({ prompt, rubricHint, sampleAnswer }: OpenOptions): Omit<JournalItem, 'id' | 'skillId'> {
  return {
    prompt,
    kind: 'short',
    answer: sampleAnswer || 'Sample answer will vary',
    explanation: rubricHint
  };
}

/**
 * Generate a random integer within the specified range (inclusive)
 */
export function paramRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Create variants of a parameterized prompt by substituting placeholders
 */
export function renderVariant(template: string, params: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(params)) {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value.toString());
  }
  
  return result;
}

/**
 * Generate multiple variants of a parametric template
 */
export function generateVariants(
  template: string,
  paramGenerators: Record<string, () => any>,
  count: number
): string[] {
  const variants: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const params: Record<string, any> = {};
    
    for (const [key, generator] of Object.entries(paramGenerators)) {
      params[key] = generator();
    }
    
    variants.push(renderVariant(template, params));
  }
  
  return variants;
}

/**
 * Convert a parametric item to age-appropriate JournalItems
 */
export function convertToJournalItems(
  parametricItem: ParametricItem,
  ageBand: "5-8" | "9-12"
): JournalItem[] {
  const ageBandItems = parametricItem.ageBands[ageBand];
  
  return ageBandItems.map(item => ({
    id: nanoid(),
    skillId: parametricItem.skillId,
    ...item
  }));
}

/**
 * Helper to create fraction problems with parameterization
 */
export function makeFractionMCQ(numerator: number, denominator: number, operation: string): Omit<JournalItem, 'id' | 'skillId'> {
  const fraction = `${numerator}/${denominator}`;
  let stem: string;
  let choices: string[];
  let answerIdx: number;
  
  switch (operation) {
    case 'identify':
      stem = `What fraction is shaded?`;
      choices = [
        `${numerator}/${denominator}`,
        `${denominator}/${numerator}`,
        `${numerator + 1}/${denominator}`,
        `${numerator}/${denominator + 1}`
      ];
      answerIdx = 0;
      break;
      
    case 'equivalent':
      const multiplier = paramRange(2, 4);
      stem = `Which fraction is equivalent to ${fraction}?`;
      choices = [
        `${numerator * multiplier}/${denominator * multiplier}`,
        `${numerator + multiplier}/${denominator + multiplier}`,
        `${numerator * 2}/${denominator * 3}`,
        `${numerator}/${denominator * 2}`
      ];
      answerIdx = 0;
      break;
      
    case 'compare':
      const otherNum = paramRange(1, denominator - 1);
      const comparison = numerator > otherNum ? 'greater' : 'less';
      stem = `Is ${fraction} greater than or less than ${otherNum}/${denominator}?`;
      choices = ['greater', 'less', 'equal', 'cannot tell'];
      answerIdx = comparison === 'greater' ? 0 : 1;
      break;
      
    default:
      throw new Error(`Unknown fraction operation: ${operation}`);
  }
  
  return makeMCQ({
    stem,
    choices,
    answerIdx,
    explanation: `For fractions with the same denominator, compare the numerators.`
  });
}

/**
 * Helper to create measurement problems with parameterization
 */
export function makeMeasurementMCQ(value: number, unit: string, concept: string): Omit<JournalItem, 'id' | 'skillId'> {
  let stem: string;
  let choices: string[];
  let answerIdx: number;
  
  switch (concept) {
    case 'area':
      stem = `A rectangle is ${value} cm long and ${value} cm wide. What is its area?`;
      const area = value * value;
      choices = [
        `${area} square cm`,
        `${value * 2} square cm`,
        `${value + value} square cm`,
        `${area * 2} square cm`
      ];
      answerIdx = 0;
      break;
      
    case 'volume':
      stem = `A cube has sides of ${value} cm. What is its volume?`;
      const volume = value * value * value;
      choices = [
        `${volume} cubic cm`,
        `${value * 3} cubic cm`,
        `${value * value} cubic cm`,
        `${volume * 2} cubic cm`
      ];
      answerIdx = 0;
      break;
      
    case 'perimeter':
      stem = `A square has sides of ${value} cm. What is its perimeter?`;
      const perimeter = value * 4;
      choices = [
        `${perimeter} cm`,
        `${value * 2} cm`,
        `${value * value} cm`,
        `${value + 4} cm`
      ];
      answerIdx = 0;
      break;
      
    default:
      throw new Error(`Unknown measurement concept: ${concept}`);
  }
  
  return makeMCQ({
    stem,
    choices,
    answerIdx,
    explanation: `Remember the formula for ${concept} and substitute the values.`
  });
}

/**
 * Helper to create data reading problems
 */
export function makeDataReadingMCQ(dataType: string, values: number[]): Omit<JournalItem, 'id' | 'skillId'> {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const sum = values.reduce((a, b) => a + b, 0);
  const average = Math.round(sum / values.length);
  
  let stem: string;
  let choices: string[];
  let answerIdx: number;
  
  switch (dataType) {
    case 'maximum':
      stem = `Look at this data: ${values.join(', ')}. What is the highest value?`;
      choices = [max.toString(), min.toString(), average.toString(), sum.toString()];
      answerIdx = 0;
      break;
      
    case 'minimum':
      stem = `Look at this data: ${values.join(', ')}. What is the lowest value?`;
      choices = [min.toString(), max.toString(), average.toString(), sum.toString()];
      answerIdx = 0;
      break;
      
    case 'range':
      const range = max - min;
      stem = `Look at this data: ${values.join(', ')}. What is the range?`;
      choices = [range.toString(), max.toString(), min.toString(), average.toString()];
      answerIdx = 0;
      break;
      
    default:
      throw new Error(`Unknown data type: ${dataType}`);
  }
  
  return makeMCQ({
    stem,
    choices,
    answerIdx,
    explanation: `The ${dataType} helps us understand the spread of data.`
  });
}