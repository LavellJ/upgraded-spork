/**
 * Locale Nuances and Spelling Hints
 * 
 * Provides utilities for handling regional spelling differences and locale-specific
 * content nuances between Australian, American, and British English.
 */

import type { Locale } from '../authoring/schema';

// Spelling variations between locales
const SPELLING_VARIANTS: Record<string, Record<Locale, string>> = {
  // British/Australian vs American spellings
  'color': {
    'en-AU': 'colour',
    'en-GB': 'colour',
    'en-US': 'color'
  },
  'center': {
    'en-AU': 'centre',
    'en-GB': 'centre',
    'en-US': 'center'
  },
  'meter': {
    'en-AU': 'metre',
    'en-GB': 'metre',
    'en-US': 'meter'
  },
  'theater': {
    'en-AU': 'theatre',
    'en-GB': 'theatre',
    'en-US': 'theater'
  },
  'organization': {
    'en-AU': 'organisation',
    'en-GB': 'organisation',
    'en-US': 'organization'
  },
  'recognize': {
    'en-AU': 'recognise',
    'en-GB': 'recognise',
    'en-US': 'recognize'
  },
  'analyze': {
    'en-AU': 'analyse',
    'en-GB': 'analyse',
    'en-US': 'analyze'
  },
  'defense': {
    'en-AU': 'defence',
    'en-GB': 'defence',
    'en-US': 'defense'
  },
  'practice': {
    'en-AU': 'practice', // noun and verb
    'en-GB': 'practice', // noun, 'practise' for verb
    'en-US': 'practice'
  },
  'license': {
    'en-AU': 'licence', // noun, 'license' for verb
    'en-GB': 'licence', // noun, 'license' for verb
    'en-US': 'license'
  },
  'gray': {
    'en-AU': 'grey',
    'en-GB': 'grey',
    'en-US': 'gray'
  },
  'fulfill': {
    'en-AU': 'fulfil',
    'en-GB': 'fulfil',
    'en-US': 'fulfill'
  },
  'traveling': {
    'en-AU': 'travelling',
    'en-GB': 'travelling',
    'en-US': 'traveling'
  },
  'jewelry': {
    'en-AU': 'jewellery',
    'en-GB': 'jewellery',
    'en-US': 'jewelry'
  }
};

// Currency and measurement preferences
const LOCALE_PREFERENCES: Record<Locale, {
  currency: string;
  currencySymbol: string;
  measurementSystem: 'metric' | 'imperial';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  firstDayOfWeek: 'Sunday' | 'Monday';
}> = {
  'en-AU': {
    currency: 'AUD',
    currencySymbol: '$',
    measurementSystem: 'metric',
    dateFormat: 'DD/MM/YYYY',
    firstDayOfWeek: 'Monday'
  },
  'en-US': {
    currency: 'USD',
    currencySymbol: '$',
    measurementSystem: 'imperial',
    dateFormat: 'MM/DD/YYYY',
    firstDayOfWeek: 'Sunday'
  },
  'en-GB': {
    currency: 'GBP',
    currencySymbol: '£',
    measurementSystem: 'metric',
    dateFormat: 'DD/MM/YYYY',
    firstDayOfWeek: 'Monday'
  }
};

// Educational terminology differences
const EDUCATIONAL_TERMS: Record<string, Record<Locale, string>> = {
  'grade': {
    'en-AU': 'year',
    'en-GB': 'year',
    'en-US': 'grade'
  },
  'math': {
    'en-AU': 'maths',
    'en-GB': 'maths',
    'en-US': 'math'
  },
  'recess': {
    'en-AU': 'recess',
    'en-GB': 'break time',
    'en-US': 'recess'
  },
  'principal': {
    'en-AU': 'principal',
    'en-GB': 'headteacher',
    'en-US': 'principal'
  },
  'kindergarten': {
    'en-AU': 'prep',
    'en-GB': 'reception',
    'en-US': 'kindergarten'
  }
};

/**
 * Get the preferred spelling for a word in the given locale
 */
export function getPreferredSpelling(word: string, locale: Locale): string {
  const normalizedWord = word.toLowerCase();
  
  // Check spelling variants
  if (SPELLING_VARIANTS[normalizedWord]) {
    return SPELLING_VARIANTS[normalizedWord][locale] || word;
  }
  
  // Check educational terms
  if (EDUCATIONAL_TERMS[normalizedWord]) {
    return EDUCATIONAL_TERMS[normalizedWord][locale] || word;
  }
  
  return word;
}

/**
 * Get all spelling variants for a word across all locales
 */
export function getAllSpellingVariants(word: string): Record<Locale, string> {
  const normalizedWord = word.toLowerCase();
  
  if (SPELLING_VARIANTS[normalizedWord]) {
    return SPELLING_VARIANTS[normalizedWord];
  }
  
  if (EDUCATIONAL_TERMS[normalizedWord]) {
    return EDUCATIONAL_TERMS[normalizedWord];
  }
  
  // Return the same word for all locales if no variants exist
  return {
    'en-AU': word,
    'en-US': word,
    'en-GB': word
  };
}

