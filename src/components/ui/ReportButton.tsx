import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../../lib/api-client';
import Select from './Select';

const REASONS = ['Spam', 'Harassment', 'Misinformation', 'Inappropriate content', 'Other'];

export default function ReportButton({
  targetType,
  targetId,
  isAuthenticated,
  label = 'Report',
}: {
  targetType: 'user' | 'blog' | 'comment';
  targetId: string;
  isAuthenticated: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  function openModal() {
    if (!isAuthenticated) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    try {
      await api.post('/api/reports', { targetType, targetId, reason, details });
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={openModal} className="text-sm text-[var(--color-ink-soft)] hover:text-red-600">
        {label}
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
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl"
            >
              {sent ? (
                <div className="text-center">
                  <p className="font-serif text-lg text-[var(--color-ink-strong)]">Report submitted</p>
                  <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Our moderators will review it.</p>
                  <button onClick={() => setOpen(false)} className="mt-4 cursor-pointer rounded-full bg-[var(--color-ink)] px-4 py-1.5 text-sm text-[var(--color-paper)]">
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="mb-3 font-serif text-lg font-semibold text-[var(--color-ink-strong)]">Report</h2>
                  <Select
                    value={reason}
                    onChange={setReason}
                    options={REASONS.map((r) => ({ value: r, label: r }))}
                    className="mb-3 w-full"
                  />
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Additional details (optional)"
                    rows={3}
                    className="mb-3 w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-ink-strong)] placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setOpen(false)} className="cursor-pointer rounded-full px-4 py-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                      Cancel
                    </button>
                    <button
                      onClick={submit}
                      disabled={busy}
                      className="cursor-pointer rounded-full bg-[var(--color-ink)] px-4 py-1.5 text-sm text-[var(--color-paper)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? 'Submitting…' : 'Submit'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
