/**
 * MeetingReactionOverlay Component
 *
 * Displays floating emoji reactions in meetings.
 * Local reactions float from the right, remote from the left.
 * Uses meeting-prefixed animations to avoid collision with webinar styles.
 */

import { cn } from '@/lib/utils';
import type { FloatingReaction } from '@/hooks/meeting/useMeetingReactions';
import { MEETING_REACTION_EMOJIS, MEETING_REACTION_COLORS } from '@/hooks/meeting/useMeetingReactions';

interface MeetingReactionOverlayProps {
  reactions: FloatingReaction[];
  className?: string;
}

export function MeetingReactionOverlay({ reactions, className }: MeetingReactionOverlayProps) {
  if (reactions.length === 0) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none overflow-hidden z-30',
        className
      )}
      aria-hidden="true"
    >
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute meeting-float-reaction"
          style={{
            ...(reaction.side === 'right'
              ? { right: `${reaction.x}%` }
              : { left: `${reaction.x}%` }),
            bottom: '80px',
            fontSize: `${2 * reaction.size}rem`,
            animationDuration: `${reaction.duration}s`,
            '--meeting-wobble': `${reaction.wobble}deg`,
          } as React.CSSProperties}
        >
          <span
            className="inline-block meeting-wobble drop-shadow-lg"
            style={{
              filter: `drop-shadow(0 0 8px ${MEETING_REACTION_COLORS[reaction.type]}40)`,
            }}
          >
            {MEETING_REACTION_EMOJIS[reaction.type]}
          </span>
        </div>
      ))}

      <style>{`
        @keyframes meeting-float-reaction {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          20% {
            opacity: 1;
            transform: translateY(-15vh) scale(1.1);
          }
          80% {
            opacity: 0.8;
            transform: translateY(-60vh) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-75vh) scale(0.8);
          }
        }

        @keyframes meeting-wobble {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(var(--meeting-wobble, 10deg));
          }
          75% {
            transform: rotate(calc(var(--meeting-wobble, 10deg) * -1));
          }
        }

        .meeting-float-reaction {
          animation: meeting-float-reaction var(--duration, 3s) ease-out forwards;
        }

        .meeting-wobble {
          animation: meeting-wobble 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
