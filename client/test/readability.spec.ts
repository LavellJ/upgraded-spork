/**
 * Tests for readability and accessibility settings
 * Covers dyslexia mode, text scaling, reduced motion, and persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReadability } from '../src/hooks/useReadability';

describe('Readability Settings', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: { [key: string]: string } = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; })
    };
  })();

  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.clear();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });
    
    // Clear DOM modifications
    delete document.documentElement.dataset.readability;
    delete document.documentElement.dataset.reducedMotion;
    document.documentElement.style.removeProperty('--text-scale');
    document.documentElement.style.removeProperty('--line-length-max');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useReadability hook', () => {
    it('initializes with default settings', () => {
      const { result } = renderHook(() => useReadability());

      expect(result.current.settings).toEqual({
        dyslexiaMode: false,
        textScale: 1.0,
        maxLineLength: false,
        reducedMotion: false
      });
    });

    it('loads settings from localStorage on initialization', () => {
      const savedSettings = {
        dyslexiaMode: true,
        textScale: 1.2,
        maxLineLength: true,
        reducedMotion: true
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings));

      const { result } = renderHook(() => useReadability());

      expect(result.current.settings).toEqual(savedSettings);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('qi.readability');
    });

    it('handles corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useReadability());

      expect(result.current.settings).toEqual({
        dyslexiaMode: false,
        textScale: 1.0,
        maxLineLength: false,
        reducedMotion: false
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load readability settings'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('toggles dyslexia mode and applies DOM changes', () => {
      const { result } = renderHook(() => useReadability());

      act(() => {
        result.current.toggleDyslexiaMode();
      });

      expect(result.current.settings.dyslexiaMode).toBe(true);
      expect(document.documentElement.dataset.readability).toBe('dyslexia');
    });

    it('removes dyslexia mode attribute when toggled off', () => {
      const { result } = renderHook(() => useReadability());

      // First toggle on
      act(() => {
        result.current.toggleDyslexiaMode();
      });
      expect(document.documentElement.dataset.readability).toBe('dyslexia');

      // Then toggle off
      act(() => {
        result.current.toggleDyslexiaMode();
      });
      expect(result.current.settings.dyslexiaMode).toBe(false);
      expect(document.documentElement.dataset.readability).toBeUndefined();
    });

    it('sets text scale and applies CSS variable', () => {
      const { result } = renderHook(() => useReadability());

      act(() => {
        result.current.setTextScale(1.3);
      });

      expect(result.current.settings.textScale).toBe(1.3);
      expect(document.documentElement.style.getPropertyValue('--text-scale')).toBe('1.3');
    });

    it('clamps text scale to valid range', () => {
      const { result } = renderHook(() => useReadability());

      // Test upper bound
      act(() => {
        result.current.setTextScale(2.0);
      });
      expect(result.current.settings.textScale).toBe(1.3); // Clamped to max

      // Test lower bound
      act(() => {
        result.current.setTextScale(0.5);
      });
      expect(result.current.settings.textScale).toBe(0.9); // Clamped to min
    });

    it('toggles max line length and applies CSS variable', () => {
      const { result } = renderHook(() => useReadability());

      act(() => {
        result.current.toggleMaxLineLength();
      });

      expect(result.current.settings.maxLineLength).toBe(true);
      expect(document.documentElement.style.getPropertyValue('--line-length-max')).toBe('65ch');

      act(() => {
        result.current.toggleMaxLineLength();
      });

      expect(result.current.settings.maxLineLength).toBe(false);
      expect(document.documentElement.style.getPropertyValue('--line-length-max')).toBe('none');
    });

    it('toggles reduced motion and applies DOM attribute', () => {
      const { result } = renderHook(() => useReadability());

      act(() => {
        result.current.toggleReducedMotion();
      });

      expect(result.current.settings.reducedMotion).toBe(true);
      expect(document.documentElement.dataset.reducedMotion).toBe('true');

      act(() => {
        result.current.toggleReducedMotion();
      });

      expect(result.current.settings.reducedMotion).toBe(false);
      expect(document.documentElement.dataset.reducedMotion).toBeUndefined();
    });

    it('persists settings to localStorage after changes', () => {
      const { result } = renderHook(() => useReadability());

      act(() => {
        result.current.toggleDyslexiaMode();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'qi.readability',
        JSON.stringify({
          dyslexiaMode: true,
          textScale: 1.0,
          maxLineLength: false,
          reducedMotion: false
        })
      );
    });

    it('handles localStorage save errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      const { result } = renderHook(() => useReadability());

      act(() => {
        result.current.toggleDyslexiaMode();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save readability settings'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('resets all settings to defaults', () => {
      const { result } = renderHook(() => useReadability());

      // First modify some settings
      act(() => {
        result.current.toggleDyslexiaMode();
        result.current.setTextScale(1.2);
        result.current.toggleMaxLineLength();
        result.current.toggleReducedMotion();
      });

      expect(result.current.settings).toEqual({
        dyslexiaMode: true,
        textScale: 1.2,
        maxLineLength: true,
        reducedMotion: true
      });

      // Then reset
      act(() => {
        result.current.resetSettings();
      });

      expect(result.current.settings).toEqual({
        dyslexiaMode: false,
        textScale: 1.0,
        maxLineLength: false,
        reducedMotion: false
      });

      // Verify DOM is also reset
      expect(document.documentElement.dataset.readability).toBeUndefined();
      expect(document.documentElement.dataset.reducedMotion).toBeUndefined();
      expect(document.documentElement.style.getPropertyValue('--text-scale')).toBe('1');
      expect(document.documentElement.style.getPropertyValue('--line-length-max')).toBe('none');
    });

    it('applies all settings on initialization when loaded from storage', () => {
      const savedSettings = {
        dyslexiaMode: true,
        textScale: 1.2,
        maxLineLength: true,
        reducedMotion: true
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings));

      renderHook(() => useReadability());

      // Verify all DOM changes are applied
      expect(document.documentElement.dataset.readability).toBe('dyslexia');
      expect(document.documentElement.dataset.reducedMotion).toBe('true');
      expect(document.documentElement.style.getPropertyValue('--text-scale')).toBe('1.2');
      expect(document.documentElement.style.getPropertyValue('--line-length-max')).toBe('65ch');
    });

    it('updates individual settings via updateSettings method', () => {
      const { result } = renderHook(() => useReadability());

      act(() => {
        result.current.updateSettings({
          dyslexiaMode: true,
          textScale: 1.1
        });
      });

      expect(result.current.settings.dyslexiaMode).toBe(true);
      expect(result.current.settings.textScale).toBe(1.1);
      expect(result.current.settings.maxLineLength).toBe(false);
      expect(result.current.settings.reducedMotion).toBe(false);
    });
  });

  describe('CSS and DOM integration', () => {
    it('applies correct CSS custom properties for text scaling', () => {
      const { result } = renderHook(() => useReadability());

      act(() => {
        result.current.setTextScale(1.15);
      });

      const computedScale = document.documentElement.style.getPropertyValue('--text-scale');
      expect(computedScale).toBe('1.15');
    });

    it('correctly sets and removes data attributes', () => {
      const { result } = renderHook(() => useReadability());

      // Test dyslexia mode attribute
      act(() => {
        result.current.toggleDyslexiaMode();
      });
      expect(document.documentElement.getAttribute('data-readability')).toBe('dyslexia');

      act(() => {
        result.current.toggleDyslexiaMode();
      });
      expect(document.documentElement.hasAttribute('data-readability')).toBe(false);

      // Test reduced motion attribute
      act(() => {
        result.current.toggleReducedMotion();
      });
      expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('true');

      act(() => {
        result.current.toggleReducedMotion();
      });
      expect(document.documentElement.hasAttribute('data-reduced-motion')).toBe(false);
    });
  });
});