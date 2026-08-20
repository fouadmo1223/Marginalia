import { useState } from 'react';
import { api } from '../../lib/api-client';

export default function FollowButton({
  userId,
  initialFollowing,
  isAuthenticated,
}: {
  userId: string;
  initialFollowing: boolean;
  isAuthenticated: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!isAuthenticated) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !following;
    setFollowing(next);
    try {
      if (next) await api.post(`/api/users/${userId}/follow`);
      else await api.delete(`/api/users/${userId}/follow`);
    } catch {
      setFollowing(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-full px-5 py-2 text-sm font-medium transition ${
        following
          ? 'border border-[var(--color-line)] text-[var(--color-ink)] hover:border-red-300 hover:text-red-600'
          : 'bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-accent)]'
      }`}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
