import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import GuidePanel from '../src/guide/GuidePanel'

describe('GuideShell Layout', () => {
  it('renders with role="tablist" and aria-selected tab', () => {
    render(<GuidePanel />)
    
    // Check for tablist role
    const tablist = screen.getByRole('tablist')
    expect(tablist).toBeInTheDocument()
    
    // Check that exactly one tab has aria-selected="true"
    const selectedTabs = screen.getAllByRole('tab').filter(tab => 
      tab.getAttribute('aria-selected') === 'true'
    )
    expect(selectedTabs).toHaveLength(1)
    
    // Check for single h1 element (page title)
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveClass('page-title')
  })

  it('updates title and content when tab changes', () => {
    render(<GuidePanel />)
    
    // Initial state should show 'Insights' title
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Insights')
    
    // Click on 'Reports' tab
    const reportsTab = screen.getByRole('tab', { name: /reports/i })
    reportsTab.click()
    
    // Title should update to 'Trends'
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Trends')
    
    // Reports tab should now be selected
    expect(reportsTab).toHaveAttribute('aria-selected', 'true')
  })

  it('supports keyboard navigation', () => {
    render(<GuidePanel />)
    
    const firstTab = screen.getAllByRole('tab')[0]
    const secondTab = screen.getAllByRole('tab')[1]
    
    // Focus first tab and press right arrow
    firstTab.focus()
    firstTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    
    // Second tab should become selected
    expect(secondTab).toHaveAttribute('aria-selected', 'true')
  })
})