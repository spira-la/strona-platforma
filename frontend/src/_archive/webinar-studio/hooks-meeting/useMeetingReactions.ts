/**
 * useMeetingReactions Hook
 *
 * Bidirectional emoji reactions for meetings using LiveKit data channel.
 * Both coach and client can send/receive reactions.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDataChannel } from '@livekit/components-react';

// Meeting-specific reaction types (different from webinar)
export type MeetingReactionType = 'star' | 'mindblown' | 'muscle' | 'pray' | 'sparkles' | 'hundred';

export const MEETING_REACTION_EMOJIS: Record<MeetingReactionType, string> = {
  star: '⭐',
  mindblown: '🤯',
  muscle: '💪',
  pray: '🙏',
  sparkles: '✨',
  hundred: '💯',
};

export const MEETING_REACTION_COLORS: Record<MeetingReactionType, string> = {
  star: '#eab308',
  mindblown: '#ef4444',
  muscle: '#f97316',
  pray: '#8b5cf6',
  sparkles: '#06b6d4',
  hundred: '#22c55e',
};

export interface FloatingReaction {
  id: string;
  type: MeetingReactionType;
  x: number; // percentage from edge
  side: 'left' | 'right'; // local = right, remote = left
  createdAt: number;
  size: number;
  duration: number;
  wobble: number;
}

interface ReactionMessage {
  type: 'meeting-reaction';
  reaction: MeetingReactionType;
  sender: string;
  timestamp: number;
}

const REACTION_CHANNEL_TOPIC = 'meeting-reactions';
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 1000;

function createFloatingReaction(
  type: MeetingReactionType,
  side: 'left' | 'right',
): FloatingReaction {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    x: 5 + Math.random() * 15, // 5-20% from edge
    side,
    createdAt: Date.now(),
    size: 0.8 + Math.random() * 0.6,
    duration: 2.5 + Math.random() * 1.5,
    wobble: -15 + Math.random() * 30,
  };
}

export function useMeetingReactions(participantName: string) {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const reactionTimestamps = useRef<number[]>([]);
  const cleanupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Data channel for reactions
  const { send } = useDataChannel(REACTION_CHANNEL_TOPIC, (msg) => {
    try {
      const decoder = new TextDecoder();
      const parsed: ReactionMessage = JSON.parse(decoder.decode(msg.payload));

      if (parsed.type === 'meeting-reaction') {
        // Remote reactions appear on the left
        setReactions((prev) => {
          const newReactions = prev.length >= 50 ? prev.slice(1) : prev;
          return [...newReactions, createFloatingReaction(parsed.reaction, 'left')];
        });
      }
    } catch (err) {
      console.error('[MeetingReactions] Failed to parse message:', err);
    }
  });

  // Check rate limit
  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    // Remove timestamps outside the window
    reactionTimestamps.current = reactionTimestamps.current.filter(
      (ts) => now - ts < RATE_LIMIT_WINDOW_MS
    );

    if (reactionTimestamps.current.length >= RATE_LIMIT_MAX) {
      setIsRateLimited(true);
      setTimeout(() => setIsRateLimited(false), RATE_LIMIT_WINDOW_MS);
      return false;
    }

    reactionTimestamps.current.push(now);
    return true;
  }, []);

  // Send a reaction
  const sendReaction = useCallback(
    (type: MeetingReactionType) => {
      if (!checkRateLimit()) return;

      // Add local reaction (appears on the right)
      setReactions((prev) => {
        const newReactions = prev.length >= 50 ? prev.slice(1) : prev;
        return [...newReactions, createFloatingReaction(type, 'right')];
      });

      // Broadcast via data channel
      const message: ReactionMessage = {
        type: 'meeting-reaction',
        reaction: type,
        sender: participantName,
        timestamp: Date.now(),
      };

      try {
        const encoder = new TextEncoder();
        const payload = encoder.encode(JSON.stringify(message));
        Promise.resolve(send(payload, { reliable: false })).catch((err) => {
          console.warn('[MeetingReactions] Send failed:', err);
        });
      } catch (err) {
        console.warn('[MeetingReactions] Failed to broadcast reaction:', err);
      }
    },
    [checkRateLimit, participantName, send]
  );

  return {
    reactions,
    sendReaction,
    isRateLimited,
  };
}
