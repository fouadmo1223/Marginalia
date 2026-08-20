import { gsap } from 'gsap';

// A subtle fade-and-rise entrance for the main content on every page load.
// Registered once per page via BaseLayout; skipped entirely under reduced motion.
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  const main = document.querySelector('main');
  if (!main) return;
  gsap.fromTo(main, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
});
