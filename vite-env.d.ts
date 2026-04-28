/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Override login Lambda URL (default in lib/apiConfig.ts). */
    readonly VITE_LOGIN_API_URL?: string;
    readonly VITE_COMPANY_POSTS_API_URL?: string;
    /** Set to `"true"` to use browser storage only (no API). */
    readonly VITE_COMPANY_POSTS_OFFLINE?: string;
    /** API Gateway URL for get_jobs_details Lambda (paginated job listings). */
    readonly VITE_GET_JOBS_DETAILS_URL?: string;
    /** Optional: override OAuth redirect (default `${origin}/auth`). Must match Google Cloud. */
    readonly VITE_GOOGLE_REDIRECT_URI?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
