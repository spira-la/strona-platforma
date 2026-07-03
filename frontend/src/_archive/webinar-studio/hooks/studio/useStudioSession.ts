/**
 * useStudioSession Hook
 *
 * Manages session/webinar loading and LiveKit token management for WebinarStudio.
 * Handles:
 * - Loading session by ID
 * - Loading webinar data
 * - Getting LiveKit token
 * - Session conflict checking
 * - Heartbeat management
 * - Role determination (host, shadow, speaker)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getAuthLazy } from '@/firebase';
import { webinarSessionsClient } from '@/clients/WebinarSessionsClient';
import { webinarsClient } from '@/clients/WebinarsClient';
import { webinarLiveClient } from '@/clients/WebinarLiveClient';
import type {
  WebinarSession,
  WebinarProduct,
  SessionConflictResponse,
} from '@/domain/products/models/webinar.model';
import type { UseStudioSessionOptions, UseStudioSessionReturn } from './types/studio.types';

export function useStudioSession(options: UseStudioSessionOptions): UseStudioSessionReturn {
  const {
    sessionId,
    userId,
    isCoach,
    coachProfileId,
    onConflictDetected,
    onKicked,
    t,
  } = options;

  // State
  const [session, setSession] = useState<WebinarSession | null>(null);
  const [webinar, setWebinar] = useState<WebinarProduct | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [livekitServerUrl, setLivekitServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionConflict, setSessionConflict] = useState<SessionConflictResponse | null>(null);
  const [isTakingOver, setIsTakingOver] = useState(false);

  // Refs for heartbeat
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Role determination
  const isSessionHost = useMemo(() => {
    if (!webinar || !coachProfileId) return false;
    return webinar.host?.id === coachProfileId;
  }, [webinar, coachProfileId]);

  const isShadowHost = useMemo(() => {
    if (!webinar || !coachProfileId) return false;
    return webinar.shadowHost?.id === coachProfileId;
  }, [webinar, coachProfileId]);

  const isGuestSpeaker = useMemo(() => {
    if (!webinar || !coachProfileId) return false;
    return webinar.guestSpeakers?.some(g => g.id === coachProfileId) || false;
  }, [webinar, coachProfileId]);

  const isAdminSpeaker = useMemo(() => {
    if (!webinar || !coachProfileId) return false;
    const speaker = webinar.guestSpeakers?.find(g => g.id === coachProfileId);
    return speaker?.isAdmin || false;
  }, [webinar, coachProfileId]);

  // Permission helpers
  const isHostOrShadow = isSessionHost || isShadowHost;
  const canAccessStudio = isSessionHost || isShadowHost || isGuestSpeaker;
  const canEditVisuals = isHostOrShadow || isAdminSpeaker;
  const canControlFeatures = isHostOrShadow || isAdminSpeaker;

  // Clear token helper
  const clearToken = useCallback(() => {
    setLivekitToken(null);
    setLivekitServerUrl(null);
  }, []);

  // Fetch session and webinar data
  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) return;

      try {
        const sessionData = await webinarSessionsClient.getSessionById(sessionId);
        setSession(sessionData);

        if (sessionData) {
          const webinarData = await webinarsClient.getWebinarById(sessionData.webinarId);
          setWebinar(webinarData);
        }
      } catch (err) {
        console.error('[useStudioSession] Error fetching data:', err);
        setError(t('common.error', 'An error occurred'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [sessionId, t]);

  // Get LiveKit token when session is live or planning (with session conflict check)
  useEffect(() => {
    const getToken = async () => {
      if (!sessionId || !userId || !isCoach) return;
      // Get token for both planning (green room) and live states
      if (session?.status !== 'live' && session?.status !== 'planning') return;
      // Wait for webinar and coachProfileId to load so we can determine host/speaker role
      if (!webinar || !coachProfileId) return;
      // Don't get a new token if we already have one (avoid unnecessary reconnections)
      if (livekitToken) return;

      try {
        // First check if user has an active session on another device
        const conflictCheck = await webinarLiveClient.checkSessionConflict(sessionId);

        if (conflictCheck.hasConflict && conflictCheck.existingSession) {
          // Show conflict dialog
          setSessionConflict(conflictCheck);
          onConflictDetected?.(conflictCheck);
          return;
        }

        // No conflict - register session and get token
        // WebinarStudio is only for producers (host, shadow, speakers)
        // Always request host permissions to ensure they can publish video/audio
        console.log('[useStudioSession] Getting token with HOST permissions (studio access)');
        await webinarLiveClient.registerActiveSession(sessionId, true);
        const response = await webinarLiveClient.getJoinToken(sessionId, {
          // Always true for WebinarStudio - only producers access this page
          isHost: true,
        });

        // On mobile, add a small delay to ensure the camera is fully released
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          console.log('[useStudioSession] Mobile detected - waiting for camera release...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        setLivekitToken(response.token);
        setLivekitServerUrl(response.serverUrl);
      } catch (err) {
        console.error('[useStudioSession] Error getting LiveKit token:', err);
        setError(t('webinars.error.tokenFailed', 'Failed to get stream token'));
      }
    };
    getToken();
  }, [sessionId, userId, isCoach, session?.status, webinar, coachProfileId, livekitToken, onConflictDetected, t]);

  // Handle session takeover
  const handleTakeoverSession = useCallback(async () => {
    if (!sessionId) return;

    setIsTakingOver(true);
    try {
      const response = await webinarLiveClient.takeoverSession(sessionId, true);
      if (response.success && response.token) {
        // On mobile, add a small delay to ensure the camera is fully released
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        setLivekitToken(response.token);
        setLivekitServerUrl(response.serverUrl || null);
        setSessionConflict(null);
      } else {
        setError(t('webinars.error.takeoverFailed', 'Failed to switch session'));
      }
    } catch (err) {
      console.error('[useStudioSession] Failed to takeover session:', err);
      setError(t('webinars.error.takeoverFailed', 'Failed to switch session'));
    } finally {
      setIsTakingOver(false);
    }
  }, [sessionId, t]);

  // Heartbeat to keep session active and detect if kicked
  useEffect(() => {
    if (!livekitToken || !sessionId) return;

    const sendHeartbeat = async () => {
      try {
        const response = await webinarLiveClient.sendSessionHeartbeat(sessionId);
        console.log('[useStudioSession] Heartbeat response:', response);
        if (response.kicked) {
          // Session was taken over by another device
          console.warn('[useStudioSession] Session kicked:', response.reason);
          setLivekitToken(null);
          setLivekitServerUrl(null);
          onKicked?.(response.reason || 'Session taken over by another device');
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
          }
        }
      } catch (err) {
        console.error('[useStudioSession] Heartbeat error:', err);
      }
    };

    // Delay initial heartbeat to allow session registration to complete
    const initialHeartbeatTimeout = setTimeout(() => {
      sendHeartbeat();
      // Set up interval (every 30 seconds)
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);
    }, 2000); // 2 second delay

    return () => {
      clearTimeout(initialHeartbeatTimeout);
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [livekitToken, sessionId, onKicked]);

  // Cache Firebase auth token for use in synchronous beforeunload handler
  const authTokenRef = useRef<string | null>(null);
  useEffect(() => {
    if (livekitToken) {
      const user = getAuthLazy().currentUser;
      user?.getIdToken().then((token) => {
        authTokenRef.current = token;
      });
    } else {
      authTokenRef.current = null;
    }
  }, [livekitToken]);

  // Disconnect session when leaving page (useEffect cleanup + beforeunload for refresh/close)
  useEffect(() => {
    if (!sessionId || !livekitToken) return;

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
  }, [sessionId, livekitToken]);

  return {
    session,
    webinar,
    livekitToken,
    livekitServerUrl,
    isLoading,
    error,
    sessionConflict,
    isSessionHost,
    isShadowHost,
    isGuestSpeaker,
    isAdminSpeaker,
    isHostOrShadow,
    canAccessStudio,
    canEditVisuals,
    canControlFeatures,
    setSession,
    setWebinar,
    handleTakeoverSession,
    isTakingOver,
    clearToken,
  };
}

export default useStudioSession;
