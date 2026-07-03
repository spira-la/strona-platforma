/**
 * MeetingReactionButtons Component
 *
 * Popover with 6 coaching-themed emoji reactions.
 * Shows "Slow down!" feedback when rate-limited.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SmilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MEETING_REACTION_EMOJIS,
  type MeetingReactionType,
} from '@/hooks/meeting/useMeetingReactions';

const REACTION_KEYS: MeetingReactionType[] = [
  'star',
  'mindblown',
  'muscle',
  'pray',
  'sparkles',
  'hundred',
];

interface MeetingReactionButtonsProps {
  onReaction: (type: MeetingReactionType) => void;
  isRateLimited: boolean;
}

export function MeetingReactionButtons({
  onReaction,
  isRateLimited,
}: MeetingReactionButtonsProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-bwm-section hover:bg-bwm-card-alt border-bwm-card text-bwm-primary"
            >
              <SmilePlus className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {t('meeting.reactions.title', 'Reactions')}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="w-auto p-2 bg-bwm-card border-bwm-card"
        align="center"
        side="top"
      >
        {isRateLimited ? (
          <p className="text-xs text-amber-400 px-2 py-1">
            {t('meeting.reactions.slowDown', 'Slow down!')}
          </p>
        ) : (
          <div className="flex gap-1">
            {REACTION_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => onReaction(key)}
                className={cn(
                  'text-2xl p-1.5 rounded-lg transition-transform',
                  'hover:scale-125 hover:bg-bwm-section active:scale-95'
                )}
                title={t(`meeting.reactions.${key}`, key)}
              >
                {MEETING_REACTION_EMOJIS[key]}
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
