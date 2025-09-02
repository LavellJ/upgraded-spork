// Privacy & Data backup functionality for local-first storage management

interface BackupData {
  profile?: any;
  learner?: any;
  events?: any[];
  journalHistory?: any[];
  reflections?: any[];
  assignedPaths?: any[];
  telemetryBuffer?: any[];
  exportedAt: string;
  version: string;
}

const STORAGE_KEYS = {
  profile: 'qi.profile.v1',
  learner: 'qi.learner.v1', 
  events: 'qi.progress.history.v1',
  journalHistory: 'qi.journal.history.v1',
  reflections: 'qi.reflections.v1',
  assignedPaths: 'qi.assigned.paths.v1',
  telemetryBuffer: 'qi.telemetry.buffer.v1'
} as const;

/**
 * Export all user data as a downloadable JSON blob
 * @param includeTelemetry Whether to include anonymous telemetry buffer
 * @returns Blob containing all user data
 */
export function exportAll(includeTelemetry: boolean = false): Blob {
  const backupData: BackupData = {
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };

  // Gather all data from localStorage
  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    if (key === 'telemetryBuffer' && !includeTelemetry) {
      return; // Skip telemetry if not requested
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        backupData[key as keyof BackupData] = JSON.parse(stored);
      }
    } catch (error) {
      console.warn(`Failed to export ${key}:`, error);
    }
  });

  // Create downloadable blob
  const jsonString = JSON.stringify(backupData, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

/**
 * Import user data from JSON backup
 * @param jsonData JSON string containing backup data
 * @param options Import options
 */
export function importAll(jsonData: string, options: { merge: boolean } = { merge: false }): void {
  try {
    const backupData: BackupData = JSON.parse(jsonData);
    
    if (!backupData.version || !backupData.exportedAt) {
      throw new Error('Invalid backup file format');
    }

    // If not merging, clear existing data first
    if (!options.merge) {
      clearAll();
    }

    // Import each data type
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      const data = backupData[key as keyof BackupData];
      if (data !== undefined) {
        try {
          if (options.merge && key === 'events') {
            // For events, merge arrays and deduplicate by timestamp
            const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const combined = [...existing, ...data];
            const deduped = combined.filter((item, index, arr) => 
              arr.findIndex(other => other.at === item.at) === index
            );
            localStorage.setItem(storageKey, JSON.stringify(deduped));
          } else if (options.merge && (key === 'journalHistory' || key === 'reflections')) {
            // For histories, merge arrays and keep recent entries
            const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const combined = [...existing, ...data];
            // Sort by timestamp and keep latest 100 entries
            const sorted = combined.sort((a, b) => 
              new Date(b.date || b.at).getTime() - new Date(a.date || a.at).getTime()
            ).slice(0, 100);
            localStorage.setItem(storageKey, JSON.stringify(sorted));
          } else {
            // Direct replacement for profile, learner, assignments
            localStorage.setItem(storageKey, JSON.stringify(data));
          }
        } catch (error) {
          console.warn(`Failed to import ${key}:`, error);
        }
      }
    });

    console.log('Data imported successfully');
  } catch (error) {
    console.error('Failed to import backup:', error);
    throw new Error('Invalid backup file or import failed');
  }
}

/**
 * Clear all user data from localStorage
 * This is a destructive operation that removes all learning progress
 */
export function clearAll(): void {
  Object.values(STORAGE_KEYS).forEach(storageKey => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`Failed to clear ${storageKey}:`, error);
    }
  });

  // Also clear any other LearnOz related keys that might exist
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.startsWith('qi.') || key.startsWith('learnoz.')) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to clear ${key}:`, error);
      }
    }
  });

  console.log('All user data cleared');
}

/**
 * Get summary of stored data for display
 */
export function getDataSummary() {
  const summary = {
    profile: false,
    learner: false,
    eventsCount: 0,
    journalSessionsCount: 0,
    reflectionsCount: 0,
    assignedPathsCount: 0,
    hasTelemetry: false,
    totalSize: 0
  };

  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        summary.totalSize += stored.length;
        
        switch (key) {
          case 'profile':
            summary.profile = true;
            break;
          case 'learner':
            summary.learner = true;
            break;
          case 'events':
            const events = JSON.parse(stored);
            summary.eventsCount = Array.isArray(events) ? events.length : 0;
            break;
          case 'journalHistory':
            const history = JSON.parse(stored);
            summary.journalSessionsCount = Array.isArray(history) ? history.length : 0;
            break;
          case 'reflections':
            const reflections = JSON.parse(stored);
            summary.reflectionsCount = Array.isArray(reflections) ? reflections.length : 0;
            break;
          case 'assignedPaths':
            const paths = JSON.parse(stored);
            summary.assignedPathsCount = Array.isArray(paths) ? paths.length : 0;
            break;
          case 'telemetryBuffer':
            summary.hasTelemetry = true;
            break;
        }
      }
    } catch (error) {
      console.warn(`Failed to analyze ${key}:`, error);
    }
  });

  return summary;
}

/**
 * Download backup file with current timestamp
 */
export function downloadBackup(includeTelemetry: boolean = false): void {
  try {
    const blob = exportAll(includeTelemetry);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `learnoz-backup-${timestamp}.json`;
    link.href = url;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download backup:', error);
    throw new Error('Failed to create backup file');
  }
}