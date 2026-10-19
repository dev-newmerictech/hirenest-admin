// Environment-aware API URL configuration
//
// DEPLOYED: Defaults to production API (https://api.hirenest.ai).
// LOCAL DEV: Override in .env.local (gitignored) with:
//   NEXT_PUBLIC_API_URL=http://localhost:5000

const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL;

// Backend URLs by environment
const DEV_API_URL = 'https://api-dev.hirenest.ai';
const PROD_API_URL = 'https://api.hirenest.ai';

/**
 * Resolve backend API base URL:
 * 1. Explicit environment variable (e.g. localhost for development)
 * 2. If running on stage / dev subdomain (admin-stage.hirenest.ai), route to dev backend
 * 3. Deployed production admin (admin.hirenest.ai) and default: ALWAYS route to production API (https://api.hirenest.ai)
 */
export function getApiBaseUrl(): string {
  if (ENV_API_URL) return ENV_API_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('stage') || hostname.includes('dev')) {
      return DEV_API_URL;
    }
  }
  return PROD_API_URL;
}

export const API_URL = getApiBaseUrl();

// Derived environment label (for logging/debugging only)
export const CURRENT_ENV: 'local' | 'dev' | 'prod' =
  !ENV_API_URL ? 'prod' :
  ENV_API_URL.includes('localhost') ? 'local' :
  ENV_API_URL === DEV_API_URL ? 'dev' :
  'prod';
