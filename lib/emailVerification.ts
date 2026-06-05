import { LOGIN_API_URL } from './apiConfig';

export interface EmailVerificationResponse {
  success: boolean;
  message?: string;
  data?: {
    emailVerified?: boolean;
    emailVerificationSent?: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function sendEmailVerification(
  userId: string
): Promise<EmailVerificationResponse> {
  const response = await fetch(LOGIN_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'send_email_verification',
      userId,
    }),
  });
  return response.json();
}

export async function verifyEmail(params: {
  userId: string;
  code?: string;
  token?: string;
}): Promise<EmailVerificationResponse> {
  const response = await fetch(LOGIN_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'verify_email',
      userId: params.userId,
      code: params.code,
      token: params.token,
    }),
  });
  return response.json();
}
