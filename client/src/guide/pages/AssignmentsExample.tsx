import { useState, useMemo } from 'react'
import { useFlags } from '../../config/flags'
import TeacherLayout from '../teacher/Layout'
import { Card } from '../../ui2/Card'
import { FilterBar, SearchInput, Select, useUrlState } from '../../ui2/FilterBar'
import { DataTable, Column } from '../../ui2/DataTable'
import { Pagination } from '../../ui2/Pagination'
import { TableSkeleton } from '../../ui2/Skeleton'

type Assignment = {
  id: string
  title: string
  due: string
  status: 'assigned' | 'due-soon' | 'overdue' | 'done'
  assigned: number
  dueDate: Date
}

const mockAssignments: Assignment[] = [
  { id: '1', title: 'Math: Fractions Practice', due: 'in 2 days', status: 'assigned', assigned: 24, dueDate: new Date('2025-01-15') },
  { id: '2', title: 'Science: Plant Life Cycle', due: 'in 5 days', status: 'assigned', assigned: 18, dueDate: new Date('2025-01-18') },
  { id: '3', title: 'Literacy: Reading Comprehension', due: 'tomorrow', status: 'due-soon', assigned: 22, dueDate: new Date('2025-01-14') },
  { id: '4', title: 'Math: Addition & Subtraction', due: '2 days ago', status: 'overdue', assigned: 20, dueDate: new Date('2025-01-11') },
  { id: '5', title: 'HASS: Local Geography', due: 'completed', status: 'done', assigned: 25, dueDate: new Date('2025-01-08') },
]

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'due-soon', label: 'Due Soon' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'done', label: 'Completed' },
]

export default function AssignmentsExample(){
  const { teacherPanelV2 } = useFlags()
  
  // Fallback to legacy layout if flag disabled
  if (!teacherPanelV2) {
    return (
      <Card title="Recent assignments">
        <div className="text-center py-8 text-gray-500">
          <p>Assignments management interface will be here.</p>
          <p className="text-sm mt-2">Enable Teacher Panel v2 to see the enhanced interface.</p>
        </div>
      </Card>
    )
  }

  const [filters, setFilters] = useUrlState({ search: '', status: 'all' })
  const [sortKey, setSortKey] = useState('title')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const pageSize = 10

  const filteredAssignments = useMemo(() => {
    return mockAssignments.filter(assignment => {
      const matchesSearch = assignment.title.toLowerCase().includes(filters.search.toLowerCase())
      const matchesStatus = filters.status === 'all' || assignment.status === filters.status
      return matchesSearch && matchesStatus
    })
  }, [filters])

  const totalPages = Math.ceil(filteredAssignments.length / pageSize)
  const paginatedAssignments = filteredAssignments.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const getStatusChip = (status: Assignment['status']) => {
    const styles = {
      assigned: 'bg-blue-100 text-blue-800',
      'due-soon': 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      done: 'bg-green-100 text-green-800'
    }
    const labels = {
      assigned: 'Assigned',
      'due-soon': 'Due Soon',
      overdue: 'Overdue', 
      done: 'Done'
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const columns: Column<Assignment>[] = [
    {
      key: 'title',
      header: 'Assignment',
      width: '40%',
      render: (assignment) => (
        <div className="font-medium">{assignment.title}</div>
      ),
      sort: (a, b) => a.title.localeCompare(b.title)
    },
    {
      key: 'due',
      header: 'Due',
      width: '20%',
      render: (assignment) => (
        <span className="text-sm text-gray-600">{assignment.due}</span>
      ),
      sort: (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
    },
    {
      key: 'status',
      header: 'Status',
      width: '20%',
      render: (assignment) => getStatusChip(assignment.status),
      sort: (a, b) => a.status.localeCompare(b.status)
    },
    {
      key: 'assigned',
      header: 'Assigned',
      width: '20%',
      align: 'center',
      render: (assignment) => (
        <span className="text-sm">{assignment.assigned} learners</span>
      ),
      sort: (a, b) => a.assigned - b.assigned
    }
  ]

  return (
    <TeacherLayout title="Assignments" subtitle="Create, manage and track work">
      <div className="space-y-4">
        <FilterBar>
          <SearchInput
            value={filters.search}
            onChange={(search) => setFilters(prev => ({ ...prev, search }))}
            placeholder="Search assignments..."
            aria-label="Search assignments by title"
          />
          <Select
            label="Status"
            value={filters.status}
            onChange={(status) => setFilters(prev => ({ ...prev, status }))}
            options={statusOptions}
          />
          <div className="ml-auto flex gap-2">
            <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              + Create Assignment
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Archive Selected
            </button>
          </div>
        </FilterBar>

        <div aria-live="polite" className="sr-only">
          Showing {filteredAssignments.length} assignments
        </div>

        <Card title={`Assignments (${filteredAssignments.length})`}>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="space-y-4">
              <DataTable
                rows={paginatedAssignments}
                columns={columns}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onRowClick={(assignment) => console.log('View assignment:', assignment.title)}
                empty={
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <p className="font-medium">No assignments found</p>
                    <p className="text-sm">Create your first assignment to get started</p>
                    <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      + Create Assignment
                    </button>
                  </div>
                }
              />
              {totalPages > 1 && (
                <Pagination
                  page={page}
                  pages={totalPages}
                  onPage={setPage}
                />
              )}
            </div>
          )}
        </Card>
      </div>
    </TeacherLayout>
  )
}