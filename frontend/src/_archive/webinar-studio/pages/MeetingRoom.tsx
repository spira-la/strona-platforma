import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LiveKitRoom, RoomAudioRenderer, useRemoteParticipants } from '@livekit/components-react';
import { type RoomOptions, VideoPresets } from 'livekit-client';
import { getDeviceInfo } from '@/shared/utils/deviceInfo';
import { format, addMinutes } from 'date-fns';
import { parseFirestoreDate, getDateLocale } from '@/utils/dateFormat';
import {
  Loader2,
  AlertCircle,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  LogIn,
  Clock,
  CalendarX,
  ArrowLeft,
  RefreshCw,
  ShieldAlert,
  Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useMediaPreview } from '@/hooks/useMediaPreview';
import { useMediaPermissions } from '@/hooks/useMediaPermissions';
import { useWakeLock } from '@/hooks/useWakeLock';
import { DeviceSelector, useDevicePersistence } from '@/components/webinar/DeviceSelector';
import { MeetingGrid } from '@/components/meeting/MeetingGrid';
import { MeetingControlBar } from '@/components/meeting/MeetingControlBar';
import { MeetingHeader } from '@/components/meeting/MeetingHeader';
import { MeetingSceneControls } from '@/components/meeting/MeetingSceneControls';
import { PresentationManager } from '@/components/webinar/studio/PresentationShare';
import { useMeetingSession } from '@/hooks/meeting/useMeetingSession';
import { useMeetingSceneSync, createCornerImage, type MeetingSceneState, type MeetingSceneSetters } from '@/hooks/meeting/useMeetingSceneSync';
import { useMeetingSceneChannel } from '@/hooks/meeting/useMeetingSceneChannel';
import { useMeetingReactions } from '@/hooks/meeting/useMeetingReactions';
import { MeetingReactionOverlay } from '@/components/meeting/MeetingReactionOverlay';
import type { CameraSlotStyle, CornerImage } from '@/components/webinar/SceneControls';
import type { SavedCornerImage } from '@/clients/StudioAssetsClient';
import type { Booking } from '@/clients/BookingsClient';

// Hook to detect screen orientation and size for responsive layout
function useResponsiveLayout() {
  const [preferredLayout, setPreferredLayout] = useState<MeetingSceneState['layout']>(() => {
    if (typeof window === 'undefined') return 'side-by-side';
    // Portrait or small screen = stacked, landscape = side-by-side
    const isPortrait = window.innerHeight > window.innerWidth;
    const isSmallScreen = window.innerWidth < 768;
    return (isPortrait || isSmallScreen) ? 'stacked' : 'side-by-side';
  });

  useEffect(() => {
    const updateLayout = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isSmallScreen = window.innerWidth < 768;
      setPreferredLayout((isPortrait || isSmallScreen) ? 'stacked' : 'side-by-side');
    };

    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);

    // Also listen to screen orientation API if available
    if (screen.orientation) {
      screen.orientation.addEventListener('change', updateLayout);
    }

    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', updateLayout);
      }
    };
  }, []);

  return preferredLayout;
}

// LiveKit room options with old device compatibility
function buildRoomOptions(): RoomOptions {
  const { isOldDevice } = getDeviceInfo();
  return {
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: {
      resolution: isOldDevice
        ? VideoPresets.h360.resolution
        : VideoPresets.h720.resolution,
      facingMode: 'user',
    },
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    publishDefaults: {
      videoCodec: 'vp8',
      simulcast: !isOldDevice,
    },
    disconnectOnPageLeave: true,
    stopLocalTrackOnUnpublish: true,
  };
}
const roomOptions: RoomOptions = buildRoomOptions();

