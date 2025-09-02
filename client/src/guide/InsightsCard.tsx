// Insights card for Guide view showing Scout intervention summary

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { MessageSquare, Target, MousePointer, X } from 'lucide-react';
import { getEventsRange, scoutSummary, type ScoutSummary } from '../progress';

interface InsightsCardProps {
  timeRange?: 7 | 30 | 90;
  className?: string;
}

export function InsightsCard({ timeRange = 7, className = '' }: InsightsCardProps) {
  const events = getEventsRange(timeRange);
  
  const summary: ScoutSummary = useMemo(() => {
    return scoutSummary(events, timeRange);
  }, [events, timeRange]);

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

  if (!hasData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Scout Interventions ({timeRange} days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No Scout interventions in this period.</p>
            <p className="text-xs mt-1">Scout messages will appear here when they're shown to learners.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Scout Interventions ({timeRange} days)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
          <div>
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

        {/* Engagement rate */}
        {summary.actionableShown > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
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
      </CardContent>
    </Card>
  );
}