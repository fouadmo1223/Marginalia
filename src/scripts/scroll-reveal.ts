import { gsap, motionSafe, PREFERS_MOTION } from './gsap-setup';

motionSafe.add(PREFERS_MOTION, () => {
  // Premium reveal: soft blur-to-focus + gentle rise + micro-scale, eased with an
  // expo-out curve instead of a linear fade so it reads as considered, not default.
  const items = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  items.forEach((el, i) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 20, scale: 0.985, filter: 'blur(4px)' },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1,
        // A small base delay keeps above-the-fold items (which trigger almost
        // instantly on load) from colliding with page-transition.ts's own fade —
        // two competing animations firing in the same instant is what reads as
        // "rough" rather than a single considered motion.
        delay: 0.1 + Math.min(i, 6) * 0.06,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      },
    );
  });

  // Cinematic clip-reveal for showcase images (e.g. the homepage featured story).
  const images = gsap.utils.toArray<HTMLElement>('[data-reveal-image]');
  images.forEach((el) => {
    gsap.fromTo(
      el,
      { clipPath: 'inset(0 0 100% 0)', scale: 1.12 },
      {
        clipPath: 'inset(0 0 0% 0)',
        scale: 1,
        duration: 1.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      },
    );
  });

  // Horizontal stagger for chip/avatar strips (categories, writers to follow).
  const strips = gsap.utils.toArray<HTMLElement>('[data-reveal-strip]');
  strips.forEach((strip) => {
    const children = Array.from(strip.children) as HTMLElement[];
    gsap.fromTo(
      children,
      { opacity: 0, x: 24, scale: 0.96 },
      {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.06,
        ease: 'back.out(1.4)',
        scrollTrigger: { trigger: strip, start: 'top 90%', once: true },
      },
    );
  });
});
