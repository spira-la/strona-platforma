import { useEffect, useRef, useState } from 'react';

/**
 * True once the element has scrolled into view (then stays true). Used for
 * one-time decorative entrances — the growing meadow and the forget-me-nots
 * on "O mnie". Unlike useScrollReveal it does not skip the entrance for
 * reduced motion: these are short, one-off and in place (client
 * 2026-11-10 wants the animations on her phone too).
 */
export function useInViewOnce<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.3,
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in globalThis)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
