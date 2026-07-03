import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  WebinarConnectionStatus,
  WebinarEvent,
  WebinarEventHandlers,
  UseWebinarConnectionOptions,
  UseWebinarConnectionReturn,
  SessionStateEvent,
  SceneState,
} from './types/webinar-socket.types';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://api.be-wonder.me';

export function useWebinarConnection(options: UseWebinarConnectionOptions): UseWebinarConnectionReturn {
  const {
    sessionId,
    enabled,
    isHost,
    isShadow,
    isSpeaker,
    isAdminSpeaker,
    eventHandlers,
    socketUrl: customSocketUrl,
    overrideUserId,
    overrideUserName,
    clientType,
  } = options;

  // Use custom URL if provided, otherwise use default
  const effectiveSocketUrl = customSocketUrl !== undefined ? customSocketUrl : SOCKET_URL;

  const { currentUser } = useAuth();

  // Use override credentials if provided (for recording bot), otherwise use Firebase user
  const effectiveUserId = overrideUserId || currentUser?.uid;
  const effectiveUserName = overrideUserName || currentUser?.displayName || currentUser?.email;
  const socketRef = useRef<Socket | null>(null);

  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<WebinarConnectionStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastEvent, setLastEvent] = useState<WebinarEvent | null>(null);

  // Track the last event timestamp for replay on reconnect
  const lastEventTimestampRef = useRef<number>(Date.now());

  // Process a single event - delegates to event handlers
  const processEvent = useCallback((event: WebinarEvent) => {
    setLastEvent(event);
    lastEventTimestampRef.current = Date.now();

    const handlers = eventHandlers.current;
    handlers.onAnyEvent?.(event);

    switch (event.type) {
      case 'chat_message_received':
        handlers.onChatMessage?.(event.message);
        break;
      case 'chat_message_pinned':
        handlers.onChatMessagePinned?.(event.messageId, event.pinned);
        break;
      case 'chat_message_deleted':
        handlers.onChatMessageDeleted?.(event.messageId);
        break;
      case 'question_received':
        handlers.onQuestionReceived?.(event.question);
        break;
      case 'question_answered':
        handlers.onQuestionAnswered?.(event.question);
        break;
      case 'question_upvoted':
        handlers.onQuestionUpvoted?.(event.questionId, event.upvotes, event.upvotedBy || []);
        break;
      case 'question_deleted':
        handlers.onQuestionDeleted?.(event.questionId);
        break;
      case 'poll_created':
        handlers.onPollCreated?.(event.poll);
        break;
      case 'poll_vote_update':
        handlers.onPollVoteUpdate?.(event.pollId, event.votes);
        break;
      case 'poll_closed':
        handlers.onPollClosed?.(event.pollId);
        break;
      case 'qa_status_changed':
        handlers.onQAStatusChanged?.(event.enabled);
        break;
      case 'chat_status_changed':
        handlers.onChatStatusChanged?.(event.enabled);
        break;
      case 'attendee_count_updated':
        handlers.onAttendeeCountUpdated?.(event.count);
        break;
      case 'attendee_list_updated':
        handlers.onAttendeeListUpdated?.(event.attendees);
        break;
      case 'session_state':
        handlers.onSessionState?.(event);
        break;
      case 'session_paused':
        handlers.onSessionPaused?.(event.isPaused);
        break;
      case 'session_status_changed':
        console.log('[WebinarSocket] session_status_changed:', event.status, 'from', event.previousStatus);
        handlers.onSessionStatusChanged?.(event.status, event.previousStatus);
        break;
      case 'reaction_received':
        handlers.onReactionReceived?.(event.reactionType, event.userId, event.userName);
        break;
      case 'reactions_status_changed':
        handlers.onReactionsStatusChanged?.(event.enabled);
        break;
      case 'scene_template_changed':
        console.log('[WebinarSocket] scene_template_changed received:', event.templateId);
        handlers.onSceneTemplateChanged?.(event.templateId, event.overlayVisibility);
        break;
      case 'overlay_visibility_changed':
        handlers.onOverlayVisibilityChanged?.(event.overlayId, event.isVisible);
        break;
      case 'background_changed':
        console.log('[WebinarSocket] background_changed received:', event.background);
        handlers.onBackgroundChanged?.(event.background);
        break;
      case 'camera_scale_changed':
        handlers.onCameraScaleChanged?.(event.cameraScale);
        break;
      case 'camera_slot_styles_updated':
        handlers.onCameraSlotStylesUpdated?.(event.cameraSlotStyles);
        break;
      case 'corner_images_updated':
        handlers.onCornerImagesUpdated?.(event.cornerImages);
        break;
      case 'text_banner_shown':
        handlers.onTextBannerShown?.(event.banner);
        break;
      case 'speaker_display_names_updated':
        handlers.onSpeakerDisplayNamesUpdated?.(event.speakerDisplayNames);
        break;
      case 'speaker_name_style_updated':
        handlers.onSpeakerNameStyleUpdated?.(event.speakerNameStyle);
        break;
      case 'scene_state_updated':
        handlers.onSceneStateUpdated?.(event.sceneState);
        break;
      case 'scene_participants_updated':
        console.log('[WebinarSocket] scene_participants_updated received:', {
          participants: event.participants,
          onSceneIds: event.onSceneIds,
        });
        handlers.onSceneParticipantsUpdated?.(event.participants, event.onSceneIds);
        break;
      case 'giveaway_winner_selected':
        console.log('[WebinarSocket] giveaway_winner_selected received:', event);
        handlers.onGiveawayWinnerSelected?.(event.winner, event.currentWinners);
        break;
      case 'giveaway_new_round':
        console.log('[WebinarSocket] giveaway_new_round received:', event);
        handlers.onGiveawayNewRound?.(event.rounds, event.currentWinners);
        break;
      case 'giveaway_round_deleted':
        console.log('[WebinarSocket] giveaway_round_deleted received:', event);
        handlers.onGiveawayRoundDeleted?.(event.deletedRoundId, event.rounds);
        break;
      case 'giveaway_selection_started':
        console.log('[WebinarSocket] giveaway_selection_started received');
        handlers.onGiveawaySelectionStarted?.();
        break;
    }
  }, [eventHandlers]);

  // Initialize socket connection
  const connect = useCallback(() => {
    // Detailed logging for recording template debugging
    console.log('[WebinarSocket] connect() called with:', {
      sessionId,
      enabled,
      alreadyConnected: socketRef.current?.connected,
      effectiveSocketUrl,
      effectiveUserId,
      effectiveUserName,
      isHost,
      isShadow,
    });

    if (!sessionId || !enabled || socketRef.current?.connected) {
      console.log('[WebinarSocket] connect() early return:', {
        noSessionId: !sessionId,
        notEnabled: !enabled,
        alreadyConnected: socketRef.current?.connected,
      });
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    const socketUrl = `${effectiveSocketUrl}/webinar`;
    console.log('[WebinarSocket] Creating socket.io connection to:', socketUrl);
    console.log('[WebinarSocket] Current window location:', typeof window !== 'undefined' ? window.location.href : 'N/A');

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
      auth: {
        sessionId,
        userId: effectiveUserId,
        userName: effectiveUserName,
        clientType, // Distinguish between studio/control-panel/viewer
      },
    });

    console.log('[WebinarSocket] Socket created, id:', socket.id, 'connected:', socket.connected);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WebinarSocket] ✅ CONNECTED! Socket ID:', socket.id);
      setConnectionStatus('connected');
      setReconnectAttempts(0);
      eventHandlers.current.onConnected?.();

      console.log('[WebinarSocket] Emitting subscribe_session for:', sessionId, 'clientType:', clientType);
      socket.emit('subscribe_session', {
        sessionId,
        userId: effectiveUserId,
        userName: effectiveUserName,
        isHost,
        isShadow,
        isSpeaker,
        isAdminSpeaker,
        clientType, // Distinguish between studio/control-panel/viewer
        lastEventTimestamp: lastEventTimestampRef.current,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebinarSocket] ❌ DISCONNECTED! Reason:', reason);
      setConnectionStatus('disconnected');
      eventHandlers.current.onDisconnected?.();
    });

    socket.on('connect_error', (err) => {
      console.error('[WebinarSocket] ❌ Connection error:', err.message, err);
      console.error('[WebinarSocket] Error details:', {
        type: err.name,
        message: err.message,
        description: (err as unknown as { description?: string }).description,
      });
      setConnectionStatus('disconnected');
      setError(err);
      eventHandlers.current.onError?.(err);
    });

    // Timeout to detect if socket never connects
    setTimeout(() => {
      if (!socket.connected) {
        console.warn('[WebinarSocket] ⚠️ Socket not connected after 5s, state:', socket.connected, 'disconnected:', socket.disconnected);
      }
    }, 5000);

    socket.io.on('reconnect_attempt', (attempt) => {
      setConnectionStatus('reconnecting');
      setReconnectAttempts(attempt);
    });

    socket.io.on('reconnect', () => {
      setConnectionStatus('connected');
      setReconnectAttempts(0);
    });

    socket.io.on('reconnect_failed', () => {
      setConnectionStatus('disconnected');
    });

    // Listen for webinar events
    socket.on('webinar_event', (event: WebinarEvent) => {
      processEvent(event);
    });

    // Listen for session_state directly (sent on initial connection)
    socket.on('session_state', (data: SessionStateEvent) => {
      console.log('[WebinarSocket] session_state received directly:', data);
      processEvent({ ...data, type: 'session_state' });
    });

    // Listen for missed events (sent after reconnection)
    socket.on('missed_events', (data: { events: WebinarEvent[] }) => {
      if (data.events.length > 0) {
        eventHandlers.current.onMissedEvents?.(data.events);
        data.events.forEach((event) => {
          processEvent(event);
        });
      }
    });

    // Listen for scene sync request (host receives this when a new client joins)
    socket.on('request_scene_sync', (data: { requesterId: string }) => {
      eventHandlers.current.onSceneSyncRequested?.(data.requesterId);
    });

    // Listen for scene state sync (client receives this from host)
    socket.on('scene_state_sync', (data: { sceneState: SceneState }) => {
      eventHandlers.current.onSceneStateUpdated?.(data.sceneState);
    });

    // Listen for session kicked event (real-time notification when kicked by another device)
    // This is sent directly to the user, not via webinar_event
    socket.on('session_kicked', (data: { reason: string; newDeviceInfo?: string }) => {
      console.log('[WebinarSocket] session_kicked received:', data);
      eventHandlers.current.onSessionKicked?.(data.reason, data.newDeviceInfo);
    });

    // Listen for attendee list updates (for giveaway/raffle feature)
    // This is sent directly to hosts/shadows/admin speakers only
    socket.on('attendee_list_updated', (data: { attendees: any[] }) => {
      eventHandlers.current.onAttendeeListUpdated?.(data.attendees);
    });
  }, [sessionId, enabled, isHost, isShadow, isSpeaker, isAdminSpeaker, effectiveUserId, effectiveUserName, processEvent, eventHandlers, effectiveSocketUrl]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (socketRef.current.connected) {
        socketRef.current.emit('unsubscribe_session', { sessionId });
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnectionStatus('disconnected');
    }
  }, [sessionId]);

  // Auto connect/disconnect based on enabled and sessionId
  useEffect(() => {
    if (enabled && sessionId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, sessionId, connect, disconnect]);

  // Force reconnect
  const forceReconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  }, []);

  // Request missed events
  const requestMissedEvents = useCallback(
    (sinceTimestamp?: number) => {
      if (socketRef.current?.connected && sessionId) {
        socketRef.current.emit(
          'request_missed_events',
          {
            sessionId,
            userId: effectiveUserId,
            sinceTimestamp: sinceTimestamp || lastEventTimestampRef.current,
          },
          (response: { events: WebinarEvent[] }) => {
            if (response.events.length > 0) {
              eventHandlers.current.onMissedEvents?.(response.events);
              response.events.forEach((event) => {
                processEvent(event);
              });
            }
          }
        );
      }
    },
    [sessionId, effectiveUserId, processEvent, eventHandlers]
  );

  // Ping the server to check connection health
  const ping = useCallback(() => {
    return new Promise<number | null>((resolve) => {
      if (!socketRef.current?.connected) {
        resolve(null);
        return;
      }

      const start = Date.now();
      socketRef.current.emit('ping', {}, (response: { pong: boolean; timestamp: number }) => {
        if (response.pong) {
          resolve(Date.now() - start);
        } else {
          resolve(null);
        }
      });

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }, []);

  return {
    socketRef,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    error,
    reconnectAttempts,
    lastEvent,
    connect,
    disconnect,
    forceReconnect,
    requestMissedEvents,
    ping,
  };
}

export default useWebinarConnection;
