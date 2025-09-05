import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '../src/ui2/Button'

describe('Button component', () => {
  it('renders all variants without errors', () => {
    const variants = ['primary', 'secondary', 'subtle', 'danger'] as const
    
    variants.forEach(variant => {
      render(<Button variant={variant}>Test {variant}</Button>)
      expect(screen.getByText(`Test ${variant}`)).toBeInTheDocument()
    })
  })

  it('renders all sizes without errors', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    
    sizes.forEach(size => {
      render(<Button size={size}>Test {size}</Button>)
      expect(screen.getByText(`Test ${size}`)).toBeInTheDocument()
    })
  })

  it('handles disabled state correctly', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByText('Disabled Button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })

  it('renders with icons', () => {
    render(
      <Button iconLeft={<span data-testid="left-icon">←</span>} iconRight={<span data-testid="right-icon">→</span>}>
        With Icons
      </Button>
    )
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    expect(screen.getByText('With Icons')).toBeInTheDocument()
  })
})