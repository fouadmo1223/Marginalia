import { useEffect, useState } from 'react';
import { api } from '../../lib/api-client';

interface FeatureItem {
  _id: string;
  section: 'featured' | 'trending' | 'gallery';
  blog: { _id: string; title: string; slug: string; status: string; author: { username: string; name: string } | null } | null;
}

interface BlogOption {
  _id: string;
  title: string;
  status: string;
  author: { username: string; name: string } | null;
}

const SECTIONS: { key: FeatureItem['section']; label: string; hint: string; limit: number; color: string; soft: string; icon: string }[] = [
  {
    key: 'featured',
    label: 'Featured story',
    hint: 'One blog — the large showcase at the top of the homepage.',
    limit: 1,
    color: 'var(--color-accent)',
    soft: 'var(--color-accent-soft)',
    icon: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345l2.125-5.111Z',
  },
  {
    key: 'trending',
    label: 'Trending this week',
    hint: 'Up to 4 blogs shown in the stacked-card section.',
    limit: 4,
    color: 'var(--color-secondary)',
    soft: 'color-mix(in srgb, var(--color-secondary) 16%, transparent)',
    icon: 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941',
  },
  {
    key: 'gallery',
    label: 'Archive gallery',
    hint: 'Up to 16 blogs shown in the horizontal scroll gallery.',
    limit: 16,
    color: 'var(--color-info)',
    soft: 'var(--color-info-soft)',
    icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 4.5h18M4.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25h10.5A2.25 2.25 0 0 0 19.5 19.5v-15',
  },
];

export default function AdminHomeCuration() {
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BlogOption[]>([]);
  const [addingTo, setAddingTo] = useState<FeatureItem['section'] | null>(null);

  async function load() {
    const data = await api.get<{ features: FeatureItem[] }>('/api/admin/home-features');
    setFeatures(data.features);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!addingTo) return;
    const t = setTimeout(async () => {
      const params = new URLSearchParams({ status: 'published', limit: '8' });
      if (query) params.set('q', query);
      const data = await api.get<{ blogs: BlogOption[] }>(`/api/admin/blogs?${params}`);
      setResults(data.blogs);
    }, 250);
    return () => clearTimeout(t);
  }, [query, addingTo]);

  async function addBlog(section: FeatureItem['section'], blogId: string) {
    await api.post('/api/admin/home-features', { section, blogId });
    setAddingTo(null);
    setQuery('');
    await load();
  }

  async function remove(id: string) {
    await api.delete(`/api/admin/home-features/${id}`);
    setFeatures((prev) => prev.filter((f) => f._id !== id));
  }

  if (loading) return <p className="text-sm text-[var(--color-ink-soft)]">Loading…</p>;

  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => {
        const items = features.filter((f) => f.section === section.key);
        const atLimit = items.length >= section.limit;
        const fillPct = Math.min(100, Math.round((items.length / section.limit) * 100));
        return (
          <div
            key={section.key}
            className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
          >
            <div className="flex items-start gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: section.soft, color: section.color }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d={section.icon} />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-serif text-lg font-semibold text-[var(--color-ink-strong)]">{section.label}</h2>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
                    style={{ background: section.soft, color: section.color }}
                  >
                    {items.length}/{section.limit}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">{section.hint}</p>
                <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${fillPct}%`, background: section.color }} />
                </div>
              </div>
            </div>

            <div className="p-5">
              {items.length === 0 && (
                <p className="mb-4 rounded-lg border border-dashed border-[var(--color-border)] px-4 py-4 text-center text-xs text-[var(--color-ink-soft)]">
                  Nothing pinned — the homepage falls back to its automatic pick (most liked / most recent).
                </p>
              )}

              {items.length > 0 && (
                <ul className="mb-4 space-y-1.5">
                  {items.map((f) => (
                    <li
                      key={f._id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 py-2.5 text-sm"
                    >
                      <span className="min-w-0 truncate text-[var(--color-ink-strong)]">
                        {f.blog?.title ?? '(deleted blog)'}
                        {f.blog?.author && <span className="text-[var(--color-ink-soft)]"> — @{f.blog.author.username}</span>}
                      </span>
                      <button
                        onClick={() => remove(f._id)}
                        className="shrink-0 cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-[var(--color-error)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {addingTo === section.key ? (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5">
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search published blogs by title…"
                    className="mb-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink-strong)] placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                  <ul className="max-h-56 divide-y divide-[var(--color-border)] overflow-y-auto">
                    {results.map((b) => (
                      <li key={b._id}>
                        <button
                          onClick={() => addBlog(section.key, b._id)}
                          className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-2 text-left text-sm text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface)]"
                        >
                          <span className="truncate">{b.title}</span>
                          {b.author && <span className="ml-2 shrink-0 text-xs text-[var(--color-ink-soft)]">@{b.author.username}</span>}
                        </button>
                      </li>
                    ))}
                    {results.length === 0 && <li className="px-2 py-3 text-xs text-[var(--color-ink-soft)]">No published blogs match.</li>}
                  </ul>
                  <button
                    onClick={() => { setAddingTo(null); setQuery(''); }}
                    className="mt-2 cursor-pointer text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  disabled={atLimit}
                  onClick={() => setAddingTo(section.key)}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-raised)] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ cursor: atLimit ? 'not-allowed' : 'pointer' }}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  {atLimit ? 'Section full' : 'Add blog'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
