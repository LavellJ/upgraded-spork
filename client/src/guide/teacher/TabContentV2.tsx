import React, { Suspense } from 'react'

// Import main panels that exist in the codebase
import { Timeline } from '../Timeline'                             // from guide/Timeline.tsx
import { AssignmentsManager } from '../AssignmentsManager'          // from guide/AssignmentsManager.tsx  
import { ContentStudio } from '../../authoring/Studio'              // from authoring/Studio.tsx
import { RosterManagement } from '../../components/RosterManagement' // from components/RosterManagement.tsx
import { Classes } from '../Classes'                                // from guide/Classes.tsx
import Privacy from '../../settings/Privacy'                       // from settings/Privacy.tsx
import Appearance from '../../settings/Appearance'                  // from settings/Appearance.tsx
import { InsightsCard } from '../InsightsCard'                      // from guide/InsightsCard.tsx
import { Reports } from '../reports/Reports'                        // from guide/reports/Reports.tsx

// Import missing components for complete coverage
import { QuickStart } from '../../teacher/QuickStart'               // from teacher/QuickStart.tsx
import { AuditViewerV3 } from '../dev/AuditViewerV3'               // from guide/dev/AuditViewerV3.tsx
import Consent from '../../settings/Consent'                        // from settings/Consent.tsx
import { FunnelViewerV3 } from '../../debug/FunnelViewerV3'          // from debug/FunnelViewerV3.tsx
import { QAPanel } from '../../components/QAPanel'                  // from components/QAPanel.tsx

// Import UI components for list style
import { SimpleLayout } from '../../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../../ui2/List'
import { Ic } from '../../ui2/icons'

// Import pilot V3 component
import { PilotV3 } from '../pilot/PilotV3'                           // from guide/pilot/PilotV3.tsx

// Import dev tools
import { TriageBoard } from '../dev/TriageBoard'                     // from guide/dev/TriageBoard.tsx
import PinGallery from '../dev/PinGallery'                          // from guide/dev/PinGallery.tsx
import ScoutGallery from '../dev/ScoutGallery'                      // from guide/dev/ScoutGallery.tsx
import ArtDiagnostics from '../dev/ArtDiagnostics'                  // from guide/dev/ArtDiagnostics.tsx
import { ThemeSelector } from '../dev/ThemeSelector'                 // from guide/dev/ThemeSelector.tsx
import DevPanel from '../dev/DevPanel'                               // from guide/dev/DevPanel.tsx

// Providers your panels expect (so nothing is "empty"):
import { RosterProvider } from '../../roster/context'
import { GuideNoticeProvider } from '../notices'
import { ToastProvider } from '../../components/ui/toast'

type Props = { tab: string }

function Missing({ name }: { name: string }) {
  return (
    <div className="p-6 text-sm text-gray-600">
      <b>{name}</b> panel not found. Check the import path or temporarily map it to another panel.
    </div>
  )
}

// List-style components for tabs that need updating
function TimelineList() {
  return (
    <SimpleLayout title="Timeline" subtitle="Learning activity and progress">
      <ListSection title="View Options" />
      <ListCard>
        <ListRow 
          icon={<Ic.calendar className="list-icon" />} 
          title="Time Range"
          meta="Show last 30 days"
          value="30d"
          onClick={() => console.log('Change time range')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.filter className="list-icon" />} 
          title="Event Filter"
          meta="Filter by all events"
          value="all"
          onClick={() => console.log('Change filter')}
        />
      </ListCard>
      
      <ListSection title="Recent Activity" />
      <ListCard>
        <ListRow 
          icon={<Ic.book className="list-icon" />} 
          title="Lesson Events"
          meta="View completed lessons and progress"
          onClick={() => console.log('View lesson events')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.profile className="list-icon" />} 
          title="Journal Entries"
          meta="Student reflection and writing"
          onClick={() => console.log('View journal entries')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.star className="list-icon" />} 
          title="Scout Interactions"
          meta="AI tutor interventions and help"
          onClick={() => console.log('View scout activity')}
        />
      </ListCard>
    </SimpleLayout>
  );
}

function ContentStudioList() {
  return (
    <SimpleLayout title="Content Studio" subtitle="Author and preview lessons">
      <ListSection title="Authoring Tools" />
      <ListCard>
        <ListRow 
          icon={<Ic.doc className="list-icon" />} 
          title="Browse Lessons"
          meta="View and edit existing content"
          onClick={() => console.log('Browse lessons')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.plus className="list-icon" />} 
          title="Create New Lesson"
          meta="Start from template or blank"
          onClick={() => console.log('Create lesson')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.star className="list-icon" />} 
          title="Validation Tools"
          meta="Check content quality and standards"
          onClick={() => console.log('Validate content')}
        />
      </ListCard>
      
      <ListSection title="Tuning System" />
      <ListCard>
        <ListRow 
          icon={<Ic.palette className="list-icon" />} 
          title="Content Tuning"
          meta="Adjust difficulty and hints"
          onClick={() => console.log('Tune content')}
        />
      </ListCard>
    </SimpleLayout>
  );
}

