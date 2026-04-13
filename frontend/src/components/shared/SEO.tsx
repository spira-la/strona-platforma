import { Helmet } from 'react-helmet-async';

interface ArticleMeta {
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
}

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: string;
  article?: ArticleMeta;
  noindex?: boolean;
}

const SITE_NAME = 'Spirala';
const SITE_URL = 'https://spira-la.com';
const DEFAULT_DESCRIPTION =
  'Coaching i terapia z Anetą — sesje indywidualne, pakiety, rozwój osobisty. Zarezerwuj sesję online.';
const DEFAULT_OG_IMAGE = '/og-image.jpg';

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt,
  ogType = 'website',
  article,
  noindex = false,
}: SEOProps) {
  const fullTitle = title
    ? `${title} — ${SITE_NAME}`
    : `${SITE_NAME} — Coaching & Terapia`;

  // Normalize canonical: strip trailing slash for consistency, except empty root
  const canonicalUrl =
    canonical == null
      ? undefined
      : (() => {
          const raw = canonical.startsWith('http')
            ? canonical
            : `${SITE_URL}${canonical}`;
          return raw === SITE_URL || raw === `${SITE_URL}/`
            ? SITE_URL
            : raw.replace(/\/$/, '');
        })();

  const ogImageUrl = ogImage.startsWith('http')
    ? ogImage
    : `${SITE_URL}${ogImage}`;

  const imageAlt = ogImageAlt ?? fullTitle;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="pl_PL" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {/* Article-specific */}
      {article?.publishedTime && (
        <meta
          property="article:published_time"
          content={article.publishedTime}
        />
      )}
      {article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {article?.author && (
        <meta property="article:author" content={article.author} />
      )}
      {article?.tags?.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}
    </Helmet>
  );
}
