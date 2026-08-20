import { gsap } from './gsap-setup';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

const root = document.querySelector<HTMLElement>('[data-filter-root]');
if (root) {
  const grid = root.querySelector<HTMLElement>('[data-filter-grid]')!;
  const empty = root.querySelector<HTMLElement>('[data-filter-empty]')!;
  const allCheckbox = root.querySelector<HTMLInputElement>('[data-filter-all]')!;
  const catCheckboxes = Array.from(root.querySelectorAll<HTMLInputElement>('.filter-cat'));
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-item]'));
  const sortButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-sort]'));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function applyFilters() {
    const state = Flip.getState(items);

    const checked = catCheckboxes.filter((cb) => cb.checked);
    const showAll = checked.length === 0 || checked.length === catCheckboxes.length;

    let visibleCount = 0;
    items.forEach((item) => {
      const matches = showAll || checked.some((cb) => item.classList.contains(`cat-${cb.dataset.cat}`));
      item.style.display = matches ? '' : 'none';
      if (matches) visibleCount += 1;
    });

    empty.hidden = visibleCount > 0;
    allCheckbox.checked = showAll;

    if (reduceMotion) return;
    Flip.from(state, {
      duration: 0.55,
      scale: true,
      ease: 'power1.inOut',
      stagger: 0.03,
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.4 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.8, duration: 0.3 }),
    });
  }

  catCheckboxes.forEach((cb) => cb.addEventListener('change', applyFilters));
  allCheckbox.addEventListener('change', () => {
    catCheckboxes.forEach((cb) => (cb.checked = allCheckbox.checked));
    applyFilters();
  });

  function applySort(mode: 'date' | 'likes') {
    const state = Flip.getState(items);

    const sorted = [...items].sort((a, b) => {
      const key = mode === 'date' ? 'date' : 'likes';
      return Number(b.dataset[key]) - Number(a.dataset[key]);
    });
    sorted.forEach((item) => grid.appendChild(item));

    sortButtons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.sort === mode)));

    if (reduceMotion) return;
    Flip.from(state, { duration: 0.5, ease: 'power2.inOut', absolute: true });
  }

  sortButtons.forEach((btn) => {
    btn.addEventListener('click', () => applySort(btn.dataset.sort as 'date' | 'likes'));
  });
}
