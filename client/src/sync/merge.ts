/**
 * Conflict-safe merge policies for multi-device sync
 * 
 * Defines deterministic merge rules for:
 * - Progress events: set union by kind+at+id (keep unique)
 * - Learner model: lastAt wins for p; sum seen/correct; max streak
 * - Journal history: union by session id; if duplicate, keep longer n
 * - Reflections: union by {refType, refId, at}; keep most recent text
 * - Assignments: union by assignment id; merge completed lessons
 */

import type { ProgressEvent } from '../progress/events';
import type { LearnerState, Mastery } from '../learning/model';
import type { JournalHistoryEntry } from '../schema/journal';
import type { Reflection } from '../reflections/model';
import type { AssignedPath } from '../guide/assign';

// Unified merge interface for all sync data types
export interface MergeableData {
  events?: ProgressEvent[];
  learnerModel?: LearnerState;
  journalHistory?: JournalHistoryEntry[];
  reflections?: Reflection[];
  assignments?: AssignedPath[];
}

/**
 * Main merge function - combines local and remote data using conflict-safe policies
 */
export function mergeData(local: MergeableData, remote: MergeableData): MergeableData {
  const result: MergeableData = {};

  // Merge progress events
  if (local.events || remote.events) {
    result.events = mergeEvents(local.events || [], remote.events || []);
  }

  // Merge learner model
  if (local.learnerModel || remote.learnerModel) {
    result.learnerModel = mergeLearnerModel(local.learnerModel, remote.learnerModel);
  }

  // Merge journal history
  if (local.journalHistory || remote.journalHistory) {
    result.journalHistory = mergeJournalHistory(local.journalHistory || [], remote.journalHistory || []);
  }

  // Merge reflections
  if (local.reflections || remote.reflections) {
    result.reflections = mergeReflections(local.reflections || [], remote.reflections || []);
  }

  // Merge assignments
  if (local.assignments || remote.assignments) {
    result.assignments = mergeAssignments(local.assignments || [], remote.assignments || []);
  }

  return result;
}

/**
 * Merge progress events using set union by kind+at+id
 * Ensures uniqueness and chronological ordering
 */
export function mergeEvents(local: ProgressEvent[], remote: ProgressEvent[]): ProgressEvent[] {
  const eventMap = new Map<string, ProgressEvent>();

  // Helper to create unique key for each event
  const getEventKey = (event: ProgressEvent): string => {
    // Use kind+at as base key, add additional fields for uniqueness
    let key = `${event.kind}:${event.at}`;
    
    // Add identifying fields based on event type
    switch (event.kind) {
      case 'lesson_start':
      case 'lesson_finish':
        key += `:${event.lessonId}:${event.biomeId}`;
        break;
      case 'journal_start':
      case 'journal_finish':
        key += `:${event.skillId}`;
        break;
      case 'scout_msg':
        key += `:${(event as any).messageId}`;
        break;
      case 'scout_analytics':
        key += `:${(event as any).id}`;
        break;
      case 'guide_ack':
        key += `:${event.noticeId}`;
        break;
    }
    
    return key;
  };

  // Add local events
  for (const event of local) {
    const key = getEventKey(event);
    eventMap.set(key, event);
  }

  // Add remote events (will not overwrite due to unique keys)
  for (const event of remote) {
    const key = getEventKey(event);
    if (!eventMap.has(key)) {
      eventMap.set(key, event);
    }
  }

  // Return sorted by timestamp
  return Array.from(eventMap.values()).sort((a, b) => a.at - b.at);
}

/**
 * Merge learner models using skill-level conflict resolution
 * For each skill: lastAt wins for p; sum seen/correct; max streak
 */
export function mergeLearnerModel(local?: LearnerState, remote?: LearnerState): LearnerState {
  if (!local && !remote) {
    return { version: 1, skills: {} };
  }
  if (!local) return remote!;
  if (!remote) return local;

  const mergedSkills: Record<string, Mastery> = {};
  const allSkillIds = new Set([
    ...Object.keys(local.skills),
    ...Object.keys(remote.skills)
  ]);

  for (const skillId of allSkillIds) {
    const localSkill = local.skills[skillId];
    const remoteSkill = remote.skills[skillId];

    if (!localSkill) {
      mergedSkills[skillId] = remoteSkill;
    } else if (!remoteSkill) {
      mergedSkills[skillId] = localSkill;
    } else {
      // Both exist - apply merge rules
      const localLastAt = localSkill.lastAt || 0;
      const remoteLastAt = remoteSkill.lastAt || 0;

      mergedSkills[skillId] = {
        // lastAt wins for probability
        p: localLastAt >= remoteLastAt ? localSkill.p : remoteSkill.p,
        // Sum seen and correct
        seen: localSkill.seen + remoteSkill.seen,
        correct: localSkill.correct + remoteSkill.correct,
        // Max streak
        streak: Math.max(localSkill.streak, remoteSkill.streak),
        // Most recent lastAt
        lastAt: Math.max(localLastAt, remoteLastAt)
      };
    }
  }

  return { version: 1, skills: mergedSkills };
}

