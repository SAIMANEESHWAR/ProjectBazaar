/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** HTTPS invoke URL for the Fix My Resume Lambda (production builds). Example: …/default/fix_resume_handler */
    readonly VITE_FIX_RESUME_ENDPOINT?: string;
    readonly VITE_ATS_SCORER_ENDPOINT?: string;
    readonly VITE_COMPANY_POSTS_API_URL?: string;
    /** Set to `"true"` to use browser storage only (no API). */
    readonly VITE_COMPANY_POSTS_OFFLINE?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
