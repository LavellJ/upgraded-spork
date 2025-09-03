/**
 * Internationalization Tests
 * Tests for locale management and text fallback behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  getLocale, 
  setLocale, 
  onLocaleChange, 
  resetLocale,
  getLocaleInfo,
  getFallbackLocale,
  getLocaleFallbackChain,
  isLocaleSupported,
  SUPPORTED_LOCALES
} from '../src/i18n/locale';
import {
  tI18n,
  getAvailableLocales,
  hasTextForLocale,
  getBestAvailableLocale,
  createI18nText,
  mergeI18nTexts,
  isValidI18nText,
  debugI18nText
} from '../src/i18n/text';
import type { I18nText, Locale } from '../src/authoring/schema';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('Locale Management', () => {
  beforeEach(() => {
    resetLocale();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetLocale();
  });

  describe('Basic Locale Operations', () => {
    it('should return default locale when no preference is set', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(getLocale()).toBe('en-AU');
    });

    it('should persist locale changes to localStorage', () => {
      setLocale('en-US');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('qi.locale', 'en-US');
      expect(getLocale()).toBe('en-US');
    });

    it('should load stored locale from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('en-GB');
      resetLocale();
      expect(getLocale()).toBe('en-GB');
    });

    it('should validate supported locales', () => {
      setLocale('en-US');
      expect(getLocale()).toBe('en-US');
      
      // Unsupported locale should fallback to default
      setLocale('fr-FR' as Locale);
      expect(getLocale()).toBe('en-AU');
    });

    it('should support all expected locales', () => {
      expect(SUPPORTED_LOCALES).toEqual(['en-AU', 'en-US', 'en-GB']);
      
      SUPPORTED_LOCALES.forEach(locale => {
        expect(isLocaleSupported(locale)).toBe(true);
      });
    });
  });

  describe('Locale Change Notifications', () => {
    it('should notify listeners when locale changes', () => {
      const callback = vi.fn();
      const unsubscribe = onLocaleChange(callback);
      
      setLocale('en-US');
      expect(callback).toHaveBeenCalledWith('en-US', 'en-AU');
      
      setLocale('en-GB');
      expect(callback).toHaveBeenCalledWith('en-GB', 'en-US');
      
      unsubscribe();
      setLocale('en-AU');
      expect(callback).toHaveBeenCalledTimes(2); // Should not be called after unsubscribe
    });

    it('should not notify when locale stays the same', () => {
      setLocale('en-AU');
      const callback = vi.fn();
      onLocaleChange(callback);
      
      setLocale('en-AU'); // Same locale
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', () => {
      const faultyCallback = vi.fn(() => { throw new Error('Test error'); });
      const goodCallback = vi.fn();
      
      onLocaleChange(faultyCallback);
      onLocaleChange(goodCallback);
      
      expect(() => setLocale('en-US')).not.toThrow();
      expect(goodCallback).toHaveBeenCalled();
    });
  });

  describe('Locale Information', () => {
    it('should provide correct locale display information', () => {
      expect(getLocaleInfo('en-AU')).toEqual({
        name: 'Australian English',
        flag: '🇦🇺',
        region: 'Australia'
      });

      expect(getLocaleInfo('en-US')).toEqual({
        name: 'American English',
        flag: '🇺🇸',
        region: 'United States'
      });

      expect(getLocaleInfo('en-GB')).toEqual({
        name: 'British English',
        flag: '🇬🇧',
        region: 'United Kingdom'
      });
    });
  });

  describe('Fallback Logic', () => {
    it('should provide correct fallback locales', () => {
      expect(getFallbackLocale('en-GB')).toBe('en-AU');
      expect(getFallbackLocale('en-US')).toBe('en-AU');
      expect(getFallbackLocale('en-AU')).toBe('en-AU');
    });

    it('should generate fallback chains', () => {
      expect(getLocaleFallbackChain('en-AU')).toEqual(['en-AU', 'en-US', 'en-GB']);
      expect(getLocaleFallbackChain('en-US')).toEqual(['en-US', 'en-AU', 'en-GB']);
      expect(getLocaleFallbackChain('en-GB')).toEqual(['en-GB', 'en-AU', 'en-US']);
    });
  });
});

describe('Text Localization', () => {
  beforeEach(() => {
    resetLocale();
    setLocale('en-AU');
  });

  describe('tI18n Function', () => {
    it('should return text for current locale', () => {
      const i18nText: I18nText = {
        'en-AU': 'G\'day mate',
        'en-US': 'Hello there',
        'en-GB': 'Hello chap'
      };

      expect(tI18n(i18nText)).toBe('G\'day mate');
    });

    it('should fallback to other locales when current is unavailable', () => {
      setLocale('en-GB');
      
      const i18nText: I18nText = {
        'en-AU': 'Available text',
        'en-US': 'US text'
        // No en-GB text
      };

      expect(tI18n(i18nText)).toBe('Available text'); // Falls back to en-AU
    });

    it('should use explicit locale parameter', () => {
      const i18nText: I18nText = {
        'en-AU': 'Aussie text',
        'en-US': 'American text',
        'en-GB': 'British text'
      };

      expect(tI18n(i18nText, 'en-US')).toBe('American text');
      expect(tI18n(i18nText, 'en-GB')).toBe('British text');
    });

    it('should return first available text when no fallback matches', () => {
      setLocale('en-US');
      
      const i18nText: I18nText = {
        'en-GB': 'Only British text available'
      };

      expect(tI18n(i18nText)).toBe('Only British text available');
    });

    it('should handle empty or invalid i18n objects', () => {
      expect(tI18n(null as any)).toBe('');
      expect(tI18n(undefined as any)).toBe('');
      expect(tI18n({} as I18nText)).toBe('');
      expect(tI18n('not an object' as any)).toBe('');
    });

    it('should trim whitespace from returned text', () => {
      const i18nText: I18nText = {
        'en-AU': '  Padded text  '
      };

      expect(tI18n(i18nText)).toBe('Padded text');
    });

    it('should ignore empty or whitespace-only values', () => {
      const i18nText: I18nText = {
        'en-AU': '   ',
        'en-US': '',
        'en-GB': 'Valid text'
      };

      expect(tI18n(i18nText)).toBe('Valid text');
    });
  });

  describe('Helper Functions', () => {
    const sampleI18nText: I18nText = {
      'en-AU': 'Australian text',
      'en-US': 'American text'
    };

    it('should get available locales', () => {
      expect(getAvailableLocales(sampleI18nText)).toEqual(['en-AU', 'en-US']);
      expect(getAvailableLocales({})).toEqual([]);
    });

    it('should check text availability for locales', () => {
      expect(hasTextForLocale(sampleI18nText, 'en-AU')).toBe(true);
      expect(hasTextForLocale(sampleI18nText, 'en-US')).toBe(true);
      expect(hasTextForLocale(sampleI18nText, 'en-GB')).toBe(false);
    });

    it('should find best available locale', () => {
      setLocale('en-GB');
      expect(getBestAvailableLocale(sampleI18nText)).toBe('en-AU'); // Fallback

      setLocale('en-US');
      expect(getBestAvailableLocale(sampleI18nText)).toBe('en-US'); // Direct match
    });

    it('should create i18n text objects', () => {
      setLocale('en-US');
      const result = createI18nText('Hello world');
      expect(result).toEqual({ 'en-US': 'Hello world' });
    });

    it('should merge i18n text objects', () => {
      const text1: I18nText = { 'en-AU': 'Text 1' };
      const text2: I18nText = { 'en-US': 'Text 2' };
      const text3: I18nText = { 'en-AU': 'Override text' }; // Should override

      const result = mergeI18nTexts(text1, text2, text3);
      expect(result).toEqual({
        'en-AU': 'Override text',
        'en-US': 'Text 2'
      });
    });

    it('should validate i18n text objects', () => {
      expect(isValidI18nText(sampleI18nText)).toBe(true);
      expect(isValidI18nText({})).toBe(false);
      expect(isValidI18nText(null)).toBe(false);
      expect(isValidI18nText('string')).toBe(false);
    });

    it('should debug i18n text objects', () => {
      const debug = debugI18nText(sampleI18nText);
      expect(debug).toContain('en-AU: "Australian text"');
      expect(debug).toContain('en-US: "American text"');
    });
  });

  describe('Edge Cases', () => {
    it('should handle complex fallback scenarios', () => {
      setLocale('en-GB');
      
      // Only US text available
      const usOnlyText: I18nText = { 'en-US': 'US only' };
      expect(tI18n(usOnlyText)).toBe('US only');
      
      // Multiple missing locales
      const sparseText: I18nText = { 'en-GB': 'GB text' };
      expect(tI18n(sparseText)).toBe('GB text');
    });

    it('should handle malformed text values', () => {
      const malformedText = {
        'en-AU': null,
        'en-US': undefined,
        'en-GB': 'Valid text'
      } as any;

      expect(tI18n(malformedText)).toBe('Valid text');
    });

    it('should work with single-locale content', () => {
      const singleLocaleText: I18nText = { 'en-US': 'Only US text' };
      
      setLocale('en-AU');
      expect(tI18n(singleLocaleText)).toBe('Only US text');
    });
  });
});