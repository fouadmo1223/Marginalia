import { useState } from 'react';
import { api, ApiClientError } from '../../lib/api-client';

const inputClass =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-accent)] focus:outline-none';

export default function LoginForm({ next }: { next: string }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/api/auth/login', form);
      window.location.href = next || '/dashboard';
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[#c7831bd9]">Email</label>
        <input id="email" type="email" required className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-semibold text-[#c7831bd9]">Password</label>
          <a href="/forgot-password" className="text-xs text-[var(--color-accent)] hover:underline">Forgot?</a>
        </div>
        <input id="password" type="password" required className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--color-ink)] py-2.5 text-sm font-medium text-[var(--color-paper)] transition hover:bg-[var(--color-accent)] disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
