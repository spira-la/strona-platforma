import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UseWebinarReactionsOptions, UseWebinarReactionsReturn, ReactionType } from './types/webinar-socket.types';

export function useWebinarReactions(options: UseWebinarReactionsOptions): UseWebinarReactionsReturn {
  const { socketRef, sessionId, reactionsEnabled } = options;
  const { currentUser } = useAuth();

  const sendReaction = useCallback(
    (reactionType: ReactionType) => {
      if (socketRef.current?.connected && reactionsEnabled) {
        socketRef.current.emit('send_reaction', {
          sessionId,
          reactionType,
          userName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Anonymous',
        });
      }
    },
    [socketRef, sessionId, reactionsEnabled, currentUser]
  );

  return {
    sendReaction,
  };
}

export default useWebinarReactions;
