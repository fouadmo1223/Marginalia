import { gsap } from './gsap-setup';

/**
 * Signature moment: clicking the featured story's image doesn't just navigate —
 * the image expands to fill the viewport first, then the browser follows through
 * to the article. Self-contained to this one card (a real cross-page shared-element
 * transition would mean adopting Astro's ClientRouter site-wide, which risks
 * interacting with every sticky/pinned element across the app; this scoped version
 * gets the signature moment without that blast radius).
 */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const link = document.querySelector<HTMLAnchorElement>('[data-featured-link]');
const image = document.querySelector<HTMLImageElement>('[data-featured-image]');

if (link && image && !reduceMotion) {
  link.addEventListener('click', (e) => {
    const rect = image.getBoundingClientRect();
    const clone = image.cloneNode(true) as HTMLImageElement;

    clone.style.position = 'fixed';
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.objectFit = 'cover';
    clone.style.zIndex = '100';
    clone.style.borderRadius = '8px';
    clone.style.margin = '0';
    document.body.appendChild(clone);

    e.preventDefault();
    const href = link.href;

    gsap.to(clone, {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      borderRadius: 0,
      duration: 0.55,
      ease: 'power3.inOut',
      onComplete: () => {
        window.location.href = href;
      },
    });
  });
}
