// Vite React provide an environment variable called MODE
// Start on local (MODE = "development"): npm run dev ->
// Start on production (MODE = "production"): npm run build → npm run preview
// In production, these exports used for calling the nginx proxy after docker built
const AUTH_BASE_URL = import.meta.env.MODE === 'production' ? '/api/v1' : 'http://localhost:9090/api/v1';
const API_BASE_URL = import.meta.env.MODE === 'production' ? '/api/v1' : 'http://localhost:8003/api/v1';

// Export API URL Prefixes
export const AUTH_API_URL_PREFIX = `${AUTH_BASE_URL}/authentications`;
export const RECRUITMENT_API_URL_PREFIX = `${API_BASE_URL}/recruitment`;
