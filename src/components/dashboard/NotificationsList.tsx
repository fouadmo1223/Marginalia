import { useEffect, useState, type CSSProperties } from 'react';
import { api } from '../../lib/api-client';

interface NotificationItem {
  _id: string;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'mention';
  read: boolean;
  createdAt: string;
  actor: { username: string; name: string; avatarUrl: string | null };
  blog?: { title: string; slug: string } | null;
}

const MESSAGES: Record<NotificationItem['type'], (name: string) => string> = {
  like: (name) => `${name} liked your blog`,
  comment: (name) => `${name} commented on your blog`,
  reply: (name) => `${name} replied to your comment`,
  follow: (name) => `${name} started following you`,
  mention: (name) => `${name} mentioned you`,
};

export default function NotificationsList() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load(p: number) {
    setLoading(true);
    const data = await api.get<{ notifications: NotificationItem[]; pagination: { totalPages: number } }>(
      `/api/notifications?page=${p}&limit=20`,
    );
    setItems((prev) => (p === 1 ? data.notifications : [...prev, ...data.notifications]));
    setTotalPages(data.pagination.totalPages);
    setPage(p);
    setLoading(false);
  }

  useEffect(() => {
    load(1);
  }, []);

  async function markAllRead() {
    await api.post('/api/notifications/read-all');
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function openItem(item: NotificationItem) {
    if (!item.read) {
      await api.post(`/api/notifications/${item._id}/read`).catch(() => null);
    }
    if (item.blog) window.location.href = `/blog/${item.blog.slug}`;
    else window.location.href = `/profile/${item.actor.username}`;
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={markAllRead} className="cursor-pointer text-sm font-medium text-[var(--color-accent)] hover:underline">
          Mark all as read
        </button>
      </div>

      {loading && items.length === 0 && <p className="text-sm text-[var(--color-ink-soft)]">Loading…</p>}
      {!loading && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-14 text-center">
          <p className="text-sm text-[var(--color-ink-soft)]">No notifications yet.</p>
        </div>
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          {items.map((item, i) => (
            <li key={item._id} className="stagger-in" style={{ '--stagger-i': i } as CSSProperties}>
              <button
                onClick={() => openItem(item)}
                className={`block w-full cursor-pointer px-4 py-3.5 text-left text-sm transition-colors hover:bg-[var(--color-surface-raised)] ${
                  item.read ? '' : 'bg-[var(--color-accent-soft)]/50'
                }`}
              >
                <span className="text-[var(--color-ink-strong)]">{MESSAGES[item.type](item.actor.name)}</span>
                {item.blog && <span className="block text-xs text-[var(--color-ink-soft)]">{item.blog.title}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {page < totalPages && (
        <button onClick={() => load(page + 1)} className="mt-4 cursor-pointer text-sm font-medium text-[var(--color-accent)] hover:underline">
          Load more
        </button>
      )}
    </div>
  );
}