function RosterList() {
  return (
    <SimpleLayout title="Roster" subtitle="Manage learners and groups">
      <ListSection title="Learner Management" />
      <ListCard>
        <ListRow 
          icon={<Ic.profile className="list-icon" />} 
          title="Add Learner"
          meta="Create new student profile"
          onClick={() => console.log('Add learner')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.bank className="list-icon" />} 
          title="Import from CSV"
          meta="Bulk import student data"
          onClick={() => console.log('Import CSV')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.layers className="list-icon" />} 
          title="Group Management"
          meta="Organize learners into classes"
          onClick={() => console.log('Manage groups')}
        />
      </ListCard>
      
      <ListSection title="Data & Privacy" />
      <ListCard>
        <ListRow 
          icon={<Ic.shield className="list-icon" />} 
          title="Export Data"
          meta="Download learner progress archive"
          onClick={() => console.log('Export data')}
        />
      </ListCard>
    </SimpleLayout>
  );
}

function ClassesList() {
  return (
    <SimpleLayout title="Classes" subtitle="Manage class settings and projector">
      <ListSection title="Class Management" />
      <ListCard>
        <ListRow 
          icon={<Ic.plus className="list-icon" />} 
          title="Create Class"
          meta="Set up new classroom"
          onClick={() => console.log('Create class')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.palette className="list-icon" />} 
          title="Projector Settings"
          meta="Configure display preferences"
          onClick={() => console.log('Projector settings')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.star className="list-icon" />} 
          title="Class Codes"
          meta="View and manage join codes"
          onClick={() => console.log('Class codes')}
        />
      </ListCard>
    </SimpleLayout>
  );
}

function InsightsList() {
  return (
    <SimpleLayout title="Insights" subtitle="Learning analytics and metrics">
      <ListSection title="Engagement Analytics" />
      <ListCard>
        <ListRow 
          icon={<Ic.star className="list-icon" />} 
          title="Weekly Engagement"
          meta="Time on task and return rates"
          onClick={() => console.log('Weekly engagement')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.bell className="list-icon" />} 
          title="Scout Interventions"
          meta="AI tutor assistance patterns"
          onClick={() => console.log('Scout interventions')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.layers className="list-icon" />} 
          title="Progress Trends"
          meta="Learning outcome tracking"
          onClick={() => console.log('Progress trends')}
        />
      </ListCard>
    </SimpleLayout>
  );
}

function QuickStartList() {
  return (
    <SimpleLayout title="Quick Start" subtitle="Get started with LearnOz">
      <ListSection title="Setup Steps" />
      <ListCard>
        <ListRow 
          icon={<Ic.profile className="list-icon" />} 
          title="Create Learner"
          meta="Add your first student"
          onClick={() => console.log('Create learner')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.book className="list-icon" />} 
          title="Start Lesson"
          meta="Launch any lesson to try the interface"
          onClick={() => console.log('Start lesson')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.star className="list-icon" />} 
          title="Explore Features"
          meta="Tour the teacher panel capabilities"
          onClick={() => console.log('Explore features')}
        />
      </ListCard>
      
      <ListSection title="Resources" />
      <ListCard>
        <ListRow 
          icon={<Ic.doc className="list-icon" />} 
          title="Download Guide"
          meta="1-page PDF setup guide"
          onClick={() => console.log('Download guide')}
        />
      </ListCard>
    </SimpleLayout>
  );
}

export default function TabContentV2({ tab }: Props) {
  
  const body = (() => {
    switch (tab) {
      case 'timeline':     
        return <TimelineList />
      case 'assignments':  
        return <AssignmentsManager />
      case 'content':      
      case 'studio':       
        return <ContentStudioList />
      case 'roster':       
      case 'learners':     
        return <RosterList />
      case 'classes':      
        return <ClassesList />
      case 'privacy':      
        return <Privacy />
      case 'appearance':   
        return <Appearance />
      case 'reports':      
        return <Reports />
      case 'insights':     
        return <InsightsList />
      case 'quickstart':   
        return <QuickStartList />
      case 'audit':        
        return <AuditViewerV3 />
      case 'consent':      
        return <Consent open={false} onClose={() => {}} />
      case 'funnel':       
        return <FunnelViewerV3 />
      case 'qa':           
        return <QAPanel />
      case 'pilot':        
        return <PilotV3 />
      case 'dev':          
        return <DevPanel />
      case 'overview':
      case 'dashboard':
      case '':
      case undefined:      
        return <InsightsCard timeRange={30} />
      default:             
        return <Missing name={tab} />
    }
  })()

  return (
    <ToastProvider>
      <RosterProvider>
        <GuideNoticeProvider>
          <Suspense fallback={<div className="p-6">Loading…</div>}>
            {body}
          </Suspense>
        </GuideNoticeProvider>
      </RosterProvider>
    </ToastProvider>
  )
}