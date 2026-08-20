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

const TYPE_STYLE: Record<NotificationItem['type'], { icon: string; color: string; soft: string }> = {
  like: {
    icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z',
    color: 'var(--color-accent2)',
    soft: 'var(--color-accent2-soft)',
  },
  comment: {
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z',
    color: 'var(--color-info)',
    soft: 'var(--color-info-soft)',
  },
  reply: {
    icon: 'M9 15 4.5 10.5 9 6M4.5 10.5H15a4.5 4.5 0 0 1 4.5 4.5v3',
    color: 'var(--color-info)',
    soft: 'var(--color-info-soft)',
  },
  follow: {
    icon: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
    color: 'var(--color-success)',
    soft: 'var(--color-success-soft)',
  },
  mention: {
    icon: 'M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25',
    color: 'var(--color-accent)',
    soft: 'var(--color-accent-soft)',
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

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
              <p className="text-sm font-semibold text-[var(--color-ink-strong)]">
                Notifications {unread > 0 && <span className="ml-1 text-xs font-normal text-[var(--color-ink-soft)]">({unread} new)</span>}
              </p>
              {unread > 0 && (
                <button onClick={markAllRead} className="cursor-pointer text-xs font-medium text-[var(--color-accent)] hover:underline">
                  Mark all read
                </button>
              )}
            </div>

            {!loaded && (
              <div className="space-y-1 p-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--color-surface-raised)]" style={{ animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
            )}
            {loaded && items.length === 0 && (
              <div className="px-4 py-10 text-center">
                <svg className="mx-auto mb-2 h-8 w-8 text-[var(--color-ink-soft)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <p className="text-sm text-[var(--color-ink-soft)]">You're all caught up.</p>
              </div>
            )}

            <ul className="p-1.5">
              {items.map((item) => {
                const style = TYPE_STYLE[item.type];
                return (
                  <li key={item._id}>
                    <button
                      onClick={() => openItem(item)}
                      className={`flex w-full cursor-pointer items-start gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-surface-raised)] ${
                        item.read ? '' : 'bg-[var(--color-accent-soft)]/40'
                      }`}
                    >
                      <span className="relative shrink-0">
                        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface-raised)] text-xs font-semibold">
                          {item.actor.avatarUrl ? (
                            <img src={item.actor.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            item.actor.name.charAt(0).toUpperCase()
                          )}
                        </span>
                        <span
                          className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--color-surface)]"
                          style={{ background: style.soft, color: style.color }}
                        >
                          <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d={style.icon} />
                          </svg>
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[var(--color-ink-strong)]">{MESSAGES[item.type](item.actor.name)}</span>
                        {item.blog && <span className="mt-0.5 block truncate text-xs text-[var(--color-ink-soft)]">{item.blog.title}</span>}
                        <span className="mt-1 block text-[11px] text-[var(--color-ink-soft)]">{timeAgo(item.createdAt)} ago</span>
                      </span>
                      {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
