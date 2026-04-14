/// <reference types="vite/client" />

interface ImportMetaEnv {
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
