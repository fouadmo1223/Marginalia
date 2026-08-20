import { gsap, motionSafe, PREFERS_MOTION } from './gsap-setup';

/** Subtle magnetic 3D tilt that tracks the cursor, snaps back on leave. */
motionSafe.add(PREFERS_MOTION, () => {
  const cards = gsap.utils.toArray<HTMLElement>('[data-tilt]');
  cards.forEach((card) => {
    const strength = 8;

    function onMove(e: MouseEvent) {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(card, {
        rotateX: -py * strength,
        rotateY: px * strength,
        transformPerspective: 600,
        duration: 0.4,
        ease: 'power2.out',
      });
    }

    function onLeave() {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    }

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });
});
