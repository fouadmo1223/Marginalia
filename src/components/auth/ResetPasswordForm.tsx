import { useState } from 'react';
import { api, ApiClientError } from '../../lib/api-client';

const inputClass =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none';

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <p className="text-sm text-red-700">This reset link is missing a token. Request a new one.</p>;
  }

  if (done) {
    return (
      <div className="space-y-3 text-sm text-[var(--color-ink-soft)]">
        <p>Your password has been reset.</p>
        <a href="/login" className="block rounded-lg bg-[var(--color-ink)] py-2.5 text-center font-medium text-[var(--color-paper)]">
          Sign in
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[#c7831bd9]">New password</label>
        <input id="password" type="password" required minLength={8} className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--color-ink)] py-2.5 text-sm font-medium text-[var(--color-paper)] transition hover:bg-[var(--color-accent)] disabled:opacity-60"
      >
        {loading ? 'Resetting…' : 'Reset password'}
      </button>
    </form>
  );
}
