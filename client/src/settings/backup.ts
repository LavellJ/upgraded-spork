// Privacy & Data backup functionality for local-first storage management

import type { Roster } from '../roster/model';
import { loadRoster } from '../roster/model';
import { ns, BASE_KEYS } from '../storage/namespace';
import { mergeData, type MergeableData } from '../sync/merge';

interface BackupDataV1 {
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

interface LearnerData {
  profile?: any;
  model?: any;
  events?: any[];
  journal?: any[];
  reflections?: any[];
  assignments?: any[];
}

interface BackupDataV2 {
  version: '2.0';
  exportedAt: string;
  roster: Roster;
  data: Record<string, LearnerData>; // keyed by learnerId
  telemetryBuffer?: any[]; // Global telemetry
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
 * Export all user data including roster as a downloadable JSON blob (V2 format)
 * @param includeTelemetry Whether to include anonymous telemetry buffer
 * @returns Blob containing all user data
 */
export function exportAll(includeTelemetry: boolean = false): Blob {
  const roster = loadRoster();
  
  if (!roster) {
    throw new Error('No roster found - cannot export data');
  }

  const backupData: BackupDataV2 = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    roster,
    data: {}
  };

  // Export data for each learner
  roster.learners.forEach(learner => {
    const learnerData: LearnerData = {};
    
    // Export profile (if exists in global storage)
    try {
      const globalProfile = localStorage.getItem('qi.profile.v1');
      if (globalProfile) {
        learnerData.profile = JSON.parse(globalProfile);
      }
    } catch (error) {
      console.warn(`Failed to export global profile:`, error);
    }

    // Export namespaced data for this learner
    const dataKeys = {
      model: BASE_KEYS.learner,
      events: BASE_KEYS.progressHistory, 
      journal: BASE_KEYS.journalHistory,
      reflections: BASE_KEYS.reflections,
      assignments: BASE_KEYS.assignedPaths
    };

    Object.entries(dataKeys).forEach(([exportKey, baseKey]) => {
      try {
        const storageKey = ns(learner.id, baseKey);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          learnerData[exportKey as keyof LearnerData] = JSON.parse(stored);
        }
      } catch (error) {
        console.warn(`Failed to export ${exportKey} for learner ${learner.id}:`, error);
      }
    });

    backupData.data[learner.id] = learnerData;
  });

  // Add global telemetry if requested
  if (includeTelemetry) {
    try {
      const telemetry = localStorage.getItem('qi.telemetry.buffer.v1');
      if (telemetry) {
        backupData.telemetryBuffer = JSON.parse(telemetry);
      }
    } catch (error) {
      console.warn('Failed to export telemetry:', error);
    }
  }

