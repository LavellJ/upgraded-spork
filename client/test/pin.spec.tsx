import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Pin, type PinState } from '../src/ui/Pin'

describe('Pin Component', () => {
  const states: PinState[] = ['base', 'next', 'assigned', 'due', 'overdue', 'done', 'locked']

  states.forEach(state => {
    it(`renders ${state} state correctly`, () => {
      render(<Pin state={state} ariaLabel={`${state} pin`} />)
      
      const button = screen.getByRole('button', { name: `${state} pin` })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('data-testid', `pin-${state}`)
    })
  })

  it('renders with correct size', () => {
    render(<Pin size={48} ariaLabel="Large pin" />)
    
    const button = screen.getByRole('button', { name: 'Large pin' })
    expect(button).toHaveStyle({ width: '48px', height: '48px' })
  })

  it('shows outline when selected', () => {
    render(<Pin selected={true} ariaLabel="Selected pin" />)
    
    const button = screen.getByRole('button', { name: 'Selected pin' })
    expect(button).toHaveClass('outline', 'outline-2')
  })

  it('renders without aria-label when not provided', () => {
    render(<Pin state="base" />)
    
    const button = screen.getByTestId('pin-base')
    expect(button).toBeInTheDocument()
    expect(button).not.toHaveAttribute('aria-label')
  })

  it('applies default size when not specified', () => {
    render(<Pin ariaLabel="Default size pin" />)
    
    const button = screen.getByRole('button', { name: 'Default size pin' })
    expect(button).toHaveStyle({ width: '24px', height: '24px' })
  })

  it('renders SVG with correct viewBox', () => {
    render(<Pin state="done" ariaLabel="Done pin" />)
    
    const svg = screen.getByRole('button').querySelector('svg')
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('displays overlay icons for appropriate states', () => {
    // Test that overlay icons are rendered for states that have them
    render(<Pin state="done" ariaLabel="Completed task" />)
    
    const doneButton = screen.getByRole('button', { name: 'Completed task' })
    const svg = doneButton.querySelector('svg')
    expect(svg).toBeInTheDocument()
    
    // Check that the checkmark path exists for done state
    const checkPath = svg?.querySelector('path[d*="M6 12.5l3.2 3.2L18 7.9"]')
    expect(checkPath).toBeInTheDocument()
  })

  it('renders without overlay icons for base states', () => {
    render(<Pin state="base" ariaLabel="Base task" />)
    
    const button = screen.getByRole('button', { name: 'Base task' })
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
    
    // Base state should only have the teardrop path, no overlay icons
    const tearDropPath = svg?.querySelector('path[d*="M12 2c-4 0-7 3.1-7 7"]')
    expect(tearDropPath).toBeInTheDocument()
    
    // Should not have any overlay icon paths
    const overlayPaths = svg?.querySelectorAll('path:not([d*="M12 2c-4 0-7 3.1-7 7"])')
    expect(overlayPaths?.length).toBe(0)
  })

  it('applies hover and focus styles', () => {
    render(<Pin state="next" ariaLabel="Next task" />)
    
    const button = screen.getByRole('button', { name: 'Next task' })
    expect(button).toHaveClass('transition-transform', 'hover:-translate-y-px')
  })

  it('renders proper SVG structure', () => {
    render(<Pin state="assigned" ariaLabel="Assigned task" />)
    
    const button = screen.getByRole('button', { name: 'Assigned task' })
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
    
    // Check that the SVG has proper attributes
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    
    // Check for dot overlay in assigned state
    const dotCircle = svg?.querySelector('circle[r="4"]')
    expect(dotCircle).toBeInTheDocument()
  })
})