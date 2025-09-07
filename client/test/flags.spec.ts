import { describe, it, expect, beforeEach } from 'vitest'
import { Flags } from '../src/config/flags'

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('Flags system', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    // Clear any cached flags to ensure clean state
    ;(globalThis as any).__qiFlagsEvt = new EventTarget()
    // Clear the cached flags by calling get() after clearing storage
    // This forces a reload from the empty localStorage
  })

  it('should get default flags when none are stored', () => {
    const flags = Flags.get()
    
    expect(flags).toEqual({
      finalArt: false,
      teacherPanelV2: false, 
      teacherThemeV2: false,
      teacherAppearanceV3: false
    })
  })

  it('should roundtrip flags without throwing', () => {
    // Test setting partial flags
    const updatedFlags = Flags.set({ finalArt: true, teacherPanelV2: true })
    
    expect(updatedFlags.finalArt).toBe(true)
    expect(updatedFlags.teacherPanelV2).toBe(true)
    expect(updatedFlags.teacherThemeV2).toBe(false)
    expect(updatedFlags.teacherAppearanceV3).toBe(false)
    
    // Test getting flags returns the same values
    const retrievedFlags = Flags.get()
    expect(retrievedFlags).toEqual(updatedFlags)
  })

  it('should persist flags to localStorage', () => {
    Flags.set({ teacherThemeV2: true })
    
    // Check localStorage directly
    const stored = mockLocalStorage.getItem('qi.flags.v1')
    expect(stored).toBeTruthy()
    
    const parsed = JSON.parse(stored!)
    expect(parsed.teacherThemeV2).toBe(true)
  })

  it('should load flags from localStorage on subsequent calls', () => {
    // Set initial flags
    Flags.set({ finalArt: true, teacherAppearanceV3: true })
    
    // Clear cache to force reload from storage
    ;(globalThis as any).__qiFlagsEvt = new EventTarget()
    
    // Get flags should reload from localStorage
    const reloadedFlags = Flags.get()
    expect(reloadedFlags.finalArt).toBe(true)
    expect(reloadedFlags.teacherAppearanceV3).toBe(true)
  })

  it('should handle partial flag updates correctly', () => {
    // Set some initial flags
    Flags.set({ finalArt: true, teacherPanelV2: true })
    
    // Update only one flag
    const updated = Flags.set({ teacherThemeV2: true })
    
    // Should preserve existing flags and add new one
    expect(updated.finalArt).toBe(true)
    expect(updated.teacherPanelV2).toBe(true)
    expect(updated.teacherThemeV2).toBe(true)
    expect(updated.teacherAppearanceV3).toBe(false)
  })

  it('should handle malformed localStorage data gracefully', () => {
    // Put invalid JSON in localStorage
    mockLocalStorage.setItem('qi.flags.v1', 'invalid-json')
    
    // Should return defaults without throwing
    const flags = Flags.get()
    expect(flags).toEqual({
      finalArt: false,
      teacherPanelV2: false,
      teacherThemeV2: false, 
      teacherAppearanceV3: false
    })
  })

  it('should emit change event when flags are updated', () => {
    let eventFired = false
    const evt = (globalThis as any).__qiFlagsEvt
    
    evt.addEventListener('change', () => {
      eventFired = true
    })
    
    Flags.set({ finalArt: true })
    
    expect(eventFired).toBe(true)
  })
})