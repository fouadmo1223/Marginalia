import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

export default function NotificationsBell({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  void variant; // forces Astro to serialize distinct props per instance so island uids don't collide
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    const data = await api.get<{ notifications: NotificationItem[]; unreadCount: number }>(
      '/api/notifications?limit=15',
    );
    setItems(data.notifications);
    setUnread(data.unreadCount);
    setLoaded(true);
  }

  useEffect(() => {
    load().catch(() => null);
    const interval = setInterval(() => load().catch(() => null), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function markAllRead() {
    await api.post('/api/notifications/read-all');
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  async function openItem(item: NotificationItem) {
    if (!item.read) {
      await api.post(`/api/notifications/${item._id}/read`).catch(() => null);
      setItems((prev) => prev.map((n) => (n._id === item._id ? { ...n, read: true } : n)));
      setUnread((n) => Math.max(0, n - 1));
    }
    if (item.blog) window.location.href = `/blog/${item.blog.slug}`;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-[var(--color-accent)]" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-11 max-h-96 w-80 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
            style={{ boxShadow: '0 12px 32px color-mix(in srgb, var(--color-ink) 16%, transparent)' }}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--color-ink-strong)]">Notifications</p>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-[var(--color-accent)] hover:underline">
                  Mark all read
                </button>
              )}
            </div>

            {!loaded && <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">Loading…</p>}
            {loaded && items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-soft)]">You're all caught up.</p>
            )}

            <ul>
              {items.map((item) => (
                <li key={item._id}>
                  <button
                    onClick={() => openItem(item)}
                    className={`block w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-surface-raised)] ${
                      item.read ? '' : 'bg-[var(--color-accent-soft)]/40'
                    }`}
                  >
                    <span className="text-[var(--color-ink)]">{MESSAGES[item.type](item.actor.name)}</span>
                    {item.blog && <span className="block text-xs text-[var(--color-ink-soft)]">{item.blog.title}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
