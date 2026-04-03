/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_COMPANY_POSTS_API_URL?: string;
    /** Set to `"true"` to use browser storage only (no API). */
    readonly VITE_COMPANY_POSTS_OFFLINE?: string;
    /** API Gateway URL for get_jobs_details Lambda (paginated job listings). */
    readonly VITE_GET_JOBS_DETAILS_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
