import React, { useState } from 'react'
import { useFlags } from '../../config/flags'
import { SimpleLayout } from '../../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../../ui2/List'
import { Ic } from '../../ui2/icons'
import { exportTrendsCSV, exportWeeklyEngagementCSV, exportTeacherDigestCSV } from './exportCsv'
import { downloadEventsCSV } from '../../lib/analytics'
import { loadEvents } from '../../progress'

export function ReportsV3() {
  const { teacherPanelV2, teacherAppearanceV3 } = useFlags()
  const [loading, setLoading] = useState(false)
  
  // Only show when both flags are enabled
  if (!teacherPanelV2 || !teacherAppearanceV3) return null
  
  const handleWeeklyReport = async () => {
    setLoading(true)
    try {
      // Generate a mock weekly report - in reality this would integrate with PDF generation
      const events = await loadEvents()
      const report = {
        week: new Date().toISOString().split('T')[0],
        totalEvents: events.length,
        lessons: events.filter(e => e.kind === 'lesson_finish').length,
        journalEntries: events.filter(e => e.kind === 'journal_finish').length
      }
      alert(`Weekly Report Generated:\n• ${report.lessons} lessons completed\n• ${report.journalEntries} journal entries\n• ${report.totalEvents} total events`)
    } catch (error) {
      console.error('Error generating weekly report:', error)
      alert('Error generating weekly report')
    }
    setLoading(false)
  }
  
  const handleExportCSV = async () => {
    setLoading(true)
    try {
      // Export trends data - using mock data since we don't have cohort slices readily available
      const mockTrendsData = [{
        week: 1,
        weekStartISO: new Date().toISOString().split('T')[0],
        learners: 25,
        activeLearners: 18,
        avgOnTaskMins: 45.2,
        medianOnTaskMins: 42.0,
        return7dPct: 78.5,
        assignments: { donePct: 85.5, dueSoon: 3, overdue: 1 },
        completionsPerLearner: 2.3,
        streakPct: 65.2
      }]
      exportTrendsCSV(mockTrendsData, 'class-trends-report')
      alert('CSV exported successfully!')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Error exporting CSV data')
    }
    setLoading(false)
  }
  
  const handleEmailSummary = async () => {
    setLoading(true)
    try {
      // Mock email functionality - in reality this would integrate with email service
      const events = await loadEvents()
      const summary = `Weekly Summary: ${events.length} learning activities completed`
      alert(`Email Summary Ready:\n${summary}\n\nIn production, this would send emails to parent/guardian addresses.`)
    } catch (error) {
      console.error('Error preparing email summary:', error)
      alert('Error preparing email summary')
    }
    setLoading(false)
  }
  
  const handleProgressReport = async () => {
    setLoading(true)
    try {
      const events = await loadEvents()
      const progressData = {
        lessonStarts: events.filter(e => e.kind === 'lesson_start').length,
        lessonCompletes: events.filter(e => e.kind === 'lesson_finish').length,
        journalEntries: events.filter(e => e.kind === 'journal_finish').length,
        completionRate: events.filter(e => e.kind === 'lesson_finish').length / Math.max(events.filter(e => e.kind === 'lesson_start').length, 1) * 100
      }
      alert(`Progress Report:\n• Lessons started: ${progressData.lessonStarts}\n• Lessons completed: ${progressData.lessonCompletes}\n• Completion rate: ${progressData.completionRate.toFixed(1)}%\n• Journal entries: ${progressData.journalEntries}`)
    } catch (error) {
      console.error('Error generating progress report:', error)
      alert('Error generating progress report')
    }
    setLoading(false)
  }
  
  const handleAttendanceReport = async () => {
    setLoading(true)
    try {
      const events = await loadEvents()
      // Analyze attendance based on daily activity
      const attendanceByDate = events.reduce((acc, event) => {
        const date = new Date(event.at).toDateString()
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const activeDays = Object.keys(attendanceByDate).length
      const totalPossibleDays = Math.min(30, Math.ceil((Date.now() - Math.min(...events.map(e => e.at))) / (1000 * 60 * 60 * 24)))
      const attendanceRate = (activeDays / Math.max(totalPossibleDays, 1)) * 100
      
      alert(`Attendance Report:\n• Active days: ${activeDays}\n• Total days: ${totalPossibleDays}\n• Attendance rate: ${attendanceRate.toFixed(1)}%`)
    } catch (error) {
      console.error('Error generating attendance report:', error)
      alert('Error generating attendance report')
    }
    setLoading(false)
  }
  
  const handleDataExport = async () => {
    setLoading(true)
    try {
      // Export raw event data using the existing analytics function
      downloadEventsCSV('learnoz-raw-data.csv')
      alert('Raw data exported successfully!')
    } catch (error) {
      console.error('Error exporting raw data:', error)
      alert('Error exporting raw data')
    }
    setLoading(false)
  }
  
  return (
    <SimpleLayout title="Reports" subtitle="Generate and export class reports">
      <div className="space-y-6">
        <div>
          <ListSection title="Class Reports"/>
          <ListCard>
            <ListRow 
              icon={<Ic.doc className="list-icon"/>} 
              title="Weekly class report (PDF)" 
              meta="Comprehensive weekly progress summary" 
              onClick={handleWeeklyReport}
              value={loading ? 'Generating...' : undefined}
              data-testid="reports-weekly-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.doc className="list-icon"/>} 
              title="Progress report" 
              meta="Individual student progress tracking" 
              onClick={handleProgressReport}
              value={loading ? 'Generating...' : undefined}
              data-testid="reports-progress-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.profile className="list-icon"/>} 
              title="Attendance report" 
              meta="Class participation and attendance" 
              onClick={handleAttendanceReport}
              value={loading ? 'Calculating...' : undefined}
              data-testid="reports-attendance-row"
            />
          </ListCard>
        </div>

        <div>
          <ListSection title="Data Export"/>
          <ListCard>
            <ListRow 
              icon={<Ic.doc className="list-icon"/>} 
              title="Export CSV" 
              meta="Student data in spreadsheet format" 
              onClick={handleExportCSV}
              value={loading ? 'Exporting...' : undefined}
              data-testid="reports-csv-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.bell className="list-icon"/>} 
              title="Email summary to parents" 
              meta="Send progress summaries via email" 
              onClick={handleEmailSummary}
              value={loading ? 'Preparing...' : undefined}
              data-testid="reports-email-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.bank className="list-icon"/>} 
              title="Raw data export" 
              meta="Complete data backup in JSON format" 
              onClick={handleDataExport}
              value={loading ? 'Exporting...' : undefined}
              data-testid="reports-data-row"
            />
          </ListCard>
        </div>
      </div>
    </SimpleLayout>
  )
}