import { useState, useEffect } from 'react';

export type ClassRole = 'owner' | 'co_teacher' | 'viewer';

export interface Collaborator {
  classId: string;
  email: string;
  role: ClassRole;
  addedAt: number;
}

export interface UseCollaboratorsReturn {
  collaborators: Collaborator[];
  loading: boolean;
  error: string | null;
  add: (email: string, role: ClassRole) => Promise<boolean>;
  remove: (email: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing class collaborators
 */
export function useCollaborators(classId: string): UseCollaboratorsReturn {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = (): string | null => {
    return localStorage.getItem('auth_token');
  };

  const makeRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  const fetchCollaborators = async (): Promise<void> => {
    if (!classId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeRequest(`/api/classes/${classId}/collaborators`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        if (response.status === 403) {
          throw new Error('Access denied');
        }
        throw new Error('Failed to fetch collaborators');
      }
      
      const data = await response.json();
      setCollaborators(data.collaborators || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching collaborators:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCollaborator = async (email: string, role: ClassRole): Promise<boolean> => {
    if (!classId) return false;
    
    setError(null);
    
    try {
      const response = await makeRequest(`/api/classes/${classId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add collaborator');
      }
      
      // Refresh the list after successful addition
      await fetchCollaborators();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error adding collaborator:', err);
      return false;
    }
  };

  const removeCollaborator = async (email: string): Promise<boolean> => {
    if (!classId) return false;
    
    setError(null);
    
    try {
      const response = await makeRequest(`/api/classes/${classId}/collaborators/${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove collaborator');
      }
      
      // Refresh the list after successful removal
      await fetchCollaborators();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error removing collaborator:', err);
      return false;
    }
  };

  // Fetch collaborators when classId changes
  useEffect(() => {
    if (classId) {
      fetchCollaborators();
    }
  }, [classId]);

  return {
    collaborators,
    loading,
    error,
    add: addCollaborator,
    remove: removeCollaborator,
    refresh: fetchCollaborators,
  };
}