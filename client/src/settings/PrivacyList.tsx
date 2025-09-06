import React from 'react'
import { useFlags } from '../config/flags'
import { SimpleLayout } from '../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../ui2/List'
import { Ic } from '../ui2/icons'

export default function PrivacyList(){
  const { teacherPanelV2, teacherAppearanceV3 } = useFlags()
  
  // Only show list UI when both flags are enabled
  if (!teacherPanelV2 || !teacherAppearanceV3) return null
  
  const handleDataPolicy = () => {
    console.log('Open data policy')
  }
  
  const handleConsentStatus = () => {
    console.log('Open consent status')
  }
  
  const handleSendConsent = () => {
    console.log('Send consent link')
  }
  
  const handleDownloadData = () => {
    console.log('Download student data')
  }
  
  const handleDataRetention = () => {
    console.log('Open data retention settings')
  }
  
  const handleDeleteLearner = () => {
    if (confirm('Are you sure you want to delete learner data? This cannot be undone.')) {
      console.log('Delete learner data')
    }
  }
  
  const handleAuditLog = () => {
    console.log('Open audit log')
  }
  
  return (
    <SimpleLayout title="Privacy" subtitle="Data protection and consent management">
      <div className="space-y-6">
        <div>
          <ListSection title="Data & Consent"/>
          <ListCard>
            <ListRow 
              icon={<Ic.shield className="list-icon"/>} 
              title="Student data policy" 
              meta="View our data protection practices" 
              onClick={handleDataPolicy}
              data-testid="privacy-policy-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.doc className="list-icon"/>} 
              title="Family consent status" 
              meta="Review signed consent forms" 
              value="12 signed"
              onClick={handleConsentStatus}
              data-testid="privacy-consent-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.bell className="list-icon"/>} 
              title="Send consent link" 
              meta="Email parents for digital consent" 
              onClick={handleSendConsent}
              data-testid="privacy-send-consent-row"
            />
          </ListCard>
        </div>

        <div>
          <ListSection title="Exports"/>
          <ListCard>
            <ListRow 
              icon={<Ic.doc className="list-icon"/>} 
              title="Download data" 
              meta="Export all student data as JSON" 
              onClick={handleDownloadData}
              data-testid="privacy-download-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.shield className="list-icon"/>} 
              title="Data retention" 
              meta="Set automatic deletion policies" 
              value="365 days"
              onClick={handleDataRetention}
              data-testid="privacy-retention-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.shield className="list-icon" style={{color: '#dc2626'}}/>} 
              title="Delete learner" 
              meta="Permanently remove student data" 
              onClick={handleDeleteLearner}
              data-testid="privacy-delete-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.doc className="list-icon"/>} 
              title="Audit log" 
              meta="View data access history" 
              onClick={handleAuditLog}
              data-testid="privacy-audit-row"
            />
          </ListCard>
        </div>
      </div>
    </SimpleLayout>
  )
}