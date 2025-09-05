import { describe, it, expect, vi } from 'vitest'
import { fmtRelative, fmtPercent, fmtDate } from '../src/lib/fmt'

describe('Formatting utilities', () => {
  describe('fmtRelative', () => {
    it('formats past dates correctly', () => {
      const now = new Date('2024-01-15T12:00:00Z')
      vi.setSystemTime(now)
      
      const oneHourAgo = new Date('2024-01-15T11:00:00Z')
      const oneDayAgo = new Date('2024-01-14T12:00:00Z')
      
      expect(fmtRelative(oneHourAgo)).toContain('hour')
      expect(fmtRelative(oneDayAgo)).toContain('day')
      
      vi.useRealTimers()
    })

    it('formats future dates correctly', () => {
      const now = new Date('2024-01-15T12:00:00Z')
      vi.setSystemTime(now)
      
      const inOneHour = new Date('2024-01-15T13:00:00Z')
      const inOneDay = new Date('2024-01-16T12:00:00Z')
      
      expect(fmtRelative(inOneHour)).toContain('hour')
      expect(fmtRelative(inOneDay)).toContain('day')
      
      vi.useRealTimers()
    })

    it('handles current time', () => {
      const now = new Date()
      const result = fmtRelative(now)
      expect(result).toContain('now') || expect(result).toContain('second')
    })
  })

  describe('fmtPercent', () => {
    it('formats percentages correctly', () => {
      expect(fmtPercent(0.85)).toBe('85%')
      expect(fmtPercent(0.1)).toBe('10%')
      expect(fmtPercent(1)).toBe('100%')
      expect(fmtPercent(0)).toBe('0%')
    })

    it('rounds decimals', () => {
      expect(fmtPercent(0.856)).toBe('86%')
      expect(fmtPercent(0.123)).toBe('12%')
    })
  })

  describe('fmtDate', () => {
    it('formats dates correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const result = fmtDate(date)
      
      // Should contain month and day
      expect(result).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
      expect(result).toMatch(/\d+/)
    })
  })
})