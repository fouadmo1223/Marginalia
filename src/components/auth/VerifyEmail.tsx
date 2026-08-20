import { useEffect, useState } from 'react';
import { api, ApiClientError } from '../../lib/api-client';

export default function VerifyEmail({ token }: { token: string }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing a token.');
      return;
    }
    api
      .post('/api/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof ApiClientError ? err.message : 'Something went wrong');
      });
  }, [token]);

  if (status === 'loading') return <p className="text-sm text-[var(--color-ink-soft)]">Verifying your email…</p>;
  if (status === 'error') return <p className="text-sm text-red-700">{message}</p>;
  return (
    <div className="space-y-3 text-sm">
      <p className="text-[var(--color-ink)]">Your email has been verified.</p>
      <a href="/dashboard" className="block rounded-lg bg-[var(--color-ink)] py-2.5 text-center font-medium text-[var(--color-paper)]">
        Go to dashboard
      </a>
    </div>
  );
}
