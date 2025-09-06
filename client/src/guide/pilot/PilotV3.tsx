import { SimpleLayout } from '../../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../../ui2/List'
import { Ic } from '../../ui2/icons'

export function PilotV3() {
  const handleKPIOverview = () => {
    console.log('View pilot KPI overview')
  }
  
  const handleFeatureFlags = () => {
    console.log('Manage pilot feature flags')
  }
  
  const handleFeedbackCollection = () => {
    console.log('Collect pilot feedback')
  }
  
  const handlePilotReport = () => {
    console.log('Generate pilot report')
  }
  
  const handleScaling = () => {
    console.log('Configure scaling parameters')
  }

  return (
    <SimpleLayout title="Pilot" subtitle="Pilot program management and monitoring">
      <div className="space-y-6">
        <div>
          <ListSection title="Pilot Monitoring"/>
          <ListCard>
            <ListRow 
              icon={<Ic.star className="list-icon"/>} 
              title="KPI dashboard" 
              meta="Real-time pilot performance metrics" 
              onClick={handleKPIOverview}
              data-testid="pilot-kpi-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.layers className="list-icon"/>} 
              title="Feature flags" 
              meta="Enable/disable pilot features and experiments" 
              onClick={handleFeatureFlags}
              data-testid="pilot-flags-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.bell className="list-icon"/>} 
              title="Feedback collection" 
              meta="Gather pilot participant feedback and insights" 
              onClick={handleFeedbackCollection}
              data-testid="pilot-feedback-row"
            />
          </ListCard>
        </div>

        <div>
          <ListSection title="Reporting & Scaling"/>
          <ListCard>
            <ListRow 
              icon={<Ic.doc className="list-icon"/>} 
              title="Pilot report" 
              meta="Generate comprehensive pilot performance report" 
              onClick={handlePilotReport}
              data-testid="pilot-report-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.bank className="list-icon"/>} 
              title="Scaling configuration" 
              meta="Configure parameters for pilot scale-up" 
              onClick={handleScaling}
              data-testid="pilot-scaling-row"
            />
          </ListCard>
        </div>
      </div>
    </SimpleLayout>
  )
}