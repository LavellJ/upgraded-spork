import { useState, useEffect } from 'react';
import { apiGet, type ApiResponse } from '../lib/apiGet';

interface ReferralData {
  [key: string]: any; // Flexible structure since we don't know the exact schema
}

export function ReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);

  useEffect(() => {
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

    fetchReferrals();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Referrals</h1>
        <div className="text-gray-600" data-testid="loading-message">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Referrals</h1>
        <div className="text-red-600" data-testid="error-message">{error}</div>
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Referrals</h1>
        <div className="text-gray-600" data-testid="empty-message">No referrals yet</div>
      </div>
    );
  }

  // Get column headers from the first referral object
  const columns = Object.keys(referrals[0]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Referrals</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200" data-testid="referrals-table">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((column) => (
                <th 
                  key={column}
                  className="px-4 py-2 text-left border-b font-medium text-gray-700"
                  data-testid={`column-header-${column}`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {referrals.map((referral, index) => (
              <tr key={index} className="hover:bg-gray-50" data-testid={`referral-row-${index}`}>
                {columns.map((column) => (
                  <td 
                    key={column}
                    className="px-4 py-2 border-b text-gray-900"
                    data-testid={`cell-${index}-${column}`}
                  >
                    {typeof referral[column] === 'object' 
                      ? JSON.stringify(referral[column]) 
                      : String(referral[column] || '')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}