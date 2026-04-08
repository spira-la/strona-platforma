import { useEffect, useRef, useState } from 'react';

interface UseScrollRevealOptions {
  /** Fraction of the element visible before triggering (0–1). Default: 0.15 */
  threshold?: number;
  /** Only trigger once. Default: true */
  once?: boolean;
  /** Root margin to trigger earlier/later. Default: '0px 0px -40px 0px' */
  rootMargin?: string;
}

/**
 * Returns a ref to attach to an element and a boolean indicating visibility.
 * When the element enters the viewport, `isVisible` becomes true.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollRevealOptions = {},
) {
  const { threshold = 0.05, once = true, rootMargin = '0px 0px 0px 0px' } = options;
  const ref = useRef<T>(null);

  // Skip animations entirely if user prefers reduced motion
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [isVisible, setIsVisible] = useState(prefersReduced);

  useEffect(() => {
    if (prefersReduced) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => setIsVisible(true));
          if (once) observer.unobserve(el);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);

    // Safety fallback: if observer never fires (e.g. browser quirk),
    // make content visible after 3 seconds so it's never permanently hidden
    const fallback = setTimeout(() => setIsVisible(true), 3000);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [threshold, once, rootMargin, prefersReduced]);

  return { ref, isVisible };
}
