/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_COMPANY_POSTS_API_URL?: string;
    /** Set to `"true"` to use browser storage only (no API). */
    readonly VITE_COMPANY_POSTS_OFFLINE?: string;
    readonly VITE_AUTH_MIGRATION_MODE?: 'legacy' | 'hybrid' | 'otp';
    readonly VITE_COGNITO_USER_POOL_ID?: string;
    readonly VITE_COGNITO_USER_POOL_CLIENT_ID?: string;
    /**
     * API Gateway base URL (no trailing slash), e.g. https://xxxx.execute-api.region.amazonaws.com
     * Dev: Vite proxies `/api/*` here and strips the `/api` prefix.
     * Production: OTP requests use `${VITE_API_GATEWAY_URL}/auth/send-otp` (and verify-otp).
     */
    readonly VITE_API_GATEWAY_URL?: string;
    readonly VITE_COGNITO_REGION?: string;
    readonly VITE_LEGACY_AUTH_ENDPOINT?: string;
    /** POST endpoint for user_bootstrap_handler (Cognito → Users table sync). */
    readonly VITE_USER_BOOTSTRAP_ENDPOINT?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
