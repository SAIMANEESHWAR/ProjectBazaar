import React, { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { useNavigation } from '../App';
import { requestPasswordReset } from '../lib/passwordReset';
import EmailVerificationShell from './EmailVerificationShell';

const ForgotPasswordPage: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('Enter the email address linked to your account.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await requestPasswordReset(email.trim());
      if (result.success) {
        setSent(true);
        setMessage(
          result.message ||
            'If an account exists for this email, we sent password reset instructions.'
        );
      } else {
        setError(result.error?.message || 'Could not send reset email. Try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EmailVerificationShell
      title="Forgot password"
      subtitle="Enter your email and we'll send a secure reset link and code."
      footerNote="Reset links expire in 30 minutes. Do not share your code."
    >
      {sent ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Mail className="h-7 w-7" />
          </div>
          <p className="text-sm text-gray-600">{message}</p>
          <button
            type="button"
            onClick={() => navigateTo('auth')}
            className="w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="forgot-email" className="mb-2 block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-xl border border-orange-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              'Send reset link'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigateTo('auth')}
            className="w-full text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            Back to sign in
          </button>
        </form>
      )}
    </EmailVerificationShell>
  );
};

export default ForgotPasswordPage;
