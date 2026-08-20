import { gsap, motionSafe, PREFERS_MOTION } from './gsap-setup';

motionSafe.add(PREFERS_MOTION, () => {
  const marquees = gsap.utils.toArray<HTMLElement>('[data-marquee]');
  marquees.forEach((el) => {
    const distance = el.scrollWidth / 3;
    const tween = gsap.to(el, {
      x: -distance,
      duration: distance / 40,
      ease: 'none',
      repeat: -1,
    });
    el.addEventListener('mouseenter', () => tween.pause());
    el.addEventListener('mouseleave', () => tween.resume());
  });
});
