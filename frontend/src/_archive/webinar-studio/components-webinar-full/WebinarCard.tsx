import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, Play, Video, ArrowRight } from 'lucide-react';
import { ResponsiveCover } from '@/components/ui/responsive-cover';
import { WebinarProduct, WebinarSession } from '@/domain/products/models/webinar.model';
import { cn } from '@/lib/utils';
import { useCurrentLocale } from '@/hooks/useCurrentLocale';
import { useTheme } from '@/contexts/ThemeContext';
import { trackProductClick } from '@/utils/analytics';

export interface WebinarCardProps {
  webinar: WebinarProduct;
  nextSession?: WebinarSession | null;
  showPrice?: boolean;
  showHost?: boolean;
  showTypeBadge?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Format price with currency symbol
 */
const formatPrice = (price: number | undefined, currency: string): string => {
  if (!price || typeof price !== 'number' || price < 0) {
    return '';
  }

  const currencyConfig: Record<string, { locale: string; currency: string }> = {
    pln: { locale: 'pl-PL', currency: 'PLN' },
    usd: { locale: 'en-US', currency: 'USD' },
    eur: { locale: 'de-DE', currency: 'EUR' },
  };

  const config = currencyConfig[currency.toLowerCase()] || currencyConfig.usd;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

/**
 * Strip HTML tags for tooltip display
 */
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

export function WebinarCard({
  webinar,
  nextSession,
  showPrice = true,
  showHost = true,
  showTypeBadge = true,
  onClick,
  className,
}: WebinarCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentLocale } = useCurrentLocale();
  const { isDark } = useTheme();

  const isLive = nextSession?.status === 'live';
  const spotsLeft = nextSession
    ? webinar.capacity - (nextSession.registeredCount || 0)
    : webinar.capacity;
  const isSoldOut = spotsLeft <= 0;

  const getCurrencyForLocale = (): 'pln' | 'usd' | 'eur' => {
    switch (currentLocale) {
      case 'pl': return 'pln';
      case 'es': return 'eur';
      default: return 'usd';
    }
  };

  const currency = getCurrencyForLocale();
  const price = webinar.basePrices[currency] ?? (webinar.basePrices as Record<string, number>)['pnl'];

  const formatSessionDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(currentLocale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Language display helper
  const getLanguageDisplayName = (languageCode?: string): string => {
    if (!languageCode) return "Unknown";
    const currentLanguage = i18n.language;
    const languageNames: Record<string, Record<string, string>> = {
      en: { en: "English", es: "Spanish", pl: "Polish" },
      es: { en: "Inglés", es: "Español", pl: "Polaco" },
      pl: { en: "Angielski", es: "Hiszpański", pl: "Polski" },
    };
    return languageNames[currentLanguage]?.[languageCode] || languageCode.toUpperCase();
  };

  const handleCardClick = () => {
    trackProductClick(webinar.id, webinar.name, "webinar", price || 0);
    if (onClick) {
      onClick();
    } else {
      navigate(`/webinars/${webinar.slug || webinar.id}`);
    }
  };

  const plainDescription = stripHtmlTags(webinar.description);

  return (
    <article
      onClick={handleCardClick}
      className={cn(
        "group cursor-pointer transition-all duration-300",
        isLive && "relative",
        className
      )}
    >
      {/* Cover Image - fluid aspect ratio */}
      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden rounded-xl mb-4",
          isLive && "ring-2 ring-red-500/50 shadow-lg shadow-red-500/20"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <ResponsiveCover
          coverUrls={webinar.coverUrls}
          coverUrl={webinar.coverUrl}
          alt={webinar.name}
          aspectRatio=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          enableLightbox
          showZoomIcon
        />

        {/* Type Badge */}
        {(isLive || showTypeBadge) && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none flex gap-1">
            {isLive ? (
              <span className="bg-red-600 text-white text-xs font-medium px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1">
                <Play className="h-3 w-3" />
                LIVE
              </span>
            ) : (
              <span className={`text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${
                isDark ? 'bg-[#2a7a6f]/90' : 'bg-[#285f59]/90'
              }`}>
                <Video className="h-3 w-3" />
                Webinar
              </span>
            )}
          </div>
        )}

        {/* Emoji */}
        {webinar.emoji && (
          <span className="absolute bottom-3 left-3 text-2xl pointer-events-none">
            {webinar.emoji}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className={`text-[clamp(1.1rem,2.5vw,1.35rem)] font-bold leading-snug mb-2 transition-colors duration-300 line-clamp-2 ${
        isDark ? 'text-white group-hover:text-[#e8f5f0]' : 'text-[#285f59] group-hover:text-[#47695b]'
      }`}>
        {webinar.name || "Untitled Webinar"}
      </h3>

      {/* Host Info */}
      {showHost && webinar.host && (
        <p className={`text-sm flex items-center gap-2 mb-2 ${isDark ? 'text-[#a3cec3]/80' : 'text-[#47695b]'}`}>
          {webinar.host.avatar && (
            <img
              src={webinar.host.avatar}
              alt={webinar.host.name}
              className="w-5 h-5 rounded-full"
            />
          )}
          {webinar.host.name}
        </p>
      )}

      {/* Meta badges */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {nextSession && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
            isDark ? 'bg-[#2a7a6f]/20 text-[#a3cec3]' : 'bg-[#eaf9f0] text-[#285f59]'
          }`}>
            <Calendar className="h-3 w-3" />
            {formatSessionDate(nextSession.scheduledAt)}
          </span>
        )}
        <span className={`flex items-center text-xs ${isDark ? 'text-[#a3cec3]' : 'text-[#47695b]'}`}>
          <Clock className="h-3 w-3 mr-1" />
          {webinar.duration} min
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          isDark ? 'bg-[#2a7a6f]/20 text-[#a3cec3]' : 'bg-[#eaf9f0] text-[#47695b]'
        }`}>
          {getLanguageDisplayName(webinar.language)}
        </span>
        {isSoldOut && (
          <span className="flex items-center text-xs text-red-400">
            <Users className="h-3 w-3 mr-1" />
            {t('webinars.soldOut')}
          </span>
        )}
      </div>

      {/* Description */}
      <p className={`text-[clamp(0.875rem,1.8vw,1rem)] leading-relaxed line-clamp-4 mb-4 ${
        isDark ? 'text-[#e8f5f0] group-hover:text-white' : 'text-[#47695b] group-hover:text-[#285f59]'
      }`}>
        {plainDescription || "No description available"}
      </p>

      {/* Price & CTA row */}
      <div className="flex items-center justify-between">
        {showPrice && price ? (
          <span className={`text-lg font-bold ${isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]'}`}>
            {formatPrice(price, currency)}
          </span>
        ) : (
          <span className={`text-lg font-bold ${isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]'}`}>
            {t("common.free", "Free")}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 text-sm font-medium px-4 py-2 rounded-full text-white transition-all ${
          isDark ? 'bg-gradient-to-r from-[#2a7a6f] to-[#1d5c54] hover:from-[#33897d] hover:to-[#2a7a6f]' : 'bg-gradient-to-r from-[#285f59] to-[#47695b] hover:from-[#2d6b63] hover:to-[#4d7e72]'
        }`}>
          {t('common.readMore', 'Read More')}
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </article>
  );
}

export default WebinarCard;
