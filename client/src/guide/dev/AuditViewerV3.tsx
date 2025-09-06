import { SimpleLayout } from '../../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../../ui2/List'
import { Ic } from '../../ui2/icons'

export function AuditViewerV3() {
  const handleViewLogs = () => {
    console.log('View audit logs')
  }
  
  const handleExportLogs = () => {
    console.log('Export audit logs')
  }
  
  const handlePrivacyEvents = () => {
    console.log('View privacy events')
  }
  
  const handleAuthEvents = () => {
    console.log('View auth events')
  }
  
  const handleDataRetention = () => {
    console.log('View data retention')
  }

  return (
    <SimpleLayout title="Audit" subtitle="Security and compliance monitoring">
      <div className="space-y-6">
        <div>
          <ListSection title="Audit Logs"/>
          <ListCard>
            <ListRow 
              icon={<Ic.shield className="list-icon"/>} 
              title="View audit trail" 
              meta="Complete log of system access and changes" 
              onClick={handleViewLogs}
              data-testid="audit-logs-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.doc className="list-icon"/>} 
              title="Export audit data" 
              meta="Download audit logs for compliance reporting" 
              onClick={handleExportLogs}
              data-testid="audit-export-row"
            />
          </ListCard>
        </div>

        <div>
          <ListSection title="Event Categories"/>
          <ListCard>
            <ListRow 
              icon={<Ic.shield className="list-icon"/>} 
              title="Privacy events" 
              meta="Data access, consent, and deletion events" 
              onClick={handlePrivacyEvents}
              data-testid="audit-privacy-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.profile className="list-icon"/>} 
              title="Authentication events" 
              meta="Login attempts, token issuance, and access" 
              onClick={handleAuthEvents}
              data-testid="audit-auth-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.bank className="list-icon"/>} 
              title="Data retention" 
              meta="Configure automatic data cleanup policies" 
              onClick={handleDataRetention}
              data-testid="audit-retention-row"
            />
          </ListCard>
        </div>
      </div>
    </SimpleLayout>
  )
}