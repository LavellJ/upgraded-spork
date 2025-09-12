import { useState, useEffect } from 'react';
import { apiGet, type ApiResponse } from '../lib/apiGet';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { TableSkeleton } from '../ui2/Skeleton';

interface ReferralData {
  id?: string | number;
  name?: string;
  email?: string;
  status?: string;
  [key: string]: any; // Flexible structure since we don't know the exact schema
}

export function ReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);

  const fetchReferrals = async () => {
    setLoading(true);
    setError(null);

    const response: ApiResponse<ReferralData[]> = await apiGet('/api/referrals');

    if (response.ok && response.data) {
      setReferrals(Array.isArray(response.data) ? response.data : []);
    } else if (response.status === 401) {
      setError('Sign in required');
    } else {
      setError('Something went wrong');
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Referrals</h1>
        <div data-testid="loading-skeleton">
          <TableSkeleton rows={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Referrals</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="error-panel">
          <div className="text-red-600 mb-3" data-testid="error-message">{error}</div>
          {error !== 'Sign in required' && (
            <Button 
              onClick={fetchReferrals}
              variant="outline"
              size="sm"
              data-testid="retry-button"
            >
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Referrals</h1>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-600" data-testid="empty-message">No referrals yet</div>
        </div>
      </div>
    );
  }

  // Define preferred columns with fallback to available keys
  const preferredColumns = ['name', 'email', 'status'];
  const availableKeys = referrals.length > 0 ? Object.keys(referrals[0]) : [];
  const columns = preferredColumns.filter(col => availableKeys.includes(col));
  
  // If none of the preferred columns exist, use all available keys
  const displayColumns = columns.length > 0 ? columns : availableKeys;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Referrals</h1>
      
      <Table data-testid="referrals-table">
        <TableHeader>
          <TableRow>
            {displayColumns.map((column) => (
              <TableHead 
                key={column}
                data-testid={`column-header-${column}`}
              >
                {column.charAt(0).toUpperCase() + column.slice(1)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {referrals.map((referral, index) => (
            <TableRow key={referral.id || index} data-testid={`referral-row-${index}`}>
              {displayColumns.map((column) => (
                <TableCell 
                  key={column}
                  data-testid={`cell-${index}-${column}`}
                >
                  {typeof referral[column] === 'object' 
                    ? JSON.stringify(referral[column]) 
                    : String(referral[column] ?? '')
                  }
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}