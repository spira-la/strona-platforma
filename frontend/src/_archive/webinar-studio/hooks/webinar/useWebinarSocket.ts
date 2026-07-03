import { useRef, useState, useCallback, useEffect } from 'react';
import { useWebinarConnection } from './useWebinarConnection';
import { useWebinarChat } from './useWebinarChat';
import { useWebinarQA } from './useWebinarQA';
import { useWebinarPolls } from './useWebinarPolls';
import { useWebinarHostControls } from './useWebinarHostControls';
import { useWebinarScene } from './useWebinarScene';
import { useWebinarReactions } from './useWebinarReactions';
import type {
  WebinarSocketOptions,
  WebinarSocketReturn,
  WebinarEventHandlers,
  SessionStateEvent,
  SceneParticipant,
  WebinarAttendee,
  GiveawayWinner,
  GiveawayRound,
} from './types/webinar-socket.types';

/**
 * Main webinar socket hook - orchestrates all sub-hooks
 * Maintains backward-compatible API while delegating to focused sub-hooks
 */
export function useWebinarSocket(options: WebinarSocketOptions): WebinarSocketReturn {
  const {
    sessionId,
    enabled = true,
    isHost = false,
    isShadow = false,
    isSpeaker = false,
    isAdminSpeaker = false,
    socketUrl,
    overrideUserId,
    overrideUserName,
    clientType,
    // Callbacks
    onChatMessage,
    onChatMessagePinned,
    onChatMessageDeleted,
    onQuestionReceived,
    onQuestionAnswered,
    onQuestionUpvoted,
    onQuestionDeleted,
    onPollCreated,
    onPollVoteUpdate,
    onPollClosed,
    onQAStatusChanged,
    onChatStatusChanged,
    onAttendeeCountUpdated,
    onAttendeeListUpdated,
    onSessionPaused,
    onSessionStatusChanged,
    onReactionReceived,
    onReactionsStatusChanged,
    onSceneTemplateChanged,
    onOverlayVisibilityChanged,
    onBackgroundChanged,
    onCameraScaleChanged,
    onCameraSlotStylesUpdated,
    onCornerImagesUpdated,
    onTextBannerShown,
    onSpeakerDisplayNamesUpdated,
    onSpeakerNameStyleUpdated,
    onSceneStateUpdated,
    onSceneSyncRequested,
    onSceneParticipantsUpdated,
    onConnected,
    onDisconnected,
    onError,
    onAnyEvent,
    onMissedEvents,
    onGiveawayWinnerSelected,
    onGiveawayNewRound,
    onGiveawayRoundDeleted,
    onGiveawaySelectionStarted,
  } = options;

  // Session state (managed by connection events)
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [attendeeList, setAttendeeList] = useState<WebinarAttendee[]>([]);
  const [qaEnabled, setQaEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);

  // Giveaway state
  const [currentGiveawayWinners, setCurrentGiveawayWinners] = useState<GiveawayWinner[]>([]);
  const [giveawayRounds, setGiveawayRounds] = useState<GiveawayRound[]>([]);
  const [isGiveawaySelecting, setIsGiveawaySelecting] = useState(false);

  // Scene participant state - managed here to avoid double-hook issue
  const [sceneParticipants, setSceneParticipants] = useState<SceneParticipant[]>([]);
  // Initialize as undefined to show ALL participants by default (feature not active)
  // When the host explicitly manages scene participants, this becomes an array
  const [onSceneIds, setOnSceneIds] = useState<string[] | undefined>(undefined);

  // Event handlers ref - consolidates all callbacks.
  // Initialized with empty object; populated on every render below.
  const eventHandlersRef = useRef<WebinarEventHandlers>({} as WebinarEventHandlers);

  // Update event handlers ref on every render to capture latest callbacks
  eventHandlersRef.current = {
    onChatMessage,
    onChatMessagePinned,
    onChatMessageDeleted,
    onQuestionReceived,
    onQuestionAnswered,
    onQuestionUpvoted,
    onQuestionDeleted,
    onPollCreated,
    onPollVoteUpdate,
    onPollClosed,
    onQAStatusChanged: (enabled) => {
      setQaEnabled(enabled);
      onQAStatusChanged?.(enabled);
    },
    onChatStatusChanged: (enabled) => {
      setChatEnabled(enabled);
      onChatStatusChanged?.(enabled);
    },
    onAttendeeCountUpdated: (count) => {
      setAttendeeCount(count);
      onAttendeeCountUpdated?.(count);
    },
    onAttendeeListUpdated: (attendees) => {
      setAttendeeList(attendees);
      onAttendeeListUpdated?.(attendees);
    },
    onSessionPaused: (paused) => {
      setIsPaused(paused);
      onSessionPaused?.(paused);
    },
    onSessionStatusChanged,
    onSessionState: (event: SessionStateEvent) => {
      if (event.qaEnabled !== undefined) setQaEnabled(event.qaEnabled);
      if (event.chatEnabled !== undefined) setChatEnabled(event.chatEnabled);
      if (event.reactionsEnabled !== undefined) setReactionsEnabled(event.reactionsEnabled);
      if (event.isPaused !== undefined) setIsPaused(event.isPaused);
      if (event.attendeeCount !== undefined) setAttendeeCount(event.attendeeCount);
      if (event.sceneParticipants !== undefined) {
        setSceneParticipants(event.sceneParticipants);
      }
      if (event.onSceneIds !== undefined) {
        setOnSceneIds(event.onSceneIds);
      }
    },
    onReactionReceived,
    onReactionsStatusChanged: (enabled) => {
      setReactionsEnabled(enabled);
      onReactionsStatusChanged?.(enabled);
    },
    onSceneTemplateChanged,
    onOverlayVisibilityChanged,
    onBackgroundChanged,
    onCameraScaleChanged,
    onCameraSlotStylesUpdated,
    onCornerImagesUpdated,
    onTextBannerShown,
    onSpeakerDisplayNamesUpdated,
    onSpeakerNameStyleUpdated,
    onSceneStateUpdated,
    onSceneSyncRequested,
    onSceneParticipantsUpdated: (participants, newOnSceneIds) => {
      console.log('[WebinarSocket] onSceneParticipantsUpdated:', { participants, newOnSceneIds });
      setSceneParticipants(participants);
      setOnSceneIds(newOnSceneIds);
      onSceneParticipantsUpdated?.(participants, newOnSceneIds);
    },
    onConnected,
    onDisconnected,
    onError,
    onAnyEvent,
    onMissedEvents,
    onGiveawayWinnerSelected: (winner, currentWinners) => {
      setIsGiveawaySelecting(false);
      setCurrentGiveawayWinners(currentWinners);
      onGiveawayWinnerSelected?.(winner, currentWinners);
    },
    onGiveawayNewRound: (rounds, currentWinners) => {
      setIsGiveawaySelecting(false);
      setGiveawayRounds(rounds);
      setCurrentGiveawayWinners(currentWinners);
      onGiveawayNewRound?.(rounds, currentWinners);
    },
    onGiveawayRoundDeleted: (deletedRoundId, rounds) => {
      setGiveawayRounds(rounds);
      onGiveawayRoundDeleted?.(deletedRoundId, rounds);
    },
    onGiveawaySelectionStarted: () => {
      setIsGiveawaySelecting(true);
      onGiveawaySelectionStarted?.();
    },
  };

  // Connection hook (core)
  const connection = useWebinarConnection({
    sessionId,
    enabled,
    isHost,
    isShadow,
    isSpeaker,
    isAdminSpeaker,
    eventHandlers: eventHandlersRef,
    socketUrl,
    overrideUserId,
    overrideUserName,
    clientType,
  });

  // Feature hooks (all depend on socketRef from connection)
  const chat = useWebinarChat({
    socketRef: connection.socketRef,
    sessionId,
  });

  const qa = useWebinarQA({
    socketRef: connection.socketRef,
    sessionId,
  });

  const polls = useWebinarPolls({
    socketRef: connection.socketRef,
    sessionId,
  });

  const hostControls = useWebinarHostControls({
    socketRef: connection.socketRef,
    sessionId,
  });

  // Scene hook for actions (using actual socketRef)
  const scene = useWebinarScene({
    socketRef: connection.socketRef,
    sessionId,
  });

  // Override getSceneParticipants to update local state
  const getSceneParticipants = useCallback(async () => {
    const result = await scene.getSceneParticipants();
    if (result) {
      setSceneParticipants(result.participants);
      setOnSceneIds(result.onSceneIds);
    }
    return result;
  }, [scene]);

  const reactions = useWebinarReactions({
    socketRef: connection.socketRef,
    sessionId,
    reactionsEnabled,
  });

  // Attendee list methods (for giveaway/raffle feature)
  const getAttendeeList = useCallback(async (): Promise<WebinarAttendee[]> => {
    if (!connection.socketRef.current?.connected) {
      return [];
    }
    return new Promise((resolve) => {
      connection.socketRef.current!.emit(
        'get_attendee_list',
        { sessionId },
        (response: { success: boolean; attendees?: WebinarAttendee[]; error?: string }) => {
          if (response.success && response.attendees) {
            setAttendeeList(response.attendees);
            resolve(response.attendees);
          } else {
            resolve([]);
          }
        }
      );
    });
  }, [connection.socketRef, sessionId]);

  const updateDisplayName = useCallback((displayName: string) => {
    if (connection.socketRef.current?.connected) {
      connection.socketRef.current.emit('update_display_name', { sessionId, displayName });
    }
  }, [connection.socketRef, sessionId]);

  // Giveaway methods
  const startGiveawaySelection = useCallback(() => {
    if (!connection.socketRef.current?.connected) return;
    connection.socketRef.current.emit('start_giveaway_selection', { sessionId });
  }, [connection.socketRef, sessionId]);

  const selectGiveawayWinner = useCallback(async (winner: {
    odantzId: string;
    odantzIdFirebase?: string;
    name: string;
    email?: string;
    avatar?: string;
    place: 1 | 2 | 3;
  }, isTestPick?: boolean) => {
    if (!connection.socketRef.current?.connected) return null;
    return new Promise((resolve) => {
      connection.socketRef.current!.emit(
        'select_giveaway_winner',
        { sessionId, winner, isTestPick },
        (response: { success: boolean; currentWinners?: any[]; error?: string }) => {
          // Update local state immediately for responsiveness
          if (response.success && response.currentWinners) {
            setCurrentGiveawayWinners(response.currentWinners);
          }
          resolve(response);
        }
      );
    });
  }, [connection.socketRef, sessionId]);

  const startNewGiveawayRound = useCallback(async (webinarId: string) => {
    if (!connection.socketRef.current?.connected) return null;
    return new Promise((resolve) => {
      connection.socketRef.current!.emit(
        'start_new_giveaway_round',
        { sessionId, webinarId },
        (response: { success: boolean; rounds?: any[]; currentWinners?: any[]; error?: string }) => {
          // Update local state immediately
          if (response.success) {
            if (response.rounds) {
              setGiveawayRounds(response.rounds);
            }
            if (response.currentWinners !== undefined) {
              setCurrentGiveawayWinners(response.currentWinners);
            }
          }
          resolve(response);
        }
      );
    });
  }, [connection.socketRef, sessionId]);

  const getGiveawayState = useCallback(async () => {
    if (!connection.socketRef.current?.connected) return null;
    return new Promise((resolve) => {
      connection.socketRef.current!.emit(
        'get_giveaway_state',
        { sessionId },
        (response: { success: boolean; currentWinners?: any[]; rounds?: any[]; allTimeWinnerIds?: string[]; error?: string }) => {
          // Update local state with fetched data
          if (response.success) {
            if (response.currentWinners) {
              setCurrentGiveawayWinners(response.currentWinners);
            }
            if (response.rounds) {
              setGiveawayRounds(response.rounds);
            }
          }
          resolve(response);
        }
      );
    });
  }, [connection.socketRef, sessionId]);

  const getEligibleAttendees = useCallback(async () => {
    if (!connection.socketRef.current?.connected) return null;
    return new Promise((resolve) => {
      connection.socketRef.current!.emit(
        'get_eligible_attendees',
        { sessionId },
        (response: { success: boolean; attendees?: any[]; totalAttendees?: number; excludedCount?: number; error?: string }) => {
          resolve(response);
        }
      );
    });
  }, [connection.socketRef, sessionId]);

  const deleteGiveawayRound = useCallback(async (roundId: string) => {
    if (!connection.socketRef.current?.connected) return null;
    return new Promise((resolve) => {
      connection.socketRef.current!.emit(
        'delete_giveaway_round',
        { sessionId, roundId },
        (response: { success: boolean; rounds?: any[]; error?: string }) => {
          // Update local state immediately
          if (response.success && response.rounds) {
            setGiveawayRounds(response.rounds);
          }
          resolve(response);
        }
      );
    });
  }, [connection.socketRef, sessionId]);

  // Return backward-compatible API
  return {
    // Connection state
    isConnected: connection.isConnected,
    connectionStatus: connection.connectionStatus,
    error: connection.error,
    reconnectAttempts: connection.reconnectAttempts,
    lastEvent: connection.lastEvent,

    // Session state
    attendeeCount,
    qaEnabled,
    chatEnabled,
    isPaused,
    reactionsEnabled,

    // Chat actions
    sendChatMessage: chat.sendChatMessage,
    pinMessage: chat.pinMessage,
    deleteChatMessage: chat.deleteChatMessage,

    // Q&A actions
    submitQuestion: qa.submitQuestion,
    answerQuestion: qa.answerQuestion,
    upvoteQuestion: qa.upvoteQuestion,
    deleteQuestion: qa.deleteQuestion,

    // Poll actions
    createPoll: polls.createPoll,
    submitVote: polls.submitVote,
    closePoll: polls.closePoll,
    createDraftPoll: polls.createDraftPoll,
    getDraftPolls: polls.getDraftPolls,
    launchPoll: polls.launchPoll,
    deleteDraftPoll: polls.deleteDraftPoll,

    // Host controls
    toggleQA: hostControls.toggleQA,
    toggleChat: hostControls.toggleChat,
    togglePause: hostControls.togglePause,
    toggleReactions: hostControls.toggleReactions,

    // Attendee list (for giveaway/raffle)
    attendeeList,
    getAttendeeList,
    updateDisplayName,

    // Giveaway state and methods
    currentGiveawayWinners,
    giveawayRounds,
    isGiveawaySelecting,
    selectGiveawayWinner,
    startGiveawaySelection,
    startNewGiveawayRound,
    getGiveawayState,
    getEligibleAttendees,
    deleteGiveawayRound,

    // Reactions
    sendReaction: reactions.sendReaction,

    // Scene template
    changeSceneTemplate: scene.changeSceneTemplate,
    changeOverlayVisibility: scene.changeOverlayVisibility,
    currentTemplateId: scene.currentTemplateId,

    // Scene state sync
    broadcastBackground: scene.broadcastBackground,
    broadcastCameraScale: scene.broadcastCameraScale,
    broadcastCameraSlotStyles: scene.broadcastCameraSlotStyles,
    broadcastCornerImages: scene.broadcastCornerImages,
    broadcastTextBanner: scene.broadcastTextBanner,
    broadcastSpeakerDisplayNames: scene.broadcastSpeakerDisplayNames,
    broadcastSpeakerNameStyle: scene.broadcastSpeakerNameStyle,
    broadcastFullSceneState: scene.broadcastFullSceneState,
    sendSceneStateToClient: scene.sendSceneStateToClient,
    requestSceneState: scene.requestSceneState,

    // Scene participants - use local state (updated by event handlers)
    sceneParticipants,
    onSceneIds,
    addToScene: scene.addToScene,
    removeFromScene: scene.removeFromScene,
    getSceneParticipants,

    // Connection management
    connect: connection.connect,
    disconnect: connection.disconnect,
    forceReconnect: connection.forceReconnect,
    requestMissedEvents: connection.requestMissedEvents,
    ping: connection.ping,
    socket: connection.socketRef.current,
  };
}

export default useWebinarSocket;
