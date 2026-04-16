import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Copy,
  Mail,
  MessageCircle,
  Share2,
} from 'lucide-react';

function FacebookIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
import {
  blogsClient,
  type BlogPost as BlogPostType,
} from '@/clients/blogs.client';
import { SEO } from '@/components/shared/SEO';
import anetaAvatar from '@/assets/Ane2.jpg';

const SITE_URL = 'https://spira-la.com';
const DEFAULT_AUTHOR = {
  name: 'Aneta Spirala',
  role: 'Coach · Spirala',
  avatar: anetaAvatar,
};

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

function estimateReadTime(html: string | null): number {
  if (!html) return 1;
  const tagPattern = /<[^>]*>/g; // eslint-disable-line sonarjs/slow-regex
  const text = html.replaceAll(tagPattern, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function copyLinkToClipboard(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // Silent fail — clipboard may be unavailable
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ShareBarProps {
  url: string;
  title: string;
}

function ShareBar({ url, title }: ShareBarProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: 'Facebook',
      icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'Email',
      icon: Mail,
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    },
  ];

  return (
    <div className="flex items-center justify-between flex-wrap gap-4 py-6 border-y border-[#E8E4DF]">
      <span className="inline-flex items-center gap-2 font-['Lato'] text-[13px] font-semibold tracking-[0.15em] uppercase text-[#8A8A8A]">
        <Share2 size={14} aria-hidden="true" />
        Udostępnij artykuł
      </span>
      <div className="flex items-center gap-2">
        {shareLinks.map(({ name, icon: Icon, href }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Udostępnij na ${name}`}
            className="group relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#E8E4DF] text-[#6B6B6B] hover:text-[#B8963E] hover:border-[#B8963E] transition-colors"
          >
            <Icon size={15} aria-hidden="true" />
            <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#2D2D2D] px-2.5 py-1 font-['Lato'] text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {name}
            </span>
          </a>
        ))}
        <button
          type="button"
          onClick={() => copyLinkToClipboard(url)}
          aria-label="Skopiuj link"
          className="group relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#E8E4DF] text-[#6B6B6B] hover:text-[#B8963E] hover:border-[#B8963E] transition-colors"
        >
          <Copy size={15} aria-hidden="true" />
          <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#2D2D2D] px-2.5 py-1 font-['Lato'] text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
            Skopiuj link
          </span>
        </button>
      </div>
    </div>
  );
}

interface RelatedPostsProps {
  posts: BlogPostType[];
}

function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;
  return (
    <section className="bg-[#F5F3EF] py-16 md:py-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        <div className="flex flex-col items-center text-center gap-3 mb-12">
          <span className="font-['Lato'] text-[11px] font-semibold tracking-[0.25em] uppercase text-[#B8944A]">
            Czytaj dalej
          </span>
          <h2 className="font-['Playfair_Display'] text-[28px] md:text-[36px] font-normal text-[#2D2D2D] leading-[1.15]">
            Powiązane artykuły
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.slice(0, 3).map((p) => (
            <Link
              key={p.id}
              to={`/blog/${p.slug}`}
              className="group flex flex-col bg-white rounded-lg overflow-hidden border border-[#F0EDE8] hover:shadow-md transition-shadow"
            >
              <div className="h-48 overflow-hidden">
                {p.coverImageUrl && (
                  <img
                    src={p.coverImageUrl}
                    alt={p.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="flex flex-col gap-3 p-5">
                {p.categories?.[0] && (
                  <span className="inline-block self-start font-['Lato'] text-[10px] font-semibold tracking-[0.18em] uppercase text-[#B8944A]">
                    {p.categories[0].name}
                  </span>
                )}
                <h3 className="font-['Playfair_Display'] text-[18px] font-normal text-[#2D2D2D] leading-snug line-clamp-2">
                  {p.title}
                </h3>
                <span className="font-['Lato'] text-[12px] text-[#8A8A8A] mt-auto">
                  {formatDate(p.publishedAt ?? p.createdAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Loading / Not found states
// ---------------------------------------------------------------------------

function PostSkeleton() {
  return (
    <div className="max-w-[820px] mx-auto px-6 py-20 animate-pulse">
      <div className="h-4 bg-[#E8E4DF] rounded w-24 mb-10" />
      <div className="h-3 bg-[#E8E4DF] rounded w-40 mx-auto mb-5" />
      <div className="h-10 bg-[#E8E4DF] rounded w-full mb-4" />
      <div className="h-10 bg-[#E8E4DF] rounded w-3/4 mx-auto mb-8" />
      <div className="h-[420px] bg-[#E8E4DF] rounded-lg mt-10" />
    </div>
  );
}

function PostNotFound() {
  return (
    <div className="max-w-[780px] mx-auto px-6 py-24 text-center">
      <SEO
        title="Artykuł nie znaleziony"
        description="Artykuł nie został znaleziony."
        noindex
      />
      <p className="font-['Playfair_Display'] text-6xl font-normal text-[#B8963E] mb-4">
        404
      </p>
      <h1 className="font-['Playfair_Display'] text-2xl font-normal text-[#2D2D2D] mb-3">
        Artykuł nie został znaleziony
      </h1>
      <p className="font-['Lato'] text-[#6B6B6B] mb-8">
        Sprawdź czy adres jest poprawny lub wróć do listy artykułów.
      </p>
      <Link
        to="/blog"
        className="inline-flex items-center gap-2 font-['Lato'] font-semibold text-[#B8963E] hover:text-[#8A6F2E] transition-colors"
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

  const { data: allPosts } = useQuery({
    queryKey: ['blogs', 'published'],
    queryFn: () => blogsClient.getPublished(),
    staleTime: 60_000,
  });

  const related = useMemo(() => {
    if (!post || !allPosts) return [];
    return allPosts.filter((p) => p.id !== post.id);
  }, [post, allPosts]);

  const readTime = useMemo(
    () => estimateReadTime(post?.content ?? null),
    [post],
  );

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
  const fullUrl = `${SITE_URL}${canonicalPath}`;
  const ogImageUrl = post.coverImageUrl
    ? post.coverImageUrl.startsWith('http')
      ? post.coverImageUrl
      : `${SITE_URL}${post.coverImageUrl}`
    : `${SITE_URL}/og-image.jpg`;
  const category = post.categories?.[0]?.name;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? post.title,
    image: ogImageUrl,
    url: fullUrl,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: DEFAULT_AUTHOR.name },
    publisher: {
      '@type': 'Organization',
      name: 'Spirala',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/spirala-logo.png` },
    },
    keywords: post.categories?.map((c) => c.name).join(', ') ?? '',
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
          tags: post.categories?.map((c) => c.name) ?? undefined,
        }}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(articleJsonLd)}
        </script>
      </Helmet>

      {/* Cover image — clean, no overlay */}
      {post.coverImageUrl && (
        <section className="w-full">
          <div
            className="w-full overflow-hidden"
            style={{ height: 'clamp(320px, 50vh, 560px)' }}
          >
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </section>
      )}

      {/* Article header — between image and body */}
      <section
        className={`bg-[#FAF8F5] ${post.coverImageUrl ? 'pt-10 md:pt-12' : 'pt-14 md:pt-20'} pb-6 md:pb-8`}
      >
        <div className="max-w-[1060px] mx-auto px-5 sm:px-6 md:px-8 flex flex-col items-center text-center gap-6">
          {/* Category */}
          {category && (
            <span className="inline-block font-['Lato'] text-[11px] font-bold tracking-[0.25em] uppercase text-[#B8944A]">
              {category}
            </span>
          )}

          {/* Title */}
          <h1 className="font-['Playfair_Display'] text-[34px] sm:text-[42px] md:text-[52px] font-normal text-[#2D2D2D] leading-[1.1] tracking-[-0.02em]">
            {post.title}
          </h1>

          {/* Divider */}
          <div className="w-12 h-px bg-[#B8944A]" aria-hidden="true" />

          {/* Meta row: author + date + read time */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            <div className="inline-flex items-center gap-2.5">
              <img
                src={DEFAULT_AUTHOR.avatar}
                alt={DEFAULT_AUTHOR.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-[#F0EDE8]"
              />
              <span className="font-['Lato'] text-[13px] font-semibold text-[#2D2D2D]">
                {DEFAULT_AUTHOR.name}
              </span>
            </div>
            <span
              className="hidden sm:block w-px h-5 bg-[#E8E4DF]"
              aria-hidden="true"
            />
            <span className="inline-flex items-center gap-1.5 font-['Lato'] text-[13px] text-[#8A8A8A]">
              <Calendar size={12} aria-hidden="true" />
              {formatDate(post.publishedAt ?? post.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5 font-['Lato'] text-[13px] text-[#8A8A8A]">
              <Clock size={12} aria-hidden="true" />
              {readTime} min czytania
            </span>
          </div>
        </div>
      </section>

      {/* Article body */}
      <section className="pt-6 md:pt-8 pb-16">
        <div className="max-w-[1060px] mx-auto px-5 sm:px-6 md:px-8">
          <article
            className="prose prose-base max-w-none
              prose-headings:font-['Playfair_Display'] prose-headings:font-normal prose-headings:text-[#2D2D2D] prose-headings:tracking-[-0.01em]
              prose-h2:text-[22px] sm:prose-h2:text-[24px] md:prose-h2:text-[28px] prose-h2:mt-10 md:prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-[18px] sm:prose-h3:text-[20px] md:prose-h3:text-[22px] prose-h3:mt-8 prose-h3:mb-3
              prose-p:font-['Lato'] prose-p:text-[14px] sm:prose-p:text-[15px] md:prose-p:text-[16px] prose-p:text-[#3F3F3F] prose-p:leading-[1.8]
              prose-a:text-[#B8963E] prose-a:no-underline prose-a:font-semibold hover:prose-a:text-[#8A6F2E]
              prose-strong:text-[#2D2D2D] prose-strong:font-bold
              prose-blockquote:border-l-4 prose-blockquote:border-[#B8963E] prose-blockquote:bg-[#F5F3EF]
              prose-blockquote:py-3 prose-blockquote:px-5 md:prose-blockquote:px-7 prose-blockquote:rounded-r-lg
              prose-blockquote:not-italic prose-blockquote:font-['Playfair_Display'] prose-blockquote:text-[#2D2D2D]
              prose-blockquote:text-[16px] md:prose-blockquote:text-[18px] prose-blockquote:leading-[1.6]
              prose-img:rounded-lg prose-img:mx-auto prose-img:my-8
              prose-ul:font-['Lato'] prose-ul:text-[14px] sm:prose-ul:text-[15px] md:prose-ul:text-[16px] prose-ul:text-[#3F3F3F] prose-ul:leading-[1.75]
              prose-ol:font-['Lato'] prose-ol:text-[14px] sm:prose-ol:text-[15px] md:prose-ol:text-[16px] prose-ol:text-[#3F3F3F] prose-ol:leading-[1.75]
              prose-li:my-1
              prose-hr:border-[#E8E4DF] prose-hr:my-10 md:prose-hr:my-12
            "
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(post.content ?? ''),
            }}
          />

          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="mt-12 flex flex-wrap items-center gap-2">
              {post.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-block font-['Lato'] text-[12px] font-semibold tracking-[0.1em] uppercase text-[#B8944A] border border-[#B8944A]/40 rounded-full px-4 py-1.5"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          {/* Share */}
          <div className="mt-10">
            <ShareBar url={fullUrl} title={post.title} />
          </div>

          {/* Author bio card */}
          <div className="mt-10 p-6 md:p-8 bg-[#F5F3EF] rounded-lg flex flex-col sm:flex-row items-start gap-5">
            <img
              src={DEFAULT_AUTHOR.avatar}
              alt={DEFAULT_AUTHOR.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-white shrink-0"
            />
            <div className="flex flex-col gap-2">
              <span className="font-['Lato'] text-[11px] font-semibold tracking-[0.2em] uppercase text-[#B8944A]">
                O autorce
              </span>
              <h3 className="font-['Playfair_Display'] text-[20px] font-normal text-[#2D2D2D]">
                {DEFAULT_AUTHOR.name}
              </h3>
              <p className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-[1.7]">
                Coach systemowa, terapeutka i przewodniczka transformacji.
                Towarzyszę kobietom w odnajdywaniu wewnętrznej równowagi,
                uwalnianiu wzorców rodzinnych i budowaniu życia w zgodzie ze
                sobą.
              </p>
              <Link
                to="/o-mnie"
                className="inline-flex items-center gap-1.5 font-['Lato'] text-[13px] font-semibold text-[#B8963E] hover:text-[#8A6F2E] transition-colors mt-1"
              >
                Poznaj mnie
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Back to blog */}
          <div className="mt-12 text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 font-['Lato'] text-[14px] font-semibold text-[#B8963E] hover:text-white hover:bg-[#B8963E] border border-[#B8963E] rounded-md px-6 py-3 transition-colors"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Wróć do wszystkich artykułów
            </Link>
          </div>
        </div>
      </section>

      {/* Related posts */}
      <RelatedPosts posts={related} />
    </main>
  );
}
