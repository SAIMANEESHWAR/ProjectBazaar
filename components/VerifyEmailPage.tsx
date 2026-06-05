import React, { useEffect, useState } from 'react';
import { useAuth, useNavigation } from '../App';
import { verifyEmail } from '../lib/emailVerification';

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
            setMessage(result.message || 'Your email has been verified.');
            syncLocalUserData(true);
          } else {
            setStatus('error');
            setMessage(result.error?.message || 'Verification failed. Try entering the code below.');
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
    if (!userId.trim() || !code.trim()) {
      setMessage('Enter your user ID and 6-digit code.');
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
        setMessage(result.message || 'Your email has been verified.');
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter the 6-digit code from your inbox, or use the confirmation link we sent you.
        </p>

        {status === 'verifying' && (
          <p className="text-sm text-orange-600 mb-4">Confirming your email…</p>
        )}

        {message && (
          <p
            className={`text-sm mb-4 rounded-lg px-3 py-2 ${
              status === 'success'
                ? 'bg-green-50 text-green-800'
                : status === 'error'
                  ? 'bg-red-50 text-red-800'
                  : 'bg-orange-50 text-orange-800'
            }`}
          >
            {message}
          </p>
        )}

        {status !== 'success' && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label htmlFor="verify-user-id" className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                id="verify-user-id"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="From your account"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="verify-code" className="block text-sm font-medium text-gray-700 mb-1">
                6-digit code
              </label>
              <input
                id="verify-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tracking-widest focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="123456"
                autoComplete="one-time-code"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {submitting ? 'Verifying…' : 'Verify email'}
            </button>
          </form>
        )}

        {status === 'success' && (
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Go to dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