/**
 * Merge journal history using session ID deduplication
 * If duplicate session, keep the one with longer n (more responses)
 */
export function mergeJournalHistory(local: JournalHistoryEntry[], remote: JournalHistoryEntry[]): JournalHistoryEntry[] {
  const sessionMap = new Map<string, JournalHistoryEntry>();

  // Add local entries
  for (const entry of local) {
    sessionMap.set(entry.sessionId, entry);
  }

  // Add remote entries, resolving conflicts
  for (const entry of remote) {
    const existing = sessionMap.get(entry.sessionId);
    if (!existing) {
      sessionMap.set(entry.sessionId, entry);
    } else {
      // Keep entry with more responses (longer n indicates more complete session)
      const localResponses = existing.responses?.length || 0;
      const remoteResponses = entry.responses?.length || 0;
      
      if (remoteResponses > localResponses) {
        sessionMap.set(entry.sessionId, entry);
      }
    }
  }

  // Return sorted by date (most recent first)
  return Array.from(sessionMap.values()).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Merge reflections using compound key {refType, refId, at}
 * For same activity at same time, keep most recent text (by timestamp)
 */
export function mergeReflections(local: Reflection[], remote: Reflection[]): Reflection[] {
  const reflectionMap = new Map<string, Reflection>();

  // Create key for reflection deduplication
  const getReflectionKey = (reflection: Reflection): string => {
    return `${reflection.refType}:${reflection.refId}:${reflection.at}`;
  };

  // Add local reflections
  for (const reflection of local) {
    const key = getReflectionKey(reflection);
    reflectionMap.set(key, reflection);
  }

  // Add remote reflections (exact duplicates by key are ignored)
  for (const reflection of remote) {
    const key = getReflectionKey(reflection);
    if (!reflectionMap.has(key)) {
      reflectionMap.set(key, reflection);
    }
    // Note: For exact same refType+refId+at, we keep the first one found
    // This maintains idempotency - same reflection at exact same timestamp
  }

  // Return sorted by timestamp (most recent first)
  return Array.from(reflectionMap.values()).sort((a, b) => b.at - a.at);
}

/**
 * Merge assignments using assignment ID deduplication
 * Merge lesson completion status by taking union of lessonIds
 */
export function mergeAssignments(local: AssignedPath[], remote: AssignedPath[]): AssignedPath[] {
  const assignmentMap = new Map<string, AssignedPath>();

  // Add local assignments
  for (const assignment of local) {
    assignmentMap.set(assignment.id, assignment);
  }

  // Merge remote assignments
  for (const assignment of remote) {
    const existing = assignmentMap.get(assignment.id);
    if (!existing) {
      assignmentMap.set(assignment.id, assignment);
    } else {
      // Merge lesson completion: union of lesson IDs
      const mergedLessonIds = Array.from(new Set([
        ...existing.lessonIds,
        ...assignment.lessonIds
      ]));

      // Keep most recent metadata but merge lesson progress
      const merged: AssignedPath = {
        ...existing,
        lessonIds: mergedLessonIds,
        // Use the most recent createdAt if different assignments
        createdAt: Math.max(existing.createdAt, assignment.createdAt),
        // Use the later expiry date if both exist
        expiresAt: existing.expiresAt && assignment.expiresAt 
          ? Math.max(existing.expiresAt, assignment.expiresAt)
          : existing.expiresAt || assignment.expiresAt
      };

      assignmentMap.set(assignment.id, merged);
    }
  }

  // Return sorted by creation date (most recent first)
  return Array.from(assignmentMap.values()).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Merge helper for sync engine integration
 * Converts sync items back to structured data for merging
 */
export function mergeSyncPayloads(localPayloads: any[], remotePayloads: any[], kind: string): any[] {
  const local: MergeableData = {};
  const remote: MergeableData = {};

  // Group payloads by kind
  switch (kind) {
    case 'event':
      local.events = localPayloads;
      remote.events = remotePayloads;
      break;
    case 'learner':
      // Learner model is single object, take most recent
      if (localPayloads.length > 0) local.learnerModel = localPayloads[localPayloads.length - 1];
      if (remotePayloads.length > 0) remote.learnerModel = remotePayloads[remotePayloads.length - 1];
      break;
    case 'journal':
      local.journalHistory = localPayloads;
      remote.journalHistory = remotePayloads;
      break;
    case 'reflection':
      local.reflections = localPayloads;
      remote.reflections = remotePayloads;
      break;
    case 'assignment':
      local.assignments = localPayloads;
      remote.assignments = remotePayloads;
      break;
  }

  const merged = mergeData(local, remote);

  // Return merged data as array for the specific kind
  switch (kind) {
    case 'event':
      return merged.events || [];
    case 'learner':
      return merged.learnerModel ? [merged.learnerModel] : [];
    case 'journal':
      return merged.journalHistory || [];
    case 'reflection':
      return merged.reflections || [];
    case 'assignment':
      return merged.assignments || [];
    default:
      return [];
  }
}