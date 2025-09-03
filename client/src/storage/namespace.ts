// Storage key namespacing for multi-learner support

/**
 * Creates a namespaced storage key for per-learner data
 * @param learnerId - The learner ID to namespace under
 * @param key - The base storage key (without qi prefix)
 * @returns Namespaced key in format: qi.{learnerId}.{key}
 */
export function ns(learnerId: string, key: string): string {
  return `qi.${learnerId}.${key}`;
}

/**
 * Legacy storage keys that need migration to namespaced format
 */
export const LEGACY_KEYS = {
  profile: 'qi.profile.v1',
  learner: 'qi.learner.v1', 
  events: 'qi_events',
  journalHistory: 'qi.journal.history.v1',
  reflections: 'qi.reflections.v1',
  assignedPaths: 'qi.assigned.paths.v1',
  syncQueue: 'qi.sync.queue.v1',
  progressHistory: 'qi.progress.history.v1',
  telemetryBuffer: 'qi.telemetry.buffer.v1'
} as const;

/**
 * Base keys for namespaced storage (without qi prefix)
 */
export const BASE_KEYS = {
  profile: 'profile.v1',
  learner: 'learner.v1', 
  events: 'events',
  journalHistory: 'journal.history.v1',
  reflections: 'reflections.v1',
  assignedPaths: 'assigned.paths.v1',
  syncQueue: 'sync.queue.v1',
  progressHistory: 'progress.history.v1',
  telemetryBuffer: 'telemetry.buffer.v1',
  onTask: 'onTask.v1'
} as const;

/**
 * Migrates legacy single-learner data to namespaced format
 * @param defaultLearnerId - The learner ID to migrate data to (typically 'local-1')
 */
export function migrateLegacyData(defaultLearnerId: string): void {
  console.log('Starting legacy data migration to learner:', defaultLearnerId);
  
  let migratedKeys = 0;
  
  // Migrate each legacy key to namespaced format
  for (const [dataType, legacyKey] of Object.entries(LEGACY_KEYS)) {
    const data = localStorage.getItem(legacyKey);
    if (data !== null) {
      const baseKey = BASE_KEYS[dataType as keyof typeof BASE_KEYS];
      const namespacedKey = ns(defaultLearnerId, baseKey);
      
      localStorage.setItem(namespacedKey, data);
      localStorage.removeItem(legacyKey);
      migratedKeys++;
      
      console.log(`Migrated ${legacyKey} → ${namespacedKey}`);
    }
  }
  
  // Mark migration as complete
  localStorage.setItem('qi.migration.v1', JSON.stringify({
    version: 1,
    defaultLearnerId,
    migratedAt: Date.now(),
    migratedKeys
  }));
  
  console.log(`Migration complete: ${migratedKeys} keys migrated to learner ${defaultLearnerId}`);
}

/**
 * Checks if legacy data migration has been completed
 */
export function isMigrationCompleted(): boolean {
  return localStorage.getItem('qi.migration.v1') !== null;
}

/**
 * Gets migration info if available
 */
export function getMigrationInfo(): { version: number; defaultLearnerId: string; migratedAt: number; migratedKeys: number } | null {
  const data = localStorage.getItem('qi.migration.v1');
  return data ? JSON.parse(data) : null;
}