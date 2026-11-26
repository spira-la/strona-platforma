import { featureFlags } from '@/config/features';

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const MEASUREMENT_ID = 'G-JLMXP0ZTKH';

/**
 * Loads Google Analytics (gtag.js) — only when the `analytics` feature flag is
 * on. It used to sit in index.html; it moved here (2026-11-26) so the site can
 * run without collecting any visitor data. While the flag is off, nothing is
 * loaded and trackPageView / trackEvent do nothing.
 */
export function loadAnalytics(): void {
  if (!featureFlags.analytics || globalThis.window === undefined) return;
  if (typeof globalThis.window.gtag === 'function') return;

  const script = globalThis.document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  globalThis.document.head.append(script);

  globalThis.window.dataLayer = globalThis.window.dataLayer ?? [];
  globalThis.window.gtag = function gtagShim() {
    // gtag.js expects the `arguments` object itself, not an array copy
    // eslint-disable-next-line prefer-rest-params
    globalThis.window.dataLayer?.push(arguments);
  };
  globalThis.window.gtag('js', new Date());
  // SPA: disable automatic page_view; RouteTracker fires it on every route change
  globalThis.window.gtag('config', MEASUREMENT_ID, { send_page_view: false });
}

function gtag(...args: unknown[]): void {
  if (
    globalThis.window === undefined ||
    typeof globalThis.window.gtag !== 'function'
  ) {
    return;
  }
  globalThis.window.gtag(...(args as [string, ...unknown[]]));
}

export function trackPageView(path: string, title?: string): void {
  gtag('event', 'page_view', {
    page_path: path,
    page_location: globalThis.window.location.href,
    page_title: title ?? globalThis.document.title,
    send_to: MEASUREMENT_ID,
  });
}

export function trackEvent(
  name: string,
  params: Record<string, unknown> = {},
): void {
  gtag('event', name, { ...params, send_to: MEASUREMENT_ID });
}
