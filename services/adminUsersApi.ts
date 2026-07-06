import { extractAttributionFromUser, type UserAttribution } from '../lib/userAttribution';

const GET_ALL_USERS_ENDPOINT =
  'https://m81g90npsf.execute-api.ap-south-2.amazonaws.com/default/Get_All_users_for_admin';

export interface AdminApiUser {
  userId: string;
  email: string;
  fullName?: string;
  role?: string;
  status?: string;
  isPremium?: boolean;
  credits?: number;
  projectsCount?: number;
  totalPurchases?: number;
  createdAt?: string;
  lastLoginAt?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  accountLockedUntil?: string | null;
  createdBy?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  landingPage?: string;
  signupReferrer?: string;
  attributionCapturedAt?: string;
  passwordHash?: string;
  passwordSalt?: string;
  viewablePassword?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  loginCount?: number;
}

export interface AdminUsersResponse {
  success: boolean;
  data?: AdminApiUser[];
  error?: string;
}

export async function fetchAllAdminUsers(): Promise<AdminApiUser[]> {
  const response = await fetch(GET_ALL_USERS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', action: 'GET_ALL_USERS' }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
  }

  const data: AdminUsersResponse = await response.json();
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.error || 'Invalid response from admin users API');
  }

  return data.data;
}

export function getUserAttribution(user: AdminApiUser | object): UserAttribution {
  return extractAttributionFromUser(user);
}

export async function adminSetUserPassword(userId: string, password: string): Promise<string> {
  const response = await fetch(GET_ALL_USERS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'admin',
      action: 'ADMIN_SET_PASSWORD',
      userId,
      password,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to set password');
  }
  return data.viewablePassword || password;
}
