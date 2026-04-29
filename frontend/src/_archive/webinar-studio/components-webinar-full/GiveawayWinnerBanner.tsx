import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const PLACE_CONFIG = {
  1: {
    emoji: '\u{1F947}',
    labelKey: 'webinars.giveaway.place1',
    gradient: 'from-yellow-500/90 to-amber-600/90',
    border: 'border-yellow-500/40',
  },
  2: {
    emoji: '\u{1F948}',
    labelKey: 'webinars.giveaway.place2',
    gradient: 'from-gray-400/90 to-gray-500/90',
    border: 'border-gray-400/40',
  },
  3: {
    emoji: '\u{1F949}',
    labelKey: 'webinars.giveaway.place3',
    gradient: 'from-amber-600/90 to-amber-700/90',
    border: 'border-amber-600/40',
  },
} as const;

interface GiveawayWinnerBannerProps {
  place: 1 | 2 | 3;
  onDismiss?: () => void;
  /** When true, renders as an absolute-positioned floating banner (for fullscreen mode) with dismiss button */
  floating?: boolean;
  className?: string;
}

export function GiveawayWinnerBanner({ place, onDismiss, floating, className }: GiveawayWinnerBannerProps) {
  const { t } = useTranslation();
  const config = PLACE_CONFIG[place];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={cn(
          `flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r ${config.gradient} border ${config.border} shadow-lg`,
          floating
            ? 'absolute top-2 left-1/2 -translate-x-1/2 z-30 rounded-full backdrop-blur-sm'
            : 'rounded-lg',
          className,
        )}
      >
        <span className="text-lg">{config.emoji}</span>
        <span className="text-white font-semibold text-sm">
          {t('webinars.giveaway.wonBanner', 'You won {{place}}!', { place: t(config.labelKey) })}
        </span>
        {floating && onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
