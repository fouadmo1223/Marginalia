/**
 * Shared motion language so GSAP (Astro-side) and Framer Motion (React islands)
 * read as the same product instead of two different animation systems bolted
 * together. Import durations here instead of hand-picking numbers per component.
 */
export const DURATION = {
  fast: 0.18,
  normal: 0.35,
  slow: 0.65,
} as const;

export const EASE = {
  out: [0.16, 1, 0.3, 1] as const, // expo-out — snappy settle, used for entrances
  inOut: [0.65, 0, 0.35, 1] as const, // for scrub/scroll-driven motion
  spring: { type: 'spring', stiffness: 300, damping: 26 } as const,
};

export const framerTransition = {
  fast: { duration: DURATION.fast, ease: EASE.out },
  normal: { duration: DURATION.normal, ease: EASE.out },
  slow: { duration: DURATION.slow, ease: EASE.out },
};
