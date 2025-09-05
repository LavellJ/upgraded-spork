import React, { useState, useMemo } from 'react'
import { useFlags } from '../../config/flags'
import TeacherLayout from '../teacher/Layout'
import { Card } from '../../ui2/Card'
import { FilterBar, SearchInput, Select, useUrlState } from '../../ui2/FilterBar'
import { DataTable, Column } from '../../ui2/DataTable'
import { Pagination } from '../../ui2/Pagination'
import { TableSkeleton } from '../../ui2/Skeleton'
import { DetailDrawer } from '../../ui2/DetailDrawer'
import { ActionBar } from '../../ui2/ActionBar'
import { StatusChip } from '../../ui2/StatusChip'
import { KV } from '../../ui2/KV'
import { MiniProgress } from '../../ui2/MiniProgress'
import { Button } from '../../ui2/Button'
import { useToast } from '../../ui2/Toast'
import { confirm } from '../../ui2/Confirm'
import { Empty } from '../../ui2/States'
import { fmtPercent } from '../../lib/fmt'
import { copy } from '../../copy'

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
  const toast = useToast()
  
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeLearner, setActiveLearner] = useState<Learner | null>(null)

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
          <div className="text-sm font-medium">{fmtPercent(learner.progress / 100)}</div>
          <MiniProgress value={learner.progress} />
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
                onRowClick={(learner) => {
                  setActiveLearner(learner)
                  setDrawerOpen(true)
                }}
                empty={
                  <Empty 
                    title="No learners found"
                    message="Try adjusting your search or filters"
                  />
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

        {/* Learner Detail Drawer */}
        <DetailDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={activeLearner?.name || 'Learner'}
          subtitle="Learner"
          footer={
            <ActionBar>
              <Button variant="subtle" onClick={() => console.log('Export CSV')}>
                {copy.actions.export}
              </Button>
              <Button 
                data-autofocus
                onClick={async () => {
                  const confirmed = await confirm({
                    title: 'Assign work?',
                    body: 'This will assign the selected items.'
                  })
                  if (confirmed) {
                    console.log('Assign work to', activeLearner?.name)
                    toast.push({ 
                      title: 'Assigned', 
                      body: '3 items assigned'
                    })
                  }
                }}
              >
                {copy.actions.assign}
              </Button>
            </ActionBar>
          }
        >
          {activeLearner && (
            <div className="space-y-6">
              {/* Overview Section */}
              <Card title="Overview">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-lg font-medium">
                      {activeLearner.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-medium">{activeLearner.name}</h3>
                      <p className="text-sm text-gray-600">{activeLearner.group}</p>
                    </div>
                  </div>
                  
                  <KV items={[
                    { k: 'Last seen', v: activeLearner.lastSeen },
                    { k: 'Streak', v: '12 days' },
                    { k: 'Progress', v: fmtPercent(activeLearner.progress / 100) }
                  ]} />
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Overall Progress</div>
                    <MiniProgress value={activeLearner.progress} />
                  </div>
                </div>
              </Card>

              {/* Assignments Section */}
              <Card title="Active Assignments">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="text-sm font-medium">Math: Fractions</span>
                    <div className="flex items-center gap-2">
                      <StatusChip kind="assigned">{copy.states.assigned}</StatusChip>
                      <span className="text-xs text-gray-500">Due in 2 days</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="text-sm font-medium">Science: Plants</span>
                    <div className="flex items-center gap-2">
                      <StatusChip kind="overdue">{copy.states.overdue}</StatusChip>
                      <span className="text-xs text-gray-500">Due 1 day ago</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Literacy: Reading</span>
                    <div className="flex items-center gap-2">
                      <StatusChip kind="due">{copy.states.due}</StatusChip>
                      <span className="text-xs text-gray-500">Due tomorrow</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Journal & Notes Section */}
              <Card title="Recent Journal">
                <div className="space-y-3">
                  <div className="border-b border-gray-200 pb-2">
                    <div className="text-xs text-gray-500 mb-1">Today, 2:30 PM</div>
                    <p className="text-sm">Completed fractions worksheet. Found decimals challenging but worked through examples.</p>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <div className="text-xs text-gray-500 mb-1">Yesterday, 11:15 AM</div>
                    <p className="text-sm">Science experiment on plant growth was engaging. Asked great questions about photosynthesis.</p>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">2 days ago, 9:45 AM</div>
                    <p className="text-sm">Reading comprehension improving. Showed good understanding of main ideas.</p>
                  </div>
                  <button className="text-sm text-blue-600 hover:underline">
                    Open full Journal →
                  </button>
                </div>
              </Card>
            </div>
          )}
        </DetailDrawer>
      </div>
    </TeacherLayout>
  )
}