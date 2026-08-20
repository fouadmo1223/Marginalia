import { gsap, motionSafe, PREFERS_MOTION } from './gsap-setup';

/**
 * The "pin" here is plain CSS `position: sticky` on the left column — deliberately
 * not a GSAP pin. A GSAP pin needs a spacer sized to an exact scroll distance and
 * we've already been burned once by that calculation drifting (see horizontal
 * gallery). Sticky achieves the same visual result natively, with zero spacer math.
 * GSAP's job here is just the lighter touch: fade each step in as it arrives, and
 * keep the progress dots in sync.
 */
motionSafe.add(PREFERS_MOTION, () => {
  const sections = gsap.utils.toArray<HTMLElement>('[data-pin-story]');

  sections.forEach((section) => {
    const steps = gsap.utils.toArray<HTMLElement>('[data-pin-story-step]', section);
    const dots = gsap.utils.toArray<HTMLElement>('[data-pin-story-dot]', section);

    steps.forEach((step, i) => {
      gsap.fromTo(
        step,
        { opacity: 0.25, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: step,
            start: 'top 65%',
            end: 'top 25%',
            scrub: 0.5,
            onToggle: (self) => {
              if (self.isActive) {
                // Two conflicting `bg-*` utility classes can't reliably override each
                // other by toggling (CSS source order wins, not DOM class order), so
                // the active dot's color is set directly instead of via a second class.
                dots.forEach((dot, di) => {
                  dot.style.backgroundColor = di === i ? 'var(--color-accent)' : '';
                  dot.classList.toggle('w-14', di === i);
                  dot.classList.toggle('w-8', di !== i);
                });
              }
            },
          },
        },
      );
    });
  });
});