/**
 * Get locale-specific preferences (currency, measurements, etc.)
 */
export function getLocalePreferences(locale: Locale) {
  return LOCALE_PREFERENCES[locale];
}

/**
 * Convert text to use locale-appropriate spelling
 */
export function localizeText(text: string, locale: Locale): string {
  let localizedText = text;
  
  // Apply spelling corrections
  for (const [standardWord, variants] of Object.entries(SPELLING_VARIANTS)) {
    if (variants[locale]) {
      const regex = new RegExp(`\\b${standardWord}\\b`, 'gi');
      localizedText = localizedText.replace(regex, variants[locale]);
    }
  }
  
  // Apply educational term corrections
  for (const [standardTerm, variants] of Object.entries(EDUCATIONAL_TERMS)) {
    if (variants[locale]) {
      const regex = new RegExp(`\\b${standardTerm}\\b`, 'gi');
      localizedText = localizedText.replace(regex, variants[locale]);
    }
  }
  
  return localizedText;
}

/**
 * Check if a word has different spellings across locales
 */
export function hasSpellingVariants(word: string): boolean {
  const normalizedWord = word.toLowerCase();
  return normalizedWord in SPELLING_VARIANTS || normalizedWord in EDUCATIONAL_TERMS;
}

/**
 * Get a hint about locale differences for content authors
 */
export function getLocaleHint(word: string): string | null {
  const normalizedWord = word.toLowerCase();
  
  if (SPELLING_VARIANTS[normalizedWord]) {
    const variants = SPELLING_VARIANTS[normalizedWord];
    const auVariant = variants['en-AU'];
    const usVariant = variants['en-US'];
    const gbVariant = variants['en-GB'];
    
    if (auVariant === gbVariant && auVariant !== usVariant) {
      return `AU/GB: "${auVariant}", US: "${usVariant}"`;
    } else if (auVariant !== usVariant || auVariant !== gbVariant) {
      return `AU: "${auVariant}", US: "${usVariant}", GB: "${gbVariant}"`;
    }
  }
  
  if (EDUCATIONAL_TERMS[normalizedWord]) {
    const variants = EDUCATIONAL_TERMS[normalizedWord];
    return `AU: "${variants['en-AU']}", US: "${variants['en-US']}", GB: "${variants['en-GB']}"`;
  }
  
  return null;
}

/**
 * Validate content for locale appropriateness
 */
export function validateLocaleContent(text: string, targetLocale: Locale): {
  isAppropriate: boolean;
  suggestions: string[];
  warnings: string[];
} {
  const suggestions: string[] = [];
  const warnings: string[] = [];
  
  // Check for words that should be localized
  for (const [standardWord, variants] of Object.entries(SPELLING_VARIANTS)) {
    const targetWord = variants[targetLocale];
    const otherWords = Object.values(variants).filter(word => word !== targetWord);
    
    for (const otherWord of otherWords) {
      const regex = new RegExp(`\\b${otherWord}\\b`, 'gi');
      if (regex.test(text)) {
        suggestions.push(`Consider using "${targetWord}" instead of "${otherWord}" for ${targetLocale}`);
      }
    }
  }
  
  // Check educational terms
  for (const [standardTerm, variants] of Object.entries(EDUCATIONAL_TERMS)) {
    const targetTerm = variants[targetLocale];
    const otherTerms = Object.values(variants).filter(term => term !== targetTerm);
    
    for (const otherTerm of otherTerms) {
      const regex = new RegExp(`\\b${otherTerm}\\b`, 'gi');
      if (regex.test(text)) {
        suggestions.push(`Consider using "${targetTerm}" instead of "${otherTerm}" for ${targetLocale}`);
      }
    }
  }
  
  // Check for currency symbols that might be inappropriate
  const preferences = getLocalePreferences(targetLocale);
  const inappropriateCurrencies = ['$', '£', '€'].filter(symbol => symbol !== preferences.currencySymbol);
  
  for (const currency of inappropriateCurrencies) {
    if (text.includes(currency)) {
      warnings.push(`Currency symbol "${currency}" detected - consider using "${preferences.currencySymbol}" for ${targetLocale}`);
    }
  }
  
  return {
    isAppropriate: suggestions.length === 0 && warnings.length === 0,
    suggestions,
    warnings
  };
}

// Export commonly used terms for quick reference
export const COMMON_VARIANTS = {
  COLOR_COLOUR: getAllSpellingVariants('color'),
  CENTER_CENTRE: getAllSpellingVariants('center'),
  MATH_MATHS: getAllSpellingVariants('math'),
  GRADE_YEAR: getAllSpellingVariants('grade')
} as const;