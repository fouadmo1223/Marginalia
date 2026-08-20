import { useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';

interface PreviewItem {
  id: string;
  url: string;
}

/**
 * Wrap a text-only list with this to get a floating image that trails the cursor
 * when hovering an item — desktop, fine-pointer only. Children call `bind(item)`
 * on their hover target to register; the preview itself lives once at the list
 * root so only one image element exists regardless of row count.
 */
export function useCursorPreview() {
  const [active, setActive] = useState<PreviewItem | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });
  const supportsHover = useRef(typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  function bind(item: PreviewItem | null) {
    if (!supportsHover.current) return {};
    return {
      onMouseEnter: () => setActive(item),
      onMouseLeave: () => setActive(null),
      onMouseMove: (e: React.MouseEvent) => {
        x.set(e.clientX + 24);
        y.set(e.clientY - 90);
      },
    };
  }

  const preview = supportsHover.current ? (
    <AnimatePresence>
      {active && (
        <motion.div
          key={active.id}
          style={{ x: springX, y: springY }}
          initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          exit={{ opacity: 0, scale: 0.85, rotate: 3 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none fixed left-0 top-0 z-50 h-32 w-44 overflow-hidden rounded-sm shadow-2xl"
        >
          <img src={active.url} alt="" className="h-full w-full object-cover" />
        </motion.div>
      )}
    </AnimatePresence>
  ) : null;

  return { bind, preview };
}
