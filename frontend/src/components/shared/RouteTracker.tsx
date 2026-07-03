import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

export function RouteTracker() {
  const { pathname, search } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const id = globalThis.setTimeout(() => {
        trackPageView(pathname + search);
      }, 0);
      return () => globalThis.clearTimeout(id);
    }

    // Defer so react-helmet-async updates document.title first, then track + move focus
    const id = globalThis.setTimeout(() => {
      trackPageView(pathname + search);
      const h1 = document.querySelector<HTMLElement>('h1');
      if (h1) {
        h1.setAttribute('tabindex', '-1');
        h1.focus({ preventScroll: false });
      }
    }, 100);

    return () => globalThis.clearTimeout(id);
  }, [pathname, search]);

  return null;
}
