import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, Users, BookOpen, Download, ChevronLeft, ChevronRight, Clock, Award, AlertTriangle, FileText, ArrowUp, ArrowDown, Minus, Star, QrCode, Printer } from 'lucide-react';
import { useRosterOptional } from '../roster/context';
import { getActiveClass, makeClassCode } from '../roster/classes';
import { buildClassWeek, getCurrentWeekStart, getWeekDisplayName, type ClassWeekData } from '../progress/classMetrics';
import { getPilotKPIsWithDelta } from '../progress/pilot';
import { createPrintableQRSheet } from '../utils/qr';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ParentSummary } from '../reports/parentSummary';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

interface DashboardProps {
  onExportCSV?: (weekStart: string, classData: ClassWeekData) => void;
}

export function Dashboard({ onExportCSV }: DashboardProps) {
  const rosterContext = useRosterOptional();
  const activeLearner = rosterContext?.activeLearner;
  
  const [selectedWeek, setSelectedWeek] = useState<string>(() => getCurrentWeekStart());
  const [parentSummaryData, setParentSummaryData] = useState<{ learnerId: string; learnerName: string } | null>(null);

  // Get active class information
  const activeClass = useMemo(() => {
    if (!activeLearner) return null;
    return getActiveClass(activeLearner.id);
  }, [activeLearner]);

  // Build class metrics for the selected week using all learners from roster
  const classData = useMemo(() => {
    if (!activeClass || !rosterContext?.roster?.learners) {
      return { totals: { minutes: 0, sessions: 0, dueSoon: 0, overdue: 0, assignmentsDone: 0 }, perLearner: [] };
    }
    // Use all learners from the roster for the dashboard
    const learnerIds = rosterContext.roster.learners.map(learner => learner.id);
    return buildClassWeek(learnerIds, selectedWeek);
  }, [activeClass, rosterContext?.roster?.learners, selectedWeek]);

  // Build pilot KPIs with week-over-week comparison
  const pilotKPIs = useMemo(() => {
    return getPilotKPIsWithDelta(selectedWeek);
  }, [selectedWeek]);

  // Week navigation helpers
  const navigateWeek = (direction: 'prev' | 'next') => {
    const current = new Date(selectedWeek);
    const newWeek = new Date(current);
    
    if (direction === 'prev') {
      newWeek.setDate(current.getDate() - 7);
    } else {
      newWeek.setDate(current.getDate() + 7);
    }
    
    setSelectedWeek(newWeek.toISOString().split('T')[0]);
  };

  const weekDisplayName = getWeekDisplayName(selectedWeek);

  // Handle QR code printing for new teachers without a class
  const handlePrintQRCode = () => {
    // Generate a temporary class code and name for first-time teachers
    const tempClassCode = makeClassCode();
    const tempClassName = "My First Class";
    
    const printableHTML = createPrintableQRSheet(tempClassCode, tempClassName);
    
    // Open in new window and trigger print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printableHTML);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 100);
    }
  };

  // Helper function to render delta indicator
  const renderDelta = (delta: number, suffix = '') => {
    if (delta === 0) {
      return (
        <span className="inline-flex items-center text-xs text-muted-foreground">
          <Minus className="h-3 w-3 mr-1" />
          No change
        </span>
      );
    }
    
    const isPositive = delta > 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const Icon = isPositive ? ArrowUp : ArrowDown;
    
    return (
      <span className={`inline-flex items-center text-xs ${color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {Math.abs(delta)}{suffix}
      </span>
    );
  };

  // CSV export for pilot summary
  const handlePilotCSV = () => {
    const headers = [
      'Week',
      'Total Learners',
      'Avg On-Task Minutes',
      '7-Day Return Rate %',
      'Assignment Completion %',
      'NPS Average',
      'NPS Responses'
    ];

    const currentKPIs = pilotKPIs.current;
    const rows = [[
      selectedWeek,
      currentKPIs.learners.toString(),
      currentKPIs.avgOnTaskMins.toString(),
      currentKPIs.return7dPct.toString(),
      currentKPIs.assignCompletionPct.toString(),
      currentKPIs.npsAvg?.toString() || '',
      currentKPIs.npsCount?.toString() || ''
    ]];

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pilot-kpis-${selectedWeek}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV export
  const handleExportCSV = () => {
    if (onExportCSV) {
      onExportCSV(selectedWeek, classData);
    } else {
      // Default CSV export implementation
      const headers = [
        'Learner Name',
        'Minutes Active',
        'Sessions',
        'Assignments Done',
        'Due Soon',
        'Overdue'
      ];

      const rows = classData.perLearner.map(learner => [
        learner.name,
        learner.minutes.toString(),
        learner.sessions.toString(),
        learner.assignmentsDone.toString(),
        learner.dueSoon.toString(),
        learner.overdue.toString()
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `class_dashboard_${selectedWeek}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Calculate average performance
  const avgMinutes = classData.perLearner.length > 0 
    ? Math.round(classData.totals.minutes / classData.perLearner.length)
    : 0;

  const avgSessions = classData.perLearner.length > 0
    ? Math.round((classData.totals.sessions / classData.perLearner.length) * 10) / 10
    : 0;

  if (!activeClass) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to LearnOz Guide!
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Ready to set up your first class? Let's get started with a QR code for your students.
          </p>
        </div>

        {/* QR Code Welcome Card */}
        <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <QrCode className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-blue-900">
              Print Your Class QR Code
            </CardTitle>
            <CardDescription className="text-blue-700 text-base">
              Students can scan this QR code to join your class instantly on any device
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <Button
              size="lg"
              onClick={handlePrintQRCode}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              data-testid="button-print-class-qr"
            >
              <Printer className="h-5 w-5 mr-2" />
              Print Class QR Code
            </Button>
            <p className="text-sm text-blue-600 mt-4">
              💡 Tip: Post the QR code on your classroom wall or share it during the first lesson
            </p>
          </CardContent>
        </Card>

        {/* Quick Setup Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              Quick Setup Guide
            </CardTitle>
            <CardDescription>
              Get your classroom up and running in 3 simple steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="mx-auto mb-3 p-2 bg-green-100 rounded-full w-fit">
                  <span className="text-green-600 font-bold text-lg">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Print QR Code</h3>
                <p className="text-sm text-gray-600">
                  Print your class QR code and display it prominently in your classroom
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="mx-auto mb-3 p-2 bg-yellow-100 rounded-full w-fit">
                  <span className="text-yellow-600 font-bold text-lg">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Students Scan</h3>
                <p className="text-sm text-gray-600">
                  Students use their devices to scan the QR code and automatically join your class
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="mx-auto mb-3 p-2 bg-blue-100 rounded-full w-fit">
                  <span className="text-blue-600 font-bold text-lg">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Start Learning</h3>
                <p className="text-sm text-gray-600">
                  Begin tracking progress, assign lessons, and watch your students grow
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Setup Option */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm mb-2">
            Need to set up classes manually first?
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Navigation to Classes would go here */}}
            data-testid="button-manual-setup"
          >
            <Users className="h-4 w-4 mr-2" />
            Manual Class Setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="dashboard-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="dashboard-title">
            Weekly Dashboard
          </h2>
          <p className="text-muted-foreground" data-testid="class-name">
            {activeClass.name} • {classData.perLearner.length} learners
          </p>
        </div>
        <Button 
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          data-testid="button-export-csv"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
              data-testid="button-prev-week"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Week
            </Button>
            
            <div className="text-center">
              <div className="flex items-center gap-2 text-lg font-semibold" data-testid="week-display">
                <Calendar className="h-5 w-5" />
                {weekDisplayName}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
              data-testid="button-next-week"
            >
              Next Week
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pilot Overview KPI Card */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Pilot Overview
            </CardTitle>
            <CardDescription>
              Weekly KPIs with previous week comparison
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePilotCSV}
            className="flex items-center gap-1"
            data-testid="button-download-pilot-csv"
          >
            <Download className="h-4 w-4" />
            Download pilot summary CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Total Learners */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Total Learners</div>
              <div className="text-2xl font-bold" data-testid="pilot-learners">
                {pilotKPIs.current.learners}
              </div>
              {renderDelta(pilotKPIs.deltas.learners)}
            </div>

            {/* Avg On-Task Minutes */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Avg On-Task</div>
              <div className="text-2xl font-bold" data-testid="pilot-avg-minutes">
                {pilotKPIs.current.avgOnTaskMins}m
              </div>
              {renderDelta(pilotKPIs.deltas.avgOnTaskMins, 'm')}
            </div>

            {/* 7-Day Return Rate */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">7-Day Return</div>
              <div className="text-2xl font-bold" data-testid="pilot-return-rate">
                {pilotKPIs.current.return7dPct}%
              </div>
              {renderDelta(pilotKPIs.deltas.return7dPct, '%')}
            </div>

            {/* Assignment Completion */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Assignment Completion</div>
              <div className="text-2xl font-bold" data-testid="pilot-completion-rate">
                {pilotKPIs.current.assignCompletionPct}%
              </div>
              {renderDelta(pilotKPIs.deltas.assignCompletionPct, '%')}
            </div>

            {/* NPS */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3" />
                NPS Average
              </div>
              <div className="text-2xl font-bold" data-testid="pilot-nps">
                {pilotKPIs.current.npsAvg?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                {pilotKPIs.current.npsCount || 0} responses
                {pilotKPIs.deltas.npsAvg && renderDelta(pilotKPIs.deltas.npsAvg)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-minutes">
              {Math.round(classData.totals.minutes)}m
            </div>
            <p className="text-xs text-muted-foreground">
              {avgMinutes}m avg per learner
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Sessions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-sessions">
              {classData.totals.sessions}
            </div>
            <p className="text-xs text-muted-foreground">
              {avgSessions} avg per learner
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments Done</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="assignments-done">
              {classData.totals.assignmentsDone}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <BookOpen className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="due-soon">
              {classData.totals.dueSoon}
            </div>
            <p className="text-xs text-muted-foreground">
              Next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="overdue">
              {classData.totals.overdue}
            </div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Learner Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Learner Performance</CardTitle>
          <CardDescription>
            Individual activity and assignment metrics for the selected week
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classData.perLearner.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No learner data available for this week
            </div>
          ) : (
            <Table data-testid="learner-performance-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Learner</TableHead>
                  <TableHead>Active Time</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Assignments Done</TableHead>
                  <TableHead>Due Soon</TableHead>
                  <TableHead>Overdue</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classData.perLearner.map((learner) => (
                  <TableRow key={learner.learnerId} data-testid={`row-learner-${learner.learnerId}`}>
                    <TableCell className="font-medium" data-testid={`text-learner-name-${learner.learnerId}`}>
                      {learner.name}
                    </TableCell>
                    <TableCell data-testid={`text-minutes-${learner.learnerId}`}>
                      {learner.minutes}m
                    </TableCell>
                    <TableCell data-testid={`text-sessions-${learner.learnerId}`}>
                      {learner.sessions}
                    </TableCell>
                    <TableCell data-testid={`text-assignments-done-${learner.learnerId}`}>
                      {learner.assignmentsDone}
                    </TableCell>
                    <TableCell data-testid={`text-due-soon-${learner.learnerId}`}>
                      <span className={learner.dueSoon > 0 ? "text-yellow-600 font-medium" : ""}>
                        {learner.dueSoon}
                      </span>
                    </TableCell>
                    <TableCell data-testid={`text-overdue-${learner.learnerId}`}>
                      <span className={learner.overdue > 0 ? "text-red-600 font-medium" : ""}>
                        {learner.overdue}
                      </span>
                    </TableCell>
                    <TableCell data-testid={`actions-${learner.learnerId}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setParentSummaryData({ learnerId: learner.learnerId, learnerName: learner.name })}
                        className="flex items-center gap-1"
                        data-testid={`button-parent-summary-${learner.learnerId}`}
                      >
                        <FileText className="h-3 w-3" />
                        Parent Summary
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Parent Summary Dialog */}
      <Dialog open={!!parentSummaryData} onOpenChange={() => setParentSummaryData(null)}>
        <DialogContent className="max-w-full w-full h-full max-h-none m-0 p-0 rounded-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Parent Summary Report</DialogTitle>
          </DialogHeader>
          {parentSummaryData && (
            <ParentSummary 
              learnerId={parentSummaryData.learnerId} 
              weekStartISO={selectedWeek} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}