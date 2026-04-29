/**
 * WebinarRecordingTemplate Page
 *
 * Minimal page used by LiveKit Egress for recording webinars.
 * This page renders the exact same scene as viewers see it (via SceneCompositor)
 * but without any UI controls, headers, or sidebars.
 *
 * IMPORTANT: This page is accessed by the egress container (headless Chrome)
 * to capture the webinar scene for recording. It should:
 * - Fill the entire viewport (1920x1080 typically)
 * - Have no interactive elements or overlays
 * - Render the scene exactly as the host configured it
 * - Auto-connect without authentication (internal use only)
 *
 * URL: /webinar-recording-template/:sessionId
 */

import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { LiveKitRoom, RoomAudioRenderer, useRoomContext, useTracks } from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import EgressHelper from '@livekit/egress-sdk';
import { SceneCompositor } from '@/components/webinar/SceneCompositor';
import { useSceneSyncState } from '@/hooks/useSceneSyncState';
import { useWebinarSocket } from '@/hooks/useWebinarSocket';
import type { SceneTemplate } from '@/domain/products/models/scene-template.model';

/**
 * Fallback template used when API templates can't be loaded.
 * Ensures egress always captures participant video instead of "Loading scene...".
 * Simple grid layout with dark background - works for any number of participants.
 */
const FALLBACK_TEMPLATE: SceneTemplate = {
  id: 'fallback-recording',
  name: 'Recording Fallback',
  description: 'Auto-fallback when templates unavailable',
  background: { type: 'color', value: '#0f172a' },
  cameraSlots: [
    { id: 'slot-1', x: 2, y: 2, width: 96, height: 96, zIndex: 10, borderRadius: 12, borderColor: '#334155', borderWidth: 2, label: 'Speaker' },
  ],
  overlays: [],
  layoutPreset: 'grid',
  isActive: true,
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// CRITICAL: Send START_RECORDING immediately when this module loads
// This ensures egress receives the signal ASAP, even before React renders
// The egress monitors browser console for this exact string
// IMPORTANT: Must use console.warn (NOT console.log) because Terser strips console.log in production builds!
// The egress handler's CDP monitoring captures ALL console methods (log, warn, error, etc.)
console.warn('[RecordingTemplate] Module loaded - sending immediate START_RECORDING');
console.warn('START_RECORDING');

// Recording API key for security - must match backend RECORDING_API_KEY
const RECORDING_API_KEY = import.meta.env.VITE_RECORDING_API_KEY || '';

/**
 * Egress integration component
 * Registers the room with EgressHelper and signals when ready to record
 *
 * IMPORTANT: This component waits for scene state to be synchronized before
 * starting recording to ensure the full scene (backgrounds, overlays, etc.)
 * is captured, not just the raw camera feed.
 */
function EgressIntegration({
  onReady,
  socketConnected,
  hasReceivedSceneState,
}: {
  onReady?: () => void;
  socketConnected: boolean;
  hasReceivedSceneState: boolean;
}) {
  const room = useRoomContext();
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone, Track.Source.ScreenShare]);
  const hasRegistered = useRef(false);
  const hasStartedRecording = useRef(false);

  useEffect(() => {
    if (!room || hasRegistered.current) return;

    // Register room with EgressHelper
    console.warn('[EgressIntegration] Registering room with EgressHelper');
    EgressHelper.setRoom(room);
    hasRegistered.current = true;

    // Listen for layout changes to update egress
    const handleLayoutChange = () => {
      console.warn('[EgressIntegration] Layout changed, notifying egress');
      EgressHelper.onLayoutChanged();
    };

    room.on(RoomEvent.TrackSubscribed, handleLayoutChange);
    room.on(RoomEvent.TrackUnsubscribed, handleLayoutChange);
    room.on(RoomEvent.ParticipantConnected, handleLayoutChange);
    room.on(RoomEvent.ParticipantDisconnected, handleLayoutChange);

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleLayoutChange);
      room.off(RoomEvent.TrackUnsubscribed, handleLayoutChange);
      room.off(RoomEvent.ParticipantConnected, handleLayoutChange);
      room.off(RoomEvent.ParticipantDisconnected, handleLayoutChange);
    };
  }, [room]);

  // Start recording when scene state is ready (don't wait for video tracks!)
  // The recording should capture backgrounds, overlays, etc. even without cameras
  useEffect(() => {
    if (hasStartedRecording.current) return;

    const videoTracks = tracks.filter(t => t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare);

    console.warn('[EgressIntegration] Check state:', {
      hasVideoTracks: videoTracks.length > 0,
      socketConnected,
      hasReceivedSceneState,
      tracksCount: videoTracks.length,
    });

    // Start recording when socket is connected AND scene state is received
    // Don't wait for video tracks - we want to capture the scene even without cameras
    if (socketConnected && hasReceivedSceneState) {
      console.warn('[EgressIntegration] Socket connected and scene state received - starting recording');
      hasStartedRecording.current = true;
      // Small delay to ensure React has rendered the scene
      setTimeout(() => {
        console.warn('[EgressIntegration] Calling EgressHelper.startRecording()');
        EgressHelper.startRecording();
        // Also send direct console.warn as fallback (console.log is stripped by Terser!)
        console.warn('START_RECORDING');
        console.warn('[EgressIntegration] Direct START_RECORDING signal sent');
        onReady?.();
      }, 500);
      return;
    }

    // Log waiting state
    if (!socketConnected) {
      console.warn('[EgressIntegration] Waiting for socket connection...');
    } else if (!hasReceivedSceneState) {
      console.warn('[EgressIntegration] Waiting for scene state sync...');
    }
  }, [tracks, socketConnected, hasReceivedSceneState, onReady]);

  // Fallback: start after 8 seconds even if scene state isn't fully synced
  // This ensures we capture SOMETHING even if there are sync issues
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (hasStartedRecording.current) return;
      console.warn('[EgressIntegration] Fallback timeout (8s) - starting recording', {
        socketConnected,
        hasReceivedSceneState,
      });
      hasStartedRecording.current = true;
      EgressHelper.startRecording();
      // Also send direct console.warn as fallback (console.log is stripped by Terser!)
      console.warn('START_RECORDING');
      console.warn('[EgressIntegration] Fallback - Direct START_RECORDING signal sent');
      onReady?.();
    }, 8000);

    return () => clearTimeout(fallbackTimeout);
  }, [socketConnected, hasReceivedSceneState, onReady]);

  return null;
}

