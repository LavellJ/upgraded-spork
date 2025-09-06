import { SimpleLayout } from '../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../ui2/List'
import { Ic } from '../ui2/icons'

export function FunnelViewerV3() {
  const handleOnboardingFunnel = () => {
    console.log('View onboarding funnel')
  }
  
  const handleLearningFunnel = () => {
    console.log('View learning progression funnel')
  }
  
  const handleRetentionFunnel = () => {
    console.log('View retention funnel')
  }
  
  const handleConversionReport = () => {
    console.log('Generate conversion report')
  }
  
  const handleFunnelExport = () => {
    console.log('Export funnel data')
  }

  return (
    <SimpleLayout title="Funnel" subtitle="Learning progression analytics">
      <div className="space-y-6">
        <div>
          <ListSection title="Learning Funnels"/>
          <ListCard>
            <ListRow 
              icon={<Ic.star className="list-icon"/>} 
              title="Onboarding funnel" 
              meta="Track new learner setup and first interactions" 
              onClick={handleOnboardingFunnel}
              data-testid="funnel-onboarding-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.layers className="list-icon"/>} 
              title="Learning progression" 
              meta="Monitor skill development and lesson completion" 
              onClick={handleLearningFunnel}
              data-testid="funnel-learning-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.profile className="list-icon"/>} 
              title="Retention analysis" 
              meta="Track long-term engagement and return rates" 
              onClick={handleRetentionFunnel}
              data-testid="funnel-retention-row"
            />
          </ListCard>
        </div>

        <div>
          <ListSection title="Analytics & Export"/>
          <ListCard>
            <ListRow 
              icon={<Ic.doc className="list-icon"/>} 
              title="Conversion report" 
              meta="Generate detailed funnel conversion analysis" 
              onClick={handleConversionReport}
              data-testid="funnel-report-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.bank className="list-icon"/>} 
              title="Export funnel data" 
              meta="Download raw funnel metrics for analysis" 
              onClick={handleFunnelExport}
              data-testid="funnel-export-row"
            />
          </ListCard>
        </div>
      </div>
    </SimpleLayout>
  )
}