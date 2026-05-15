import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

export function RouteTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Defer so react-helmet-async has updated document.title for this route
    const id = globalThis.setTimeout(() => {
      trackPageView(pathname + search);
    }, 0);
    return () => globalThis.clearTimeout(id);
  }, [pathname, search]);

  return null;
}
