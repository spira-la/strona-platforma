/**
 * ReactionButtons Component
 *
 * Displays reaction buttons for users to send live reactions
 * Shows all buttons by default, collapses to compact mode on small screens
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { REACTION_EMOJIS, REACTION_COLORS, type ReactionType } from './ReactionOverlay';

export interface ReactionButtonsProps {
  /** Callback when a reaction is sent */
  onReaction: (type: ReactionType) => void;
  /** Whether reactions are enabled */
  enabled?: boolean;
  /** Display mode: 'compact' shows single button with popover, 'expanded' shows all buttons, 'auto' (default) is responsive */
  mode?: 'compact' | 'expanded' | 'auto';
  /** Custom class name */
  className?: string;
  /** Show labels under buttons */
  showLabels?: boolean;
  /** Whether the player is in fullscreen mode (affects z-index) */
  isFullscreen?: boolean;
  /** Whether the side panel is open (reduces available space) */
  isPanelOpen?: boolean;
}

// Rate limiting: max reactions per second
const MAX_REACTIONS_PER_SECOND = 5;
const RATE_LIMIT_WINDOW = 1000; // ms

const REACTION_LABELS: Record<ReactionType, string> = {
  heart: 'Love',
  fire: 'Fire',
  clap: 'Clap',
  laugh: 'Laugh',
  wow: 'Wow',
  thumbsup: 'Like',
};

