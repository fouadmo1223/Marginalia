import { gsap, motionSafe, PREFERS_MOTION } from './gsap-setup';

/**
 * Depth-based parallax. Add `data-parallax="0.3"` to any element — the number is a
 * speed multiplier (negative drifts up, positive drifts down as the page scrolls).
 * Tied to `scrub: true` so it tracks the scrollbar exactly, no easing lag.
 */
motionSafe.add(PREFERS_MOTION, () => {
  const layers = gsap.utils.toArray<HTMLElement>('[data-parallax]');
  layers.forEach((el) => {
    const speed = parseFloat(el.dataset.parallax || '0.2');
    gsap.to(el, {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: el.closest('[data-parallax-scope]') || el.parentElement || el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });
});
