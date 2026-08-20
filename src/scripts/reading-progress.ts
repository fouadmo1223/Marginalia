const bar = document.querySelector<HTMLElement>('[data-reading-progress]');
const article = document.querySelector('article');

if (bar && article) {
  const update = () => {
    const rect = article.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
    const progress = total > 0 ? scrolled / total : 0;
    bar.style.transform = `scaleX(${progress})`;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}
