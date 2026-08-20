import { useEffect, useState } from 'react';
import { api } from '../../lib/api-client';

interface BlogResult {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: { username: string; name: string; avatarUrl: string | null } | null;
}
interface UserResult {
  _id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string;
}
interface TagResult {
  _id: string;
  name: string;
  slug: string;
}
interface CategoryResult {
  _id: string;
  name: string;
  slug: string;
}

type FilterKey = 'all' | 'blogs' | 'users' | 'tags';

export default function SearchResults({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    blogs: BlogResult[];
    users: UserResult[];
    tags: TagResult[];
    categories: CategoryResult[];
  }>({ blogs: [], users: [], tags: [], categories: [] });
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      setResults({ blogs: [], users: [], tags: [], categories: [] });
      setSearched(false);
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('q', debounced);
    window.history.replaceState({}, '', url.toString());

    setLoading(true);
    api
      .get<typeof results>(`/api/search?q=${encodeURIComponent(debounced)}`)
      .then((data) => {
        setResults(data);
        setSearched(true);
      })
      .finally(() => setLoading(false));
  }, [debounced]);

  const counts = {
    all: results.blogs.length + results.users.length + results.tags.length + results.categories.length,
    blogs: results.blogs.length,
    users: results.users.length,
    tags: results.tags.length + results.categories.length,
  };
  const hasResults = counts.all > 0;

  const showBlogs = filter === 'all' || filter === 'blogs';
  const showUsers = filter === 'all' || filter === 'users';
  const showTags = filter === 'all' || filter === 'tags';

  return (
    <div>
      <div className="relative">
        <svg className="pointer-events-none absolute left-0 top-1/2 h-6 w-6 -translate-y-1/2 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the archive…"
          className="text-display w-full border-b border-[var(--color-border)] bg-transparent py-4 pl-9 text-3xl font-medium text-[var(--color-ink)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none sm:text-4xl"
          aria-label="Search"
        />
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto">
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'blogs', label: 'Blogs' },
            { key: 'users', label: 'People' },
            { key: 'tags', label: 'Tags & categories' },
          ] as { key: FilterKey; label: string }[]
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${
              filter === f.key
                ? 'bg-[var(--color-ink)] text-[var(--color-paper)]'
                : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-raised)]'
            }`}
          >
            {f.label}
            {searched && counts[f.key] > 0 && <span className="ml-1.5 opacity-60">{counts[f.key]}</span>}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-sm bg-[var(--color-paper-raised)]" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        )}

        {!loading && searched && !hasResults && (
          <div className="border-t border-[var(--color-border)] py-16 text-center">
            <p className="font-serif text-xl text-[var(--color-ink)]">Nothing matches &ldquo;{debounced}&rdquo;</p>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">Try a different spelling, or browse by category instead.</p>
            <a href="/explore" className="mt-5 inline-block rounded-full border border-[var(--color-border)] px-5 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-border-strong)]">
              Explore the archive
            </a>
          </div>
        )}

        {!loading && !searched && (
          <p className="border-t border-[var(--color-border)] py-16 text-center text-sm text-[var(--color-text-muted)]">
            Start typing to search blogs, writers, and tags.
          </p>
        )}

        {!loading && showUsers && results.users.length > 0 && (
          <section className="mb-10">
            <p className="eyebrow mb-4">People</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {results.users.map((u) => (
                <li key={u._id}>
                  <a href={`/profile/${u.username}`} className="group flex items-center gap-3 rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition hover:border-[var(--color-border-strong)]">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-paper-raised)] text-sm font-medium ring-1 ring-transparent transition group-hover:ring-[var(--color-accent)]">
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-[var(--color-ink)]">{u.name}</span>
                      <span className="block truncate text-xs text-[var(--color-ink-soft)]">@{u.username}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!loading && showBlogs && results.blogs.length > 0 && (
          <section className="mb-10">
            <p className="eyebrow mb-4">Blogs</p>
            <ul className="divide-y divide-[var(--color-border)]">
              {results.blogs.map((b) => (
                <li key={b._id}>
                  <a href={`/blog/${b.slug}`} className="group flex items-center justify-between gap-4 py-4 transition hover:pl-2">
                    <span className="min-w-0">
                      <span className="block truncate font-serif text-xl text-[var(--color-ink)] transition group-hover:text-[var(--color-accent)]">{b.title}</span>
                      {b.author && <span className="text-xs text-[var(--color-ink-soft)]">{b.author.name}</span>}
                    </span>
                    <svg className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!loading && showTags && (results.tags.length > 0 || results.categories.length > 0) && (
          <section>
            <p className="eyebrow mb-4">Tags &amp; categories</p>
            <div className="flex flex-wrap gap-2">
              {results.categories.map((c) => (
                <a key={c._id} href={`/search?type=blogs&category=${c.slug}`} className="rounded-full border border-[var(--color-border)] px-3.5 py-1.5 text-sm text-[var(--color-ink)] transition hover:border-[var(--color-border-strong)]">
                  {c.name}
                </a>
              ))}
              {results.tags.map((t) => (
                <a key={t._id} href={`/search?type=blogs&tag=${t.slug}`} className="rounded-full bg-[var(--color-paper-raised)] px-3.5 py-1.5 text-sm text-[var(--color-ink-soft)] transition hover:text-[var(--color-accent)]">
                  #{t.name}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
