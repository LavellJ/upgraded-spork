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

  it('displays checkmark for done state', () => {
    render(<Pin state="done" ariaLabel="Completed task" />)
    
    // Check that done state has the checkmark path
    const button = screen.getByRole('button', { name: 'Completed task' })
    const svg = button.querySelector('svg')
    const checkPath = svg?.querySelector('path[d="M7 12.5l3 3 7-7"]')
    expect(checkPath).toBeInTheDocument()
  })

  it('displays notification dot for assigned state', () => {
    render(<Pin state="assigned" ariaLabel="Assigned task" />)
    
    const button = screen.getByRole('button', { name: 'Assigned task' })
    const svg = button.querySelector('svg')
    const notificationCircle = svg?.querySelector('circle[cx="17"][cy="17"]')
    expect(notificationCircle).toBeInTheDocument()
  })

  it('displays exclamation for overdue state', () => {
    render(<Pin state="overdue" ariaLabel="Overdue task" />)
    
    const button = screen.getByRole('button', { name: 'Overdue task' })
    const svg = button.querySelector('svg')
    const exclamationText = svg?.querySelector('text')
    expect(exclamationText).toHaveTextContent('!')
  })

  it('displays lock icon for locked state', () => {
    render(<Pin state="locked" ariaLabel="Locked task" />)
    
    const button = screen.getByRole('button', { name: 'Locked task' })
    const svg = button.querySelector('svg')
    const lockCircle = svg?.querySelector('circle[cx="12"][cy="12"]')
    expect(lockCircle).toBeInTheDocument()
  })
})