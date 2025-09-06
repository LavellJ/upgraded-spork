// client/src/guide/teacher/TabContentV2.tsx
import { Suspense, useMemo } from 'react'
import { useFlags } from '@/config/flags'
import TeacherLayout from '@/guide/teacher/Layout'

// DATA tabs (content only — do NOT wrap themselves)
import Timeline from '@/guide/Timeline'
import Assignments from '@/guide/Assignments'
import ContentStudio from '@/studio/Studio'
import Roster from '@/components/RosterManagement'
import Classes from '@/guide/Classes'
import Dashboard from '@/guide/Dashboard'
import Overview from '@/guide/Overview'        // or InsightsV2 if that's your overview
import QA from '@/guide/QA'
import QuickStart from '@/guide/QuickStart'    // if you have one

// SETTINGS tabs (these pages ALREADY render TeacherLayout internally with the list UI)
import Appearance from '@/settings/Appearance'
import Privacy from '@/settings/Privacy'
import Consent from '@/settings/Consent'
import Reports from '@/guide/Reports'
import DevPanel from '@/guide/dev/DevPanel'
import Audit from '@/guide/Audit'
import Pilot from '@/guide/Pilot'
import Funnel from '@/guide/Funnel'

type Props = { tab: string }

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  overview:   { title: 'Overview',   subtitle: 'Today at a glance' },
  quickstart: { title: 'Quick start',subtitle: 'Fast setup' },
  timeline:   { title: 'Timeline',   subtitle: 'Recent activity & notes' },
  assignments:{ title: 'Assignments',subtitle: 'Create, manage and track' },
  content:    { title: 'Content',    subtitle: 'Packs & authoring' },
  roster:     { title: 'Learners',   subtitle: 'Students & groups' },
  classes:    { title: 'Classes',    subtitle: 'Manage class lists' },
  dashboard:  { title: 'Dashboard',  subtitle: 'Key metrics' },
  studio:     { title: 'Studio',     subtitle: 'Authoring tools' },
  qa:         { title: 'QA',         subtitle: 'Checks & experiments' },
}

const SETTINGS_TABS = new Set([
  'appearance','privacy','consent','reports','dev','audit','pilot','funnel'
])

export default function TabContentV2({ tab }: Props) {
  const { teacherPanelV2 } = useFlags()
  const t = (tab || 'overview').toLowerCase()

  // Old panel (pre-TP6): preserve legacy behavior if flag off
  if (!teacherPanelV2) return <LegacyGuideRouter tab={t} />

  const dataBody = (() => {
    switch (t) {
      case 'overview':   return <Overview />
      case 'quickstart': return <QuickStart />
      case 'timeline':   return <Timeline />
      case 'assignments':return <Assignments />
      case 'content':    return <ContentStudio />
      case 'roster':     return <Roster />
      case 'classes':    return <Classes />
      case 'dashboard':  return <Dashboard />
      case 'studio':     return <ContentStudio />
      case 'qa':         return <QA />
      default:           return <Overview />
    }
  })()

  const settingsPage = (() => {
    switch (t) {
      case 'appearance': return <Appearance />
      case 'privacy':    return <Privacy />
      case 'consent':    return <Consent />
      case 'reports':    return <Reports />
      case 'dev':        return <DevPanel />
      case 'audit':      return <Audit />
      case 'pilot':      return <Pilot />
      case 'funnel':     return <Funnel />
      default:           return null
    }
  })()

  // Settings tabs already render their own TeacherLayout (list UI)
  if (SETTINGS_TABS.has(t)) {
    return <Suspense fallback={<div className="p-6">Loading…</div>}>{settingsPage}</Suspense>
  }

  // All other tabs get the shell here (once!)
  const meta = TITLES[t] ?? { title: 'Guide' }
  return (
    <TeacherLayout title={meta.title} subtitle={meta.subtitle}>
      <Suspense fallback={<div className="p-6">Loading…</div>}>
        {dataBody}
      </Suspense>
    </TeacherLayout>
  )
}

// Keep whatever you had before for legacy fallback.
function LegacyGuideRouter({ tab }: { tab: string }) {
  // ... your pre-TP shells
  return <Overview />
}