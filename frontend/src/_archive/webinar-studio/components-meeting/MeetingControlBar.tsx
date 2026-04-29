import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useToast } from '@/hooks/use-toast';
import { getDeviceInfoString } from '@/shared/utils/deviceInfo';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Circle,
  Square,
  Settings,
  Presentation,
  Palette,
  LayoutGrid,
  Columns,
  Rows,
  PictureInPicture,
  Check,
  ShieldAlert,
  RefreshCw,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeviceSelector } from '@/components/webinar/DeviceSelector';
import { MeetingReactionButtons } from '@/components/meeting/MeetingReactionButtons';
import { useMediaPermissions } from '@/hooks/useMediaPermissions';
import { MEETING_REACTION_EMOJIS, type MeetingReactionType } from '@/hooks/meeting/useMeetingReactions';
import type { MeetingSceneState } from '@/hooks/meeting/useMeetingSceneSync';

// Layout options for the selector
const LAYOUT_OPTIONS = [
  { id: 'side-by-side', nameKey: 'meeting.layouts.sideBySide', icon: Columns },
  { id: 'stacked', nameKey: 'meeting.layouts.stacked', icon: Rows },
  { id: 'pip-coach', nameKey: 'meeting.layouts.pipCoach', icon: PictureInPicture },
  { id: 'pip-client', nameKey: 'meeting.layouts.pipClient', icon: PictureInPicture },
] as const;

// Shared button style for inactive control buttons
const CONTROL_BTN = 'bg-bwm-section hover:bg-bwm-card-alt border-bwm-card text-bwm-primary';

interface MeetingControlBarProps {
  isCoach: boolean;
  isRecording: boolean;
  isRecordingLoading?: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onLeave: () => void;
  onPresentationToggle?: () => void;
  isPresentationOpen?: boolean;
  onSceneControlsToggle?: () => void;
  isSceneControlsOpen?: boolean;
  // Layout controls (available for everyone)
  currentLayout?: MeetingSceneState['layout'];
  onLayoutChange?: (layout: MeetingSceneState['layout']) => void;
  // Reactions
  onReaction?: (type: MeetingReactionType) => void;
  isReactionRateLimited?: boolean;
}

