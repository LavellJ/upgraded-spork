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

// Note: We've restored the original working components

export default function TabContentV2({ tab }: Props) {
  
  const body = (() => {
    switch (tab) {
      case 'timeline':     
        return <Timeline />
      case 'assignments':  
        return <AssignmentsManager />
      case 'content':      
      case 'studio':       
        return <ContentStudio />
      case 'roster':       
      case 'learners':     
        return <RosterManagement />
      case 'classes':      
        return <Classes />
      case 'privacy':      
        return <Privacy />
      case 'appearance':   
        return <Appearance />
      case 'reports':      
        return <Reports />
      case 'insights':     
        return <InsightsCard timeRange={30} />
      case 'quickstart':   
        return <QuickStart />
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