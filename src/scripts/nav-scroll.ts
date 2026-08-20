// Plain scroll listener (not GSAP-driven) so the header's elevated state is instant
// and never depends on the animation engine being active.
const header = document.querySelector<HTMLElement>('[data-site-header]');

if (header) {
  const apply = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  apply();
  window.addEventListener('scroll', apply, { passive: true });
}
