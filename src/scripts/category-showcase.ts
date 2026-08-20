import { gsap, motionSafe, PREFERS_MOTION } from './gsap-setup';

/**
 * Each tile's image scales down from an oversized start state as it scrolls
 * through the viewport (scrub-linked, not a one-shot reveal), plus a slow
 * parallax drift so the image moves at a different rate than the card around it.
 */
motionSafe.add(PREFERS_MOTION, () => {
  const tiles = gsap.utils.toArray<HTMLElement>('[data-category-tile]');

  tiles.forEach((tile, i) => {
    const image = tile.querySelector<HTMLElement>('[data-category-image]');
    if (!image) return;

    gsap.fromTo(
      tile,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        delay: (i % 2) * 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: tile, start: 'top 88%', once: true },
      },
    );

    gsap.to(image, {
      yPercent: -10,
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: tile,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.6,
      },
    });
  });
});