  // Create downloadable blob
  const jsonString = JSON.stringify(backupData, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

/**
 * Export single learner data (legacy V1 format for compatibility)
 */
export function exportLegacy(includeTelemetry: boolean = false): Blob {
  const backupData: BackupDataV1 = {
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };

  // Gather all data from localStorage (legacy keys)
  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    if (key === 'telemetryBuffer' && !includeTelemetry) {
      return; // Skip telemetry if not requested
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        backupData[key as keyof BackupDataV1] = JSON.parse(stored);
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
 * Import user data from JSON backup (supports V1 and V2 formats)
 * @param jsonData JSON string containing backup data  
 * @param options Import options
 */
export function importAll(jsonData: string, options: { merge: boolean; requireAck?: boolean } = { merge: false }): void {
  try {
    const parsed = JSON.parse(jsonData);
    
    if (!parsed.version || !parsed.exportedAt) {
      throw new Error('Invalid backup file format');
    }

    // Handle V2 format (roster-aware)
    if (parsed.version === '2.0') {
      importV2(parsed as BackupDataV2, options);
    } else {
      // Handle V1 format (legacy single learner)
      importV1(parsed as BackupDataV1, options);
    }

    console.log('Data imported successfully');
  } catch (error) {
    console.error('Failed to import backup:', error);
    throw new Error('Invalid backup file or import failed');
  }
}

/**
 * Import V2 format data (roster + namespaced learner data)
 */
function importV2(backupData: BackupDataV2, options: { merge: boolean; requireAck?: boolean }): void {
  const { loadRoster, saveRoster } = require('../roster/model');
  
  // Import roster
  const currentRoster = loadRoster();
  if (!options.merge || !currentRoster) {
    // Replace roster entirely
    saveRoster(backupData.roster);
  } else {
    // Merge rosters: add missing learners, keep existing ones
    const mergedLearners = [...currentRoster.learners];
    backupData.roster.learners.forEach(importedLearner => {
      const exists = mergedLearners.find(l => l.id === importedLearner.id);
      if (!exists) {
        mergedLearners.push(importedLearner);
      }
    });
    
    const mergedRoster = {
      ...currentRoster,
      learners: mergedLearners
    };
    saveRoster(mergedRoster);
  }

  // Import data for each learner
  Object.entries(backupData.data).forEach(([learnerId, learnerData]) => {
    importLearnerData(learnerId, learnerData, options);
  });

  // Import global telemetry
  if (backupData.telemetryBuffer) {
    try {
      if (options.merge) {
        const existing = JSON.parse(localStorage.getItem('qi.telemetry.buffer.v1') || '[]');
        const merged = [...existing, ...backupData.telemetryBuffer];
        localStorage.setItem('qi.telemetry.buffer.v1', JSON.stringify(merged));
      } else {
        localStorage.setItem('qi.telemetry.buffer.v1', JSON.stringify(backupData.telemetryBuffer));
      }
    } catch (error) {
      console.warn('Failed to import telemetry:', error);
    }
  }
}

/**
 * Import data for a specific learner using merge policies
 */
function importLearnerData(learnerId: string, learnerData: LearnerData, options: { merge: boolean }): void {
  const dataKeys = {
    model: BASE_KEYS.learner,
    events: BASE_KEYS.progressHistory,
    journal: BASE_KEYS.journalHistory, 
    reflections: BASE_KEYS.reflections,
    assignments: BASE_KEYS.assignedPaths
  };

  if (options.merge) {
    // Use merge policies for conflict-safe merging
    const localData: MergeableData = {};
    const remoteData: MergeableData = {};

    // Load existing local data
    Object.entries(dataKeys).forEach(([exportKey, baseKey]) => {
      try {
        const storageKey = ns(learnerId, baseKey);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          switch (exportKey) {
            case 'model':
              localData.learnerModel = parsed;
              break;
            case 'events':
              localData.events = parsed;
              break;
            case 'journal':
              localData.journalHistory = parsed;
              break;
            case 'reflections':
              localData.reflections = parsed;
              break;
            case 'assignments':
              localData.assignments = parsed;
              break;
          }
        }
      } catch (error) {
        console.warn(`Failed to load existing ${exportKey} for learner ${learnerId}:`, error);
      }
    });

    // Set up remote data for merging
    if (learnerData.model) remoteData.learnerModel = learnerData.model;
    if (learnerData.events) remoteData.events = learnerData.events;
    if (learnerData.journal) remoteData.journalHistory = learnerData.journal;
    if (learnerData.reflections) remoteData.reflections = learnerData.reflections;
    if (learnerData.assignments) remoteData.assignments = learnerData.assignments;

    // Perform merge
    const merged = mergeData(localData, remoteData);

    // Save merged data back
    if (merged.learnerModel) {
      const storageKey = ns(learnerId, BASE_KEYS.learner);
      localStorage.setItem(storageKey, JSON.stringify(merged.learnerModel));
    }
    if (merged.events) {
      const storageKey = ns(learnerId, BASE_KEYS.progressHistory);
      localStorage.setItem(storageKey, JSON.stringify(merged.events));
    }
    if (merged.journalHistory) {
      const storageKey = ns(learnerId, BASE_KEYS.journalHistory);
      localStorage.setItem(storageKey, JSON.stringify(merged.journalHistory));
    }
    if (merged.reflections) {
      const storageKey = ns(learnerId, BASE_KEYS.reflections);
      localStorage.setItem(storageKey, JSON.stringify(merged.reflections));
    }
    if (merged.assignments) {
      const storageKey = ns(learnerId, BASE_KEYS.assignedPaths);
      localStorage.setItem(storageKey, JSON.stringify(merged.assignments));
    }
  } else {
    // Direct replacement
    Object.entries(dataKeys).forEach(([exportKey, baseKey]) => {
      const data = learnerData[exportKey as keyof LearnerData];
      if (data !== undefined) {
        try {
          const storageKey = ns(learnerId, baseKey);
          localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (error) {
          console.warn(`Failed to import ${exportKey} for learner ${learnerId}:`, error);
        }
      }
    });
  }

  // Handle global profile (shared across learners)
  if (learnerData.profile) {
    try {
      if (options.merge) {
        // Keep existing profile if it exists
        const existing = localStorage.getItem('qi.profile.v1');
        if (!existing) {
          localStorage.setItem('qi.profile.v1', JSON.stringify(learnerData.profile));
        }
      } else {
        localStorage.setItem('qi.profile.v1', JSON.stringify(learnerData.profile));
      }
    } catch (error) {
      console.warn('Failed to import profile:', error);
    }
  }
}

/**
 * Import V1 format data (legacy single learner)
 */
function importV1(backupData: BackupDataV1, options: { merge: boolean }): void {
  // If not merging, clear existing data first
  if (!options.merge) {
    clearAll();
  }

  // Import each data type using legacy method
  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    const data = backupData[key as keyof BackupDataV1];
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
}

/**
 * Clear all user data from localStorage (roster-aware)
 * This is a destructive operation that removes all learning progress
 */
export function clearAll(): void {
  // Clear legacy storage keys
  Object.values(STORAGE_KEYS).forEach(storageKey => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`Failed to clear ${storageKey}:`, error);
    }
  });

  // Clear all namespaced learner data and roster
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
 * Import data from server snapshot
 * @param serverData Server snapshot data
 * @param options Import options
 */
export async function importServerSnapshot(serverData: any, options: { merge: boolean } = { merge: true }): Promise<void> {
  try {
    // Server data should be in V2 format
    if (!serverData.roster || !serverData.data) {
      throw new Error('Invalid server snapshot format');
    }

    const backupData: BackupDataV2 = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      roster: serverData.roster,
      data: serverData.data,
      telemetryBuffer: serverData.telemetryBuffer
    };

    importV2(backupData, options);
    console.log('Server snapshot imported successfully');
  } catch (error) {
    console.error('Failed to import server snapshot:', error);
    throw new Error('Failed to import server data');
  }
}

/**
 * Get summary of stored data for display (roster-aware)
 */
export function getDataSummary() {
  const roster = loadRoster();
  
  const summary = {
    hasRoster: !!roster,
    learnerCount: roster?.learners.length || 0,
    learners: [] as Array<{
      id: string;
      name: string;
      eventsCount: number;
      journalSessionsCount: number;
      reflectionsCount: number;
      assignedPathsCount: number;
      size: number;
    }>,
    globalProfile: false,
    hasTelemetry: false,
    totalSize: 0
  };

  // Check global profile
  try {
    const globalProfile = localStorage.getItem('qi.profile.v1');
    if (globalProfile) {
      summary.globalProfile = true;
      summary.totalSize += globalProfile.length;
    }
  } catch (error) {
    console.warn('Failed to analyze global profile:', error);
  }

  // Check global telemetry
  try {
    const telemetry = localStorage.getItem('qi.telemetry.buffer.v1');
    if (telemetry) {
      summary.hasTelemetry = true;
      summary.totalSize += telemetry.length;
    }
  } catch (error) {
    console.warn('Failed to analyze telemetry:', error);
  }

  // Analyze each learner's data
  if (roster) {
    roster.learners.forEach(learner => {
      const learnerSummary = {
        id: learner.id,
        name: learner.name,
        eventsCount: 0,
        journalSessionsCount: 0,
        reflectionsCount: 0,
        assignedPathsCount: 0,
        size: 0
      };

      const dataKeys = [
        { key: BASE_KEYS.learner, type: 'model' },
        { key: BASE_KEYS.progressHistory, type: 'events' },
        { key: BASE_KEYS.journalHistory, type: 'journal' },
        { key: BASE_KEYS.reflections, type: 'reflections' },
        { key: BASE_KEYS.assignedPaths, type: 'assignments' }
      ];

      dataKeys.forEach(({ key, type }) => {
        try {
          const storageKey = ns(learner.id, key);
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            learnerSummary.size += stored.length;
            summary.totalSize += stored.length;

            const parsed = JSON.parse(stored);
            switch (type) {
              case 'events':
                learnerSummary.eventsCount = Array.isArray(parsed) ? parsed.length : 0;
                break;
              case 'journal':
                learnerSummary.journalSessionsCount = Array.isArray(parsed) ? parsed.length : 0;
                break;
              case 'reflections':
                learnerSummary.reflectionsCount = Array.isArray(parsed) ? parsed.length : 0;
                break;
              case 'assignments':
                learnerSummary.assignedPathsCount = Array.isArray(parsed) ? parsed.length : 0;
                break;
            }
          }
        } catch (error) {
          console.warn(`Failed to analyze ${type} for learner ${learner.id}:`, error);
        }
      });

      summary.learners.push(learnerSummary);
    });
  }

  return summary;
}

/**
 * Get legacy data summary (for single learner compatibility)
 */
export function getLegacyDataSummary() {
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