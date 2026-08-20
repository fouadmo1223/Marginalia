import { useEffect, useState, type CSSProperties } from 'react';
import { api } from '../../lib/api-client';

interface Tag {
  _id: string;
  name: string;
  slug: string;
  usageCount: number;
}

const inputClass =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-ink-strong)] placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-accent)] focus:outline-none';

export default function AdminTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [q, setQ] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const params = new URLSearchParams({ limit: '50' });
    if (q) params.set('q', q);
    const data = await api.get<{ tags: Tag[] }>(`/api/admin/tags?${params}`);
    setTags(data.tags);
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function create() {
    if (!name.trim()) return;
    setError(null);
    try {
      await api.post('/api/admin/tags', { name });
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this tag?')) return;
    await api.delete(`/api/admin/tags/${id}`);
    setTags((prev) => prev.filter((t) => t._id !== id));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">New tag</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button onClick={create} className="cursor-pointer rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90">
          Add tag
        </button>
      </div>
      {error && <p className="mb-3 text-sm font-medium text-[var(--color-error)]">{error}</p>}

      <input placeholder="Search tags…" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputClass} mb-4 w-64`} />

      <div className="flex flex-wrap gap-2">
        {tags.map((t, i) => (
          <span
            key={t._id}
            className="stagger-in flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-ink-strong)] shadow-sm"
            style={{ '--stagger-i': i } as CSSProperties}
          >
            #{t.name}
            <span className="rounded-full bg-[var(--color-surface-raised)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-ink-soft)]">{t.usageCount}</span>
            <button onClick={() => remove(t._id)} className="cursor-pointer text-[var(--color-ink-soft)] hover:text-[var(--color-error)]" aria-label={`Delete ${t.name}`}>
              &times;
            </button>
          </span>
        ))}
        {tags.length === 0 && <p className="text-sm text-[var(--color-ink-soft)]">No tags found.</p>}
      </div>
    </div>
  );
}
