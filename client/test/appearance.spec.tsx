import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AppearanceSettings from '../src/settings/Appearance'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('AppearanceSettings', () => {
  beforeEach(() => {
    // Reset document attributes
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-contrast')
    document.documentElement.removeAttribute('data-density')
    
    // Clear mocks
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
  })

  it('renders appearance settings with default values', () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    render(<AppearanceSettings />)
    
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByText('Theme')).toBeInTheDocument()
    expect(screen.getByText('Contrast')).toBeInTheDocument()
    expect(screen.getByText('Density')).toBeInTheDocument()
  })

  it('applies dark theme when clicked', () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    render(<AppearanceSettings />)
    
    const darkButton = screen.getByRole('button', { name: 'dark' })
    fireEvent.click(darkButton)
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'qi.ui.v1',
      JSON.stringify({ theme: 'dark', contrast: 'normal', density: 'comfy' })
    )
  })

  it('applies high contrast when clicked', () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    render(<AppearanceSettings />)
    
    const highButton = screen.getByRole('button', { name: 'high' })
    fireEvent.click(highButton)
    
    expect(document.documentElement.getAttribute('data-contrast')).toBe('high')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'qi.ui.v1',
      JSON.stringify({ theme: 'auto', contrast: 'high', density: 'comfy' })
    )
  })

  it('applies compact density when clicked', () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    render(<AppearanceSettings />)
    
    const compactButton = screen.getByRole('button', { name: 'compact' })
    fireEvent.click(compactButton)
    
    expect(document.documentElement.getAttribute('data-density')).toBe('compact')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'qi.ui.v1',
      JSON.stringify({ theme: 'auto', contrast: 'normal', density: 'compact' })
    )
  })

  it('combines all settings correctly', () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    render(<AppearanceSettings />)
    
    // Click all settings
    fireEvent.click(screen.getByRole('button', { name: 'dark' }))
    fireEvent.click(screen.getByRole('button', { name: 'high' }))
    fireEvent.click(screen.getByRole('button', { name: 'compact' }))
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.getAttribute('data-contrast')).toBe('high')
    expect(document.documentElement.getAttribute('data-density')).toBe('compact')
  })

  it('loads existing preferences from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue(
      JSON.stringify({ theme: 'dark', contrast: 'high', density: 'compact' })
    )
    
    render(<AppearanceSettings />)
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.getAttribute('data-contrast')).toBe('high')
    expect(document.documentElement.getAttribute('data-density')).toBe('compact')
  })
})