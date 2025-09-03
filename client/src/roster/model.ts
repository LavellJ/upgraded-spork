// Multi-learner roster management

export type LearnerProfile = {
  id: string;
  name: string;
  avatarId: string;
  ageBand: 'pre-primary' | 'primary' | 'upper-primary';
  createdAt: number;
  updatedAt: number;
};

export type Roster = {
  learners: LearnerProfile[];
  activeId: string;
};

const STORAGE_KEY = 'qi.roster.v1';

/**
 * Default learner ID for legacy data migration
 */
export const DEFAULT_LEARNER_ID = 'local-1';

/**
 * Loads the roster from localStorage
 */
export function loadRoster(): Roster | null {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * Saves the roster to localStorage
 */
export function saveRoster(roster: Roster): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
}

/**
 * Creates a default roster with a single learner (for migration or first run)
 */
export function createDefaultRoster(learnerName?: string): Roster {
  const defaultLearner: LearnerProfile = {
    id: DEFAULT_LEARNER_ID,
    name: learnerName || 'My Learner',
    avatarId: 'avatar-1',
    ageBand: 'primary',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const roster: Roster = {
    learners: [defaultLearner],
    activeId: DEFAULT_LEARNER_ID
  };

  saveRoster(roster);
  return roster;
}

/**
 * Sets the active learner
 */
export function setActiveLearner(roster: Roster, learnerId: string): Roster {
  const learner = roster.learners.find(l => l.id === learnerId);
  if (!learner) {
    throw new Error(`Learner ${learnerId} not found in roster`);
  }

  const updatedRoster = {
    ...roster,
    activeId: learnerId
  };

  saveRoster(updatedRoster);
  return updatedRoster;
}

/**
 * Adds a new learner to the roster
 */
export function addLearner(roster: Roster, learner: Omit<LearnerProfile, 'createdAt' | 'updatedAt'>): Roster {
  const now = Date.now();
  const newLearner: LearnerProfile = {
    ...learner,
    createdAt: now,
    updatedAt: now
  };

  const updatedRoster: Roster = {
    ...roster,
    learners: [...roster.learners, newLearner]
  };

  saveRoster(updatedRoster);
  return updatedRoster;
}

/**
 * Updates an existing learner in the roster
 */
export function updateLearner(roster: Roster, learnerId: string, updates: Partial<Omit<LearnerProfile, 'id' | 'createdAt'>>): Roster {
  const learnerIndex = roster.learners.findIndex(l => l.id === learnerId);
  if (learnerIndex === -1) {
    throw new Error(`Learner ${learnerId} not found in roster`);
  }

  const updatedLearner: LearnerProfile = {
    ...roster.learners[learnerIndex],
    ...updates,
    updatedAt: Date.now()
  };

  const updatedLearners = [...roster.learners];
  updatedLearners[learnerIndex] = updatedLearner;

  const updatedRoster: Roster = {
    ...roster,
    learners: updatedLearners
  };

  saveRoster(updatedRoster);
  return updatedRoster;
}

/**
 * Deletes a learner from the roster
 * Cannot delete the last learner or the currently active learner
 */
export function deleteLearner(roster: Roster, learnerId: string): Roster {
  if (roster.learners.length <= 1) {
    throw new Error('Cannot delete the last learner');
  }

  if (roster.activeId === learnerId) {
    throw new Error('Cannot delete the currently active learner');
  }

  const updatedRoster: Roster = {
    ...roster,
    learners: roster.learners.filter(l => l.id !== learnerId)
  };

  saveRoster(updatedRoster);
  return updatedRoster;
}

/**
 * Generates a unique learner ID
 */
export function generateLearnerId(): string {
  return `learner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Gets the active learner from the roster
 */
export function getActiveLearner(roster: Roster): LearnerProfile | null {
  return roster.learners.find(l => l.id === roster.activeId) || null;
}