/**
 * Check if running in internal recording context
 * Internal context = accessed from Docker internal network (frontend-internal container)
 */
function isInternalRecordingContext(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  // Internal Docker hostnames
  return hostname === 'frontend-internal-dev' ||
         hostname === 'frontend-internal' ||
         hostname.startsWith('frontend-internal') ||
         hostname === 'localhost';  // Also for local testing
}

/**
 * Get API base URL for recording context
 *
 * Priority:
 * 1. internalApiUrl query param (passed by backend for Docker-internal API access)
 * 2. Internal Docker hostname (frontend-internal container)
 * 3. Public API URL based on hostname
 * 4. VITE_API_URL env var
 *
 * The egress Chrome loads the page from the public URL (e.g., dev.be-wonder.me)
 * but can't reach the public API domain (apidev.be-wonder.me) from inside Docker.
 * The backend passes internalApiUrl so API/socket.io calls go through Docker network.
 */
function getRecordingApiUrl(): string {
  if (typeof window === 'undefined') return '';

  // Priority 1: Use internalApiUrl from query params (backend passes this for Docker access)
  const params = new URLSearchParams(window.location.search);
  const internalApiUrl = params.get('internalApiUrl');
  if (internalApiUrl) {
    return internalApiUrl;
  }

  // Priority 2: Internal Docker context (page loaded from frontend-internal container)
  if (isInternalRecordingContext()) {
    return window.location.origin;  // e.g., http://frontend-internal-dev
  }

  // Priority 3: Public API URL based on hostname
  const hostname = window.location.hostname;
  if (hostname === 'dev.be-wonder.me') {
    return 'https://apidev.be-wonder.me';
  }
  if (hostname === 'be-wonder.me' || hostname === 'www.be-wonder.me') {
    return 'https://api.be-wonder.me';
  }

  // Priority 4: Env var fallback
  return import.meta.env.VITE_API_URL || '';
}

