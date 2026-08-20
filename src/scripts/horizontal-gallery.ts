// A native horizontally-scrolling strip (overflow-x + scroll-snap) — the user's
// own touchpad/swipe/drag drives it, with prev/next buttons for a pointer-driven
// nudge. Deliberately not scroll-hijacked: pinning vertical scroll to drive
// horizontal motion is fragile (layout-timing dependent) for what is, visually,
// just a carousel.
const section = document.getElementById('horiz-gallery');
const strip = section?.querySelector<HTMLElement>('[data-scroll-strip]');
const prevBtn = section?.querySelector<HTMLButtonElement>('[data-scroll-prev]');
const nextBtn = section?.querySelector<HTMLButtonElement>('[data-scroll-next]');

if (strip) {
  const scrollByCard = () => {
    const card = strip.querySelector<HTMLElement>('a');
    return card ? card.getBoundingClientRect().width + 24 : strip.clientWidth * 0.8;
  };

  function updateButtons() {
    if (!prevBtn || !nextBtn || !strip) return;
    const maxScroll = strip.scrollWidth - strip.clientWidth;
    prevBtn.disabled = strip.scrollLeft <= 4;
    nextBtn.disabled = maxScroll <= 4 || strip.scrollLeft >= maxScroll - 4;
  }

  prevBtn?.addEventListener('click', () => strip.scrollBy({ left: -scrollByCard(), behavior: 'smooth' }));
  nextBtn?.addEventListener('click', () => strip.scrollBy({ left: scrollByCard(), behavior: 'smooth' }));

  // Subtle drift: each card's frame shifts slightly opposite the strip's own
  // scroll direction, so the gallery reads as layered rather than flat. Applied
  // to the frame (not the <img>) so it doesn't fight the image's own hover-scale
  // transform — transforms on parent and child compose independently.
  const frames = Array.from(strip.querySelectorAll<HTMLElement>('[data-gallery-frame]'));
  function updateParallax() {
    if (!strip) return;
    // Use layout position (offsetLeft, unaffected by our own translateX) rather
    // than getBoundingClientRect — reading the transformed screen position back
    // in the same pass that sets it would compound the offset every scroll tick.
    const viewportCenter = strip.scrollLeft + strip.clientWidth / 2;
    frames.forEach((frame) => {
      const card = frame.closest<HTMLElement>('[data-gallery-item]')!;
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const offset = (cardCenter - viewportCenter) / strip.clientWidth;
      frame.style.transform = `translateX(${(-offset * 14).toFixed(1)}px)`;
    });
  }

  strip.addEventListener('scroll', () => {
    updateButtons();
    updateParallax();
  }, { passive: true });
  updateParallax();

  // Layout (and therefore scrollWidth) can still be settling on first paint —
  // recompute whenever the strip's own size changes rather than trusting a
  // single measurement taken at script-run time.
  new ResizeObserver(updateButtons).observe(strip);
  updateButtons();
}
