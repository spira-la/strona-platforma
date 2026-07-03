declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const MEASUREMENT_ID = 'G-JLMXP0ZTKH';

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
