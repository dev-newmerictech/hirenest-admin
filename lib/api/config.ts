// Manual flag to set the active environment
// Options: 'local' | 'dev' | 'prod'
export const CURRENT_ENV: 'local' | 'dev' | 'prod' = 'local';

// Environment-specific Backend URLs
const LOCAL_API_URL = 'http://localhost:5000';
const DEV_API_URL = 'https://api-dev.hirenest.ai';
const PROD_API_URL = 'https://api.hirenest.ai';

// Final API Base URL to be used across the application
export const API_URL =
  CURRENT_ENV === 'local' ? LOCAL_API_URL :
  CURRENT_ENV === 'dev' ? DEV_API_URL :
  PROD_API_URL;
