import { gsap, motionSafe, PREFERS_MOTION } from './gsap-setup';

motionSafe.add(PREFERS_MOTION, () => {
  const counters = gsap.utils.toArray<HTMLElement>('[data-countup]');
  counters.forEach((el) => {
    const target = Number(el.dataset.target || '0');
    const counter = { value: 0 };
    gsap.to(counter, {
      value: target,
      duration: 1.6,
      ease: 'power2.out',
      snap: { value: 1 },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => {
        el.textContent = counter.value.toLocaleString();
      },
    });
  });
});

// Reduced-motion fallback: render final numbers immediately.
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll<HTMLElement>('[data-countup]').forEach((el) => {
    el.textContent = Number(el.dataset.target || '0').toLocaleString();
  });
}
