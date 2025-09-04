/**
 * Journal Banks tests
 * Tests that banks return age-appropriate items with answer keys present
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getItemsForSkill, getAllAvailableSkills } from '../src/journal/banks';
import { mapMasteryToLevel } from '../src/journal/generator';
import type { JournalItem, SkillLevel } from '../src/schema/journal';
import type { AgeBand } from '../src/learning/model';

describe('Journal Banks', () => {
  describe('getItemsForSkill', () => {
    it('should return items for existing skills', () => {
      const phonicsItems = getItemsForSkill('literacy.phonics', 'easy');
      
      expect(phonicsItems).toBeDefined();
      expect(Array.isArray(phonicsItems)).toBe(true);
      expect(phonicsItems.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent skills', () => {
      const items = getItemsForSkill('nonexistent.skill', 'easy');
      
      expect(items).toBeDefined();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(0);
    });

    it('should return different items for different levels', () => {
      const easyItems = getItemsForSkill('math.addition', 'easy');
      const coreItems = getItemsForSkill('math.addition', 'core');
      const stretchItems = getItemsForSkill('math.addition', 'stretch');
      
      expect(easyItems.length).toBeGreaterThan(0);
      expect(coreItems.length).toBeGreaterThan(0);
      expect(stretchItems.length).toBeGreaterThan(0);
      
      // Items should be different across levels
      const easyIds = easyItems.map(item => item.id);
      const coreIds = coreItems.map(item => item.id);
      const stretchIds = stretchItems.map(item => item.id);
      
      expect(easyIds.some(id => coreIds.includes(id))).toBe(false);
      expect(coreIds.some(id => stretchIds.includes(id))).toBe(false);
    });

    it('should validate item structure and answer keys', () => {
      const skills = ['literacy.phonics', 'math.addition', 'science.forces'];
      const levels: SkillLevel[] = ['easy', 'core', 'stretch'];
      
      skills.forEach(skillId => {
        levels.forEach(level => {
          const items = getItemsForSkill(skillId, level);
          
          items.forEach(item => {
            // Basic structure validation
            expect(item.id).toBeDefined();
            expect(typeof item.id).toBe('string');
            expect(item.id.length).toBeGreaterThan(0);
            
            expect(item.skillId).toBe(skillId);
            expect(item.prompt).toBeDefined();
            expect(typeof item.prompt).toBe('string');
            expect(item.prompt.length).toBeGreaterThan(0);
            
            expect(item.kind).toBeDefined();
            expect(['mcq', 'short', 'long', 'match', 'order'].includes(item.kind)).toBe(true);
            
            // Answer key validation
            expect(item.answer).toBeDefined();
            if (item.kind === 'mcq') {
              expect(item.options).toBeDefined();
              expect(Array.isArray(item.options)).toBe(true);
              expect(item.options.length).toBeGreaterThan(1);
              expect(item.options.includes(item.answer)).toBe(true);
            }
            
            // Explanation should be present
            expect(item.explanation).toBeDefined();
            expect(typeof item.explanation).toBe('string');
            expect(item.explanation.length).toBeGreaterThan(0);
          });
        });
      });
    });

    it('should ensure unique item IDs within skill banks', () => {
      const skills = getAllAvailableSkills();
      const levels: SkillLevel[] = ['easy', 'core', 'stretch'];
      const allIds = new Set<string>();
      
      skills.forEach(skillId => {
        levels.forEach(level => {
          const items = getItemsForSkill(skillId, level);
          
          items.forEach(item => {
            expect(allIds.has(item.id)).toBe(false);
            allIds.add(item.id);
          });
        });
      });
    });
  });

  describe('Age-appropriate content', () => {
    it('should provide appropriate difficulty for different age bands', () => {
      const ageBands: AgeBand[] = ['5-6', '7-8', '9-10', '11-12'];
      const masteryLevels = [0.3, 0.5, 0.8]; // Low, medium, high mastery
      
      ageBands.forEach(ageBand => {
        masteryLevels.forEach(mastery => {
          const level = mapMasteryToLevel(mastery, ageBand);
          
          // Younger age bands should get easier content for the same mastery
          if (ageBand === '5-6' || ageBand === '7-8') {
            // Easier threshold for younger learners
            expect(['easy', 'core'].includes(level)).toBe(true);
          }
          
          // Validate that we get valid levels
          expect(['easy', 'core', 'stretch'].includes(level)).toBe(true);
        });
      });
    });

    it('should adjust difficulty thresholds for younger learners', () => {
      const mediumMastery = 0.47; // Just above base easy threshold (0.45)
      
      // Older learners should get 'core' level
      const olderLevel = mapMasteryToLevel(mediumMastery, '11-12');
      expect(olderLevel).toBe('core');
      
      // Younger learners should get 'easy' level (threshold increased to 0.50)
      const youngerLevel = mapMasteryToLevel(mediumMastery, '5-6');
      expect(youngerLevel).toBe('easy');
    });
  });

  describe('Content quality validation', () => {
    it('should have progressively harder content across levels', () => {
      const skillId = 'math.addition';
      const easyItems = getItemsForSkill(skillId, 'easy');
      const stretchItems = getItemsForSkill(skillId, 'stretch');
      
      // Easy items should typically have smaller numbers or simpler language
      easyItems.forEach(item => {
        expect(item.prompt.length).toBeLessThan(200); // Simpler prompts
      });
      
      // Stretch items may have more complex language
      stretchItems.forEach(item => {
        expect(item.prompt.length).toBeGreaterThan(0);
      });
    });

    it('should have educational explanations', () => {
      const skills = getAllAvailableSkills().slice(0, 3); // Test subset
      const levels: SkillLevel[] = ['easy', 'core', 'stretch'];
      
      skills.forEach(skillId => {
        levels.forEach(level => {
          const items = getItemsForSkill(skillId, level);
          
          items.forEach(item => {
            expect(item.explanation).toBeDefined();
            expect(item.explanation.length).toBeGreaterThan(10);
            
            // Explanations should be helpful, not just repeat the answer
            expect(item.explanation.toLowerCase()).not.toBe(item.answer.toLowerCase());
            
            // Should provide guidance or reasoning
            const hasGuidanceWords = /think|because|remember|try|use|count|listen|look|consider/.test(
              item.explanation.toLowerCase()
            );
            expect(hasGuidanceWords).toBe(true);
          });
        });
      });
    });

    it('should validate MCQ options are reasonable', () => {
      const skills = getAllAvailableSkills();
      
      skills.forEach(skillId => {
        const items = getItemsForSkill(skillId, 'core');
        
        items.filter(item => item.kind === 'mcq').forEach(item => {
          expect(item.options).toBeDefined();
          expect(item.options!.length).toBeGreaterThanOrEqual(3);
          expect(item.options!.length).toBeLessThanOrEqual(6);
          
          // All options should be unique
          const uniqueOptions = new Set(item.options);
          expect(uniqueOptions.size).toBe(item.options!.length);
          
          // Answer must be in options
          expect(item.options!.includes(item.answer)).toBe(true);
          
          // Options should be reasonable length
          item.options!.forEach(option => {
            expect(option.length).toBeGreaterThan(0);
            expect(option.length).toBeLessThan(50);
          });
        });
      });
    });
  });

  describe('getAllAvailableSkills', () => {
    it('should return a comprehensive list of skills', () => {
      const skills = getAllAvailableSkills();
      
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
      
      // Should include literacy skills
      expect(skills.some(skill => skill.startsWith('literacy.'))).toBe(true);
      
      // Should include math skills
      expect(skills.some(skill => skill.startsWith('math.'))).toBe(true);
      
      // Should include science skills
      expect(skills.some(skill => skill.startsWith('science.'))).toBe(true);
      
      // All skills should be valid strings
      skills.forEach(skill => {
        expect(typeof skill).toBe('string');
        expect(skill.length).toBeGreaterThan(0);
        expect(skill.includes('.')).toBe(true); // Should have domain.skill format
      });
    });

    it('should return skills that actually have content', () => {
      const skills = getAllAvailableSkills();
      const levels: SkillLevel[] = ['easy', 'core', 'stretch'];
      
      skills.forEach(skillId => {
        // Each skill should have content in at least one level
        const hasContent = levels.some(level => {
          const items = getItemsForSkill(skillId, level);
          return items.length > 0;
        });
        
        expect(hasContent).toBe(true);
      });
    });
  });

  describe('Pack integration', () => {
    it('should handle measurement skills for alpine pack', () => {
      // Alpine pack focuses on measurement skills
      const measurementItems = getItemsForSkill('math.measurement', 'core');
      
      if (measurementItems.length > 0) {
        measurementItems.forEach(item => {
          expect(item.skillId).toBe('math.measurement');
          expect(item.answer).toBeDefined();
          
          // Measurement items should relate to size, length, height, etc.
          const isMeasurementRelated = /length|height|width|size|tall|short|big|small|meter|centimeter/.test(
            item.prompt.toLowerCase()
          );
          expect(isMeasurementRelated).toBe(true);
        });
      }
    });

    it('should handle marine science skills for reef pack', () => {
      // Reef pack focuses on marine science
      const marineItems = getItemsForSkill('science.marine', 'core');
      
      if (marineItems.length > 0) {
        marineItems.forEach(item => {
          expect(item.skillId).toBe('science.marine');
          expect(item.answer).toBeDefined();
          
          // Marine items should relate to ocean, coral, fish, etc.
          const isMarineRelated = /ocean|sea|coral|fish|marine|water|reef|underwater/.test(
            item.prompt.toLowerCase()
          );
          expect(isMarineRelated).toBe(true);
        });
      }
    });
  });
});