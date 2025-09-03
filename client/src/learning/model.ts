export type SkillId = string;
export type AgeBand = '5-6' | '7-8' | '9-10' | '11-12';

export type Mastery = {
  p: number;        // probability/confidence 0..1
  seen: number;     // times encountered
  correct: number;  // times answered correctly
  streak: number;   // current streak of correct answers
  lastAt?: number;  // timestamp of last interaction
};

export type LearnerState = {
  version: 1;
  skills: Record<SkillId, Mastery>;
};

import { ns, BASE_KEYS } from '../storage/namespace';

// Load learner state from localStorage
export function loadLearner(learnerId?: string): LearnerState {
  try {
    const storageKey = learnerId ? ns(learnerId, BASE_KEYS.learner) : 'qi.learner.v1'; // fallback for legacy
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.version === 1 && parsed.skills) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to load learner state:', error);
  }
  
  // Return default empty state
  return {
    version: 1,
    skills: {}
  };
}

// Save learner state to localStorage
export function saveLearner(state: LearnerState, learnerId?: string): void {
  try {
    const storageKey = learnerId ? ns(learnerId, BASE_KEYS.learner) : 'qi.learner.v1'; // fallback for legacy
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save learner state:', error);
  }
}

// Ensure a skill exists in the state, create with defaults if not
export function ensureSkill(state: LearnerState, id: SkillId): Mastery {
  if (!state.skills[id]) {
    state.skills[id] = {
      p: 0.5,      // start with 50% confidence
      seen: 0,
      correct: 0,
      streak: 0
    };
  }
  return state.skills[id];
}

// Update mastery for a skill based on outcome
export function updateMastery(
  state: LearnerState, 
  id: SkillId, 
  outcome: 'correct' | 'wrong', 
  weight: number = 1
): LearnerState {
  const skill = ensureSkill(state, id);
  
  // ELO-style update
  const k = 0.12 * weight;
  if (outcome === 'correct') {
    skill.p = skill.p + k * (1 - skill.p);
    skill.correct++;
    skill.streak++;
  } else {
    skill.p = skill.p - k * skill.p;
    skill.streak = 0;
  }
  
  // Update counters
  skill.seen++;
  skill.lastAt = Date.now();
  
  // Clamp probability to reasonable bounds
  skill.p = Math.max(0.05, Math.min(0.99, skill.p));
  
  return { ...state };
}

// Optional decay over time (per 7 days)
export function decayMastery(state: LearnerState, now: number = Date.now()): LearnerState {
  const weekInMs = 7 * 24 * 60 * 60 * 1000;
  let hasChanges = false;
  
  for (const [skillId, skill] of Object.entries(state.skills)) {
    if (skill.lastAt) {
      const weeksSince = (now - skill.lastAt) / weekInMs;
      if (weeksSince > 0) {
        const decayFactor = Math.pow(0.98, weeksSince);
        const newP = skill.p * decayFactor;
        if (Math.abs(newP - skill.p) > 0.001) {
          skill.p = Math.max(0.05, newP);
          hasChanges = true;
        }
      }
    }
  }
  
  return hasChanges ? { ...state } : state;
}

// Initialize skill baselines based on age band
export function initSeed(state: LearnerState, ageBand: AgeBand): LearnerState {
  // Define skill categories for seeding
  const earlySkills = [
    'literacy.phonics', 'literacy.sight-words', 'math.counting', 'math.number-recognition',
    'general.forest', 'biome.forest'
  ];
  
  const coreSkills = [
    'literacy.reading', 'literacy.vocabulary', 'math.addition', 'math.subtraction',
    'science.observation', 'general.desert', 'biome.desert', 'general.ocean', 'biome.ocean'
  ];
  
  const stretchSkills = [
    'literacy.comprehension', 'math.multiplication', 'math.division', 'science.forces',
    'science.ecology', 'general.night', 'biome.night'
  ];

  // Define baseline probabilities by age band
  const baselines = {
    '5-6': { early: 0.35, core: 0.20, stretch: 0.15 },
    '7-8': { early: 0.55, core: 0.40, stretch: 0.25 },
    '9-10': { early: 0.70, core: 0.65, stretch: 0.45 },
    '11-12': { early: 0.80, core: 0.75, stretch: 0.55 }
  };

  const ageBandBaselines = baselines[ageBand];
  
  // Apply seeding only to skills not yet seen
  const skillsToSeed = [
    ...earlySkills.map(id => ({ id, p: ageBandBaselines.early })),
    ...coreSkills.map(id => ({ id, p: ageBandBaselines.core })),
    ...stretchSkills.map(id => ({ id, p: ageBandBaselines.stretch }))
  ];

  let hasChanges = false;
  
  for (const { id, p } of skillsToSeed) {
    // Only seed if skill hasn't been seen yet
    if (!state.skills[id] || state.skills[id].seen === 0) {
      state.skills[id] = {
        p: Math.max(0.05, Math.min(0.99, p)),
        seen: 0,
        correct: 0,
        streak: 0
      };
      hasChanges = true;
    }
  }

  return hasChanges ? { ...state } : state;
}

// Singleton in-memory cache with subscription
class LearnerCache {
  private state: LearnerState;
  private subscribers: Set<(state: LearnerState) => void> = new Set();
  
  private learnerId?: string;
  
  constructor(learnerId?: string) {
    this.learnerId = learnerId;
    this.state = loadLearner(learnerId);
    
    // Apply decay on initialization
    const decayed = decayMastery(this.state);
    if (decayed !== this.state) {
      this.state = decayed;
      saveLearner(this.state, this.learnerId);
    }
  }
  
  getState(): LearnerState {
    return this.state;
  }
  
  setState(newState: LearnerState): void {
    this.state = newState;
    saveLearner(this.state, this.learnerId);
    this.notifySubscribers();
  }
  
  subscribe(callback: (state: LearnerState) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.state));
  }
  
  // Utility methods
  updateSkill(skillId: SkillId, outcome: 'correct' | 'wrong', weight?: number): void {
    const updated = updateMastery(this.state, skillId, outcome, weight);
    this.setState(updated);
  }
  
  getSkillMastery(skillId: SkillId): Mastery | undefined {
    return this.state.skills[skillId];
  }
  
  reset(): void {
    this.setState({ version: 1, skills: {} });
  }

  // Initialize skill baselines based on age band
  seedForAgeBand(ageBand: AgeBand): void {
    const seeded = initSeed(this.state, ageBand);
    if (seeded !== this.state) {
      this.setState(seeded);
    }
  }
}

// Export singleton instance (will be updated to use active learner)
export const learnerCache = new LearnerCache();

// Create a learner cache for a specific learner
export function createLearnerCache(learnerId: string): LearnerCache {
  return new LearnerCache(learnerId);
}