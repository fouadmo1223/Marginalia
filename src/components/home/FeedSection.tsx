import { useState } from 'react';
import { api } from '../../lib/api-client';
import { useCursorPreview } from '../ui/CursorImagePreview';

type Tab = 'following' | 'recent' | 'popular';

interface FeedBlog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: { url: string } | null;
  likesCount: number;
  commentsCount: number;
  publishedAt: string | null;
  createdAt: string;
  author: { username: string; name: string; avatarUrl: string | null } | null;
}

function BlogRow({
  blog,
  variant,
  bindPreview,
}: {
  blog: FeedBlog;
  variant: 'full' | 'minimal';
  bindPreview: (item: { id: string; url: string } | null) => Record<string, unknown>;
}) {
  const date = new Date(blog.publishedAt ?? blog.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (variant === 'minimal') {
    return (
      <article className="border-b border-[var(--color-border)] py-5">
        <a
          href={`/blog/${blog.slug}`}
          className="group flex items-center justify-between gap-4"
          {...(blog.coverImage ? bindPreview({ id: blog._id, url: blog.coverImage.url }) : {})}
        >
          <div className="min-w-0">
            <h2 className="truncate font-serif text-lg font-medium text-[var(--color-ink)] transition group-hover:text-[var(--color-accent)]">
              {blog.title}
            </h2>
            {blog.author && (
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                {blog.author.name} &middot; {date} &middot; {blog.likesCount} likes
              </p>
            )}
          </div>
          <svg className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </article>
    );
  }

  return (
    <article className="group relative border-b border-[var(--color-border)] py-7">
      <span className="absolute -left-4 top-7 h-0 w-[2px] bg-[var(--color-accent)] transition-all duration-300 group-hover:h-[calc(100%-3.5rem)]"></span>
      <a href={`/blog/${blog.slug}`} className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          {blog.author && (
            <div className="mb-2 flex items-center gap-2 text-xs text-[var(--color-ink-soft)]">
              <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-[var(--color-paper-raised)]">
                {blog.author.avatarUrl ? (
                  <img src={blog.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-medium">{blog.author.name.charAt(0).toUpperCase()}</span>
                )}
              </span>
              <span>{blog.author.name}</span>
              <span aria-hidden="true">&middot;</span>
              <time>{date}</time>
            </div>
          )}
          <h2 className="font-serif text-2xl font-semibold text-[var(--color-ink)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--color-accent)]">
            {blog.title}
          </h2>
          {blog.excerpt && <p className="mt-2 line-clamp-2 text-sm text-[var(--color-ink-soft)]">{blog.excerpt}</p>}
          <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-ink-soft)]">
            <span>{blog.likesCount} likes</span>
            <span>{blog.commentsCount} comments</span>
          </div>
        </div>
        {blog.coverImage && (
          <div className="h-32 w-full overflow-hidden rounded-sm bg-[var(--color-paper-raised)] sm:h-24 sm:w-36">
            <img
              src={blog.coverImage.url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        )}
      </a>
    </article>
  );
}

export default function FeedSection({
  initialBlogs,
  initialTab,
  initialEmptyFollowing,
  isAuthenticated,
  showTabs = true,
}: {
  initialBlogs: FeedBlog[];
  initialTab: Tab;
  initialEmptyFollowing: boolean;
  isAuthenticated: boolean;
  showTabs?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [blogs, setBlogs] = useState(initialBlogs);
  const [emptyFollowing, setEmptyFollowing] = useState(initialEmptyFollowing);
  const [loading, setLoading] = useState(false);
  const { bind, preview } = useCursorPreview();

  const tabs: { key: Tab; label: string }[] = [
    ...(isAuthenticated ? [{ key: 'following' as const, label: 'Following' }] : []),
    { key: 'recent', label: 'Recent' },
    { key: 'popular', label: 'Popular' },
  ];

  async function selectTab(next: Tab) {
    if (next === tab) return;
    setTab(next);
    setLoading(true);

    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    window.history.pushState({}, '', url.toString());

    try {
      const data = await api.get<{ blogs: FeedBlog[]; emptyFollowing: boolean }>(`/api/feed?tab=${next}`);
      setBlogs(data.blogs);
      setEmptyFollowing(data.emptyFollowing);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {showTabs && (
        <div className="mb-6 flex gap-1 border-b border-[var(--color-border)]">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => selectTab(t.key)}
              className={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                t.key === tab
                  ? 'border-[var(--color-accent)] text-[var(--color-ink-strong)]'
                  : 'border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="py-8 text-center text-sm text-[var(--color-ink-soft)]">Loading…</p>}

      {!loading && emptyFollowing && (
        <div className="rounded-lg border border-dashed border-[var(--color-line)] px-6 py-14 text-center">
          <p className="font-serif text-lg text-[var(--color-ink)]">Follow writers to build your feed</p>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">Once you follow people, their new blogs will show up here.</p>
          <a href="/explore" className="mt-5 inline-block rounded-full bg-[var(--color-ink)] px-5 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-accent)]">
            Explore writers
          </a>
        </div>
      )}

      {!loading && !emptyFollowing && blogs.length === 0 && (
        <div className="rounded-lg border border-dashed border-[var(--color-line)] px-6 py-14 text-center">
          <p className="font-serif text-lg text-[var(--color-ink)]">Nothing here yet</p>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">Check back soon, or explore other writing.</p>
        </div>
      )}

      {!loading &&
        blogs.map((blog, i) => (
          <BlogRow key={blog._id} blog={blog} variant={i > 0 && i % 5 === 4 ? 'minimal' : 'full'} bindPreview={bind} />
        ))}

      {preview}
    </div>
  );
}
