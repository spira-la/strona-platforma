import { useState, useCallback, useMemo, useRef, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  VideoTrack,
  AudioTrack,
  useParticipants,
  useTracks,
  useConnectionState,
  ConnectionState,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Loader2, VideoOff, BarChart3, RotateCcw, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { SceneCompositor } from './SceneCompositor';
import { ReactionOverlay, type ReactionType } from './ReactionOverlay';
import { WebinarControlBar } from './WebinarControlBar';
import { WebinarChatPanel } from './WebinarChatPanel';
import { WebinarToggleBar } from './WebinarToggleBar';
import type { SceneTemplate } from '@/domain/products/models/scene-template.model';
import { useSmartphoneOrientation } from '@/hooks/useSmartphoneOrientation';
import { usePictureInPicture } from '@/hooks/usePictureInPicture';

// Detect iOS devices (Safari, Chrome, any browser on iOS uses WebKit)
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export interface WebinarPlayerProps {
  className?: string;
  showControls?: boolean;
  isHost?: boolean;
  // Host controls (only used when isHost=true)
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare?: () => void;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  isScreenShareEnabled?: boolean;
  // Fullscreen overlay content (chat, poll, Q&A)
  chatComponent?: ReactNode;
  pollComponent?: ReactNode;
  qaComponent?: ReactNode;
  // Giveaway winner banner (shown in fullscreen when user won)
  winnerBannerComponent?: ReactNode;
  // Giveaway winner overlay (full celebration, rendered inside player for fullscreen support)
  winnerOverlayComponent?: ReactNode;
  // Callback when fullscreen changes
  onFullscreenChange?: (isFullscreen: boolean) => void;
  // Scene template for StreamYard-like layouts
  sceneTemplate?: SceneTemplate | null;
  // Overlay visibility overrides (used with sceneTemplate)
  overlayVisibility?: Record<string, boolean>;
  // Scene state elements (synced from host)
  cameraScale?: number;
  cameraSlotStyles?: Array<{ slotId: string; borderColor?: string; borderWidth?: number }>;
  cornerImages?: Array<any>;
  activeTextBanner?: any | null;
  speakerDisplayNames?: Record<string, string>;
  speakerNameStyle?: {
    showNames: boolean;
    fontSize: number;
    fontColor: string;
    backgroundColor: string;
    position: string;
    padding: number;
    borderRadius: number;
  };
  // Reactions
  reactionsEnabled?: boolean;
  onSendReaction?: (type: ReactionType) => void;
  onReactionReceived?: (type: ReactionType) => void;
  // Attendee count from WebSocket (more accurate than LiveKit participants)
  attendeeCount?: number;
  // IDs of participants who should be visible on scene (from host/shadow scene management)
  onSceneIds?: string[];
  // Unread chat messages count (for badge)
  unreadChatCount?: number;
  // Callback when panel open state changes
  onPanelOpenChange?: (isOpen: boolean) => void;
}

/**
 * WebinarPlayerStandard - Standard version for Chrome, Desktop, Android, etc.
 * 
 * This is the original, stable version that works well on:
 * - Chrome (all platforms)
 * - Desktop browsers
 * - Android browsers
 * - Any non-Safari iOS browser
 * 
 * Used by default unless Safari iPhone is detected.
 */
export function WebinarPlayerStandard({
  className,
  showControls = true,
  isHost = false,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  isAudioEnabled,
  isVideoEnabled,
  isScreenShareEnabled,
  chatComponent,
  pollComponent,
  qaComponent,
  winnerBannerComponent,
  winnerOverlayComponent,
  onFullscreenChange,
  sceneTemplate,
  overlayVisibility,
  cameraScale,
  cameraSlotStyles,
  cornerImages,
  activeTextBanner,
  speakerDisplayNames,
  speakerNameStyle,
  reactionsEnabled = true,
  onSendReaction,
  onReactionReceived,
  attendeeCount,
  onSceneIds,
  unreadChatCount,
  onPanelOpenChange,
}: WebinarPlayerProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'qa' | 'poll'>('chat');
  const containerRef = useRef<HTMLDivElement>(null);
  const reactionOverlayRef = useRef<{ addReaction: (type: ReactionType) => void } | null>(null);

  // Smartphone orientation handling for fullscreen
  const {
    isSmartphone,
    isPortrait,
    isOrientationLocked,
    lockLandscape,
    unlockOrientation,
    supportsOrientationLock,
  } = useSmartphoneOrientation();

  // Get video tracks first so we can pass primary track to PiP hook
  const tracks = useTracks([
    { source: Track.Source.ScreenShare, withPlaceholder: false },
    { source: Track.Source.Camera, withPlaceholder: false },
  ]);

  // Get audio tracks
  const audioTracks = useTracks([
    { source: Track.Source.Microphone, withPlaceholder: false },
  ]);

  // Find video tracks - support multiple cameras for multi-coach view
  const { screenShareTrack, cameraTracks, primaryTrack, remoteAudioTracks } = useMemo(() => {
    const screenShare = tracks.find(
      (t) => t.source === Track.Source.ScreenShare && !t.participant.isLocal
    );
    // Get ALL remote camera tracks (not just the first one)
    const cameras = tracks.filter(
      (t) => t.source === Track.Source.Camera && !t.participant.isLocal
    );
    const remoteAudio = audioTracks.filter((t) => !t.participant.isLocal);

    return {
      screenShareTrack: screenShare,
      cameraTracks: cameras,
      // Primary is screen share if available, otherwise first camera
      primaryTrack: screenShare || cameras[0],
      remoteAudioTracks: remoteAudio,
    };
  }, [tracks, audioTracks]);

  // Picture-in-Picture support - pass primary track for direct access
  const { isPiPActive, isPiPSupported, togglePiP } = usePictureInPicture(primaryTrack);

  // Handle incoming reactions (from other users via WebSocket)
  useEffect(() => {
    if (onReactionReceived) {
      // The onReactionReceived will be called by the parent when a reaction is received
      // We expose addReaction via window for now (will be improved with forwardRef)
      const originalAddReaction = (window as any).__webinarReactionOverlay?.addReaction;
      if (originalAddReaction) {
        reactionOverlayRef.current = { addReaction: originalAddReaction };
      }
    }
  }, [onReactionReceived]);

  // Function to add a reaction to the overlay
  const addReactionToOverlay = useCallback((type: ReactionType) => {
    const overlay = (window as any).__webinarReactionOverlay;
    if (overlay?.addReaction) {
      overlay.addReaction(type);
    }
  }, []);

  // Handle sending a reaction
  const handleSendReaction = useCallback((type: ReactionType) => {
    // Add to local overlay immediately for feedback
    addReactionToOverlay(type);
    // Send to other users via callback
    onSendReaction?.(type);
  }, [addReactionToOverlay, onSendReaction]);

  // Check if any overlay content is provided
  const hasOverlayContent = !!(chatComponent || pollComponent || qaComponent);

  // Calculate grid layout for multiple cameras
  const cameraGridClass = useMemo(() => {
    const count = cameraTracks.length;
    if (count <= 1) return '';
    if (count === 2) return 'grid grid-cols-2 gap-1';
    if (count <= 4) return 'grid grid-cols-2 gap-1';
    if (count <= 6) return 'grid grid-cols-3 gap-1';
    return 'grid grid-cols-3 gap-1'; // Max 3 columns for more cameras
  }, [cameraTracks.length]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      setVolume(0);
    } else {
      setVolume(100);
    }
  }, [isMuted]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    // On iOS, use pseudo-fullscreen (CSS-based) since requestFullscreen() doesn't work on divs
    if (isIOS()) {
      if (!isFullscreen) {
        // Enter pseudo-fullscreen
        setIsFullscreen(true);
        onFullscreenChange?.(true);
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
      } else {
        // Exit pseudo-fullscreen
        setIsFullscreen(false);
        setIsPanelOpen(false);
        onFullscreenChange?.(false);
        // Restore body scrolling
        document.body.style.overflow = '';
      }
      return;
    }

    // Standard fullscreen API for other browsers
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        onFullscreenChange?.(true);

        // Lock to landscape on smartphones (Android only - iOS doesn't support it)
        if (isSmartphone && supportsOrientationLock) {
          await lockLandscape();
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        setIsPanelOpen(false);
        onFullscreenChange?.(false);

        // Unlock orientation when exiting fullscreen
        if (isOrientationLocked) {
          unlockOrientation();
        }
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  }, [isFullscreen, onFullscreenChange, isSmartphone, supportsOrientationLock, lockLandscape, isOrientationLocked, unlockOrientation]);

  // Toggle the side panel in fullscreen mode
  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => {
      const newState = !prev;
      onPanelOpenChange?.(newState);
      return newState;
    });
  }, [onPanelOpenChange]);

  // Listen for fullscreen changes (e.g., when user presses ESC)
  useEffect(() => {
    // Skip for iOS (we use pseudo-fullscreen there)
    if (isIOS()) return;

    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs) {
        setIsPanelOpen(false);
        // Unlock orientation when exiting fullscreen via ESC key
        if (isOrientationLocked) {
          unlockOrientation();
        }
      }
      onFullscreenChange?.(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onFullscreenChange, isOrientationLocked, unlockOrientation]);

  // Cleanup pseudo-fullscreen on unmount (iOS)
  useEffect(() => {
    return () => {
      if (isIOS()) {
        document.body.style.overflow = '';
      }
    };
  }, []);

  // Loading state
  if (connectionState === ConnectionState.Connecting) {
    return (
      <div className={cn('flex items-center justify-center bg-black rounded-lg aspect-video', className)}>
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="w-10 h-10 animate-spin" />
          <span>{t('common.connecting', 'Connecting...')}</span>
        </div>
      </div>
    );
  }

  // Disconnected state
  if (connectionState === ConnectionState.Disconnected) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-900 rounded-lg aspect-video', className)}>
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <VideoOff className="w-16 h-16" />
          <span>{t('common.disconnected', 'Disconnected')}</span>
        </div>
      </div>
    );
  }

  // No video available (no camera tracks and no screen share)
  // BUT if we have a scene template, still render it (shows background, overlays, banners, etc.)
  if (cameraTracks.length === 0 && !screenShareTrack && !sceneTemplate) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-900 rounded-lg aspect-video', className)}>
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <VideoOff className="w-16 h-16" />
          <span>{t('webinars.waitingForHost', 'Waiting for host to start streaming...')}</span>
        </div>
      </div>
    );
  }

  // Pseudo-fullscreen styles for iOS (fixed positioning since requestFullscreen doesn't work)
  const isIOSDevice = isIOS();
  const iosPseudoFullscreenStyles = isIOSDevice && isFullscreen
    ? 'fixed inset-0 z-[9999] w-screen h-screen bg-black flex items-center justify-center'
    : '';

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black rounded-lg overflow-hidden',
        className,
        isFullscreen && !isIOSDevice && 'rounded-none flex h-screen',
        iosPseudoFullscreenStyles
      )}
    >
      {/* Main Video Area */}
      <div className={cn(
        // Base state - normal aspect ratio
        !isFullscreen && 'aspect-video',
        // Standard fullscreen (non-iOS)
        isFullscreen && !isIOSDevice && 'flex-1 h-screen aspect-auto flex items-center justify-center transition-all duration-300',
        // iOS pseudo-fullscreen - fill the container completely
        isFullscreen && isIOSDevice && 'w-full h-full',
        // Panel margin only for non-iOS (iOS doesn't support the side panel in pseudo-fullscreen)
        isFullscreen && isPanelOpen && !isIOSDevice && 'mr-80'
      )}>
        {/* Use SceneCompositor when a template is provided for StreamYard-like layouts */}
        {sceneTemplate ? (
          <SceneCompositor
            template={sceneTemplate}
            overlayVisibility={overlayVisibility}
            showPlaceholders={false}
            className="w-full h-full"
            isFullscreen={isFullscreen}
            cameraScale={cameraScale}
            cameraSlotStyles={cameraSlotStyles}
            cornerImages={cornerImages}
            activeTextBanner={activeTextBanner}
            speakerDisplayNames={speakerDisplayNames}
            speakerNameStyle={speakerNameStyle}
            onSceneIds={onSceneIds}
          />
        ) : screenShareTrack ? (
          /* Screen share takes priority when no template */
          <VideoTrack
            trackRef={screenShareTrack}
            className="w-full h-full object-contain"
          />
        ) : cameraTracks.length === 1 ? (
          /* Single camera - full view */
          <VideoTrack
            trackRef={cameraTracks[0]}
            className="w-full h-full object-contain"
          />
        ) : cameraTracks.length > 0 ? (
          /* Multiple cameras - grid layout */
          <div className={cn('w-full h-full', cameraGridClass)}>
            {cameraTracks.map((trackRef, index) => (
              <div key={trackRef.publication?.trackSid || index} className={cn('relative', isDark ? 'bg-[#0d1f1c]' : 'bg-slate-100')}>
                <VideoTrack
                  trackRef={trackRef}
                  className="w-full h-full object-cover"
                />
                {/* Participant name overlay */}
                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-xs">
                  {trackRef.participant.name || trackRef.participant.identity}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* No video available */
          <div className={cn('w-full h-full flex items-center justify-center', isDark ? 'bg-gray-900' : 'bg-slate-50')}>
            <div className="text-center text-gray-400">
              <VideoOff className="w-16 h-16 mx-auto mb-2" />
              <span>{t('webinars.waitingForHost', 'Waiting for host to start streaming...')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Reaction Overlay - floating emojis */}
      {/* Adjust right position when panel is open in fullscreen */}
      <div className={cn(
        'absolute inset-0 pointer-events-none transition-all duration-300',
        isFullscreen && isPanelOpen && 'right-80'
      )}>
        <ReactionOverlay enabled={reactionsEnabled} />
      </div>

      {/* Rotate device overlay - for iOS smartphones in portrait mode (orientation lock not supported) */}
      {isFullscreen && isSmartphone && isPortrait && !isOrientationLocked && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-[60] text-white">
          <RotateCcw className={cn('w-16 h-16 mb-4 animate-pulse', isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]')} />
          <p className="text-xl font-medium mb-2">
            {t('webinars.rotateDevice', 'Rotate your device')}
          </p>
          <p className={cn('text-sm text-center px-8', isDark ? 'text-gray-400' : 'text-slate-500')}>
            {t('webinars.rotateForBetterExperience', 'For a better viewing experience')}
          </p>
        </div>
      )}

      {/* Audio tracks (hidden) */}
      {remoteAudioTracks.map((trackRef) => (
        <AudioTrack
          key={trackRef.publication.trackSid}
          trackRef={trackRef}
          volume={isMuted ? 0 : volume / 100}
        />
      ))}

      {/* Screen share indicator - only show when no scene template (SceneCompositor handles its own UI) */}
      {screenShareTrack && !sceneTemplate && (
        <div className="absolute top-3 left-3 bg-black/60 px-3 py-1 rounded-full flex items-center gap-2 text-white text-sm">
          <Monitor className="w-4 h-4" />
          <span>{t('webinars.screenSharing', 'Screen sharing')}</span>
        </div>
      )}

      {/* Picture-in-picture for cameras when screen sharing - only when no scene template */}
      {/* When sceneTemplate is active, SceneCompositor handles the complete layout including cameras */}
      {screenShareTrack && cameraTracks.length > 0 && !sceneTemplate && (
        <div className={cn(
          'absolute bottom-20 flex gap-2',
          isPanelOpen ? 'right-[340px]' : 'right-3'
        )}>
          {cameraTracks.slice(0, 4).map((trackRef, index) => (
            <div
              key={trackRef.publication?.trackSid || index}
              className="w-32 rounded-lg overflow-hidden shadow-lg relative"
            >
              <VideoTrack
                trackRef={trackRef}
                className="w-full h-full object-cover"
              />
              {/* Participant name */}
              <div className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.5 rounded text-white text-[10px]">
                {trackRef.participant.name || trackRef.participant.identity}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Poll overlay in fullscreen - shows above video so users can vote */}
      {isFullscreen && pollComponent && (
        <div className={cn(
          'absolute top-4 z-50 transition-all duration-300',
          isPanelOpen ? 'right-[340px]' : 'right-4',
          'w-80 max-w-[calc(100vw-2rem)]'
        )}>
          <div className={cn('rounded-lg shadow-2xl overflow-hidden', isDark ? 'bg-[#0d1f1c]/95 border border-[#5eb8a8]/50' : 'bg-white/95 border border-slate-200')}>
            <div className={cn('px-3 py-2 flex items-center gap-2', isDark ? 'bg-gradient-to-r from-[#5eb8a8]/20 to-purple-600/20 border-b border-[#285f59]/30' : 'bg-slate-50 border-b border-slate-200')}>
              <BarChart3 className={cn('w-4 h-4', isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]')} />
              <span className={cn('text-sm font-medium', isDark ? 'text-[#e8f5f0]' : 'text-slate-900')}>{t('webinars.poll', 'Poll')}</span>
            </div>
            <div className="p-3 max-h-80 overflow-y-auto">
              {pollComponent}
            </div>
          </div>
        </div>
      )}

      {/* Floating Winner Banner in fullscreen */}
      {isFullscreen && winnerBannerComponent && (
        <div className={cn(
          'absolute top-4 z-50 transition-all duration-300',
          // Position below poll if poll is visible, otherwise at top-left
          pollComponent ? 'left-4' : 'left-1/2 -translate-x-1/2',
        )}>
          {winnerBannerComponent}
        </div>
      )}

      {/* Toggle bar - only in fullscreen */}
      {isFullscreen && hasOverlayContent && (
        <WebinarToggleBar
          isPanelOpen={isPanelOpen}
          onTogglePanel={togglePanel}
        />
      )}

      {/* Chat Panel - only in fullscreen */}
      {isFullscreen && hasOverlayContent && (
        <WebinarChatPanel
          isPanelOpen={isPanelOpen}
          onTogglePanel={togglePanel}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          chatComponent={chatComponent}
          qaComponent={qaComponent}
          className="h-full"
          contentClassName="h-[calc(100%-44px-0.5rem)]"
        />
      )}

      {/* Controls overlay */}
      {showControls && (
        <WebinarControlBar
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={handleVolumeChange}
          onToggleMute={toggleMute}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          isPanelOpen={isPanelOpen}
          onTogglePanel={togglePanel}
          hasOverlayContent={hasOverlayContent}
          unreadChatCount={unreadChatCount}
          isHost={isHost}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isScreenShareEnabled={isScreenShareEnabled}
          onToggleAudio={onToggleAudio}
          onToggleVideo={onToggleVideo}
          onToggleScreenShare={onToggleScreenShare}
          reactionsEnabled={reactionsEnabled}
          onSendReaction={handleSendReaction}
          attendeeCount={attendeeCount}
          participantCount={participants.length}
          isPiPSupported={isPiPSupported}
          isPiPActive={isPiPActive}
          onTogglePiP={togglePiP}
          className={cn(
            'absolute bottom-0 left-0 transition-all duration-300',
            isFullscreen && isPanelOpen ? 'right-80' : 'right-0'
          )}
        />
      )}

      {/* Giveaway Winner Overlay - rendered inside player container for fullscreen support */}
      {winnerOverlayComponent}
    </div>
  );
}

export default WebinarPlayerStandard;
