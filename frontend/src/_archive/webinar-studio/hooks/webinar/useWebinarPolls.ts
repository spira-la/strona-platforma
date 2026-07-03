import { useCallback } from 'react';
import type { UseWebinarPollsOptions, UseWebinarPollsReturn, WebinarPoll } from './types/webinar-socket.types';

export function useWebinarPolls(options: UseWebinarPollsOptions): UseWebinarPollsReturn {
  const { socketRef, sessionId } = options;

  const createPoll = useCallback(
    (question: string, pollOptions: string[]) => {
      console.log('[WebinarPolls] createPoll called:', {
        sessionId,
        question,
        options: pollOptions,
        connected: socketRef.current?.connected,
      });
      if (socketRef.current?.connected) {
        socketRef.current.emit('create_poll', { sessionId, question, options: pollOptions });
        console.log('[WebinarPolls] create_poll event emitted');
      } else {
        console.warn('[WebinarPolls] Cannot create poll - socket not connected');
      }
    },
    [socketRef, sessionId]
  );

  const submitVote = useCallback(
    (pollId: string, optionIndex: number) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('submit_vote', { pollId, optionIndex });
      }
    },
    [socketRef]
  );

  const closePoll = useCallback(
    (pollId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('close_poll', { pollId });
      }
    },
    [socketRef]
  );

  const createDraftPoll = useCallback(
    (question: string, pollOptions: string[]): Promise<WebinarPoll | null> => {
      return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
          console.warn('[WebinarPolls] Cannot create draft poll - socket not connected');
          resolve(null);
          return;
        }

        socketRef.current.emit(
          'create_draft_poll',
          { sessionId, question, options: pollOptions },
          (response: { success: boolean; poll?: WebinarPoll; error?: string }) => {
            if (response.success && response.poll) {
              console.log('[WebinarPolls] Draft poll created:', response.poll);
              resolve(response.poll);
            } else {
              console.warn('[WebinarPolls] Failed to create draft poll:', response.error);
              resolve(null);
            }
          }
        );
      });
    },
    [socketRef, sessionId]
  );

  const getDraftPolls = useCallback((): Promise<WebinarPoll[]> => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) {
        console.warn('[WebinarPolls] Cannot get draft polls - socket not connected');
        resolve([]);
        return;
      }

      socketRef.current.emit(
        'get_draft_polls',
        { sessionId },
        (response: { success: boolean; polls?: WebinarPoll[]; error?: string }) => {
          if (response.success && response.polls) {
            resolve(response.polls);
          } else {
            console.warn('[WebinarPolls] Failed to get draft polls:', response.error);
            resolve([]);
          }
        }
      );
    });
  }, [socketRef, sessionId]);

  const launchPoll = useCallback(
    (pollId: string) => {
      if (socketRef.current?.connected) {
        console.log('[WebinarPolls] Launching poll:', pollId);
        socketRef.current.emit('launch_poll', { pollId });
      } else {
        console.warn('[WebinarPolls] Cannot launch poll - socket not connected');
      }
    },
    [socketRef]
  );

  const deleteDraftPoll = useCallback(
    (pollId: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
          console.warn('[WebinarPolls] Cannot delete draft poll - socket not connected');
          resolve(false);
          return;
        }

        socketRef.current.emit(
          'delete_draft_poll',
          { pollId },
          (response: { success: boolean; error?: string }) => {
            if (response.success) {
              console.log('[WebinarPolls] Draft poll deleted:', pollId);
              resolve(true);
            } else {
              console.warn('[WebinarPolls] Failed to delete draft poll:', response.error);
              resolve(false);
            }
          }
        );
      });
    },
    [socketRef]
  );

  return {
    createPoll,
    submitVote,
    closePoll,
    createDraftPoll,
    getDraftPolls,
    launchPoll,
    deleteDraftPoll,
  };
}

export default useWebinarPolls;