// Lazy-load meeting template to keep bundle separate
const MeetingRecordingTemplate = lazy(() => import('./MeetingRecordingTemplate'));

export default function WebinarRecordingTemplate() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();

  // Delegate to meeting-specific template if sessionId starts with "meeting-"
  if (sessionId?.startsWith('meeting-')) {
    return (
      <Suspense
        fallback={
          <div className="w-screen h-screen bg-black flex items-center justify-center">
            <p className="text-white">Loading meeting template...</p>
          </div>
        }
      >
        <MeetingRecordingTemplate sessionId={sessionId} />
      </Suspense>
    );
  }

  // Validate recording API key for security
  // If VITE_RECORDING_API_KEY is set, require it in the URL
  const recordingKey = searchParams.get('recordingKey');
  const isKeyValid = !RECORDING_API_KEY || recordingKey === RECORDING_API_KEY;

  // IMPORTANT: Egress passes these parameters in the URL when loading custom templates
  // - url: LiveKit WebSocket URL (e.g., wss://livekit.example.com)
  // - token: Access token for joining the room as a recorder
  // - layout: Layout name (we ignore this, we use our own scene)
  const egressUrl = searchParams.get('url');
  const egressToken = searchParams.get('token');

  // Log egress parameters for debugging (use console.warn to survive Terser in production)
  console.warn('[RecordingTemplate] Egress params:', {
    url: egressUrl ? `${egressUrl.substring(0, 30)}...` : 'NOT PROVIDED',
    token: egressToken ? `${egressToken.substring(0, 20)}...` : 'NOT PROVIDED',
    layout: searchParams.get('layout'),
    recordingKey: recordingKey ? '***' : 'NOT PROVIDED',
  });

  // LiveKit connection state
  // Use egress-provided params if available, otherwise fetch from our API
  const [livekitToken, setLivekitToken] = useState<string | null>(egressToken || null);
  const [livekitServerUrl, setLivekitServerUrl] = useState<string | null>(egressUrl || null);
  const [error, setError] = useState<string | null>(null);

  // Track if we're using egress-provided credentials
  const usingEgressCredentials = !!(egressUrl && egressToken);

  // AGGRESSIVE fallback: call startRecording multiple times to ensure egress receives the signal
  // This ensures egress captures SOMETHING even if there are errors
  // NOTE: We DON'T call immediately - egress needs time to set up console monitoring
  useEffect(() => {
    console.warn('[RecordingTemplate] Component mounted, scheduling startRecording calls');

    // Helper to call startRecording with logging
    // IMPORTANT: Egress looks for "START_RECORDING" in the browser console
    // IMPORTANT: Must use console.warn (NOT console.log) because Terser strips console.log in production!
    // The egress handler's CDP monitoring captures ALL console methods (log, warn, error, etc.)
    const callStartRecording = (label: string) => {
      try {
        // Log BEFORE calling so we can see in egress logs what's happening
        console.warn(`[RecordingTemplate] ${label} - about to call EgressHelper.startRecording()`);

        // Method 1: Use EgressHelper (preferred)
        EgressHelper.startRecording();
        console.warn(`[RecordingTemplate] ${label} - EgressHelper.startRecording() called successfully`);

        // Method 2: Direct console.warn as fallback - egress monitors for this exact string
        // Note: EgressHelper internally uses console.log which gets stripped by Terser in prod
        // So this manual console.warn is the actual signal that reaches the egress handler
        console.warn('START_RECORDING');
        console.warn(`[RecordingTemplate] ${label} - Direct START_RECORDING sent`);
      } catch (e) {
        console.error(`[RecordingTemplate] ${label} - startRecording failed:`, e);
        // Even if EgressHelper fails, try direct console.warn
        console.warn('START_RECORDING');
        console.warn(`[RecordingTemplate] ${label} - Direct START_RECORDING sent after error`);
      }
    };

    // Try at 500ms (give egress time to set up console monitoring)
    const fallback500ms = setTimeout(() => callStartRecording('500ms'), 500);

    // Try again at 1.5s
    const fallback1500ms = setTimeout(() => callStartRecording('1.5s'), 1500);

    // Try again at 3s
    const fallback3s = setTimeout(() => callStartRecording('3s'), 3000);

    // Try again at 5s
    const fallback5s = setTimeout(() => callStartRecording('5s'), 5000);

    // Try again at 8s
    const fallback8s = setTimeout(() => callStartRecording('8s'), 8000);

    // Try again at 12s (egress default timeout is 20s)
    const fallback12s = setTimeout(() => callStartRecording('12s'), 12000);

    // Try again at 16s (last chance before egress timeout)
    const fallback16s = setTimeout(() => callStartRecording('16s'), 16000);

    return () => {
      clearTimeout(fallback500ms);
      clearTimeout(fallback1500ms);
      clearTimeout(fallback3s);
      clearTimeout(fallback5s);
      clearTimeout(fallback8s);
      clearTimeout(fallback12s);
      clearTimeout(fallback16s);
    };
  }, []);

  // Scene templates loaded without auth
  const [templates, setTemplates] = useState<SceneTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SceneTemplate | null>(null);
  const [overlayVisibility, setOverlayVisibility] = useState<Record<string, boolean>>({});
  const templatesLoaded = useRef(false);

  // Load templates using public endpoint (no auth required)
  // Uses direct fetch with relative URLs when in internal Docker context
  // Retries on failure since backend may not be ready after a deploy
  useEffect(() => {
    if (templatesLoaded.current) return;
    templatesLoaded.current = true;

    const MAX_RETRIES = 10;
    const RETRY_DELAY_MS = 3000;
    let cancelled = false;

    const loadTemplates = async (attempt = 1) => {
      try {
        const apiUrl = getRecordingApiUrl();
        const url = `${apiUrl}/api/scene-templates/active`;
        console.warn(`[RecordingTemplate] Loading templates from: ${url} (attempt ${attempt}/${MAX_RETRIES})`);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const activeTemplates = await response.json();
        if (cancelled) return;

        setTemplates(activeTemplates);
        console.warn('[RecordingTemplate] Loaded templates:', activeTemplates.length);

        // Select default template initially
        const defaultTemplate = activeTemplates.find((t: SceneTemplate) => t.isDefault) || activeTemplates[0];
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate);
          // Initialize overlay visibility
          const initialVisibility: Record<string, boolean> = {};
          defaultTemplate.overlays?.forEach((overlay: { id: string; defaultVisible?: boolean }) => {
            initialVisibility[overlay.id] = overlay.defaultVisible ?? true;
          });
          setOverlayVisibility(initialVisibility);
        }
      } catch (err) {
        console.error(`[RecordingTemplate] Failed to load templates (attempt ${attempt}/${MAX_RETRIES}):`, err);
        if (!cancelled && attempt < MAX_RETRIES) {
          console.warn(`[RecordingTemplate] Retrying in ${RETRY_DELAY_MS}ms...`);
          setTimeout(() => loadTemplates(attempt + 1), RETRY_DELAY_MS);
        }
      }
    };

    loadTemplates();

    return () => { cancelled = true; };
  }, []);

  // Select template by ID
  // Uses direct fetch with relative URLs when in internal Docker context
  const selectTemplateById = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      console.warn('[RecordingTemplate] Selected template:', template.name);
    } else {
      // Try to fetch it directly if not in our list
      const apiUrl = getRecordingApiUrl();
      const url = `${apiUrl}/api/scene-templates/${templateId}`;
      fetch(url)
        .then(res => res.ok ? res.json() : null)
        .then(t => {
          if (t) {
            setSelectedTemplate(t);
            setTemplates(prev => [...prev, t]);
            console.warn('[RecordingTemplate] Fetched and selected template:', t.name);
          }
        })
        .catch(err => console.error('[RecordingTemplate] Failed to fetch template:', err));
    }
  }, [templates]);

  // Update overlay visibility
  const updateOverlayVisibility = useCallback((overlayId: string, isVisible: boolean) => {
    setOverlayVisibility(prev => ({ ...prev, [overlayId]: isVisible }));
  }, []);

  // Scene state synced from host
  const [sceneSyncState, sceneSyncHandlers] = useSceneSyncState({
    onTemplateChange: selectTemplateById,
    onOverlayVisibilityChange: updateOverlayVisibility,
  });

  // Log when scene state is received (with timestamp)
  useEffect(() => {
    if (sceneSyncState.hasReceivedSceneState) {
      console.warn(`[RecordingTemplate] Scene state received at ${new Date().toISOString()}:`, {
        hasBackground: !!sceneSyncState.background,
        backgroundType: sceneSyncState.background?.type,
        cameraScale: sceneSyncState.cameraScale,
        cornerImagesCount: sceneSyncState.cornerImages?.length || 0,
        hasTextBanner: !!sceneSyncState.activeTextBanner,
      });
    }
  }, [sceneSyncState.hasReceivedSceneState, sceneSyncState]);

  // Fallback: if no template loaded after 3 seconds, use hardcoded fallback
  // This ensures recording always captures participant video, never stuck on "Loading scene..."
  const [useFallback, setUseFallback] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!selectedTemplate) {
        console.warn('[RecordingTemplate] No template loaded after 3s, activating fallback template');
        setUseFallback(true);
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [selectedTemplate]);

  // Clear fallback flag when a real template loads
  useEffect(() => {
    if (selectedTemplate && useFallback) {
      console.warn('[RecordingTemplate] Real template loaded, deactivating fallback');
      setUseFallback(false);
    }
  }, [selectedTemplate, useFallback]);

  // Effective template with synced background (uses fallback if API templates unavailable)
  const effectiveTemplate = useMemo(() => {
    const base = selectedTemplate || (useFallback ? FALLBACK_TEMPLATE : null);
    if (!base) return null;
    if (sceneSyncState.background) {
      return {
        ...base,
        background: sceneSyncState.background as { type: 'color' | 'image' | 'video'; value: string },
      };
    }
    return base;
  }, [selectedTemplate, useFallback, sceneSyncState.background]);

  // Handler for template changes from host
  const handleSceneTemplateChanged = useCallback((templateId: string, newOverlayVisibility?: Record<string, boolean>) => {
    selectTemplateById(templateId);
    if (newOverlayVisibility) {
      Object.entries(newOverlayVisibility).forEach(([overlayId, isVisible]) => {
        updateOverlayVisibility(overlayId, isVisible);
      });
    }
  }, [selectTemplateById, updateOverlayVisibility]);

  // Handler for overlay visibility changes from host
  const handleOverlayVisibilityChanged = useCallback((overlayId: string, isVisible: boolean) => {
    updateOverlayVisibility(overlayId, isVisible);
  }, [updateOverlayVisibility]);

  // Generate a unique ID for this recording bot instance
  const recordingBotId = useMemo(() => `recording-bot-${Date.now()}`, []);

  // Log socket URL for debugging
  const socketUrl = useMemo(() => {
    const url = getRecordingApiUrl();
    console.warn('[RecordingTemplate] Socket URL:', url || '(empty - using relative)');
    console.warn('[RecordingTemplate] Is internal context:', isInternalRecordingContext());
    console.warn('[RecordingTemplate] Window hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
    return url;
  }, []);

  // WebSocket connection for scene sync
  const {
    isConnected: socketConnected,
    requestSceneState,
    onSceneIds: rawOnSceneIds,
  } = useWebinarSocket({
    sessionId: sessionId || '',
    enabled: !!sessionId,
    // Mark as recording client (special participant type)
    isShadow: true,
    // Use relative URL for internal Docker context (nginx proxies to backend)
    socketUrl: socketUrl,
    // Provide credentials for Recording Bot (no Firebase auth available)
    overrideUserId: recordingBotId,
    overrideUserName: 'Recording Bot',
    onSceneTemplateChanged: handleSceneTemplateChanged,
    onOverlayVisibilityChanged: handleOverlayVisibilityChanged,
    onBackgroundChanged: sceneSyncHandlers.handleBackgroundChanged,
    onCameraScaleChanged: sceneSyncHandlers.handleCameraScaleChanged,
    onCameraSlotStylesUpdated: sceneSyncHandlers.handleCameraSlotStylesUpdated,
    onCornerImagesUpdated: sceneSyncHandlers.handleCornerImagesUpdated,
    onTextBannerShown: sceneSyncHandlers.handleTextBannerShown,
    onSpeakerDisplayNamesUpdated: sceneSyncHandlers.handleSpeakerDisplayNamesUpdated,
    onSpeakerNameStyleUpdated: sceneSyncHandlers.handleSpeakerNameStyleUpdated,
    onSceneStateUpdated: sceneSyncHandlers.handleSceneStateUpdated,
  });

  // Log socket connection state changes
  useEffect(() => {
    console.warn(`[RecordingTemplate] Socket connected: ${socketConnected}`);
  }, [socketConnected]);

  // FIX: Treat empty onSceneIds array as undefined to show ALL participants
  // The recording bot should capture everything visible, not be filtered out
  // Empty array [] from backend means "no explicit scene management" - show all
  // Only apply filtering when there are actual IDs in the array
  const onSceneIds = useMemo(() => {
    if (rawOnSceneIds === undefined) {
      return undefined; // Show all participants (default behavior)
    }
    if (Array.isArray(rawOnSceneIds) && rawOnSceneIds.length === 0) {
      console.warn('[RecordingTemplate] Empty onSceneIds received, treating as undefined to show all participants');
      return undefined; // Show all participants when array is empty
    }
    return rawOnSceneIds; // Use the actual filter when IDs are present
  }, [rawOnSceneIds]);

  // Get LiveKit token - ONLY if egress didn't provide credentials via URL params
  // When egress loads our template, it provides url and token params which we use directly
  // This fallback is only for manual testing or when accessed outside of egress
  useEffect(() => {
    const fetchToken = async () => {
      // Skip if we already have credentials (either from egress or previous fetch)
      if (livekitToken && livekitServerUrl) {
        console.warn('[RecordingTemplate] Already have credentials, skipping fetch');
        return;
      }

      // If egress provided credentials, use them directly
      if (usingEgressCredentials) {
        console.warn('[RecordingTemplate] Using egress-provided credentials');
        return;
      }

      // Fallback: fetch from our API (for testing outside of egress)
      if (!sessionId) return;

      try {
        console.warn('[RecordingTemplate] No egress credentials, fetching from API for session:', sessionId);

        const apiUrl = getRecordingApiUrl();
        const url = `${apiUrl}/api/livekit/recording-token/${sessionId}`;
        console.warn('[RecordingTemplate] Token URL:', url);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();

        setLivekitToken(data.token);
        setLivekitServerUrl(data.serverUrl);
        console.warn('[RecordingTemplate] Got token from API, server:', data.serverUrl);
      } catch (err) {
        console.error('[RecordingTemplate] Failed to get recording token:', err);
        setError(`Failed to get recording token: ${err}`);
      }
    };

    fetchToken();
  }, [sessionId, livekitToken, livekitServerUrl, usingEgressCredentials]);

  // Request scene state when socket connects
  useEffect(() => {
    if (socketConnected) {
      console.warn('[RecordingTemplate] Socket connected, requesting scene state');
      // Retry a few times to ensure we get the state
      const timeoutIds: NodeJS.Timeout[] = [];

      const requestState = (attempt: number) => {
        if (attempt >= 5 || sceneSyncState.hasReceivedSceneState) return;
        console.warn('[RecordingTemplate] Requesting scene state, attempt:', attempt + 1);
        requestSceneState();
        timeoutIds.push(setTimeout(() => requestState(attempt + 1), 1500));
      };

      const initialTimeout = setTimeout(() => requestState(0), 300);
      timeoutIds.push(initialTimeout);

      return () => {
        timeoutIds.forEach(id => clearTimeout(id));
      };
    }
  }, [socketConnected, requestSceneState, sceneSyncState.hasReceivedSceneState]);

  // Debug info for recording template (visible in recording)
  const debugInfo = {
    sessionId,
    usingEgressCredentials, // true = egress provided url+token via query params
    hasToken: !!livekitToken,
    hasServerUrl: !!livekitServerUrl,
    serverUrl: livekitServerUrl,
    socketConnected,
    hasTemplate: !!effectiveTemplate,
    templateName: effectiveTemplate?.name,
    onSceneIdsCount: onSceneIds?.length ?? 'undefined',
  };

  // Security check - invalid or missing API key
  if (!isKeyValid) {
    console.error('[RecordingTemplate] Invalid or missing recording API key');
    return (
      <div className="w-screen h-screen bg-red-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">🔒 Unauthorized - Invalid Recording Key</p>
          <p className="text-sm text-gray-300">This page requires a valid recording API key.</p>
        </div>
      </div>
    );
  }

  // Error state - show red background for debugging
  if (error) {
    return (
      <div className="w-screen h-screen bg-red-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Recording Error: {error}</p>
          <pre className="text-xs text-left bg-black/50 p-4 rounded max-w-2xl overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // Loading state - black background while connecting
  if (!livekitToken || !livekitServerUrl) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Connecting to stream...</p>
          <p className="text-sm text-gray-400">Session: {sessionId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <LiveKitRoom
        serverUrl={livekitServerUrl}
        token={livekitToken}
        connect={true}
        className="w-full h-full"
      >
        {/* Egress SDK integration - registers room and signals when ready */}
        <EgressIntegration
          socketConnected={socketConnected}
          hasReceivedSceneState={sceneSyncState.hasReceivedSceneState}
        />
        <RoomAudioRenderer />

{/* DEBUG OVERLAY - Removed for production recordings */}

        {/* Scene Compositor - fills entire viewport */}
        {effectiveTemplate ? (
          <SceneCompositor
            template={effectiveTemplate}
            overlayVisibility={overlayVisibility}
            showPlaceholders={false}
            className="w-full h-full"
            isFullscreen={true}
            cameraScale={sceneSyncState.cameraScale}
            cameraSlotStyles={sceneSyncState.cameraSlotStyles}
            cornerImages={sceneSyncState.cornerImages}
            activeTextBanner={sceneSyncState.activeTextBanner}
            speakerDisplayNames={sceneSyncState.speakerDisplayNames}
            speakerNameStyle={sceneSyncState.speakerNameStyle || undefined}
            onSceneIds={onSceneIds}
          />
        ) : (
          // Fallback: show black screen if no template loaded yet
          <div className="w-full h-full bg-black flex items-center justify-center">
            <p className="text-gray-500">Loading scene...</p>
          </div>
        )}

      </LiveKitRoom>
    </div>
  );
}
