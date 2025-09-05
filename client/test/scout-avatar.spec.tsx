import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import ScoutAvatar from '../src/learning/ScoutAvatar'
import { Flags } from '../src/config/flags'

describe('ScoutAvatar', () => {
  beforeEach(() => {
    // Clear flags before each test
    localStorage.removeItem('qi.flags.v1')
  })

  afterEach(() => {
    localStorage.removeItem('qi.flags.v1')
  })

  it('renders emoji fallback when finalArt flag is false', () => {
    Flags.set({ finalArt: false })
    
    render(<ScoutAvatar size={48} alt="Scout" />)
    
    const fallback = screen.getByLabelText('Scout')
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveTextContent('🧭')
  })

  it('renders art image when finalArt flag is true', () => {
    Flags.set({ finalArt: true })
    
    render(<ScoutAvatar size={48} alt="Scout" />)
    
    const image = screen.getByRole('img', { name: 'Scout' })
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/art/scout/scout-neutral.webp')
    expect(image).toHaveClass('art-shadow', 'rounded-xl', 'select-none')
  })

  it('applies correct size prop', () => {
    Flags.set({ finalArt: true })
    
    render(<ScoutAvatar size={64} alt="Scout" />)
    
    const image = screen.getByRole('img', { name: 'Scout' })
    expect(image).toHaveAttribute('width', '64')
    expect(image).toHaveAttribute('height', '64')
  })

  it('uses default props when not provided', () => {
    Flags.set({ finalArt: false })
    
    render(<ScoutAvatar />)
    
    const fallback = screen.getByLabelText('Scout')
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveStyle({ width: '48px', height: '48px' })
  })
})