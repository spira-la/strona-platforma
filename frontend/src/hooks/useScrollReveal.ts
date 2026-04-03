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
  const { threshold = 0.1, once = true, rootMargin = '0px 0px -20px 0px' } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if already in viewport (handles elements visible on page load)
    const rect = el.getBoundingClientRect();
    const alreadyVisible =
      rect.top < window.innerHeight * (1 - threshold) &&
      rect.bottom > 0;

    if (alreadyVisible) {
      // Small delay so the initial hidden styles are painted first,
      // then the transition to visible kicks in.
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once, rootMargin]);

  return { ref, isVisible };
}
