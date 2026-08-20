import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../../lib/api-client';

interface BlogResult {
  _id: string;
  title: string;
  slug: string;
  author: { username: string; name: string } | null;
}
interface UserResult {
  _id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}
interface TagResult {
  _id: string;
  name: string;
  slug: string;
}

export default function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ blogs: BlogResult[]; users: UserResult[]; tags: TagResult[] }>({
    blogs: [],
    users: [],
    tags: [],
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === '/' && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults({ blogs: [], users: [], tags: [] });
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults({ blogs: [], users: [], tags: [] });
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      api
        .get<typeof results>(`/api/search?q=${encodeURIComponent(q)}&type=all`)
        .then((data) => setResults({ blogs: data.blogs.slice(0, 5), users: data.users.slice(0, 4), tags: data.tags.slice(0, 6) }))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
  }

  const hasResults = results.blogs.length + results.users.length + results.tags.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-2.5 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_60%,transparent)] px-4 py-2 text-left text-sm text-[var(--color-ink-soft)] transition hover:border-[var(--color-border-strong)]"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <span className="flex-1 truncate">Search</span>
        <kbd className="hidden rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] sm:inline-block">/</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="glass fixed left-1/2 top-[12vh] z-[61] w-[92vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-lg shadow-2xl"
            >
              <form onSubmit={onSubmit} className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-4">
                <svg className="h-5 w-5 shrink-0 text-[var(--color-ink-soft)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search blogs, people, tags…"
                  className="w-full bg-transparent text-base text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:outline-none"
                />
                <button type="button" onClick={() => setOpen(false)} className="shrink-0 text-xs text-[var(--color-ink-soft)]">
                  esc
                </button>
              </form>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {loading && <p className="px-3 py-6 text-center text-sm text-[var(--color-ink-soft)]">Searching…</p>}

                {!loading && query.trim() && !hasResults && (
                  <p className="px-3 py-6 text-center text-sm text-[var(--color-ink-soft)]">No results for &ldquo;{query}&rdquo;.</p>
                )}

                {!loading && !query.trim() && (
                  <p className="px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">Start typing to search the archive.</p>
                )}

                {!loading && results.users.length > 0 && (
                  <div className="mb-1">
                    <p className="eyebrow px-3 py-1.5">People</p>
                    {results.users.map((u) => (
                      <a key={u._id} href={`/profile/${u.username}`} className="flex items-center gap-3 rounded-md px-3 py-2 transition hover:bg-[var(--color-paper-raised)]">
                        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--color-paper-raised)] text-xs font-medium">
                          {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-[var(--color-ink)]">{u.name}</span>
                          <span className="block text-xs text-[var(--color-ink-soft)]">@{u.username}</span>
                        </span>
                      </a>
                    ))}
                  </div>
                )}

                {!loading && results.blogs.length > 0 && (
                  <div className="mb-1">
                    <p className="eyebrow px-3 py-1.5">Blogs</p>
                    {results.blogs.map((b) => (
                      <a key={b._id} href={`/blog/${b.slug}`} className="block rounded-md px-3 py-2 transition hover:bg-[var(--color-paper-raised)]">
                        <span className="block truncate font-serif text-sm text-[var(--color-ink)]">{b.title}</span>
                        {b.author && <span className="text-xs text-[var(--color-ink-soft)]">{b.author.name}</span>}
                      </a>
                    ))}
                  </div>
                )}

                {!loading && results.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-3 py-2">
                    {results.tags.map((t) => (
                      <a key={t._id} href={`/search?type=blogs&tag=${t.slug}`} className="rounded-full bg-[var(--color-paper-raised)] px-2.5 py-1 text-xs text-[var(--color-ink-soft)] transition hover:text-[var(--color-accent)]">
                        #{t.name}
                      </a>
                    ))}
                  </div>
                )}

                {query.trim() && (
                  <button
                    onClick={onSubmit as any}
                    className="mt-1 flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm text-[var(--color-accent)] transition hover:bg-[var(--color-accent-soft)]"
                  >
                    See all results for &ldquo;{query}&rdquo;
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
