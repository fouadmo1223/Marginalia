import { useState } from 'react';
import { api } from '../../lib/api-client';

const inputClass =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-[var(--color-ink-soft)]">
        If an account exists for <strong className="text-[var(--color-ink)]">{email}</strong>, we've sent a
        password reset link.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[#c7831bd9]">Email</label>
        <input id="email" type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--color-ink)] py-2.5 text-sm font-medium text-[var(--color-paper)] transition hover:bg-[var(--color-accent)] disabled:opacity-60"
      >
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}
