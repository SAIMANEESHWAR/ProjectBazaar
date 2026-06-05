import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth, useNavigation } from '../App';
import { verifyEmail } from '../lib/emailVerification';
import EmailVerificationShell from './EmailVerificationShell';
import VerificationCodeInput from './VerificationCodeInput';

type Status = 'idle' | 'verifying' | 'success' | 'error';

const VerifyEmailPage: React.FC = () => {
  const { userId: authUserId } = useAuth();
  const { navigateTo } = useNavigation();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token')?.trim();
    const urlUserId = params.get('userId')?.trim();

    if (urlUserId) {
      setUserId(urlUserId);
    } else if (authUserId) {
      setUserId(authUserId);
    }

    if (token && urlUserId) {
      setStatus('verifying');
      verifyEmail({ userId: urlUserId, token })
        .then((result) => {
          if (result.success) {
            setStatus('success');
            setMessage(result.message || 'Your email has been verified successfully.');
            syncLocalUserData(true);
          } else {
            setStatus('error');
            setMessage(result.error?.message || 'Verification failed. Enter the 6-digit code below.');
          }
        })
        .catch(() => {
          setStatus('error');
          setMessage('Network error. Please try again.');
        });
    }
  }, [authUserId]);

  const syncLocalUserData = (verified: boolean) => {
    try {
      const raw = localStorage.getItem('userData');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        data.emailVerified = verified;
        localStorage.setItem('userData', JSON.stringify(data));
      }
    } catch {
      /* ignore */
    }
  };

  const handleCodeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId.trim() || code.length !== 6) {
      setMessage('Enter your user ID and the full 6-digit code from your email.');
      setStatus('error');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const result = await verifyEmail({
        userId: userId.trim(),
        code: code.trim(),
      });
      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Your email has been verified successfully.');
        syncLocalUserData(true);
      } else {
        setStatus('error');
        setMessage(result.error?.message || 'Invalid or expired code.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EmailVerificationShell
      title="Verify your email"
      subtitle="Enter the 6-digit code from your inbox or use the secure link we sent you."
      footerNote="Codes expire in 15 minutes. Do not share your verification code."
    >
      {status === 'verifying' && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Confirming your email…
        </div>
      )}

      {message && (
        <div
          className={`mb-5 rounded-xl px-4 py-3 text-sm ${
            status === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : status === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-orange-50 text-orange-800 border border-orange-200'
          }`}
        >
          {status === 'success' && (
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Verified
            </div>
          )}
          {message}
        </div>
      )}

      {status === 'success' ? (
        <button
          type="button"
          onClick={() => navigateTo('dashboard')}
          className="w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700"
        >
          Go to dashboard
        </button>
      ) : (
        <form onSubmit={handleCodeSubmit} className="space-y-6">
          <div>
            <label htmlFor="verify-user-id" className="mb-2 block text-sm font-medium text-gray-700">
              User ID
            </label>
            <input
              id="verify-user-id"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-xl border border-orange-200 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              placeholder="From your account"
              autoComplete="off"
            />
          </div>

          <div>
            <p className="mb-3 text-center text-sm font-medium text-gray-700">Your verification code</p>
            <VerificationCodeInput value={code} onChange={setCode} disabled={submitting} />
            <p className="mt-3 text-center text-xs text-gray-500">Check your inbox for the branded CodeXCareer email.</p>
          </div>

          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60"
          >
            {submitting ? 'Verifying…' : 'Verify email'}
          </button>
        </form>
      )}
    </EmailVerificationShell>
  );
};

export default VerifyEmailPage;
