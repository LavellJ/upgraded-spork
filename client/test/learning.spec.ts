/**
 * Tests for learner model functions
 * Validates mastery updates, streak tracking, and state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  updateMastery, 
  ensureSkill, 
  decayMastery,
  loadLearner,
  saveLearner,
  type LearnerState 
} from '../src/learning/model';

describe('Learner Model', () => {
  let learnerState: LearnerState;

  beforeEach(() => {
    // Fresh state for each test
    learnerState = {
      version: 1,
      skills: {}
    };
  });

  describe('ensureSkill', () => {
    it('should create new skill with default values', () => {
      const skill = ensureSkill(learnerState, 'test.skill');
      
      expect(skill.p).toBe(0.5);
      expect(skill.seen).toBe(0);
      expect(skill.correct).toBe(0);
      expect(skill.streak).toBe(0);
      expect(skill.lastAt).toBeUndefined();
    });

    it('should return existing skill without modification', () => {
      // Add a skill manually
      learnerState.skills['existing.skill'] = {
        p: 0.8,
        seen: 5,
        correct: 4,
        streak: 2,
        lastAt: 1000
      };

      const skill = ensureSkill(learnerState, 'existing.skill');
      
      expect(skill.p).toBe(0.8);
      expect(skill.seen).toBe(5);
      expect(skill.correct).toBe(4);
      expect(skill.streak).toBe(2);
      expect(skill.lastAt).toBe(1000);
    });
  });

  describe('updateMastery', () => {
    it('should increase p on correct answer', () => {
      const initialP = 0.5;
      ensureSkill(learnerState, 'test.skill');
      
      const updatedState = updateMastery(learnerState, 'test.skill', 'correct');
      const skill = updatedState.skills['test.skill'];
      
      expect(skill.p).toBeGreaterThan(initialP);
      expect(skill.correct).toBe(1);
      expect(skill.seen).toBe(1);
      expect(skill.streak).toBe(1);
      expect(skill.lastAt).toBeDefined();
    });

    it('should decrease p on wrong answer', () => {
      const initialP = 0.5;
      ensureSkill(learnerState, 'test.skill');
      
      const updatedState = updateMastery(learnerState, 'test.skill', 'wrong');
      const skill = updatedState.skills['test.skill'];
      
      expect(skill.p).toBeLessThan(initialP);
      expect(skill.correct).toBe(0);
      expect(skill.seen).toBe(1);
      expect(skill.streak).toBe(0);
      expect(skill.lastAt).toBeDefined();
    });

    it('should increment streak on consecutive correct answers', () => {
      ensureSkill(learnerState, 'test.skill');
      
      let state = updateMastery(learnerState, 'test.skill', 'correct');
      expect(state.skills['test.skill'].streak).toBe(1);
      
      state = updateMastery(state, 'test.skill', 'correct');
      expect(state.skills['test.skill'].streak).toBe(2);
      
      state = updateMastery(state, 'test.skill', 'correct');
      expect(state.skills['test.skill'].streak).toBe(3);
    });

    it('should reset streak on wrong answer', () => {
      ensureSkill(learnerState, 'test.skill');
      
      let state = updateMastery(learnerState, 'test.skill', 'correct');
      state = updateMastery(state, 'test.skill', 'correct');
      expect(state.skills['test.skill'].streak).toBe(2);
      
      state = updateMastery(state, 'test.skill', 'wrong');
      expect(state.skills['test.skill'].streak).toBe(0);
    });

    it('should clamp probability to valid bounds', () => {
      ensureSkill(learnerState, 'test.skill');
      
      // Force high probability then try to increase
      learnerState.skills['test.skill'].p = 0.99;
      let state = updateMastery(learnerState, 'test.skill', 'correct');
      expect(state.skills['test.skill'].p).toBeLessThanOrEqual(0.99);
      
      // Force low probability then try to decrease
      learnerState.skills['test.skill'].p = 0.05;
      state = updateMastery(learnerState, 'test.skill', 'wrong');
      expect(state.skills['test.skill'].p).toBeGreaterThanOrEqual(0.05);
    });

    it('should apply weight multiplier correctly', () => {
      ensureSkill(learnerState, 'test.skill');
      const initialP = learnerState.skills['test.skill'].p;
      
      const state1 = updateMastery(learnerState, 'test.skill', 'correct', 1);
      const change1 = state1.skills['test.skill'].p - initialP;
      
      // Reset
      ensureSkill(learnerState, 'test.skill2');
      const state2 = updateMastery(learnerState, 'test.skill2', 'correct', 2);
      const change2 = state2.skills['test.skill2'].p - initialP;
      
      expect(Math.abs(change2)).toBeGreaterThan(Math.abs(change1));
    });

    it('should update lastAt timestamp', () => {
      ensureSkill(learnerState, 'test.skill');
      const before = Date.now();
      
      const updatedState = updateMastery(learnerState, 'test.skill', 'correct');
      const after = Date.now();
      
      const lastAt = updatedState.skills['test.skill'].lastAt!;
      expect(lastAt).toBeGreaterThanOrEqual(before);
      expect(lastAt).toBeLessThanOrEqual(after);
    });
  });

  describe('decayMastery', () => {
    it('should not decay recent skills', () => {
      ensureSkill(learnerState, 'test.skill');
      learnerState.skills['test.skill'].p = 0.8;
      learnerState.skills['test.skill'].lastAt = Date.now() - 1000; // 1 second ago
      
      const decayedState = decayMastery(learnerState, Date.now());
      
      expect(decayedState.skills['test.skill'].p).toBe(0.8);
    });

    it('should decay old skills', () => {
      ensureSkill(learnerState, 'test.skill');
      learnerState.skills['test.skill'].p = 0.8;
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      learnerState.skills['test.skill'].lastAt = oneWeekAgo;
      
      const decayedState = decayMastery(learnerState, Date.now());
      
      expect(decayedState.skills['test.skill'].p).toBeLessThan(0.8);
      expect(decayedState.skills['test.skill'].p).toBeGreaterThanOrEqual(0.05);
    });

    it('should respect minimum probability floor', () => {
      ensureSkill(learnerState, 'test.skill');
      learnerState.skills['test.skill'].p = 0.1;
      const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      learnerState.skills['test.skill'].lastAt = oneMonthAgo;
      
      const decayedState = decayMastery(learnerState, Date.now());
      
      expect(decayedState.skills['test.skill'].p).toBeGreaterThanOrEqual(0.05);
    });
  });

  describe('state persistence', () => {
    it('should save and load learner state', () => {
      // Create a test state
      const testSkill = {
        p: 0.75,
        seen: 3,
        correct: 2,
        streak: 1,
        lastAt: Date.now()
      };
      learnerState.skills['test.skill'] = testSkill;

      // Save and load
      saveLearner(learnerState);
      const loadedState = loadLearner();

      expect(loadedState.version).toBe(1);
      expect(loadedState.skills['test.skill']).toBeDefined();
      expect(loadedState.skills['test.skill']?.p).toBe(testSkill.p);
      expect(loadedState.skills['test.skill']?.seen).toBe(testSkill.seen);
      expect(loadedState.skills['test.skill']?.correct).toBe(testSkill.correct);
      expect(loadedState.skills['test.skill']?.streak).toBe(testSkill.streak);
    });

    it('should handle missing localStorage gracefully', () => {
      // Clear localStorage to simulate missing data
      localStorage.removeItem('qi.learner.v1');
      
      const loadedState = loadLearner();
      
      expect(loadedState.version).toBe(1);
      expect(loadedState.skills).toEqual({});
    });
  });
});