export function ReactionButtons({
  onReaction,
  enabled = true,
  mode = 'auto',
  className,
  showLabels = false,
  isFullscreen = false,
  isPanelOpen = false,
}: ReactionButtonsProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [recentReactions, setRecentReactions] = useState<number[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Clean up old reaction timestamps
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setRecentReactions((prev) =>
        prev.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW)
      );
    }, 200);

    return () => clearInterval(cleanup);
  }, []);

  // Update rate limit status
  useEffect(() => {
    setIsRateLimited(recentReactions.length >= MAX_REACTIONS_PER_SECOND);
  }, [recentReactions]);

  const handleReaction = useCallback(
    (type: ReactionType) => {
      if (!enabled || isRateLimited) return;

      // Add timestamp for rate limiting
      setRecentReactions((prev) => [...prev, Date.now()]);

      // Send reaction
      onReaction(type);

      // Close popover in compact mode
      setIsOpen(false);
    },
    [enabled, isRateLimited, onReaction]
  );

  // Quick heart reaction
  const handleQuickHeart = useCallback(() => {
    handleReaction('heart');
  }, [handleReaction]);

  if (!enabled) return null;

  const reactionTypes: ReactionType[] = ['heart', 'fire', 'clap', 'laugh', 'wow', 'thumbsup'];

  // Z-index for popover - much higher when fullscreen
  const popoverZIndex = isFullscreen ? 'z-[100000]' : 'z-[9999]';

  // Expanded mode: show all buttons
  if (mode === 'expanded') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {reactionTypes.map((type) => (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => handleReaction(type)}
            disabled={isRateLimited}
            className={cn(
              'text-xl hover:scale-125 transition-transform p-1 h-auto',
              isRateLimited && 'opacity-50 cursor-not-allowed'
            )}
            title={REACTION_LABELS[type]}
          >
            <span className="drop-shadow-sm">{REACTION_EMOJIS[type]}</span>
            {showLabels && (
              <span className={cn('text-xs ml-1', isDark ? 'text-white/70' : 'text-slate-500')}>{REACTION_LABELS[type]}</span>
            )}
          </Button>
        ))}
      </div>
    );
  }

  // Compact mode: single button with popover
  if (mode === 'compact') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {/* Quick heart button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleQuickHeart}
          disabled={isRateLimited}
          className={cn(
            'hover:scale-110 transition-all',
            isDark ? 'text-white hover:bg-white/20' : 'text-slate-700 hover:bg-slate-200',
            isRateLimited && 'opacity-50 cursor-not-allowed'
          )}
          title={t('webinars.reactions.sendHeart', 'Send heart')}
        >
          <Heart
            className={cn(
              'w-5 h-5 transition-colors',
              recentReactions.length > 0 ? 'fill-red-500 text-red-500' : ''
            )}
          />
        </Button>

        {/* More reactions popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(isDark ? 'text-white hover:bg-white/20' : 'text-slate-700 hover:bg-slate-200')}
              title={t('webinars.reactions.moreReactions', 'More reactions')}
            >
              <Smile className="w-5 h-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="center"
            sideOffset={8}
            className={cn(
              'w-auto p-2',
              isDark ? 'bg-[#0d1f1c]/95 border-[#285f59]/30' : 'bg-white/95 border-slate-200',
              popoverZIndex
            )}
          >
            <div className="flex items-center gap-1">
              {reactionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  disabled={isRateLimited}
                  className={cn(
                    'text-2xl p-2 rounded-lg hover:scale-125 transition-all',
                    isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100',
                    isRateLimited && 'opacity-50 cursor-not-allowed'
                  )}
                  title={REACTION_LABELS[type]}
                >
                  {REACTION_EMOJIS[type]}
                </button>
              ))}
            </div>
            {isRateLimited && (
              <p className="text-xs text-yellow-400 text-center mt-1">
                {t('webinars.reactions.slowDown', 'Slow down!')}
              </p>
            )}
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Auto mode (default): Show all buttons on larger screens, compact on small screens
  // Uses CSS to handle responsiveness
  // When panel is open in fullscreen, we need smaller buttons since we lose 320px of width

  // Determine breakpoint based on panel state
  // If panel is open, use md: (768px) instead of sm: (640px) to account for lost space
  const expandedBreakpoint = isPanelOpen ? 'md:flex' : 'sm:flex';
  const compactBreakpoint = isPanelOpen ? 'md:hidden' : 'sm:hidden';

  return (
    <div className={cn('flex items-center', className)}>
      {/* Expanded view - hidden on small screens or when panel reduces space */}
      <div className={cn('hidden items-center gap-0.5', expandedBreakpoint)}>
        {reactionTypes.map((type) => (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            disabled={isRateLimited}
            className={cn(
              // Smaller size when panel is open to fit better
              isPanelOpen
                ? 'text-base p-0.5 min-w-[28px]'
                : 'text-xl sm:text-2xl p-1 sm:p-1.5',
              'rounded-lg hover:scale-110 transition-all',
              isDark ? 'hover:bg-white/20' : 'hover:bg-slate-200',
              isRateLimited && 'opacity-50 cursor-not-allowed'
            )}
            title={REACTION_LABELS[type]}
          >
            <span className="drop-shadow-md">{REACTION_EMOJIS[type]}</span>
          </button>
        ))}
      </div>

      {/* Compact view - shown on small screens or when panel reduces space */}
      <div className={cn('flex items-center gap-0.5', compactBreakpoint)}>
        {/* Quick heart button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleQuickHeart}
          disabled={isRateLimited}
          className={cn(
            'hover:scale-110 transition-all h-7 w-7',
            isDark ? 'text-white hover:bg-white/20' : 'text-slate-700 hover:bg-slate-200',
            isRateLimited && 'opacity-50 cursor-not-allowed'
          )}
          title={t('webinars.reactions.sendHeart', 'Send heart')}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors',
              recentReactions.length > 0 ? 'fill-red-500 text-red-500' : ''
            )}
          />
        </Button>

        {/* More reactions popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-7 w-7', isDark ? 'text-white hover:bg-white/20' : 'text-slate-700 hover:bg-slate-200')}
              title={t('webinars.reactions.moreReactions', 'More reactions')}
            >
              <Smile className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="center"
            sideOffset={8}
            className={cn(
              'w-auto p-2',
              isDark ? 'bg-[#0d1f1c]/95 border-[#285f59]/30' : 'bg-white/95 border-slate-200',
              popoverZIndex
            )}
          >
            <div className="flex items-center gap-1">
              {reactionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  disabled={isRateLimited}
                  className={cn(
                    'text-2xl p-2 rounded-lg hover:scale-125 transition-all',
                    isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100',
                    isRateLimited && 'opacity-50 cursor-not-allowed'
                  )}
                  title={REACTION_LABELS[type]}
                >
                  {REACTION_EMOJIS[type]}
                </button>
              ))}
            </div>
            {isRateLimited && (
              <p className="text-xs text-yellow-400 text-center mt-1">
                {t('webinars.reactions.slowDown', 'Slow down!')}
              </p>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default ReactionButtons;
