import { useRef, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useYouTubeVideos } from '@/hooks/useYouTubeVideos';
import { YouTubeVideoCard } from './YouTubeVideoCard';
import { EditableText } from '@/components/cms/EditableText';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { GoldLine } from '@/components/shared/GoldLine';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHANNEL_URL = 'https://www.youtube.com/@Ane-Spirala';
const CARD_WIDTH_SM = 380; // px — matches min-w-[380px] on sm+
const CARD_GAP = 24; // px — gap-6

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveLocale(lang: string): string {
  if (lang === 'pl') return 'pl-PL';
  if (lang === 'es') return 'es-ES';
  return 'en-US';
}

// ---------------------------------------------------------------------------
// Section badge — local primitive (same visual as YouTubeSection)
// ---------------------------------------------------------------------------

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-['Lato'] text-[12px] font-semibold tracking-[0.08em] uppercase text-[#B8963E] bg-[#B8963E]/[0.125] rounded-full px-4 py-1.5">
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skeleton card — horizontal carousel shape
// ---------------------------------------------------------------------------

function CarouselCardSkeleton() {
  return (
    <div
      className="flex-shrink-0 min-w-[320px] sm:min-w-[380px] snap-start flex flex-col bg-white border border-[#E8E4DF] rounded-[12px] overflow-hidden animate-pulse"
      aria-hidden="true"
    >
      <div className="aspect-video w-full bg-[#EDE8DC]" />
      <div className="flex flex-col gap-2.5 p-5">
        <div className="h-4 w-full bg-[#EDE8DC] rounded" />
        <div className="h-3 w-5/6 bg-[#EDE8DC] rounded" />
        <div className="h-3 w-4/6 bg-[#EDE8DC] rounded" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navigation button
// ---------------------------------------------------------------------------

interface NavButtonProps {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
  label: string;
}

function NavButton({ direction, onClick, disabled, label }: NavButtonProps) {
  const positionClass =
    direction === 'prev' ? '-left-5 sm:-left-6' : '-right-5 sm:-right-6';
  const stateClass = disabled
    ? 'opacity-0 pointer-events-none'
    : 'opacity-100 hover:bg-[#8A6F2E] active:bg-[#7A6028] hover:scale-105';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={[
        'absolute top-1/2 -translate-y-1/2 z-10',
        'w-11 h-11 rounded-full flex items-center justify-center',
        'bg-[#B8963E] text-white shadow-lg',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E] focus-visible:ring-offset-2',
        positionClass,
        stateClass,
      ].join(' ')}
    >
      {direction === 'prev' ? (
        <ChevronLeft size={20} aria-hidden="true" />
      ) : (
        <ChevronRight size={20} aria-hidden="true" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Track content — separated to avoid nested ternaries in JSX
// ---------------------------------------------------------------------------

interface TrackContentProps {
  isLoading: boolean;
  videos: import('@/clients/youtube.client').YouTubeVideo[];
  locale: string;
}

function TrackContent({ isLoading, videos, locale }: TrackContentProps) {
  if (isLoading) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, i) => (
          <CarouselCardSkeleton key={i} />
        ))}
      </>
    );
  }

  return (
    <>
      {videos.map((video) => (
        <div
          key={video.id}
          role="listitem"
          className="flex-shrink-0 min-w-[320px] sm:min-w-[380px] snap-start h-full"
        >
          <YouTubeVideoCard video={video} variant="compact" locale={locale} />
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function YouTubeCarouselSection() {
  const { t, i18n } = useTranslation();
  const showYouTube = useFeatureFlag('youtubeContent');
  const { data, isLoading } = useYouTubeVideos(12);

  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Re-evaluate edge state on scroll
  const updateEdgeState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateEdgeState, { passive: true });
    updateEdgeState();
    return () => el.removeEventListener('scroll', updateEdgeState);
  }, [updateEdgeState]);

  // Re-check after data loads (card count changes)
  useEffect(() => {
    updateEdgeState();
  }, [data, updateEdgeState]);

  const scrollTrack = useCallback((direction: 'prev' | 'next') => {
    const el = trackRef.current;
    if (!el) return;
    const step = CARD_WIDTH_SM + CARD_GAP;
    el.scrollBy({
      left: direction === 'next' ? step : -step,
      behavior: 'smooth',
    });
  }, []);

  if (!showYouTube) return null;

  const locale = resolveLocale(i18n.language);
  const videos = (data?.videos ?? []).slice(0, 12);
  const isEmpty = !isLoading && videos.length === 0;

  return (
    <section
      className="bg-[#EDE8DC] py-20 sm:py-24 overflow-hidden"
      aria-labelledby="youtube-carousel-heading"
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-[120px] flex flex-col items-center gap-12">
        {/* ── Header ── */}
        <ScrollReveal
          animation="fade-up"
          className="flex flex-col items-center gap-4 text-center"
        >
          <SectionBadge>
            <EditableText
              section="home"
              fieldPath="youtubeCarousel.badge"
              placeholder="Wideo"
            />
          </SectionBadge>

          <EditableText
            section="home"
            fieldPath="youtubeCarousel.title"
            as="h2"
            id="youtube-carousel-heading"
            className="font-['Cormorant_Garamond'] text-[2rem] md:text-[2.5rem] font-bold text-[#2D2D2D] leading-[1.15] tracking-[-0.5px]"
            placeholder="Wideo, które inspirują"
          />

          <GoldLine width={40} height={2} delay={200} />

          <EditableText
            section="home"
            fieldPath="youtubeCarousel.description"
            as="p"
            className="font-['Lato'] text-[15px] text-[#6B6B6B] leading-[1.7] max-w-[580px]"
            placeholder="Najnowsze rozmowy, refleksje i medytacje z mojego kanału na YouTube."
          />
        </ScrollReveal>

        {/* ── Carousel ── */}
        <ScrollReveal animation="fade-up" delay={200} className="w-full">
          {isEmpty ? (
            /* Empty state */
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="font-['Lato'] text-[15px] text-[#6B6B6B]">
                {t('youtube.emptyBody')}
              </p>
              <a
                href={CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-['Lato'] text-[14px] font-semibold text-[#B8963E] border border-[#B8963E] hover:bg-[#B8963E] hover:text-white transition-colors duration-200 rounded-full px-8 py-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E] focus-visible:ring-offset-2"
              >
                {t('youtube.watchOnYouTube')}
                <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          ) : (
            /* Carousel track with navigation */
            <div className="relative">
              <NavButton
                direction="prev"
                onClick={() => scrollTrack('prev')}
                disabled={atStart}
                label={t('youtubeCarousel.prev')}
              />

              {/* Scroll track — .yt-scroll-hide hides the native scrollbar */}
              <div
                ref={trackRef}
                role="list"
                aria-label={t('youtubeCarousel.trackLabel')}
                className="yt-scroll-hide flex gap-6 overflow-x-auto overflow-y-hidden"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                <TrackContent
                  isLoading={isLoading}
                  videos={videos}
                  locale={locale}
                />
              </div>

              <NavButton
                direction="next"
                onClick={() => scrollTrack('next')}
                disabled={atEnd}
                label={t('youtubeCarousel.next')}
              />
            </div>
          )}
        </ScrollReveal>

        {/* ── CTA ── */}
        {!isEmpty && (
          <ScrollReveal animation="fade-up" delay={300}>
            <Link
              to="/wideo"
              className="inline-flex items-center gap-2 font-['Lato'] text-[14px] font-semibold text-[#B8963E] border border-[#B8963E] hover:bg-[#B8963E] hover:text-white active:bg-[#8A6F2E] active:border-[#8A6F2E] transition-colors duration-200 rounded-full px-8 py-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E] focus-visible:ring-offset-2"
            >
              <EditableText
                section="home"
                fieldPath="youtubeCarousel.cta"
                placeholder="Zobacz całą bibliotekę"
              />
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}

export default YouTubeCarouselSection;
