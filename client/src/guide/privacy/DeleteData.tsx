import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { useToast } from '../../hooks/use-toast';
import {
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Users,
  RefreshCw,
  Shield
} from 'lucide-react';

interface ErasureRequest {
  id: string;
  scope: 'learner' | 'account';
  learnerId: string | null;
  status: 'pending' | 'scheduled' | 'done' | 'canceled';
  requestedAt: number;
  dueAt: number;
  graceDaysRemaining: number;
}

interface Learner {
  id: string;
  name: string;
}

/**
 * Delete Data component for erasure/suppression requests with grace period
 * Provides guided deletion flows for learners and account with 7-day grace period
 */
export function DeleteData() {
  const [erasureRequests, setErasureRequests] = useState<ErasureRequest[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<string>('');
  const [confirmationText, setConfirmationText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLearnerConfirm, setShowLearnerConfirm] = useState(false);
  const [showAccountConfirm, setShowAccountConfirm] = useState(false);
  const { toast } = useToast();

  // Load erasure requests and learners on mount
  useEffect(() => {
    loadErasureRequests();
    loadLearners();
  }, []);

  const loadErasureRequests = async () => {
    try {
      const response = await fetch('/api/erasure', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch erasure requests');
      }
      
      const data = await response.json();
      setErasureRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to load erasure requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load erasure requests',
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

  const submitLearnerDeletion = async () => {
    if (!selectedLearner || !confirmationText) return;

    const learner = learners.find(l => l.id === selectedLearner);
    if (!learner) return;

    // Verify confirmation text matches learner name or ID
    if (confirmationText !== learner.name && confirmationText !== learner.id) {
      toast({
        title: 'Confirmation Failed',
        description: 'Please type the learner name or ID exactly as shown',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/erasure/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          scope: 'learner',
          learnerId: selectedLearner
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create erasure request');
      }

      toast({
        title: 'Deletion Scheduled',
        description: `Learner deletion scheduled for 7 days from now. You can cancel within the grace period.`,
      });

      setShowLearnerConfirm(false);
      setSelectedLearner('');
      setConfirmationText('');
      await loadErasureRequests();
    } catch (error: any) {
      toast({
        title: 'Deletion Request Failed',
        description: error.message || 'Failed to schedule deletion',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAccountDeletion = async () => {
    if (confirmationText !== 'DELETE ACCOUNT') {
      toast({
        title: 'Confirmation Failed',
        description: 'Please type "DELETE ACCOUNT" exactly as shown',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/erasure/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          scope: 'account'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create erasure request');
      }

      toast({
        title: 'Account Deletion Scheduled',
        description: `Account deletion scheduled for 7 days from now. You can cancel within the grace period.`,
      });

      setShowAccountConfirm(false);
      setConfirmationText('');
      await loadErasureRequests();
    } catch (error: any) {
      toast({
        title: 'Deletion Request Failed',
        description: error.message || 'Failed to schedule deletion',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelErasureRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this deletion request?')) {
      return;
    }

    try {
      const response = await fetch(`/api/erasure/${requestId}/cancel`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel erasure request');
      }
      
      toast({
        title: 'Deletion Canceled',
        description: 'The deletion request has been canceled successfully.',
      });

      await loadErasureRequests();
    } catch (error: any) {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel deletion request',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (request: ErasureRequest) => {
    switch (request.status) {
      case 'scheduled':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
          <Clock className="h-3 w-3 mr-1" />
          Scheduled ({request.graceDaysRemaining}d remaining)
        </Badge>;
      case 'done':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>;
      case 'canceled':
        return <Badge variant="outline" className="text-gray-600 border-gray-200 bg-gray-50">
          <XCircle className="h-3 w-3 mr-1" />
          Canceled
        </Badge>;
      default:
        return null;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const selectedLearnerData = learners.find(l => l.id === selectedLearner);

  return (
    <div className="space-y-6" data-testid="delete-data-panel">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Data Deletion Requests</h3>
          <p className="text-sm text-gray-600">
            Schedule data deletion with 7-day grace period for changes of mind
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={loadErasureRequests}
          data-testid="refresh-erasure-requests-button"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Warning Notice */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">Permanent Data Deletion</h3>
              <p className="text-sm text-red-800 mt-1">
                Deletion requests cannot be undone after the 7-day grace period expires. 
                All learner data, progress, and journal entries will be permanently removed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Delete Learner */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              Delete a Learner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Permanently remove all data for a specific learner including progress, journal entries, and assignments.
            </p>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Select Learner</label>
              <select 
                value={selectedLearner}
                onChange={(e) => setSelectedLearner(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                data-testid="learner-select"
              >
                <option value="">Choose a learner...</option>
                {learners.map(learner => (
                  <option key={learner.id} value={learner.id}>
                    {learner.name} ({learner.id})
                  </option>
                ))}
              </select>
            </div>

            <Button 
              variant="outline" 
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
              disabled={!selectedLearner}
              onClick={() => setShowLearnerConfirm(true)}
              data-testid="delete-learner-button"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Learner Data
            </Button>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-red-600" />
              Delete My Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Permanently delete your entire teacher account and all associated learner data.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-xs text-red-800">
                <strong>This will delete:</strong> All learners, progress data, journal entries, 
                assignments, and your teacher account. This action affects your entire classroom.
              </p>
            </div>

            <Button 
              variant="outline" 
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowAccountConfirm(true)}
              data-testid="delete-account-button"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Pending Deletion Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {erasureRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No deletion requests</p>
              <p className="text-sm">Your data is safe</p>
            </div>
          ) : (
            <div className="space-y-3">
              {erasureRequests.map(request => (
                <div 
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  data-testid={`erasure-request-${request.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(request)}
                      <span className="text-xs text-gray-500 font-mono">
                        {request.id.substring(0, 8)}...
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div>
                        <strong>Scope:</strong> {request.scope === 'learner' ? 'Learner' : 'Account'}
                        {request.learnerId && ` (${request.learnerId})`}
                      </div>
                      <div>Requested: {formatDate(request.requestedAt)}</div>
                      {request.status === 'scheduled' && (
                        <div className="text-orange-600">
                          Due: {formatDate(request.dueAt)} 
                          ({request.graceDaysRemaining} days remaining)
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {request.status === 'scheduled' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => cancelErasureRequest(request.id)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      data-testid={`cancel-erasure-${request.id}`}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learner Deletion Confirmation Modal */}
      {showLearnerConfirm && selectedLearnerData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-semibold">Confirm Learner Deletion</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  You are about to schedule the deletion of <strong>{selectedLearnerData.name}</strong> 
                  ({selectedLearnerData.id}). This will permanently remove all their learning data.
                </p>
                
                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                  <p className="text-xs text-orange-800">
                    <strong>Grace Period:</strong> You have 7 days to cancel this request if you change your mind.
                    After that, the deletion will be executed automatically.
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Type the learner name or ID to confirm:
                  </label>
                  <Input
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder={`${selectedLearnerData.name} or ${selectedLearnerData.id}`}
                    data-testid="learner-confirmation-input"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowLearnerConfirm(false);
                    setConfirmationText('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitLearnerDeletion}
                  disabled={isSubmitting || !confirmationText}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  data-testid="confirm-learner-deletion"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    'Schedule Deletion'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {showAccountConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h2 className="text-xl font-semibold">Confirm Account Deletion</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  You are about to schedule the deletion of your entire teacher account. 
                  This will permanently remove all learners and data associated with your account.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-xs text-red-800">
                    <strong>WARNING:</strong> This affects your entire classroom. All learner progress, 
                    journal entries, and assignments will be permanently deleted after the 7-day grace period.
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Type "DELETE ACCOUNT" to confirm:
                  </label>
                  <Input
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="DELETE ACCOUNT"
                    data-testid="account-confirmation-input"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAccountConfirm(false);
                    setConfirmationText('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitAccountDeletion}
                  disabled={isSubmitting || confirmationText !== 'DELETE ACCOUNT'}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  data-testid="confirm-account-deletion"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    'Schedule Deletion'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Local Data Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900">Local Data Management</h3>
              <p className="text-sm text-blue-800 mt-1">
                After scheduling cloud data deletion, you may also want to clear local browser data. 
                This can be done immediately through the local data controls in the Privacy hub.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}