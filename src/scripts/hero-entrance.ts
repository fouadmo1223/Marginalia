import { gsap } from 'gsap';

const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  const words = gsap.utils.toArray<HTMLElement>('[data-hero-word]');
  const fades = gsap.utils.toArray<HTMLElement>('[data-hero-fade]');
  if (words.length === 0) return;

  gsap
    .timeline({ defaults: { ease: 'power3.out' } })
    .fromTo(words, { yPercent: 130 }, { yPercent: 0, duration: 0.8, stagger: 0.06 })
    .fromTo(fades, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, '-=0.35');
});
