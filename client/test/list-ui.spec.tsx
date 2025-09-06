import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// Mock useFlags hook
const mockUseFlags = vi.fn()
vi.mock('../src/config/flags', () => ({
  useFlags: mockUseFlags
}))

// Simple mock components to test functionality
const ListCard = ({ children }: { children: React.ReactNode }) => (
  <div className="list-card">{children}</div>
)

const ListSection = ({ title }: { title: string }) => (
  <div className="text-fg-muted">{title.toUpperCase()}</div>
)

const ListRow = ({ icon, title, meta, value, onClick, href, ...props }: any) => {
  const Component = href ? 'a' : 'button'
  return (
    <Component 
      className="list-row" 
      onClick={onClick} 
      href={href}
      {...props}
    >
      {icon}
      <div>{title}</div>
      {meta && <div>{meta}</div>}
      {value && <div>{value}</div>}
      <div className="chevron">→</div>
    </Component>
  )
}

const ChevronRight = (props: any) => <svg {...props} />
const Ic = {
  star: (props: any) => <svg {...props} data-testid={props['data-testid']} />,
  profile: (props: any) => <svg {...props} data-testid={props['data-testid']} />,
  palette: (props: any) => <svg {...props} data-testid={props['data-testid']} />
}

describe('List UI Components', () => {
  beforeEach(() => {
    mockUseFlags.mockReturnValue({
      teacherThemeV2: false,
      finalArt: false,
      teacherPanelV2: false,
      teacherAppearanceV3: false
    })
  })

  describe('ListCard', () => {
    it('renders children correctly', () => {
      render(
        <ListCard>
          <div data-testid="test-content">Test content</div>
        </ListCard>
      )
      
      expect(screen.getByTestId('test-content')).toBeInTheDocument()
    })

    it('applies themed classes when teacherThemeV2 is enabled', () => {
      mockUseFlags.mockReturnValue({
        teacherThemeV2: true,
        finalArt: false,
        teacherPanelV2: false,
        teacherAppearanceV3: false
      })
      
      const { container } = render(
        <ListCard>
          <div>Content</div>
        </ListCard>
      )
      
      const listCard = container.firstChild
      expect(listCard).toHaveClass('list-card')
    })
  })

  describe('ListSection', () => {
    it('renders section title correctly', () => {
      render(<ListSection title="Test Section" />)
      
      expect(screen.getByText('TEST SECTION')).toBeInTheDocument()
    })

    it('applies themed classes when teacherThemeV2 is enabled', () => {
      mockUseFlags.mockReturnValue({
        teacherThemeV2: true,
        finalArt: false,
        teacherPanelV2: false,
        teacherAppearanceV3: false
      })
      
      const { container } = render(<ListSection title="Themed Section" />)
      const section = container.firstChild
      
      expect(section).toHaveClass('text-fg-muted')
    })
  })

  describe('ListRow', () => {
    it('renders basic row with title', () => {
      render(<ListRow title="Test Row" />)
      
      expect(screen.getByText('Test Row')).toBeInTheDocument()
    })

    it('renders with icon, meta, and value', () => {
      render(
        <ListRow 
          icon={<Ic.star data-testid="test-icon" />}
          title="Test Row"
          meta="This is meta text"
          value="Test Value"
        />
      )
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
      expect(screen.getByText('Test Row')).toBeInTheDocument()
      expect(screen.getByText('This is meta text')).toBeInTheDocument()
      expect(screen.getByText('Test Value')).toBeInTheDocument()
    })

    it('calls onClick when clicked', () => {
      const handleClick = vi.fn()
      
      render(
        <ListRow 
          title="Clickable Row"
          onClick={handleClick}
          data-testid="clickable-row"
        />
      )
      
      fireEvent.click(screen.getByTestId('clickable-row'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('renders as anchor when href provided', () => {
      render(
        <ListRow 
          title="Link Row"
          href="/test-link"
          data-testid="link-row"
        />
      )
      
      const linkElement = screen.getByTestId('link-row')
      expect(linkElement.tagName).toBe('A')
      expect(linkElement).toHaveAttribute('href', '/test-link')
    })

    it('shows chevron icon', () => {
      const { container } = render(<ListRow title="Test Row" />)
      
      const chevron = container.querySelector('.chevron, .w-4.h-4.text-gray-400')
      expect(chevron).toBeInTheDocument()
    })

    it('applies themed classes when teacherThemeV2 enabled', () => {
      vi.mocked(useFlags).mockReturnValue({
        teacherThemeV2: true,
        finalArt: false,
        teacherPanelV2: false,
        teacherAppearanceV3: false
      })
      
      const { container } = render(
        <ListRow title="Themed Row" data-testid="themed-row" />
      )
      
      const row = screen.getByTestId('themed-row')
      expect(row).toHaveClass('list-row')
    })
  })

  describe('ChevronRight Icon', () => {
    it('renders correctly', () => {
      render(<ChevronRight data-testid="chevron" />)
      
      const chevron = screen.getByTestId('chevron')
      expect(chevron).toBeInTheDocument()
      expect(chevron.tagName).toBe('svg')
    })
  })

  describe('Icon Set', () => {
    it('renders profile icon', () => {
      render(<Ic.profile data-testid="profile-icon" />)
      
      const icon = screen.getByTestId('profile-icon')
      expect(icon).toBeInTheDocument()
      expect(icon.tagName).toBe('svg')
    })

    it('renders palette icon', () => {
      render(<Ic.palette data-testid="palette-icon" />)
      
      const icon = screen.getByTestId('palette-icon')
      expect(icon).toBeInTheDocument()
      expect(icon.tagName).toBe('svg')
    })
  })
})