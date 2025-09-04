import React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Card, CardHeader, CardTitle, CardContent } from '../src/components/ui/card'
import { Table, THead, TBody, TH, TD, TR } from '../src/components/ui/table'  
import { Toolbar } from '../src/components/ui/toolbar'

describe('UI Kit Components', () => {
  beforeEach(() => {
    // Reset document attributes
    document.documentElement.removeAttribute('data-density')
  })
  
  afterEach(() => {
    document.documentElement.removeAttribute('data-density')
  })

  it('renders Card with proper structure and classes', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
        <CardContent>Test content</CardContent>
      </Card>
    )
    
    const card = screen.getByTestId('card')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('card')
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders Table with accessibility attributes', () => {
    render(
      <Table>
        <THead>
          <TR>
            <TH>Header 1</TH>
            <TH>Header 2</TH>
          </TR>
        </THead>
        <TBody>
          <TR>
            <TD>Cell 1</TD>
            <TD>Cell 2</TD>
          </TR>
        </TBody>
      </Table>
    )
    
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
    
    // Check for proper table structure
    expect(screen.getByText('Header 1')).toBeInTheDocument()
    expect(screen.getByText('Header 2')).toBeInTheDocument()
    expect(screen.getByText('Cell 1')).toBeInTheDocument()
    expect(screen.getByText('Cell 2')).toBeInTheDocument()
    
    // Check TH has scope attribute
    const headers = screen.getAllByRole('columnheader')
    headers.forEach(header => {
      expect(header).toHaveAttribute('scope', 'col')
    })
  })

  it('renders Toolbar with left and right content', () => {
    const leftContent = <div data-testid="left">Filters</div>
    const rightContent = <div data-testid="right">Actions</div>
    
    render(<Toolbar left={leftContent} right={rightContent} />)
    
    expect(screen.getByTestId('left')).toBeInTheDocument()
    expect(screen.getByTestId('right')).toBeInTheDocument()
  })

  it('applies compact density classes when data-density="compact" is set', () => {
    // Set compact density on document
    document.documentElement.setAttribute('data-density', 'compact')
    
    render(
      <Card>
        <CardContent data-testid="card-content">
          <Table>
            <THead>
              <TR>
                <TH data-testid="table-header">Header</TH>
              </TR>
            </THead>
            <TBody>
              <TR>
                <TD data-testid="table-cell">Cell</TD>
              </TR>
            </TBody>
          </Table>
        </CardContent>
      </Card>
    )
    
    // Card content should have compact density classes
    const cardContent = screen.getByTestId('card-content')
    expect(cardContent).toHaveAttribute('data-density', 'compact')
    
    // Table elements should use CSS calc with density variable
    const header = screen.getByTestId('table-header')
    const cell = screen.getByTestId('table-cell')
    
    // These elements should have the density-aware padding classes
    expect(header).toHaveClass('py-[calc(12px*var(--density))]')
    expect(cell).toHaveClass('py-[calc(12px*var(--density))]')
  })

  it('maintains proper spacing in comfy mode (default)', () => {
    render(
      <Table>
        <THead>
          <TR>
            <TH data-testid="table-header">Header</TH>
          </TR>
        </THead>
        <TBody>
          <TR>
            <TD data-testid="table-cell">Cell</TD>
          </TR>
        </TBody>
      </Table>
    )
    
    // Should still use calc-based spacing
    const header = screen.getByTestId('table-header')
    const cell = screen.getByTestId('table-cell')
    
    expect(header).toHaveClass('py-[calc(12px*var(--density))]')
    expect(cell).toHaveClass('py-[calc(12px*var(--density))]')
  })
})