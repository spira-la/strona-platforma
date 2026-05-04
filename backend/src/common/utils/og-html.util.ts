/**
 * Open Graph HTML generator for social-media link previews.
 *
 * Returns a minimal HTML document that:
 *   1. Exposes Open Graph + Twitter Card meta tags for crawlers
 *      (facebookexternalhit, Twitterbot, LinkedInBot, WhatsApp, …).
 *   2. Redirects real users to the SPA via <meta http-equiv="refresh">
 *      (in case nginx routes a non-crawler here by mistake).
 *
 * Used by feature modules that have public, shareable URLs
 * (blogs today; services / packages / products in the future).
 */

const SITE_URL =
  process.env.FRONTEND_URL || process.env.WEB_URL || 'https://spira-la.com';

const SITE_NAME = 'Spirala';
const FALLBACK_IMAGE = `${SITE_URL}/og-image.jpg`;

const LOCALE_MAP: Record<string, string> = {
  pl: 'pl_PL',
  en: 'en_US',
  es: 'es_ES',
};

export interface OgHtmlOptions {
  /** Page title (e.g. blog post title). Will be HTML-escaped. */
  title: string;
  /** Short description (~200 chars). Will be HTML-escaped + stripped of HTML. */
  description: string;
  /** Canonical URL for real users (e.g. https://spira-la.com/blog/foo). */
  url: string;
  /** Cover image URL (absolute). Falls back to /og-image.jpg if empty. */
  image?: string | null;
  /** og:type — defaults to 'article' for blogs, use 'product' for services. */
  type?: 'article' | 'product' | 'website';
  /** Author name (for og:article:author). Optional. */
  author?: string | null;
  /** ISO date string for og:article:published_time. Optional. */
  publishedAt?: string | null;
  /** Locale: 'pl' | 'en' | 'es'. Defaults to 'pl'. */
  lang?: string;
  /** Optional product price (PLN). Only used when type='product'. */
  price?: string | null;
}

/**
 * HTML-escape a string for safe interpolation into HTML attributes / text.
 */
export function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Strip HTML tags from a string (for descriptions extracted from rich content).
 */
export function stripHtml(input: string): string {
  return (
    input
      // eslint-disable-next-line sonarjs/slow-regex -- safe: negated class with single quantifier, no backtracking
      .replaceAll(/<[^>]*>/g, '')
      .replaceAll(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Truncate to N chars without breaking mid-word, append ellipsis if truncated.
 */
export function truncate(input: string, max = 200): string {
  if (input.length <= max) return input;
  const cut = input.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const safe = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${safe}…`;
}

/**
 * Build a complete HTML document with OG + Twitter meta tags.
 * All user-controlled fields are escaped.
 */
export function buildOgHtml(options: OgHtmlOptions): string {
  const {
    title,
    description,
    url,
    image,
    type = 'article',
    author,
    publishedAt,
    lang = 'pl',
    price,
  } = options;

  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(truncate(stripHtml(description), 200));
  const safeUrl = escapeHtml(url);
  const safeImage = escapeHtml(image || FALLBACK_IMAGE);
  const locale = LOCALE_MAP[lang] || LOCALE_MAP.pl;

  const articleTags =
    type === 'article'
      ? [
          publishedAt
            ? `<meta property="article:published_time" content="${escapeHtml(publishedAt)}" />`
            : '',
          author
            ? `<meta property="article:author" content="${escapeHtml(author)}" />`
            : '',
        ]
          .filter(Boolean)
          .join('\n  ')
      : '';

  const productTags =
    type === 'product' && price
      ? [
          `<meta property="product:price:amount" content="${escapeHtml(price)}" />`,
          `<meta property="product:price:currency" content="PLN" />`,
        ].join('\n  ')
      : '';

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle} | ${SITE_NAME}</title>
  <meta name="description" content="${safeDescription}" />

  <!-- Open Graph -->
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:type" content="${type}" />
  <meta property="og:url" content="${safeUrl}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${safeTitle}" />
  <meta property="og:locale" content="${locale}" />
  ${articleTags}
  ${productTags}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />
  <meta name="twitter:image" content="${safeImage}" />

  <!-- Real users land here only if nginx didn't route them to the SPA;
       redirect them to the canonical URL. -->
  <meta http-equiv="refresh" content="0;url=${safeUrl}" />
  <link rel="canonical" href="${safeUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${safeUrl}">${safeTitle}</a>…</p>
</body>
</html>`;
}

export function getSiteUrl(): string {
  return SITE_URL;
}

export function getFallbackImage(): string {
  return FALLBACK_IMAGE;
}
