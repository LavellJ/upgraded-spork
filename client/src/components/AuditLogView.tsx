// Audit log viewer for admin/guide actions
// Shows guide acknowledgement events with timestamps and details

import React, { useState } from 'react';
import { getEventsByKind, type ProgressEvent } from '../progress/events';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Clock, CheckCircle, X, Eye } from 'lucide-react';

interface AuditLogViewProps {
  className?: string;
}

export function AuditLogView({ className = '' }: AuditLogViewProps) {
  const [showDetails, setShowDetails] = useState<string | null>(null);
  
  // Get all guide acknowledgement events
  const auditEvents = getEventsByKind('guide_ack').slice(-50).reverse(); // Show last 50, newest first

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ack': return 'bg-green-100 text-green-800';
      case 'dismiss': return 'bg-red-100 text-red-800';
      case 'shown': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'ack': return <CheckCircle className="w-3 h-3" />;
      case 'dismiss': return <X className="w-3 h-3" />;
      case 'shown': return <Eye className="w-3 h-3" />;
      default: return null;
    }
  };

  const getNoticeDisplayName = (noticeId: string) => {
    const mapping: Record<string, string> = {
      'cloud-sync-enable': 'Cloud Sync Enable',
      'cloud-sync-disable': 'Cloud Sync Disable', 
      'data-import': 'Data Import',
      'data-clear-all': 'Clear All Data'
    };
    return mapping[noticeId] || noticeId;
  };

  const clearAuditLog = () => {
    if (confirm('Clear audit log? This will remove all guide acknowledgement records.')) {
      // We can't directly clear just guide_ack events, but we can note this limitation
      alert('Note: Use the main "Clear Events" in dev tools to clear all event data.');
    }
  };

  if (auditEvents.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 mb-2">📋</div>
        <p className="text-sm text-gray-600 mb-1">No audit events yet</p>
        <p className="text-xs text-gray-500">
          Guide acknowledgements will appear here when adult actions are taken
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600">
          Last {auditEvents.length} guide acknowledgement events
        </p>
        {auditEvents.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAuditLog}
            className="text-xs"
            data-testid="clear-audit-log"
          >
            Clear Log
          </Button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {auditEvents.map((event, index) => (
          <div 
            key={`${event.at}-${index}`} 
            className="bg-white border rounded-lg p-3 text-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className={`text-xs flex items-center gap-1 ${getActionColor(event.action)}`}>
                  {getActionIcon(event.action)}
                  {event.action.toUpperCase()}
                </Badge>
                <span className="font-medium text-gray-800">
                  {getNoticeDisplayName(event.noticeId)}
                </span>
              </div>
              
              <button
                onClick={() => setShowDetails(showDetails === event.noticeId ? null : event.noticeId)}
                className="text-xs text-blue-600 hover:text-blue-800"
                data-testid={`details-${event.noticeId}`}
              >
                {showDetails === event.noticeId ? 'Hide' : 'Details'}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{formatTime(event.at)}</span>
              <span>•</span>
              <span>Actor: {event.actor}</span>
            </div>

            {showDetails === event.noticeId && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                <div className="space-y-1">
                  <div><strong>Notice ID:</strong> {event.noticeId}</div>
                  <div><strong>Timestamp:</strong> {event.at}</div>
                  <div><strong>Action:</strong> {event.action}</div>
                  <div><strong>Actor:</strong> {event.actor}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}