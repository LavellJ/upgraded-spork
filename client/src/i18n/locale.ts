// Basic localization utilities for Scout lines and UI text
// Supports Australian English default with fallback to general English

export type SupportedLocale = 'en-AU' | 'en';

// Get user's preferred locale from browser or default
export function getPreferredLocale(): SupportedLocale {
  const browserLang = typeof navigator !== 'undefined' ? navigator.language : 'en-AU';
  
  // Check if we support the specific locale
  if (browserLang === 'en-AU') {
    return 'en-AU';
  }
  
  // Check language family (en-US, en-GB, etc. -> en)
  const langFamily = browserLang.split('-')[0];
  if (langFamily === 'en') {
    return 'en-AU'; // Default to Australian English for English speakers
  }
  
  // Fallback to default
  return 'en-AU';
}

// Basic hook for locale-aware functionality
export function useLocale() {
  // For now, we always use en-AU since that's all we have
  // This can be extended later to support user preferences and more locales
  const locale: SupportedLocale = 'en-AU';
  
  return {
    locale,
    isRTL: false, // English is LTR
    formatNumber: (num: number) => num.toLocaleString('en-AU'),
    formatDate: (date: Date) => date.toLocaleDateString('en-AU'),
    formatTime: (date: Date) => date.toLocaleTimeString('en-AU', { 
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

// Pluralization helper for Australian English
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  
  const pluralForm = plural || `${singular}s`;
  return `${count} ${pluralForm}`;
}