/**
 * Localized Lesson Text Components
 * 
 * React components that handle lesson text display with proper localization.
 * These components automatically use the current locale and handle both legacy and v2 lesson formats.
 */

import React from 'react';
import { getLessonTitle, getLessonSummary, createLessonAriaLabel } from '../utils/lessonText';
import { useLocale } from '../i18n/locale';
import type { Locale } from '../authoring/schema';

interface BaseLessonTextProps {
  lesson: any;
  locale?: Locale;
  className?: string;
}

/**
 * Display a lesson title with proper localization
 */
export function LessonTitle({ lesson, locale, className = '', ...props }: BaseLessonTextProps & React.HTMLProps<HTMLSpanElement>) {
  const { locale: currentLocale } = useLocale();
  const title = getLessonTitle(lesson, locale || currentLocale);
  
  return (
    <span className={className} {...props}>
      {title}
    </span>
  );
}

/**
 * Display a lesson summary with proper localization
 */
export function LessonSummary({ lesson, locale, className = '', ...props }: BaseLessonTextProps & React.HTMLProps<HTMLSpanElement>) {
  const { locale: currentLocale } = useLocale();
  const summary = getLessonSummary(lesson, locale || currentLocale);
  
  if (!summary) {
    return null;
  }
  
  return (
    <span className={className} {...props}>
      {summary}
    </span>
  );
}

/**
 * Generate ARIA label for lesson interaction elements
 */
export function useLessonAriaLabel(
  lesson: any,
  context: {
    biome?: string;
    completed?: boolean;
    locked?: boolean;
    subjectLabel?: string;
  },
  locale?: Locale
): string {
  const { locale: currentLocale } = useLocale();
  
  return React.useMemo(() => {
    return createLessonAriaLabel(lesson, context, locale || currentLocale);
  }, [lesson, context, locale, currentLocale]);
}

/**
 * HOC that injects lesson text utilities into a component
 */
export function withLessonText<T extends object>(
  Component: React.ComponentType<T & { lessonText: { title: string; summary: string; ariaLabel: (context: any) => string } }>
) {
  return React.forwardRef<any, T & { lesson: any; locale?: Locale }>((props, ref) => {
    const { lesson, locale, ...otherProps } = props;
    const { locale: currentLocale } = useLocale();
    const effectiveLocale = locale || currentLocale;
    
    const lessonText = React.useMemo(() => ({
      title: getLessonTitle(lesson, effectiveLocale),
      summary: getLessonSummary(lesson, effectiveLocale),
      ariaLabel: (context: any) => createLessonAriaLabel(lesson, context, effectiveLocale)
    }), [lesson, effectiveLocale]);
    
    return (
      <Component
        ref={ref}
        {...(otherProps as T)}
        lessonText={lessonText}
      />
    );
  });
}