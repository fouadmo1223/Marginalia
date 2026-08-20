import { gsap } from './gsap-setup';

const root = document.querySelector<HTMLElement>('[data-filter-root]');
if (root) {
  const grid = root.querySelector<HTMLElement>('[data-filter-grid]')!;
  const empty = root.querySelector<HTMLElement>('[data-filter-empty]')!;
  const allCheckbox = root.querySelector<HTMLInputElement>('[data-filter-all]')!;
  const catCheckboxes = Array.from(root.querySelectorAll<HTMLInputElement>('.filter-cat'));
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-item]'));
  const sortButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-sort]'));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One simple crossfade covers both filtering and sorting: fade the grid out,
  // swap the DOM (display toggles / reorder), fade back in. No Flip/absolute
  // positioning — that approach collapsed the grid's height mid-transition
  // (letting the footer ride up underneath) and left a stray "slide" once its
  // transform was cleared and the card's own hover-transition picked it up.
  function crossfade(mutate: () => void) {
    if (reduceMotion) {
      mutate();
      return;
    }
    gsap.to(grid, {
      opacity: 0,
      duration: 0.15,
      ease: 'power1.out',
      onComplete: () => {
        mutate();
        gsap.fromTo(grid, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power1.out' });
      },
    });
  }

  function applyFilters() {
    crossfade(() => {
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
    });
  }

  catCheckboxes.forEach((cb) => cb.addEventListener('change', applyFilters));
  allCheckbox.addEventListener('change', () => {
    catCheckboxes.forEach((cb) => (cb.checked = allCheckbox.checked));
    applyFilters();
  });

  function applySort(mode: 'date' | 'likes') {
    crossfade(() => {
      const sorted = [...items].sort((a, b) => {
        const key = mode === 'date' ? 'date' : 'likes';
        return Number(b.dataset[key]) - Number(a.dataset[key]);
      });
      sorted.forEach((item) => grid.appendChild(item));
      sortButtons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.sort === mode)));
    });
  }

  sortButtons.forEach((btn) => {
    btn.addEventListener('click', () => applySort(btn.dataset.sort as 'date' | 'likes'));
  });
}
