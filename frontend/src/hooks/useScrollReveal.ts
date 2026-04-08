import { useEffect, useRef, useState } from 'react';

interface UseScrollRevealOptions {
  /** Fraction of the element visible before triggering (0–1). Default: 0.01 */
  threshold?: number;
  /** Only trigger once. Default: true */
  once?: boolean;
  /** Root margin to trigger earlier. Default: '50px' — triggers 50px before entering viewport */
  rootMargin?: string;
}

/**
 * Returns a ref to attach to an element and a boolean indicating visibility.
 * When the element enters the viewport, `isVisible` becomes true.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollRevealOptions = {},
) {
  const { threshold = 0.01, once = true, rootMargin = '0px 0px 50px 0px' } = options;
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

    // Check if element is already in viewport on mount (handles sections
    // visible on page load — e.g. the section right below the hero).
    // Use requestAnimationFrame to ensure layout is settled first.
    const rafId = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        // Element is visible — trigger with a tiny delay so the hidden
        // styles paint first and the CSS transition actually runs.
        setTimeout(() => setIsVisible(true), 60);
        return;
      }
    });

    // Also observe for scroll — handles elements below the fold.
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

    // Safety fallback: never leave content permanently hidden
    const fallback = setTimeout(() => setIsVisible(true), 2500);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [threshold, once, rootMargin, prefersReduced]);

  return { ref, isVisible };
}
