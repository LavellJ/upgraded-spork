/**
 * Cohort Trends Dashboard
 * Provides multi-week trend analysis with accessible charts and CSV exports
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Download, TrendingUp, TrendingDown, Users, Clock, Award, CheckCircle, AlertTriangle, Calendar, Filter, HelpCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { useRosterOptional } from '../../roster/context';
import { getActiveClass } from '../../roster/classes';
import { buildCohortSeries, type CohortSlice } from '../../progress/cohort';
import { weekStartISO, previousWeeks, getWeekDisplayName } from '../../progress/util';
import { exportTrendsCSV } from './exportCsv';
import { Sparkline, MultiSparkline } from './Sparkline';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TBody, TD, TH, THead, TR } from '../../components/ui/table';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';

interface TrendsProps {
  onClose?: () => void;
}

type MetricKey = 'avgOnTaskMins' | 'return7dPct' | 'assignmentsDonePct' | 'completionsPerLearner' | 'streakersPct';

interface MetricConfig {
  key: MetricKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  formatValue: (value: number) => string;
  color: string;
  description: string;
}

const METRICS: MetricConfig[] = [
  {
    key: 'avgOnTaskMins',
    label: 'Avg On-Task Minutes',
    icon: Clock,
    formatValue: (v) => `${v.toFixed(1)}m`,
    color: 'rgb(59, 125, 68)',
    description: 'Average time spent actively engaged in learning activities per week'
  },
  {
    key: 'return7dPct',
    label: 'Return Within 7 Days',
    icon: Users,
    formatValue: (v) => `${v.toFixed(1)}%`,
    color: 'rgb(201, 106, 43)',
    description: 'Percentage of learners who return within 7 days of their last activity'
  },
  {
    key: 'assignmentsDonePct',
    label: 'Assignments Done',
    icon: CheckCircle,
    formatValue: (v) => `${v.toFixed(1)}%`,
    color: 'rgb(59, 183, 182)',
    description: 'Percentage of assigned lessons completed by learners'
  },
  {
    key: 'completionsPerLearner',
    label: 'Completions/Learner',
    icon: TrendingUp,
    formatValue: (v) => v.toFixed(1),
    color: 'rgb(64, 74, 115)',
    description: 'Average number of lesson completions per active learner'
  },
  {
    key: 'streakersPct',
    label: 'Streakers (≥3 days)',
    icon: Award,
    formatValue: (v) => `${v.toFixed(1)}%`,
    color: 'rgb(168, 85, 247)',
    description: 'Percentage of learners with learning streaks of 3 or more days'
  }
];

type SortField = 'week' | MetricKey | 'activeLearners' | 'dueSoon' | 'overdue';
type SortDirection = 'asc' | 'desc';

export function Trends({ onClose }: TrendsProps) {
  const rosterContext = useRosterOptional();
  const activeLearner = rosterContext?.activeLearner;
  
  // State for filters and display options
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [weekRange, setWeekRange] = useState<number>(8);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(['avgOnTaskMins', 'return7dPct']);
  const [showMultiClass, setShowMultiClass] = useState(false);
  const [sortField, setSortField] = useState<SortField>('week');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [includeLearnerCount, setIncludeLearnerCount] = useState(false);

  // Get available classes
  const availableClasses = useMemo(() => {
    if (!rosterContext?.roster?.learners) return [];
    
    const classesMap = new Map<string, { id: string; name: string; learnerCount: number }>();
    
    rosterContext.roster.learners.forEach(learner => {
      const activeClass = getActiveClass(learner.id);
      if (activeClass) {
        const existing = classesMap.get(activeClass.id);
        if (existing) {
          existing.learnerCount++;
        } else {
          classesMap.set(activeClass.id, {
            id: activeClass.id,
            name: activeClass.name,
            learnerCount: 1
          });
        }
      }
    });

    return Array.from(classesMap.values());
  }, [rosterContext?.roster?.learners]);

  // Set default class selection
  React.useEffect(() => {
    if (availableClasses.length > 0 && selectedClassIds.length === 0) {
      const defaultClass = activeLearner ? getActiveClass(activeLearner.id) : null;
      if (defaultClass && availableClasses.find(c => c.id === defaultClass.id)) {
        setSelectedClassIds([defaultClass.id]);
      } else {
        setSelectedClassIds([availableClasses[0].id]);
      }
    }
  }, [availableClasses, selectedClassIds, activeLearner]);

  // Build cohort series data
  const cohortSeries = useMemo(() => {
    if (selectedClassIds.length === 0 || !rosterContext?.roster?.learners) {
      return [];
    }

    // Get learner IDs from selected classes
    const learnerIds = rosterContext.roster.learners
      .filter(learner => {
        const activeClass = getActiveClass(learner.id);
        return activeClass && selectedClassIds.includes(activeClass.id);
      })
      .map(learner => learner.id);

    if (learnerIds.length === 0) return [];

    const startWeek = weekStartISO();
    return buildCohortSeries(learnerIds, startWeek, weekRange);
  }, [selectedClassIds, weekRange, rosterContext?.roster?.learners]);

  // Build per-class series for multi-class view
  const perClassSeries = useMemo(() => {
    if (!showMultiClass || selectedClassIds.length <= 1 || !rosterContext?.roster?.learners) {
      return [];
    }

    return selectedClassIds.slice(0, 2).map(classId => {
      const className = availableClasses.find(c => c.id === classId)?.name || `Class ${classId}`;
      const learnerIds = rosterContext.roster!.learners
        .filter(learner => {
          const activeClass = getActiveClass(learner.id);
          return activeClass && activeClass.id === classId;
        })
        .map(learner => learner.id);

      const startWeek = weekStartISO();
      const series = buildCohortSeries(learnerIds, startWeek, weekRange);
      
      return {
        classId,
        className,
        series
      };
    });
  }, [showMultiClass, selectedClassIds, weekRange, availableClasses, rosterContext?.roster?.learners]);

  // Calculate deltas (current week vs previous week)
  const calculateDelta = useCallback((series: CohortSlice[], metric: MetricKey): number => {
    if (series.length < 2) return 0;
    
    const current = series[series.length - 1];
    const previous = series[series.length - 2];
    
    let currentValue: number;
    let previousValue: number;
    
    switch (metric) {
      case 'avgOnTaskMins':
        currentValue = current.avgOnTaskMins;
        previousValue = previous.avgOnTaskMins;
        break;
      case 'return7dPct':
        currentValue = current.return7dPct;
        previousValue = previous.return7dPct;
        break;
      case 'assignmentsDonePct':
        currentValue = current.assignments.donePct;
        previousValue = previous.assignments.donePct;
        break;
      case 'completionsPerLearner':
        currentValue = current.completionsPerLearner;
        previousValue = previous.completionsPerLearner;
        break;
      case 'streakersPct':
        currentValue = current.streakersPct;
        previousValue = previous.streakersPct;
        break;
      default:
        return 0;
    }
    
    return currentValue - previousValue;
  }, []);

  // Get metric value from cohort slice
  const getMetricValue = useCallback((slice: CohortSlice, metric: MetricKey): number => {
    switch (metric) {
      case 'avgOnTaskMins':
        return slice.avgOnTaskMins;
      case 'return7dPct':
        return slice.return7dPct;
      case 'assignmentsDonePct':
        return slice.assignments.donePct;
      case 'completionsPerLearner':
        return slice.completionsPerLearner;
      case 'streakersPct':
        return slice.streakersPct;
      default:
        return 0;
    }
  }, []);

  // Sort table data
  const sortedSeries = useMemo(() => {
    const sorted = [...cohortSeries];
    
    sorted.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;
      
      switch (sortField) {
        case 'week':
          aValue = a.weekStartISO;
          bValue = b.weekStartISO;
          break;
        case 'activeLearners':
          aValue = a.activeLearners;
          bValue = b.activeLearners;
          break;
        case 'dueSoon':
          aValue = a.assignments.dueSoon;
          bValue = b.assignments.dueSoon;
          break;
        case 'overdue':
          aValue = a.assignments.overdue;
          bValue = b.assignments.overdue;
          break;
        default:
          aValue = getMetricValue(a, sortField as MetricKey);
          bValue = getMetricValue(b, sortField as MetricKey);
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      const comparison = (aValue as number) - (bValue as number);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [cohortSeries, sortField, sortDirection, getMetricValue]);

  // Handle CSV export
  const handleExport = useCallback(() => {
    if (cohortSeries.length === 0) return;
    
    const classNames = selectedClassIds
      .map(id => availableClasses.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join('-');
    
    const filename = `cohort-trends-${classNames || 'all'}-${weekRange}weeks`;
    exportTrendsCSV(cohortSeries, filename, { includeLearnerCount });
  }, [cohortSeries, selectedClassIds, availableClasses, weekRange, includeLearnerCount]);

  // Handle sorting
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  // Get sort indicator
  const getSortIndicator = useCallback((field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  }, [sortField, sortDirection]);

  // Format delta with arrow
  const formatDelta = useCallback((delta: number, formatValue: (value: number) => string) => {
    if (delta === 0) return null;
    
    const isPositive = delta > 0;
    const ArrowIcon = isPositive ? ArrowUp : ArrowDown;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    const sign = isPositive ? '+' : '';
    
    return (
      <span className={`ml-2 inline-flex items-center text-xs ${colorClass}`}>
        <ArrowIcon className="h-3 w-3 mr-1" />
        {sign}{formatValue(Math.abs(delta))}
      </span>
    );
  }, []);

  // Empty states
  if (!rosterContext?.roster?.learners || availableClasses.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No classes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Set up learner classes to view cohort trends.
          </p>
        </div>
      </div>
    );
  }
  
  // No data empty state 
  if (selectedClassIds.length > 0 && cohortSeries.length === 0) {
    return (
      <TooltipProvider>
        <div className="space-y-6" data-testid="trends-dashboard">
          {/* Header and Filters would go here - shortened for brevity */}
          <div className="p-12 text-center" data-testid="empty-state">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No trend data available</h3>
            <p className="text-sm text-gray-500 mb-4">
              No learning activity found for the selected time range.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setWeekRange(16)}
              className="mx-auto"
            >
              Try picking a wider range
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6" data-testid="trends-dashboard">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cohort Trends</h1>
            <p className="text-sm text-gray-500 mt-1">
              Multi-week learning analytics across your classes
            </p>
          </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={cohortSeries.length === 0}
            data-testid="export-csv-button"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card data-testid="filters-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Class Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Classes {selectedClassIds.length > 0 && `(${selectedClassIds.length})`}
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="all-classes"
                    checked={selectedClassIds.length === availableClasses.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedClassIds(availableClasses.map(c => c.id));
                      } else {
                        setSelectedClassIds([]);
                      }
                    }}
                    data-testid="select-all-classes"
                  />
                  <label htmlFor="all-classes" className="text-sm font-medium">
                    All Classes
                  </label>
                </div>
                {availableClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`class-${cls.id}`}
                      checked={selectedClassIds.includes(cls.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedClassIds(prev => [...prev, cls.id]);
                        } else {
                          setSelectedClassIds(prev => prev.filter(id => id !== cls.id));
                        }
                      }}
                      data-testid={`select-class-${cls.id}`}
                    />
                    <label htmlFor={`class-${cls.id}`} className="text-sm">
                      {cls.name} <span className="text-gray-500">({cls.learnerCount})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Week Range */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Week Range
              </label>
              <Select value={weekRange.toString()} onValueChange={(value) => setWeekRange(parseInt(value))}>
                <SelectTrigger data-testid="week-range-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">Last 4 weeks</SelectItem>
                  <SelectItem value="8">Last 8 weeks</SelectItem>
                  <SelectItem value="12">Last 12 weeks</SelectItem>
                  <SelectItem value="16">Last 16 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Display Options */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Display Options
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-multi-class"
                    checked={showMultiClass}
                    onCheckedChange={(checked) => setShowMultiClass(checked === true)}
                    disabled={selectedClassIds.length < 2}
                    data-testid="multi-class-toggle"
                  />
                  <label htmlFor="show-multi-class" className="text-sm">
                    Per-class comparison (max 2)
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* CSV Export Options */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              CSV Export Options
            </label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-learner-count"
                checked={includeLearnerCount}
                onCheckedChange={(checked) => setIncludeLearnerCount(checked === true)}
                data-testid="learner-count-toggle"
              />
              <label htmlFor="include-learner-count" className="text-sm">
                Include learner count column
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-600">
                    <HelpCircle className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Adds a column showing learner participation details in CSV export</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      {cohortSeries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="metrics-cards">
          {METRICS.filter(metric => selectedMetrics.includes(metric.key)).map((metric) => {
            const currentValue = getMetricValue(cohortSeries[cohortSeries.length - 1], metric.key);
            const delta = calculateDelta(cohortSeries, metric.key);
            const data = cohortSeries.map(slice => getMetricValue(slice, metric.key));
            const labels = cohortSeries.map(slice => getWeekDisplayName(slice.weekStartISO));
            
            return (
              <Card key={metric.key} data-testid={`metric-card-${metric.key}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <metric.icon className="h-5 w-5 text-gray-400" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <HelpCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">{metric.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {showMultiClass && perClassSeries.length > 1 ? (
                      <MultiSparkline
                        series={perClassSeries.map(cls => ({
                          data: cls.series.map(slice => getMetricValue(slice, metric.key)),
                          label: cls.className,
                          color: cls.classId === selectedClassIds[0] ? metric.color : `${metric.color}80`
                        }))}
                        labels={labels}
                        width={80}
                        height={20}
                        ariaLabel={`${metric.label} trend comparison across classes`}
                        formatValue={metric.formatValue}
                      />
                    ) : (
                      <Sparkline
                        data={data}
                        labels={labels}
                        width={80}
                        height={20}
                        ariaLabel={`${metric.label} trend over ${weekRange} weeks`}
                        color={metric.color}
                        formatValue={metric.formatValue}
                      />
                    )}
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    {metric.formatValue(currentValue)}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    <span className="flex items-center">
                      {metric.label}
                      {formatDelta(delta, metric.formatValue)}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-500">{metric.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Data Table */}
      {cohortSeries.length > 0 ? (
        <Card data-testid="data-table-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Breakdown
            </CardTitle>
            <CardDescription>
              Detailed metrics for each week. Click column headers to sort.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Card>
              <Toolbar 
                left={
                  <div className="flex items-center gap-3">
                    <Select onValueChange={(value) => setWeekRange(parseInt(value))}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder={`${weekRange} weeks`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8 weeks</SelectItem>
                        <SelectItem value="12">12 weeks</SelectItem>
                        <SelectItem value="16">16 weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                } 
                right={
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      Download CSV
                    </Button>
                    <Button variant="ghost" size="sm" aria-label="Help">?</Button>
                  </div>
                }
              />
              <CardContent>
                <Table>
                  <THead>
                    <TR>
                      <TH 
                        className="cursor-pointer hover:bg-gray-50" 
                        onClick={() => handleSort('week')}
                        data-testid="sort-week"
                      >
                        Week{getSortIndicator('week')}
                      </TH>
                    <TH 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => handleSort('activeLearners')}
                      data-testid="sort-active-learners"
                    >
                      Active Learners{getSortIndicator('activeLearners')}
                    </TH>
                    <TH 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => handleSort('avgOnTaskMins')}
                      data-testid="sort-avg-on-task"
                    >
                      <div className="flex items-center gap-1">
                        Avg On-Task (min){getSortIndicator('avgOnTaskMins')}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-gray-400 hover:text-gray-600">
                              <HelpCircle className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">Average time spent actively engaged in learning activities per week</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TH>
                    <TH 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => handleSort('return7dPct')}
                    >
                      Return 7d (%){getSortIndicator('return7dPct')}
                    </TH>
                    <TH 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => handleSort('assignmentsDonePct')}
                    >
                      Assignments (%){getSortIndicator('assignmentsDonePct')}
                    </TH>
                    <TH>Due Soon / Overdue</TH>
                    <TH 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => handleSort('completionsPerLearner')}
                    >
                      Completions/Learner{getSortIndicator('completionsPerLearner')}
                    </TH>
                    <TH 
                      className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => handleSort('streakersPct')}
                    >
                      Streakers (%){getSortIndicator('streakersPct')}
                    </TH>
                  </TR>
                </THead>
                <TBody>
                  {sortedSeries.map((slice, index) => (
                    <TR key={slice.weekStartISO} data-testid={`table-row-${index}`}>
                      <TD className="font-medium">
                        {getWeekDisplayName(slice.weekStartISO)}
                      </TD>
                      <TD>{slice.activeLearners} / {slice.learners}</TD>
                      <TD>{slice.avgOnTaskMins.toFixed(1)}</TD>
                      <TD>{slice.return7dPct.toFixed(1)}%</TD>
                      <TD>{slice.assignments.donePct.toFixed(1)}%</TD>
                      <TD>
                        <div className="flex gap-1">
                          {slice.assignments.dueSoon > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {slice.assignments.dueSoon} due
                            </Badge>
                          )}
                          {slice.assignments.overdue > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {slice.assignments.overdue} overdue
                            </Badge>
                          )}
                        </div>
                      </TD>
                      <TD>{slice.completionsPerLearner.toFixed(1)}</TD>
                      <TD>{slice.streakersPct.toFixed(1)}%</TD>
                    </TR>
                  ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900 mb-2">No trend data available</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4">
                Select classes and ensure learners have activity data to view trends.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setWeekRange(16)}
                className="mx-auto"
              >
                Try picking a wider range
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </TooltipProvider>
  );
}