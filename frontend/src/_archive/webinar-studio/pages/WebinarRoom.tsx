/**
 * WebinarRoom Page
 *
 * Live webinar room for attendees to watch the webinar, participate in chat,
 * ask questions (Q&A), and respond to polls.
 *
 * Features:
 * - LiveKit video streaming integration
 * - Real-time chat via WebSocket
 * - Q&A with upvoting
 * - Live polls
 * - Access validation (purchase required)
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────┐
 * │                    WebinarPlayer                        │
 * │                  (video del host)                       │
 * ├─────────────────────────────────┬───────────────────────┤
 * │                                 │     Tabs:             │
 * │      WebinarPoll                │     - Chat            │
 * │      (cuando hay encuesta)      │     - Q&A             │
 * │                                 │                       │
 * └─────────────────────────────────┴───────────────────────┘
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Video, Users, AlertCircle, ArrowLeft, Clock, Pause, Play, LogOut, User, Edit2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  WebinarChat,
  WebinarQA,
  WebinarPollComponent,
  WebinarHlsPlayer,
} from '@/components/webinar';
import { GiveawayWinnerOverlay } from '@/components/webinar/GiveawayWinnerOverlay';
import { GiveawayWinnerBanner } from '@/components/webinar/GiveawayWinnerBanner';
import {
  SessionConflictDialog,
  SessionKickedDialog,
} from '@/components/webinar/SessionConflictDialog';
import { useWebinarPurchase } from '@/hooks/useWebinarPurchase';
import { useWebinarSocket } from '@/hooks/useWebinarSocket';
import { useSceneTemplates } from '@/hooks/useSceneTemplates';
import { useSceneSyncState } from '@/hooks/useSceneSyncState';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useMediaSession } from '@/hooks/useMediaSession';
import { webinarLiveClient } from '@/clients/WebinarLiveClient';
import { webinarSessionsClient } from '@/clients/WebinarSessionsClient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import type {
  WebinarChatMessage,
  WebinarQuestion,
  WebinarPoll,
  SessionConflictResponse,
} from '@/domain/products/models/webinar.model';
import type { GiveawayWinner } from '@/hooks/webinar/types/webinar-socket.types';

export default function WebinarRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isDark } = useTheme();

  // HLS streaming state — viewers watch via HLS (not WebRTC)
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isLoadingHls, setIsLoadingHls] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session conflict handling
  const [sessionConflict, setSessionConflict] = useState<SessionConflictResponse | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [showKickedDialog, setShowKickedDialog] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);


  // Real-time state for chat, Q&A, and polls
  const [chatMessages, setChatMessages] = useState<WebinarChatMessage[]>([]);
  const [questions, setQuestions] = useState<WebinarQuestion[]>([]);
  const [activePoll, setActivePoll] = useState<WebinarPoll | null>(null);
  const [pollHistory, setPollHistory] = useState<WebinarPoll[]>([]);

  // Unread chat messages counter
  const [lastReadMessageCount, setLastReadMessageCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Calculate unread messages
  const unreadChatCount = useMemo(() => {
    if (isPanelOpen) return 0; // No unread if panel is open
    return Math.max(0, chatMessages.length - lastReadMessageCount);
  }, [chatMessages.length, lastReadMessageCount, isPanelOpen]);

  // Reset unread count when panel opens
  useEffect(() => {
    if (isPanelOpen) {
      setLastReadMessageCount(chatMessages.length);
    }
  }, [isPanelOpen, chatMessages.length]);

  // Track session status for auto-refresh when going live
  const [polledSessionStatus, setPolledSessionStatus] = useState<string | null>(null);
  // Track status set by socket (authoritative, real-time) to prevent API polling regressions
  const socketStatusRef = useRef<string | null>(null);
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);

  // Transition states for smooth UX
  const [isRedirectingToLive, setIsRedirectingToLive] = useState(false);
  const [isEndingTransmission, setIsEndingTransmission] = useState(false);

  // Display name for privacy (GDPR compliance)
  // Users can change their display name to maintain anonymity in chat
  const [showDisplayNameDialog, setShowDisplayNameDialog] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [tempDisplayName, setTempDisplayName] = useState<string>('');
  const hasShownDisplayNameDialogRef = useRef(false);

  // Giveaway winner notification state
  const [shownWinnerPlaces, setShownWinnerPlaces] = useState<Set<number>>(new Set());
  const [activeWinnerNotification, setActiveWinnerNotification] = useState<GiveawayWinner | null>(null);
  const [persistedWin, setPersistedWin] = useState<{ place: 1 | 2 | 3; roundNumber: number } | null>(null);
  const [floatingBannerDismissed, setFloatingBannerDismissed] = useState(false);

  // Scene template for StreamYard-like layouts
  const {
    templates: allSceneTemplates,
    selectedTemplate: sceneTemplate,
    overlayVisibility,
    isLoading: loadingTemplates,
    selectTemplateById,
    toggleOverlay: updateOverlayVisibility,
  } = useSceneTemplates({
    loadOnMount: true,
    autoSelectDefault: true,
  });

  // Scene state synced from host (using custom hook for DRY/SOLID)
  const [sceneSyncState, sceneSyncHandlers] = useSceneSyncState({
    onTemplateChange: selectTemplateById,
    onOverlayVisibilityChange: updateOverlayVisibility,
  });

  // Apply pending template when templates finish loading (fixes late joiner race condition)
  // The scene_state_sync may arrive before templates are fetched from DB,
  // so pendingTemplateId buffers the ID until templates are available.
  useEffect(() => {
    if (
      allSceneTemplates.length > 0 &&
      sceneSyncState.pendingTemplateId &&
      sceneTemplate?.id !== sceneSyncState.pendingTemplateId
    ) {
      selectTemplateById(sceneSyncState.pendingTemplateId);
    }
  }, [allSceneTemplates, sceneSyncState.pendingTemplateId, sceneTemplate?.id, selectTemplateById]);

  // Create effective template with synced background (if available)
  const effectiveTemplate = useMemo(() => {
    if (!sceneTemplate) return null;
    if (sceneSyncState.background) {
      return {
        ...sceneTemplate,
        background: sceneSyncState.background as { type: 'color' | 'image' | 'video'; value: string },
      };
    }
    return sceneTemplate;
  }, [sceneTemplate, sceneSyncState.background]);

  // Combine speaker display names with current user's custom display name
  // This allows users to use a privacy-friendly name in chat
  const combinedDisplayNames = useMemo(() => {
    const names = { ...sceneSyncState.speakerDisplayNames };
    if (currentUser?.uid && displayName) {
      names[currentUser.uid] = displayName;
    }
    return names;
  }, [sceneSyncState.speakerDisplayNames, currentUser?.uid, displayName]);

  // Handler for template changes from host
  // Uses handleSceneStateUpdated which sets pendingTemplateId as fallback
  // in case templates haven't loaded yet or template IDs don't match
  const handleSceneTemplateChanged = useCallback((templateId: string, newOverlayVisibility?: Record<string, boolean>) => {
    console.log('[WebinarRoom] handleSceneTemplateChanged called:', { templateId });
    sceneSyncHandlers.handleSceneStateUpdated({
      templateId,
      overlayVisibility: newOverlayVisibility,
    });
  }, [sceneSyncHandlers.handleSceneStateUpdated]);

  // Handler for overlay visibility changes from host
  const handleOverlayVisibilityChanged = useCallback((overlayId: string, isVisible: boolean) => {
    updateOverlayVisibility(overlayId, isVisible);
  }, [updateOverlayVisibility]);

  // Check access using the purchase validation hook
  const { hasAccess, isLoading: checkingAccess, webinar, session, refreshAccess } = useWebinarPurchase({
    sessionId: sessionId || '',
  });

  // Keep screen awake during webinar
  useWakeLock(hasAccess && !!hlsUrl);

  // Show in system media controls (lock screen, notification panel)
  useMediaSession(hasAccess && !!hlsUrl, {
    title: webinar?.name || 'Live Webinar',
    artist: 'BeWonderMe',
    album: 'Webinar',
    artwork: webinar?.coverImage
      ? [{ src: webinar.coverImage, sizes: '512x512', type: 'image/jpeg' }]
      : undefined,
  });

  // Effective session status (polled status takes precedence)
  const effectiveSessionStatus = polledSessionStatus || session?.status;

  // Initialize display name from localStorage or user profile
  useEffect(() => {
    if (!currentUser || !sessionId) return;

    // Check if user has a saved display name for this webinar
    const storageKey = `webinar_display_name_${sessionId}_${currentUser.uid}`;
    const savedName = localStorage.getItem(storageKey);

    if (savedName) {
      // User already set a name for this session
      setDisplayName(savedName);
    } else if (!hasShownDisplayNameDialogRef.current && hasAccess) {
      // First time joining - show the dialog
      const defaultName = currentUser.displayName || currentUser.email?.split('@')[0] || t('webinars.anonymous', 'Anonymous');
      setDisplayName(defaultName);
      setTempDisplayName(defaultName);
      setShowDisplayNameDialog(true);
      hasShownDisplayNameDialogRef.current = true;
    }
  }, [currentUser, sessionId, hasAccess, t]);

  // Handle display name confirmation
  const handleConfirmDisplayName = useCallback(() => {
    if (!currentUser || !sessionId) return;

    const nameToSave = tempDisplayName.trim() || displayName;
    const storageKey = `webinar_display_name_${sessionId}_${currentUser.uid}`;
    localStorage.setItem(storageKey, nameToSave);
    setDisplayName(nameToSave);
    setShowDisplayNameDialog(false);
  }, [currentUser, sessionId, tempDisplayName, displayName]);

  // Handle keeping original name
  const handleKeepOriginalName = useCallback(() => {
    if (!currentUser || !sessionId) return;

    const originalName = currentUser.displayName || currentUser.email?.split('@')[0] || t('webinars.anonymous', 'Anonymous');
    const storageKey = `webinar_display_name_${sessionId}_${currentUser.uid}`;
    localStorage.setItem(storageKey, originalName);
    setDisplayName(originalName);
    setShowDisplayNameDialog(false);
  }, [currentUser, sessionId, t]);

  // Handler for displaying incoming reactions
  const handleReactionReceived = useCallback((reactionType: string) => {
    // Add reaction to overlay via window reference
    const overlay = (window as any).__webinarReactionOverlay;
    if (overlay?.addReaction) {
      overlay.addReaction(reactionType);
    }
  }, []);

  // WebSocket connection for real-time updates
  const {
    isConnected: socketConnected,
    attendeeCount,
    qaEnabled,
    chatEnabled,
    reactionsEnabled,
    isPaused,
    sendChatMessage,
    sendReaction,
    submitQuestion,
    upvoteQuestion,
    submitVote,
    requestSceneState,
    onSceneIds,
    currentGiveawayWinners,
  } = useWebinarSocket({
    sessionId: sessionId || '',
    enabled: hasAccess && !!sessionId,
    onChatMessage: useCallback((msg: WebinarChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    }, []),
    onChatMessagePinned: useCallback((messageId: string, pinned: boolean) => {
      setPinnedMessageId(pinned ? messageId : null);
    }, []),
    onChatMessageDeleted: useCallback((messageId: string) => {
      setChatMessages((prev) => prev.filter((m) => m.id !== messageId));
      setPinnedMessageId((current) => (current === messageId ? null : current));
    }, []),
    onQuestionReceived: useCallback((q: WebinarQuestion) => {
      setQuestions((prev) => [...prev, q]);
    }, []),
    onQuestionAnswered: useCallback((q: WebinarQuestion) => {
      setQuestions((prev) =>
        prev.map((existing) => (existing.id === q.id ? q : existing))
      );
    }, []),
    onQuestionUpvoted: useCallback((qId: string, upvotes: number, upvotedBy: string[]) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === qId ? { ...q, upvotes, upvotedBy } : q))
      );
    }, []),
    onQuestionDeleted: useCallback((questionId: string) => {
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    }, []),
    onPollCreated: useCallback((poll: WebinarPoll) => {
      if (poll.status === 'draft') return; // Don't show draft polls to viewers
      setActivePoll(poll);
    }, []),
    onPollVoteUpdate: useCallback((pollId: string, votes: number[]) => {
      setActivePoll((prev) => {
        if (prev?.id !== pollId) return prev;
        return {
          ...prev,
          options: prev.options.map((o, i) => ({ ...o, votes: votes[i] || 0 })),
          totalVotes: votes.reduce((a, b) => a + b, 0),
        };
      });
    }, []),
    onPollClosed: useCallback((pollId: string) => {
      setActivePoll((prev) => {
        if (prev?.id === pollId) {
          // Move closed poll to history
          const closedPoll = { ...prev, status: 'closed' as const, showResults: true };
          setPollHistory((history) => [closedPoll, ...history]);
          return null; // Clear active poll
        }
        return prev;
      });
    }, []),
    onReactionReceived: handleReactionReceived,
    onSceneTemplateChanged: handleSceneTemplateChanged,
    onOverlayVisibilityChanged: handleOverlayVisibilityChanged,
    // Scene sync handlers from custom hook (DRY principle)
    onBackgroundChanged: sceneSyncHandlers.handleBackgroundChanged,
    onCameraScaleChanged: sceneSyncHandlers.handleCameraScaleChanged,
    onCameraSlotStylesUpdated: sceneSyncHandlers.handleCameraSlotStylesUpdated,
    onCornerImagesUpdated: sceneSyncHandlers.handleCornerImagesUpdated,
    onTextBannerShown: sceneSyncHandlers.handleTextBannerShown,
    onSpeakerDisplayNamesUpdated: sceneSyncHandlers.handleSpeakerDisplayNamesUpdated,
    onSpeakerNameStyleUpdated: sceneSyncHandlers.handleSpeakerNameStyleUpdated,
    onSceneStateUpdated: sceneSyncHandlers.handleSceneStateUpdated,
    // Real-time session status updates from host (authoritative, real-time)
    onSessionStatusChanged: useCallback((newStatus: string) => {
      const prevStatus = socketStatusRef.current;
      socketStatusRef.current = newStatus;
      // Show "redirecting to live" transition when going live
      if (newStatus === 'live' && (!prevStatus || ['scheduled', 'planning'].includes(prevStatus))) {
        setIsRedirectingToLive(true);
      }
      // Immediately clear HLS when stream goes offline (live→planning/stopped/ended)
      if (prevStatus === 'live' && newStatus !== 'live') {
        setHlsUrl(null);
      }
      setPolledSessionStatus(newStatus);
    }, []),
    // Real-time session kicked notification (immediate, doesn't wait for heartbeat)
    onSessionKicked: useCallback((reason: string) => {
      console.log('[WebinarRoom] Session kicked via WebSocket:', reason);
      // Clear HLS URL to stop video
      setHlsUrl(null);
      // Stop heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      // Show kicked dialog
      setShowKickedDialog(true);
    }, []),
    // Giveaway: reset shown winners when a new round starts
    onGiveawayNewRound: useCallback(() => {
      setShownWinnerPlaces(new Set());
      setActiveWinnerNotification(null);
      setPersistedWin(null);
      setFloatingBannerDismissed(false);
    }, []),
  });

  // Giveaway: detect if current user is a winner and show notification
  // Test picks are excluded — they should NOT trigger the overlay for attendees
  useEffect(() => {
    if (!currentUser?.uid || currentGiveawayWinners.length === 0) return;
    const myWin = currentGiveawayWinners.find(
      (w) => w.odantzIdFirebase === currentUser.uid
        && !shownWinnerPlaces.has(w.place)
        && !w.isTestPick
    );
    if (myWin) setActiveWinnerNotification(myWin);
  }, [currentGiveawayWinners, currentUser?.uid, shownWinnerPlaces]);

  // Giveaway: dismiss winner overlay and track shown places
  // Also set persistedWin so the small banner shows immediately
  const handleDismissWinnerOverlay = useCallback(() => {
    setActiveWinnerNotification((prev) => {
      if (prev) {
        setShownWinnerPlaces((shown) => new Set([...shown, prev.place]));
        setPersistedWin({ place: prev.place, roundNumber: 0 });
        setFloatingBannerDismissed(false);
      }
      return null;
    });
  }, []);

  // Initialize session: check conflict, register, then fetch HLS URL
  useEffect(() => {
    if (!hasAccess || !sessionId || !currentUser || effectiveSessionStatus !== 'live') return;
    if (hlsUrl) return; // Already connected

    let cancelled = false;
    const initializeSession = async () => {
      setIsLoadingHls(true);
      try {
        // Check if user has an active session on another device
        const conflictCheck = await webinarLiveClient.checkSessionConflict(sessionId);
        if (cancelled) return;

        if (conflictCheck.hasConflict && conflictCheck.existingSession) {
          setSessionConflict(conflictCheck);
          setShowConflictDialog(true);
          setIsLoadingHls(false);
          return;
        }

        // Register session for this device
        await webinarLiveClient.registerActiveSession(sessionId);
        if (cancelled) return;
      } catch (err) {
        console.error('Failed to initialize session:', err);
        setError(t('webinars.error.joinFailed', 'Failed to join webinar'));
        setIsLoadingHls(false);
        return;
      }

      // Poll for HLS URL (egress may take a few seconds to produce segments)
      const hlsStartTime = Date.now();
      const HLS_TIMEOUT = 90000; // 90 seconds max wait for HLS
      let hlsRetryCount = 0;

      const fetchHlsUrl = async () => {
        // Check timeout
        if (Date.now() - hlsStartTime > HLS_TIMEOUT) {
          if (!cancelled) {
            console.error('[WebinarRoom] HLS polling timed out after 90s');
            setError(t('webinars.error.streamTimeout', 'The stream is taking too long to start. Please refresh the page and try again.'));
            setIsLoadingHls(false);
            setIsRedirectingToLive(false);
          }
          return;
        }

        try {
          const status = await webinarLiveClient.getHlsStatus(sessionId);
          if (!cancelled && status.active && status.hlsUrl) {
            console.log(`[WebinarRoom] HLS URL obtained after ${hlsRetryCount} retries (${Math.round((Date.now() - hlsStartTime) / 1000)}s)`);
            setHlsUrl(status.hlsUrl);
            setIsRedirectingToLive(false);
            setIsLoadingHls(false);
          } else if (!cancelled) {
            hlsRetryCount++;
            setTimeout(fetchHlsUrl, 3000);
          }
        } catch (err) {
          console.error('[WebinarRoom] HLS status check failed:', err);
          if (!cancelled) {
            hlsRetryCount++;
            setTimeout(fetchHlsUrl, 5000);
          }
        }
      };
      fetchHlsUrl();
    };

    initializeSession();
    return () => { cancelled = true; };
  }, [hasAccess, sessionId, currentUser, effectiveSessionStatus, hlsUrl, t]);

  // Handle session takeover (switch from another device)
  const handleTakeoverSession = useCallback(async () => {
    if (!sessionId) return;

    setIsTakingOver(true);
    try {
      const response = await webinarLiveClient.takeoverSession(sessionId);
      if (response.success) {
        setShowConflictDialog(false);
        setSessionConflict(null);
        // Fetch HLS URL after takeover
        const status = await webinarLiveClient.getHlsStatus(sessionId);
        if (status.active && status.hlsUrl) {
          setHlsUrl(status.hlsUrl);
        }
      } else {
        setError(t('webinars.error.takeoverFailed', 'Failed to switch session'));
      }
    } catch (err) {
      console.error('Failed to takeover session:', err);
      setError(t('webinars.error.takeoverFailed', 'Failed to switch session'));
    } finally {
      setIsTakingOver(false);
    }
  }, [sessionId, t]);

  // Handle cancel from conflict dialog
  const handleCancelConflict = useCallback(() => {
    setShowConflictDialog(false);
    navigate('/my-webinars');
  }, [navigate]);

  // Heartbeat to keep session active and detect if kicked
  useEffect(() => {
    if (!hlsUrl || !sessionId) return;

    // Send heartbeat every 30 seconds
    const sendHeartbeat = async () => {
      try {
        const response = await webinarLiveClient.sendSessionHeartbeat(sessionId);
        if (response.kicked) {
          // Session was taken over by another device
          setHlsUrl(null);
          setShowKickedDialog(true);
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
          }
        }
      } catch {
        // Heartbeat errors are non-critical, silently ignore
      }
    };

    // Delay initial heartbeat to allow session registration to complete
    const initialHeartbeatTimeout = setTimeout(() => {
      sendHeartbeat();
      // Set up interval
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);
    }, 2000); // 2 second delay

    return () => {
      clearTimeout(initialHeartbeatTimeout);
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [hlsUrl, sessionId]);

  // Cache Firebase auth token for use in synchronous beforeunload handler
  const authTokenRef = useRef<string | null>(null);
  useEffect(() => {
    if (hlsUrl && currentUser) {
      currentUser.getIdToken().then((token) => {
        authTokenRef.current = token;
      });
    } else {
      authTokenRef.current = null;
    }
  }, [hlsUrl, currentUser]);

  // Disconnect session when leaving page (useEffect cleanup + beforeunload for refresh/close)
  useEffect(() => {
    if (!sessionId || !hlsUrl) return;

    const handleBeforeUnload = () => {
      if (authTokenRef.current) {
        webinarLiveClient.disconnectSessionBeacon(sessionId, authTokenRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      webinarLiveClient.disconnectSession(sessionId);
    };
  }, [sessionId, hlsUrl]);

  // Handle kicked dialog close
  const handleKickedDialogClose = useCallback(() => {
    setShowKickedDialog(false);
    navigate('/my-webinars');
  }, [navigate]);

  // Request scene state fallback when socket connects.
  // The backend already sends scene_state_sync automatically on subscribe_session.
  // This is a single fallback request in case that auto-send had no cached state.
  useEffect(() => {
    if (!socketConnected || !hasAccess || sceneSyncState.hasReceivedSceneState) return;

    const fallbackTimeout = setTimeout(() => {
      if (!sceneSyncState.hasReceivedSceneState) {
        requestSceneState();
      }
    }, 3000);

    return () => clearTimeout(fallbackTimeout);
  }, [socketConnected, hasAccess, requestSceneState, sceneSyncState.hasReceivedSceneState]);

  // Auto-refresh when session status changes - poll for status changes
  useEffect(() => {
    if (!sessionId) return;

    // Poll when session is scheduled, planning, live, or stopped
    const shouldPoll = ['scheduled', 'planning', 'live', 'stopped'].includes(effectiveSessionStatus || '');
    if (!shouldPoll) return;

    let endRedirectTimeout: NodeJS.Timeout | null = null;

    const pollInterval = setInterval(async () => {
      try {
        const updatedSession = await webinarSessionsClient.getSessionById(sessionId);
        if (updatedSession?.status && updatedSession.status !== effectiveSessionStatus) {
          // IMPORTANT: If socket (real-time) already told us we're "live",
          // ignore API polling returning "planning" or "scheduled" (eventual consistency lag).
          // Socket is authoritative for forward status transitions.
          if (socketStatusRef.current === 'live' && ['planning', 'scheduled'].includes(updatedSession.status)) {
            return; // API is stale, ignore
          }

          // If going from scheduled/planning to live, show redirecting message and update status
          if (['scheduled', 'planning'].includes(effectiveSessionStatus || '') && updatedSession.status === 'live') {
            setIsRedirectingToLive(true);
            setPolledSessionStatus(updatedSession.status);
            return;
          }

          // If live session was stopped, show stopped screen (don't redirect)
          if (effectiveSessionStatus === 'live' && updatedSession.status === 'stopped') {
            setHlsUrl(null);
            setPolledSessionStatus(updatedSession.status);
            socketStatusRef.current = updatedSession.status;
            return;
          }

          // If live session went back to planning (host stopped broadcast), show waiting screen
          // Only trust this if socket also confirms (not just API lag)
          if (effectiveSessionStatus === 'live' && updatedSession.status === 'planning') {
            if (socketStatusRef.current === 'planning') {
              // Socket confirmed regression to planning
              setHlsUrl(null);
              setPolledSessionStatus(updatedSession.status);
            }
            return;
          }

          // If stopped session goes live again, reconnect
          if (effectiveSessionStatus === 'stopped' && updatedSession.status === 'live') {
            setIsRedirectingToLive(true);
            setPolledSessionStatus(updatedSession.status);
            return;
          }

          // If session ended, show ending message then redirect
          if (updatedSession.status === 'ended') {
            setHlsUrl(null);
            setIsEndingTransmission(true);
            endRedirectTimeout = setTimeout(() => {
              navigate('/my-webinars');
            }, 2000);
            return;
          }

          setPolledSessionStatus(updatedSession.status);
        }
      } catch {
        // Polling errors are non-critical, will retry on next interval
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(pollInterval);
      if (endRedirectTimeout) {
        clearTimeout(endRedirectTimeout);
      }
    };
  }, [effectiveSessionStatus, sessionId, navigate]);

  // Load initial data (chat history, questions, polls) when access is confirmed
  useEffect(() => {
    const loadInitialData = async () => {
      if (!sessionId || !hasAccess) return;
      try {
        const [chat, qs, allPolls] = await Promise.all([
          webinarLiveClient.getChatHistory(sessionId, 100),
          webinarLiveClient.getQuestions(sessionId),
          webinarLiveClient.getAllPolls(sessionId),
        ]);

        setChatMessages(chat);
        setQuestions(qs);

        // Separate active poll from history
        const active = allPolls.find((p) => p.status === 'active');
        const closed = allPolls.filter((p) => p.status === 'closed');
        setActivePoll(active || null);
        setPollHistory(closed);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    loadInitialData();
  }, [sessionId, hasAccess]);

  // Giveaway: check if user previously won in this session (persisted in Firestore)
  // Shows a small banner on reconnection instead of the full overlay
  useEffect(() => {
    if (!session?.giveawayWinners || !currentUser?.uid) return;
    const myPreviousWin = session.giveawayWinners.find(
      (w) => w.odantzIdFirebase === currentUser.uid
    );
    if (myPreviousWin) {
      setPersistedWin({ place: myPreviousWin.place, roundNumber: myPreviousWin.roundNumber });
    }
  }, [session?.giveawayWinners, currentUser?.uid]);

  // Handle sending chat messages
  const handleSendChatMessage = useCallback(
    (message: string) => {
      if (socketConnected) {
        // Pass custom display name for privacy (GDPR compliance)
        sendChatMessage(message, displayName || undefined);
      }
    },
    [socketConnected, sendChatMessage, displayName]
  );

  // Handle submitting questions
  const handleSubmitQuestion = useCallback(
    (question: string, anonymous: boolean) => {
      if (socketConnected) {
        // Pass custom display name for privacy (GDPR compliance)
        submitQuestion(question, anonymous, displayName || undefined);
      }
    },
    [socketConnected, submitQuestion, displayName]
  );

  // Handle upvoting questions
  const handleUpvoteQuestion = useCallback(
    (questionId: string) => {
      if (socketConnected) {
        upvoteQuestion(questionId);
      }
    },
    [socketConnected, upvoteQuestion]
  );

  // Handle poll voting
  const handleVote = useCallback(
    (pollId: string, optionIndex: number) => {
      if (socketConnected && currentUser?.uid) {
        submitVote(pollId, optionIndex);
        // Optimistically update local state to show results immediately
        setActivePoll((prev) => {
          if (!prev || prev.id !== pollId) return prev;
          // Add current user to votedBy and update the option votes
          const newVotedBy = [...(prev.votedBy || [])];
          if (!newVotedBy.includes(currentUser.uid)) {
            newVotedBy.push(currentUser.uid);
          }
          return {
            ...prev,
            votedBy: newVotedBy,
            options: prev.options.map((o, i) => ({
              ...o,
              votes: i === optionIndex ? (o.votes || 0) + 1 : o.votes || 0,
            })),
            totalVotes: (prev.totalVotes || 0) + 1,
          };
        });
      }
    },
    [socketConnected, submitVote, currentUser?.uid]
  );

  // Loading state while checking access - smooth fade-in
  if (checkingAccess || isLoadingHls) {
    return (
      <div className={cn("min-h-screen", isDark ? "bg-gradient-to-b from-[#0d1f1c] via-[#1a352f] to-[#0d1f1c]" : "bg-slate-50")}>
        <div className="min-h-screen flex flex-col animate-fade-in">
          <Header variant="page" />
          <main className="flex-1 flex items-center justify-center pt-20">
            <Card className={cn("p-8 backdrop-blur-sm", isDark ? "bg-slate-900/80 border-[#285f59]/30" : "bg-white border-slate-200")}>
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className={cn("absolute inset-0 rounded-full border-4", isDark ? "border-[#5eb8a8]/20" : "border-[#285f59]/20")}></div>
                  <div className={cn("absolute inset-0 rounded-full border-4 border-transparent animate-spin", isDark ? "border-t-[#5eb8a8]" : "border-t-[#285f59]")}></div>
                  <Video className={cn("absolute inset-0 m-auto w-6 h-6", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
                </div>
                <p className={cn("font-medium", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>{t('webinars.connectingToStream', 'Connecting to stream...')}</p>
                <p className={cn("text-sm mt-1", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>{webinar?.name || ''}</p>
              </div>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  // No access - user needs to purchase
  if (!hasAccess) {
    return (
      <div className={cn("min-h-screen", isDark ? "bg-gradient-to-b from-[#0d1f1c] via-[#1a352f] to-[#0d1f1c]" : "bg-slate-50")}>
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 flex items-center justify-center pt-20">
            <div className="text-center max-w-md px-4">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-slate-900")}>
                {t('webinars.accessDenied', 'Access Denied')}
              </h2>
              <p className={cn("mb-6", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                {t(
                  'webinars.purchaseRequired',
                  'You need to purchase this webinar to join.'
                )}
              </p>
              <Button
                onClick={() => navigate('/webinars')}
                className={cn(isDark ? "bg-gradient-to-r from-[#285f59] to-[#1a352f] hover:from-[#3a8a7c] hover:to-[#243f39] text-white" : "bg-[#285f59] hover:bg-[#1a352f] text-white")}
              >
                {t('webinars.browseWebinars', 'Browse Webinars')}
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("min-h-screen", isDark ? "bg-gradient-to-b from-[#0d1f1c] via-[#1a352f] to-[#0d1f1c]" : "bg-slate-50")}>
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 container mx-auto px-4 py-8 pt-24">
            <Alert variant="destructive" className="bg-red-900/50 border-red-500/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button
                onClick={() => navigate('/webinars')}
                variant="outline"
                className={cn(isDark ? "bg-slate-800/50 border-[#5eb8a8]/50 text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100")}
              >
                {t('webinars.backToWebinars', 'Back to Webinars')}
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Redirecting to live - transition screen
  if (isRedirectingToLive) {
    return (
      <div className={cn("min-h-screen", isDark ? "bg-gradient-to-b from-[#0d1f1c] via-[#1a352f] to-[#0d1f1c]" : "bg-slate-50")}>
        <div className="min-h-screen flex flex-col animate-fade-in">
          <Header variant="page" />
          <main className="flex-1 flex items-center justify-center pt-20">
            <Card className={cn("p-8 backdrop-blur-sm animate-pulse", isDark ? "bg-slate-900/80 border-green-500/30" : "bg-white border-green-500/30")}>
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping"></div>
                  <div className="absolute inset-0 rounded-full bg-green-500/30 flex items-center justify-center">
                    <Play className="w-10 h-10 text-green-400 fill-green-400" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-green-400 mb-2">
                  {t('webinars.redirectingToLive', 'Redirecting to live stream...')}
                </h2>
                <p className={cn(isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>{webinar?.name || ''}</p>
              </div>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  // Ending transmission - transition screen
  if (isEndingTransmission) {
    return (
      <div className={cn("min-h-screen", isDark ? "bg-gradient-to-b from-[#0d1f1c] via-[#1a352f] to-[#0d1f1c]" : "bg-slate-50")}>
        <div className="min-h-screen flex flex-col animate-fade-in">
          <Header variant="page" />
          <main className="flex-1 flex items-center justify-center pt-20">
            <Card className={cn("p-8 backdrop-blur-sm", isDark ? "bg-slate-900/80 border-amber-500/30" : "bg-white border-amber-500/30")}>
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-amber-500/20"></div>
                  <div className="absolute inset-0 rounded-full bg-amber-500/30 flex items-center justify-center">
                    <LogOut className="w-10 h-10 text-amber-400" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-amber-400 mb-2">
                  {t('webinars.endingTransmission', 'Ending transmission...')}
                </h2>
                <p className={cn("mb-4", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>{webinar?.name || ''}</p>
                <p className={cn("text-sm", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                  {t('webinars.redirectingToMyWebinars', 'Redirecting to My Webinars...')}
                </p>
              </div>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  // Session in planning - host is getting ready
  if (effectiveSessionStatus === 'planning') {
    return (
      <div className={cn("min-h-screen", isDark ? "bg-gradient-to-b from-[#0d1f1c] via-[#1a352f] to-[#0d1f1c]" : "bg-slate-50")}>
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 flex items-center justify-center pt-20">
            <Card className={cn("max-w-md", isDark ? "bg-slate-900/60 border-[#5eb8a8]/30" : "bg-white border-slate-200")}>
              <CardContent className="p-8 text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className={cn("absolute inset-0 rounded-full animate-pulse", isDark ? "bg-[#5eb8a8]/20" : "bg-[#285f59]/20")}></div>
                  <div className={cn("absolute inset-0 rounded-full flex items-center justify-center", isDark ? "bg-gradient-to-r from-[#5eb8a8]/30 to-[#285f59]/30" : "bg-gradient-to-r from-[#285f59]/30 to-[#285f59]/20")}>
                    <Video className={cn("w-10 h-10 animate-pulse", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
                  </div>
                </div>
                <h2 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-slate-900")}>{webinar?.name}</h2>
                <h3 className={cn("text-xl font-semibold mb-3", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")}>
                  {t('webinars.gettingReady', 'We\'re getting ready!')}
                </h3>
                <p className={cn("mb-4", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                  {t('webinars.startingVerySoon', 'The broadcast will begin shortly...')}
                </p>
                <div className={cn("flex items-center justify-center gap-2", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    {t('webinars.waitingRoom.refresh', 'This page will refresh automatically when the webinar starts.')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Session not started yet (scheduled)
  if (effectiveSessionStatus === 'scheduled' && session?.scheduledAt) {
    const sessionDate = new Date(session.scheduledAt);
    return (
      <div className={cn("min-h-screen", isDark ? "bg-gradient-to-b from-[#0d1f1c] via-[#1a352f] to-[#0d1f1c]" : "bg-slate-50")}>
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 container mx-auto px-4 py-8 pt-24">
            <Card className={cn("max-w-2xl mx-auto", isDark ? "bg-slate-900/60 border-[#285f59]/30" : "bg-white border-slate-200")}>
              <CardContent className="p-8 text-center">
                <Clock className={cn("w-16 h-16 mx-auto mb-4", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
                <h2 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-slate-900")}>{webinar?.name}</h2>
                <p className={cn("mb-4", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                  {t('webinars.startingSoon', 'The webinar will start soon...')}
                </p>
                <div className={cn("rounded-lg p-4 mb-6", isDark ? "bg-slate-800/50" : "bg-slate-100")}>
                  <p className={cn("text-lg font-medium", isDark ? "text-white" : "text-slate-900")}>
                    {sessionDate.toLocaleDateString(i18n.language, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className={cn("text-2xl font-bold", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")}>
                    {sessionDate.toLocaleTimeString(i18n.language, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <p className={cn("text-sm", isDark ? "text-[#e8f5f0]/60" : "text-slate-500")}>
                  {t('webinars.waitingRoom.refresh', 'This page will refresh automatically when the webinar starts.')}
                </p>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Session stopped - broadcast temporarily paused, waiting for restart
  if (effectiveSessionStatus === 'stopped') {
    return (
      <div className={cn("min-h-screen", isDark ? "bg-gradient-to-b from-[#0d1f1c] via-[#1a352f] to-[#0d1f1c]" : "bg-slate-50")}>
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 flex items-center justify-center pt-20">
            <Card className={cn("max-w-md", isDark ? "bg-slate-900/60 border-amber-500/30" : "bg-white border-amber-500/30")}>
              <CardContent className="p-8 text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-pulse"></div>
                  <div className="absolute inset-0 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Pause className="w-10 h-10 text-amber-400" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-amber-400 mb-2">
                  {t('webinars.broadcastStopped', 'Broadcast Temporarily Stopped')}
                </h2>
                <p className={cn("mb-4", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                  {t('webinars.comingBackSoon', 'The host has paused the broadcast. We\'ll be back shortly...')}
                </p>
                <div className={cn("flex items-center justify-center gap-2", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    {t('webinars.waitingForResume', 'Waiting for broadcast to resume...')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Session ended
  if (effectiveSessionStatus === 'ended') {
    return (
      <div className={cn("min-h-screen", isDark ? "bg-gradient-to-b from-[#0d1f1c] via-[#1a352f] to-[#0d1f1c]" : "bg-slate-50")}>
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 flex items-center justify-center pt-20">
            <Card className={cn("max-w-md", isDark ? "bg-slate-900/60 border-[#285f59]/30" : "bg-white border-slate-200")}>
              <CardContent className="p-8 text-center">
                <Video className={cn("w-16 h-16 mx-auto mb-4", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
                <h2 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-slate-900")}>{webinar?.name}</h2>
                <p className={cn("mb-6", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                  {t('webinars.sessionEnded', 'This webinar session has ended.')}
                </p>
                <Link to="/my-webinars">
                  <Button
                    variant="outline"
                    className={cn(isDark ? "bg-slate-800/50 border-[#5eb8a8]/50 text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100")}
                  >
                    {t('webinars.backToMyWebinars', 'Back to My Webinars')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Shared content layout (used by both HLS and WebRTC modes)
  const webinarInfoHeader = (
    <Card className={cn("mb-4", isDark ? "bg-slate-900/60 border-[#285f59]/30" : "bg-white border-slate-200")}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/my-webinars')}
              className={cn(isDark ? "text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "text-slate-700 hover:bg-slate-100")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className={cn("text-xl font-bold", isDark ? "text-white" : "text-slate-900")}>{webinar?.name}</h1>
              <p className={cn("text-sm", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
                {t('webinars.host', 'Host')}: {webinar?.host.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {effectiveSessionStatus === 'live' && (
              <Badge className="bg-red-600 text-white animate-pulse">
                {t('webinars.live', 'LIVE')}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const chatQaColumn = (
    <Card className={cn("h-[600px]", isDark ? "bg-slate-900/60 border-[#285f59]/30" : "bg-white border-slate-200")}>
      <Tabs defaultValue="chat" className="h-full flex flex-col">
        {/* Display name indicator with edit button */}
        <div className={cn("flex items-center justify-between px-3 py-2 border-b", isDark ? "bg-slate-800/30 border-[#285f59]/20" : "bg-slate-50 border-slate-200")}>
          <div className={cn("flex items-center gap-2 text-xs", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
            <User className="w-3 h-3" />
            <span>{t('webinars.displayName.chattingAs', 'Chatting as')}:</span>
            <span className={cn("font-medium", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>{displayName || currentUser?.displayName || t('webinars.anonymous', 'Anonymous')}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTempDisplayName(displayName);
              setShowDisplayNameDialog(true);
            }}
            className={cn("h-6 px-2 text-xs", isDark ? "text-[#e8f5f0]/70 hover:text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100")}
          >
            <Edit2 className="w-3 h-3 mr-1" />
            {t('webinars.displayName.change', 'Change')}
          </Button>
        </div>
        <TabsList className={cn("w-full border-b rounded-none", isDark ? "bg-slate-800/50 border-[#285f59]/30" : "bg-slate-100 border-slate-200")}>
          <TabsTrigger
            value="chat"
            className={cn("flex-1", isDark ? "data-[state=active]:bg-[#5eb8a8]/20 data-[state=active]:text-[#e8f5f0]" : "data-[state=active]:bg-[#285f59]/10 data-[state=active]:text-slate-900")}
          >
            {t('webinars.chat.title', 'Chat')}
          </TabsTrigger>
          <TabsTrigger
            value="qa"
            className={cn("flex-1", isDark ? "data-[state=active]:bg-[#5eb8a8]/20 data-[state=active]:text-[#e8f5f0]" : "data-[state=active]:bg-[#285f59]/10 data-[state=active]:text-slate-900")}
          >
            {t('webinars.qa.title', 'Q&A')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 mt-0 p-0 overflow-hidden min-h-0">
          <WebinarChat
            messages={chatMessages}
            pinnedMessageId={pinnedMessageId}
            isDisabled={!chatEnabled}
            currentUserId={currentUser?.uid}
            speakerDisplayNames={combinedDisplayNames}
            onSendMessage={handleSendChatMessage}
            className="h-full"
          />
        </TabsContent>

        <TabsContent value="qa" className="flex-1 mt-0 p-0 overflow-hidden min-h-0">
          <WebinarQA
            questions={questions}
            isDisabled={!qaEnabled}
            currentUserId={currentUser?.uid}
            speakerDisplayNames={combinedDisplayNames}
            onSubmitQuestion={handleSubmitQuestion}
            onUpvoteQuestion={handleUpvoteQuestion}
            className="h-full"
          />
        </TabsContent>
      </Tabs>
    </Card>
  );

  const videoColumn = (
    <div className="lg:col-span-2 space-y-4">
      {/* HLS video player — scene is pre-composed by egress */}
      <WebinarHlsPlayer
        hlsUrl={hlsUrl}
        className={cn("w-full aspect-video rounded-lg border", isDark ? "border-[#285f59]/30" : "border-slate-200")}
        chatComponent={
          <WebinarChat
            messages={chatMessages}
            pinnedMessageId={pinnedMessageId}
            isDisabled={!chatEnabled}
            currentUserId={currentUser?.uid}
            speakerDisplayNames={combinedDisplayNames}
            onSendMessage={handleSendChatMessage}
            className="h-full"
          />
        }
        qaComponent={
          <WebinarQA
            questions={questions}
            isDisabled={!qaEnabled}
            currentUserId={currentUser?.uid}
            speakerDisplayNames={combinedDisplayNames}
            onSubmitQuestion={handleSubmitQuestion}
            onUpvoteQuestion={handleUpvoteQuestion}
            className="h-full"
          />
        }
        pollComponent={activePoll ? (
          <WebinarPollComponent
            poll={activePoll}
            currentUserId={currentUser?.uid}
            onVote={handleVote}
          />
        ) : undefined}
        winnerBannerComponent={persistedWin && !activeWinnerNotification ? (
          <GiveawayWinnerBanner place={persistedWin.place} />
        ) : undefined}
        winnerOverlayComponent={activeWinnerNotification ? (
          <GiveawayWinnerOverlay
            winner={activeWinnerNotification}
            onDismiss={handleDismissWinnerOverlay}
          />
        ) : undefined}
        reactionsEnabled={reactionsEnabled}
        onSendReaction={sendReaction}
        attendeeCount={attendeeCount}
        unreadChatCount={unreadChatCount}
        onPanelOpenChange={setIsPanelOpen}
        isPaused={isPaused}
      />

      {/* Giveaway: persistent winner banner (shown on reconnection, below video) */}
      {persistedWin && !activeWinnerNotification && (
        <GiveawayWinnerBanner
          place={persistedWin.place}
        />
      )}

      {activePoll && (
        <Card className={cn(isDark ? "bg-slate-900/60 border-[#285f59]/30" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <WebinarPollComponent
              poll={activePoll}
              currentUserId={currentUser?.uid}
              onVote={handleVote}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );

  const mainContent = (
    <div className="container mx-auto px-4 py-4">
      {webinarInfoHeader}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {videoColumn}
        {chatQaColumn}
      </div>
    </div>
  );

  return (
    <div className={cn("min-h-screen", isDark ? "bg-gradient-to-b from-[#0d1f1c] via-[#1a352f] to-[#0d1f1c]" : "bg-slate-50")}>
      <div className="min-h-screen flex flex-col">
        <Header variant="page" />
        <main className="flex-1 pt-20">
          {mainContent}
        </main>
        <Footer />
      </div>

      {/* Session Conflict Dialog */}
      {sessionConflict?.existingSession && (
        <SessionConflictDialog
          open={showConflictDialog}
          onOpenChange={setShowConflictDialog}
          existingSession={sessionConflict.existingSession}
          onTakeover={handleTakeoverSession}
          onCancel={handleCancelConflict}
          isLoading={isTakingOver}
        />
      )}

      {/* Session Kicked Dialog */}
      <SessionKickedDialog
        open={showKickedDialog}
        onOpenChange={setShowKickedDialog}
        onClose={handleKickedDialogClose}
      />

      {/* Display Name Dialog - Privacy compliance (GDPR) */}
      <Dialog open={showDisplayNameDialog} onOpenChange={setShowDisplayNameDialog}>
        <DialogContent className={cn("sm:max-w-md", isDark ? "bg-slate-900 border-[#285f59]/30" : "bg-white border-slate-200")}>
          <DialogHeader>
            <DialogTitle className={cn("flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
              <User className={cn("w-5 h-5", isDark ? "text-[#5eb8a8]" : "text-[#285f59]")} />
              {t('webinars.displayName.title', 'Your Display Name')}
            </DialogTitle>
            <DialogDescription className={cn(isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
              {t('webinars.displayName.description', 'Choose how your name will appear in the chat and Q&A. You can use a different name for privacy.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current name preview */}
            <div className={cn("rounded-lg p-3 border", isDark ? "bg-slate-800/50 border-[#285f59]/30" : "bg-slate-50 border-slate-200")}>
              <Label className={cn("text-xs uppercase tracking-wide", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                {t('webinars.displayName.currentName', 'Current name')}
              </Label>
              <p className={cn("font-medium mt-1", isDark ? "text-white" : "text-slate-900")}>
                {currentUser?.displayName || currentUser?.email?.split('@')[0] || t('webinars.anonymous', 'Anonymous')}
              </p>
            </div>

            {/* Custom name input */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className={cn(isDark ? "text-[#e8f5f0]" : "text-slate-700")}>
                {t('webinars.displayName.customName', 'Custom display name (optional)')}
              </Label>
              <div className="relative">
                <Edit2 className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")} />
                <Input
                  id="displayName"
                  value={tempDisplayName}
                  onChange={(e) => setTempDisplayName(e.target.value)}
                  placeholder={t('webinars.displayName.placeholder', 'Enter a display name...')}
                  className={cn("pl-10", isDark ? "bg-slate-800/50 border-[#285f59]/30 text-white placeholder:text-[#e8f5f0]/30 focus:border-[#5eb8a8]" : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#285f59]")}
                  maxLength={50}
                />
              </div>
              <p className={cn("text-xs", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                {t('webinars.displayName.hint', 'This name will only be used in this webinar session.')}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleKeepOriginalName}
              className={cn("w-full sm:w-auto", isDark ? "bg-slate-800/50 border-[#5eb8a8]/50 text-[#e8f5f0] hover:bg-[#5eb8a8]/20" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100")}
            >
              {t('webinars.displayName.keepOriginal', 'Keep Original Name')}
            </Button>
            <Button
              onClick={handleConfirmDisplayName}
              className={cn("w-full sm:w-auto", isDark ? "bg-gradient-to-r from-[#285f59] to-[#1a352f] hover:from-[#3a8a7c] hover:to-[#243f39] text-white" : "bg-[#285f59] hover:bg-[#1a352f] text-white")}
            >
              {tempDisplayName.trim() && tempDisplayName.trim() !== (currentUser?.displayName || currentUser?.email?.split('@')[0])
                ? t('webinars.displayName.useCustom', 'Use Custom Name')
                : t('webinars.displayName.confirm', 'Continue')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
