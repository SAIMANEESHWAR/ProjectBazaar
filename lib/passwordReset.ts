import { LOGIN_API_URL } from './apiConfig';

export interface PasswordResetResponse {
  success: boolean;
  message?: string;
  data?: {
    passwordResetSent?: boolean;
    passwordReset?: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function requestPasswordReset(email: string): Promise<PasswordResetResponse> {
  const response = await fetch(LOGIN_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'forgot_password',
      email: email.trim(),
    }),
  });
  return response.json();
}

export async function resetPassword(params: {
  userId: string;
  password: string;
  confirmPassword: string;
  code?: string;
  token?: string;
}): Promise<PasswordResetResponse> {
  const response = await fetch(LOGIN_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'reset_password',
      userId: params.userId,
      password: params.password,
      confirmPassword: params.confirmPassword,
      code: params.code,
      token: params.token,
    }),
  });
  return response.json();
}
