import React, { Suspense } from 'react'

// Import main panels that exist in the codebase
import { Timeline } from '../Timeline'                             // from guide/Timeline.tsx
import { AssignmentsManager } from '../AssignmentsManager'          // from guide/AssignmentsManager.tsx  
import { ContentStudio } from '../../authoring/Studio'              // from authoring/Studio.tsx
import { RosterManagement } from '../../components/RosterManagement' // from components/RosterManagement.tsx
import { Classes } from '../Classes'                                // from guide/Classes.tsx
import { PrivacyHub } from '../privacy/PrivacyHub'                  // from guide/privacy/PrivacyHub.tsx
import Appearance from '../../settings/Appearance'                  // from settings/Appearance.tsx
import { InsightsCard } from '../InsightsCard'                      // from guide/InsightsCard.tsx
import { Reports } from '../reports/Reports'                        // from guide/reports/Reports.tsx

// Import missing components for complete coverage
import { QuickStart } from '../../teacher/QuickStart'               // from teacher/QuickStart.tsx
import { AuditLogView } from '../../components/AuditLogView'         // from components/AuditLogView.tsx
import { Consent } from '../../settings/Consent'                    // from settings/Consent.tsx
import { FunnelViewer } from '../../debug/FunnelViewer'              // from debug/FunnelViewer.tsx
import { QAPanel } from '../../components/QAPanel'                  // from components/QAPanel.tsx

// Import dev tools
import { TriageBoard } from '../dev/TriageBoard'                     // from guide/dev/TriageBoard.tsx
import PinGallery from '../dev/PinGallery'                          // from guide/dev/PinGallery.tsx
import ScoutGallery from '../dev/ScoutGallery'                      // from guide/dev/ScoutGallery.tsx
import ArtDiagnostics from '../dev/ArtDiagnostics'                  // from guide/dev/ArtDiagnostics.tsx

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
        return <PrivacyHub />
      case 'appearance':   
        return <Appearance />
      case 'reports':      
        return <Reports />
      case 'insights':     
        return <InsightsCard timeRange={30} />
      case 'quickstart':   
        return <QuickStart />
      case 'audit':        
        return <AuditLogView />
      case 'consent':      
        return <Consent open={true} onClose={() => {}} inline={true} />
      case 'funnel':       
        return <FunnelViewer />
      case 'qa':           
        return <QAPanel />
      case 'pilot':        
        return <Missing name="pilot" />
      case 'dev':          
        return (
          <div className="space-y-6">
            <TriageBoard />
            <PinGallery />
            <ScoutGallery />
            <ArtDiagnostics />
          </div>
        )
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