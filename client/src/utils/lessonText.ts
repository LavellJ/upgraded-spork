/**
 * Lesson Text Utilities
 * 
 * Bridges the gap between legacy lesson format (string titles) and new v2 format (I18nText).
 * Provides consistent access to localized lesson content across the application.
 */

import { tI18n, createI18nText } from '../i18n/text';
import { getLocale } from '../i18n/locale';
import type { I18nText, Locale } from '../authoring/schema';

// Types for legacy lesson format
interface LegacyLesson {
  id: string;
  title: string; // Legacy: simple string
  [key: string]: any;
}

// Types for new lesson format
interface V2Lesson {
  id: string;
  title: I18nText; // New: internationalized text object
  [key: string]: any;
}

// Union type for lessons that could be either format
type AnyLesson = LegacyLesson | V2Lesson;

/**
 * Check if a lesson uses the new v2 format with I18nText titles
 */
export function isV2Lesson(lesson: AnyLesson): lesson is V2Lesson {
  return lesson.title && typeof lesson.title === 'object' && !Array.isArray(lesson.title);
}

/**
 * Get the localized title for any lesson format
 * Handles both legacy string titles and new I18nText titles
 */
export function getLessonTitle(lesson: AnyLesson | null | undefined, locale?: Locale): string {
  if (!lesson || !lesson.title) {
    return 'Untitled Lesson';
  }

  // Handle new v2 format with I18nText
  if (isV2Lesson(lesson)) {
    return tI18n(lesson.title, locale);
  }

  // Handle legacy format with string title
  if (typeof lesson.title === 'string') {
    return lesson.title;
  }

  // Fallback for unexpected formats
  return 'Untitled Lesson';
}

/**
 * Get the localized summary for any lesson format
 */
export function getLessonSummary(lesson: AnyLesson | null | undefined, locale?: Locale): string {
  if (!lesson) {
    return '';
  }

  // Handle new v2 format
  if ('summary' in lesson && lesson.summary) {
    if (typeof lesson.summary === 'object') {
      return tI18n(lesson.summary as I18nText, locale);
    } else if (typeof lesson.summary === 'string') {
      return lesson.summary;
    }
  }

  // Handle legacy format - might have description or other fields
  if ('description' in lesson && typeof lesson.description === 'string') {
    return lesson.description;
  }

  return '';
}

/**
 * Convert a legacy lesson to v2 format (for migration purposes)
 */
export function upgradeLegacyLesson(legacyLesson: LegacyLesson, sourceLocale?: Locale): V2Lesson {
  const locale = sourceLocale || getLocale();
  
  return {
    ...legacyLesson,
    title: createI18nText(legacyLesson.title, locale),
    summary: 'description' in legacyLesson && typeof legacyLesson.description === 'string'
      ? createI18nText(legacyLesson.description, locale)
      : undefined,
    version: 2
  } as V2Lesson;
}

/**
 * Normalize a lesson to ensure it has a proper title for display
 * This function is safe to use in components regardless of lesson format
 */
export function normalizeLessonForDisplay(lesson: AnyLesson | null | undefined) {
  if (!lesson) {
    return null;
  }

  return {
    ...lesson,
    displayTitle: getLessonTitle(lesson),
    displaySummary: getLessonSummary(lesson)
  };
}

/**
 * Create ARIA label for lesson buttons with locale support
 */
export function createLessonAriaLabel(
  lesson: AnyLesson | null | undefined,
  context: {
    biome?: string;
    completed?: boolean;
    locked?: boolean;
    subjectLabel?: string;
  },
  locale?: Locale
): string {
  if (!lesson) {
    return 'Lesson unavailable';
  }

  const title = getLessonTitle(lesson, locale);
  const { completed, locked, subjectLabel } = context;

  if (locked) {
    return `${title} lesson is locked - complete the previous lesson first`;
  }

  if (completed) {
    return subjectLabel 
      ? `${title} lesson completed in ${subjectLabel}`
      : `${title} lesson completed`;
  }

  return subjectLabel
    ? `Start ${title} lesson in ${subjectLabel}`
    : `Start ${title} lesson`;
}

/**
 * Filter lessons by title text (for search functionality)
 */
export function filterLessonsByTitle(
  lessons: AnyLesson[],
  searchQuery: string,
  locale?: Locale
): AnyLesson[] {
  if (!searchQuery.trim()) {
    return lessons;
  }

  const query = searchQuery.toLowerCase();
  
  return lessons.filter(lesson => {
    const title = getLessonTitle(lesson, locale).toLowerCase();
    const summary = getLessonSummary(lesson, locale).toLowerCase();
    
    return title.includes(query) || summary.includes(query);
  });
}

/**
 * Sort lessons by title alphabetically (locale-aware)
 */
export function sortLessonsByTitle(
  lessons: AnyLesson[],
  locale?: Locale,
  direction: 'asc' | 'desc' = 'asc'
): AnyLesson[] {
  const currentLocale = locale || getLocale();
  
  return [...lessons].sort((a, b) => {
    const titleA = getLessonTitle(a, currentLocale);
    const titleB = getLessonTitle(b, currentLocale);
    
    const comparison = titleA.localeCompare(titleB, currentLocale);
    return direction === 'asc' ? comparison : -comparison;
  });
}