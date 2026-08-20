import { useEffect, useState, type CSSProperties } from 'react';
import { api } from '../../lib/api-client';

interface AdminReport {
  _id: string;
  targetType: 'user' | 'blog' | 'comment';
  targetId: string;
  reason: string;
  details: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  reporter: { username: string; name: string } | null;
}

const STATUS_COLORS: Record<AdminReport['status'], string> = {
  PENDING: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  REVIEWED: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
  RESOLVED: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  REJECTED: 'bg-[var(--color-surface-raised)] text-[var(--color-ink-soft)]',
};

export default function AdminReportsQueue() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ limit: '30' });
    if (status) params.set('status', status);
    const data = await api.get<{ reports: AdminReport[] }>(`/api/admin/reports?${params}`);
    setReports(data.reports);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function act(id: string, newStatus: AdminReport['status'], action: 'none' | 'delete_content' | 'disable_user' = 'none') {
    setBusy(id);
    try {
      await api.patch(`/api/admin/reports/${id}`, { status: newStatus, action });
      setReports((prev) => prev.filter((r) => r._id !== id));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-[var(--color-border)]">
        {(['PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              status === s ? 'border-[var(--color-accent)] text-[var(--color-ink-strong)]' : 'border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-[var(--color-ink-soft)]">Loading…</p>}
      {!loading && reports.length === 0 && (
        <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-10 text-center text-sm text-[var(--color-ink-soft)]">No reports here.</p>
      )}

      <ul className="space-y-3">
        {reports.map((r, i) => (
          <li
            key={r._id}
            className="stagger-in rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
            style={{ '--stagger-i': i } as CSSProperties}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">{r.targetType}</span>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink-strong)]">{r.reason}</p>
                {r.details && <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{r.details}</p>}
                <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                  Reported by {r.reporter ? `@${r.reporter.username}` : 'unknown'} &middot; {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {status === 'PENDING' && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
                <button disabled={busy === r._id} onClick={() => act(r._id, 'RESOLVED', r.targetType === 'user' ? 'disable_user' : 'delete_content')} className="cursor-pointer rounded-full bg-[var(--color-error)] px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">
                  {r.targetType === 'user' ? 'Disable user & resolve' : 'Delete content & resolve'}
                </button>
                <button disabled={busy === r._id} onClick={() => act(r._id, 'RESOLVED')} className="cursor-pointer rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60">
                  Resolve (no action)
                </button>
                <button disabled={busy === r._id} onClick={() => act(r._id, 'REVIEWED')} className="cursor-pointer rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60">
                  Mark reviewed
                </button>
                <button disabled={busy === r._id} onClick={() => act(r._id, 'REJECTED')} className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] disabled:cursor-not-allowed disabled:opacity-60">
                  Reject
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
