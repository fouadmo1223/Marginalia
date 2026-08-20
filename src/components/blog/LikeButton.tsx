import { useState } from 'react';
import { motion } from 'framer-motion';
import { api, ApiClientError } from '../../lib/api-client';

export default function LikeButton({
  blogId,
  initialLiked,
  initialCount,
  isAuthenticated,
  compact = false,
}: {
  blogId: string;
  initialLiked: boolean;
  initialCount: number;
  isAuthenticated: boolean;
  compact?: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!isAuthenticated) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (busy) return;
    setBusy(true);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    try {
      if (nextLiked) await api.post(`/api/blogs/${blogId}/like`);
      else await api.delete(`/api/blogs/${blogId}/like`);
    } catch (err) {
      setLiked(!nextLiked);
      setCount((c) => c + (nextLiked ? -1 : 1));
      if (!(err instanceof ApiClientError && err.status === 409)) {
        console.error(err);
      }
    } finally {
      setBusy(false);
    }
  }

  const heart = (
    <motion.svg
      animate={liked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={compact ? 'h-5 w-5' : 'h-4 w-4'}
      viewBox="0 0 24 24"
      fill={liked ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.727c-.437 0-.87-.156-1.21-.475C7.42 17.14 3 12.79 3 8.87 3 6.187 5.093 4 7.7 4c1.6 0 3.06.82 3.9 2.14a4.65 4.65 0 013.9-2.14C18.107 4 20.2 6.187 20.2 8.87c0 3.92-4.42 8.27-7.79 11.382-.34.32-.773.475-1.21.475z" />
    </motion.svg>
  );

  if (compact) {
    return (
      <button
        onClick={toggle}
        aria-pressed={liked}
        className={`flex flex-col items-center gap-0.5 transition ${liked ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'}`}
      >
        {heart}
        <span className="text-[10px]">{count.toLocaleString()}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={liked}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        liked
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
          : 'border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-accent)]'
      }`}
    >
      {heart}
      <span>{count.toLocaleString()}</span>
    </button>
  );
}
