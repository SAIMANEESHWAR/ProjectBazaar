import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigation } from '../App';
import { resetPassword } from '../lib/passwordReset';
import EmailVerificationShell from './EmailVerificationShell';
import VerificationCodeInput from './VerificationCodeInput';

const passwordRequirements = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /\d/.test(p) },
  {
    id: 'special',
    label: 'One special character',
    test: (p: string) => /[@$!%*?&#^()_+=\-\[\]{}|\\:;"'<>,./]/.test(p),
  },
];

const ResetPasswordPage: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [userId, setUserId] = useState('');
  const [token, setToken] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [useCodeFlow, setUseCodeFlow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUserId = params.get('userId')?.trim() || '';
    const urlToken = params.get('token')?.trim() || '';
    if (urlUserId) setUserId(urlUserId);
    if (urlToken) setToken(urlToken);
    if (!urlToken) setUseCodeFlow(true);
  }, []);

  const passwordValid = passwordRequirements.every((req) => req.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit =
    userId.trim() &&
    passwordValid &&
    passwordsMatch &&
    (token.trim() || code.length === 6);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError('Complete all fields with a valid password and reset code or link.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage('');

    try {
      const result = await resetPassword({
        userId: userId.trim(),
        password,
        confirmPassword,
        ...(token.trim() ? { token: token.trim() } : { code }),
      });

      if (result.success) {
        setSuccess(true);
        setMessage(result.message || 'Your password has been reset. You can sign in now.');
      } else {
        setError(result.error?.message || 'Could not reset password. Request a new link.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const unmetRequirements = passwordRequirements.filter((req) => !req.test(password));

  return (
    <EmailVerificationShell
      title="Reset password"
      subtitle="Choose a new password for your CodeXCareer account."
      footerNote="If you did not request a reset, ignore this page and your password will stay the same."
    >
      {success ? (
        <div className="space-y-5 text-center">
          <div className="flex items-center justify-center gap-2 text-green-700 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            Password updated
          </div>
          <p className="text-sm text-gray-600">{message}</p>
          <button
            type="button"
            onClick={() => navigateTo('auth')}
            className="w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700"
          >
            Sign in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {!token && (
            <div>
              <label htmlFor="reset-user-id" className="mb-2 block text-sm font-medium text-gray-700">
                User ID
              </label>
              <input
                id="reset-user-id"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-xl border border-orange-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="From your reset email"
                autoComplete="off"
              />
            </div>
          )}

          {useCodeFlow && !token && (
            <div>
              <p className="mb-3 text-center text-sm font-medium text-gray-700">Reset code</p>
              <VerificationCodeInput
                value={code}
                onChange={setCode}
                disabled={submitting}
                idPrefix="reset-code"
              />
            </div>
          )}

          {token && (
            <p className="rounded-xl bg-orange-50 px-4 py-3 text-center text-sm text-orange-800">
              Secure reset link detected. Enter your new password below.
            </p>
          )}

          <div>
            <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-gray-700">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-xl border border-orange-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
            {password && unmetRequirements.length > 0 && (
              <div className="mt-2 space-y-1">
                {unmetRequirements.map((req) => (
                  <p key={req.id} className="text-xs text-red-500">
                    {req.label}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-gray-700">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-xl border border-orange-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="mt-2 text-xs text-red-500">Passwords do not match.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              'Reset password'
            )}
          </button>

          <button
            type="button"
            onClick={() => navigateTo('forgotPassword')}
            className="w-full text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            Request a new reset link
          </button>
        </form>
      )}
    </EmailVerificationShell>
  );
};

export default ResetPasswordPage;
