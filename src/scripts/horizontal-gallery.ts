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
  strip.addEventListener('scroll', updateButtons, { passive: true });

  // Layout (and therefore scrollWidth) can still be settling on first paint —
  // recompute whenever the strip's own size changes rather than trusting a
  // single measurement taken at script-run time.
  new ResizeObserver(updateButtons).observe(strip);
  updateButtons();
}
