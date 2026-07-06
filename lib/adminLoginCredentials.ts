export interface LoginCredentialFields {
  passwordHash?: string;
  passwordSalt?: string;
  viewablePassword?: string;
  email?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdBy?: string;
}

export function getLoginMethod(user: LoginCredentialFields): string {
  if (user.createdBy?.toLowerCase().includes('google')) return 'Google OAuth';
  if (user.passwordHash || user.viewablePassword) return 'Email & password';
  return 'Not set';
}

export function getAdminPasswordDisplay(user: LoginCredentialFields): {
  text: string;
  isPlaintext: boolean;
  isSet: boolean;
  needsAdminSet: boolean;
} {
  if (user.viewablePassword) {
    return { text: user.viewablePassword, isPlaintext: true, isSet: true, needsAdminSet: false };
  }
  if (!user.passwordHash) {
    return { text: 'Not set (Google sign-in or no password)', isPlaintext: false, isSet: false, needsAdminSet: false };
  }
  if (!user.passwordSalt) {
    return { text: user.passwordHash, isPlaintext: true, isSet: true, needsAdminSet: false };
  }
  return {
    text: 'Not available — set a new password below to view it',
    isPlaintext: false,
    isSet: true,
    needsAdminSet: true,
  };
}
