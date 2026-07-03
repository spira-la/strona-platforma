import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';
import { EditableBackground } from '@/components/cms/EditableBackground';
import { EditableOverlay } from '@/components/cms/EditableOverlay';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';
import { GoldLine } from '@/components/shared/GoldLine';
import { YouTubeVideoCard } from '@/components/youtube/YouTubeVideoCard';
import { useYouTubeVideos } from '@/hooks/useYouTubeVideos';

const PAGE_SIZE = 12;
const LIBRARY_LIMIT = 50;

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-['Lato'] text-[12px] font-semibold tracking-[0.08em] uppercase text-[#B8963E] bg-[#B8963E]/[0.125] rounded-full px-4 py-1.5">
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function VideoCardSkeleton() {
  return (
    <div className="flex flex-col bg-white border border-[#E8E4DF] rounded-[12px] overflow-hidden animate-pulse">
      <div className="aspect-video w-full bg-[#F0EDE8]" />
      <div className="flex flex-col gap-2.5 p-5">
        <div className="h-4 w-full bg-[#F0EDE8] rounded" />
        <div className="h-3 w-5/6 bg-[#F0EDE8] rounded" />
        <div className="h-3 w-4/6 bg-[#F0EDE8] rounded" />
        <div className="h-8 w-24 bg-[#F0EDE8] rounded-full mt-auto" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[#EDE8DC] flex items-center justify-center">
        <RefreshCw size={24} className="text-[#B8963E]" aria-hidden="true" />
      </div>
      <h2 className="font-['Cormorant_Garamond'] text-[22px] font-bold text-[#2D2D2D]">
        {t('youtube.errorTitle')}
      </h2>
      <p className="font-['Lato'] text-[14px] text-[#6B6B6B] max-w-[400px]">
        {t('youtube.errorBody')}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 font-['Lato'] text-[14px] font-semibold text-white bg-[#B8963E] hover:bg-[#8A6F2E] transition-colors rounded-full px-8 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E] focus-visible:ring-offset-2"
      >
        <RefreshCw size={14} aria-hidden="true" />
        {t('common.loading')}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      {/* Decorative leaf using CSS */}
      <div className="text-[48px] leading-none select-none" aria-hidden="true">
        🌿
      </div>
      <h2 className="font-['Cormorant_Garamond'] text-[22px] font-bold text-[#2D2D2D]">
        {t('youtube.emptyTitle')}
      </h2>
      <p className="font-['Lato'] text-[14px] text-[#6B6B6B] max-w-[400px]">
        {t('youtube.emptyBody')}
      </p>
      <a
        href="https://www.youtube.com/@Ane-Spirala"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 font-['Lato'] text-[14px] font-semibold text-[#B8963E] border border-[#B8963E] hover:bg-[#B8963E] hover:text-white transition-colors rounded-full px-8 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E] focus-visible:ring-offset-2"
      >
        {t('youtube.watchOnYouTube')}
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function YouTubeLibrary() {
  const { t, i18n } = useTranslation();
  const { data, isLoading, error, refetch } = useYouTubeVideos(LIBRARY_LIMIT);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const locale =
    i18n.language === 'pl'
      ? 'pl-PL'
      : i18n.language === 'es'
        ? 'es-ES'
        : 'en-US';

  const allVideos = data?.videos ?? [];
  const visibleVideos = allVideos.slice(0, displayCount);
  const hasMore = displayCount < allVideos.length;

  // Intersection observer for infinite scroll
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoadingMore) {
        setIsLoadingMore(true);
        // Small delay for perceived smoothness
        setTimeout(() => {
          setDisplayCount((prev) => prev + PAGE_SIZE);
          setIsLoadingMore(false);
        }, 300);
      }
    },
    [hasMore, isLoadingMore],
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px',
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <main className="min-h-screen bg-white text-[#2D2D2D]">
      <SEO
        title="Wideo"
        description="Oglądaj filmy Spirali o coachingu, terapii i wewnętrznym rozwoju. Inspirujące treści wideo od Anety."
        canonical="/wideo"
      />

      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 overflow-hidden h-[500px] md:h-[620px]"
        aria-label="Nagłówek strony Wideo"
      >
        <EditableBackground
          section="youtube"
          fieldPath="heroBg"
          fallbackSrc="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
          className="absolute inset-0"
          aria-hidden={true}
        />
        <EditableOverlay
          section="youtube"
          fieldPath="heroBg"
          defaultTop={65}
          defaultBottom={75}
        />

        <ScrollReveal
          animation="fade"
          delay={200}
          className="relative z-10 max-w-[672px] mx-auto flex flex-col items-center gap-6"
        >
          <EditableText
            section="youtube"
            fieldPath="heroTitle"
            as="h1"
            placeholder="FILMY I INSPIRACJE"
            className="font-['Cormorant_Garamond'] text-[2.5rem] sm:text-[3rem] md:text-[3.5rem] font-bold uppercase tracking-tight leading-tight text-white"
          />

          <GoldLine width={48} height={2} delay={400} />

          <EditableText
            section="youtube"
            fieldPath="heroDesc"
            as="p"
            placeholder="Oglądaj filmy o coachingu, terapii i wewnętrznym rozwoju. Dołącz do społeczności Spirali — razem odkrywamy drogę ku sobie."
            className="font-['Lato'] text-[15px] sm:text-[17px] leading-[1.7] max-w-[560px] text-white/85"
          />
        </ScrollReveal>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* LIBRARY GRID                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="bg-[#F9F6F0] py-16 md:py-20 px-6 md:px-[120px]"
        aria-labelledby="youtube-library-heading"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-10">
          {/* Section header */}
          <ScrollReveal
            animation="fade-up"
            className="flex flex-col items-center gap-4 text-center"
          >
            <SectionBadge>
              <EditableText
                section="youtube"
                fieldPath="libraryBadge"
                placeholder="Biblioteka wideo"
              />
            </SectionBadge>

            <EditableText
              section="youtube"
              fieldPath="libraryTitle"
              as="h2"
              id="youtube-library-heading"
              placeholder="WSZYSTKIE FILMY"
              className="font-['Cormorant_Garamond'] text-[2rem] md:text-[2.25rem] font-bold text-[#2D2D2D] leading-[1.15] tracking-[-0.5px]"
            />

            <EditableText
              section="youtube"
              fieldPath="libraryDesc"
              as="p"
              placeholder="Przeglądaj całą naszą bibliotekę filmów. Nowe treści pojawiają się regularnie — zostań z nami."
              className="font-['Lato'] text-[15px] text-[#6B6B6B] leading-[1.7] max-w-[600px]"
            />
          </ScrollReveal>

          {/* States */}
          {isLoading && (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!isLoading && error && <ErrorState onRetry={() => void refetch()} />}

          {!isLoading && !error && allVideos.length === 0 && <EmptyState />}

          {!isLoading && !error && allVideos.length > 0 && (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleVideos.map((video, i) => (
                <ScrollReveal
                  key={video.id}
                  animation="fade-up"
                  delay={stagger(i % 3)}
                >
                  <YouTubeVideoCard
                    video={video}
                    variant="full"
                    locale={locale}
                  />
                </ScrollReveal>
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} aria-hidden="true" className="w-full h-4" />

          {/* Loading more spinner */}
          {isLoadingMore && (
            <p className="font-['Lato'] text-[14px] text-[#8A8A8A] flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border-2 border-[#B8963E] border-t-transparent animate-spin"
                aria-hidden="true"
              />
              {t('youtube.loadingMore')}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
