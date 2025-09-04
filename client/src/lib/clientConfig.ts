/**
 * Client-side configuration management
 * Handles environment variables and provides fallbacks for development
 */

interface ClientConfig {
  APP_BASE_URL: string;
  CLOUD_ENDPOINT: string;
  NODE_ENV: string;
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
}

/**
 * Get client-side configuration from environment variables
 * Uses Vite's import.meta.env with VITE_ prefix
 */
function getClientConfig(): ClientConfig {
  const NODE_ENV = import.meta.env.MODE || 'development';
  const IS_DEVELOPMENT = NODE_ENV === 'development';
  const IS_PRODUCTION = NODE_ENV === 'production';

  // Default URLs for development
  const DEFAULT_BASE_URL = 'http://localhost:5000';
  const DEFAULT_API_ENDPOINT = 'http://localhost:5000/api';

  return {
    APP_BASE_URL: (import.meta.env.VITE_APP_BASE_URL as string) || DEFAULT_BASE_URL,
    CLOUD_ENDPOINT: (import.meta.env.VITE_CLOUD_ENDPOINT as string) || DEFAULT_API_ENDPOINT,
    NODE_ENV,
    IS_DEVELOPMENT,
    IS_PRODUCTION,
  };
}

// Export singleton instance
export const clientConfig = getClientConfig();

/**
 * Get API endpoint URL for a given path
 * @param path - API path (e.g., '/auth/login')
 * @returns Full API URL
 */
export function getApiUrl(path: string): string {
  const endpoint = clientConfig.CLOUD_ENDPOINT;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${endpoint}${cleanPath}`;
}

/**
 * Get app base URL for absolute URLs
 * @param path - App path (e.g., '/dashboard')
 * @returns Full app URL
 */
export function getAppUrl(path: string): string {
  const baseUrl = clientConfig.APP_BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Development helper to check if we're in development mode
 */
export function isDevelopment(): boolean {
  return clientConfig.IS_DEVELOPMENT;
}

/**
 * Production helper to check if we're in production mode
 */
export function isProduction(): boolean {
  return clientConfig.IS_PRODUCTION;
}