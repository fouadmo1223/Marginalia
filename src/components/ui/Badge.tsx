import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'accent';

const tones: Record<Tone, string> = {
  neutral: 'bg-[var(--color-paper-raised)] text-[var(--color-ink-soft)]',
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  error: 'bg-[var(--color-error-soft)] text-[var(--color-error)]',
  info: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
  accent: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
