/**
 * Tests for roster-aware backup/import functionality
 * Verifies V2 format export/import, merge policies, and roundtrip compatibility
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exportAll, importAll, getDataSummary, clearAll, importServerSnapshot } from '../src/settings/backup';
import { saveRoster, createDefaultRoster } from '../src/roster/model';
import { ns, BASE_KEYS } from '../src/storage/namespace';

describe('Roster-Aware Backup System', () => {
  // Mock data for testing
  const mockRoster = {
    learners: [
      {
        id: 'learner-1',
        name: 'Alice',
        avatarId: 'avatar-1',
        ageBand: 'primary' as const,
        createdAt: 1756800000000,
        updatedAt: 1756800000000
      },
      {
        id: 'learner-2', 
        name: 'Bob',
        avatarId: 'avatar-2',
        ageBand: 'upper-primary' as const,
        createdAt: 1756800100000,
        updatedAt: 1756800100000
      }
    ],
    activeId: 'learner-1'
  };

  const mockLearnerData = {
    'learner-1': {
      profile: { version: 1, calmMode: true, createdAt: 1756800000000, updatedAt: 1756800000000 },
      model: { 
        version: 1, 
        skills: { 
          'math_addition': { p: 0.75, seen: 10, correct: 8, streak: 3, lastAt: 1756800500000 }
        } 
      },
      events: [
        { kind: 'lesson_start', at: 1756800000000, lessonId: 'math_1', biomeId: 'grassland' },
        { kind: 'lesson_finish', at: 1756800300000, lessonId: 'math_1', biomeId: 'grassland', result: 'pass' }
      ],
      journal: [
        {
          date: '2024-09-02',
          skillId: 'math_addition',
          itemCount: 5,
          correctCount: 4,
          duration: 180,
          masteryBefore: 0.5,
          masteryAfter: 0.75,
          sessionId: 'session-1',
          targetLevel: 'core',
          items: [],
          responses: []
        }
      ],
      reflections: [
        { at: 1756800400000, refType: 'lesson', refId: 'math_1', note: 'Really enjoyed this lesson!' }
      ],
      assignments: [
        { id: 'assignment-1', name: 'Week 1 Math', lessonIds: ['math_1'], createdAt: 1756800000000, expiresAt: 1756900000000 }
      ]
    },
    'learner-2': {
      profile: { version: 1, calmMode: false, createdAt: 1756800100000, updatedAt: 1756800100000 },
      model: { 
        version: 1, 
        skills: { 
          'reading_comprehension': { p: 0.65, seen: 15, correct: 10, streak: 2, lastAt: 1756800600000 }
        } 
      },
      events: [
        { kind: 'lesson_start', at: 1756800200000, lessonId: 'reading_1', biomeId: 'forest' }
      ],
      journal: [],
      reflections: [],
      assignments: []
    }
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Set up mock roster
    saveRoster(mockRoster);
    
    // Set up mock learner data
    Object.entries(mockLearnerData).forEach(([learnerId, data]) => {
      if (data.model) {
        localStorage.setItem(ns(learnerId, BASE_KEYS.learner), JSON.stringify(data.model));
      }
      if (data.events.length > 0) {
        localStorage.setItem(ns(learnerId, BASE_KEYS.progressHistory), JSON.stringify(data.events));
      }
      if (data.journal.length > 0) {
        localStorage.setItem(ns(learnerId, BASE_KEYS.journalHistory), JSON.stringify(data.journal));
      }
      if (data.reflections.length > 0) {
        localStorage.setItem(ns(learnerId, BASE_KEYS.reflections), JSON.stringify(data.reflections));
      }
      if (data.assignments.length > 0) {
        localStorage.setItem(ns(learnerId, BASE_KEYS.assignedPaths), JSON.stringify(data.assignments));
      }
    });

    // Set global profile
    localStorage.setItem('qi.profile.v1', JSON.stringify(mockLearnerData['learner-1'].profile));
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('V2 Format Export', () => {
    it('should export roster and all learner data in V2 format', () => {
      const blob = exportAll(false);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
      
      // Read blob content
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const exportData = JSON.parse(reader.result as string);
          
          expect(exportData.version).toBe('2.0');
          expect(exportData.exportedAt).toBeDefined();
          expect(exportData.roster).toEqual(mockRoster);
          
          // Check learner data structure
          expect(exportData.data).toHaveProperty('learner-1');
          expect(exportData.data).toHaveProperty('learner-2');
          
          const learner1Data = exportData.data['learner-1'];
          expect(learner1Data.model).toEqual(mockLearnerData['learner-1'].model);
          expect(learner1Data.events).toEqual(mockLearnerData['learner-1'].events);
          expect(learner1Data.journal).toEqual(mockLearnerData['learner-1'].journal);
          
          resolve();
        };
        reader.readAsText(blob);
      });
    });

    it('should include telemetry when requested', () => {
      // Add mock telemetry
      localStorage.setItem('qi.telemetry.buffer.v1', JSON.stringify([
        { event: 'test', timestamp: 1756800000000 }
      ]));
      
      const blob = exportAll(true);
      
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const exportData = JSON.parse(reader.result as string);
          
          expect(exportData.telemetryBuffer).toBeDefined();
          expect(exportData.telemetryBuffer).toHaveLength(1);
          
          resolve();
        };
        reader.readAsText(blob);
      });
    });
  });

  describe('V2 Format Import', () => {
    it('should import V2 format and preserve all learner data', () => {
      // Export current data
      const blob = exportAll(false);
      
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const exportData = reader.result as string;
          
          // Clear data
          clearAll();
          
          // Import data back
          importAll(exportData, { merge: false });
          
          // Verify data summary
          const summary = getDataSummary();
          expect(summary.hasRoster).toBe(true);
          expect(summary.learnerCount).toBe(2);
          expect(summary.learners).toHaveLength(2);
          
          // Verify specific learner data
          const alice = summary.learners.find(l => l.name === 'Alice');
          const bob = summary.learners.find(l => l.name === 'Bob');
          
          expect(alice).toBeDefined();
          expect(alice?.eventsCount).toBe(2);
          expect(alice?.journalSessionsCount).toBe(1);
          expect(alice?.reflectionsCount).toBe(1);
          
          expect(bob).toBeDefined();
          expect(bob?.eventsCount).toBe(1);
          
          resolve();
        };
        reader.readAsText(blob);
      });
    });

    it('should merge learners when merge=true', () => {
      // Create additional learner data
      const additionalRoster = {
        learners: [
          ...mockRoster.learners,
          {
            id: 'learner-3',
            name: 'Charlie',
            avatarId: 'avatar-3',
            ageBand: 'pre-primary' as const,
            createdAt: 1756800200000,
            updatedAt: 1756800200000
          }
        ],
        activeId: 'learner-3'
      };

      const additionalData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        roster: additionalRoster,
        data: {
          'learner-3': {
            model: { 
              version: 1, 
              skills: { 
                'counting': { p: 0.5, seen: 5, correct: 3, streak: 1, lastAt: 1756800700000 }
              } 
            },
            events: [
              { kind: 'lesson_start', at: 1756800300000, lessonId: 'counting_1', biomeId: 'beach' }
            ],
            journal: [],
            reflections: [],
            assignments: []
          }
        }
      };

      // Import with merge
      importAll(JSON.stringify(additionalData), { merge: true });
      
      const summary = getDataSummary();
      expect(summary.learnerCount).toBe(3); // Original 2 + new 1
      
      const charlie = summary.learners.find(l => l.name === 'Charlie');
      expect(charlie).toBeDefined();
      expect(charlie?.eventsCount).toBe(1);
    });

    it('should replace all data when merge=false', () => {
      const newRoster = {
        learners: [
          {
            id: 'learner-new',
            name: 'New Learner',
            avatarId: 'avatar-new',
            ageBand: 'primary' as const,
            createdAt: 1756800300000,
            updatedAt: 1756800300000
          }
        ],
        activeId: 'learner-new'
      };

      const newData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        roster: newRoster,
        data: {
          'learner-new': {
            model: { version: 1, skills: {} },
            events: [],
            journal: [],
            reflections: [],
            assignments: []
          }
        }
      };

      // Import with replace
      importAll(JSON.stringify(newData), { merge: false });
      
      const summary = getDataSummary();
      expect(summary.learnerCount).toBe(1);
      expect(summary.learners[0].name).toBe('New Learner');
    });
  });

  describe('Merge Functionality', () => {
    it('should apply merge policies when importing conflicting data', () => {
      // Create conflicting learner model with different skill data
      const conflictingData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        roster: mockRoster,
        data: {
          'learner-1': {
            model: { 
              version: 1, 
              skills: { 
                'math_addition': { 
                  p: 0.6, // Different probability
                  seen: 5, // Different seen count
                  correct: 3, // Different correct count  
                  streak: 1, // Different streak
                  lastAt: 1756800400000 // Earlier timestamp, should lose
                }
              } 
            },
            events: [
              { kind: 'lesson_start', at: 1756800100000, lessonId: 'math_2', biomeId: 'desert' } // New event
            ],
            journal: [],
            reflections: [],
            assignments: []
          }
        }
      };

      // Import with merge
      importAll(JSON.stringify(conflictingData), { merge: true });
      
      // Verify merge results
      const learnerModelStr = localStorage.getItem(ns('learner-1', BASE_KEYS.learner));
      expect(learnerModelStr).toBeDefined();
      
      const learnerModel = JSON.parse(learnerModelStr!);
      const skill = learnerModel.skills['math_addition'];
      
      // Original data should win because lastAt is newer
      expect(skill.p).toBe(0.75); // Original probability wins
      expect(skill.seen).toBe(15); // Sum: 10 + 5
      expect(skill.correct).toBe(11); // Sum: 8 + 3
      expect(skill.streak).toBe(3); // Max: 3 > 1
      expect(skill.lastAt).toBe(1756800500000); // Latest timestamp wins

      // Events should be merged (union)
      const eventsStr = localStorage.getItem(ns('learner-1', BASE_KEYS.progressHistory));
      const events = JSON.parse(eventsStr!);
      expect(events).toHaveLength(3); // 2 original + 1 new
    });
  });

  describe('Server Snapshot Import', () => {
    it('should import server snapshot data correctly', async () => {
      const serverSnapshot = {
        roster: mockRoster,
        data: {
          'learner-1': {
            profile: mockLearnerData['learner-1'].profile,
            model: mockLearnerData['learner-1'].model,
            events: mockLearnerData['learner-1'].events,
            journal: mockLearnerData['learner-1'].journal,
            reflections: mockLearnerData['learner-1'].reflections,
            assignments: mockLearnerData['learner-1'].assignments
          }
        },
        telemetryBuffer: []
      };

      clearAll();
      
      await importServerSnapshot(serverSnapshot, { merge: false });
      
      const summary = getDataSummary();
      expect(summary.hasRoster).toBe(true);
      expect(summary.learnerCount).toBe(2);
    });

    it('should handle invalid server snapshot format', async () => {
      const invalidSnapshot = {
        // Missing roster
        data: {}
      };

      await expect(
        importServerSnapshot(invalidSnapshot, { merge: false })
      ).rejects.toThrow('Invalid server snapshot format');
    });
  });

  describe('V1 Compatibility', () => {
    it('should import V1 format backups', () => {
      const v1Backup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        profile: { version: 1, calmMode: true },
        learner: { version: 1, skills: { 'test_skill': { p: 0.5, seen: 1, correct: 1 } } },
        events: [{ kind: 'lesson_start', at: 1756800000000, lessonId: 'test' }],
        journalHistory: [],
        reflections: [],
        assignedPaths: []
      };

      clearAll();
      importAll(JSON.stringify(v1Backup), { merge: false });
      
      // Should be imported into legacy storage keys
      expect(localStorage.getItem('qi.profile.v1')).toBeDefined();
      expect(localStorage.getItem('qi.learner.v1')).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON gracefully', () => {
      expect(() => {
        importAll('invalid json', { merge: false });
      }).toThrow('Invalid backup file or import failed');
    });

    it('should handle missing version field', () => {
      const invalidBackup = {
        exportedAt: new Date().toISOString(),
        // Missing version
        roster: mockRoster,
        data: {}
      };

      expect(() => {
        importAll(JSON.stringify(invalidBackup), { merge: false });
      }).toThrow('Invalid backup file or import failed');
    });

    it('should handle export when no roster exists', () => {
      clearAll();
      
      expect(() => {
        exportAll(false);
      }).toThrow('No roster found - cannot export data');
    });
  });

  describe('Data Summary', () => {
    it('should provide accurate roster-aware summary', () => {
      const summary = getDataSummary();
      
      expect(summary.hasRoster).toBe(true);
      expect(summary.learnerCount).toBe(2);
      expect(summary.globalProfile).toBe(true);
      expect(summary.learners).toHaveLength(2);
      
      const alice = summary.learners.find(l => l.name === 'Alice');
      expect(alice?.eventsCount).toBe(2);
      expect(alice?.journalSessionsCount).toBe(1);
      expect(alice?.reflectionsCount).toBe(1);
      expect(alice?.assignedPathsCount).toBe(1);
      
      const bob = summary.learners.find(l => l.name === 'Bob');
      expect(bob?.eventsCount).toBe(1);
      expect(bob?.journalSessionsCount).toBe(0);
    });
  });
});