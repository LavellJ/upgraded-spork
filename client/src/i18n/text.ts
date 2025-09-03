/**
 * Localized Text Helper
 * 
 * Provides intelligent text resolution with fallback chains for internationalization.
 * Integrates with the locale system to provide seamless text localization.
 */

import type { Locale, I18nText } from '../authoring/schema';
import { getLocale, getLocaleFallbackChain } from './locale';

/**
 * Extract localized text from an I18nText object using fallback logic
 * 
 * @param i18n - The internationalized text object
 * @param locale - Target locale (optional, defaults to current locale)
 * @returns The best available text for the locale
 */
export function tI18n(i18n: I18nText, locale?: Locale): string {
  if (!i18n || typeof i18n !== 'object') {
    return '';
  }

  const targetLocale = locale || getLocale();
  const fallbackChain = getLocaleFallbackChain(targetLocale);
  
  // Try each locale in the fallback chain
  for (const fallbackLocale of fallbackChain) {
    const text = i18n[fallbackLocale];
    if (text && typeof text === 'string' && text.trim().length > 0) {
      return text.trim();
    }
  }
  
  // If no fallback worked, try any available text
  const availableTexts = Object.values(i18n).filter(
    text => text && typeof text === 'string' && text.trim().length > 0
  );
  
  if (availableTexts.length > 0) {
    return availableTexts[0].trim();
  }
  
  // Final fallback - return empty string or a placeholder
  console.warn('No text available for any locale in i18n object:', i18n);
  return '';
}

/**
 * Get available locales for an I18nText object
 */
export function getAvailableLocales(i18n: I18nText): Locale[] {
  if (!i18n || typeof i18n !== 'object') {
    return [];
  }
  
  return Object.keys(i18n).filter(
    key => i18n[key as Locale] && typeof i18n[key as Locale] === 'string'
  ) as Locale[];
}

/**
 * Check if text is available for a specific locale
 */
export function hasTextForLocale(i18n: I18nText, locale: Locale): boolean {
  if (!i18n || typeof i18n !== 'object') {
    return false;
  }
  
  const text = i18n[locale];
  return Boolean(text && typeof text === 'string' && text.trim().length > 0);
}

/**
 * Get the best available locale for an I18nText object
 * Returns the first locale from the fallback chain that has text
 */
export function getBestAvailableLocale(i18n: I18nText, targetLocale?: Locale): Locale | null {
  if (!i18n || typeof i18n !== 'object') {
    return null;
  }
  
  const locale = targetLocale || getLocale();
  const fallbackChain = getLocaleFallbackChain(locale);
  
  for (const fallbackLocale of fallbackChain) {
    if (hasTextForLocale(i18n, fallbackLocale)) {
      return fallbackLocale;
    }
  }
  
  // If no fallback worked, return the first available locale
  const availableLocales = getAvailableLocales(i18n);
  return availableLocales.length > 0 ? availableLocales[0] : null;
}

/**
 * Create an I18nText object from a string (useful for migration)
 */
export function createI18nText(text: string, locale?: Locale): I18nText {
  const targetLocale = locale || getLocale();
  return { [targetLocale]: text } as I18nText;
}

/**
 * Merge multiple I18nText objects, with later objects taking priority
 */
export function mergeI18nTexts(...texts: (I18nText | undefined)[]): I18nText {
  const result: I18nText = {};
  
  for (const text of texts) {
    if (text && typeof text === 'object') {
      Object.assign(result, text);
    }
  }
  
  return result;
}

/**
 * Validate that an I18nText object has content for at least one locale
 */
export function isValidI18nText(i18n: unknown): i18n is I18nText {
  if (!i18n || typeof i18n !== 'object') {
    return false;
  }
  
  const availableLocales = getAvailableLocales(i18n as I18nText);
  return availableLocales.length > 0;
}

/**
 * Format an I18nText object for debugging/logging
 */
export function debugI18nText(i18n: I18nText): string {
  if (!isValidI18nText(i18n)) {
    return '(invalid i18n text)';
  }
  
  const availableLocales = getAvailableLocales(i18n);
  const entries = availableLocales.map(locale => `${locale}: "${i18n[locale]}"`);
  return `{ ${entries.join(', ')} }`;
}