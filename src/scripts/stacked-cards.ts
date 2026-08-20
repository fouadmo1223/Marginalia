import { gsap, motionSafe, PREFERS_MOTION } from './gsap-setup';

/**
 * Sticky card stack: each card is CSS `position: sticky` with a slightly increasing
 * `top` offset (set inline per-card in the component), so cards naturally cascade as
 * they pass under one another. GSAP just adds the recede — scaling/dimming/blurring
 * the card underneath as the next one arrives — driven by scroll position (`scrub`),
 * not time, so it always tracks the scrollbar exactly.
 */
motionSafe.add(PREFERS_MOTION, () => {
  const stacks = gsap.utils.toArray<HTMLElement>('[data-stack]');

  stacks.forEach((stack) => {
    const cards = gsap.utils.toArray<HTMLElement>('[data-stack-card]', stack);

    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;

      gsap.to(card, {
        scale: 0.94,
        opacity: 0.5,
        filter: 'blur(2px)',
        ease: 'none',
        scrollTrigger: {
          trigger: next,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
        },
      });
    });
  });
});
