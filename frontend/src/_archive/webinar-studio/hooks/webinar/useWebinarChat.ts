import { useCallback } from 'react';
import type { UseWebinarChatOptions, UseWebinarChatReturn } from './types/webinar-socket.types';

export function useWebinarChat(options: UseWebinarChatOptions): UseWebinarChatReturn {
  const { socketRef, sessionId } = options;

  const sendChatMessage = useCallback(
    (message: string, displayName?: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('chat_message', { sessionId, message, displayName });
      }
    },
    [socketRef, sessionId]
  );

  const pinMessage = useCallback(
    (messageId: string, pinned: boolean) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('pin_message', { sessionId, messageId, pinned });
      }
    },
    [socketRef, sessionId]
  );

  const deleteChatMessage = useCallback(
    (messageId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('delete_chat_message', { sessionId, messageId });
      }
    },
    [socketRef, sessionId]
  );

  return {
    sendChatMessage,
    pinMessage,
    deleteChatMessage,
  };
}

export default useWebinarChat;
