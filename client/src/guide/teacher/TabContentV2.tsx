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
  // Debug the tab value
  console.log('TabContentV2 rendering with tab:', tab)
  
  const body = (() => {
    switch (tab) {
      case 'timeline':     
        console.log('Rendering Timeline component')
        return <Timeline />
      case 'assignments':  
        console.log('Rendering AssignmentsManager component')
        return <AssignmentsManager />
      case 'content':      
      case 'studio':       
        console.log('Rendering ContentStudio component')
        return <ContentStudio />
      case 'roster':       
      case 'learners':     
        console.log('Rendering RosterManagement component')
        return <RosterManagement />
      case 'classes':      
        console.log('Rendering Classes component')
        return <Classes />
      case 'privacy':      
        console.log('Rendering PrivacyHub component')
        return <PrivacyHub />
      case 'appearance':   
        console.log('Rendering Appearance component')
        return <Appearance />
      case 'reports':      
        console.log('Rendering Reports component')
        return <Reports />
      case 'insights':     
        console.log('Rendering InsightsCard component')
        return <InsightsCard timeRange={30} />
      case 'overview':
      case 'dashboard':
      case '':
      case undefined:      
        console.log('Rendering default InsightsCard component')
        return <InsightsCard timeRange={30} />
      default:             
        console.log('Rendering Missing component for tab:', tab)
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