import React from 'react'
import { useFlags } from '../../config/flags'
import { SimpleLayout } from '../../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../../ui2/List'
import { Ic } from '../../ui2/icons'

export function ReportsV3() {
  const { teacherPanelV2, teacherAppearanceV3 } = useFlags()
  
  // Only show when both flags are enabled
  if (!teacherPanelV2 || !teacherAppearanceV3) return null
  
  const handleWeeklyReport = () => {
    console.log('Generate weekly class report PDF')
  }
  
  const handleExportCSV = () => {
    console.log('Export CSV')
  }
  
  const handleEmailSummary = () => {
    console.log('Email summary to parents')
  }
  
  const handleProgressReport = () => {
    console.log('Generate progress report')
  }
  
  const handleAttendanceReport = () => {
    console.log('Generate attendance report')
  }
  
  const handleDataExport = () => {
    console.log('Export raw data')
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
              data-testid="reports-weekly-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.doc className="list-icon"/>} 
              title="Progress report" 
              meta="Individual student progress tracking" 
              onClick={handleProgressReport}
              data-testid="reports-progress-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.profile className="list-icon"/>} 
              title="Attendance report" 
              meta="Class participation and attendance" 
              onClick={handleAttendanceReport}
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
              data-testid="reports-csv-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.bell className="list-icon"/>} 
              title="Email summary to parents" 
              meta="Send progress summaries via email" 
              onClick={handleEmailSummary}
              data-testid="reports-email-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.bank className="list-icon"/>} 
              title="Raw data export" 
              meta="Complete data backup in JSON format" 
              onClick={handleDataExport}
              data-testid="reports-data-row"
            />
          </ListCard>
        </div>
      </div>
    </SimpleLayout>
  )
}