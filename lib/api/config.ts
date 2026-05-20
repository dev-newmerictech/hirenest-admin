// Environment-aware API URL configuration
//
// DEPLOYED: Defaults to production API. The Docker build does NOT inject
// NEXT_PUBLIC_API_URL, so we must default to the production backend.
//
// LOCAL DEV: Override in .env.local (gitignored) with:
//   NEXT_PUBLIC_API_URL=http://localhost:5000

const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL;

// Backend URLs by environment
const DEV_API_URL = 'https://api-dev.hirenest.ai';
const PROD_API_URL = 'https://api.hirenest.ai';

// If NEXT_PUBLIC_API_URL is set (via .env.local or Docker ARG), use it.
// Otherwise default to PRODUCTION (safe for deployed builds).
export const API_URL = ENV_API_URL || PROD_API_URL;

// Derived environment label (for logging/debugging only)
export const CURRENT_ENV: 'local' | 'dev' | 'prod' =
  !ENV_API_URL ? 'prod' :
  ENV_API_URL.includes('localhost') ? 'local' :
  ENV_API_URL === DEV_API_URL ? 'dev' :
  'prod';
