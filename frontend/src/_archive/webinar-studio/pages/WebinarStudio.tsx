import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
} from '@livekit/components-react';
import { Track, type RoomOptions, VideoPresets } from 'livekit-client';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Circle,
  Square,
  Moon,
  Sun,
  Users,
  MessageSquare,
  HelpCircle,
  AlertTriangle,
  Loader2,
  Play,
  ArrowLeft,
  Pause,
  LogOut,
  XCircle,
  Camera,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Maximize2,
  Layout,
  Layers,
  Settings2,
  BarChart3,
  Tablet,
  ExternalLink,
  Pencil,
  Presentation,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WebinarChat } from '@/components/webinar/WebinarChat';
import { WebinarQA } from '@/components/webinar/WebinarQA';
import { WebinarPollComponent } from '@/components/webinar/WebinarPoll';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCoachCheck } from '@/hooks/useCoachCheck';
import { useWebinarSocket } from '@/hooks/useWebinarSocket';
import { useWebinarViewerCount } from '@/hooks/useWebinarViewerCount';
import { webinarLiveClient } from '@/clients/WebinarLiveClient';
import { webinarSessionsClient } from '@/clients/WebinarSessionsClient';
import { webinarsClient } from '@/clients/WebinarsClient';
import { coachesClient } from '@/clients/CoachesClient';
import {
  SessionConflictDialog,
  SessionKickedDialog,
} from '@/components/webinar/SessionConflictDialog';
import { SceneCompositor } from '@/components/webinar/SceneCompositor';
import { ConnectedParticipants } from '@/components/webinar/ConnectedParticipants';
import { LayoutSelector } from '@/components/webinar/LayoutSelector';
import { OverlayManager } from '@/components/webinar/OverlayManager';
import { DeviceSelector, useDevicePersistence } from '@/components/webinar/DeviceSelector';
import { VideoQualitySelector, VIDEO_QUALITY_PRESETS, type VideoQualityPreset } from '@/components/webinar/VideoQualitySelector';
import { type AudioBitratePreset, AUDIO_BITRATE_OPTIONS } from '@/hooks/studio/types/studio.types';
import { StudioSidePanel, type PanelTab } from '@/components/webinar/StudioSidePanel';
import { WebinarAttendeeList } from '@/components/webinar/WebinarAttendeeList';
import { SceneControls, type CameraSlotStyle, type CustomOverlay, type OverlayPosition, type CornerImage, type CornerPosition, type SavedCornerImage, type TextBanner } from '@/components/webinar/SceneControls';
import { ReactionOverlay, type ReactionType } from '@/components/webinar/ReactionOverlay';
import {
  HostVideoPreview,
  LiveViewerCount,
  LiveKitMediaController,
  PresentationManager,
} from '@/components/webinar/studio';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useSceneTemplates } from '@/hooks/useSceneTemplates';
import { useStudioSceneSync } from '@/hooks/webinar/useStudioSceneSync';
import type { FullSceneSyncState } from '@/hooks/webinar/types/webinar-socket.types';
import { studioAssetsClient, type SavedSceneConfig, type SpeakerNameStyle, DEFAULT_SPEAKER_NAME_STYLE } from '@/clients/StudioAssetsClient';
import { useRNNoise } from '@/hooks/useRNNoise';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useMediaSession } from '@/hooks/useMediaSession';
import type {
  WebinarSession,
  WebinarProduct,
  WebinarChatMessage,
  WebinarQuestion,
  WebinarPoll as PollType,
  SessionConflictResponse,
} from '@/domain/products/models/webinar.model';

/**
 * WebinarStudio - Coach control panel for live webinars
 *
 * Features:
 * - Video preview (own camera)
 * - Go Live / End Session controls
 * - Recording toggle
 * - Q&A and Chat toggles
 * - Chat moderation (pin/delete messages)
 * - Q&A management (answer/dismiss questions)
 * - Poll creation and management
 * - Attendee count display
 */

/**
 * LiveKitDeviceSwitcher - Switches camera/microphone devices in-place during active sessions
 * Uses room.switchActiveDevice() so the broadcast is not interrupted
 * Must be rendered inside <LiveKitRoom>
 */
function LiveKitDeviceSwitcher({ videoDeviceId, audioDeviceId }: { videoDeviceId: string; audioDeviceId: string }) {
  const room = useRoomContext();
  const prevVideoRef = useRef(videoDeviceId);
  const prevAudioRef = useRef(audioDeviceId);

  useEffect(() => {
    if (!room || videoDeviceId === prevVideoRef.current) return;
    prevVideoRef.current = videoDeviceId;
    if (!videoDeviceId) return;

    room.switchActiveDevice('videoinput', videoDeviceId).then(() => {
      console.log('[LiveKitDeviceSwitcher] Switched video device to:', videoDeviceId);
    }).catch((err) => {
      console.error('[LiveKitDeviceSwitcher] Failed to switch video device:', err);
    });
  }, [room, videoDeviceId]);

  useEffect(() => {
    if (!room || audioDeviceId === prevAudioRef.current) return;
    prevAudioRef.current = audioDeviceId;
    if (!audioDeviceId) return;

    room.switchActiveDevice('audioinput', audioDeviceId).then(() => {
      console.log('[LiveKitDeviceSwitcher] Switched audio device to:', audioDeviceId);
    }).catch((err) => {
      console.error('[LiveKitDeviceSwitcher] Failed to switch audio device:', err);
    });
  }, [room, audioDeviceId]);

  return null;
}

