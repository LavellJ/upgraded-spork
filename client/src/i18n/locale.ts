/**
 * Locale Management System
 * 
 * Provides centralized locale management with persistence and change notifications.
 * Integrates with the content pack system to ensure locale-specific content activation.
 */

import type { Locale } from '../authoring/schema';

const LOCALE_STORAGE_KEY = 'qi.locale';
const DEFAULT_LOCALE: Locale = 'en-AU';

// Supported locales in order of preference for fallbacks
export const SUPPORTED_LOCALES: Locale[] = ['en-AU', 'en-US', 'en-GB'];

// Locale change listeners
type LocaleChangeCallback = (newLocale: Locale, oldLocale: Locale) => void;
const localeChangeListeners: Set<LocaleChangeCallback> = new Set();

// Current locale state
let currentLocale: Locale | null = null;

/**
 * Get the browser's preferred locale from navigator.language
 */
function getBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const browserLang = navigator.language || navigator.languages?.[0] || 'en-AU';
  
  // Map browser locales to our supported locales
  if (browserLang.startsWith('en-US')) return 'en-US';
  if (browserLang.startsWith('en-GB')) return 'en-GB';
  if (browserLang.startsWith('en-AU')) return 'en-AU';
  
  // Default fallback for any English variant
  if (browserLang.startsWith('en')) return 'en-AU';
  
  return DEFAULT_LOCALE;
}

/**
 * Get the user's profile locale preference
 * This would typically come from user settings/profile data
 */
function getProfileLocale(): Locale | null {
  // TODO: Integrate with user profile system when available
  // For now, return null to fall back to other methods
  return null;
}

/**
 * Load locale from localStorage
 */
function getStoredLocale(): Locale | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch (error) {
    console.warn('Failed to read locale from localStorage:', error);
  }
  
  return null;
}

/**
 * Save locale to localStorage
 */
function storeLocale(locale: Locale): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.warn('Failed to save locale to localStorage:', error);
  }
}

/**
 * Initialize the locale system and determine the current locale
 */
function initializeLocale(): Locale {
  if (currentLocale) {
    return currentLocale;
  }

  // Priority order: stored > profile > browser > default
  const locale = 
    getStoredLocale() || 
    getProfileLocale() || 
    getBrowserLocale() || 
    DEFAULT_LOCALE;

  currentLocale = locale;
  return locale;
}

/**
 * Get the current active locale
 */
export function getLocale(): Locale {
  return currentLocale || initializeLocale();
}

/**
 * Set the active locale and notify listeners
 */
export function setLocale(newLocale: Locale): void {
  if (!SUPPORTED_LOCALES.includes(newLocale)) {
    console.warn(`Unsupported locale: ${newLocale}. Using default: ${DEFAULT_LOCALE}`);
    newLocale = DEFAULT_LOCALE;
  }

  const oldLocale = currentLocale || DEFAULT_LOCALE;
  
  if (oldLocale === newLocale) {
    return; // No change needed
  }

  currentLocale = newLocale;
  storeLocale(newLocale);

  // Notify all listeners of the change
  localeChangeListeners.forEach(callback => {
    try {
      callback(newLocale, oldLocale);
    } catch (error) {
      console.error('Error in locale change callback:', error);
    }
  });
}

/**
 * Register a callback to be called when the locale changes
 */
export function onLocaleChange(callback: LocaleChangeCallback): () => void {
  localeChangeListeners.add(callback);
  
  // Return unsubscribe function
  return () => {
    localeChangeListeners.delete(callback);
  };
}

/**
 * Get locale display information for UI
 */
export function getLocaleInfo(locale: Locale): {
  name: string;
  flag: string;
  region: string;
} {
  switch (locale) {
    case 'en-AU':
      return {
        name: 'Australian English',
        flag: '🇦🇺',
        region: 'Australia'
      };
    case 'en-US':
      return {
        name: 'American English',
        flag: '🇺🇸',
        region: 'United States'
      };
    case 'en-GB':
      return {
        name: 'British English',
        flag: '🇬🇧',
        region: 'United Kingdom'
      };
    default:
      return {
        name: 'English',
        flag: '🌐',
        region: 'International'
      };
  }
}

/**
 * Get the closest fallback locale for a given locale
 * Used when content is not available in the requested locale
 */
export function getFallbackLocale(targetLocale: Locale): Locale {
  // If it's already supported, return as-is
  if (SUPPORTED_LOCALES.includes(targetLocale)) {
    return targetLocale;
  }

  // Fallback priority logic:
  // en-GB -> en-AU (Commonwealth English)
  // en-US -> en-AU (default fallback)
  // anything else -> en-AU (default)
  
  return 'en-AU'; // Default fallback for all cases
}

/**
 * Get ordered list of locales to try for content fallback
 */
export function getLocaleFallbackChain(targetLocale: Locale): Locale[] {
  const chain: Locale[] = [targetLocale];
  
  // Add Commonwealth fallback for British English
  if (targetLocale === 'en-GB' && !chain.includes('en-AU')) {
    chain.push('en-AU');
  }
  
  // Add Australian as general fallback if not already included
  if (!chain.includes('en-AU')) {
    chain.push('en-AU');
  }
  
  // Add US English as secondary fallback if not already included
  if (!chain.includes('en-US')) {
    chain.push('en-US');
  }
  
  // Add GB English as tertiary fallback if not already included
  if (!chain.includes('en-GB')) {
    chain.push('en-GB');
  }
  
  return chain;
}

/**
 * Check if a locale is supported
 */
export function isLocaleSupported(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

/**
 * Reset locale to default (useful for testing)
 */
export function resetLocale(): void {
  currentLocale = null;
  // Clear all listeners to prevent test contamination
  localeChangeListeners.clear();
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(LOCALE_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear locale from localStorage:', error);
    }
  }
}

// Legacy compatibility exports
export type SupportedLocale = Locale;
export const getPreferredLocale = getLocale;

// Basic hook for locale-aware functionality
export function useLocale() {
  const locale = getLocale();
  
  return {
    locale,
    isRTL: false, // English is LTR
    formatNumber: (num: number) => num.toLocaleString(locale),
    formatDate: (date: Date) => date.toLocaleDateString(locale),
    formatTime: (date: Date) => date.toLocaleTimeString(locale, { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };
}

// Simple translation helper for future extension
export function t(key: string, fallback?: string): string {
  // For now, just return the fallback or key
  // This can be extended to support actual translation dictionaries
  return fallback || key;
}

// Pluralization helper for English locales
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  
  const pluralForm = plural || `${singular}s`;
  return `${count} ${pluralForm}`;
}

// Initialize locale when module loads
if (typeof window !== 'undefined') {
  initializeLocale();
}