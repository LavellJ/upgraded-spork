import React from 'react'
import { useFlags } from '../config/flags'
import { SimpleLayout } from '../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../ui2/List'
import { Ic } from '../ui2/icons'

export default function ConsentList(){
  const { teacherPanelV2, teacherAppearanceV3 } = useFlags()
  
  // Only show list UI when both flags are enabled
  if (!teacherPanelV2 || !teacherAppearanceV3) return null
  
  const handleConsentStatus = () => {
    console.log('Open family consent status')
  }
  
  const handleSendConsentLink = () => {
    console.log('Send consent link to parents')
  }
  
  const handleConsentHistory = () => {
    console.log('View consent history')
  }
  
  const handleAuditLog = () => {
    console.log('View audit log')
  }
  
  const handleConsentSettings = () => {
    console.log('Open consent settings')
  }
  
  return (
    <SimpleLayout title="Consent" subtitle="Family consent and permission management">
      <div className="space-y-6">
        <div>
          <ListSection title="Family Consent"/>
          <ListCard>
            <ListRow 
              icon={<Ic.shield className="list-icon"/>} 
              title="Family consent status" 
              meta="Review signed digital consent forms" 
              value="12 of 15 signed"
              onClick={handleConsentStatus}
              data-testid="consent-status-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.bell className="list-icon"/>} 
              title="Send consent link" 
              meta="Email parents for digital consent" 
              onClick={handleSendConsentLink}
              data-testid="consent-send-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.doc className="list-icon"/>} 
              title="Consent history" 
              meta="View timeline of consent actions" 
              onClick={handleConsentHistory}
              data-testid="consent-history-row"
            />
          </ListCard>
        </div>

        <div>
          <ListSection title="Compliance"/>
          <ListCard>
            <ListRow 
              icon={<Ic.doc className="list-icon"/>} 
              title="Audit log" 
              meta="Data access and consent audit trail" 
              onClick={handleAuditLog}
              data-testid="consent-audit-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.shield className="list-icon"/>} 
              title="Consent settings" 
              meta="Configure consent requirements" 
              onClick={handleConsentSettings}
              data-testid="consent-settings-row"
            />
          </ListCard>
        </div>
      </div>
    </SimpleLayout>
  )
}