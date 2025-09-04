import React, { lazy, Suspense, useState } from 'react'
import GuideShell from './layout/GuideShell'
import PageHeader from './layout/PageHeader'
import SubTabs, { type TabItem } from './layout/SubTabs'

const Insights = lazy(() => import('./InsightsCard').then(m => ({ default: m.InsightsCard })))
const Reports = lazy(() => import('./reports/Trends').then(m => ({ default: m.Trends })))
const Assign = lazy(() => import('./AssignmentsManager').then(m => ({ default: m.AssignmentsManager })))
const Learners = lazy(() => import('../components/RosterManagement').then(m => ({ default: m.RosterManagement })))
const Classes = lazy(() => import('./Classes').then(m => ({ default: m.Classes })))
const Settings = lazy(() => import('../settings/Appearance'))

const TABS: TabItem[] = [
  { id: 'insights', label: 'Insights' },
  { id: 'reports', label: 'Reports' },
  { id: 'assign', label: 'Assignments' },
  { id: 'learners', label: 'Learners' },
  { id: 'classes', label: 'Classes' },
  { id: 'settings', label: 'Settings' },
]

export default function GuidePanel() {
  const [tab, setTab] = useState<string>('insights')

  return (
    <GuideShell topbar={<div className="flex items-center gap-3">
      <img src="/brand/logo.png" alt="" className="h-6 w-6 rounded-md" />
      <span className="font-semibold">Quest Island — Guide</span>
    </div>}>
      <PageHeader
        title={
          tab === 'insights' ? 'Insights' :
          tab === 'reports' ? 'Trends' :
          tab === 'assign' ? 'Assignments' :
          tab === 'learners' ? 'Learners' :
          tab === 'classes' ? 'Classes' : 'Settings'
        }
        subtitle={
          tab === 'reports' ? 'Multi-week class performance' :
          tab === 'assign' ? 'Manage due dates and paths' :
          tab === 'classes' ? 'Rosters, codes, and projector presets' :
          tab === 'insights' ? 'Signals at a glance' : undefined
        }
      />
      <SubTabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="mt-4">
        <Suspense fallback={<div className="card p-4 subtle">Loading…</div>}>
          {tab === 'insights' && <Insights timeRange={30} />}
          {tab === 'reports' && <Reports />}
          {tab === 'assign' && <Assign />}
          {tab === 'learners' && <Learners />}
          {tab === 'classes' && <Classes />}
          {tab === 'settings' && <Settings />}
        </Suspense>
      </div>
    </GuideShell>
  )
}