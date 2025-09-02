/**
 * Central export for all journal item banks
 * Combines literacy, math, and science banks into a unified collection
 */

import { literacyBanks } from './literacy';
import { mathBanks } from './math';
import { scienceBanks } from './science';
import type { JournalItem } from '../../schema/journal';

export type ItemBank = Record<string, JournalItem[]>;
export type SkillBanks = Record<string, ItemBank>;

// Combine all banks into a single collection
export const allBanks: SkillBanks = {
  ...literacyBanks,
  ...mathBanks,
  ...scienceBanks
};

// Helper function to get items for a specific skill and level
export function getItemsForSkill(skillId: string, level: string): JournalItem[] {
  const skillBank = allBanks[skillId];
  if (!skillBank) {
    return [];
  }
  
  return skillBank[level] || [];
}

// Helper function to get all available skills
export function getAllAvailableSkills(): string[] {
  return Object.keys(allBanks);
}

// Helper function to get available levels for a skill
export function getAvailableLevels(skillId: string): string[] {
  const skillBank = allBanks[skillId];
  if (!skillBank) {
    return [];
  }
  
  return Object.keys(skillBank);
}

// Helper function to count total items across all banks
export function getTotalItemCount(): number {
  let total = 0;
  
  for (const skillBank of Object.values(allBanks)) {
    for (const levelItems of Object.values(skillBank)) {
      total += levelItems.length;
    }
  }
  
  return total;
}

// Helper function to get a random item from a skill/level
export function getRandomItem(skillId: string, level: string): JournalItem | null {
  const items = getItemsForSkill(skillId, level);
  if (items.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}