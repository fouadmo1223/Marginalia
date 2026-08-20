import { useEffect, useState, type CSSProperties } from 'react';
import { api } from '../../lib/api-client';
import { Badge } from '../ui/Badge';
import Select from '../ui/Select';

interface AdminUser {
  _id: string;
  username: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'disabled';
  followersCount: number;
  blogsCount: number;
  createdAt: string;
}

const inputClass =
  'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-ink-strong)] placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-accent)] focus:outline-none';

export default function AdminUsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
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
    const data = await api.get<{ users: AdminUser[]; pagination: { totalPages: number } }>(`/api/admin/users?${params}`);
    setUsers(data.users);
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

  async function setUserStatus(id: string, newStatus: 'active' | 'disabled') {
    await api.patch(`/api/admin/users/${id}`, { status: newStatus });
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, status: newStatus } : u)));
  }

  async function setUserRole(id: string, role: 'user' | 'admin') {
    await api.patch(`/api/admin/users/${id}`, { role });
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role } : u)));
  }

  async function deleteUser(id: string) {
    await api.delete(`/api/admin/users/${id}`);
    setUsers((prev) => prev.filter((u) => u._id !== id));
    setConfirmDelete(null);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <input placeholder="Search name, username, email…" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputClass} w-64`} />
        <Select
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'disabled', label: 'Disabled' },
          ]}
          className="w-40"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Blogs</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--color-ink-soft)]">Loading…</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--color-ink-soft)]">No users found.</td></tr>
            )}
            {users.map((u, i) => (
              <tr
                key={u._id}
                className="stagger-in border-b border-[var(--color-border)] transition-colors last:border-0 hover:bg-[var(--color-surface-raised)]"
                style={{ '--stagger-i': i } as CSSProperties}
              >
                <td className="px-4 py-3.5">
                  <a href={`/profile/${u.username}`} className="font-medium text-[var(--color-ink-strong)] hover:text-[var(--color-accent)]">{u.name}</a>
                  <p className="text-xs text-[var(--color-ink-soft)]">@{u.username} &middot; {u.email}</p>
                </td>
                <td className="px-4 py-3.5">
                  <Select
                    value={u.role}
                    onChange={(v) => setUserRole(u._id, v as 'user' | 'admin')}
                    options={[
                      { value: 'user', label: 'User' },
                      { value: 'admin', label: 'Admin' },
                    ]}
                    size="sm"
                    className="w-24"
                  />
                </td>
                <td className="px-4 py-3.5">
                  <Badge tone={u.status === 'active' ? 'success' : 'error'}>{u.status}</Badge>
                </td>
                <td className="px-4 py-3.5 text-[var(--color-ink)]">{u.blogsCount}</td>
                <td className="px-4 py-3.5 text-xs text-[var(--color-ink-soft)]">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    {u.status === 'active' ? (
                      <button onClick={() => setUserStatus(u._id, 'disabled')} className="cursor-pointer text-xs font-medium text-[var(--color-warning)] hover:underline">Disable</button>
                    ) : (
                      <button onClick={() => setUserStatus(u._id, 'active')} className="cursor-pointer text-xs font-medium text-[var(--color-success)] hover:underline">Enable</button>
                    )}
                    {confirmDelete === u._id ? (
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs text-[var(--color-ink-soft)]">Delete @{u.username} and everything they made?</span>
                        <button onClick={() => deleteUser(u._id)} className="cursor-pointer text-xs font-semibold text-[var(--color-error)]">Confirm</button>
                        <button onClick={() => setConfirmDelete(null)} className="cursor-pointer text-xs text-[var(--color-ink-soft)]">Cancel</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDelete(u._id)} className="cursor-pointer text-xs font-medium text-[var(--color-error)] hover:underline">Delete</button>
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
