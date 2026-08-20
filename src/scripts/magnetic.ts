import { gsap, motionSafe, PREFERS_MOTION } from './gsap-setup';

/**
 * Magnetic hover: elements marked `data-magnetic` nudge toward the cursor within
 * their own bounds and spring back on leave. Desktop + fine-pointer only — this is
 * a decorative flourish, not a functional affordance, so it must never interfere
 * with touch targets or fight reduced-motion users.
 */
const canMagnetic = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (canMagnetic) {
  motionSafe.add(PREFERS_MOTION, () => {
    const els = gsap.utils.toArray<HTMLElement>('[data-magnetic]');
    els.forEach((el) => {
      const strength = Number(el.dataset.magneticStrength || 0.35);
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);
        xTo(relX * strength);
        yTo(relY * strength);
      });

      el.addEventListener('mouseleave', () => {
        xTo(0);
        yTo(0);
      });
    });
  });
}
