import { useState } from 'react';
import { api } from '../../lib/api-client';

export default function BlockButton({ userId, initialBlocked }: { userId: string; initialBlocked: boolean }) {
  const [blocked, setBlocked] = useState(initialBlocked);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!blocked && !confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    try {
      if (blocked) await api.delete(`/api/users/${userId}/block`);
      else await api.post(`/api/users/${userId}/block`);
      setBlocked(!blocked);
      window.location.reload();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2 text-sm">
        <span className="text-[var(--color-ink-soft)]">Block this user?</span>
        <button onClick={toggle} disabled={busy} className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white">
          Confirm
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-[var(--color-ink-soft)]">Cancel</button>
      </span>
    );
  }

  return (
    <button onClick={toggle} disabled={busy} className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-ink-soft)] hover:border-red-300 hover:text-red-600">
      {blocked ? 'Unblock' : 'Block'}
    </button>
  );
}
