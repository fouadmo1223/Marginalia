import { useEffect, useState, type CSSProperties } from 'react';
import { api } from '../../lib/api-client';

interface BlockedUser {
  _id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

export default function BlockedUsersList() {
  const [users, setUsers] = useState<BlockedUser[] | null>(null);

  useEffect(() => {
    api.get<{ users: BlockedUser[] }>('/api/users/blocked').then((d) => setUsers(d.users));
  }, []);

  async function unblock(id: string) {
    await api.delete(`/api/users/${id}/block`);
    setUsers((prev) => prev?.filter((u) => u._id !== id) ?? null);
  }

  if (!users) return <p className="text-sm text-[var(--color-ink-soft)]">Loading…</p>;
  if (users.length === 0) return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-14 text-center">
      <p className="text-sm text-[var(--color-ink-soft)]">You haven't blocked anyone.</p>
    </div>
  );

  return (
    <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      {users.map((u, i) => (
        <li key={u._id} className="stagger-in flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface-raised)]" style={{ '--stagger-i': i } as CSSProperties}>
          <a href={`/profile/${u.username}`} className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent)]">
              {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" /> : u.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-[var(--color-ink-strong)]">{u.name}</span>
              <span className="block truncate text-xs text-[var(--color-ink-soft)]">@{u.username}</span>
            </span>
          </a>
          <button onClick={() => unblock(u._id)} className="shrink-0 cursor-pointer rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-raised)]">
            Unblock
          </button>
        </li>
      ))}
    </ul>
  );
}
