/**
 * ReactionOverlay Component
 *
 * Displays floating emoji reactions (TikTok/Instagram Live style)
 * Reactions float up from the bottom and fade out
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

// Reaction types with their emoji representations
export type ReactionType = 'heart' | 'fire' | 'clap' | 'laugh' | 'wow' | 'thumbsup';

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  heart: '❤️',
  fire: '🔥',
  clap: '👏',
  laugh: '😂',
  wow: '😮',
  thumbsup: '👍',
};

// Colors for each reaction type (for glow effects)
export const REACTION_COLORS: Record<ReactionType, string> = {
  heart: '#ef4444',
  fire: '#f97316',
  clap: '#eab308',
  laugh: '#22c55e',
  wow: '#3b82f6',
  thumbsup: '#8b5cf6',
};

interface FloatingReaction {
  id: string;
  type: ReactionType;
  x: number; // 0-100 percentage from right
  createdAt: number;
  size: number; // 1-1.5 scale factor
  duration: number; // 2-4 seconds
  wobble: number; // -15 to 15 degrees rotation
}

export interface ReactionOverlayProps {
  /** Class name for the container */
  className?: string;
  /** Maximum number of reactions visible at once */
  maxReactions?: number;
  /** Whether reactions are enabled */
  enabled?: boolean;
}

export interface ReactionOverlayRef {
  addReaction: (type: ReactionType) => void;
}

/**
 * Creates a new floating reaction with random properties
 */
function createFloatingReaction(type: ReactionType): FloatingReaction {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    x: 5 + Math.random() * 15, // 5-20% from right edge
    createdAt: Date.now(),
    size: 0.8 + Math.random() * 0.6, // 0.8-1.4 scale
    duration: 2.5 + Math.random() * 1.5, // 2.5-4 seconds
    wobble: -15 + Math.random() * 30, // -15 to 15 degrees
  };
}

export function ReactionOverlay({
  className,
  maxReactions = 50,
  enabled = true,
}: ReactionOverlayProps) {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup old reactions periodically
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      const now = Date.now();
      setReactions((prev) =>
        prev.filter((r) => now - r.createdAt < r.duration * 1000)
      );
    }, 500);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);

  // Add a new reaction
  const addReaction = useCallback(
    (type: ReactionType) => {
      if (!enabled) return;

      setReactions((prev) => {
        // Limit max reactions
        const newReactions = prev.length >= maxReactions ? prev.slice(1) : prev;
        return [...newReactions, createFloatingReaction(type)];
      });
    },
    [enabled, maxReactions]
  );

  // Expose addReaction via window for external access
  useEffect(() => {
    (window as any).__webinarReactionOverlay = { addReaction };
    return () => {
      delete (window as any).__webinarReactionOverlay;
    };
  }, [addReaction]);

  if (!enabled) return null;

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
          className="absolute animate-float-reaction"
          style={{
            right: `${reaction.x}%`,
            bottom: '80px',
            fontSize: `${2 * reaction.size}rem`,
            animationDuration: `${reaction.duration}s`,
            '--wobble': `${reaction.wobble}deg`,
            '--glow-color': REACTION_COLORS[reaction.type],
          } as React.CSSProperties}
        >
          <span
            className="inline-block animate-wobble drop-shadow-lg"
            style={{
              filter: `drop-shadow(0 0 8px ${REACTION_COLORS[reaction.type]}40)`,
            }}
          >
            {REACTION_EMOJIS[reaction.type]}
          </span>
        </div>
      ))}

      {/* CSS Animations */}
      <style>{`
        @keyframes float-reaction {
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

        @keyframes wobble {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(var(--wobble, 10deg));
          }
          75% {
            transform: rotate(calc(var(--wobble, 10deg) * -1));
          }
        }

        .animate-float-reaction {
          animation: float-reaction var(--duration, 3s) ease-out forwards;
        }

        .animate-wobble {
          animation: wobble 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default ReactionOverlay;