export default function MeetingRoom() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const {
    booking,
    token,
    serverUrl,
    isCoach,
    participantName: defaultName,
    isLoading,
    error,
    isRecording,
    isRecordingLoading,
    canJoinTrigger,
    joinMeeting,
    startRecording,
    stopRecording,
    retryInit,
    resetSession,
  } = useMeetingSession(bookingId);

  // Pre-join state
  const [displayName, setDisplayName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isDeviceSelectorOpen, setIsDeviceSelectorOpen] = useState(false);
  const { loadDevicePreferences } = useDevicePersistence();
  const [selectedAudioOutputDeviceId, setSelectedAudioOutputDeviceId] = useState<string>(() => {
    const saved = loadDevicePreferences();
    return saved?.audioOutputDeviceId || '';
  });
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const connectionErrorRef = useRef(false);

  // Presentation state
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isPresentationSharing, setIsPresentationSharing] = useState(false);

  // Scene controls state (coach only)
  const [isSceneControlsOpen, setIsSceneControlsOpen] = useState(false);

  // Responsive layout based on screen size/orientation
  const responsiveLayout = useResponsiveLayout();
  const [userHasChangedLayout, setUserHasChangedLayout] = useState(false);

  // Scene state using the sync hook with responsive default
  const [sceneState, sceneSetters] = useMeetingSceneSync({
    initialLayout: responsiveLayout,
  });

  // Auto-update layout when orientation changes (only if user hasn't manually changed it)
  useEffect(() => {
    if (!userHasChangedLayout) {
      sceneSetters.setLayout(responsiveLayout);
    }
  }, [responsiveLayout, userHasChangedLayout, sceneSetters]);

  // Determine if we should show preview (pre-join state)
  const showPreview = !isLoading && !error && !token && !!booking;

  // Media permissions hook (Google Meet approach)
  const {
    status: permissionStatus,
    cameraDenied,
    microphoneDenied,
    requestPermissions,
    recheckPermissions,
    instructions: permissionInstructions,
    browserTabs,
    deviceType: permDeviceType,
    browserName,
    isMobile,
  } = useMediaPermissions();

  // Pre-prompt state: user must confirm intent before we trigger browser prompt
  const [permissionsAccepted, setPermissionsAccepted] = useState(false);
  const permissionsGranted = permissionStatus === 'granted';
  const permissionsDenied = permissionStatus === 'denied';
  // Show pre-prompt only when permissions haven't been granted yet and user hasn't accepted
  const showPrePrompt = showPreview && !permissionsAccepted && !permissionsGranted && !permissionsDenied;
  // Show denied instructions
  const showDeniedInstructions = showPreview && permissionsDenied;

  // Media preview hook - only auto-start after permissions are granted
  const {
    videoRef,
    videoEnabled,
    audioEnabled,
    toggleVideo,
    toggleAudio,
    stopPreview,
    startPreview,
  } = useMediaPreview({
    autoStart: showPreview && (permissionsGranted || permissionsAccepted) && !permissionsDenied,
    paused: isDeviceSelectorOpen,
  });

  // Pre-prompt → triggers native browser permission dialog
  const handleAcceptPrePrompt = useCallback(async () => {
    setPermissionsAccepted(true);
    const granted = await requestPermissions();
    if (granted && showPreview) {
      startPreview();
    }
  }, [requestPermissions, showPreview, startPreview]);

  // Retry after denied (user changed settings externally)
  const handleRetryPermissions = useCallback(async () => {
    await recheckPermissions();
    const granted = await requestPermissions();
    if (granted && showPreview) {
      startPreview();
    }
  }, [recheckPermissions, requestPermissions, showPreview, startPreview]);

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

  // Initialize display name from default
  useEffect(() => {
    if (defaultName && !displayName) {
      setDisplayName(defaultName);
    }
  }, [defaultName, displayName]);

  // Scene control handlers
  const handleLayoutChange = useCallback((layout: typeof sceneState.layout) => {
    setUserHasChangedLayout(true); // User manually selected, don't auto-change anymore
    sceneSetters.setLayout(layout);
  }, [sceneSetters]);

  const handleBackgroundChange = useCallback((background: typeof sceneState.background) => {
    sceneSetters.setBackground(background);
  }, [sceneSetters]);

  const handleCameraScaleChange = useCallback((scale: number) => {
    sceneSetters.setCameraScale(scale);
  }, [sceneSetters]);

  const handleCameraSlotStyleChange = useCallback((slotId: string, style: Partial<CameraSlotStyle>) => {
    sceneSetters.setCameraSlotStyles(prev => {
      const existing = prev.find(s => s.slotId === slotId);
      if (existing) {
        return prev.map(s => s.slotId === slotId ? { ...s, ...style } : s);
      }
      return [...prev, { slotId, ...style } as CameraSlotStyle];
    });
  }, [sceneSetters]);

  const handleCornerImageSet = useCallback((corner: CornerImage['corner'], image: SavedCornerImage) => {
    const newCornerImage = createCornerImage(image, corner);
    sceneSetters.setCornerImages(prev => {
      // Remove existing image at this corner and add new one
      return [...prev.filter(img => img.corner !== corner), newCornerImage];
    });
  }, [sceneSetters]);

  const handleCornerImageRemove = useCallback((corner: CornerImage['corner']) => {
    sceneSetters.setCornerImages(prev => prev.filter(img => img.corner !== corner));
  }, [sceneSetters]);

  const handleCornerImageToggle = useCallback((corner: CornerImage['corner']) => {
    sceneSetters.setCornerImages(prev =>
      prev.map(img => img.corner === corner ? { ...img, isVisible: !img.isVisible } : img)
    );
  }, [sceneSetters]);

  // Handle join
  const handleJoin = useCallback(async () => {
    if (!displayName.trim()) return;
    setIsJoining(true);
    setConnectionError(null);
    stopPreview();
    await joinMeeting(displayName.trim());
    setIsJoining(false);
  }, [displayName, joinMeeting, stopPreview]);

  // Handle LiveKit connection error
  const handleConnectionError = useCallback((err: Error) => {
    console.error('[MeetingRoom] LiveKit connection error:', err);
    connectionErrorRef.current = true;
    setConnectionError(err.message || 'Connection failed');
  }, []);

  // Handle retry after connection error - go back to pre-join
  const handleRetryJoin = useCallback(() => {
    connectionErrorRef.current = false;
    setConnectionError(null);
    resetSession();
    retryInit();
  }, [resetSession, retryInit]);

  // Handle leave - skip navigation if we got a connection error (show error screen instead)
  const handleLeave = useCallback(() => {
    if (connectionErrorRef.current) {
      // Connection failed - don't navigate away, the error screen will show
      return;
    }
    resetSession();
    navigate(-1);
  }, [navigate, resetSession]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bwm-page">
        <div className="min-h-screen flex flex-col animate-fade-in">
          <Header variant="page" />
          <main className="flex-1 flex items-center justify-center pt-20">
            <Card className="bg-bwm-card/80 border-bwm-card p-8 backdrop-blur-sm">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-[#5eb8a8]/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#5eb8a8] animate-spin"></div>
                  <Video className="absolute inset-0 m-auto w-6 h-6 text-[#5eb8a8]" />
                </div>
                <p className="text-bwm-primary font-medium">{t('meeting.loading', 'Loading meeting...')}</p>
                {booking?.serviceName && (
                  <p className="text-bwm-muted text-sm mt-1">{booking.serviceName}</p>
                )}
              </div>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  // Error state: Too early to join
  if (error === 'TOO_EARLY' && booking) {
    const scheduledAt = parseFirestoreDate(booking.scheduledAt);
    const canJoinFrom = addMinutes(scheduledAt, -30);
    const dateLocale = getDateLocale(i18n.language);

    return (
      <div className="min-h-screen bg-bwm-page">
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 flex items-center justify-center pt-20 px-4">
            <Card className="max-w-md w-full bg-bwm-card/60 border-bwm-card">
              <CardContent className="p-8 text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-[#5eb8a8]/20 animate-pulse"></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#2a7a6f]/30 to-[#5eb8a8]/30 flex items-center justify-center">
                    <Clock className="w-10 h-10 text-[#5eb8a8]" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-bwm-primary mb-2">
                  {t('meeting.tooEarly.title', 'Session not started yet')}
                </h2>
                <p className="text-bwm-secondary mb-4">
                  {t('meeting.tooEarly.description', 'You can join 30 minutes before the scheduled time.')}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-bwm-muted mb-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('meeting.tooEarly.waitingForCoach', 'Waiting for coach to start the session...')}</span>
                </div>
                <div className="bg-bwm-section rounded-lg p-4 mb-6">
                  <p className="text-sm text-bwm-muted mb-2">{t('meeting.scheduledFor', 'Scheduled for')}</p>
                  <p className="text-lg font-medium text-bwm-primary">
                    {format(scheduledAt, 'EEEE, MMMM d, yyyy', { locale: dateLocale })}
                  </p>
                  <p className="text-2xl font-bold text-[#5eb8a8] mt-1">
                    {format(scheduledAt, 'HH:mm')} - {format(addMinutes(scheduledAt, booking.duration || 60), 'HH:mm')}
                  </p>
                  <p className="text-sm text-bwm-muted mt-3">
                    {t('meeting.canJoinFrom', 'You can join from')} {format(canJoinFrom, 'HH:mm')}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={retryInit}
                    className="w-full bg-gradient-to-r from-[#2a7a6f] to-[#1d5c54] hover:from-[#33897d] hover:to-[#2a7a6f] text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('meeting.tooEarly.checkNow', 'Check now')}
                  </Button>
                  <Button
                    onClick={() => navigate('/my-sessions')}
                    variant="outline"
                    className="w-full bg-bwm-section border-[#5eb8a8]/50 text-bwm-primary hover:bg-[#2a7a6f]/20"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('meeting.backToSessions', 'Back to My Sessions')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Error state: Session ended (time-based)
  if (error === 'SESSION_ENDED' && booking) {
    return (
      <div className="min-h-screen bg-bwm-page">
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 flex items-center justify-center pt-20 px-4">
            <Card className="max-w-md w-full bg-bwm-card/60 border-bwm-card">
              <CardContent className="p-8 text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-gray-500/20"></div>
                  <div className="absolute inset-0 rounded-full bg-gray-500/10 flex items-center justify-center">
                    <CalendarX className="w-10 h-10 text-gray-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-bwm-primary mb-2">
                  {t('meeting.ended.title', 'Session has ended')}
                </h2>
                <p className="text-bwm-secondary mb-6">
                  {t('meeting.ended.description', 'This session is no longer available for joining.')}
                </p>
                <Button
                  onClick={() => navigate('/my-sessions')}
                  variant="outline"
                  className="w-full bg-bwm-section border-[#5eb8a8]/50 text-bwm-primary hover:bg-[#2a7a6f]/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('meeting.backToSessions', 'Back to My Sessions')}
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Error state: User left the session (coach disconnected or user left)
  if (error === 'SESSION_LEFT') {
    return (
      <div className="min-h-screen bg-bwm-page">
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 flex items-center justify-center pt-20 px-4">
            <Card className="max-w-md w-full bg-bwm-card/60 border-bwm-card">
              <CardContent className="p-8 text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-[#2a7a6f]/20"></div>
                  <div className="absolute inset-0 rounded-full bg-[#2a7a6f]/10 flex items-center justify-center">
                    <Video className="w-10 h-10 text-[#5eb8a8]" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-bwm-primary mb-2">
                  {t('meeting.left.title', 'Meeting ended')}
                </h2>
                <p className="text-bwm-secondary mb-6">
                  {t('meeting.left.description', 'The meeting has been ended by the host.')}
                </p>
                <Button
                  onClick={() => navigate('/my-sessions')}
                  variant="outline"
                  className="w-full bg-bwm-section border-[#5eb8a8]/50 text-bwm-primary hover:bg-[#2a7a6f]/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('meeting.backToSessions', 'Back to My Sessions')}
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Error state: Generic error
  if (error) {
    return (
      <div className="min-h-screen bg-bwm-page">
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 container mx-auto px-4 py-8 pt-24">
            <Card className="max-w-md mx-auto bg-bwm-card/60 border-bwm-card">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                <h2 className="text-xl font-bold text-bwm-primary mb-2">
                  {t('common.error', 'Error')}
                </h2>
                <p className="text-bwm-secondary mb-6">{error}</p>
                <Button
                  onClick={() => navigate(-1)}
                  variant="outline"
                  className="w-full bg-bwm-section border-[#5eb8a8]/50 text-bwm-primary hover:bg-[#2a7a6f]/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('common.goBack', 'Go back')}
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Pre-join screen (before token is obtained)
  if (!token || !serverUrl) {
    return (
      <div className="min-h-screen bg-bwm-page">
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 flex items-center justify-center pt-20 pb-8 px-4">
            <Card className="max-w-lg w-full bg-bwm-card/60 border-bwm-card">
              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Title */}
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold text-bwm-primary">
                    {booking?.serviceName || t('meeting.prejoin.title', 'Join Meeting')}
                  </h1>
                  {booking?.coachName && (
                    <p className="text-bwm-secondary">
                      {t('meeting.prejoin.with', 'with')} {booking.coachName}
                    </p>
                  )}
                </div>

                {/* Step 1: Pre-prompt (Google Meet approach) */}
                {showPrePrompt && (
                  <div className="rounded-lg border border-[#5eb8a8]/30 bg-[#2a7a6f]/10 p-5 space-y-4">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-full bg-[#2a7a6f]/20 flex items-center justify-center">
                        <Camera className="h-8 w-8 text-[#5eb8a8]" />
                      </div>
                      <h3 className="text-lg font-semibold text-bwm-primary">
                        {t('meeting.permissions.prePrompt.title', 'Allow camera and microphone')}
                      </h3>
                      <p className="text-sm text-bwm-secondary">
                        {t('meeting.permissions.prePrompt.description', 'To be seen and heard in the meeting, we need access to your camera and microphone. Your browser will ask for permission next.')}
                      </p>
                    </div>
                    <Button
                      onClick={handleAcceptPrePrompt}
                      disabled={permissionStatus === 'checking'}
                      className="w-full bg-gradient-to-r from-[#2a7a6f] to-[#1d5c54] hover:from-[#33897d] hover:to-[#2a7a6f] text-white h-11"
                    >
                      {permissionStatus === 'checking' ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Camera className="h-5 w-5 mr-2" />
                      )}
                      {t('meeting.permissions.prePrompt.allow', 'Allow microphone and camera')}
                    </Button>
                  </div>
                )}

                {/* Step 2: Denied → Browser-specific instructions with tabs */}
                {showDeniedInstructions && (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="h-6 w-6 text-amber-400 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-amber-300">
                          {t('meeting.permissions.denied.title', 'Camera or microphone access denied')}
                        </h3>
                        <p className="text-sm text-bwm-muted">
                          {cameraDenied && microphoneDenied
                            ? t('meeting.permissions.denied.both', 'Both camera and microphone permissions are blocked.')
                            : cameraDenied
                              ? t('meeting.permissions.denied.camera', 'Camera permission is blocked.')
                              : t('meeting.permissions.denied.microphone', 'Microphone permission is blocked.')}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-bwm-secondary">
                      {t('meeting.permissions.denied.detectedBrowser', 'Detected browser:')} <span className="font-semibold text-[#5eb8a8]">{browserName}</span>
                    </p>

                    {/* Browser tabs for instructions */}
                    {browserTabs.length > 1 ? (
                      <Tabs defaultValue={permDeviceType} className="w-full">
                        <TabsList className="w-full bg-bwm-section/50 border border-bwm-card">
                          {browserTabs.map((tab) => (
                            <TabsTrigger
                              key={tab.id}
                              value={tab.id}
                              className={cn(
                                'flex-1 text-xs data-[state=active]:bg-[#2a7a6f]/30 data-[state=active]:text-[#5eb8a8]',
                                tab.id === permDeviceType && 'font-semibold'
                              )}
                            >
                              {tab.label}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {browserTabs.map((tab) => (
                          <TabsContent key={tab.id} value={tab.id}>
                            <div className="rounded-md bg-bwm-section/50 p-3">
                              <p className="text-xs font-medium text-bwm-secondary mb-2">
                                {t('meeting.permissions.denied.howToFix', 'How to fix it:')}
                              </p>
                              <ol className="space-y-1.5">
                                {tab.instructions.steps.map((step, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-bwm-muted">
                                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#2a7a6f]/30 text-[#5eb8a8] flex items-center justify-center text-xs font-bold">
                                      {i + 1}
                                    </span>
                                    <span>{t(tab.instructions.stepKeys[i], step)}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    ) : (
                      <div className="rounded-md bg-bwm-section/50 p-3">
                        <p className="text-xs font-medium text-bwm-secondary mb-2">
                          {t('meeting.permissions.denied.howToFix', 'How to fix it:')}
                        </p>
                        <ol className="space-y-1.5">
                          {permissionInstructions.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-bwm-muted">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-[#2a7a6f]/30 text-[#5eb8a8] flex items-center justify-center text-xs font-bold">
                                {i + 1}
                              </span>
                              <span>{t(permissionInstructions.stepKeys[i], step)}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    <Button
                      onClick={handleRetryPermissions}
                      disabled={permissionStatus === 'checking'}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {permissionStatus === 'checking' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      {t('meeting.permissions.denied.retry', 'I fixed it, try again')}
                    </Button>
                  </div>
                )}

                {/* Camera preview */}
                <div className="aspect-video rounded-lg overflow-hidden bg-bwm-section border border-bwm-card relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      'w-full h-full object-cover',
                      !videoEnabled && 'hidden'
                    )}
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {!videoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-bwm-card/50 flex items-center justify-center">
                        <VideoOff className="h-10 w-10 text-bwm-muted" />
                      </div>
                    </div>
                  )}

                  {/* Preview controls */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <Button
                      variant={audioEnabled ? 'outline' : 'destructive'}
                      size="icon"
                      className={cn(
                        'h-10 w-10 rounded-full',
                        audioEnabled
                          ? 'bg-bwm-section/80 border-[#5eb8a8]/50 text-bwm-primary hover:bg-[#2a7a6f]/20'
                          : ''
                      )}
                      onClick={toggleAudio}
                    >
                      {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant={videoEnabled ? 'outline' : 'destructive'}
                      size="icon"
                      className={cn(
                        'h-10 w-10 rounded-full',
                        videoEnabled
                          ? 'bg-bwm-section/80 border-[#5eb8a8]/50 text-bwm-primary hover:bg-[#2a7a6f]/20'
                          : ''
                      )}
                      onClick={toggleVideo}
                    >
                      {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </Button>
                    <DeviceSelector
                      selectedAudioOutputDeviceId={selectedAudioOutputDeviceId}
                      onAudioOutputDeviceChange={setSelectedAudioOutputDeviceId}
                      onOpenChange={setIsDeviceSelectorOpen}
                      trigger={
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full bg-bwm-section/80 border-[#5eb8a8]/50 text-bwm-primary hover:bg-[#2a7a6f]/20"
                        >
                          <Settings className="h-5 w-5" />
                        </Button>
                      }
                    />
                  </div>
                </div>

                {/* Name input */}
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-bwm-secondary">
                    {t('meeting.prejoin.nickname', 'Your name')}
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName || defaultName || ''}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('meeting.prejoin.nicknamePlaceholder', 'Enter your name')}
                    className="bg-bwm-section border-bwm-card text-bwm-primary placeholder:text-bwm-muted focus:border-[#5eb8a8]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleJoin();
                    }}
                  />
                </div>

                {/* Join button */}
                <Button
                  onClick={handleJoin}
                  disabled={isJoining || !(displayName || defaultName)?.trim()}
                  className="w-full bg-gradient-to-r from-[#2a7a6f] to-[#1d5c54] hover:from-[#33897d] hover:to-[#2a7a6f] text-white h-12 text-lg font-medium"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      {t('meeting.prejoin.joining', 'Joining...')}
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-2" />
                      {t('meeting.prejoin.join', 'Join Meeting')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Connection error state - show retry option
  if (connectionError) {
    return (
      <div className="min-h-screen bg-bwm-page">
        <div className="min-h-screen flex flex-col">
          <Header variant="page" />
          <main className="flex-1 flex items-center justify-center pt-20 px-4">
            <Card className="max-w-md w-full bg-bwm-card/60 border-bwm-card">
              <CardContent className="p-8 text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-red-500/20"></div>
                  <div className="absolute inset-0 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-bwm-primary mb-2">
                  {t('meeting.connectionError.title', 'Connection failed')}
                </h2>
                <p className="text-bwm-secondary mb-2">
                  {t('meeting.connectionError.description', 'Could not connect to the meeting room. Please try again.')}
                </p>
                <p className="text-bwm-muted/60 text-xs mb-4 font-mono break-all">
                  {connectionError}
                </p>
                <p className="text-bwm-muted text-sm mb-6">
                  {t('meeting.connectionError.suggestions', 'Check your internet connection, disable VPN/proxy, or try a different browser.')}
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleRetryJoin}
                    className="w-full bg-gradient-to-r from-[#2a7a6f] to-[#1d5c54] hover:from-[#33897d] hover:to-[#2a7a6f] text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('meeting.connectionError.retry', 'Try again')}
                  </Button>
                  <Button
                    onClick={() => navigate(-1)}
                    variant="outline"
                    className="w-full bg-bwm-section border-[#5eb8a8]/50 text-bwm-primary hover:bg-[#2a7a6f]/20"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('common.goBack', 'Go back')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Connected meeting room
  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      options={roomOptions}
      className="h-dvh w-full flex flex-col bg-bwm-page overflow-hidden"
      onDisconnected={handleLeave}
      onError={handleConnectionError}
    >
      <MeetingRoomContent
        booking={booking!}
        bookingId={bookingId!}
        isCoach={isCoach}
        isRecording={isRecording}
        isRecordingLoading={isRecordingLoading}
        participantName={displayName || defaultName || ''}
        sceneState={sceneState}
        sceneSetters={sceneSetters}
        isPresentationOpen={isPresentationOpen}
        setIsPresentationOpen={setIsPresentationOpen}
        isPresentationSharing={isPresentationSharing}
        setIsPresentationSharing={setIsPresentationSharing}
        isSceneControlsOpen={isSceneControlsOpen}
        setIsSceneControlsOpen={setIsSceneControlsOpen}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onLeave={handleLeave}
        handleLayoutChange={handleLayoutChange}
        handleBackgroundChange={handleBackgroundChange}
        handleCameraScaleChange={handleCameraScaleChange}
        handleCameraSlotStyleChange={handleCameraSlotStyleChange}
        handleCornerImageSet={handleCornerImageSet}
        handleCornerImageRemove={handleCornerImageRemove}
        handleCornerImageToggle={handleCornerImageToggle}
      />
    </LiveKitRoom>
  );
}

/**
 * Inner component that renders the meeting content.
 * Must be inside LiveKitRoom to use LiveKit hooks.
 */
interface MeetingRoomContentProps {
  booking: Booking;
  bookingId: string;
  isCoach: boolean;
  isRecording: boolean;
  isRecordingLoading: boolean;
  sceneState: MeetingSceneState;
  sceneSetters: MeetingSceneSetters;
  isPresentationOpen: boolean;
  setIsPresentationOpen: (open: boolean) => void;
  isPresentationSharing: boolean;
  setIsPresentationSharing: (sharing: boolean) => void;
  isSceneControlsOpen: boolean;
  setIsSceneControlsOpen: (open: boolean) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onLeave: () => void;
  handleLayoutChange: (layout: MeetingSceneState['layout']) => void;
  handleBackgroundChange: (background: MeetingSceneState['background']) => void;
  handleCameraScaleChange: (scale: number) => void;
  handleCameraSlotStyleChange: (slotId: string, style: Partial<CameraSlotStyle>) => void;
  handleCornerImageSet: (corner: CornerImage['corner'], image: SavedCornerImage) => void;
  handleCornerImageRemove: (corner: CornerImage['corner']) => void;
  handleCornerImageToggle: (corner: CornerImage['corner']) => void;
  participantName: string;
}

function MeetingRoomContent({
  booking,
  bookingId,
  isCoach,
  isRecording,
  isRecordingLoading,
  sceneState,
  sceneSetters,
  isPresentationOpen,
  setIsPresentationOpen,
  isPresentationSharing,
  setIsPresentationSharing,
  isSceneControlsOpen,
  setIsSceneControlsOpen,
  onStartRecording,
  onStopRecording,
  onLeave,
  handleLayoutChange,
  handleBackgroundChange,
  handleCameraScaleChange,
  handleCameraSlotStyleChange,
  handleCornerImageSet,
  handleCornerImageRemove,
  handleCornerImageToggle,
  participantName,
}: MeetingRoomContentProps) {
  const remoteParticipants = useRemoteParticipants();
  const [hostWasPresent, setHostWasPresent] = useState(false);

  // Keep screen awake during the meeting
  useWakeLock(true);

  // Meeting reactions
  const { reactions, sendReaction, isRateLimited } = useMeetingReactions(participantName);

  // Scene channel for syncing state between coach and client
  useMeetingSceneChannel({
    isCoach,
    sceneState,
    sceneSetters,
  });

  // Detect host disconnect - when client sees host join then leave
  useEffect(() => {
    // Only track for clients, not coaches
    if (isCoach) return;

    // Mark that host was present when we see any remote participant
    if (remoteParticipants.length > 0 && !hostWasPresent) {
      setHostWasPresent(true);
    }

    // If host was present and now there are no remote participants, coach left
    if (hostWasPresent && remoteParticipants.length === 0) {
      console.log('[MeetingRoom] Host disconnected, ending meeting for client');
      onLeave();
    }
  }, [isCoach, remoteParticipants.length, hostWasPresent, onLeave]);

  return (
    <>
      <RoomAudioRenderer />

      {/* Header */}
      <MeetingHeader booking={booking} isRecording={isRecording} />

      {/* Main content */}
      <div
        className="flex-1 min-h-0 relative overflow-hidden transition-all duration-300"
        style={{
          ...(sceneState.background.type === 'color'
            ? { backgroundColor: sceneState.background.value }
            : {
                backgroundImage: `url(${sceneState.background.value})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }),
        }}
      >
        {/* Corner images */}
        {sceneState.cornerImages.filter(img => img.isVisible).map(img => (
          <div
            key={img.id}
            className={cn(
              'absolute z-10 pointer-events-none',
              img.corner === 'top-left' && 'top-4 left-4',
              img.corner === 'top-right' && 'top-4 right-4',
              img.corner === 'bottom-left' && 'bottom-4 left-4',
              img.corner === 'bottom-right' && 'bottom-4 right-4'
            )}
            style={{
              width: `${img.width}%`,
              maxWidth: '150px',
            }}
          >
            <img src={img.url} alt={img.name} className="w-full h-auto" />
          </div>
        ))}

        <MeetingGrid
          className="h-full"
          layout={sceneState.layout}
          cameraScale={sceneState.cameraScale}
          cameraSlotStyles={sceneState.cameraSlotStyles}
          speakerNameStyle={sceneState.speakerNameStyle}
        />

        {/* Presentation overlay */}
        <PresentationManager
          onSharingChange={setIsPresentationSharing}
          isNativeScreenShareActive={false}
          isPopoverOpen={isPresentationOpen}
          onPopoverClose={() => setIsPresentationOpen(false)}
        />

        {/* Reaction overlay */}
        <MeetingReactionOverlay reactions={reactions} />

        {/* Scene controls panel (coach only) */}
        {isCoach && (
          <MeetingSceneControls
            isOpen={isSceneControlsOpen}
            onClose={() => setIsSceneControlsOpen(false)}
            bookingId={bookingId}
            sceneState={sceneState}
            onLayoutChange={handleLayoutChange}
            onBackgroundChange={handleBackgroundChange}
            onCameraScaleChange={handleCameraScaleChange}
            onCameraSlotStyleChange={handleCameraSlotStyleChange}
            onCornerImageSet={handleCornerImageSet}
            onCornerImageRemove={handleCornerImageRemove}
            onCornerImageToggle={handleCornerImageToggle}
            onTextBannerAdd={() => {}}
            onTextBannerRemove={() => {}}
            onTextBannerShow={() => {}}
          />
        )}
      </div>

      {/* Control bar */}
      <MeetingControlBar
        isCoach={isCoach}
        isRecording={isRecording}
        isRecordingLoading={isRecordingLoading}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        onLeave={onLeave}
        onPresentationToggle={() => setIsPresentationOpen(!isPresentationOpen)}
        isPresentationOpen={isPresentationOpen}
        onSceneControlsToggle={isCoach ? () => setIsSceneControlsOpen(!isSceneControlsOpen) : undefined}
        isSceneControlsOpen={isSceneControlsOpen}
        currentLayout={sceneState.layout}
        onLayoutChange={handleLayoutChange}
        onReaction={sendReaction}
        isReactionRateLimited={isRateLimited}
      />
    </>
  );
}
