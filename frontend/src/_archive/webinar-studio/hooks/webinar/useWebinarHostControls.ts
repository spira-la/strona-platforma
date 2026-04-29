import { useCallback } from 'react';
import type { UseWebinarHostControlsOptions, UseWebinarHostControlsReturn } from './types/webinar-socket.types';

export function useWebinarHostControls(options: UseWebinarHostControlsOptions): UseWebinarHostControlsReturn {
  const { socketRef, sessionId } = options;

  const toggleQA = useCallback(
    (enabled: boolean) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('toggle_qa', { sessionId, enabled });
      }
    },
    [socketRef, sessionId]
  );

  const toggleChat = useCallback(
    (enabled: boolean) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('toggle_chat', { sessionId, enabled });
      }
    },
    [socketRef, sessionId]
  );

  const togglePause = useCallback(
    (isPaused: boolean) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('toggle_pause', { sessionId, isPaused });
      }
    },
    [socketRef, sessionId]
  );

  const toggleReactions = useCallback(
    (enabled: boolean) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('toggle_reactions', { sessionId, enabled });
      }
    },
    [socketRef, sessionId]
  );

  return {
    toggleQA,
    toggleChat,
    togglePause,
    toggleReactions,
  };
}

export default useWebinarHostControls;