export default function WebinarStudio() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isCoach, coachProfile, loading: coachLoading } = useCoachCheck();
  const { isDark, toggleTheme } = useTheme();

  // State
  const [session, setSession] = useState<WebinarSession | null>(null);
  const [webinar, setWebinar] = useState<WebinarProduct | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [livekitServerUrl, setLivekitServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showStopLiveDialog, setShowStopLiveDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Media permissions state
  const [mediaPermissions, setMediaPermissions] = useState<{
    video: boolean;
    audio: boolean;
    requested: boolean;
    error: string | null;
  }>({ video: false, audio: false, requested: false, error: null });
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Helper to get localStorage key for media state
  const getMediaStateKey = useCallback(() => {
    if (!sessionId || !currentUser?.uid) return null;
    return `webinar_media_state_${sessionId}_${currentUser.uid}`;
  }, [sessionId, currentUser?.uid]);

  // Media controls state - initialized from localStorage if available
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => {
    // Will be updated in useEffect once sessionId is available
    return true;
  });
  const [isVideoEnabled, setIsVideoEnabled] = useState(() => {
    // Will be updated in useEffect once sessionId is available
    return true;
  });
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);

  // Mobile debug logs (visible on screen for debugging without console)
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]); // Keep last 20 logs
  }, []);
  const [isPaused, setIsPaused] = useState(false);
  const [isPresentationSharing, setIsPresentationSharing] = useState(false);
  const [isPresentationPopoverOpen, setIsPresentationPopoverOpen] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Detect if we're on a mobile/tablet device - EARLY definition for use in callbacks
  const isMobileDevice = useMemo(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Track media state initialization: 'pending' -> 'loaded' -> 'ready'
  const mediaStatePhaseRef = useRef<'pending' | 'loaded' | 'ready'>('pending');

  // Track "desired" media state when on scene (for restoring after coming back on scene)
  const desiredAudioEnabledRef = useRef(true);
  const desiredVideoEnabledRef = useRef(true);
  const wasOnSceneRef = useRef<boolean | null>(null); // null = not initialized

  // Track pre-pause media state (for restoring after unpause from external source like ControlPanel)
  const prePauseAudioEnabledRef = useRef(true);
  const prePauseVideoEnabledRef = useRef(true);
  const isRestoringFromPauseRef = useRef(false); // Flag to prevent sync during restore

  // Device selection state with persistence
  const { loadDevicePreferences } = useDevicePersistence();
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>(() => {
    const saved = loadDevicePreferences();
    return saved?.videoDeviceId || '';
  });
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>(() => {
    const saved = loadDevicePreferences();
    return saved?.audioDeviceId || '';
  });
  const [selectedAudioOutputDeviceId, setSelectedAudioOutputDeviceId] = useState<string>(() => {
    const saved = loadDevicePreferences();
    return saved?.audioOutputDeviceId || '';
  });

  // Refs for device IDs used by roomOptions (stable, don't trigger re-creation of roomOptions)
  // Updated on every change so roomOptions always reads the latest when it does recompute
  const initialVideoDeviceRef = useRef(selectedVideoDeviceId);
  const initialAudioDeviceRef = useRef(selectedAudioDeviceId);
  useEffect(() => { initialVideoDeviceRef.current = selectedVideoDeviceId; }, [selectedVideoDeviceId]);
  useEffect(() => { initialAudioDeviceRef.current = selectedAudioDeviceId; }, [selectedAudioDeviceId]);

  // Apply audio output device (setSinkId) to all <audio> elements
  useEffect(() => {
    if (!selectedAudioOutputDeviceId) return;

    const applyOutputDevice = () => {
      document.querySelectorAll('audio').forEach((el) => {
        if (typeof el.setSinkId === 'function') {
          el.setSinkId(selectedAudioOutputDeviceId).catch(console.error);
        }
      });
    };

    applyOutputDevice();

    // Watch for new audio elements added by LiveKit
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLAudioElement) {
            if (typeof node.setSinkId === 'function') {
              node.setSinkId(selectedAudioOutputDeviceId).catch(console.error);
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [selectedAudioOutputDeviceId]);

  // Video quality state
  const [transmitQuality, setTransmitQuality] = useState<VideoQualityPreset>('720p');

  // Audio processing options (fixed for optimal quality, not user-configurable)
  const echoCancellation = true;
  const noiseSuppression = true;
  const autoGainControl = true;

  // Advanced audio publish options (fixed for optimal quality)
  // DTX (Discontinuous Transmission) - disabled to prevent choppy audio
  const dtxEnabled = false;
  // RED (Redundant Audio Data) - enabled for better packet loss recovery
  const redEnabled = true;
  // Audio bitrate - 128kbps for studio quality (fixed, not user-configurable)
  const [audioBitrate] = useState<AudioBitratePreset>(128000);

  // RNNoise enhanced noise suppression (open-source, runs locally)
  const {
    isSupported: rnnoiseSupported,
    isEnabled: rnnoiseEnabled,
    isLoading: rnnoiseLoading,
    error: rnnoiseError,
    setEnabled: setRnnoiseEnabled,
    initialize: initializeRnnoise,
    processAudioTrack: rnnoiseProcessTrack,
    cleanup: rnnoiseCleanup,
  } = useRNNoise();

  // Collapsible sections state
  const [sectionsCollapsed, setSectionsCollapsed] = useState({
    camera: false,
    controls: false,
    polls: false,
    chatQA: false,
  });

  // Toggle section collapsed state
  const toggleSection = useCallback((section: keyof typeof sectionsCollapsed) => {
    setSectionsCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // Full screen mode for video
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Determine if current user is the session host, shadow host, or guest speaker
  // Compare with coachProfile.id (coach ID) not currentUser.uid (Firebase Auth UID)
  const isSessionHost = useMemo(() => {
    if (!webinar || !coachProfile) return false;
    return webinar.host?.id === coachProfile.id;
  }, [webinar, coachProfile]);

  // Shadow host - same permissions as host but doesn't appear on scene by default
  const isShadowHost = useMemo(() => {
    if (!webinar || !coachProfile) return false;
    return webinar.shadowHost?.id === coachProfile.id;
  }, [webinar, coachProfile]);

  const isGuestSpeaker = useMemo(() => {
    if (!webinar || !coachProfile) return false;
    return webinar.guestSpeakers?.some(g => g.id === coachProfile.id) || false;
  }, [webinar, coachProfile]);

  // Admin speaker - guest speaker with admin permissions (can edit visuals, control features)
  const isAdminSpeaker = useMemo(() => {
    if (!webinar || !coachProfile) return false;
    const speaker = webinar.guestSpeakers?.find(g => g.id === coachProfile.id);
    return speaker?.isAdmin || false;
  }, [webinar, coachProfile]);

  // Shadow hosts have the same control permissions as the main host
  const isHostOrShadow = isSessionHost || isShadowHost;

  // Can access studio if host, shadow, OR guest speaker
  const canAccessStudio = isSessionHost || isShadowHost || isGuestSpeaker;

  // Can edit visual settings (layouts, backgrounds, overlays) - HOST, SHADOW, or ADMIN SPEAKER
  const canEditVisuals = isHostOrShadow || isAdminSpeaker;

  // Can control features (polls, Q&A, chat, go live) - HOST, SHADOW, or ADMIN SPEAKER
  const canControlFeatures = isHostOrShadow || isAdminSpeaker;

  // Recording state - multi-segment support (HLS-based)
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingLoading, setIsRecordingLoading] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [startSegmentIndex, setStartSegmentIndex] = useState<number | null>(null);
  const recordingOperationInProgress = useRef(false);
  const [recordingSegments, setRecordingSegments] = useState<Array<{
    id: string;
    egressId: string;
    segmentNumber: number;
    startedAt: string;
    endedAt?: string;
    status: 'recording' | 'processing' | 'available' | 'failed';
    url?: string;
    path?: string;
    duration?: number;
    startSegmentIndex?: number;
  }>>([]);
  const [currentSegmentNumber, setCurrentSegmentNumber] = useState(0);

  // Session conflict handling (single session per user)
  const [sessionConflict, setSessionConflict] = useState<SessionConflictResponse | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [showKickedDialog, setShowKickedDialog] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time state
  const [chatMessages, setChatMessages] = useState<WebinarChatMessage[]>([]);
  const [questions, setQuestions] = useState<WebinarQuestion[]>([]);
  const [activePoll, setActivePoll] = useState<PollType | null>(null);
  const [pollHistory, setPollHistory] = useState<PollType[]>([]);
  const [draftPolls, setDraftPolls] = useState<PollType[]>([]);
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);

  // Side panel tab and unread counters
  const [activeSidePanelTab, setActiveSidePanelTab] = useState<PanelTab>('chat');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadQaCount, setUnreadQaCount] = useState(0);
  const activeSidePanelTabRef = useRef<PanelTab>(activeSidePanelTab);

  // Keep ref in sync with state for use in callbacks
  useEffect(() => {
    activeSidePanelTabRef.current = activeSidePanelTab;
  }, [activeSidePanelTab]);

  // Handle side panel tab change - reset unread counters
  const handleSidePanelTabChange = useCallback((tab: PanelTab) => {
    setActiveSidePanelTab(tab);
    if (tab === 'chat') {
      setUnreadChatCount(0);
    } else if (tab === 'qa') {
      setUnreadQaCount(0);
    }
  }, []);

  // Attendee list refresh state
  const [isRefreshingAttendees, setIsRefreshingAttendees] = useState(false);

  // ── 1. Scene Templates (must be BEFORE socket so handlers can use selectTemplateById) ──
  const {
    templates: sceneTemplates,
    selectedTemplate,
    isLoading: templatesLoading,
    overlayVisibility,
    selectTemplate: localSelectTemplate,
    selectTemplateById,
    toggleOverlay: localToggleOverlay,
  } = useSceneTemplates({ loadOnMount: true, autoSelectDefault: true });

  // ── 2. Studio Scene Sync (encapsulates all scene state + remote handlers) ──
  const initialSpeakerDisplayNames = useMemo(() => {
    if (currentUser?.uid && coachProfile?.webinarDisplayName) {
      return { [currentUser.uid]: coachProfile.webinarDisplayName };
    }
    return {};
  }, [currentUser?.uid, coachProfile?.webinarDisplayName]);

  const [sceneState, sceneSetters, sceneHandlers] = useStudioSceneSync({
    onTemplateChange: selectTemplateById,
    onOverlayVisibilityChange: localToggleOverlay,
    initialSpeakerDisplayNames,
  });

  const {
    background, cameraScale, cameraSlotStyles, cornerImages,
    activeTextBanner, speakerDisplayNames, speakerNameStyle, textBanners,
  } = sceneState;

  const {
    setBackground, setCameraScale, setCameraSlotStyles, setCornerImages,
    setActiveTextBanner, setSpeakerDisplayNames, setSpeakerNameStyle, setTextBanners,
  } = sceneSetters;

  // ── 3. WebSocket connection for real-time updates ──
  const {
    isConnected: socketConnected,
    attendeeCount,
    attendeeList,
    getAttendeeList: fetchAttendeeList,
    qaEnabled,
    chatEnabled,
    reactionsEnabled,
    sendChatMessage,
    pinMessage,
    deleteChatMessage,
    submitQuestion,
    answerQuestion,
    deleteQuestion,
    createPoll,
    createDraftPoll,
    getDraftPolls,
    launchPoll,
    deleteDraftPoll,
    closePoll,
    toggleQA,
    toggleChat,
    toggleReactions,
    togglePause: socketTogglePause,
    changeSceneTemplate,
    changeOverlayVisibility,
    broadcastBackground,
    broadcastCameraScale,
    broadcastCameraSlotStyles,
    broadcastCornerImages,
    broadcastTextBanner,
    broadcastSpeakerDisplayNames,
    broadcastSpeakerNameStyle,
    broadcastFullSceneState,
    sendSceneStateToClient,
    requestSceneState,
    sceneParticipants,
    onSceneIds,
    addToScene,
    removeFromScene,
    getSceneParticipants,
    socket: webinarSocket,
    // Giveaway
    currentGiveawayWinners,
    giveawayRounds,
    isGiveawaySelecting,
    selectGiveawayWinner,
    startGiveawaySelection,
    startNewGiveawayRound,
    getGiveawayState,
    deleteGiveawayRound,
  } = useWebinarSocket({
    sessionId: sessionId || '',
    // Wait for webinar and coachProfile to load before connecting, so isHost/isShadow are correct
    enabled: !!sessionId && isCoach && !!webinar && !!coachProfile,
    isHost: isSessionHost,
    isShadow: isShadowHost,
    isSpeaker: isGuestSpeaker,
    isAdminSpeaker,
    clientType: 'studio', // Main studio connection
    onChatMessage: (msg) => {
      setChatMessages((prev) => [...prev, msg]);
      // Increment unread counter if chat tab is not active
      if (activeSidePanelTabRef.current !== 'chat') {
        setUnreadChatCount((prev) => prev + 1);
      }
    },
    onChatMessagePinned: (msgId, pinned) => setPinnedMessageId(pinned ? msgId : null),
    onChatMessageDeleted: (msgId) => setChatMessages((prev) => prev.filter((m) => m.id !== msgId)),
    onQuestionReceived: (q) => {
      setQuestions((prev) => [...prev, q]);
      // Increment unread counter if Q&A tab is not active
      if (activeSidePanelTabRef.current !== 'qa') {
        setUnreadQaCount((prev) => prev + 1);
      }
    },
    onQuestionAnswered: (q) =>
      setQuestions((prev) => prev.map((existing) => (existing.id === q.id ? q : existing))),
    onQuestionUpvoted: (qId, upvotes, upvotedBy) =>
      setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, upvotes, upvotedBy } : q))),
    onQuestionDeleted: (qId) => setQuestions((prev) => prev.filter((q) => q.id !== qId)),
    onPollCreated: (poll) => {
      setActivePoll(poll);
    },
    onPollVoteUpdate: (pollId, votes) =>
      setActivePoll((prev) =>
        prev?.id === pollId
          ? {
              ...prev,
              options: prev.options.map((o, i) => ({ ...o, votes: votes[i] })),
              totalVotes: votes.reduce((a, b) => a + b, 0),
            }
          : prev
      ),
    onPollClosed: (pollId) =>
      setActivePoll((prev) => {
        if (prev?.id === pollId) {
          // Move closed poll to history
          const closedPoll = { ...prev, status: 'closed' as const, showResults: true };
          setPollHistory((history) => [closedPoll, ...history]);
          return null;
        }
        return prev;
      }),
    onReactionReceived: (reactionType: ReactionType) => {
      // Add reaction to the overlay via window reference
      const overlay = (window as any).__webinarReactionOverlay;
      if (overlay?.addReaction) {
        overlay.addReaction(reactionType);
      }
    },
    // Scene sync - direct handlers from useStudioSceneSync
    onSceneSyncRequested: (requesterId: string) => {
      sendSceneStateToClient(requesterId, sceneHandlers.getSceneStateSnapshot());
    },
    onSceneStateUpdated: sceneHandlers.handleFullSceneSync,
    onSceneTemplateChanged: sceneHandlers.handleSceneTemplateChanged,
    onBackgroundChanged: sceneHandlers.handleBackgroundChanged,
    onCameraScaleChanged: sceneHandlers.handleCameraScaleChanged,
    onCameraSlotStylesUpdated: sceneHandlers.handleCameraSlotStylesUpdated,
    onCornerImagesUpdated: sceneHandlers.handleCornerImagesUpdated,
    onTextBannerShown: sceneHandlers.handleTextBannerShown,
    onSpeakerNameStyleUpdated: sceneHandlers.handleSpeakerNameStyleUpdated,
    onSpeakerDisplayNamesUpdated: sceneHandlers.handleSpeakerDisplayNamesUpdated,
    onOverlayVisibilityChanged: sceneHandlers.handleOverlayVisibilityChanged,
    // Real-time session kicked notification (immediate, doesn't wait for heartbeat)
    onSessionKicked: (_reason: string) => {
      // Clear LiveKit token to stop video
      clearToken();
      // Show kicked dialog
      setShowKickedDialog(true);
    },
    // Handle pause/resume from control panel or other hosts
    onSessionPaused: (paused: boolean) => {
      if (paused) {
        // Pausing: disable audio/video (refs are already synced via useEffect)
        setIsPaused(true);
        setIsAudioEnabled(false);
        setIsVideoEnabled(false);
      } else {
        // Resuming: set flag to prevent sync useEffect from overwriting refs
        isRestoringFromPauseRef.current = true;
        setIsPaused(false);
        // Restore the saved state
        setIsAudioEnabled(prePauseAudioEnabledRef.current);
        setIsVideoEnabled(prePauseVideoEnabledRef.current);
        // Sync desired refs so scene logic stays consistent
        desiredAudioEnabledRef.current = prePauseAudioEnabledRef.current;
        desiredVideoEnabledRef.current = prePauseVideoEnabledRef.current;
        // Clear restoring flag after a tick to allow future syncs
        setTimeout(() => {
          isRestoringFromPauseRef.current = false;
        }, 100);
      }
    },
    // Handle session status changes from control panel or other hosts
    onSessionStatusChanged: (status: string, _previousStatus?: string) => {
      setSession((prev) => prev ? { ...prev, status: status as WebinarSession['status'] } : null);
    },
  });

  // Wrapper function for refreshing attendee list with loading state
  const getAttendeeList = useCallback(async () => {
    setIsRefreshingAttendees(true);
    await fetchAttendeeList();
    setIsRefreshingAttendees(false);
  }, [fetchAttendeeList]);

  // Fetch attendee list when switching to attendees tab
  useEffect(() => {
    if (activeSidePanelTab === 'attendees' && socketConnected) {
      fetchAttendeeList();
    }
  }, [activeSidePanelTab, socketConnected, fetchAttendeeList]);

  // Wrapper for selectTemplate that broadcasts to clients
  const selectTemplate = useCallback((template: typeof selectedTemplate) => {
    if (!template) return;
    localSelectTemplate(template);
    // Broadcast to all clients
    changeSceneTemplate(template.id, overlayVisibility);
  }, [localSelectTemplate, changeSceneTemplate, overlayVisibility]);

  // Wrapper for toggleOverlay that broadcasts to clients
  const toggleOverlay = useCallback((overlayId: string, isVisible: boolean) => {
    localToggleOverlay(overlayId, isVisible);
    // Broadcast to all clients
    changeOverlayVisibility(overlayId, isVisible);
  }, [localToggleOverlay, changeOverlayVisibility]);

  // Keep snapshot in sync with external values (templateId, overlayVisibility)
  // NOTE: currentConfigId is synced in the scene config section below
  useEffect(() => {
    sceneHandlers.updateSnapshotExtras({
      templateId: selectedTemplate?.id,
      overlayVisibility,
    });
  }, [selectedTemplate?.id, overlayVisibility, sceneHandlers]);

  // Request scene state when socket connects (for multi-host/speaker sync)
  // Works in both 'planning' and 'live' modes so speakers can see the host's design
  useEffect(() => {
    if (socketConnected && (session?.status === 'live' || session?.status === 'planning')) {
      // Delay slightly to allow connection to stabilize
      const timeout = setTimeout(() => {
        requestSceneState();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [socketConnected, session?.status, requestSceneState]);

  // Check if current user is on scene
  const isOnScene = useMemo(() => {
    if (!currentUser?.uid) return false;
    // If onSceneIds is undefined or empty, assume everyone is on scene (initial state / feature not active)
    if (!onSceneIds || onSceneIds.length === 0) return true;
    return onSceneIds.includes(currentUser.uid);
  }, [currentUser?.uid, onSceneIds]);

  // Handle scene presence changes - mute/unmute based on whether user is on scene
  useEffect(() => {
    // Skip if media state hasn't been initialized yet
    if (mediaStatePhaseRef.current !== 'ready') return;

    // Skip initial render (wasOnSceneRef.current is null)
    if (wasOnSceneRef.current === null) {
      wasOnSceneRef.current = isOnScene;
      return;
    }

    // Only act when on-scene status actually changes
    if (wasOnSceneRef.current === isOnScene) return;

    if (!isOnScene) {
      // Going OFF scene: save current desired state, then mute everything
      desiredAudioEnabledRef.current = isAudioEnabled;
      desiredVideoEnabledRef.current = isVideoEnabled;
      setIsAudioEnabled(false);
      setIsVideoEnabled(false);
    } else {
      // Coming back ON scene: restore saved state
      setIsAudioEnabled(desiredAudioEnabledRef.current);
      setIsVideoEnabled(desiredVideoEnabledRef.current);
    }

    wasOnSceneRef.current = isOnScene;
  }, [isOnScene, isAudioEnabled, isVideoEnabled]);

  // Keep prePause refs in sync with actual state (only when NOT paused and not restoring)
  // This ensures we always have the correct "before pause" state saved
  useEffect(() => {
    // Don't sync during restore process or while paused
    if (!isPaused && !isRestoringFromPauseRef.current) {
      prePauseAudioEnabledRef.current = isAudioEnabled;
      prePauseVideoEnabledRef.current = isVideoEnabled;
    }
  }, [isAudioEnabled, isVideoEnabled, isPaused]);

  // Persist display name to coach profile when it changes
  const lastPersistedNameRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentUser?.uid && speakerDisplayNames[currentUser.uid]) {
      const currentName = speakerDisplayNames[currentUser.uid];
      // Only persist if the name actually changed and differs from what we last persisted
      if (currentName !== lastPersistedNameRef.current && currentName !== coachProfile?.webinarDisplayName) {
        lastPersistedNameRef.current = currentName;
        coachesClient.updateMyProfile({ webinarDisplayName: currentName }).catch(err => {
          console.warn('[WebinarStudio] Failed to persist webinarDisplayName:', err);
        });
      }
    }
  }, [currentUser?.uid, speakerDisplayNames, coachProfile?.webinarDisplayName]);

  // Display name change dialog
  const [isDisplayNameDialogOpen, setIsDisplayNameDialogOpen] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');

  // Custom overlays (banners added during stream)
  const [customOverlays, setCustomOverlays] = useState<CustomOverlay[]>([]);

  // Handler for camera scale change
  const handleCameraScaleChange = useCallback((scale: number) => {
    setCameraScale(scale);
    broadcastCameraScale(scale);
  }, [setCameraScale, broadcastCameraScale]);

  // Handler for camera slot style change (border colors)
  const handleCameraSlotStyleChange = useCallback((slotId: string, style: Partial<CameraSlotStyle>) => {
    setCameraSlotStyles(prev => {
      const existing = prev.find(s => s.slotId === slotId);
      let newStyles: CameraSlotStyle[];
      if (existing) {
        newStyles = prev.map(s => s.slotId === slotId ? { ...s, ...style } : s);
      } else {
        newStyles = [...prev, { slotId, borderColor: '#22d3ee', borderWidth: 3, ...style }];
      }
      // Broadcast to all clients
      broadcastCameraSlotStyles(newStyles);
      return newStyles;
    });
  }, [setCameraSlotStyles, broadcastCameraSlotStyles]);

  // Handler for speaker name style change
  const handleSpeakerNameStyleChange = useCallback((style: Partial<SpeakerNameStyle>) => {
    setSpeakerNameStyle(prev => {
      const newStyle = { ...prev, ...style };
      // Broadcast to clients
      broadcastSpeakerNameStyle(newStyle);
      return newStyle;
    });
  }, [setSpeakerNameStyle, broadcastSpeakerNameStyle]);

  // Handler for changing own display name
  // IMPORTANT: Only broadcast the changed entry, not the full map.
  // The backend merges { ...serverState, ...clientState }, so sending the full local map
  // could overwrite other speakers' newer names with stale local values.
  const handleDisplayNameChange = useCallback((newName: string) => {
    if (currentUser?.uid) {
      // Update local state with full map for immediate UI feedback
      setSpeakerDisplayNames(prev => ({ ...prev, [currentUser.uid]: newName }));
      // Broadcast ONLY the changed entry — backend will merge it with existing names
      broadcastSpeakerDisplayNames({ [currentUser.uid]: newName });
    }
  }, [currentUser?.uid, setSpeakerDisplayNames, broadcastSpeakerDisplayNames]);

  // Handler for opening display name dialog
  const openDisplayNameDialog = useCallback(() => {
    const currentName = currentUser?.uid ? speakerDisplayNames[currentUser.uid] || 'Host' : 'Host';
    setDisplayNameInput(currentName);
    setIsDisplayNameDialogOpen(true);
  }, [currentUser?.uid, speakerDisplayNames]);

  // Handler for saving display name from dialog
  const saveDisplayName = useCallback(() => {
    if (displayNameInput.trim()) {
      handleDisplayNameChange(displayNameInput.trim());
    }
    setIsDisplayNameDialogOpen(false);
  }, [displayNameInput, handleDisplayNameChange]);

  // Handlers for custom overlays
  const handleAddCustomOverlay = useCallback((overlay: Omit<CustomOverlay, 'id'>) => {
    const newOverlay: CustomOverlay = {
      ...overlay,
      id: `overlay-${Date.now()}`,
    };
    setCustomOverlays(prev => [...prev, newOverlay]);
  }, []);

  const handleRemoveCustomOverlay = useCallback((overlayId: string) => {
    setCustomOverlays(prev => prev.filter(o => o.id !== overlayId));
  }, []);

  const handleToggleCustomOverlay = useCallback((overlayId: string) => {
    setCustomOverlays(prev => prev.map(o =>
      o.id === overlayId ? { ...o, isVisible: !o.isVisible } : o
    ));
  }, []);

  const handleUpdateCustomOverlay = useCallback((overlayId: string, updates: Partial<CustomOverlay>) => {
    setCustomOverlays(prev => prev.map(o =>
      o.id === overlayId ? { ...o, ...updates } : o
    ));
  }, []);

  // Scene configuration state
  const [savedSceneConfigs, setSavedSceneConfigs] = useState<SavedSceneConfig[]>([]);
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Track loaded config state to detect unsaved changes
  const loadedConfigStateRef = useRef<{
    background: { type: 'color' | 'image'; value: string };
    cameraScale: number;
    cameraSlotStyles: CameraSlotStyle[];
    cornerImages: CornerImage[];
    textBanners: TextBanner[];
    speakerNameStyle: SpeakerNameStyle;
    speakerDisplayNames: Record<string, string>;
    templateId?: string;
  } | null>(null);

  // Wire up the full scene sync extras callback for config tracking
  // This handles currentConfigId and loadedConfigStateRef updates during remote sync
  sceneHandlers.onFullSceneSyncExtrasRef.current = useCallback((syncState: FullSceneSyncState) => {
    if (syncState.currentConfigId !== undefined) {
      setCurrentConfigId(syncState.currentConfigId);
      if (syncState.currentConfigId && syncState.background && loadedConfigStateRef.current !== undefined) {
        loadedConfigStateRef.current = {
          background: syncState.background as { type: 'color' | 'image'; value: string },
          cameraScale: syncState.cameraScale ?? 1,
          cameraSlotStyles: syncState.cameraSlotStyles ?? [],
          cornerImages: syncState.cornerImages ?? [],
          textBanners: syncState.textBanners ?? [],
          speakerNameStyle: syncState.speakerNameStyle ?? DEFAULT_SPEAKER_NAME_STYLE,
          speakerDisplayNames: syncState.speakerDisplayNames ?? {},
          templateId: syncState.templateId,
        };
      }
    }
  }, []);

  // Keep snapshot currentConfigId in sync
  useEffect(() => {
    sceneHandlers.updateSnapshotExtras({ currentConfigId });
  }, [currentConfigId, sceneHandlers]);

  // Detect if there are unsaved scene changes
  const hasUnsavedSceneChanges = useMemo(() => {
    // No changes if no config is loaded
    if (!currentConfigId || !loadedConfigStateRef.current) return false;

    const loaded = loadedConfigStateRef.current;

    // Compare background
    if (loaded.background.type !== background.type || loaded.background.value !== background.value) {
      return true;
    }

    // Compare camera scale
    if (loaded.cameraScale !== cameraScale) {
      return true;
    }

    // Compare template
    if (loaded.templateId !== selectedTemplate?.id) {
      return true;
    }

    // Compare camera slot styles (simplified comparison)
    if (JSON.stringify(loaded.cameraSlotStyles) !== JSON.stringify(cameraSlotStyles)) {
      return true;
    }

    // Compare corner images (simplified comparison)
    if (JSON.stringify(loaded.cornerImages) !== JSON.stringify(cornerImages)) {
      return true;
    }

    // Compare text banners (simplified comparison)
    if (JSON.stringify(loaded.textBanners) !== JSON.stringify(textBanners)) {
      return true;
    }

    // Compare speaker name style
    if (JSON.stringify(loaded.speakerNameStyle) !== JSON.stringify(speakerNameStyle)) {
      return true;
    }

    // Compare speaker display names
    if (JSON.stringify(loaded.speakerDisplayNames || {}) !== JSON.stringify(speakerDisplayNames)) {
      return true;
    }

    return false;
  }, [currentConfigId, background, cameraScale, selectedTemplate?.id, cameraSlotStyles, cornerImages, textBanners, speakerNameStyle, speakerDisplayNames]);

  // Quick save to current config
  const handleQuickSaveConfig = useCallback(async () => {
    if (!currentConfigId || !webinar?.id) return;

    try {
      setIsSavingConfig(true);
      const configData = {
        background,
        templateId: selectedTemplate?.id,
        cameraScale,
        cameraSlotStyles,
        cornerImages,
        textBanners,
        speakerNameStyle,
        speakerDisplayNames,
        overlayVisibility,
      };

      await studioAssetsClient.updateSceneConfig(currentConfigId, configData, webinar.id);

      // Update local state
      setSavedSceneConfigs(prev =>
        prev.map(c => c.id === currentConfigId ? { ...c, ...configData, updatedAt: new Date() } : c)
      );

      // Update the ref to reflect saved state
      loadedConfigStateRef.current = {
        background,
        cameraScale,
        cameraSlotStyles,
        cornerImages,
        textBanners,
        speakerNameStyle,
        speakerDisplayNames,
        templateId: selectedTemplate?.id,
      };
    } catch (error) {
      console.error('[WebinarStudio] Failed to quick save config:', error);
      throw error;
    } finally {
      setIsSavingConfig(false);
    }
  }, [currentConfigId, webinar?.id, background, selectedTemplate?.id, cameraScale, cameraSlotStyles, cornerImages, textBanners, speakerNameStyle, speakerDisplayNames, overlayVisibility]);

  // Load saved scene configs and default config when webinar is loaded
  // Scene configs are per-webinar, not per-user
  useEffect(() => {
    const loadSceneConfigs = async () => {
      if (!webinar?.id) return;

      try {
        setIsLoadingConfig(true);
        const [configs, defaultConfig] = await Promise.all([
          studioAssetsClient.getSavedSceneConfigs(webinar.id),
          studioAssetsClient.getDefaultSceneConfig(webinar.id),
        ]);

        setSavedSceneConfigs(configs);

        // Apply default config if exists
        if (defaultConfig) {
          setCurrentConfigId(defaultConfig.id);
          setBackground(defaultConfig.background);
          setCameraScale(defaultConfig.cameraScale);
          setCameraSlotStyles(defaultConfig.cameraSlotStyles);
          setCornerImages(defaultConfig.cornerImages);
          setTextBanners(defaultConfig.textBanners);
          if (defaultConfig.speakerNameStyle) {
            setSpeakerNameStyle(defaultConfig.speakerNameStyle);
          }
          if (defaultConfig.speakerDisplayNames) {
            setSpeakerDisplayNames(defaultConfig.speakerDisplayNames);
          }
          if (defaultConfig.templateId) {
            selectTemplateById(defaultConfig.templateId);
          }
          if (defaultConfig.overlayVisibility) {
            Object.entries(defaultConfig.overlayVisibility).forEach(([overlayId, isVisible]) => {
              localToggleOverlay(overlayId, isVisible);
            });
          }
          // Store the loaded state to detect unsaved changes
          loadedConfigStateRef.current = {
            background: defaultConfig.background,
            cameraScale: defaultConfig.cameraScale,
            cameraSlotStyles: defaultConfig.cameraSlotStyles,
            cornerImages: defaultConfig.cornerImages,
            textBanners: defaultConfig.textBanners,
            speakerNameStyle: defaultConfig.speakerNameStyle || DEFAULT_SPEAKER_NAME_STYLE,
            speakerDisplayNames: defaultConfig.speakerDisplayNames || {},
            templateId: defaultConfig.templateId,
          };
        }
      } catch (error) {
        console.error('[WebinarStudio] Failed to load scene configs:', error);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadSceneConfigs();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- setters from useStudioSceneSync are stable
  }, [webinar?.id, selectTemplateById, localToggleOverlay]);

  // Track if we've broadcasted after going live (separate from initial load)
  const broadcastedAfterLiveRef = useRef(false);

  // Reset the live broadcast flag when session status changes away from live
  useEffect(() => {
    if (session?.status !== 'live') {
      broadcastedAfterLiveRef.current = false;
    }
  }, [session?.status]);

  // Broadcast scene state when session goes LIVE
  // This is the key moment when clients actually connect and need the scene state
  useEffect(() => {
    if (session?.status === 'live' && socketConnected && !isLoadingConfig && !broadcastedAfterLiveRef.current) {
      // Delay to ensure LiveKit is connected and clients are joining
      const timeout = setTimeout(() => {
        broadcastFullSceneState({
          templateId: selectedTemplate?.id,
          background,
          cameraScale,
          cameraSlotStyles,
          cornerImages,
          activeTextBanner,
          overlayVisibility,
          speakerDisplayNames,
          speakerNameStyle,
        });
        broadcastedAfterLiveRef.current = true;
      }, 1500); // 1.5s delay to allow clients to connect
      return () => clearTimeout(timeout);
    }
  }, [session?.status, socketConnected, isLoadingConfig, selectedTemplate?.id, background, cameraScale, cameraSlotStyles, cornerImages, activeTextBanner, overlayVisibility, speakerDisplayNames, speakerNameStyle, broadcastFullSceneState]);

  // Save current scene configuration (global - shared across all webinars)
  const handleSaveSceneConfig = useCallback(async (name: string, setAsDefault: boolean = false) => {
    if (!webinar?.id) return;

    try {
      setIsSavingConfig(true);
      const configData = {
        name,
        isDefault: setAsDefault,
        webinarId: webinar.id,
        background,
        templateId: selectedTemplate?.id,
        cameraScale,
        cameraSlotStyles,
        cornerImages,
        textBanners,
        speakerNameStyle,
        speakerDisplayNames,
        overlayVisibility,
      };

      // Check if the name matches the current loaded config
      const currentConfig = savedSceneConfigs.find(c => c.id === currentConfigId);
      const isNewName = !currentConfig || currentConfig.name !== name;

      if (currentConfigId && !isNewName) {
        // Update existing config (same name)
        await studioAssetsClient.updateSceneConfig(currentConfigId, configData, webinar.id);
        setSavedSceneConfigs(prev =>
          prev.map(c => c.id === currentConfigId
            ? { ...c, ...configData, updatedAt: new Date() }
            : (setAsDefault ? { ...c, isDefault: false } : c)
          )
        );
      } else {
        // Save as new config (different name or no current config)
        const newConfig = await studioAssetsClient.saveSceneConfig(configData);
        setSavedSceneConfigs(prev => [newConfig, ...prev.map(c => setAsDefault ? { ...c, isDefault: false } : c)]);
        setCurrentConfigId(newConfig.id);
      }

      // Update the ref to reflect saved state
      loadedConfigStateRef.current = {
        background,
        cameraScale,
        cameraSlotStyles,
        cornerImages,
        textBanners,
        speakerNameStyle,
        speakerDisplayNames,
        templateId: selectedTemplate?.id,
      };
    } catch (error) {
      console.error('[WebinarStudio] Failed to save scene config:', error);
      throw error;
    } finally {
      setIsSavingConfig(false);
    }
  }, [webinar?.id, background, selectedTemplate, cameraScale, cameraSlotStyles, cornerImages, textBanners, speakerNameStyle, speakerDisplayNames, overlayVisibility, currentConfigId, savedSceneConfigs]);

  // Load a saved scene configuration
  const handleLoadSceneConfig = useCallback((config: SavedSceneConfig) => {
    setCurrentConfigId(config.id);
    setBackground(config.background);
    setCameraScale(config.cameraScale);
    setCameraSlotStyles(config.cameraSlotStyles);
    setCornerImages(config.cornerImages);
    setTextBanners(config.textBanners);
    if (config.speakerNameStyle) {
      setSpeakerNameStyle(config.speakerNameStyle);
    }
    if (config.speakerDisplayNames) {
      setSpeakerDisplayNames(config.speakerDisplayNames);
    }
    if (config.templateId) {
      selectTemplateById(config.templateId);
    }
    if (config.overlayVisibility) {
      Object.entries(config.overlayVisibility).forEach(([overlayId, isVisible]) => {
        localToggleOverlay(overlayId, isVisible);
      });
    }

    // Store the loaded state to detect unsaved changes
    loadedConfigStateRef.current = {
      background: config.background,
      cameraScale: config.cameraScale,
      cameraSlotStyles: config.cameraSlotStyles,
      cornerImages: config.cornerImages,
      textBanners: config.textBanners,
      speakerNameStyle: config.speakerNameStyle || DEFAULT_SPEAKER_NAME_STYLE,
      speakerDisplayNames: config.speakerDisplayNames || {},
      templateId: config.templateId,
    };

    // Broadcast all scene state to clients when loading a saved config
    broadcastBackground(config.background);
    broadcastCameraScale(config.cameraScale);
    broadcastCameraSlotStyles(config.cameraSlotStyles);
    broadcastCornerImages(config.cornerImages);
    if (config.speakerDisplayNames) {
      broadcastSpeakerDisplayNames(config.speakerDisplayNames);
    }
    if (config.templateId) {
      changeSceneTemplate(config.templateId, config.overlayVisibility);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- setters from useStudioSceneSync are stable
  }, [selectTemplateById, localToggleOverlay, broadcastBackground, broadcastCameraScale, broadcastCameraSlotStyles, broadcastCornerImages, broadcastSpeakerDisplayNames, changeSceneTemplate]);

  // Delete a saved scene configuration
  const handleDeleteSceneConfig = useCallback(async (configId: string) => {
    try {
      await studioAssetsClient.deleteSceneConfig(configId);
      setSavedSceneConfigs(prev => prev.filter(c => c.id !== configId));
      if (currentConfigId === configId) {
        setCurrentConfigId(null);
      }
    } catch (error) {
      console.error('[WebinarStudio] Failed to delete scene config:', error);
      throw error;
    }
  }, [currentConfigId]);

  // Set a config as default (per-webinar)
  const handleSetDefaultConfig = useCallback(async (configId: string) => {
    if (!webinar?.id) return;

    try {
      await studioAssetsClient.setDefaultConfig(configId, webinar.id);
      setSavedSceneConfigs(prev =>
        prev.map(c => ({ ...c, isDefault: c.id === configId }))
      );
    } catch (error) {
      console.error('[WebinarStudio] Failed to set default config:', error);
      throw error;
    }
  }, [webinar?.id]);

  // Handlers for corner images
  const handleSetCornerImage = useCallback((corner: CornerPosition, savedImage: SavedCornerImage) => {
    const newCornerImage: CornerImage = {
      id: `corner-${corner}-${Date.now()}`,
      name: savedImage.name,
      url: savedImage.url,
      corner,
      isVisible: true,
      width: 15,
      height: 15,
    };
    setCornerImages(prev => {
      // Replace existing corner image if any
      const filtered = prev.filter(c => c.corner !== corner);
      const newCornerImages = [...filtered, newCornerImage];
      // Broadcast to all clients
      broadcastCornerImages(newCornerImages);
      return newCornerImages;
    });
  }, [setCornerImages, broadcastCornerImages]);

  const handleRemoveCornerImage = useCallback((corner: CornerPosition) => {
    setCornerImages(prev => {
      const newCornerImages = prev.filter(c => c.corner !== corner);
      broadcastCornerImages(newCornerImages);
      return newCornerImages;
    });
  }, [setCornerImages, broadcastCornerImages]);

  const handleToggleCornerImage = useCallback((corner: CornerPosition) => {
    setCornerImages(prev => {
      const newCornerImages = prev.map(c =>
        c.corner === corner ? { ...c, isVisible: !c.isVisible } : c
      );
      broadcastCornerImages(newCornerImages);
      return newCornerImages;
    });
  }, [setCornerImages, broadcastCornerImages]);

  // Handlers for text banners
  const handleAddTextBanner = useCallback((banner: Omit<TextBanner, 'id'>) => {
    const newBanner: TextBanner = {
      ...banner,
      id: `banner-${Date.now()}`,
    };
    setTextBanners(prev => [...prev, newBanner]);
  }, [setTextBanners]);

  const handleUpdateTextBanner = useCallback((id: string, updates: Partial<TextBanner>) => {
    setTextBanners(prev => prev.map(b =>
      b.id === id ? { ...b, ...updates } : b
    ));
  }, [setTextBanners]);

  const handleRemoveTextBanner = useCallback((id: string) => {
    setTextBanners(prev => prev.filter(b => b.id !== id));
    if (activeTextBanner?.id === id) {
      setActiveTextBanner(null);
    }
  }, [activeTextBanner, setTextBanners, setActiveTextBanner]);

  const handleShowTextBanner = useCallback((id: string) => {
    const banner = textBanners.find(b => b.id === id);
    if (!banner) return;

    // Show the banner
    const activeBanner = { ...banner, isVisible: true };
    setActiveTextBanner(activeBanner);
    // Broadcast to all clients
    broadcastTextBanner(activeBanner);

    // If duration > 0, hide after duration
    if (banner.duration > 0) {
      setTimeout(() => {
        setActiveTextBanner(null);
        broadcastTextBanner(null);
      }, banner.duration * 1000);
    }
  }, [textBanners, setActiveTextBanner, broadcastTextBanner]);

  // Handler for background image change (from saved backgrounds)
  const handleBackgroundImageChange = useCallback((url: string) => {
    const newBackground = { type: 'image' as const, value: url };
    setBackground(newBackground);
    broadcastBackground(newBackground);
  }, [setBackground, broadcastBackground]);

  // Handler for background color change
  const handleBackgroundColorChange = useCallback((color: string) => {
    const newBackground = { type: 'color' as const, value: color };
    setBackground(newBackground);
    broadcastBackground(newBackground);
  }, [setBackground, broadcastBackground]);

  // Handler for background image upload (placeholder - needs storage integration)
  const handleBackgroundImageUpload = useCallback(async (file: File) => {
    // TODO: Upload to Firebase Storage and get URL
    // For now, create a local URL for preview
    const url = URL.createObjectURL(file);
    setBackground({ type: 'image', value: url });
  }, [setBackground]);

  // Create effective template: layout from selected template + independent background
  const effectiveTemplate = useMemo(() => {
    if (!selectedTemplate) return null;
    // Always use the independent background, ignore template's background
    return {
      ...selectedTemplate,
      background: background,
    };
  }, [selectedTemplate, background]);

  // Fetch session and webinar data
  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) return;

      try {
        const sessionData = await webinarSessionsClient.getSessionById(sessionId);
        setSession(sessionData);

        // Initialize recording state from session
        if (sessionData) {
          setRecordingSegments(sessionData.recordingSegments || []);
          setCurrentSegmentNumber(sessionData.recordingSegments?.length || 0);
          setIsRecording(sessionData.isRecording || false);
          setEgressId(sessionData.egressId || null);

          const webinarData = await webinarsClient.getWebinarById(sessionData.webinarId);
          setWebinar(webinarData);
        }
      } catch (err) {
        console.error('[WebinarStudio] Error fetching data:', err);
        setError(t('common.error', 'An error occurred'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [sessionId, t]);

  // Load saved media state from localStorage when session and user are available
  useEffect(() => {
    const key = getMediaStateKey();
    if (!key || mediaStatePhaseRef.current !== 'pending') return;

    try {
      const savedState = localStorage.getItem(key);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (typeof parsed.audioEnabled === 'boolean') {
          setIsAudioEnabled(parsed.audioEnabled);
        }
        if (typeof parsed.videoEnabled === 'boolean') {
          setIsVideoEnabled(parsed.videoEnabled);
        }
      }
    } catch (err) {
      console.error('[WebinarStudio] Error loading media state from localStorage:', err);
    }
    // Mark as loaded - will transition to ready on next render
    mediaStatePhaseRef.current = 'loaded';
  }, [getMediaStateKey]);

  // Transition from 'loaded' to 'ready' after state updates are applied
  useEffect(() => {
    if (mediaStatePhaseRef.current === 'loaded') {
      // Use setTimeout to ensure state updates have been applied
      const timer = setTimeout(() => {
        mediaStatePhaseRef.current = 'ready';
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAudioEnabled, isVideoEnabled]);

  // Save media state to localStorage whenever it changes (only after ready)
  // Uses requestIdleCallback to avoid blocking UI
  useEffect(() => {
    const key = getMediaStateKey();
    // Only save when fully initialized and ready
    if (!key || mediaStatePhaseRef.current !== 'ready') return;

    // Capture current values for the async save
    const audioState = isAudioEnabled;
    const videoState = isVideoEnabled;

    // Use requestIdleCallback for non-blocking save, fallback to setTimeout
    const saveInBackground = () => {
      try {
        const state = {
          audioEnabled: audioState,
          videoEnabled: videoState,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(state));
      } catch (err) {
        console.error('[WebinarStudio] Error saving media state:', err);
      }
    };

    // Schedule save when browser is idle
    if ('requestIdleCallback' in window) {
      const idleId = requestIdleCallback(saveInBackground, { timeout: 1000 });
      return () => cancelIdleCallback(idleId);
    } else {
      const timerId = setTimeout(saveInBackground, 0);
      return () => clearTimeout(timerId);
    }
  }, [getMediaStateKey, isAudioEnabled, isVideoEnabled]);

  // Request media permissions and start local preview
  useEffect(() => {
    const requestMediaPermissions = async () => {
      // Check if mediaDevices API is available (requires HTTPS or localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMediaPermissions({
          video: false,
          audio: false,
          requested: true,
          error: t('webinars.error.mediaNotSupported', 'Media devices not supported. Make sure you are using HTTPS.'),
        });
        return;
      }

      // Stop existing stream before getting a new one
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Detect if we're on a mobile/tablet device
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Try different constraint strategies
      const constraintStrategies: MediaStreamConstraints[] = [];

      // Strategy 1: Use specific device IDs if selected (use 'ideal' instead of 'exact' for mobile compatibility)
      if (selectedVideoDeviceId || selectedAudioDeviceId) {
        constraintStrategies.push({
          video: selectedVideoDeviceId
            ? { deviceId: isMobileDevice ? { ideal: selectedVideoDeviceId } : { exact: selectedVideoDeviceId } }
            : true,
          audio: selectedAudioDeviceId
            ? { deviceId: isMobileDevice ? { ideal: selectedAudioDeviceId } : { exact: selectedAudioDeviceId } }
            : true,
        });
      }

      // Strategy 2: For mobile, use facingMode for front camera
      if (isMobileDevice) {
        constraintStrategies.push({
          video: { facingMode: 'user' },
          audio: true,
        });
      }

      // Strategy 3: Simple true/true - most compatible
      constraintStrategies.push({
        video: true,
        audio: true,
      });

      // Strategy 4: Video only (in case audio is causing issues)
      constraintStrategies.push({
        video: isMobileDevice ? { facingMode: 'user' } : true,
        audio: false,
      });

      // Strategy 5: Audio only (in case video is causing issues)
      constraintStrategies.push({
        video: false,
        audio: true,
      });

      let lastError: any = null;
      let stream: MediaStream | null = null;

      // Try each strategy until one works
      for (const constraints of constraintStrategies) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err: any) {
          lastError = err;
          // Continue to next strategy
        }
      }

      if (stream) {
        localStreamRef.current = stream;
        const hasVideo = stream.getVideoTracks().length > 0;
        const hasAudio = stream.getAudioTracks().length > 0;

        setMediaPermissions({
          video: hasVideo,
          audio: hasAudio,
          requested: true,
          error: (!hasVideo || !hasAudio)
            ? t('webinars.error.partialMedia', `Partial access: ${hasVideo ? '' : 'No camera. '}${hasAudio ? '' : 'No microphone.'}`)
            : null,
        });

        // Show local preview
        if (localVideoRef.current && hasVideo) {
          localVideoRef.current.srcObject = stream;
        }
      } else {
        // All strategies failed
        console.error('[WebinarStudio] All media permission strategies failed:', lastError);
        let errorMsg = t('webinars.error.mediaPermissionDenied', 'Camera/microphone access denied');

        if (lastError) {
          if (lastError.name === 'NotFoundError' || lastError.name === 'DevicesNotFoundError') {
            errorMsg = t('webinars.error.noMediaDevices', 'No camera or microphone found on this device');
          } else if (lastError.name === 'NotAllowedError' || lastError.name === 'PermissionDeniedError') {
            errorMsg = t('webinars.error.mediaPermissionDenied', 'Camera/microphone access denied. Please check your browser permissions and try again.');
          } else if (lastError.name === 'NotReadableError' || lastError.name === 'TrackStartError') {
            errorMsg = t('webinars.error.mediaInUse', 'Camera or microphone is being used by another application. Please close other apps and try again.');
          } else if (lastError.name === 'OverconstrainedError') {
            errorMsg = t('webinars.error.mediaOverconstrained', 'Could not find a camera matching the requirements. Try refreshing the page.');
          } else if (lastError.name === 'AbortError') {
            errorMsg = t('webinars.error.mediaAborted', 'Media access was interrupted. Please try again.');
          } else if (lastError.name === 'SecurityError') {
            errorMsg = t('webinars.error.mediaSecurityError', 'Media access blocked due to security settings. Make sure you are using HTTPS.');
          } else if (lastError.name === 'TypeError') {
            errorMsg = t('webinars.error.mediaTypeError', 'Invalid media configuration. Please refresh the page and try again.');
          }
        }

        // Add device-specific hints for mobile
        if (isMobileDevice) {
          errorMsg += ' ' + t('webinars.error.mobileHint', 'On mobile: Check that no other app is using the camera, and that browser permissions are enabled in Settings > Apps > Chrome > Permissions.');
        }

        setMediaPermissions({
          video: false,
          audio: false,
          requested: true,
          error: errorMsg,
        });
      }
    };

    // Only request media permissions for local preview if:
    // 1. User is a coach
    // 2. Permissions haven't been requested OR device selection changed
    // 3. Session is NOT in planning/live mode (LiveKit will handle media in those cases)
    // On mobile, this is critical to avoid camera conflicts with LiveKit
    const isActiveSession = session?.status === 'planning' || session?.status === 'live';
    const shouldRequestMedia = isCoach && (!mediaPermissions.requested || (selectedVideoDeviceId || selectedAudioDeviceId)) && !isActiveSession;

    if (shouldRequestMedia) {
      requestMediaPermissions();
    }

    // Cleanup on unmount
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCoach, mediaPermissions.requested, selectedVideoDeviceId, selectedAudioDeviceId, session?.status, t]);

  // Get LiveKit token when session is live or planning (with session conflict check)
  useEffect(() => {
    const getToken = async () => {
      if (!sessionId || !currentUser || !isCoach) return;
      // Get token for both planning (green room) and live states
      if (session?.status !== 'live' && session?.status !== 'planning') return;
      // Wait for webinar and coachProfile to load so we can determine host/speaker role
      if (!webinar || !coachProfile) return;
      // Don't get a new token if we already have one (avoid unnecessary reconnections)
      if (livekitToken) return;

      try {
        // First check if user has an active session on another device
        const conflictCheck = await webinarLiveClient.checkSessionConflict(sessionId);

        if (conflictCheck.hasConflict && conflictCheck.existingSession) {
          // Show conflict dialog
          setSessionConflict(conflictCheck);
          setShowConflictDialog(true);
          return;
        }

        // No conflict - register session and get token
        // WebinarStudio is only for producers (host, shadow, speakers)
        // Pass the correct role flags for proper permissions
        await webinarLiveClient.registerActiveSession(sessionId, isSessionHost || isShadowHost);
        const response = await webinarLiveClient.getJoinToken(sessionId, {
          isHost: isSessionHost,
          isShadow: isShadowHost,
          isSpeaker: isGuestSpeaker && !isAdminSpeaker, // Regular speaker (not admin)
          isAdminSpeaker: isAdminSpeaker, // Admin speaker with elevated permissions
        });
        // Stop local preview stream BEFORE setting token (so LiveKit can access the camera)
        // This is especially important on mobile where only one stream can access the camera
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
          localStreamRef.current = null;
          // Also clear the video element
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
          }
        }

        // On mobile, add a small delay to ensure the camera is fully released
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          // Log to debug panel
          const timestamp = new Date().toLocaleTimeString();
          setDebugLogs(prev => [`[${timestamp}] Camera released, setting token...`, ...prev.slice(0, 19)]);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        setLivekitToken(response.token);
        setLivekitServerUrl(response.serverUrl);

        // Log token received for mobile debugging
        if (isMobile) {
          const timestamp = new Date().toLocaleTimeString();
          setDebugLogs(prev => [`[${timestamp}] LiveKit token SET - connecting...`, ...prev.slice(0, 19)]);
        }
      } catch (err) {
        console.error('[WebinarStudio] Error getting LiveKit token:', err);
        setError(t('webinars.error.tokenFailed', 'Failed to get stream token'));
      }
    };
    getToken();
  }, [sessionId, currentUser, isCoach, session?.status, webinar, coachProfile, isSessionHost, isShadowHost, isGuestSpeaker, isAdminSpeaker, livekitToken, t]);

  // Handle session takeover (for hosts)
  const handleTakeoverSession = useCallback(async () => {
    if (!sessionId) return;

    setIsTakingOver(true);
    try {
      const response = await webinarLiveClient.takeoverSession(sessionId, true);
      if (response.success && response.token) {
        // Stop local preview stream BEFORE setting token
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
          localStreamRef.current = null;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
          }
        }

        // On mobile, add a small delay to ensure the camera is fully released
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        setLivekitToken(response.token);
        setLivekitServerUrl(response.serverUrl);
        setShowConflictDialog(false);
        setSessionConflict(null);
      } else {
        setError(t('webinars.error.takeoverFailed', 'Failed to switch session'));
      }
    } catch (err) {
      console.error('[WebinarStudio] Failed to takeover session:', err);
      setError(t('webinars.error.takeoverFailed', 'Failed to switch session'));
    } finally {
      setIsTakingOver(false);
    }
  }, [sessionId, t]);

  // Handle cancel from conflict dialog
  const handleCancelConflict = useCallback(() => {
    setShowConflictDialog(false);
    navigate('/coach/webinars');
  }, [navigate]);

  // Heartbeat to keep session active and detect if kicked
  useEffect(() => {
    if (!livekitToken || !sessionId) return;

    const sendHeartbeat = async () => {
      try {
        const response = await webinarLiveClient.sendSessionHeartbeat(sessionId);
        if (response.kicked) {
          // Session was taken over by another device
          setLivekitToken(null);
          setLivekitServerUrl(null);
          setShowKickedDialog(true);
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
          }
        }
      } catch (err) {
        console.error('[WebinarStudio] Heartbeat error:', err);
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
  }, [livekitToken, sessionId]);

  // Cache Firebase auth token for use in synchronous beforeunload handler
  const authTokenRef = useRef<string | null>(null);
  useEffect(() => {
    if (livekitToken && currentUser) {
      currentUser.getIdToken().then((token) => {
        authTokenRef.current = token;
      });
    } else {
      authTokenRef.current = null;
    }
  }, [livekitToken, currentUser]);

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

  // Handle kicked dialog close
  const handleKickedDialogClose = useCallback(() => {
    setShowKickedDialog(false);
    navigate('/coach/webinars');
  }, [navigate]);

  // Load initial chat, Q&A, and poll data (individually to handle missing indexes gracefully)
  useEffect(() => {
    const loadInitialData = async () => {
      if (!sessionId) return;

      // Load chat history
      try {
        const chat = await webinarLiveClient.getChatHistory(sessionId, 100);
        setChatMessages(chat);
      } catch (err) {
        setChatMessages([]);
      }

      // Load questions (may fail if index not created)
      try {
        const qs = await webinarLiveClient.getQuestions(sessionId);
        setQuestions(qs);
      } catch (err) {
        setQuestions([]);
      }

      // Load all polls (active and history) - drafts loaded via WebSocket after connection
      try {
        const allPolls = await webinarLiveClient.getAllPolls(sessionId);
        const active = allPolls.find((p) => p.status === 'active');
        const closed = allPolls.filter((p) => p.status === 'closed');
        setActivePoll(active || null);
        setPollHistory(closed);
      } catch {
        // Poll loading failed silently
      }
    };
    loadInitialData();
  }, [sessionId]);

  // Load draft polls via WebSocket after connection
  useEffect(() => {
    if (!socketConnected || !sessionId) return;

    const loadDrafts = async () => {
      try {
        const drafts = await getDraftPolls();
        setDraftPolls(drafts);
      } catch {
        // Draft poll loading failed silently
      }
    };
    loadDrafts();
  }, [socketConnected, sessionId, getDraftPolls]);

  // Load giveaway state when navigating to attendees tab or on initial connect
  useEffect(() => {
    if (!socketConnected || activeSidePanelTab !== 'attendees') return;

    const loadGiveawayState = async () => {
      try {
        await getGiveawayState();
      } catch {
        // Giveaway state loading failed silently
      }
    };
    loadGiveawayState();
  }, [socketConnected, activeSidePanelTab, getGiveawayState]);

  // Start planning mode (green room for speakers)
  const handleStartPlanning = useCallback(async () => {
    if (!sessionId) return;
    try {
      await webinarSessionsClient.updateSessionStatus(sessionId, 'planning');
      setSession((prev) => (prev ? { ...prev, status: 'planning' } : null));
    } catch (err) {
      console.error('[WebinarStudio] Error starting planning:', err);
      setError(t('webinars.error.planningFailed', 'Failed to start planning mode'));
    }
  }, [sessionId, t]);

  // Cancel planning and go back to scheduled
  const handleCancelPlanning = useCallback(async () => {
    if (!sessionId) return;
    try {
      // Disconnect from LiveKit
      await webinarLiveClient.disconnectSession(sessionId);
      setLivekitToken(null);
      setLivekitServerUrl(null);

      // Reset media state so buttons reflect actual muted state
      setIsAudioEnabled(false);
      setIsVideoEnabled(false);
      setIsScreenShareEnabled(false);

      // Update status to scheduled
      await webinarSessionsClient.updateSessionStatus(sessionId, 'scheduled');
      setSession((prev) => (prev ? { ...prev, status: 'scheduled' } : null));
    } catch (err) {
      console.error('[WebinarStudio] Error canceling planning:', err);
      setError(t('webinars.error.cancelPlanningFailed', 'Failed to cancel planning'));
    }
  }, [sessionId, t]);

  // Start session (go live)
  const handleStartSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      await webinarSessionsClient.updateSessionStatus(sessionId, 'live');
      setSession((prev) => (prev ? { ...prev, status: 'live' } : null));
    } catch (err) {
      console.error('[WebinarStudio] Error starting session:', err);
      setError(t('webinars.error.startFailed', 'Failed to start session'));
    }
  }, [sessionId, t]);

  // Stop broadcast (go to stopped state, can restart)
  const handleStopBroadcast = useCallback(async () => {
    if (!sessionId) return;
    try {
      // Stop recording if active
      if (isRecording && egressId && startSegmentIndex !== null) {
        await webinarLiveClient.stopRecording(sessionId, egressId, startSegmentIndex);
        setIsRecording(false);
        setEgressId(null);
        setStartSegmentIndex(null);
      }

      // Change status to planning (green room) - keeps LiveKit connected for hosts
      await webinarSessionsClient.updateSessionStatus(sessionId, 'planning');
      setSession((prev) => (prev ? { ...prev, status: 'planning' } : null));
      setShowStopLiveDialog(false);
    } catch (err) {
      console.error('[WebinarStudio] Error stopping broadcast:', err);
      setError(t('webinars.error.stopBroadcastFailed', 'Failed to stop broadcast'));
    }
  }, [sessionId, isRecording, egressId, startSegmentIndex, t]);

  // Restart from stopped to planning
  const handleRestartToPlanning = useCallback(async () => {
    if (!sessionId) return;
    try {
      await webinarSessionsClient.updateSessionStatus(sessionId, 'planning');
      setSession((prev) => (prev ? { ...prev, status: 'planning' } : null));
    } catch (err) {
      console.error('[WebinarStudio] Error restarting to planning:', err);
      setError(t('webinars.error.restartFailed', 'Failed to restart session'));
    }
  }, [sessionId, t]);

  // Restart from stopped to live
  const handleRestartToLive = useCallback(async () => {
    if (!sessionId) return;
    try {
      await webinarSessionsClient.updateSessionStatus(sessionId, 'live');
      setSession((prev) => (prev ? { ...prev, status: 'live' } : null));
    } catch (err) {
      console.error('[WebinarStudio] Error restarting to live:', err);
      setError(t('webinars.error.restartFailed', 'Failed to restart session'));
    }
  }, [sessionId, t]);

  // Complete/End session (permanent)
  const handleEndSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      // Stop recording if active
      if (isRecording && egressId && startSegmentIndex !== null) {
        await webinarLiveClient.stopRecording(sessionId, egressId, startSegmentIndex);
      }

      await webinarSessionsClient.updateSessionStatus(sessionId, 'ended');
      navigate('/coach/webinars');
    } catch (err) {
      console.error('[WebinarStudio] Error ending session:', err);
      setError(t('webinars.error.endFailed', 'Failed to end session'));
    }
  }, [sessionId, isRecording, egressId, startSegmentIndex, navigate, t]);

  // Recording controls - multi-segment support (HLS-based)
  const handleStartRecording = useCallback(async () => {
    if (!sessionId || isRecordingLoading || recordingOperationInProgress.current) return;
    recordingOperationInProgress.current = true;
    setIsRecordingLoading(true);
    try {
      const response = await webinarLiveClient.startRecording(sessionId);
      const newEgressId = response.egressId;
      const segmentNumber = currentSegmentNumber + 1;
      const segmentId = `seg-${Date.now()}-${segmentNumber}`;

      // Store the HLS segment index for later concatenation
      setStartSegmentIndex(response.startSegmentIndex);

      // Create new segment as plain object (Firestore requires plain objects)
      const newSegment = {
        id: segmentId,
        egressId: newEgressId,
        segmentNumber,
        startedAt: new Date().toISOString(),
        status: 'recording' as const,
        startSegmentIndex: response.startSegmentIndex,
      };

      // Create plain object array for Firestore (avoid prototype issues)
      const updatedSegments = [...recordingSegments, newSegment].map(seg => ({
        id: seg.id,
        egressId: seg.egressId,
        segmentNumber: seg.segmentNumber,
        startedAt: seg.startedAt,
        endedAt: seg.endedAt,
        status: seg.status,
        url: seg.url,
        path: seg.path,
        duration: seg.duration,
        startSegmentIndex: seg.startSegmentIndex,
      }));

      // Update local state
      setRecordingSegments(updatedSegments);
      setCurrentSegmentNumber(segmentNumber);
      setEgressId(newEgressId);
      setIsRecording(true);

      // Persist to Firestore (plain objects only)
      await webinarSessionsClient.updateSession(sessionId, {
        recordingSegments: updatedSegments,
        isRecording: true,
        egressId: newEgressId,
        recordingStatus: 'recording',
      });

      // Update session state
      setSession((prev) => prev ? {
        ...prev,
        recordingSegments: updatedSegments,
        isRecording: true,
        egressId: newEgressId,
        recordingStatus: 'recording',
      } : null);
    } catch (err) {
      console.error('[WebinarStudio] Error starting recording:', err);
      setError(t('webinars.error.recordingFailed', 'Failed to start recording'));
    } finally {
      setIsRecordingLoading(false);
      recordingOperationInProgress.current = false;
    }
  }, [sessionId, currentSegmentNumber, recordingSegments, isRecordingLoading, t]);

  const handleStopRecording = useCallback(async () => {
    if (!sessionId || !egressId || startSegmentIndex === null || isRecordingLoading || recordingOperationInProgress.current) return;
    recordingOperationInProgress.current = true;
    setIsRecordingLoading(true);

    // Helper to update state on error
    const updateRecordingStateFailed = async () => {
      const updatedSegments = recordingSegments.map(seg => ({
        id: seg.id,
        egressId: seg.egressId,
        segmentNumber: seg.segmentNumber,
        startedAt: seg.startedAt,
        endedAt: seg.egressId === egressId ? new Date().toISOString() : seg.endedAt,
        status: (seg.egressId === egressId ? 'failed' : seg.status) as 'recording' | 'processing' | 'available' | 'failed',
        url: seg.url,
        path: seg.path,
        duration: seg.duration,
        startSegmentIndex: seg.startSegmentIndex,
      }));

      setRecordingSegments(updatedSegments);
      setIsRecording(false);
      setEgressId(null);
      setStartSegmentIndex(null);

      await webinarSessionsClient.updateSession(sessionId, {
        recordingSegments: updatedSegments,
        isRecording: false,
        egressId: undefined,
        recordingStatus: 'failed',
      });

      setSession((prev) => prev ? {
        ...prev,
        recordingSegments: updatedSegments,
        isRecording: false,
        egressId: undefined,
        recordingStatus: 'failed',
      } : null);
    };

    try {
      // Stop recording — backend concatenates HLS segments and uploads to GCS
      const response = await webinarLiveClient.stopRecording(sessionId, egressId, startSegmentIndex);

      // Update segment directly to 'available' (no 'processing' step with HLS concat)
      const updatedSegments = recordingSegments.map(seg => ({
        id: seg.id,
        egressId: seg.egressId,
        segmentNumber: seg.segmentNumber,
        startedAt: seg.startedAt,
        endedAt: seg.egressId === egressId ? new Date().toISOString() : seg.endedAt,
        status: (seg.egressId === egressId ? 'available' : seg.status) as 'recording' | 'processing' | 'available' | 'failed',
        url: seg.egressId === egressId ? response.url : seg.url,
        path: seg.egressId === egressId ? response.path : seg.path,
        duration: seg.egressId === egressId ? response.duration : seg.duration,
        startSegmentIndex: seg.startSegmentIndex,
      }));

      setRecordingSegments(updatedSegments);
      setIsRecording(false);
      setEgressId(null);
      setStartSegmentIndex(null);

      await webinarSessionsClient.updateSession(sessionId, {
        recordingSegments: updatedSegments,
        isRecording: false,
        egressId: undefined,
        recordingStatus: 'available',
      });

      setSession((prev) => prev ? {
        ...prev,
        recordingSegments: updatedSegments,
        isRecording: false,
        egressId: undefined,
        recordingStatus: 'available',
      } : null);
    } catch (err) {
      console.error('[WebinarStudio] Error stopping recording:', err);
      await updateRecordingStateFailed();
      setError(t('webinars.error.recordingStopFailed', 'Failed to stop recording'));
    } finally {
      setIsRecordingLoading(false);
      recordingOperationInProgress.current = false;
    }
  }, [sessionId, egressId, startSegmentIndex, recordingSegments, isRecordingLoading, t]);

  // Media toggle handlers (for LiveKitRoom)
  const handleToggleAudio = useCallback(() => {
    // If not on scene or stream is paused, don't allow toggling - user is muted
    if (!isOnScene || isPaused) {
      return;
    }
    setIsAudioEnabled((prev) => {
      const newValue = !prev;
      // Update desired ref so we remember preference when coming back on scene
      desiredAudioEnabledRef.current = newValue;
      return newValue;
    });
  }, [isOnScene, isPaused]);

  const handleToggleVideo = useCallback(() => {
    // If not on scene or stream is paused, don't allow toggling - user is muted
    if (!isOnScene || isPaused) {
      return;
    }
    setIsVideoEnabled((prev) => {
      const newValue = !prev;
      // Update desired ref so we remember preference when coming back on scene
      desiredVideoEnabledRef.current = newValue;
      return newValue;
    });
  }, [isOnScene, isPaused]);

  const handleToggleScreenShare = useCallback(() => {
    // If already sharing, just stop
    if (isScreenShareEnabled) {
      setIsScreenShareEnabled(false);
      return;
    }

    // Block if presentation sharing is active
    if (isPresentationSharing) {
      toast({
        title: t('webinars.presentation.title', 'Presentation'),
        description: t('webinars.presentation.stopFirst', 'Stop presentation sharing first'),
        variant: 'destructive',
      });
      return;
    }

    // Screen sharing is NOT supported on mobile/tablet devices
    // Even if getDisplayMedia exists, it typically throws DeviceUnsupportedError
    if (isMobileDevice) {
      toast({
        title: t('webinars.screenShareNotSupported', 'Screen Sharing Not Supported'),
        description: t('webinars.screenShareNotSupportedMobile', 'Screen sharing is not available on tablets and mobile devices. Please use a desktop or laptop computer to share your screen.'),
        variant: 'destructive',
      });
      return;
    }

    // Desktop - proceed with screen share
    setIsScreenShareEnabled(true);
  }, [isMobileDevice, isScreenShareEnabled, isPresentationSharing, toast, t]);

  // Pause/Resume all media streams
  const handleTogglePause = useCallback(() => {
    // If not on scene, don't allow pausing
    if (!isOnScene) {
      return;
    }
    setIsPaused((prev) => {
      const newPaused = !prev;
      if (newPaused) {
        // Pausing: disable audio/video (refs are synced via useEffect, so they already have current state)
        setIsAudioEnabled(false);
        setIsVideoEnabled(false);
      } else {
        // Resuming: set flag to prevent sync useEffect from overwriting refs
        isRestoringFromPauseRef.current = true;
        // Restore the saved state
        setIsAudioEnabled(prePauseAudioEnabledRef.current);
        setIsVideoEnabled(prePauseVideoEnabledRef.current);
        desiredAudioEnabledRef.current = prePauseAudioEnabledRef.current;
        desiredVideoEnabledRef.current = prePauseVideoEnabledRef.current;
        // Clear restoring flag after a tick
        setTimeout(() => {
          isRestoringFromPauseRef.current = false;
        }, 100);
      }
      // Notify clients via WebSocket
      socketTogglePause(newPaused);
      return newPaused;
    });
  }, [socketTogglePause, isOnScene]);

  // Leave studio without ending session
  const handleLeaveWithoutEnding = useCallback(() => {
    // Stop local streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    navigate('/coach/webinars');
  }, [navigate]);

  // Create poll handler (supports draft mode via WebSocket)
  const handleCreatePoll = useCallback(
    async (question: string, options: string[], saveAsDraft: boolean = false) => {
      if (saveAsDraft) {
        // Create draft poll via WebSocket
        const poll = await createDraftPoll(question, options);
        if (poll) {
          setDraftPolls((prev) => [poll, ...prev]);
        }
      } else {
        // Create and broadcast live poll via WebSocket
        createPoll(question, options);
      }
    },
    [createPoll, createDraftPoll]
  );

  // Activate a draft poll via WebSocket
  const handleActivatePoll = useCallback(
    (pollId: string) => {
      // Launch the draft poll - this will broadcast to all clients
      launchPoll(pollId);
      // Move from drafts to active locally
      const draft = draftPolls.find((p) => p.id === pollId);
      if (draft) {
        setDraftPolls((prev) => prev.filter((p) => p.id !== pollId));
        setActivePoll({ ...draft, status: 'active' });
      }
    },
    [draftPolls, launchPoll]
  );

  // Delete a draft poll via WebSocket
  const handleDeletePoll = useCallback(
    async (pollId: string) => {
      const deleted = await deleteDraftPoll(pollId);
      if (deleted) {
        setDraftPolls((prev) => prev.filter((p) => p.id !== pollId));
      }
    },
    [deleteDraftPoll]
  );

  // Log initial debug info on mount (for mobile debugging)
  useEffect(() => {
    if (isMobileDevice) {
      addDebugLog(`Mobile detected: ${navigator.userAgent.slice(0, 50)}...`);
      addDebugLog(`Audio enabled: ${isAudioEnabled}, Video enabled: ${isVideoEnabled}`);
      addDebugLog(`LiveKit token: ${livekitToken ? 'present' : 'missing'}`);
      addDebugLog(`LiveKit URL: ${livekitServerUrl ? 'present' : 'missing'}`);
    }
  }, [isMobileDevice, addDebugLog]); // Only run once when isMobileDevice is determined

  // Memoize roomOptions to prevent LiveKit reconnection on state changes
  // Quality changes are handled separately through the LiveKit API
  // IMPORTANT: This must be before any early returns to follow Rules of Hooks
  const roomOptions = useMemo<RoomOptions>(() => {
    const qualityConfig = VIDEO_QUALITY_PRESETS[transmitQuality];

    // For mobile devices, use facingMode instead of deviceId for better compatibility
    // Also use lower resolution on mobile for better performance
    const mobileResolution = {
      width: Math.min(qualityConfig?.width || 1280, 1280),
      height: Math.min(qualityConfig?.height || 720, 720),
    };

    // Build video capture defaults based on device type
    const videoCaptureDefaults: Record<string, unknown> = {
      resolution: isMobileDevice ? mobileResolution : {
        width: qualityConfig?.width || 1280,
        height: qualityConfig?.height || 720,
      },
      frameRate: isMobileDevice ? Math.min(qualityConfig?.frameRate || 30, 30) : (qualityConfig?.frameRate || 30),
    };

    // Use initial device IDs from refs (stable) for roomOptions
    // Live device switching is handled by LiveKitDeviceSwitcher via room.switchActiveDevice()
    const videoDeviceId = initialVideoDeviceRef.current;
    const audioDeviceId = initialAudioDeviceRef.current;

    // On mobile, prefer facingMode over deviceId for better compatibility
    if (isMobileDevice) {
      // Use facingMode for front camera on mobile
      videoCaptureDefaults.facingMode = 'user';
      // Only add deviceId as a hint (not exact) if one is selected
      if (videoDeviceId) {
        videoCaptureDefaults.deviceId = videoDeviceId;
      }
    } else {
      // On desktop, use deviceId if selected
      if (videoDeviceId) {
        videoCaptureDefaults.deviceId = videoDeviceId;
      }
    }

    // Build audio capture defaults
    const audioCaptureDefaults: Record<string, unknown> = {
      echoCancellation,
      noiseSuppression,
      autoGainControl,
      channelCount: 1,        // Mono is better for voice
      sampleRate: 48000,      // 48kHz - WebRTC standard
    };

    // Add deviceId for audio if selected
    if (audioDeviceId) {
      audioCaptureDefaults.deviceId = audioDeviceId;
    }

    return {
      videoCaptureDefaults,
      audioCaptureDefaults,
      // Adaptive streaming - important for mobile
      adaptiveStream: true,
      // Dynacast for efficient bandwidth usage
      dynacast: true,
      // Publish defaults for video and audio encoding
      publishDefaults: {
        videoEncoding: {
          maxBitrate: isMobileDevice
            ? Math.min(qualityConfig?.bitrate || 3000000, 2500000) // Cap at 2.5 Mbps on mobile
            : (qualityConfig?.bitrate || 3000000),
          maxFramerate: isMobileDevice
            ? Math.min(qualityConfig?.frameRate || 30, 30)
            : (qualityConfig?.frameRate || 30),
        },
        // Enable simulcast for adaptive quality to viewers
        simulcast: true,
        // Screen share encoding for high quality screen sharing
        screenShareEncoding: {
          maxBitrate: isMobileDevice ? 5000000 : 10000000, // Lower for mobile
          maxFramerate: 30,
        },
        // Audio publish settings - IMPORTANT for quality
        audioBitrate,           // Configurable bitrate (default 64kbps)
        dtx: dtxEnabled,        // DTX off by default - prevents choppy audio
        red: redEnabled,        // RED on by default - helps with packet loss
      },
    };
  // Only recreate when audio processing settings change, NOT on device or quality change
  // Device switching during active session is handled by LiveKitDeviceSwitcher
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [echoCancellation, noiseSuppression, autoGainControl, dtxEnabled, redEnabled, audioBitrate, isMobileDevice]);

  // Keep screen awake during webinar (for host)
  // Must be before early returns to follow Rules of Hooks
  const isSessionActive = session?.status === 'planning' || session?.status === 'live';
  useWakeLock(!!isSessionActive);

  // Show in system media controls (lock screen, notification panel)
  useMediaSession(!!isSessionActive, {
    title: webinar?.name || 'Live Webinar',
    artist: 'BeWonderMe Studio',
    album: 'Webinar Hosting',
    artwork: webinar?.coverImage
      ? [{ src: webinar.coverImage, sizes: '512x512', type: 'image/jpeg' }]
      : undefined,
  });

  // Loading state
  if (isLoading || coachLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Access denied if not a coach
  if (!isCoach) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive" />
        <h2 className="text-2xl font-bold mb-2">{t('coach.accessDenied', 'Access Denied')}</h2>
        <p className="text-muted-foreground">{t('coach.notACoach', 'You need to be a coach to access this page.')}</p>
        <Button className="mt-6" onClick={() => navigate('/')}>
          {t('common.goHome', 'Go Home')}
        </Button>
      </div>
    );
  }

  // Session not found
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive" />
        <h2 className="text-2xl font-bold mb-2">{t('webinars.error.sessionNotFound', 'Session Not Found')}</h2>
        <p className="text-muted-foreground">{t('webinars.error.sessionNotFoundDesc', 'The webinar session could not be found.')}</p>
        <Button className="mt-6" onClick={() => navigate('/coach/webinars')}>
          {t('webinars.backToWebinars', 'Back to Webinars')}
        </Button>
      </div>
    );
  }

  // Session status helpers
  const isScheduled = session?.status === 'scheduled';
  const isPlanning = session?.status === 'planning';
  const isLive = session?.status === 'live';
  const isStopped = session?.status === 'stopped';
  const isActiveSession = isPlanning || isLive; // States where LiveKit should be connected

  return (
    <>
      {/*
          IMPORTANT for mobile compatibility:
          - Connect with audio/video FALSE initially
          - The LiveKitMediaController will enable them AFTER connection
          - This avoids "DeviceInUse" errors on mobile where only one stream can exist
          - See: https://github.com/livekit/client-sdk-js/issues/957
        */}
        <LiveKitRoom
        serverUrl={livekitServerUrl || ''}
        token={livekitToken || ''}
        connect={!!livekitToken && !!livekitServerUrl && isActiveSession}
        audio={false}
        video={false}
        options={roomOptions}
        onError={(error) => {
          console.error('[WebinarStudio] LiveKit room error:', error);
          // Show toast for mobile debugging
          if (isMobileDevice) {
            toast({
              title: t('webinars.error.livekitError', 'Connection Error'),
              description: `${error.message || 'Failed to connect to video room'}. ${t('webinars.error.mobileHintShort', 'Check camera permissions in device settings.')}`,
              variant: 'destructive',
            });
          }
        }}
        onMediaDeviceFailure={(error) => {
          console.error('[WebinarStudio] Media device failure:', error);
          toast({
            title: t('webinars.error.mediaDeviceFailure', 'Camera/Microphone Error'),
            description: isMobileDevice
              ? t('webinars.error.mediaDeviceFailureMobile', 'Could not access camera or microphone. Make sure no other app is using them and permissions are granted in Settings > Apps > Chrome > Permissions.')
              : t('webinars.error.mediaDeviceFailureDesktop', 'Could not access camera or microphone. Please check your device settings and try again.'),
            variant: 'destructive',
          });
        }}
      >
        <RoomAudioRenderer />
        <LiveKitMediaController
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isScreenShareEnabled={isScreenShareEnabled}
          onAudioChange={setIsAudioEnabled}
          onVideoChange={setIsVideoEnabled}
          onScreenShareChange={setIsScreenShareEnabled}
          isPresentationSharing={isPresentationSharing}
          isMobile={isMobileDevice}
          onDebugLog={addDebugLog}
          rnnoiseEnabled={rnnoiseEnabled}
          processAudioTrack={rnnoiseProcessTrack}
          cleanupRnnoise={rnnoiseCleanup}
          onMediaError={(error, type) => {
            console.error(`[WebinarStudio] Media error (${type}):`, error);
            const typeLabels = {
              audio: t('webinars.microphone', 'Microphone'),
              video: t('webinars.camera', 'Camera'),
              screen: t('webinars.screenShare', 'Screen Share'),
            };
            toast({
              title: t('webinars.error.mediaAccessFailed', 'Media Access Failed'),
              description: isMobileDevice
                ? t('webinars.error.mediaAccessFailedMobile', `Could not access ${typeLabels[type]}. On mobile devices: 1) Close other apps using the camera 2) Go to Settings > Apps > Chrome > Permissions and enable Camera/Microphone 3) Refresh the page`, { device: typeLabels[type] })
                : t('webinars.error.mediaAccessFailedDesktop', `Could not access ${typeLabels[type]}. Please check your device permissions and try again.`, { device: typeLabels[type] }),
              variant: 'destructive',
            });
          }}
        />
        <LiveKitDeviceSwitcher
          videoDeviceId={selectedVideoDeviceId}
          audioDeviceId={selectedAudioDeviceId}
        />

        <div className={`h-screen flex flex-col overflow-hidden ${isDark ? 'bg-gradient-to-b from-[#091714] via-[#0d1f1c] to-[#091714]' : 'bg-slate-100'}`}>
          {/* Mobile Debug Panel - Floating */}
          {isMobileDevice && (
            <div className="fixed bottom-20 right-2 z-50">
              {showDebugPanel ? (
                <div className="bg-black/90 border border-yellow-500/50 rounded-lg p-2 w-72 max-h-48 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-yellow-400 text-xs font-bold">🔧 Debug Logs</span>
                    <button
                      onClick={() => setShowDebugPanel(false)}
                      className="text-yellow-400 hover:text-yellow-200 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {debugLogs.length === 0 ? (
                      <p className="text-gray-400 text-[10px]">Waiting for logs...</p>
                    ) : (
                      debugLogs.map((log, i) => (
                        <p key={i} className="text-[10px] text-green-300 font-mono leading-tight break-all">
                          {log}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDebugPanel(true)}
                  className="bg-yellow-500/20 border border-yellow-500/50 rounded-full p-2 text-yellow-400"
                >
                  🔧
                </button>
              )}
            </div>
          )}

          {/* Header - Compact single line */}
          <div className={`flex-shrink-0 border-b z-10 ${isDark ? 'border-[#5eb8a8]/30 bg-[#0d1f1c]/80 backdrop-blur-md' : 'border-slate-200 bg-white shadow-sm'}`}>
            <div className="px-2 sm:px-3 py-1 sm:py-1.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Button variant="ghost" size="icon" onClick={() => navigate('/coach/webinars')} className={`flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 ${isDark ? 'text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'text-slate-700 hover:bg-slate-100'}`}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1.5 min-w-0">
                  <h1 className="font-semibold text-sm truncate" style={{ color: isDark ? '#FFFFFF' : '#1E293B' }}>{webinar?.name || t('webinars.webinar', 'Webinar')}</h1>
                  <span className={`text-xs hidden sm:inline flex-shrink-0 ${isDark ? 'text-[#e8f5f0]/40' : 'text-slate-400'}`}>—</span>
                  <span className={`text-xs hidden sm:inline flex-shrink-0 ${isDark ? 'text-[#e8f5f0]/40' : 'text-slate-400'}`}>
                    {t('coach.studio.title', 'Webinar Studio')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                {/* Connection status - hide on very small screens */}
                <div className="hidden sm:block">
                  {socketConnected ? (
                    <Badge variant="outline" className="text-green-400 border-green-500/50 bg-green-500/10 text-xs">
                      {t('common.connected', 'Connected')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-400 border-yellow-500/50 bg-yellow-500/10 text-xs">
                      {t('common.connecting', 'Connecting...')}
                    </Badge>
                  )}
                </div>

                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className={`h-7 w-7 sm:h-8 sm:w-8 ${isDark ? 'text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                {/* Language selector */}
                <LanguageSwitcher
                  collapsed
                  variant="default"
                  textColor="white"
                  className="h-7 px-2"
                />

                {/* Session status badge - only non-live states (LIVE is shown on the video card) */}
                {isPlanning && (
                  <Badge className="bg-amber-600 text-white text-xs whitespace-nowrap">{t('coach.studio.status.planning', 'PLANNING')}</Badge>
                )}
                {isStopped && (
                  <Badge className="bg-slate-600 text-white text-xs whitespace-nowrap">{t('coach.studio.status.stopped', 'STOPPED')}</Badge>
                )}
                {isScheduled && (
                  <Badge className={`text-xs hidden sm:inline-flex ${isDark ? 'bg-slate-700/50 text-[#e8f5f0]/70 border-[#5eb8a8]/30' : 'bg-slate-100 text-slate-600 border-slate-300'}`}>{t('coach.studio.status.scheduled', 'Scheduled')}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex-shrink-0 px-4 py-2">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Main Content - Full height layout */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Left Sidebar - Controls (fixed width) */}
            <div className={`w-12 sm:w-14 lg:w-16 flex-shrink-0 border-r flex flex-col items-center py-2 sm:py-4 gap-1 sm:gap-2 ${isDark ? 'bg-[#0d1f1c]/80 border-[#5eb8a8]/20' : 'bg-white border-slate-200'}`}>
              {/* Session Controls - Host, Shadow, or Admin Speaker */}
              {canControlFeatures && (
                <>
                  {/* SCHEDULED state: Show Planning and Go Live buttons */}
                  {isScheduled && (
                    <>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={handleStartPlanning}
                            disabled={!mediaPermissions.video || !mediaPermissions.audio}
                            className="w-10 h-10 sm:w-12 sm:h-12 p-0 bg-amber-600/80 hover:bg-amber-500 rounded-full"
                          >
                            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                          <p>{t('coach.studio.startPlanning', 'Start Planning (Green Room)')}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={handleStartSession}
                            disabled={!mediaPermissions.video || !mediaPermissions.audio}
                            className="w-10 h-10 sm:w-12 sm:h-12 p-0 bg-gradient-to-r from-[#2a7a6f] to-[#1d5c54] hover:from-[#33897d] hover:to-[#1d5c54] rounded-full"
                          >
                            <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                          <p>{t('coach.studio.goLive', 'Go Live')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}

                  {/* PLANNING state: Show Cancel Planning and Go Live buttons */}
                  {isPlanning && (
                    <>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={handleCancelPlanning}
                            className="w-10 h-10 sm:w-12 sm:h-12 p-0 bg-slate-600 hover:bg-slate-500 rounded-full"
                          >
                            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                          <p>{t('coach.studio.cancelPlanning', 'Cancel Planning')}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={handleStartSession}
                            className="w-10 h-10 sm:w-12 sm:h-12 p-0 bg-gradient-to-r from-green-600 to-[#2a7a6f] hover:from-green-500 hover:to-[#33897d] rounded-full animate-pulse"
                          >
                            <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                          <p>{t('coach.studio.goLive', 'Go Live')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}

                  {/* LIVE state: Show Stop Broadcast and End Session buttons */}
                  {isLive && (
                    <>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setShowStopLiveDialog(true)}
                            className="w-10 h-10 sm:w-12 sm:h-12 p-0 bg-amber-600 hover:bg-amber-500 rounded-full"
                          >
                            <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                          <p>{t('coach.studio.stopBroadcast', 'Stop Broadcast')}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setShowEndDialog(true)}
                            className="w-10 h-10 sm:w-12 sm:h-12 p-0 bg-red-600 hover:bg-red-500 rounded-full"
                          >
                            <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                          <p>{t('coach.studio.endSession', 'End Session')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}

                  {/* STOPPED state: Show Restart to Planning, Restart Live, and End Session buttons */}
                  {isStopped && (
                    <>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={handleRestartToPlanning}
                            className="w-10 h-10 sm:w-12 sm:h-12 p-0 bg-amber-600/80 hover:bg-amber-500 rounded-full"
                          >
                            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                          <p>{t('coach.studio.restartPlanning', 'Restart to Planning')}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={handleRestartToLive}
                            className="w-10 h-10 sm:w-12 sm:h-12 p-0 bg-gradient-to-r from-green-600 to-[#2a7a6f] hover:from-green-500 hover:to-[#33897d] rounded-full"
                          >
                            <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                          <p>{t('coach.studio.restartLive', 'Restart Live')}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setShowEndDialog(true)}
                            className="w-10 h-10 sm:w-12 sm:h-12 p-0 bg-red-600 hover:bg-red-500 rounded-full"
                          >
                            <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                          <p>{t('coach.studio.endSession', 'End Session')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}

                  <div className={`w-6 sm:w-8 border-t my-1 sm:my-2 ${isDark ? 'border-[#5eb8a8]/30' : 'border-slate-200'}`} />
                </>
              )}

              {/* Camera Toggle - All speakers */}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleVideo}
                    disabled={!isOnScene || isPaused}
                    className={`w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full ${
                      !isOnScene || isPaused
                        ? 'text-slate-500 opacity-50 cursor-not-allowed'
                        : isVideoEnabled
                          ? isDark ? 'text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'text-slate-700 hover:bg-slate-100'
                          : 'text-red-400 bg-red-500/20'
                    }`}
                  >
                    {isVideoEnabled ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                  <p>{!isOnScene
                    ? t('webinars.offScene', 'Off scene - media disabled')
                    : isPaused
                      ? t('webinars.streamPaused', 'Stream paused')
                      : isVideoEnabled
                        ? t('webinars.muteVideo', 'Turn off camera')
                        : t('webinars.unmuteVideo', 'Turn on camera')
                  }</p>
                </TooltipContent>
              </Tooltip>

              {/* Mic Toggle - All speakers */}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleAudio}
                    disabled={!isOnScene || isPaused}
                    className={`w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full ${
                      !isOnScene || isPaused
                        ? 'text-slate-500 opacity-50 cursor-not-allowed'
                        : isAudioEnabled
                          ? isDark ? 'text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'text-slate-700 hover:bg-slate-100'
                          : 'text-red-400 bg-red-500/20'
                    }`}
                  >
                    {isAudioEnabled ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                  <p>{!isOnScene
                    ? t('webinars.offScene', 'Off scene - media disabled')
                    : isPaused
                      ? t('webinars.streamPaused', 'Stream paused')
                      : isAudioEnabled
                        ? t('webinars.muteMic', 'Mute')
                        : t('webinars.unmuteMic', 'Unmute')
                  }</p>
                </TooltipContent>
              </Tooltip>

              {/* Screen Share - Desktop only (not supported on mobile/tablet) */}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleScreenShare}
                    disabled={isMobileDevice || isPresentationSharing}
                    className={`w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full ${
                      isMobileDevice || isPresentationSharing
                        ? 'text-gray-500 cursor-not-allowed opacity-50'
                        : isScreenShareEnabled
                            ? isDark ? 'text-[#5eb8a8] bg-[#5eb8a8]/20' : 'text-[#285f59] bg-[#285f59]/10'
                            : isDark ? 'text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                  <p>{isMobileDevice
                    ? t('webinars.screenShareNotSupportedShort', 'Not available on mobile')
                    : isPresentationSharing
                      ? t('webinars.presentation.stopFirst', 'Stop presentation sharing first')
                      : t('webinars.shareScreen', 'Share Screen')
                  }</p>
                </TooltipContent>
              </Tooltip>

              {/* Presentation Share - Desktop only */}
              {!isMobileDevice && (
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isScreenShareEnabled}
                      onClick={() => setIsPresentationPopoverOpen(true)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full ${
                        isScreenShareEnabled
                          ? 'text-gray-500 cursor-not-allowed opacity-50'
                          : isPresentationSharing
                        ? isDark ? 'text-[#5eb8a8] bg-[#5eb8a8]/20' : 'text-[#285f59] bg-[#285f59]/10'
                            : isDark ? 'text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Presentation className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                    <p>{isScreenShareEnabled
                      ? t('webinars.presentation.stopScreenFirst', 'Stop screen sharing first')
                      : t('webinars.presentation.title', 'Presentation')
                    }</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <div className={`w-6 sm:w-8 border-t my-1 sm:my-2 ${isDark ? 'border-[#5eb8a8]/30' : 'border-slate-200'}`} />

              {/* Change Display Name - All speakers */}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openDisplayNameDialog}
                    className={`w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full ${isDark ? 'text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                  <p>{t('webinars.changeDisplayName', 'Change Display Name')}</p>
                </TooltipContent>
              </Tooltip>

              {/* Admin controls section - Host, Shadow, or Admin Speaker */}
              {canControlFeatures && (
                <>
                  <div className={`w-6 sm:w-8 border-t my-1 sm:my-2 ${isDark ? 'border-[#5eb8a8]/30' : 'border-slate-200'}`} />

                  {/* Pause/Resume (when live) - Host only */}
                  {isLive && (
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleTogglePause}
                          className={`w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full ${isPaused ? 'text-yellow-400 bg-yellow-500/20' : isDark ? 'text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                          {isPaused ? <Play className="w-4 h-4 sm:w-5 sm:h-5" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                        <p>{isPaused ? t('coach.studio.resume', 'Resume') : t('coach.studio.pause', 'Pause')}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Recording (when live) - Host only */}
                  {isLive && (
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            disabled={isRecordingLoading}
                            className={`w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full ${isRecording ? 'text-red-400 bg-red-500/20 animate-pulse' : isDark ? 'text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'text-slate-700 hover:bg-slate-100'} disabled:opacity-50`}
                          >
                            {isRecordingLoading ? (
                              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            ) : (
                              <Circle className={`w-4 h-4 sm:w-5 sm:h-5 ${isRecording ? 'fill-red-500' : ''}`} />
                            )}
                          </Button>
                          {/* Segment counter badge */}
                          {recordingSegments.length > 0 && !isRecordingLoading && (
                            <Badge
                              className={`absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] border-0 ${isDark ? 'bg-[#5eb8a8] text-[#0d1f1c]' : 'bg-[#285f59] text-white'}`}
                            >
                              {recordingSegments.length}
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                        <p>
                          {isRecordingLoading
                            ? t('coach.studio.recordingLoading', 'Processing...')
                            : isRecording
                              ? t('coach.studio.stopRecording', 'Stop Recording')
                              : t('coach.studio.startRecording', 'Start Recording')
                          }
                        </p>
                        {recordingSegments.length > 0 && (
                          <p className={`text-xs ${isDark ? 'text-[#e8f5f0]/60' : 'text-slate-500'}`}>
                            {t('coach.studio.recordingSegments', '{{count}} segment(s) recorded', { count: recordingSegments.length })}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Control Panel for secondary device (tablet) - Host only */}
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/coach/control-panel/${sessionId}`, '_blank')}
                        className={`w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full ${isDark ? 'text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'text-slate-700 hover:bg-slate-100'}`}
                      >
                        <Tablet className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                      <p>{t('webinars.controlPanel', 'Open Control Panel')}</p>
                      <p className={`text-xs ${isDark ? 'text-[#e8f5f0]/60' : 'text-slate-500'}`}>{t('webinars.controlPanelDesc', 'For tablet/secondary screen')}</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}

              <div className={`w-6 sm:w-8 border-t my-1 sm:my-2 ${isDark ? 'border-[#5eb8a8]/30' : 'border-slate-200'}`} />

              {/* Device Selector - All speakers */}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span>
                    <DeviceSelector
                      selectedVideoDeviceId={selectedVideoDeviceId}
                      selectedAudioDeviceId={selectedAudioDeviceId}
                      selectedAudioOutputDeviceId={selectedAudioOutputDeviceId}
                      onVideoDeviceChange={setSelectedVideoDeviceId}
                      onAudioDeviceChange={setSelectedAudioDeviceId}
                      onAudioOutputDeviceChange={setSelectedAudioOutputDeviceId}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full ${isDark ? 'text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                          <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                      }
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                  <p>{t('webinars.deviceSettings', 'Device Settings')}</p>
                </TooltipContent>
              </Tooltip>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Leave Studio - All speakers when live */}
              {isLive && (
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLeaveDialog(true)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full ${isDark ? 'text-[#e8f5f0]/60 hover:text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                    >
                      <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className={isDark ? 'bg-[#1a352f] text-[#e8f5f0] border-[#5eb8a8]/30' : 'bg-white text-slate-700 border-slate-200 shadow-md'}>
                    <p>{t('coach.studio.leaveWithoutEnding', 'Leave Studio')}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Main Area - Takes remaining space */}
            <div className="flex-1 flex min-w-0 overflow-hidden">
              {/* Video Area - Expands to fill available space */}
              <div className="flex-1 min-w-0 flex flex-col items-center p-2 sm:p-3 overflow-auto">
                {/* Video Container - Fixed aspect ratio */}
                <div className="w-full max-w-[1280px] flex flex-col">
                  <Card className={`overflow-hidden ${isDark ? 'bg-[#0d1f1c]/60 border-[#5eb8a8]/30' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <CardHeader className="py-2 px-3 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className={`text-sm flex items-center gap-2 ${isDark ? 'text-[#e8f5f0]' : 'text-slate-700'}`}>
                          {t('coach.studio.livePreview', 'Live Stream Preview')}
                          {isLive && (
                            <Badge className="bg-red-600 text-white animate-pulse whitespace-nowrap">{t('coach.studio.status.live', 'LIVE')}</Badge>
                          )}
                          {isPlanning && (
                            <Badge className="bg-amber-600 text-white whitespace-nowrap">{t('coach.studio.status.planning', 'PLANNING')}</Badge>
                          )}
                          {isPaused && (
                            <Badge className="bg-yellow-600 text-white whitespace-nowrap">
                              {t('coach.studio.paused', 'Paused')}
                            </Badge>
                          )}
                          <LiveViewerCount variant="text" />
                        </CardTitle>
                        <div className="flex items-center gap-3">
                          {/* Video Quality Selector */}
                          <VideoQualitySelector
                            quality={transmitQuality}
                            onQualityChange={setTransmitQuality}
                            mode="transmit"
                          />
                          {/* Layout Selector - Host only */}
                          {canEditVisuals && (
                            sceneTemplates.length > 0 ? (
                              <LayoutSelector
                                templates={sceneTemplates}
                                selectedTemplate={selectedTemplate}
                                onTemplateSelect={selectTemplate}
                                disabled={!isLive}
                                className="h-8"
                              />
                            ) : (
                              <span className={`text-xs ${isDark ? 'text-[#e8f5f0]/50' : 'text-slate-400'}`}>
                                {t('coach.studio.noTemplates', 'No scene templates')}
                              </span>
                            )
                          )}
                          {/* Overlay Manager - Host only */}
                          {canEditVisuals && selectedTemplate && selectedTemplate.overlays.length > 0 && (
                            <OverlayManager
                              overlays={selectedTemplate.overlays}
                              visibility={overlayVisibility}
                              onToggle={toggleOverlay}
                              disabled={!isLive}
                            />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-3 pt-0">
                      {/* 16:9 aspect ratio container with max-height to avoid scroll */}
                      <div className="relative w-full aspect-video max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-320px)] bg-black rounded-lg overflow-hidden">
                        {/* Scene Compositor when active (planning or live) with template */}
                        {isActiveSession && livekitToken && effectiveTemplate ? (
                          <SceneCompositor
                            template={effectiveTemplate}
                            overlayVisibility={overlayVisibility}
                            showPlaceholders={true}
                            localParticipantIdentity={currentUser?.uid}
                            includeLocalVideo={!isPaused}
                            cameraScale={cameraScale}
                            cameraSlotStyles={cameraSlotStyles}
                            cornerImages={cornerImages}
                            activeTextBanner={activeTextBanner}
                            speakerNameStyle={speakerNameStyle}
                            speakerDisplayNames={speakerDisplayNames}
                            onSceneIds={onSceneIds}
                            className="w-full h-full"
                          />
                        ) : isActiveSession && livekitToken && !isPaused ? (
                          /* Fallback to simple preview if no template */
                          <HostVideoPreview />
                        ) : null}

                        {/* Reaction Overlay - shows floating emojis from viewers (only during live) */}
                        {isLive && reactionsEnabled && (
                          <ReactionOverlay enabled={true} />
                        )}

                        {/* Local preview when not in active session (scheduled or stopped) */}
                        {!isActiveSession && mediaPermissions.video && (
                          <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-contain"
                            style={{ transform: 'scaleX(-1)' }}
                          />
                        )}

                        {/* Paused overlay - covers entire scene with high z-index */}
                        {isLive && isPaused && (
                          <div className={`absolute inset-0 flex flex-col items-center justify-center z-50 ${isDark ? 'bg-[#0d1f1c]/90' : 'bg-white/90'}`}>
                            <Pause className="w-16 h-16 text-yellow-400 mb-4" />
                            <p className="text-yellow-400 font-medium text-xl">
                              {t('coach.studio.streamPaused', 'Stream Paused')}
                            </p>
                            <p className={`text-sm mt-2 ${isDark ? 'text-[#e8f5f0]/60' : 'text-slate-500'}`}>
                              {t('coach.studio.streamPausedDescription', 'Viewers see this message. Click resume to continue.')}
                            </p>
                          </div>
                        )}

                        {/* Off-scene indicator - shows when participant is not on scene */}
                        {!isOnScene && (
                          <div className="absolute top-3 left-3 z-40 flex items-center gap-2 bg-orange-600/90 px-3 py-1.5 rounded-full">
                            <VideoOff className="w-4 h-4 text-white" />
                            <span className="text-white text-sm font-medium">
                              {t('webinars.offSceneIndicator', 'Off Scene - Your media is muted')}
                            </span>
                          </div>
                        )}

                        {/* Presentation controls overlay */}
                        {!isMobileDevice && (
                          <PresentationManager
                            onSharingChange={(sharing) => {
                              setIsPresentationSharing(sharing);
                              if (sharing && isScreenShareEnabled) {
                                setIsScreenShareEnabled(false);
                              }
                            }}
                            isNativeScreenShareActive={isScreenShareEnabled}
                            isPopoverOpen={isPresentationPopoverOpen}
                            onPopoverClose={() => setIsPresentationPopoverOpen(false)}
                          />
                        )}

                        {/* No camera/permission error */}
                        {!isActiveSession && !mediaPermissions.video && (
                          <div className={`absolute inset-0 flex flex-col items-center justify-center ${isDark ? 'text-[#e8f5f0]/50 bg-[#1a352f]' : 'text-slate-400 bg-slate-100'}`}>
                            <VideoOff className="w-12 h-12 mb-2" />
                            {mediaPermissions.error && (
                              <p className="text-sm text-center px-4 text-red-400">
                                {mediaPermissions.error}
                              </p>
                            )}
                            {!mediaPermissions.requested && (
                              <p className="text-sm text-center px-4">
                                {t('coach.studio.requestingPermissions', 'Requesting camera access...')}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Screen share indicator */}
                        {isScreenShareEnabled && (
                          <div className={cn("absolute bottom-4 right-4 z-50 rounded-lg px-3 py-1.5 text-white text-sm flex items-center gap-2 shadow-lg", isDark ? "bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/30" : "bg-gradient-to-r from-red-500 to-red-400 shadow-red-500/30")}>
                            <Monitor className="w-4 h-4" />
                            {t('webinars.sharingScreen', 'Sharing Screen')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Connected Participants Bar - Host/Shadow/Admin can manage scene */}
                  {isActiveSession && canControlFeatures && (
                    <ConnectedParticipants
                      participants={sceneParticipants}
                      onSceneIds={onSceneIds}
                      canManageScene={canControlFeatures}
                      onAddToScene={addToScene}
                      onRemoveFromScene={removeFromScene}
                      currentUserId={currentUser?.uid}
                      className="mt-2"
                    />
                  )}

                </div>
              </div>

              {/* Side Panel - Chat, Q&A, Poll, Settings */}
              <StudioSidePanel
                chatContent={
                  <div className="h-full flex flex-col">
                    <div className={`flex items-center justify-between px-3 py-2 border-b ${isDark ? 'border-[#5eb8a8]/30' : 'border-slate-200'}`}>
                      <span className={`text-xs ${isDark ? 'text-[#e8f5f0]/60' : 'text-slate-500'}`}>
                        {chatEnabled ? t('webinars.chat.enabled', 'Chat enabled') : t('webinars.chat.disabled', 'Chat disabled')}
                      </span>
                      <Switch
                        checked={chatEnabled}
                        onCheckedChange={toggleChat}
                        className={cn("scale-75", isDark ? "data-[state=checked]:bg-[#5eb8a8]" : "data-[state=checked]:bg-[#285f59]")}
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <WebinarChat
                        messages={chatMessages}
                        pinnedMessageId={pinnedMessageId}
                        isHost={true}
                        currentUserId={currentUser?.uid}
                        speakerDisplayNames={speakerDisplayNames}
                        onSendMessage={sendChatMessage}
                        onPinMessage={pinMessage}
                        onDeleteMessage={deleteChatMessage}
                        isDisabled={!chatEnabled}
                        className="h-full"
                      />
                    </div>
                  </div>
                }
                qaContent={
                  <div className="h-full flex flex-col">
                    <div className={`flex items-center justify-between px-3 py-2 border-b ${isDark ? 'border-[#5eb8a8]/30' : 'border-slate-200'}`}>
                      <span className={`text-xs ${isDark ? 'text-[#e8f5f0]/60' : 'text-slate-500'}`}>
                        {qaEnabled ? t('webinars.qa.enabled', 'Q&A enabled') : t('webinars.qa.disabled', 'Q&A disabled')}
                      </span>
                      <Switch
                        checked={qaEnabled}
                        onCheckedChange={toggleQA}
                        className={cn("scale-75", isDark ? "data-[state=checked]:bg-[#5eb8a8]" : "data-[state=checked]:bg-[#285f59]")}
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <WebinarQA
                        questions={questions}
                        isHost={true}
                        currentUserId={currentUser?.uid}
                        onSubmitQuestion={submitQuestion}
                        onUpvoteQuestion={() => {}}
                        onAnswerQuestion={answerQuestion}
                        onDeleteQuestion={deleteQuestion}
                        isDisabled={!qaEnabled}
                        className="h-full"
                      />
                    </div>
                  </div>
                }
                pollContent={
                  <div className="p-3">
                    <WebinarPollComponent
                      poll={activePoll}
                      draftPolls={draftPolls}
                      pollHistory={pollHistory}
                      isHost={true}
                      currentUserId={currentUser?.uid}
                      onVote={() => {}}
                      onCreatePoll={handleCreatePoll}
                      onActivatePoll={handleActivatePoll}
                      onClosePoll={(pollId) => closePoll(pollId)}
                      onDeletePoll={handleDeletePoll}
                    />
                  </div>
                }
                scenesContent={
                  <SceneControls
                    webinarId={webinar?.id}
                    templates={sceneTemplates}
                    selectedTemplate={effectiveTemplate}
                    onTemplateSelect={selectTemplate}
                    overlayVisibility={overlayVisibility}
                    onOverlayToggle={toggleOverlay}
                    isLive={isLive}
                    onBackgroundColorChange={handleBackgroundColorChange}
                    onBackgroundImageChange={handleBackgroundImageChange}
                    currentBackground={background}
                    cameraScale={cameraScale}
                    onCameraScaleChange={handleCameraScaleChange}
                    cameraSlotStyles={cameraSlotStyles}
                    onCameraSlotStyleChange={handleCameraSlotStyleChange}
                    cornerImages={cornerImages}
                    onSetCornerImage={handleSetCornerImage}
                    onRemoveCornerImage={handleRemoveCornerImage}
                    onToggleCornerImage={handleToggleCornerImage}
                    textBanners={textBanners}
                    onAddTextBanner={handleAddTextBanner}
                    onUpdateTextBanner={handleUpdateTextBanner}
                    onRemoveTextBanner={handleRemoveTextBanner}
                    onShowTextBanner={handleShowTextBanner}
                    savedSceneConfigs={savedSceneConfigs}
                    currentConfigId={currentConfigId}
                    isLoadingConfig={isLoadingConfig}
                    isSavingConfig={isSavingConfig}
                    onSaveSceneConfig={handleSaveSceneConfig}
                    onLoadSceneConfig={handleLoadSceneConfig}
                    onDeleteSceneConfig={handleDeleteSceneConfig}
                    onSetDefaultConfig={handleSetDefaultConfig}
                    speakerNameStyle={speakerNameStyle}
                    onSpeakerNameStyleChange={handleSpeakerNameStyleChange}
                  />
                }
                attendeesContent={
                  <WebinarAttendeeList
                    attendees={attendeeList}
                    currentWinners={currentGiveawayWinners}
                    rounds={giveawayRounds}
                    isRemoteSelecting={isGiveawaySelecting}
                    onSelectionStarted={startGiveawaySelection}
                    onWinnerSelected={(winner, isTestPick) => {
                      console.log('[WebinarStudio] onWinnerSelected called:', winner, { isTestPick });
                      selectGiveawayWinner(winner, isTestPick);
                    }}
                    onNewRound={() => {
                      console.log('[WebinarStudio] onNewRound called, webinarId:', webinar?.id);
                      if (webinar?.id) {
                        startNewGiveawayRound(webinar.id);
                      }
                    }}
                    onDeleteRound={(roundId) => {
                      console.log('[WebinarStudio] onDeleteRound called:', roundId);
                      deleteGiveawayRound(roundId);
                    }}
                    className="h-full"
                  />
                }
                settingsContent={
                  <div className="h-full overflow-y-auto">
                    <div className="p-4 space-y-6">
                      {/* Interaction Section - Always visible, can change while live */}
                      <div className="space-y-3">
                        <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]'}`}>
                          {t('webinars.settings.interactionSection', 'Interaction')}
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label className={`text-sm ${isDark ? 'text-[#e8f5f0]/80' : 'text-slate-700'}`}>
                              {t('webinars.chat.title', 'Chat')}
                            </Label>
                            <p className={`text-xs ${isDark ? 'text-[#e8f5f0]/50' : 'text-slate-400'}`}>
                              {t('webinars.settings.chatDesc', 'Allow viewers to send messages')}
                            </p>
                          </div>
                          <Switch
                            checked={chatEnabled}
                            onCheckedChange={toggleChat}
                            className={cn("scale-90", isDark ? "data-[state=checked]:bg-[#5eb8a8]" : "data-[state=checked]:bg-[#285f59]")}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label className={`text-sm ${isDark ? 'text-[#e8f5f0]/80' : 'text-slate-700'}`}>
                              {t('webinars.qa.title', 'Q&A')}
                            </Label>
                            <p className={`text-xs ${isDark ? 'text-[#e8f5f0]/50' : 'text-slate-400'}`}>
                              {t('webinars.settings.qaDesc', 'Allow viewers to ask questions')}
                            </p>
                          </div>
                          <Switch
                            checked={qaEnabled}
                            onCheckedChange={toggleQA}
                            className={cn("scale-90", isDark ? "data-[state=checked]:bg-[#5eb8a8]" : "data-[state=checked]:bg-[#285f59]")}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label className={`text-sm ${isDark ? 'text-[#e8f5f0]/80' : 'text-slate-700'}`}>
                              {t('webinars.reactions.title', 'Reactions')}
                            </Label>
                            <p className={`text-xs ${isDark ? 'text-[#e8f5f0]/50' : 'text-slate-400'}`}>
                              {t('webinars.settings.reactionsDesc', 'Allow viewers to send emoji reactions')}
                            </p>
                          </div>
                          <Switch
                            checked={reactionsEnabled}
                            onCheckedChange={toggleReactions}
                            className={cn("scale-90", isDark ? "data-[state=checked]:bg-[#5eb8a8]" : "data-[state=checked]:bg-[#285f59]")}
                          />
                        </div>
                      </div>

                      {/* Video/Audio Settings - Only show when NOT live */}
                      {!isLive && (
                        <>
                          {/* Video Quality Section */}
                          <div className="space-y-3">
                            <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]'}`}>
                              {t('webinars.settings.videoSection', 'Video')}
                            </h4>
                            <div className="space-y-2">
                              <Label className={`text-sm ${isDark ? 'text-[#e8f5f0]/80' : 'text-slate-700'}`}>
                                {t('webinars.quality.transmitTitle', 'Transmission Quality')}
                              </Label>
                              <VideoQualitySelector
                                quality={transmitQuality}
                                onQualityChange={setTransmitQuality}
                                mode="transmit"
                              />
                            </div>
                          </div>

                          {/* Audio Section - Only RNNoise toggle, others are fixed for optimal quality */}
                          <div className="space-y-3">
                            <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]'}`}>
                              {t('webinars.settings.audioSection', 'Audio')}
                            </h4>

                            {/* RNNoise Enhanced - Optional AI noise reduction */}
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <Label className={`text-sm flex items-center gap-2 ${isDark ? 'text-[#e8f5f0]/80' : 'text-slate-700'}`}>
                                    {t('webinars.settings.rnnoiseEnhanced', 'RNNoise AI Enhanced')}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isDark ? 'bg-green-600/30 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                      FREE
                                    </span>
                                  </Label>
                                  <p className={`text-xs ${isDark ? 'text-[#e8f5f0]/50' : 'text-slate-400'}`}>
                                    {t('webinars.settings.rnnoiseDesc', 'Advanced AI-powered noise reduction (open-source)')}
                                  </p>
                                  {!rnnoiseSupported && (
                                    <p className="text-xs text-yellow-400/80 mt-1">
                                      {t('webinars.settings.rnnoiseNotSupported', 'Not supported in this browser')}
                                    </p>
                                  )}
                                  {rnnoiseError && (
                                    <p className="text-xs text-red-400/80 mt-1">{rnnoiseError}</p>
                                  )}
                                </div>
                                <Switch
                                  checked={rnnoiseEnabled}
                                  onCheckedChange={(enabled) => {
                                    setRnnoiseEnabled(enabled);
                                    if (enabled) {
                                      initializeRnnoise();
                                    }
                                  }}
                                  disabled={!rnnoiseSupported || rnnoiseLoading}
                                  className="scale-90 data-[state=checked]:bg-green-600"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Info when live */}
                      {isLive && (
                        <div className={`text-center py-4 text-sm ${isDark ? 'text-[#e8f5f0]/50' : 'text-slate-400'}`}>
                          <p>{t('webinars.settings.liveInfo', 'Video and audio settings are configured before going live.')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                }
                chatCount={unreadChatCount}
                qaCount={unreadQaCount}
                attendeeCount={attendeeCount}
                hasPoll={activePoll !== null && activePoll.status === 'active'}
                hasActiveScene={selectedTemplate !== null}
                chatEnabled={chatEnabled}
                qaEnabled={qaEnabled}
                onTabChange={handleSidePanelTabChange}
                activeTabProp={activeSidePanelTab}
                isHost={canEditVisuals}
                hasUnsavedSceneChanges={hasUnsavedSceneChanges}
                onQuickSaveScene={handleQuickSaveConfig}
                isSavingScene={isSavingConfig}
              />
            </div>
          </div>
        </div>
      </LiveKitRoom>

      {/* Leave Studio Dialog (without ending) */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent className={isDark ? 'bg-[#0d1f1c] border-[#5eb8a8]/30' : 'bg-white border-slate-200'}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2" style={{ color: isDark ? '#FFFFFF' : '#1E293B' }}>
              <LogOut className={`w-5 h-5 ${isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]'}`} />
              {t('coach.studio.confirmLeave', 'Leave Studio?')}
            </AlertDialogTitle>
            <AlertDialogDescription className={isDark ? 'text-[#e8f5f0]/70' : 'text-slate-500'}>
              {t(
                'coach.studio.confirmLeaveDescription',
                'The session will remain live for attendees. You can rejoin anytime.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={isDark ? 'bg-[#1a352f]/50 border-[#5eb8a8]/50 text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveWithoutEnding}
              className={isDark ? 'bg-gradient-to-r from-[#2a7a6f] to-[#1d5c54] hover:from-[#33897d] hover:to-[#1d5c54] text-white' : 'bg-[#285f59] hover:bg-[#1d4a45] text-white'}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('coach.studio.leaveStudio', 'Leave Studio')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stop Broadcast Confirmation Dialog */}
      <AlertDialog open={showStopLiveDialog} onOpenChange={setShowStopLiveDialog}>
        <AlertDialogContent className={isDark ? 'bg-[#0d1f1c] border-amber-500/30' : 'bg-white border-slate-200'}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2" style={{ color: isDark ? '#FFFFFF' : '#1E293B' }}>
              <Pause className="w-5 h-5 text-amber-400" />
              {t('coach.studio.confirmStopBroadcast', 'Stop Broadcast?')}
            </AlertDialogTitle>
            <AlertDialogDescription className={isDark ? 'text-[#e8f5f0]/70' : 'text-slate-500'}>
              {t(
                'coach.studio.confirmStopBroadcastDescription',
                'This will stop the live broadcast and disconnect all viewers. You can restart the broadcast at any time.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={isDark ? 'bg-[#1a352f]/50 border-[#5eb8a8]/50 text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleStopBroadcast} className="bg-amber-600 hover:bg-amber-500 text-white">
              <Pause className="w-4 h-4 mr-2" />
              {t('coach.studio.stopBroadcast', 'Stop Broadcast')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Session Confirmation Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent className={isDark ? 'bg-[#0d1f1c] border-red-500/30' : 'bg-white border-slate-200'}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2" style={{ color: isDark ? '#FFFFFF' : '#1E293B' }}>
              <XCircle className="w-5 h-5 text-red-400" />
              {t('coach.studio.confirmComplete', 'Complete Session?')}
            </AlertDialogTitle>
            <AlertDialogDescription className={isDark ? 'text-[#e8f5f0]/70' : 'text-slate-500'}>
              {t(
                'coach.studio.confirmCompleteDescription',
                'This will permanently end the session for all attendees. This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={isDark ? 'bg-[#1a352f]/50 border-[#5eb8a8]/50 text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleEndSession} className="bg-red-600 hover:bg-red-500 text-white">
              <Square className="w-4 h-4 mr-2" />
              {t('coach.studio.completeSession', 'Complete Session')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Display Name Change Dialog */}
      <Dialog open={isDisplayNameDialogOpen} onOpenChange={setIsDisplayNameDialogOpen}>
        <DialogContent className={`sm:max-w-md ${isDark ? 'bg-[#0d1f1c] border-[#5eb8a8]/30' : 'bg-white border-slate-200'}`}>
          <DialogHeader>
            <DialogTitle style={{ color: isDark ? '#FFFFFF' : '#1E293B' }}>
              {t('webinars.changeDisplayName', 'Change Display Name')}
            </DialogTitle>
            <DialogDescription className={isDark ? 'text-[#e8f5f0]/70' : 'text-slate-500'}>
              {t('webinars.changeDisplayNameDesc', 'This name will be shown on your video during the webinar.')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder={t('webinars.enterDisplayName', 'Enter your display name')}
              className={isDark ? 'bg-[#1a352f]/50 border-[#5eb8a8]/30 text-white placeholder:text-[#e8f5f0]/40' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'}
              maxLength={30}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveDisplayName();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDisplayNameDialogOpen(false)}
              className={isDark ? 'bg-[#1a352f]/50 border-[#5eb8a8]/50 text-[#e8f5f0] hover:bg-[#2a7a6f]/20' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={saveDisplayName}
              disabled={!displayNameInput.trim()}
              className={isDark ? 'bg-[#2a7a6f] hover:bg-[#33897d] text-white' : 'bg-[#285f59] hover:bg-[#1d4a45] text-white'}
            >
              {t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </>
  );
}
