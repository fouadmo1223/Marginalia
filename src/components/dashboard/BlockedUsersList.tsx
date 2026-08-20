import { useEffect, useState } from 'react';
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
  if (users.length === 0) return <p className="text-sm text-[var(--color-ink-soft)]">You haven't blocked anyone.</p>;

  return (
    <ul className="divide-y divide-[var(--color-line)] rounded-lg border border-[var(--color-line)] bg-white">
      {users.map((u) => (
        <li key={u._id} className="flex items-center justify-between px-4 py-3">
          <a href={`/profile/${u.username}`} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--color-paper-raised)] text-sm font-medium">
              {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" /> : u.name.charAt(0).toUpperCase()}
            </span>
            <span>
              <span className="block text-sm font-medium text-[var(--color-ink)]">{u.name}</span>
              <span className="block text-xs text-[var(--color-ink-soft)]">@{u.username}</span>
            </span>
          </a>
          <button onClick={() => unblock(u._id)} className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]">
            Unblock
          </button>
        </li>
      ))}
    </ul>
  );
}