export function MeetingControlBar({
  isCoach,
  isRecording,
  isRecordingLoading = false,
  onStartRecording,
  onStopRecording,
  onLeave,
  onPresentationToggle,
  isPresentationOpen,
  onSceneControlsToggle,
  isSceneControlsOpen,
  currentLayout = 'side-by-side',
  onLayoutChange,
  onReaction,
  isReactionRateLimited = false,
}: MeetingControlBarProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { localParticipant } = useLocalParticipant();
  const { instructions: permissionInstructions, requestPermissions, recheckPermissions, browserTabs, deviceType, browserName, isMobile } = useMediaPermissions();

  // Start with audio and video disabled for privacy
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isDeviceSelectorOpen, setIsDeviceSelectorOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [permissionDialogType, setPermissionDialogType] = useState<'camera' | 'microphone' | 'both'>('both');
  const [screenShareInfoOpen, setScreenShareInfoOpen] = useState(false);
  const [isTogglingAudio, setIsTogglingAudio] = useState(false);
  const [isTogglingVideo, setIsTogglingVideo] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const togglingAudioRef = useRef(false);
  const togglingVideoRef = useRef(false);

  const showPermissionDeniedDialog = useCallback((type: 'camera' | 'microphone') => {
    setPermissionDialogType(type);
    setPermissionDialogOpen(true);
  }, []);

  const handleRetryPermissionsFromDialog = useCallback(async () => {
    await recheckPermissions();
    const granted = await requestPermissions();
    if (granted) {
      setPermissionDialogOpen(false);
    }
  }, [recheckPermissions, requestPermissions]);

  const getMediaErrorMessage = useCallback((err: unknown, device: 'camera' | 'microphone'): string | null => {
    if (!(err instanceof DOMException)) return t('meeting.mediaErrors.generic', 'Could not activate the {{device}}', { device: t(`meeting.mediaErrors.device.${device}`) });
    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return null; // handled by permission dialog
      case 'NotReadableError':
      case 'TrackStartError':
        return t('meeting.mediaErrors.inUse', 'Your {{device}} is being used by another app. Close other apps and try again.', { device: t(`meeting.mediaErrors.device.${device}`) });
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return t('meeting.mediaErrors.notFound', 'No {{device}} was found. Please connect one and try again.', { device: t(`meeting.mediaErrors.device.${device}`) });
      case 'OverconstrainedError':
        return t('meeting.mediaErrors.overconstrained', 'Your {{device}} does not support the required settings. Try a different device.', { device: t(`meeting.mediaErrors.device.${device}`) });
      case 'AbortError':
        return t('meeting.mediaErrors.aborted', '{{Device}} access was interrupted. Please try again.', { Device: device === 'camera' ? t('meeting.mediaErrors.device.cameraCapital', 'Camera') : t('meeting.mediaErrors.device.microphoneCapital', 'Microphone') });
      default:
        return t('meeting.mediaErrors.generic', 'Could not activate the {{device}}', { device: t(`meeting.mediaErrors.device.${device}`) });
    }
  }, [t]);

  const toggleAudio = useCallback(async () => {
    if (!localParticipant || togglingAudioRef.current) return;
    togglingAudioRef.current = true;
    setIsTogglingAudio(true);
    try {
      await localParticipant.setMicrophoneEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    } catch (err) {
      const errName = err instanceof DOMException ? err.name : 'Unknown';
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[MeetingControlBar] Failed to toggle audio | ${getDeviceInfoString()} | error=${errName} | message=${errMsg}`);
      const isPermissionError = err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      if (isPermissionError) {
        showPermissionDeniedDialog('microphone');
      } else {
        const message = getMediaErrorMessage(err, 'microphone');
        if (message) {
          toast({ title: t('meeting.mediaErrors.micTitle', 'Microphone error'), description: message, variant: 'destructive' });
        }
      }
    } finally {
      togglingAudioRef.current = false;
      setIsTogglingAudio(false);
    }
  }, [localParticipant, isAudioEnabled, showPermissionDeniedDialog, getMediaErrorMessage, toast, t]);

  const toggleVideo = useCallback(async () => {
    if (!localParticipant || togglingVideoRef.current) return;
    togglingVideoRef.current = true;
    setIsTogglingVideo(true);
    try {
      await localParticipant.setCameraEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    } catch (err) {
      const errName = err instanceof DOMException ? err.name : 'Unknown';
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[MeetingControlBar] Failed to toggle video | ${getDeviceInfoString()} | error=${errName} | message=${errMsg}`);
      const isPermissionError = err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      if (isPermissionError) {
        showPermissionDeniedDialog('camera');
      } else {
        const message = getMediaErrorMessage(err, 'camera');
        if (message) {
          toast({ title: t('meeting.mediaErrors.cameraTitle', 'Camera error'), description: message, variant: 'destructive' });
        }
      }
    } finally {
      togglingVideoRef.current = false;
      setIsTogglingVideo(false);
    }
  }, [localParticipant, isVideoEnabled, showPermissionDeniedDialog, getMediaErrorMessage, toast, t]);

  const isIOS = deviceType === 'ios-safari' || deviceType === 'ios-chrome';

  const toggleScreenShare = useCallback(async () => {
    if (!localParticipant) return;

    // iOS browsers don't support getDisplayMedia at all
    if (isIOS) {
      setScreenShareInfoOpen(true);
      return;
    }

    try {
      await localParticipant.setScreenShareEnabled(!isScreenSharing);
      setIsScreenSharing(!isScreenSharing);
    } catch (err) {
      console.error('Failed to toggle screen share:', err);
      const isPermissionError = err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'NotFoundError' || err.name === 'AbortError');
      if (isPermissionError && isMobile) {
        // Android user denied or screen share not supported
        setScreenShareInfoOpen(true);
      }
    }
  }, [localParticipant, isScreenSharing, isIOS, isMobile]);

  // Sync with actual track state
  const audioTrack = localParticipant?.getTrackPublication(Track.Source.Microphone);
  const videoTrack = localParticipant?.getTrackPublication(Track.Source.Camera);
  const screenTrack = localParticipant?.getTrackPublication(Track.Source.ScreenShare);

  const audioEnabled = audioTrack ? !audioTrack.isMuted : isAudioEnabled;
  const videoEnabled = videoTrack ? !videoTrack.isMuted : isVideoEnabled;
  const screenShareActive = !!screenTrack && !screenTrack.isMuted;

  // Reaction keys for mobile "more" menu
  const REACTION_KEYS: MeetingReactionType[] = ['star', 'mindblown', 'muscle', 'pray', 'sparkles', 'hundred'];

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-1.5 sm:gap-3 px-2 sm:px-3 py-2 sm:py-3 bg-bwm-card/95 backdrop-blur border-t border-bwm-card shrink-0 max-w-full">
        {/* Mic toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={audioEnabled ? 'outline' : 'destructive'}
              size="icon"
              disabled={isTogglingAudio}
              onClick={toggleAudio}
              className={cn(
                'h-9 w-9 sm:h-11 sm:w-11 rounded-full shrink-0',
                audioEnabled ? CONTROL_BTN : ''
              )}
            >
              {isTogglingAudio ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : audioEnabled ? <Mic className="h-4 w-4 sm:h-5 sm:w-5" /> : <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {audioEnabled ? t('meeting.muteMic', 'Mute') : t('meeting.unmuteMic', 'Unmute')}
          </TooltipContent>
        </Tooltip>

        {/* Camera toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={videoEnabled ? 'outline' : 'destructive'}
              size="icon"
              disabled={isTogglingVideo}
              onClick={toggleVideo}
              className={cn(
                'h-9 w-9 sm:h-11 sm:w-11 rounded-full shrink-0',
                videoEnabled ? CONTROL_BTN : ''
              )}
            >
              {isTogglingVideo ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : videoEnabled ? <Video className="h-4 w-4 sm:h-5 sm:w-5" /> : <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {videoEnabled ? t('meeting.cameraOff', 'Turn off camera') : t('meeting.cameraOn', 'Turn on camera')}
          </TooltipContent>
        </Tooltip>

        {/* === DESKTOP-ONLY controls (hidden on mobile, shown in "More" menu instead) === */}

        {/* Screen share - desktop only */}
        {!isMobile && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={screenShareActive ? 'default' : 'outline'}
                size="icon"
                onClick={toggleScreenShare}
                className={cn(
                  'h-9 w-9 sm:h-11 sm:w-11 rounded-full shrink-0',
                  screenShareActive
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : CONTROL_BTN
                )}
              >
                {screenShareActive ? <MonitorOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {screenShareActive ? t('meeting.stopScreenShare', 'Stop sharing') : t('meeting.startScreenShare', 'Share screen')}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Presentation - desktop only */}
        {!isMobile && onPresentationToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isPresentationOpen ? 'default' : 'outline'}
                size="icon"
                onClick={onPresentationToggle}
                className={cn(
                  'h-9 w-9 sm:h-11 sm:w-11 rounded-full shrink-0',
                  isPresentationOpen
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : CONTROL_BTN
                )}
              >
                <Presentation className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('meeting.presentation', 'Presentation')}</TooltipContent>
          </Tooltip>
        )}

        {/* Scene controls - desktop only (coach) */}
        {!isMobile && isCoach && onSceneControlsToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isSceneControlsOpen ? 'default' : 'outline'}
                size="icon"
                onClick={onSceneControlsToggle}
                className={cn(
                  'h-9 w-9 sm:h-11 sm:w-11 rounded-full shrink-0',
                  isSceneControlsOpen
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : CONTROL_BTN
                )}
              >
                <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('meeting.sceneControls', 'Scene controls')}</TooltipContent>
          </Tooltip>
        )}

        {/* Layout selector - desktop only */}
        {!isMobile && onLayoutChange && (
          <Popover open={isLayoutOpen} onOpenChange={setIsLayoutOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn('h-9 w-9 sm:h-11 sm:w-11 rounded-full shrink-0', CONTROL_BTN)}
                  >
                    <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>{t('meeting.layout', 'Layout')}</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-48 p-2 bg-bwm-card border-bwm-card" align="center" side="top">
              <div className="flex flex-col gap-1">
                {LAYOUT_OPTIONS.map((layout) => {
                  const Icon = layout.icon;
                  const isActive = currentLayout === layout.id;
                  return (
                    <Button
                      key={layout.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onLayoutChange(layout.id);
                        setIsLayoutOpen(false);
                      }}
                      className={cn(
                        'justify-start gap-2 text-bwm-primary hover:bg-bwm-section',
                        isActive && 'bg-bwm-section'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{t(layout.nameKey)}</span>
                      {isActive && <Check className="h-4 w-4 text-cyan-400" />}
                    </Button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Reactions - desktop only */}
        {!isMobile && onReaction && (
          <MeetingReactionButtons
            onReaction={onReaction}
            isRateLimited={isReactionRateLimited}
          />
        )}

        {/* Device settings - desktop only */}
        {!isMobile && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <DeviceSelector
                  onOpenChange={setIsDeviceSelectorOpen}
                  trigger={
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn('h-9 w-9 sm:h-11 sm:w-11 rounded-full shrink-0', CONTROL_BTN)}
                    >
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  }
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>{t('meeting.deviceSettings', 'Device settings')}</TooltipContent>
          </Tooltip>
        )}

        {/* === MOBILE "More" menu — groups secondary controls === */}
        {isMobile && (
          <Popover open={isMoreOpen} onOpenChange={setIsMoreOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn('h-9 w-9 rounded-full shrink-0', CONTROL_BTN)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 bg-bwm-card border-bwm-card" align="center" side="top">
              <div className="flex flex-col gap-0.5">
                {/* Reactions inline */}
                {onReaction && (
                  <div className="flex justify-center gap-1 py-1.5 border-b border-bwm-section mb-1">
                    {isReactionRateLimited ? (
                      <p className="text-xs text-amber-400 px-2 py-1">
                        {t('meeting.reactions.slowDown', 'Slow down!')}
                      </p>
                    ) : (
                      REACTION_KEYS.map((key) => (
                        <button
                          key={key}
                          onClick={() => { onReaction(key); setIsMoreOpen(false); }}
                          className="text-xl p-1 rounded-lg hover:scale-110 hover:bg-bwm-section active:scale-95 transition-transform"
                          title={t(`meeting.reactions.${key}`, key)}
                        >
                          {MEETING_REACTION_EMOJIS[key]}
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Layout sub-options */}
                {onLayoutChange && (
                  <>
                    <p className="text-[10px] text-bwm-secondary uppercase tracking-wider px-2 pt-1">{t('meeting.layout', 'Layout')}</p>
                    {LAYOUT_OPTIONS.map((layout) => {
                      const Icon = layout.icon;
                      const isActive = currentLayout === layout.id;
                      return (
                        <Button
                          key={layout.id}
                          variant="ghost"
                          size="sm"
                          onClick={() => { onLayoutChange(layout.id); setIsMoreOpen(false); }}
                          className={cn(
                            'justify-start gap-2 text-bwm-primary hover:bg-bwm-section h-8 text-xs',
                            isActive && 'bg-bwm-section'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="flex-1 text-left">{t(layout.nameKey)}</span>
                          {isActive && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                        </Button>
                      );
                    })}
                    <div className="border-b border-bwm-section my-1" />
                  </>
                )}

                {/* Presentation */}
                {onPresentationToggle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { onPresentationToggle(); setIsMoreOpen(false); }}
                    className={cn(
                      'justify-start gap-2 text-bwm-primary hover:bg-bwm-section h-8 text-xs',
                      isPresentationOpen && 'text-purple-400'
                    )}
                  >
                    <Presentation className="h-3.5 w-3.5" />
                    <span>{t('meeting.presentation', 'Presentation')}</span>
                    {isPresentationOpen && <Check className="h-3.5 w-3.5 text-purple-400 ml-auto" />}
                  </Button>
                )}

                {/* Scene controls (coach only) */}
                {isCoach && onSceneControlsToggle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { onSceneControlsToggle(); setIsMoreOpen(false); }}
                    className={cn(
                      'justify-start gap-2 text-bwm-primary hover:bg-bwm-section h-8 text-xs',
                      isSceneControlsOpen && 'text-cyan-400'
                    )}
                  >
                    <Palette className="h-3.5 w-3.5" />
                    <span>{t('meeting.sceneControls', 'Scene controls')}</span>
                    {isSceneControlsOpen && <Check className="h-3.5 w-3.5 text-cyan-400 ml-auto" />}
                  </Button>
                )}

                {/* Device settings */}
                <DeviceSelector
                  onOpenChange={(open) => { setIsDeviceSelectorOpen(open); if (open) setIsMoreOpen(false); }}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start gap-2 text-bwm-primary hover:bg-bwm-section h-8 text-xs w-full"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>{t('meeting.deviceSettings', 'Device settings')}</span>
                    </Button>
                  }
                />
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Recording (coach only) */}
        {isCoach && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? 'destructive' : 'outline'}
                size="icon"
                disabled={isRecordingLoading}
                onClick={isRecording ? onStopRecording : onStartRecording}
                className={cn(
                  'h-9 w-9 sm:h-11 sm:w-11 rounded-full shrink-0',
                  isRecordingLoading
                    ? 'border-red-400/50 text-red-400'
                    : isRecording
                      ? 'animate-pulse'
                      : CONTROL_BTN
                )}
              >
                {isRecordingLoading ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-red-400" />
                ) : isRecording ? (
                  <Square className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                ) : (
                  <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isRecordingLoading
                ? t('meeting.recordingStarting', 'Starting recording...')
                : isRecording
                  ? t('meeting.stopRecording', 'Stop recording')
                  : t('meeting.startRecording', 'Start recording')}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Leave meeting */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              onClick={onLeave}
              className="h-9 w-9 sm:h-11 sm:w-11 rounded-full shrink-0"
            >
              <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('meeting.leaveMeeting', 'Leave meeting')}</TooltipContent>
        </Tooltip>
      </div>

      {/* Permission denied dialog with browser tabs */}
      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent className="bg-bwm-card border-bwm-card max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-300">
              <ShieldAlert className="h-5 w-5" />
              {t('meeting.permissions.denied.title', 'Camera or microphone access denied')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-bwm-muted">
              {permissionDialogType === 'both'
                ? t('meeting.permissions.denied.both', 'Both camera and microphone permissions are blocked.')
                : permissionDialogType === 'camera'
                  ? t('meeting.permissions.denied.camera', 'Camera permission is blocked.')
                  : t('meeting.permissions.denied.microphone', 'Microphone permission is blocked.')}
            </p>

            <p className="text-xs text-bwm-secondary">
              {t('meeting.permissions.denied.detectedBrowser', 'Detected browser:')} <span className="font-semibold text-[#5eb8a8]">{browserName}</span>
            </p>

            {browserTabs.length > 1 ? (
              <Tabs defaultValue={deviceType} className="w-full">
                <TabsList className="w-full bg-bwm-section border border-bwm-card">
                  {browserTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        'flex-1 text-xs data-[state=active]:bg-[#2a7a6f]/30 data-[state=active]:text-[#5eb8a8]',
                        tab.id === deviceType && 'font-semibold'
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
              onClick={handleRetryPermissionsFromDialog}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('meeting.permissions.denied.retry', 'I fixed it, try again')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Screen share info dialog (mobile) */}
      <Dialog open={screenShareInfoOpen} onOpenChange={setScreenShareInfoOpen}>
        <DialogContent className="bg-bwm-card border-bwm-card max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-300">
              <Monitor className="h-5 w-5" />
              {t('meeting.screenShare.notAvailable.title', 'Screen sharing')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isIOS ? (
              <>
                <p className="text-sm text-bwm-muted">
                  {t('meeting.screenShare.notAvailable.iosDescription', 'Screen sharing is not supported on iOS browsers (Safari, Chrome, Firefox). This is a limitation of iOS, not of this app.')}
                </p>
                <div className="rounded-md bg-bwm-section/50 p-3">
                  <p className="text-xs font-medium text-bwm-secondary mb-2">
                    {t('meeting.screenShare.notAvailable.alternatives', 'Alternatives:')}
                  </p>
                  <ol className="space-y-1.5">
                    <li className="flex items-start gap-2 text-sm text-bwm-muted">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                      <span>{t('meeting.screenShare.notAvailable.iosAlt1', 'Use a Mac, Windows or Android device to share your screen')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-bwm-muted">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                      <span>{t('meeting.screenShare.notAvailable.iosAlt2', 'Use the Presentation feature to share files or slides')}</span>
                    </li>
                  </ol>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-bwm-muted">
                  {t('meeting.screenShare.notAvailable.androidDescription', 'To share your screen on Android, you need to allow the permission when prompted.')}
                </p>
                <div className="rounded-md bg-bwm-section/50 p-3">
                  <p className="text-xs font-medium text-bwm-secondary mb-2">
                    {t('meeting.screenShare.notAvailable.howTo', 'How to share your screen:')}
                  </p>
                  <ol className="space-y-1.5">
                    <li className="flex items-start gap-2 text-sm text-bwm-muted">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                      <span>{t('meeting.screenShare.notAvailable.androidStep1', 'Tap the screen share button')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-bwm-muted">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                      <span>{t('meeting.screenShare.notAvailable.androidStep2', 'Select "Start now" when the system prompt appears')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-bwm-muted">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
                      <span>{t('meeting.screenShare.notAvailable.androidStep3', 'If denied, go to browser settings and allow screen recording permission')}</span>
                    </li>
                  </ol>
                </div>
              </>
            )}

            <Button
              onClick={() => setScreenShareInfoOpen(false)}
              variant="outline"
              className="w-full bg-bwm-section border-bwm-card text-bwm-primary hover:bg-bwm-card-alt"
            >
              {t('common.understood', 'Got it')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
