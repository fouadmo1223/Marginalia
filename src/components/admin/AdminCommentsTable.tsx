import { useEffect, useState, type CSSProperties } from 'react';
import { api } from '../../lib/api-client';

interface AdminComment {
  _id: string;
  content: string;
  createdAt: string;
  author: { username: string; name: string } | null;
  blog: { title: string; slug: string } | null;
}

export default function AdminCommentsTable() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (q) params.set('q', q);
    const data = await api.get<{ comments: AdminComment[]; pagination: { totalPages: number } }>(`/api/admin/comments?${params}`);
    setComments(data.comments);
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
  }, [q]);

  async function remove(id: string) {
    await api.delete(`/api/admin/comments/${id}`);
    setComments((prev) => prev.filter((c) => c._id !== id));
    setConfirmDelete(null);
  }

  return (
    <div>
      <input
        placeholder="Search comment content…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 w-72 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-ink-strong)] placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-accent)] focus:outline-none"
      />

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              <th className="px-4 py-3">Comment</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Blog</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--color-ink-soft)]">Loading…</td></tr>}
            {!loading && comments.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--color-ink-soft)]">No comments found.</td></tr>}
            {comments.map((c, i) => (
              <tr
                key={c._id}
                className="stagger-in border-b border-[var(--color-border)] transition-colors last:border-0 hover:bg-[var(--color-surface-raised)]"
                style={{ '--stagger-i': i } as CSSProperties}
              >
                <td className="max-w-xs truncate px-4 py-3.5 text-[var(--color-ink-strong)]">{c.content}</td>
                <td className="px-4 py-3.5 text-xs text-[var(--color-ink-soft)]">{c.author ? `@${c.author.username}` : '—'}</td>
                <td className="px-4 py-3.5">
                  {c.blog && <a href={`/blog/${c.blog.slug}`} className="text-xs font-medium text-[var(--color-accent)] hover:underline">{c.blog.title}</a>}
                </td>
                <td className="px-4 py-3.5 text-xs text-[var(--color-ink-soft)]">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3.5">
                  {confirmDelete === c._id ? (
                    <span className="flex items-center gap-2">
                      <button onClick={() => remove(c._id)} className="cursor-pointer text-xs font-semibold text-[var(--color-error)]">Confirm</button>
                      <button onClick={() => setConfirmDelete(null)} className="cursor-pointer text-xs text-[var(--color-ink-soft)]">Cancel</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmDelete(c._id)} className="cursor-pointer text-xs font-medium text-[var(--color-error)] hover:underline">Delete</button>
                  )}
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
