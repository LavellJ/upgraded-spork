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
import ConsentList from '../../settings/ConsentList'               // New list UI for consent
import PrivacyList from '../../settings/PrivacyList'               // New list UI for privacy
import ReportsListComponent from '../../settings/Reports'          // New list UI for reports
import { FunnelViewer } from '../../debug/FunnelViewer'              // from debug/FunnelViewer.tsx
import { QAPanel } from '../../components/QAPanel'                  // from components/QAPanel.tsx

// Import pilot KPI functions
import { buildPilotKPIs, getPilotKPIsWithDelta } from '../../progress/pilot'
import { FeatureFlagsPanel } from '../../components/FeatureFlagsPanel'
import { useFlags } from '../../config/flags'

// Import dev tools
import { TriageBoard } from '../dev/TriageBoard'                     // from guide/dev/TriageBoard.tsx
import PinGallery from '../dev/PinGallery'                          // from guide/dev/PinGallery.tsx
import ScoutGallery from '../dev/ScoutGallery'                      // from guide/dev/ScoutGallery.tsx
import ArtDiagnostics from '../dev/ArtDiagnostics'                  // from guide/dev/ArtDiagnostics.tsx
import { ThemeSelector } from '../dev/ThemeSelector'                 // from guide/dev/ThemeSelector.tsx
import TestAppearance from '../../settings/TestAppearance'          // Test component for appearance v3

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
  const { teacherPanelV2, teacherAppearanceV3 } = useFlags()
  const useListUI = teacherPanelV2 && teacherAppearanceV3
  
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
        return useListUI ? <PrivacyList /> : <PrivacyHub />
      case 'appearance':   
        return <Appearance />
      case 'reports':      
        return useListUI ? <ReportsListComponent /> : <Reports />
      case 'insights':     
        return <InsightsCard timeRange={30} />
      case 'quickstart':   
        return <QuickStart />
      case 'audit':        
        return <AuditLogView />
      case 'consent':      
        return useListUI ? <ConsentList /> : <Consent open={true} onClose={() => {}} inline={true} />
      case 'test-appearance':
        return <TestAppearance />
      case 'funnel':       
        return <FunnelViewer />
      case 'qa':           
        return <QAPanel />
      case 'pilot':        
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(() => {
                // Get current week pilot KPIs
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
                const weekStartISO = weekStart.toISOString().split('T')[0];
                const currentKPIs = buildPilotKPIs(weekStartISO);
                
                return (
                  <>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-2xl font-bold text-blue-600">{currentKPIs.learners}</div>
                      <div className="text-sm text-gray-600">Active Learners</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-2xl font-bold text-green-600">{Math.round(currentKPIs.avgOnTaskMins)}</div>
                      <div className="text-sm text-gray-600">Avg On-Task Minutes</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-2xl font-bold text-purple-600">{Math.round(currentKPIs.return7dPct)}%</div>
                      <div className="text-sm text-gray-600">7-Day Return Rate</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-2xl font-bold text-orange-600">{Math.round(currentKPIs.assignCompletionPct)}%</div>
                      <div className="text-sm text-gray-600">Assignment Completion</div>
                    </div>
                  </>
                );
              })()}
            </div>
            
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Pilot Feature Controls</h3>
              <FeatureFlagsPanel />
            </div>
            
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Pilot Checklist</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• ✅ Configure Scout Guardrails for pilot deployment</p>
                <p>• ✅ Set Assignment Nudges based on session type</p>
                <p>• ✅ Enable Projector Mode for shared screens</p>
                <p>• ✅ Monitor weekly KPI metrics above</p>
                <p>• ✅ Collect feedback through regular check-ins</p>
              </div>
            </div>
          </div>
        )
      case 'dev':          
        return (
          <div className="space-y-6">
            <ThemeSelector />
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