export type SkillId = string;

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

const STORAGE_KEY = 'qi.learner.v1';

// Load learner state from localStorage
export function loadLearner(): LearnerState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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
export function saveLearner(state: LearnerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

// Singleton in-memory cache with subscription
class LearnerCache {
  private state: LearnerState;
  private subscribers: Set<(state: LearnerState) => void> = new Set();
  
  constructor() {
    this.state = loadLearner();
    
    // Apply decay on initialization
    const decayed = decayMastery(this.state);
    if (decayed !== this.state) {
      this.state = decayed;
      saveLearner(this.state);
    }
  }
  
  getState(): LearnerState {
    return this.state;
  }
  
  setState(newState: LearnerState): void {
    this.state = newState;
    saveLearner(this.state);
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
}

// Export singleton instance
export const learnerCache = new LearnerCache();