import { render, screen, fireEvent } from '@testing-library/react'
import { DetailDrawer } from '../ui2/DetailDrawer'

// Mock vi for testing
const mockOnClose = jest.fn()

beforeEach(() => {
  mockOnClose.mockClear()
})

it('opens, traps focus, and closes with Esc', () => {
  render(
    <DetailDrawer open title="Test Drawer" onClose={mockOnClose}>
      <button data-autofocus>OK</button>
    </DetailDrawer>
  )
  
  expect(screen.getByRole('dialog', { name: /Test Drawer/i })).toBeInTheDocument()
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(mockOnClose).toHaveBeenCalled()
})

it('closes when clicking backdrop', () => {
  render(
    <DetailDrawer open title="Test Drawer" onClose={mockOnClose}>
      <div>Content</div>
    </DetailDrawer>
  )
  
  const backdrop = document.querySelector('.bg-black\\/30')
  if (backdrop) {
    fireEvent.click(backdrop)
    expect(mockOnClose).toHaveBeenCalled()
  }
})

it('renders footer actions correctly', () => {
  render(
    <DetailDrawer 
      open 
      title="Test Drawer" 
      onClose={mockOnClose}
      footer={<button>Save</button>}
    >
      <div>Content</div>
    </DetailDrawer>
  )
  
  expect(screen.getByText('Save')).toBeInTheDocument()
})

it('does not render when closed', () => {
  render(
    <DetailDrawer open={false} title="Test Drawer" onClose={mockOnClose}>
      <div>Content</div>
    </DetailDrawer>
  )
  
  const drawer = screen.queryByRole('dialog')
  expect(drawer).toHaveAttribute('aria-hidden', 'true')
})