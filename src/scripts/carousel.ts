import { gsap, motionSafe, PREFERS_MOTION } from './gsap-setup';

const AUTO_ADVANCE_MS = 5000;

function setupCarousel(root: HTMLElement, animated: boolean) {
  const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-carousel-slide]'));
  const dotsRoot = root.parentElement?.querySelector('[data-carousel-dots]');
  const dots = dotsRoot ? Array.from(dotsRoot.querySelectorAll<HTMLElement>('[data-carousel-dot]')) : [];
  if (slides.length <= 1) return;

  let index = 0;
  let timer: ReturnType<typeof setInterval>;

  function show(next: number) {
    const prev = index;
    index = (next + slides.length) % slides.length;
    if (prev === index) return;

    // Two conflicting `bg-*` utility classes can't reliably override each other by
    // toggling (CSS source order wins, not DOM class order) — set the active dot's
    // color directly instead.
    dots.forEach((dot, i) => {
      dot.style.backgroundColor = i === index ? 'var(--color-accent)' : '';
    });

    if (!animated) {
      slides[prev]!.style.opacity = '0';
      slides[index]!.style.opacity = '1';
      return;
    }
    gsap.to(slides[prev], { opacity: 0, y: -12, duration: 0.5, ease: 'power2.inOut' });
    gsap.fromTo(slides[index], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.inOut' });
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(() => show(index + 1), AUTO_ADVANCE_MS);
  }

  dots.forEach((dot, i) =>
    dot.addEventListener('click', () => {
      show(i);
      restart();
    }),
  );

  root.addEventListener('mouseenter', () => clearInterval(timer));
  root.addEventListener('mouseleave', restart);

  restart();
}

const carousels = document.querySelectorAll<HTMLElement>('[data-carousel]');
motionSafe.add(PREFERS_MOTION, () => {
  carousels.forEach((el) => setupCarousel(el, true));
});
motionSafe.add('(prefers-reduced-motion: reduce)', () => {
  carousels.forEach((el) => setupCarousel(el, false));
});
