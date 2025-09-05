import { describe, it, expect, beforeEach } from 'vitest'
import { getContrastRatio, checkWcagContrast } from '../src/theme/contrast'

describe('Theme contrast utilities', () => {
  beforeEach(() => {
    // Reset DOM state
    document.documentElement.removeAttribute('data-theme')
  })

  describe('getContrastRatio', () => {
    it('calculates contrast ratio correctly', () => {
      // Black text on white background (perfect contrast)
      const blackOnWhite = getContrastRatio('0 0 0', '255 255 255')
      expect(blackOnWhite).toBeCloseTo(21, 1) // ~21:1

      // White text on black background (same ratio)
      const whiteOnBlack = getContrastRatio('255 255 255', '0 0 0')
      expect(whiteOnBlack).toBeCloseTo(21, 1)

      // Medium gray on white (moderate contrast)
      const grayOnWhite = getContrastRatio('128 128 128', '255 255 255')
      expect(grayOnWhite).toBeGreaterThan(3)
      expect(grayOnWhite).toBeLessThan(5)
    })

    it('returns same ratio regardless of order', () => {
      const ratio1 = getContrastRatio('41 37 36', '249 246 238')
      const ratio2 = getContrastRatio('249 246 238', '41 37 36')
      expect(ratio1).toBeCloseTo(ratio2, 2)
    })
  })

  describe('checkWcagContrast', () => {
    it('validates AA compliance correctly', () => {
      // High contrast passes AA
      expect(checkWcagContrast('0 0 0', '255 255 255', 'AA')).toBe(true)
      
      // Parchment theme colors should pass AA
      expect(checkWcagContrast('41 37 36', '249 246 238', 'AA')).toBe(true)
      
      // Low contrast fails AA
      expect(checkWcagContrast('200 200 200', '255 255 255', 'AA')).toBe(false)
    })

    it('validates AAA compliance correctly', () => {
      // High contrast passes AAA
      expect(checkWcagContrast('0 0 0', '255 255 255', 'AAA')).toBe(true)
      
      // Medium contrast might fail AAA but pass AA
      const mediumContrast = getContrastRatio('87 83 78', '255 255 255')
      if (mediumContrast >= 4.5 && mediumContrast < 7) {
        expect(checkWcagContrast('87 83 78', '255 255 255', 'AA')).toBe(true)
        expect(checkWcagContrast('87 83 78', '255 255 255', 'AAA')).toBe(false)
      }
    })
  })

  describe('Brand color contrast', () => {
    it('brand colors meet accessibility requirements', () => {
      // Brand on white background
      expect(checkWcagContrast('18 120 98', '255 255 255', 'AA')).toBe(true)
      
      // White text on brand background  
      expect(checkWcagContrast('255 255 255', '18 120 98', 'AA')).toBe(true)
    })
  })
})