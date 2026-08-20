import { motion } from 'framer-motion';

const VALUES = [
  {
    title: 'No algorithm',
    body: 'Your feed is chronological and follow-based. Nothing is boosted, buried, or optimized for time-on-site.',
    icon: 'M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25',
    color: 'var(--color-primary)',
    soft: 'color-mix(in srgb, var(--color-primary) 14%, transparent)',
  },
  {
    title: 'No ads, ever',
    body: "We don't sell attention. Marginalia is funded by the people who use it, not by advertisers between your paragraphs.",
    icon: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z',
    color: 'var(--color-accent)',
    soft: 'var(--color-accent-soft)',
  },
  {
    title: 'You own your audience',
    body: 'Followers are yours. Export your writing any time. Nothing here is designed to lock you in.',
    icon: 'M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    color: 'var(--color-secondary)',
    soft: 'color-mix(in srgb, var(--color-secondary) 16%, transparent)',
  },
  {
    title: 'Built for reading',
    body: 'Serif type, generous margins, no autoplay, no popups. The page gets out of the way of the sentence.',
    icon: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
    color: 'var(--color-accent2)',
    soft: 'var(--color-accent2-soft)',
  },
];

export default function ValuesGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {VALUES.map((v, i) => (
        <motion.div
          key={v.title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -6 }}
          className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl"
        >
          <motion.div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: v.soft }}
            aria-hidden="true"
          />
          <div className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: v.soft, color: v.color }}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d={v.icon} />
            </svg>
          </div>
          <h3 className="relative font-serif text-lg font-semibold text-[var(--color-ink-strong)]">{v.title}</h3>
          <p className="relative mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">{v.body}</p>
        </motion.div>
      ))}
    </div>
  );
}
