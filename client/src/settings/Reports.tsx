import React from 'react'
import { useFlags } from '../config/flags'
import { SimpleLayout } from '../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../ui2/List'
import { Ic } from '../ui2/icons'

function LegacyReports() {
  return (
    <div className="card p-4 md:p-6">
      <h2 className="page-title mb-2">Reports</h2>
      <p className="subtle mb-4">Generate and export class reports.</p>
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Export Options</h3>
          <p className="text-sm text-gray-600">Download reports in various formats.</p>
        </div>
      </div>
    </div>
  )
}

export default function Reports(){
  const { teacherPanelV2, teacherAppearanceV3 } = useFlags()
  
  // Legacy fallback
  if (!teacherPanelV2 || !teacherAppearanceV3) return <LegacyReports/>
  
  const handleWeeklyReport = () => {
    console.log('Generate weekly class report PDF')
  }
  
  const handleExportCSV = () => {
    console.log('Export student data as CSV')
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