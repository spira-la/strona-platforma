import { useCallback } from 'react';
import type { UseWebinarQAOptions, UseWebinarQAReturn } from './types/webinar-socket.types';

export function useWebinarQA(options: UseWebinarQAOptions): UseWebinarQAReturn {
  const { socketRef, sessionId } = options;

  const submitQuestion = useCallback(
    (question: string, anonymous: boolean, displayName?: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('submit_question', { sessionId, question, anonymous, displayName });
      }
    },
    [socketRef, sessionId]
  );

  const answerQuestion = useCallback(
    (questionId: string, answer: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('answer_question', { questionId, answer });
      }
    },
    [socketRef]
  );

  const upvoteQuestion = useCallback(
    (questionId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('upvote_question', { questionId });
      }
    },
    [socketRef]
  );

  const deleteQuestion = useCallback(
    (questionId: string) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('delete_question', { questionId });
      }
    },
    [socketRef]
  );

  return {
    submitQuestion,
    answerQuestion,
    upvoteQuestion,
    deleteQuestion,
  };
}

export default useWebinarQA;
