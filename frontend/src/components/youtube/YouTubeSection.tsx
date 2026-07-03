import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { useYouTubeVideos } from '@/hooks/useYouTubeVideos';
import { YouTubeVideoCard } from './YouTubeVideoCard';
import { EditableText } from '@/components/cms/EditableText';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';
import { GoldLine } from '@/components/shared/GoldLine';

// ---------------------------------------------------------------------------
// Section badge — shared Spirala primitive
// ---------------------------------------------------------------------------

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-['Lato'] text-[12px] font-semibold tracking-[0.08em] uppercase text-[#B8963E] bg-[#B8963E]/[0.125] rounded-full px-4 py-1.5">
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skeleton card matching the grid shape
// ---------------------------------------------------------------------------

function VideoCardSkeleton() {
  return (
    <div className="flex flex-col bg-white border border-[#E8E4DF] rounded-[12px] overflow-hidden animate-pulse h-full">
      <div className="aspect-video w-full bg-[#F0EDE8]" />
      <div className="flex flex-col gap-2.5 p-5 flex-1">
        <div className="h-4 w-full bg-[#F0EDE8] rounded" />
        <div className="h-3 w-5/6 bg-[#F0EDE8] rounded" />
        <div className="h-3 w-4/6 bg-[#F0EDE8] rounded" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function YouTubeSection() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useYouTubeVideos(50);

  const locale =
    i18n.language === 'pl'
      ? 'pl-PL'
      : i18n.language === 'es'
        ? 'es-ES'
        : 'en-US';

  const latestVideos = (data?.videos ?? []).slice(0, 4);

  // Hide entirely when fetch is done and there are no videos
  if (!isLoading && latestVideos.length === 0) return null;

  return (
    <section
      className="bg-[#F9F6F0] py-20 sm:py-24 px-6 md:px-[120px]"
      aria-labelledby="youtube-section-heading"
    >
      <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-10">
        {/* Header */}
        <ScrollReveal
          animation="fade-up"
          className="flex flex-col items-center gap-4 text-center"
        >
          <SectionBadge>
            <EditableText
              section="home"
              fieldPath="youtube.badge"
              placeholder={t('youtube.latestVideos')}
            />
          </SectionBadge>

          <EditableText
            section="home"
            fieldPath="youtube.title"
            as="h2"
            id="youtube-section-heading"
            className="font-['Cormorant_Garamond'] text-[2rem] md:text-[2.25rem] font-bold text-[#2D2D2D] leading-[1.15] tracking-[-0.5px]"
            placeholder="WIDEO I INSPIRACJE"
          />

          <GoldLine width={40} height={2} delay={200} />

          <EditableText
            section="home"
            fieldPath="youtube.description"
            as="p"
            className="font-['Lato'] text-[15px] text-[#6B6B6B] leading-[1.7] max-w-[600px]"
            placeholder="Odkryj nasze filmy o coachingu, terapii i wewnętrznym rozwoju. Dołącz do społeczności Spirali na YouTube."
          />
        </ScrollReveal>

        {/* Grid */}
        {isLoading ? (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestVideos.map((video, i) => (
              <ScrollReveal
                key={video.id}
                animation="fade-up"
                delay={stagger(i)}
                className="h-full"
              >
                <YouTubeVideoCard
                  video={video}
                  variant="compact"
                  locale={locale}
                />
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* See all link */}
        <Link
          to="/wideo"
          className="inline-flex items-center gap-2 font-['Lato'] text-[14px] font-semibold text-[#B8963E] border border-[#B8963E] hover:bg-[#B8963E] hover:text-white active:bg-[#8A6F2E] active:border-[#8A6F2E] transition-colors duration-200 rounded-full px-8 py-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E] focus-visible:ring-offset-2"
        >
          <EditableText
            section="home"
            fieldPath="youtube.seeAllLabel"
            placeholder={t('youtube.seeAll')}
          />
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export default YouTubeSection;
