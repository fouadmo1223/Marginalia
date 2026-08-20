import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Gate every animation behind this so `prefers-reduced-motion: reduce` disables all of it at once. */
export const motionSafe = gsap.matchMedia();
export const PREFERS_MOTION = '(prefers-reduced-motion: no-preference)';

// Images, fonts, and client:visible islands can all resize the page after
// ScrollTrigger has already measured trigger positions — without a refresh their
// start/end pixel values go stale and animations silently stop firing.
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready?.then(() => ScrollTrigger.refresh());
  setTimeout(() => ScrollTrigger.refresh(), 1200);
}

export { gsap, ScrollTrigger };
