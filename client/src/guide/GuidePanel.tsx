import React, { lazy, Suspense, useState } from 'react'
import GuideShell from './layout/GuideShell'
import PageHeader from './layout/PageHeader'
import SubTabs, { type TabItem } from './layout/SubTabs'
import { useFlags } from '../config/flags'
import { TeacherLayoutV2 } from './teacher/TeacherLayoutV2'
import TabContentV2 from './teacher/TabContentV2'

const Insights = lazy(() => import('./InsightsCard').then(m => ({ default: m.InsightsCard })))
const Reports = lazy(() => import('./reports/Reports').then(m => ({ default: m.Reports })))
const Assign = lazy(() => import('./AssignmentsManager').then(m => ({ default: m.AssignmentsManager })))
const Learners = lazy(() => import('../components/RosterManagement').then(m => ({ default: m.RosterManagement })))
const Classes = lazy(() => import('./Classes').then(m => ({ default: m.Classes })))
const ReferralsPageLazy = lazy(() => import('../pages/ReferralsPage').then(m => ({ default: m.ReferralsPage })))
const Settings = lazy(() => import('../settings/Appearance'))

const TABS: TabItem[] = [
  { id: 'insights', label: 'Insights' },
  { id: 'reports', label: 'Reports' },
  { id: 'assign', label: 'Assignments' },
  { id: 'learners', label: 'Learners' },
  { id: 'classes', label: 'Classes' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'settings', label: 'Settings' },
]

export default function GuidePanel() {
  const [tab, setTab] = useState<string>('insights')
  const { teacherPanelV2 } = useFlags()

  // Use new TeacherLayoutV2 when flag is enabled
  if (teacherPanelV2) {
    return (
      <TeacherLayoutV2
        activeTab={tab}
        onTabChange={setTab}
        onClose={() => {
          // Handle close - could navigate back or hide panel
          window.history.back()
        }}
        renderContent={() => <TabContentV2 tab={tab} />}
      />
    )
  }

  // Legacy layout when flag is disabled
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
          tab === 'classes' ? 'Classes' :
          tab === 'referrals' ? 'Referrals' : 'Settings'
        }
        subtitle={
          tab === 'reports' ? 'Analytics and growth metrics' :
          tab === 'assign' ? 'Manage due dates and paths' :
          tab === 'classes' ? 'Rosters, codes, and projector presets' :
          tab === 'insights' ? 'Signals at a glance' :
          tab === 'referrals' ? 'Manage referral links and invitations' : undefined
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
          {tab === 'referrals' && <ReferralsPageLazy />}
          {tab === 'settings' && <Settings />}
        </Suspense>
      </div>
    </GuideShell>
  )
}