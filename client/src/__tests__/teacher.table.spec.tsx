import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable } from '../ui2/DataTable'
import { DensityProvider } from '../guide/teacher/density'

type Row = { id:string; name:string; score:number }
const rows: Row[] = [
  { id:'1', name:'Ada', score:80 },
  { id:'2', name:'Ben', score:60 }
]

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <DensityProvider>{children}</DensityProvider>
}

it('sorts by column when header clicked', () => {
  let sortKey = 'name', sortDir:'asc'|'desc' = 'asc'
  const mockOnSort = jest.fn((k) => { 
    sortKey = k; 
    sortDir = sortDir === 'asc' ? 'desc' : 'asc' 
  })
  
  render(
    <TestWrapper>
      <DataTable<Row>
        rows={rows}
        columns={[
          { key:'name', header:'Name', sort:(a,b)=>a.name.localeCompare(b.name) },
          { key:'score', header:'Score', sort:(a,b)=>a.score-b.score, align:'right' }
        ]}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={mockOnSort}
      />
    </TestWrapper>
  )
  
  fireEvent.click(screen.getByRole('button', { name:/Sort by Name/i }))
  expect(mockOnSort).toHaveBeenCalledWith('name')
  expect(screen.getByText('Name')).toBeInTheDocument()
})

it('renders empty state when no rows', () => {
  render(
    <TestWrapper>
      <DataTable<Row>
        rows={[]}
        columns={[
          { key:'name', header:'Name' },
          { key:'score', header:'Score' }
        ]}
        empty={<div>No data found</div>}
      />
    </TestWrapper>
  )
  
  expect(screen.getByText('No data found')).toBeInTheDocument()
})

it('handles row clicks', () => {
  const mockOnRowClick = jest.fn()
  
  render(
    <TestWrapper>
      <DataTable<Row>
        rows={rows}
        columns={[
          { key:'name', header:'Name' },
          { key:'score', header:'Score' }
        ]}
        onRowClick={mockOnRowClick}
      />
    </TestWrapper>
  )
  
  fireEvent.click(screen.getByText('Ada'))
  expect(mockOnRowClick).toHaveBeenCalledWith(rows[0])
})