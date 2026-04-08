import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { blogsClient } from '@/clients/blogs.client';
import { SEO } from '@/components/shared/SEO';

const SITE_URL = 'https://spira-la.com';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr));
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

function PostSkeleton() {
  return (
    <div className="max-w-[780px] mx-auto px-6 py-16 animate-pulse">
      <div className="h-4 bg-[#E8E4DF] rounded w-24 mb-10" />
      <div className="h-[360px] bg-[#E8E4DF] rounded-lg mb-10" />
      <div className="h-8 bg-[#E8E4DF] rounded w-3/4 mb-4" />
      <div className="h-4 bg-[#E8E4DF] rounded w-48 mb-8" />
      <div className="space-y-3">
        <div className="h-4 bg-[#E8E4DF] rounded" />
        <div className="h-4 bg-[#E8E4DF] rounded" />
        <div className="h-4 bg-[#E8E4DF] rounded w-5/6" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Not found state
// ---------------------------------------------------------------------------

function PostNotFound() {
  return (
    <div className="max-w-[780px] mx-auto px-6 py-24 text-center">
      <SEO title="Artykuł nie znaleziony" description="Artykuł nie został znaleziony." noindex={true} />
      <p
        className="text-6xl font-bold text-[#B8963E] mb-4"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        404
      </p>
      <h1
        className="text-2xl font-semibold text-[#2D2D2D] mb-3"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        Artykuł nie został znaleziony
      </h1>
      <p className="text-[#6B6B6B] mb-8" style={{ fontFamily: "'Lato', sans-serif" }}>
        Sprawdź czy adres jest poprawny lub wróć do listy artykułów.
      </p>
      <Link
        to="/blog"
        className="inline-flex items-center gap-2 font-semibold text-[#B8963E] hover:text-[#8A6F2E] transition-colors"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Wróć do bloga
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  const {
    data: post,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => blogsClient.getBySlug(slug!),
    enabled: Boolean(slug),
    retry: false,
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FAF8F5]">
        <PostSkeleton />
      </main>
    );
  }

  if (isError || !post) {
    return (
      <main className="min-h-screen bg-[#FAF8F5]">
        <PostNotFound />
      </main>
    );
  }

  const canonicalPath = `/blog/${post.slug}`;
  const ogImageUrl = post.coverImageUrl
    ? post.coverImageUrl.startsWith('http')
      ? post.coverImageUrl
      : `${SITE_URL}${post.coverImageUrl}`
    : `${SITE_URL}/og-image.jpg`;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? post.title,
    image: ogImageUrl,
    url: `${SITE_URL}${canonicalPath}`,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: 'Aneta',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Spirala',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/spirala-logo.png`,
      },
    },
    keywords: post.tags?.join(', ') ?? '',
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      <SEO
        title={post.title}
        description={post.excerpt ?? post.title}
        canonical={canonicalPath}
        ogImage={post.coverImageUrl ?? undefined}
        ogType="article"
        article={{
          publishedTime: post.publishedAt ?? undefined,
          modifiedTime: post.updatedAt,
          tags: post.tags ?? undefined,
        }}
      />

      {/* Article JSON-LD */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(articleJsonLd)}
        </script>
      </Helmet>

      {/* Cover image */}
      {post.coverImageUrl && (
        <div className="w-full overflow-hidden" style={{ maxHeight: '600px' }}>
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full object-cover"
            style={{ maxHeight: '600px' }}
          />
        </div>
      )}

      {/* Article content */}
      <div className="max-w-[780px] mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 mb-10 text-[14px] font-semibold text-[#B8963E] hover:text-[#8A6F2E] transition-colors"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Wróć do bloga
        </Link>

        {/* Title */}
        <h1
          className="text-[2rem] md:text-[2.75rem] font-bold leading-[1.15] text-[#2D2D2D] mb-5"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {post.title}
        </h1>

        {/* Meta: date */}
        <div
          className="flex flex-wrap items-center gap-4 text-[13px] text-[#8A8A8A] mb-8 pb-8 border-b border-[#E8E4DF]"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          {post.publishedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar size={13} aria-hidden="true" />
              {formatDate(post.publishedAt)}
            </span>
          )}
        </div>

        {/* Body — sanitized HTML from TipTap */}
        <div
          className="prose prose-lg max-w-none
            prose-headings:font-['Cormorant_Garamond'] prose-headings:text-[#2D2D2D]
            prose-p:font-['Lato'] prose-p:text-[#4A4A4A] prose-p:leading-[1.8]
            prose-a:text-[#B8963E] prose-a:no-underline hover:prose-a:text-[#8A6F2E]
            prose-strong:text-[#2D2D2D]
            prose-blockquote:border-l-[#B8963E] prose-blockquote:text-[#6B6B6B]
            prose-img:rounded-lg
          "
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content ?? '') }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-[#E8E4DF]">
            <div className="flex flex-wrap items-center gap-2">
              <Tag size={14} className="text-[#B8963E]" aria-hidden="true" />
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block text-[12px] font-semibold tracking-wide uppercase text-[#B8963E] bg-[#B8963E]/10 rounded-full px-3 py-1"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Back link (bottom) */}
        <div className="mt-12">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#B8963E] hover:text-[#8A6F2E] transition-colors"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Wróć do bloga
          </Link>
        </div>
      </div>
    </main>
  );
}
