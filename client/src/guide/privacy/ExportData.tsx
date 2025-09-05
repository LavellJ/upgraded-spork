import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from '../../lib/queryClient';
import {
  Download,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  RefreshCw
} from 'lucide-react';

interface ExportRequest {
  id: string;
  status: 'pending' | 'ready' | 'error' | 'purged';
  createdAt: number;
  readyAt: number | null;
  error: string | null;
  learnerCount: number;
}

interface Learner {
  id: string;
  name: string;
}

/**
 * Export Data component for DSAR (Data Subject Access Request) functionality
 * Allows teachers to request and download complete data exports for compliance
 */
export function ExportData() {
  const [exportRequests, setExportRequests] = useState<ExportRequest[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearners, setSelectedLearners] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const { toast } = useToast();

  // Load export requests and learners on mount
  useEffect(() => {
    loadExportRequests();
    loadLearners();
  }, []);

  const loadExportRequests = async () => {
    try {
      const response = await fetch('/api/dsar', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch export requests');
      }
      
      const data = await response.json();
      setExportRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to load export requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load export requests',
        variant: 'destructive'
      });
    }
  };

  const loadLearners = async () => {
    try {
      // TODO: Replace with actual learners API endpoint
      // For now, we'll use mock data or local storage
      const mockLearners = [
        { id: 'learner-1', name: 'Student A' },
        { id: 'learner-2', name: 'Student B' },
        { id: 'learner-3', name: 'Student C' }
      ];
      setLearners(mockLearners);
    } catch (error) {
      console.error('Failed to load learners:', error);
    }
  };

  const createExportRequest = async () => {
    setIsCreatingRequest(true);
    try {
      const response = await fetch('/api/dsar/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          learnerIds: selectedLearners.length > 0 ? selectedLearners : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create export request');
      }

      toast({
        title: 'Export Request Created',
        description: 'Your data export request has been created and is being processed.',
      });

      setSelectedLearners([]);
      await loadExportRequests();
    } catch (error: any) {
      toast({
        title: 'Export Request Failed',
        description: error.message || 'Failed to create export request',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingRequest(false);
    }
  };

  const downloadExport = async (requestId: string) => {
    try {
      // Create download link
      const response = await fetch(`/api/dsar/${requestId}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dsar-export-${requestId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Download Started',
        description: 'Your export file is downloading.',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download export file',
        variant: 'destructive'
      });
    }
  };

  const purgeExport = async (requestId: string) => {
    if (!confirm('Are you sure you want to permanently delete this export? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/dsar/${requestId}/purge`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to purge export');
      }
      
      toast({
        title: 'Export Purged',
        description: 'The export has been permanently deleted.',
      });

      await loadExportRequests();
    } catch (error: any) {
      toast({
        title: 'Purge Failed',
        description: error.message || 'Failed to purge export',
        variant: 'destructive'
      });
    }
  };

  const toggleLearnerSelection = (learnerId: string) => {
    setSelectedLearners(prev => 
      prev.includes(learnerId) 
        ? prev.filter(id => id !== learnerId)
        : [...prev, learnerId]
    );
  };

  const selectAllLearners = () => {
    setSelectedLearners(learners.map(l => l.id));
  };

  const clearSelection = () => {
    setSelectedLearners([]);
  };

  const getStatusBadge = (status: ExportRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'ready':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ready
        </Badge>;
      case 'error':
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>;
      case 'purged':
        return <Badge variant="outline" className="text-gray-600 border-gray-200 bg-gray-50">
          <Trash2 className="h-3 w-3 mr-1" />
          Purged
        </Badge>;
      default:
        return null;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6" data-testid="export-data-panel">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Data Export Requests</h3>
          <p className="text-sm text-gray-600">
            Export learner data for compliance, backups, or migration
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={loadExportRequests}
          data-testid="refresh-requests-button"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Create New Export Request */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Create Export Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Learner Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Select Learners</label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={selectAllLearners}
                  data-testid="select-all-learners-button"
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearSelection}
                  data-testid="clear-selection-button"
                >
                  Clear
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
              {learners.length === 0 ? (
                <div className="col-span-2 text-sm text-gray-500 text-center py-4">
                  No learners found
                </div>
              ) : (
                learners.map(learner => (
                  <label 
                    key={learner.id} 
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLearners.includes(learner.id)}
                      onChange={() => toggleLearnerSelection(learner.id)}
                      className="rounded"
                      data-testid={`learner-checkbox-${learner.id}`}
                    />
                    <span className="text-sm">{learner.name}</span>
                  </label>
                ))
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Leave empty to export all learners ({learners.length} total)
            </p>
          </div>

          {/* Create Request Button */}
          <div className="flex items-center gap-3">
            <Button 
              onClick={createExportRequest}
              disabled={isCreatingRequest}
              data-testid="create-export-request-button"
            >
              {isCreatingRequest ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Request Export
                </>
              )}
            </Button>
            
            {selectedLearners.length > 0 && (
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {selectedLearners.length} selected
              </Badge>
            )}
          </div>

          {/* Rate Limit Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-xs text-blue-800">
              <strong>Rate Limits:</strong> Maximum 3 active requests per user, 1 request per hour.
              Exports include learner data, account information, and audit logs (last 180 days).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export History</CardTitle>
        </CardHeader>
        <CardContent>
          {exportRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Download className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No export requests yet</p>
              <p className="text-sm">Create your first export request above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exportRequests.map(request => (
                <div 
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  data-testid={`export-request-${request.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(request.status)}
                      <span className="text-xs text-gray-500 font-mono">
                        {request.id.substring(0, 8)}...
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div>Created: {formatDate(request.createdAt)}</div>
                      {request.readyAt && (
                        <div>Ready: {formatDate(request.readyAt)}</div>
                      )}
                      <div>Learners: {request.learnerCount}</div>
                      {request.error && (
                        <div className="text-red-600 mt-1">Error: {request.error}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {request.status === 'ready' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadExport(request.id)}
                        data-testid={`download-export-${request.id}`}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                    
                    {(request.status === 'ready' || request.status === 'error') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => purgeExport(request.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        data-testid={`purge-export-${request.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Purge
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}