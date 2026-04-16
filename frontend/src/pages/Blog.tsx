import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SEO } from '@/components/shared/SEO';
import { ArrowRight, Calendar, Mail } from 'lucide-react';
import { EditableText } from '@/components/cms/EditableText';
import { EditableBackground } from '@/components/cms/EditableBackground';
import { EditableOverlay } from '@/components/cms/EditableOverlay';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';
import { blogsClient, type BlogPost } from '@/clients/blogs.client';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function getCategory(post: BlogPost): string {
  return post.categories?.[0]?.name ?? 'Artykuł';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface BlogCardProps {
  post: BlogPost;
}

function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="flex flex-col bg-white rounded-lg overflow-hidden shadow-sm border border-[#F0EDE8] hover:shadow-md transition-shadow duration-300">
      <div className="relative overflow-hidden h-48">
        <img
          src={post.coverImageUrl ?? DEFAULT_COVER}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col flex-1 p-5 gap-3">
        <span className="inline-block self-start font-['Lato'] text-[11px] font-semibold tracking-[0.08em] uppercase text-[#B8944A] bg-[#B8944A]/[0.1] rounded-full px-3 py-1">
          {getCategory(post)}
        </span>
        <h3 className="font-['Cormorant_Garamond'] text-[17px] font-bold text-[#2D2D2D] leading-snug">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-relaxed flex-1">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-[#F0EDE8] mt-auto">
          <span className="flex items-center gap-1.5 font-['Lato'] text-[13px] text-[#8A8A8A]">
            <Calendar size={13} aria-hidden="true" />
            {formatDate(post.publishedAt ?? post.createdAt)}
          </span>
          <Link
            to={`/blog/${post.slug}`}
            className="flex items-center gap-1 font-['Lato'] text-[13px] font-semibold text-[#B8944A] hover:text-[#D4B97A] transition-colors"
            aria-label={`Czytaj wiecej: ${post.title}`}
          >
            <EditableText
              section="blog"
              fieldPath="readMore"
              as="span"
              placeholder="Czytaj"
            />
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function HeroSection() {
  return (
    <section
      className="relative flex items-center justify-center min-h-[380px] md:min-h-[440px] overflow-hidden"
      aria-label="Naglowek bloga"
    >
      <EditableBackground
        section="blog"
        fieldPath="heroBg"
        fallbackSrc="https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop"
        className="absolute inset-0"
        aria-hidden={true}
      />
      <EditableOverlay
        section="blog"
        fieldPath="heroBg"
        defaultTop={55}
        defaultBottom={78}
      />
      <ScrollReveal
        animation="fade"
        delay={200}
        className="relative z-10 flex flex-col items-center text-center px-6 py-16 max-w-[780px] mx-auto gap-5"
      >
        <EditableText
          section="blog"
          fieldPath="hero.title"
          as="h1"
          className="font-['Cormorant_Garamond'] text-[2rem] md:text-[44px] font-bold italic text-white leading-[1.2]"
          placeholder="Refleksje, narzedzia, inspiracje"
        />
        <EditableText
          section="blog"
          fieldPath="hero.subtitle"
          as="p"
          className="font-['Lato'] text-[16px] text-white/80 leading-[1.7] max-w-[580px]"
          placeholder="Artykuly o psychologii, coachingu i osobistym rozwoju pisane z mysla o Tobie."
        />
      </ScrollReveal>
    </section>
  );
}

interface FeaturedPostSectionProps {
  post: BlogPost;
}

function FeaturedPostSection({ post }: FeaturedPostSectionProps) {
  const category = post.categories?.[0]?.name;
  return (
    <section
      className="bg-[#FAF8F5] pt-10 md:pt-16 pb-10 md:pb-16"
      aria-label="Wyrozniony artykul"
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col md:flex-row gap-0 rounded-lg overflow-hidden bg-[#F5F3EF] md:h-[420px]">
            <div className="md:w-1/2 relative overflow-hidden h-[280px] md:h-full">
              <img
                src={post.coverImageUrl ?? DEFAULT_COVER}
                alt={post.title}
                className="w-full h-full object-cover absolute inset-0"
              />
            </div>
            <div className="md:w-1/2 flex flex-col justify-center gap-5 px-10 py-12 md:px-14 md:py-12">
              {(category || post.publishedAt || post.createdAt) && (
                <div className="flex flex-wrap items-center gap-4">
                  {category && (
                    <span className="inline-block font-['Lato'] text-[11px] font-bold tracking-[0.2em] uppercase text-white bg-[#B8944A] rounded-md px-3 py-1.5">
                      {category}
                    </span>
                  )}
                  <span className="font-['Lato'] text-[13px] text-[#8A8A8A]">
                    {formatDate(post.publishedAt ?? post.createdAt)}
                  </span>
                </div>
              )}
              <h2 className="font-['Playfair_Display'] text-[32px] md:text-[42px] font-normal text-[#2D2D2D] leading-[1.15] tracking-[-0.015em]">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="font-['Lato'] text-[15px] md:text-[16px] text-[#6B6B6B] leading-[1.8]">
                  {post.excerpt}
                </p>
              )}
              <Link
                to={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 self-start font-['Lato'] text-[14px] font-semibold text-[#B8944A] hover:text-white hover:bg-[#B8944A] border border-[#B8944A] rounded px-6 py-3 transition-colors mt-2"
              >
                <EditableText
                  section="blog"
                  fieldPath="featured.cta"
                  as="span"
                  placeholder="Czytaj artykuł"
                />
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

interface ArticleGridSectionProps {
  posts: BlogPost[];
  isLoading: boolean;
}

function ArticleGridSection({ posts, isLoading }: ArticleGridSectionProps) {
  return (
    <section
      className="bg-[#FAF8F5] py-14 md:py-20"
      aria-label="Artykuly i refleksje"
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col items-center text-center gap-3 mb-12">
            <EditableText
              section="blog"
              fieldPath="grid.eyebrow"
              as="span"
              className="font-['Lato'] text-[11px] font-semibold tracking-[0.25em] uppercase text-[#B8944A]"
              placeholder="WSZYSTKIE WPISY"
            />
            <EditableText
              section="blog"
              fieldPath="grid.title"
              as="h2"
              className="font-['Playfair_Display'] text-[32px] md:text-[40px] font-normal text-[#2D2D2D] leading-[1.1]"
              placeholder="Artykuły i refleksje"
            />
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[380px] rounded-lg bg-white border border-[#F0EDE8] animate-pulse"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center font-['Lato'] text-[15px] text-[#8A8A8A] py-12">
            Brak artykułów. Wkrótce pojawią się tu nowe wpisy.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <ScrollReveal
                key={post.id}
                animation="fade-up"
                delay={stagger(i)}
              >
                <BlogCard post={post} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    // Newsletter subscription — wired to API in future iteration
    setSubmitted(true);
  }

  return (
    <section
      className="bg-white py-14 md:py-20"
      aria-label="Zapis do newslettera"
    >
      <ScrollReveal animation="fade-up">
        <div className="max-w-[680px] mx-auto px-6 flex flex-col items-center text-center gap-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#B8944A]/[0.1] text-[#B8944A]">
            <Mail size={24} aria-hidden="true" />
          </div>
          <EditableText
            section="blog"
            fieldPath="newsletter.title"
            as="h2"
            className="font-['Cormorant_Garamond'] text-[26px] md:text-[32px] font-bold text-[#2D2D2D]"
            placeholder="Refleksje prosto do Twojej skrzynki"
          />
          <EditableText
            section="blog"
            fieldPath="newsletter.description"
            as="p"
            className="font-['Lato'] text-[15px] text-[#6B6B6B] leading-[1.7]"
            placeholder="Co tydzien nowy artykul, praktyczne narzedzia i refleksje, ktore wspieraja Twoja droge. Bez spamu, tylko tresc z glebią."
          />

          {submitted ? (
            <div className="w-full max-w-[480px] rounded-lg bg-[#B8944A]/[0.1] border border-[#B8944A]/30 px-6 py-4">
              <p className="font-['Lato'] text-[15px] font-semibold text-[#B8944A]">
                <EditableText
                  section="newsletter"
                  fieldPath="successMsg"
                  as="span"
                  placeholder="Dziękujemy za zapis! Sprawdź swoją skrzynkę."
                />
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 w-full max-w-[480px]"
              noValidate
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Adres e-mail
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Twoj adres e-mail"
                required
                className="flex-1 font-['Lato'] text-[14px] text-[#2D2D2D] placeholder:text-[#8A8A8A] bg-[#FAF8F5] border border-[#E8E4DF] rounded-lg px-4 py-3 outline-none focus:border-[#B8944A] focus:ring-2 focus:ring-[#B8944A]/20 transition"
              />
              <button
                type="submit"
                className="font-['Lato'] text-[14px] font-semibold text-white bg-[#B8944A] hover:bg-[#D4B97A] rounded-lg px-6 py-3 transition-colors whitespace-nowrap"
              >
                <EditableText
                  section="newsletter"
                  fieldPath="submitButton"
                  as="span"
                  placeholder="Zapisz się"
                />
              </button>
            </form>
          )}
        </div>
      </ScrollReveal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Blog() {
  const { data, isLoading } = useQuery({
    queryKey: ['blogs', 'published'],
    queryFn: () => blogsClient.getPublished(),
    staleTime: 60_000,
  });

  const posts = data ?? [];
  const [featured, ...rest] = posts;

  return (
    <main>
      <SEO
        title="Blog"
        description="Artykuły o psychologii, coachingu, rozwoju osobistym i pracy z ciałem."
        canonical="/blog"
      />
      <HeroSection />
      {featured && <FeaturedPostSection post={featured} />}
      <ArticleGridSection posts={rest} isLoading={isLoading} />
      <NewsletterSection />
    </main>
  );
}
