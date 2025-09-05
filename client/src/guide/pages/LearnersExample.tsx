import { useState, useMemo } from 'react'
import { useFlags } from '../../config/flags'
import TeacherLayout from '../teacher/Layout'
import { Card } from '../../ui2/Card'
import { FilterBar, SearchInput, Select, useUrlState } from '../../ui2/FilterBar'
import { DataTable, Column } from '../../ui2/DataTable'
import { Pagination } from '../../ui2/Pagination'
import { TableSkeleton } from '../../ui2/Skeleton'

type Learner = {
  id: string
  name: string
  progress: number
  lastSeen: string
  due: number
  overdue: number
  group: string
}

const mockLearners: Learner[] = [
  { id: '1', name: 'Emma Thompson', progress: 82, lastSeen: '2 hours ago', due: 2, overdue: 0, group: 'Grade 2A' },
  { id: '2', name: 'Jack Wilson', progress: 67, lastSeen: '1 day ago', due: 3, overdue: 1, group: 'Grade 2A' },
  { id: '3', name: 'Sophie Chen', progress: 94, lastSeen: '30 minutes ago', due: 1, overdue: 0, group: 'Grade 2B' },
  { id: '4', name: 'Oliver Brown', progress: 45, lastSeen: '3 days ago', due: 4, overdue: 2, group: 'Grade 2B' },
  { id: '5', name: 'Maya Patel', progress: 78, lastSeen: '5 hours ago', due: 2, overdue: 0, group: 'Grade 2A' },
]

export default function LearnersExample(){
  const { teacherPanelV2 } = useFlags()
  
  // Fallback to legacy layout if flag disabled
  if (!teacherPanelV2) {
    return (
      <Card title="All learners">
        <div className="text-center py-8 text-gray-500">
          <p>Learners management interface will be here.</p>
          <p className="text-sm mt-2">Enable Teacher Panel v2 to see the enhanced interface.</p>
        </div>
      </Card>
    )
  }

  const [filters, setFilters] = useUrlState({ search: '', group: 'all' })
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const pageSize = 10

  const groupOptions = [
    { value: 'all', label: 'All Groups' },
    { value: 'Grade 2A', label: 'Grade 2A' },
    { value: 'Grade 2B', label: 'Grade 2B' },
  ]

  const filteredLearners = useMemo(() => {
    return mockLearners.filter(learner => {
      const matchesSearch = learner.name.toLowerCase().includes(filters.search.toLowerCase())
      const matchesGroup = filters.group === 'all' || learner.group === filters.group
      return matchesSearch && matchesGroup
    })
  }, [filters])

  const totalPages = Math.ceil(filteredLearners.length / pageSize)
  const paginatedLearners = filteredLearners.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const columns: Column<Learner>[] = [
    {
      key: 'name',
      header: 'Name',
      width: '30%',
      render: (learner) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
            {learner.name.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="font-medium">{learner.name}</span>
        </div>
      ),
      sort: (a, b) => a.name.localeCompare(b.name)
    },
    {
      key: 'progress',
      header: 'Progress',
      width: '25%',
      render: (learner) => (
        <div className="space-y-1">
          <div className="text-sm font-medium">{learner.progress}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${learner.progress}%` }}
            />
          </div>
        </div>
      ),
      sort: (a, b) => a.progress - b.progress
    },
    {
      key: 'lastSeen',
      header: 'Last Seen',
      width: '20%',
      sort: (a, b) => a.lastSeen.localeCompare(b.lastSeen)
    },
    {
      key: 'due',
      header: 'Due/Overdue',
      width: '25%',
      align: 'center',
      render: (learner) => (
        <div className="flex items-center justify-center gap-2">
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
            {learner.due} due
          </span>
          {learner.overdue > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
              {learner.overdue} overdue
            </span>
          )}
        </div>
      ),
      sort: (a, b) => (a.due + a.overdue) - (b.due + b.overdue)
    }
  ]

  return (
    <TeacherLayout title="Learners" subtitle="Manage students, groups and assignments">
      <div className="space-y-4">
        <FilterBar>
          <SearchInput
            value={filters.search}
            onChange={(search) => setFilters(prev => ({ ...prev, search }))}
            placeholder="Search learners..."
            aria-label="Search learners by name"
          />
          <Select
            label="Group"
            value={filters.group}
            onChange={(group) => setFilters(prev => ({ ...prev, group }))}
            options={groupOptions}
          />
        </FilterBar>

        <div aria-live="polite" className="sr-only">
          Showing {filteredLearners.length} learners
        </div>

        <Card title={`Learners (${filteredLearners.length})`}>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="space-y-4">
              <DataTable
                rows={paginatedLearners}
                columns={columns}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onRowClick={(learner) => console.log('View learner:', learner.name)}
                empty={
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">👥</div>
                    <p className="font-medium">No learners found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
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