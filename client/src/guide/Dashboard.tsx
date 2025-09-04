import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, Users, BookOpen, Download, ChevronLeft, ChevronRight, Clock, Award, AlertTriangle } from 'lucide-react';
import { useRosterOptional } from '../roster/context';
import { getActiveClass } from '../roster/classes';
import { buildClassWeek, getCurrentWeekStart, getWeekDisplayName, type ClassWeekData } from '../progress/classMetrics';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

interface DashboardProps {
  onExportCSV?: (weekStart: string, classData: ClassWeekData) => void;
}

export function Dashboard({ onExportCSV }: DashboardProps) {
  const rosterContext = useRosterOptional();
  const activeLearner = rosterContext?.activeLearner;
  
  const [selectedWeek, setSelectedWeek] = useState<string>(() => getCurrentWeekStart());

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
      <div className="p-6 space-y-6">
        <div className="text-center space-y-4">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">No Active Class</h3>
            <p className="text-muted-foreground">
              Set an active class in the Classes tab to view the weekly dashboard.
            </p>
          </div>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}