/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** HTTPS invoke URL for the Fix My Resume Lambda (production builds). Example: …/default/fix_resume_handler */
    readonly VITE_FIX_RESUME_ENDPOINT?: string;
    readonly VITE_ATS_SCORER_ENDPOINT?: string;
    /** Override login Lambda URL (default in lib/apiConfig.ts). */
    readonly VITE_LOGIN_API_URL?: string;
    readonly VITE_COMPANY_POSTS_API_URL?: string;
    /** Set to `"true"` to use browser storage only (no API). */
    readonly VITE_COMPANY_POSTS_OFFLINE?: string;
    /** API Gateway URL for get_jobs_details Lambda (paginated job listings). */
    readonly VITE_GET_JOBS_DETAILS_URL?: string;
    /** Optional: override OAuth redirect (default `${origin}/auth`). Must match Google Cloud. */
    readonly VITE_GOOGLE_REDIRECT_URI?: string;
    /** Optional GTM container ID (consent-gated loader in lib/analytics.ts). */
    readonly VITE_GTM_ID?: string;
    /** Optional GA4 measurement ID (documented; primary tag is in index.html). */
    readonly VITE_GA4_MEASUREMENT_ID?: string;
    /** UTM attribution TTL in days (default 90). */
    readonly VITE_ATTRIBUTION_TTL_DAYS?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
