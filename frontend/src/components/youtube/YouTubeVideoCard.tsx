import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Play, Calendar, Eye, ExternalLink, X } from 'lucide-react';
import type { YouTubeVideo } from '@/clients/youtube.client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatViews(count?: number): string {
  if (count === undefined) return '';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toLocaleString('pl-PL');
}

// ---------------------------------------------------------------------------
// Modal player — rendered in a portal
// ---------------------------------------------------------------------------

interface VideoModalProps {
  video: YouTubeVideo;
  locale: string;
  onClose: () => void;
}

function VideoModal({ video, locale, onClose }: VideoModalProps) {
  const { t } = useTranslation();

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8"
      style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-[900px] overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij odtwarzacz"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {/* Iframe */}
        <div className="aspect-video w-full bg-black flex-shrink-0">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>

        {/* Info below player */}
        <div className="flex flex-col gap-3 p-5 md:p-6 overflow-y-auto">
          <h2 className="font-['Cormorant_Garamond'] text-[20px] md:text-[22px] font-bold text-[#2D2D2D] leading-[1.25]">
            {video.title}
          </h2>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3">
            {video.channelTitle && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold font-['Lato'] uppercase tracking-[0.06em] text-white bg-[#B8963E]">
                {video.channelTitle}
              </span>
            )}
            <span className="flex items-center gap-1 font-['Lato'] text-[12px] text-[#8A8A8A]">
              <Calendar size={12} aria-hidden="true" />
              {formatDate(video.publishedAt, locale)}
            </span>
            {video.viewCount !== undefined && (
              <span className="flex items-center gap-1 font-['Lato'] text-[12px] text-[#8A8A8A]">
                <Eye size={12} aria-hidden="true" />
                {formatViews(video.viewCount)} {t('youtube.views')}
              </span>
            )}
          </div>

          {video.description && (
            <p className="font-['Lato'] text-[13px] text-[#6B6B6B] leading-[1.6] line-clamp-4">
              {video.description}
            </p>
          )}

          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start inline-flex items-center gap-1.5 font-['Lato'] text-[13px] font-semibold text-[#B8963E] hover:text-[#8A6F2E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E] rounded"
          >
            {t('youtube.watchOnYouTube')}
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export type YouTubeCardVariant = 'compact' | 'full';

interface YouTubeVideoCardProps {
  video: YouTubeVideo;
  variant?: YouTubeCardVariant;
  locale?: string;
}

export function YouTubeVideoCard({
  video,
  variant = 'compact',
  locale = 'pl-PL',
}: YouTubeVideoCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  const descriptionClamp =
    variant === 'compact' ? 'line-clamp-2' : 'line-clamp-4';

  return (
    <>
      <article
        className="group flex flex-col bg-white border border-[#E8E4DF] rounded-[12px] overflow-hidden shadow-sm hover:shadow-md hover:border-[#B8963E] transition-all duration-300 cursor-pointer h-full"
        onClick={openModal}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`${t('youtube.play')}: ${video.title}`}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden bg-[#EDE8DC] flex-shrink-0">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
          {/* Gold play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors duration-300">
            <div className="w-12 h-12 rounded-full bg-[#B8963E] flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110">
              <Play
                size={20}
                fill="white"
                className="text-white ml-0.5"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Content
            The card is a flex column with a fixed-shape thumbnail above
            and a text block below. To keep every card the same height
            with the play button anchored, the title and description
            reserve fixed minimum heights and the footer is pinned at
            the bottom with `mt-auto`. The footer never wraps — the
            meta cluster shrinks/truncates first so the button stays
            anchored on the right at exactly the same Y across cards.
        */}
        <div className="flex flex-col gap-2.5 p-5 flex-1">
          <h3
            className="font-['Cormorant_Garamond'] text-[17px] font-bold text-[#2D2D2D] leading-[1.3] line-clamp-2"
            style={{ minHeight: '2.6em' }}
          >
            {video.title}
          </h3>

          <p
            className={`font-['Lato'] text-[13px] text-[#6B6B6B] leading-[1.6] flex-1 ${descriptionClamp}`}
            style={{
              minHeight:
                descriptionClamp === 'line-clamp-4' ? '6.4em' : '3.2em',
            }}
          >
            {video.description ?? ''}
          </p>

          {/* Footer — fixed at the bottom; never wraps */}
          <div className="flex flex-nowrap items-center justify-between gap-3 mt-auto pt-3 border-t border-[#F0EDE8]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="inline-flex items-center gap-1 font-['Lato'] text-[11px] text-[#8A8A8A] whitespace-nowrap">
                <Calendar size={11} aria-hidden="true" />
                {formatDate(video.publishedAt, locale)}
              </span>
              {video.viewCount !== undefined && (
                <span className="inline-flex items-center gap-1 font-['Lato'] text-[11px] text-[#8A8A8A] whitespace-nowrap overflow-hidden">
                  <Eye size={11} aria-hidden="true" />
                  {formatViews(video.viewCount)}
                </span>
              )}
            </div>

            <span className="inline-flex items-center gap-1 font-['Lato'] text-[12px] font-semibold text-white bg-[#B8963E] group-hover:bg-[#8A6F2E] transition-colors rounded-full px-4 py-1.5 whitespace-nowrap flex-shrink-0">
              <Play size={11} fill="white" aria-hidden="true" />
              {t('youtube.play')}
            </span>
          </div>
        </div>
      </article>

      {open && (
        <VideoModal video={video} locale={locale} onClose={closeModal} />
      )}
    </>
  );
}

export default YouTubeVideoCard;
