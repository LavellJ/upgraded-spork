import React, { useState } from 'react'
import { SimpleLayout } from '../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../ui2/List'
import { Ic } from '../ui2/icons'
import { loadEvents } from '../progress'

export function FunnelViewerV3() {
  const [loading, setLoading] = useState(false)
  const handleOnboardingFunnel = async () => {
    setLoading(true)
    try {
      const events = await loadEvents()
      const onboardingEvents = events.filter(e => e.kind === 'funnel' && e.type === 'onboard')
      console.log('Onboarding funnel events:', onboardingEvents.length)
      alert(`Found ${onboardingEvents.length} onboarding events`)
    } catch (error) {
      console.error('Error loading onboarding funnel:', error)
      alert('Error loading onboarding funnel data')
    }
    setLoading(false)
  }
  
  const handleLearningFunnel = async () => {
    setLoading(true)
    try {
      const events = await loadEvents()
      const learningEvents = events.filter(e => 
        e.kind === 'lesson_start' || e.kind === 'lesson_finish' || e.kind === 'journal_start'
      )
      console.log('Learning progression events:', learningEvents.length)
      alert(`Found ${learningEvents.length} learning progression events`)
    } catch (error) {
      console.error('Error loading learning funnel:', error)
      alert('Error loading learning progression data')
    }
    setLoading(false)
  }
  
  const handleRetentionFunnel = async () => {
    setLoading(true)
    try {
      const events = await loadEvents()
      // Group events by date to analyze retention
      const eventsByDate = events.reduce((acc, event) => {
        const date = new Date(event.at).toDateString()
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      const activeDays = Object.keys(eventsByDate).length
      console.log('Retention analysis - Active days:', activeDays)
      alert(`User active on ${activeDays} different days`)
    } catch (error) {
      console.error('Error analyzing retention:', error)
      alert('Error analyzing retention data')
    }
    setLoading(false)
  }
  
  const handleConversionReport = async () => {
    setLoading(true)
    try {
      const events = await loadEvents()
      const funnelEvents = events.filter(e => e.kind === 'funnel')
      const lessonEvents = events.filter(e => e.kind === 'lesson_finish')
      const journalEvents = events.filter(e => e.kind === 'journal_finish')
      
      const report = {
        totalFunnelEvents: funnelEvents.length,
        lessonsCompleted: lessonEvents.length,
        journalEntries: journalEvents.length,
        totalEvents: events.length
      }
      
      console.log('Conversion report:', report)
      alert(`Report: ${report.lessonsCompleted} lessons, ${report.journalEntries} journal entries, ${report.totalEvents} total events`)
    } catch (error) {
      console.error('Error generating conversion report:', error)
      alert('Error generating conversion report')
    }
    setLoading(false)
  }
  
  const handleFunnelExport = async () => {
    setLoading(true)
    try {
      const events = await loadEvents()
      const funnelData = events.map(event => ({
        kind: event.kind,
        type: event.type || 'unknown',
        timestamp: event.at,
        date: new Date(event.at).toISOString()
      }))
      
      const dataStr = JSON.stringify(funnelData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `funnel-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      
      URL.revokeObjectURL(url)
      console.log('Funnel data exported')
    } catch (error) {
      console.error('Error exporting funnel data:', error)
      alert('Error exporting funnel data')
    }
    setLoading(false)
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
              value={loading ? 'Loading...' : undefined}
              data-testid="funnel-onboarding-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.layers className="list-icon"/>} 
              title="Learning progression" 
              meta="Monitor skill development and lesson completion" 
              onClick={handleLearningFunnel}
              value={loading ? 'Loading...' : undefined}
              data-testid="funnel-learning-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.profile className="list-icon"/>} 
              title="Retention analysis" 
              meta="Track long-term engagement and return rates" 
              onClick={handleRetentionFunnel}
              value={loading ? 'Loading...' : undefined}
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
              value={loading ? 'Generating...' : undefined}
              data-testid="funnel-report-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.bank className="list-icon"/>} 
              title="Export funnel data" 
              meta="Download raw funnel metrics for analysis" 
              onClick={handleFunnelExport}
              value={loading ? 'Exporting...' : undefined}
              data-testid="funnel-export-row"
            />
          </ListCard>
        </div>
      </div>
    </SimpleLayout>
  )
}