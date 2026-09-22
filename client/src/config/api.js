// Centralized API configuration supporting Split Hosting (Vercel Frontend + Render Backend)

// When deployed on Vercel, set the environment variable REACT_APP_API_URL to your Render backend URL:
// e.g. REACT_APP_API_URL=https://medicine-reminder-backend.onrender.com
// In local development, it defaults to '' (using package.json proxy) or http://localhost:5000

export const API_HOST = process.env.REACT_APP_API_URL || '';

export const API_REMININDERS = `${API_HOST}/api/reminders`;
export const API_HISTORY = `${API_HOST}/api/history`;
export const API_AUTH = `${API_HOST}/api/auth`;
export const API_CAREGIVER = `${API_HOST}/api/caregiver`;
export const API_PATIENT = `${API_HOST}/api/patient`;
export const API_HEALTH = `${API_HOST}/api/health`;
