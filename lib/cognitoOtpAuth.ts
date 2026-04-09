import { setAuthSession } from './authSession';

export type OtpChannel = 'email' | 'sms';

let pendingOtp: {
  session: string;
  challengeName: string;
  username: string;
} | null = null;

const OTP_MIGRATION_MODE = (import.meta.env.VITE_AUTH_MIGRATION_MODE || 'hybrid').toLowerCase();

/**
 * Dev: same-origin `/api/auth/*` → Vite proxies to `VITE_API_GATEWAY_URL` with `/api` stripped.
 * Production: call API Gateway directly (`/auth/*` on the gateway base URL).
 */
function authEndpoint(path: 'send-otp' | 'verify-otp'): string {
  if (import.meta.env.DEV) {
    return `/api/auth/${path}`;
  }
  const gw = (import.meta.env.VITE_API_GATEWAY_URL || '').trim().replace(/\/$/, '');
  if (gw) {
    return `${gw}/auth/${path}`;
  }
  return `/api/auth/${path}`;
}

export function isOtpAuthEnabled(): boolean {
  return OTP_MIGRATION_MODE === 'otp' || OTP_MIGRATION_MODE === 'hybrid';
}

/** No browser Cognito SDK; OTP is handled by Lambda (see lambda/auth_otp_handler.py). */
export function configureCognitoAuth(): void {}

export function getCognitoConfigError(): string | null {
  if (!isOtpAuthEnabled()) return 'OTP auth is disabled by migration mode.';
  if (!import.meta.env.VITE_COGNITO_USER_POOL_ID) {
    return 'Missing VITE_COGNITO_USER_POOL_ID';
  }
  if (!import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID) {
    return 'Missing VITE_COGNITO_USER_POOL_CLIENT_ID';
  }
  if (!(import.meta.env.VITE_API_GATEWAY_URL || '').trim()) {
    return 'Missing VITE_API_GATEWAY_URL (API Gateway base URL for OTP proxy + production calls)';
  }
  return null;
}

export async function requestOtpCode(channel: OtpChannel, identifier: string) {
  const configError = getCognitoConfigError();
  if (configError) {
    throw new Error(configError);
  }

  const res = await fetch(authEndpoint('send-otp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, identifier }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    session?: string;
    challengeName?: string;
    username?: string;
  };

  if (!res.ok) {
    throw new Error(data.error || `OTP request failed (${res.status})`);
  }

  if (!data.session || !data.challengeName || !data.username) {
    throw new Error('Invalid response from auth server');
  }

  pendingOtp = {
    session: data.session,
    challengeName: data.challengeName,
    username: data.username,
  };

  return data.challengeName;
}

export async function verifyOtpCode(code: string) {
  if (!pendingOtp) {
    throw new Error('No pending OTP session. Request a new code.');
  }

  const body = {
    username: pendingOtp.username,
    session: pendingOtp.session,
    challengeName: pendingOtp.challengeName,
    code: code.trim(),
  };

  const res = await fetch(authEndpoint('verify-otp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    idToken?: string;
    accessToken?: string;
    refreshToken?: string;
  };

  if (!res.ok) {
    throw new Error(data.error || `Verification failed (${res.status})`);
  }

  if (!data.idToken || !data.accessToken) {
    throw new Error('Invalid response from auth server');
  }

  pendingOtp = null;

  setAuthSession('cognito', {
    idToken: data.idToken,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return { success: true as const, idToken: data.idToken, accessToken: data.accessToken };
}

export async function logoutCognitoIfActive(): Promise<void> {
  pendingOtp = null;
}
