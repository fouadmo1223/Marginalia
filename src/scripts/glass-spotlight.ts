// A frosted-glass spotlight that tracks the cursor over any [data-glass-spotlight]
// section: a backdrop-blurred layer masked to a soft circle centered on the pointer,
// so only the area under the cursor reads as "glass" against the section behind it.
const sections = document.querySelectorAll<HTMLElement>('[data-glass-spotlight]');

sections.forEach((section) => {
  const layer = section.querySelector<HTMLElement>('[data-glass-layer]');
  if (!layer) return;

  layer.style.backdropFilter = 'blur(14px) saturate(1.4)';
  (layer.style as CSSStyleDeclaration & { webkitBackdropFilter: string }).webkitBackdropFilter = 'blur(14px) saturate(1.4)';
  layer.style.background = 'color-mix(in srgb, var(--color-accent) 10%, transparent)';

  function setSpot(x: number, y: number) {
    const mask = `radial-gradient(circle 220px at ${x}px ${y}px, black 0%, transparent 100%)`;
    layer!.style.maskImage = mask;
    layer!.style.webkitMaskImage = mask;
  }

  section.addEventListener('mouseenter', () => {
    layer.style.opacity = '1';
  });
  section.addEventListener('mouseleave', () => {
    layer.style.opacity = '0';
  });
  section.addEventListener('mousemove', (e) => {
    const rect = section.getBoundingClientRect();
    setSpot(e.clientX - rect.left, e.clientY - rect.top);
  });
});
