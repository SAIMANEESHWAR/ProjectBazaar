/**
 * Central place for API base URLs. Override in `.env.local` for different stages.
 */
export const SITE_ORIGIN = 'https://codexcareer.com';

/** Login / signup Lambda (API Gateway). */
export const LOGIN_API_URL =
  import.meta.env.VITE_LOGIN_API_URL?.trim() ||
  'https://xlxus7dr78.execute-api.ap-south-2.amazonaws.com/User_login_signup';

/** Subscription Lambda — override with VITE_SUBSCRIPTION_API_URL in .env.local */
export const SUBSCRIPTION_API_URL =
  import.meta.env.VITE_SUBSCRIPTION_API_URL?.trim() ||
  'https://rnu2gfl2z1.execute-api.ap-south-2.amazonaws.com/default/UserSubscriptions_handler';

/** Feature entitlement Lambda (5 free uses / trial gating) — lambda/feature_entitlement.py */
export const FEATURE_ENTITLEMENT_API_URL =
  import.meta.env.VITE_FEATURE_ENTITLEMENT_API_URL?.trim() ||
  'https://99j6d2af9b.execute-api.ap-south-2.amazonaws.com/default/feature_entitlement';
