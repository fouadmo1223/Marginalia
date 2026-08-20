import { useState } from 'react';
import { api, ApiClientError } from '../../lib/api-client';

const inputClass =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-accent)] focus:outline-none';

export default function RegisterForm() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/api/auth/register', form);
      window.location.href = '/dashboard';
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
        <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-[#c7831bd9]">Name</label>
        <input id="name" required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-[#c7831bd9]">Username</label>
        <input id="username" required pattern="[a-zA-Z0-9_]+" minLength={3} className={inputClass} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[#c7831bd9]">Email</label>
        <input id="email" type="email" required className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[#c7831bd9]">Password</label>
        <input id="password" type="password" required minLength={8} className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <p className="mt-1.5 text-xs text-[var(--color-ink-soft)]">At least 8 characters, with an uppercase letter, lowercase letter, and a number.</p>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--color-ink)] py-2.5 text-sm font-medium text-[var(--color-paper)] transition hover:bg-[var(--color-accent)] disabled:opacity-60"
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
