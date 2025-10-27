/**
 * API helper that automatically includes Authorization header if token exists
 */
export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function apiGet<T = any>(path: string): Promise<ApiResponse<T>> {
  try {
    // Read token from localStorage using existing auth pattern
    const authData = localStorage.getItem('qi.auth.v1');
    let token: string | undefined;
    
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        token = parsed.token;
      } catch (e) {
        console.warn('Failed to parse auth data from localStorage');
      }
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make request
    const response = await fetch(path, {
      method: 'GET',
      headers,
    });

    const result: ApiResponse<T> = {
      ok: response.ok,
      status: response.status,
    };

    // Try to parse JSON response
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result.data = await response.json();
      } else {
        result.error = 'Non-JSON response received';
      }
    } catch (e) {
      result.error = 'Failed to parse response as JSON';
    }

    return result;
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}