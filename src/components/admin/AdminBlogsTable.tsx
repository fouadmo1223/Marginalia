import { useEffect, useState, type CSSProperties } from 'react';
import { api } from '../../lib/api-client';
import { Badge } from '../ui/Badge';
import Select from '../ui/Select';

interface AdminBlog {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
  author: { username: string; name: string } | null;
}

const inputClass =
  'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-ink-strong)] placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-accent)] focus:outline-none';

export default function AdminBlogsTable() {
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    const data = await api.get<{ blogs: AdminBlog[]; pagination: { totalPages: number } }>(`/api/admin/blogs?${params}`);
    setBlogs(data.blogs);
    setTotalPages(data.pagination.totalPages);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  async function setBlogStatus(id: string, newStatus: 'draft' | 'published') {
    await api.patch(`/api/admin/blogs/${id}`, { status: newStatus });
    setBlogs((prev) => prev.map((b) => (b._id === id ? { ...b, status: newStatus } : b)));
  }

  async function deleteBlog(id: string) {
    await api.delete(`/api/admin/blogs/${id}`);
    setBlogs((prev) => prev.filter((b) => b._id !== id));
    setConfirmDelete(null);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <input placeholder="Search title…" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputClass} w-64`} />
        <Select
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
          ]}
          className="w-40"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              <th className="px-4 py-3">Blog</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Stats</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--color-ink-soft)]">Loading…</td></tr>}
            {!loading && blogs.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--color-ink-soft)]">No blogs found.</td></tr>}
            {blogs.map((b, i) => (
              <tr
                key={b._id}
                className="stagger-in border-b border-[var(--color-border)] transition-colors last:border-0 hover:bg-[var(--color-surface-raised)]"
                style={{ '--stagger-i': i } as CSSProperties}
              >
                <td className="max-w-xs px-4 py-3.5">
                  <a href={`/blog/${b.slug}`} className="line-clamp-1 font-serif text-sm font-semibold text-[var(--color-ink-strong)] hover:text-[var(--color-accent)]">{b.title}</a>
                </td>
                <td className="px-4 py-3.5 text-xs font-medium text-[var(--color-ink-soft)]">{b.author ? `@${b.author.username}` : '—'}</td>
                <td className="px-4 py-3.5">
                  <Badge tone={b.status === 'published' ? 'success' : 'warning'}>{b.status}</Badge>
                </td>
                <td className="px-4 py-3.5 text-xs text-[var(--color-ink-soft)]">{b.likesCount}♥ &middot; {b.commentsCount}💬 &middot; {b.viewsCount}👁</td>
                <td className="px-4 py-3.5 text-xs text-[var(--color-ink-soft)]">{new Date(b.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    {b.status === 'published' ? (
                      <button onClick={() => setBlogStatus(b._id, 'draft')} className="cursor-pointer text-xs font-medium text-[var(--color-warning)] hover:underline">Unpublish</button>
                    ) : (
                      <button onClick={() => setBlogStatus(b._id, 'published')} className="cursor-pointer text-xs font-medium text-[var(--color-success)] hover:underline">Publish</button>
                    )}
                    {confirmDelete === b._id ? (
                      <span className="flex items-center gap-2">
                        <button onClick={() => deleteBlog(b._id)} className="cursor-pointer text-xs font-semibold text-[var(--color-error)]">Confirm</button>
                        <button onClick={() => setConfirmDelete(null)} className="cursor-pointer text-xs text-[var(--color-ink-soft)]">Cancel</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDelete(b._id)} className="cursor-pointer text-xs font-medium text-[var(--color-error)] hover:underline">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="cursor-pointer text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
          <span className="text-[var(--color-ink-soft)]">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="cursor-pointer text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
