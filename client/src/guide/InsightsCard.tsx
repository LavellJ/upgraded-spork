// Insights card for Guide view showing engagement metrics and Scout intervention summary

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { MessageSquare, Target, MousePointer, X, Info, Clock, Activity, TrendingUp, Calendar, Zap } from 'lucide-react';
import { getEventsRange, scoutSummary, scoutAnalytics, type ScoutSummary, type ScoutAnalytics } from '../progress';
import { onTaskMinutes, weeklyReturn, sessionStreak } from '../progress/metrics';
import { loadEvents } from '../progress/events';
import { Sparkline } from '../components/Sparkline';

interface InsightsCardProps {
  timeRange?: 7 | 30 | 90;
  className?: string;
}

export function InsightsCard({ timeRange = 7, className = '' }: InsightsCardProps) {
  const events = getEventsRange(timeRange);
  
  const summary: ScoutSummary = useMemo(() => {
    return scoutSummary(events, timeRange);
  }, [events, timeRange]);

  const analytics: ScoutAnalytics = useMemo(() => {
    return scoutAnalytics(events, timeRange);
  }, [events, timeRange]);

  // Engagement metrics
  const engagementMetrics = useMemo(() => {
    const progressEvents = loadEvents();
    const onTaskData = onTaskMinutes(7);
    const returnData = weeklyReturn(progressEvents);
    const streakData = sessionStreak(progressEvents);
    
    // Convert onTaskData to array for sparkline (last 7 days in chronological order)
    const sortedDates = Object.keys(onTaskData).sort();
    const sparklineData = sortedDates.map(date => onTaskData[date]);
    
    return {
      sparklineData,
      totalMinutes: Object.values(onTaskData).reduce((sum, mins) => sum + mins, 0),
      weeklyReturn: returnData,
      streak: streakData
    };
  }, []);

  const hasData = summary.totalShown > 0;

  const formatMessageId = (messageId: string): string => {
    // Format message ID for display
    return messageId.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'actionable': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case 'critical': return '🔴';
      case 'actionable': return '🟡';
      case 'info': return '💬';
      default: return '🧭';
    }
  };

  const hasEngagementData = engagementMetrics.totalMinutes > 0 || engagementMetrics.streak.current > 0;

  if (!hasData && !hasEngagementData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-blue-600" />
            Learning Insights ({timeRange} days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No learning activity in this period.</p>
            <p className="text-xs mt-1">Engagement metrics and Scout interventions will appear here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-blue-600" />
          Learning Insights ({timeRange} days)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Engagement Section */}
        {hasEngagementData && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Engagement
              </h4>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {/* On-task minutes with sparkline */}
              <div className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-lg font-bold text-green-700">
                    {Math.round(engagementMetrics.totalMinutes)}m
                  </div>
                  <Sparkline 
                    data={engagementMetrics.sparklineData} 
                    width={40} 
                    height={16} 
                    color="#16a34a"
                    className="mb-1"
                  />
                </div>
                <div className="text-xs text-gray-600">On-task Time</div>
                <div className="text-xs text-gray-500 mt-1" title="Active learning time excluding idle periods">
                  7-day total
                </div>
              </div>
              
              {/* 7-day return */}
              <div className="text-center border-l border-r border-green-200 px-2">
                <div className="text-lg font-bold text-green-700 flex items-center justify-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {engagementMetrics.weeklyReturn.returnedWithin7d ? 'Yes' : 'No'}
                </div>
                <div className="text-xs text-gray-600">7-Day Return</div>
                <div className="text-xs text-gray-500 mt-1" title={`Last active: ${engagementMetrics.weeklyReturn.lastActiveISO || 'Never'}`}>
                  Came back
                </div>
              </div>
              
              {/* Session streak */}
              <div className="text-center">
                <div className="text-lg font-bold text-green-700 flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3" />
                  {engagementMetrics.streak.current}
                  {engagementMetrics.streak.best > engagementMetrics.streak.current && (
                    <span className="text-xs text-gray-500">/{engagementMetrics.streak.best}</span>
                  )}
                </div>
                <div className="text-xs text-gray-600">Session Streak</div>
                <div className="text-xs text-gray-500 mt-1" title={`Best streak: ${engagementMetrics.streak.best} days`}>
                  Current/Best
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scout Interventions Section */}
        {hasData && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Scout Interventions
              </h4>
            </div>
            
            {/* Summary metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Total Shown</p>
                    <p className="text-2xl font-bold text-blue-700">{summary.totalShown}</p>
                  </div>
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Actionable</p>
                    <p className="text-2xl font-bold text-yellow-700">{summary.actionableShown}</p>
                  </div>
                  <Target className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-900">Assignment</p>
                    <p className="text-2xl font-bold text-purple-700">{analytics.assignmentNudges || 0}</p>
                  </div>
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">CTA Clicks</p>
                    <p className="text-2xl font-bold text-green-700">{summary.clickedCTAs}</p>
                  </div>
                  <MousePointer className="w-6 h-6 text-green-600" />
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Dismissals</p>
                    <p className="text-2xl font-bold text-gray-700">{summary.dismissals}</p>
                  </div>
                  <X className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Top messages */}
            {summary.topMessages.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Most Frequent Messages
                </h4>
                <div className="space-y-2">
                  {summary.topMessages.map((message, index) => (
                    <div
                      key={message.messageId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      role="listitem"
                      aria-label={`Message ranked ${index + 1}: ${formatMessageId(message.messageId)}, ${message.priority} priority, shown ${message.count} times`}
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg" aria-hidden="true">
                          {getPriorityIcon(message.priority)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {formatMessageId(message.messageId)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(message.priority)}`}
                            >
                              {message.priority}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Shown {message.count} time{message.count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics row */}
            {analytics.ctaCtr > 0 && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    Analytics
                  </h4>
                  <div className="flex items-center gap-1">
                    <Info className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500" title="Guardrails prevent over-messaging: 6 info + 3 actionable per 10min (20% less in Calm Mode)">
                      Guardrails Active
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-indigo-700">
                      {Math.round(analytics.ctaCtr * 100)}%
                    </div>
                    <div className="text-xs text-gray-600">CTR</div>
                    <div className="text-xs text-gray-500 mt-1" title="Click-through rate for actionable messages">
                      CTA clicks
                    </div>
                  </div>
                  
                  <div className="text-center border-l border-r border-indigo-200 px-2">
                    <div className="text-lg font-bold text-indigo-700 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.round(analytics.medianDwellMs / 1000)}s
                    </div>
                    <div className="text-xs text-gray-600">Median Dwell</div>
                    <div className="text-xs text-gray-500 mt-1" title="How long learners view messages before dismissing">
                      Viewing time
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-indigo-700">
                      {analytics.sessionDoseP95}
                    </div>
                    <div className="text-xs text-gray-600">P95 Dose</div>
                    <div className="text-xs text-gray-500 mt-1" title="95th percentile of messages shown per session">
                      Session max
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Engagement rate (legacy - keep for compatibility) */}
            {summary.actionableShown > 0 && analytics.ctaCtr === 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">CTA Engagement Rate</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      How often learners click on Scout's suggested actions
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-700">
                      {Math.round((summary.clickedCTAs / summary.actionableShown) * 100)}%
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      {summary.clickedCTAs} of {summary.actionableShown} CTAs
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}