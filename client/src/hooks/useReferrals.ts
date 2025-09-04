import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

export interface Referral {
  code: string;
  url: string;
  ownerEmail: string;
  createdAt: number;
  clicks: number;
  lastClickAt: number | null;
}

export function useReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch referrals from server
  const fetchReferrals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/referrals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReferrals(data.referrals || []);
      } else {
        const errorMessage = data.error || 'Failed to fetch referrals';
        setError(errorMessage);
        console.error('Error fetching referrals:', errorMessage);
      }
    } catch (err) {
      const errorMessage = 'Failed to fetch referrals. Please try again.';
      setError(errorMessage);
      console.error('Error fetching referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new referral
  const createReferral = async (): Promise<Referral | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/referrals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh the list to include the new referral
        await fetchReferrals();
        
        toast({
          kind: 'success',
          text: 'Referral link created successfully!'
        });
        
        // Return the created referral data
        return {
          code: data.code,
          url: data.url,
          ownerEmail: '', // Will be filled by fetchReferrals
          createdAt: Date.now(),
          clicks: 0,
          lastClickAt: null
        };
      } else {
        const errorMessage = data.error || 'Failed to create referral';
        setError(errorMessage);
        toast({
          kind: 'error',
          text: errorMessage
        });
        return null;
      }
    } catch (err) {
      const errorMessage = 'Failed to create referral. Please try again.';
      setError(errorMessage);
      console.error('Error creating referral:', err);
      toast({
        kind: 'error',
        text: errorMessage
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a referral
  const deleteReferral = async (code: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/referrals/${code}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Remove from local state
        setReferrals(prev => prev.filter(r => r.code !== code));
        
        toast({
          kind: 'success',
          text: 'Referral link deleted successfully!'
        });
        return true;
      } else {
        const errorMessage = data.error || 'Failed to delete referral';
        setError(errorMessage);
        toast({
          kind: 'error',
          text: errorMessage
        });
        return false;
      }
    } catch (err) {
      const errorMessage = 'Failed to delete referral. Please try again.';
      setError(errorMessage);
      console.error('Error deleting referral:', err);
      toast({
        kind: 'error',
        text: errorMessage
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Load referrals on component mount
  useEffect(() => {
    fetchReferrals();
  }, []);

  return {
    referrals,
    loading,
    error,
    createReferral,
    deleteReferral,
    refresh: fetchReferrals
  };
}