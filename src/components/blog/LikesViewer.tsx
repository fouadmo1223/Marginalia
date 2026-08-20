import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../../lib/api-client';

interface LikeUser {
  _id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

export default function LikesViewer({ blogId }: { blogId: string }) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<LikeUser[] | null>(null);

  async function show() {
    setOpen(true);
    if (!users) {
      const data = await api.get<{ users: LikeUser[] }>(`/api/blogs/${blogId}/likes`);
      setUsers(data.users);
    }
  }

  return (
    <>
      <button onClick={show} className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-accent)]">
        See who liked this
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[70vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-[var(--color-ink)]">Liked by</h2>
                <button onClick={() => setOpen(false)} aria-label="Close" className="text-[var(--color-ink-soft)]">
                  &times;
                </button>
              </div>
              {!users && <p className="text-sm text-[var(--color-ink-soft)]">Loading…</p>}
              {users && users.length === 0 && <p className="text-sm text-[var(--color-ink-soft)]">No likes yet.</p>}
              <ul className="space-y-3">
                {users?.map((u) => (
                  <li key={u._id}>
                    <a href={`/profile/${u.username}`} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--color-paper-raised)] text-xs font-medium">
                        {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-sm text-[var(--color-ink)]">{u.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
