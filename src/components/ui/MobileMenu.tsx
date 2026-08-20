import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../../lib/api-client';

interface UserPayload {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  role: 'user' | 'admin';
}

export default function MobileMenu({ user }: { user: UserPayload | null }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  // The header is `backdrop-blur`, which establishes a containing block for any
  // `position: fixed` descendant — so the overlay must be portaled to <body>,
  // otherwise it renders confined to the header's own (tiny) box instead of the
  // full viewport.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
  }

  async function logout() {
    await api.post('/api/auth/logout');
    window.location.href = '/';
  }

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 right-0 z-50 flex w-[85vw] max-w-sm flex-col bg-[var(--color-paper)] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
                <span className="font-serif text-lg font-semibold text-[var(--color-ink)]">Menu</span>
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-paper-raised)]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={onSearchSubmit} className="border-b border-[var(--color-line)] p-5">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                  placeholder="Search blogs, people, tags…"
                  className="w-full rounded-full border border-[var(--color-line)] bg-white px-4 py-2.5 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                />
              </form>

              <nav className="flex flex-col p-2 text-base">
                <a href="/" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]">Home</a>
                <a href="/feed" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]">Feed</a>
                <a href="/explore" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]">Explore</a>
                {user && (
                  <>
                    <a href="/dashboard" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]">Dashboard</a>
                    <a href="/dashboard/create" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]">Write a blog</a>
                    <a href="/dashboard/notifications" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]">Notifications</a>
                    <a href={`/profile/${user.username}`} onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]">Your profile</a>
                    {user.role === 'admin' && (
                      <a href="/admin" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]">Admin dashboard</a>
                    )}
                    <a href="/dashboard/settings" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]">Settings</a>
                  </>
                )}
              </nav>

              <div className="mt-auto border-t border-[var(--color-line)] p-5">
                {user ? (
                  <button onClick={logout} className="w-full rounded-full border border-[var(--color-line)] py-2.5 text-sm font-medium text-[var(--color-accent)]">
                    Sign out
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <a href="/register" className="rounded-full bg-[var(--color-ink)] py-2.5 text-center text-sm font-medium text-[var(--color-paper)]">Get started</a>
                    <a href="/login" className="rounded-full border border-[var(--color-line)] py-2.5 text-center text-sm font-medium text-[var(--color-ink)]">Sign in</a>
                  </div>
                )}
              </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
