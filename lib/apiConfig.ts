/**
 * Central place for API base URLs. Override in `.env.local` for different stages.
 */
export const SITE_ORIGIN = 'https://codexcareer.com';

/** Login / signup Lambda (API Gateway). */
export const LOGIN_API_URL =
  import.meta.env.VITE_LOGIN_API_URL?.trim() ||
  'https://xlxus7dr78.execute-api.ap-south-2.amazonaws.com/User_login_signup';
