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
import { Loader2, VideoOff, RotateCcw, Monitor, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { SceneCompositor } from './SceneCompositor';
import { ReactionOverlay, type ReactionType } from './ReactionOverlay';
import type { SceneTemplate } from '@/domain/products/models/scene-template.model';
import { useSmartphoneOrientation } from '@/hooks/useSmartphoneOrientation';
import { usePictureInPicture } from '@/hooks/usePictureInPicture';
import { WebinarControlBar } from './WebinarControlBar';
import { WebinarChatPanel } from './WebinarChatPanel';
import { WebinarToggleBar } from './WebinarToggleBar';

// Detect iOS devices (Safari, Chrome, any browser on iOS uses WebKit)
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Detect Safari specifically (vs Chrome on iOS)
const isSafari = () => {
  const ua = navigator.userAgent;
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
  const isSafariUA = /Safari/.test(ua) && !/CriOS|Chrome/.test(ua);
  return isIOSDevice && isSafariUA;
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
 * WebinarPlayerSafariIOS - Optimized version for Safari on iPhone
 * 
 * This component is specifically optimized for Safari iOS fullscreen behavior,
 * including:
 * - 100svh viewport height handling
 * - Responsive panel that makes space for chat/Q&A
 * - Proper z-index layering for fixed elements
 * - Overflow and scroll handling for iOS
 * 
 * Used automatically when Safari iOS is detected.
 */
export function WebinarPlayerSafariIOS({
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
  unreadChatCount = 0,
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
  const [showIOSHint, setShowIOSHint] = useState(true); // Show hint for iOS users
  const containerRef = useRef<HTMLDivElement>(null);
  const reactionOverlayRef = useRef<{ addReaction: (type: ReactionType) => void } | null>(null);
  const touchStartYRef = useRef<number>(0);

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

  // Auto-hide iOS hint after 5 seconds
  useEffect(() => {
    if (isFullscreen && isIOS() && showIOSHint) {
      const timer = setTimeout(() => {
        setShowIOSHint(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, showIOSHint]);

  // iOS-specific: Prevent rubber-band bounce effect while allowing scrolling in designated areas
  useEffect(() => {
    if (!isIOS() || !isFullscreen) return;

    const preventBounce = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // Find the closest scrollable element (has overflow-y-auto or overflow-y-scroll)
      let scrollableElement: HTMLElement | null = target;
      while (scrollableElement && scrollableElement !== document.body) {
        const overflowY = window.getComputedStyle(scrollableElement).overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && 
            scrollableElement.scrollHeight > scrollableElement.clientHeight) {
          // Found a scrollable element, allow scrolling within it
          const atTop = scrollableElement.scrollTop <= 0;
          const atBottom = scrollableElement.scrollTop + scrollableElement.clientHeight >= scrollableElement.scrollHeight - 1;
          
          // Only prevent if trying to scroll beyond boundaries
          if ((atTop && e.touches[0].clientY > touchStartYRef.current) ||
              (atBottom && e.touches[0].clientY < touchStartYRef.current)) {
            e.preventDefault();
          }
          return; // Allow scroll within this element
        }
        scrollableElement = scrollableElement.parentElement;
      }
      
      // No scrollable parent found, prevent bounce
      e.preventDefault();
    };

    const saveTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    document.body.addEventListener('touchstart', saveTouchStart, { passive: false });
    document.body.addEventListener('touchmove', preventBounce, { passive: false });

    return () => {
      document.body.removeEventListener('touchstart', saveTouchStart);
      document.body.removeEventListener('touchmove', preventBounce);
    };
  }, [isFullscreen]);

  // iOS-specific: Swipe down gesture to exit fullscreen (native iOS pattern)
  // Disabled when panel is open to avoid conflicts with chat/Q&A scrolling
  useEffect(() => {
    if (!isIOS() || !isFullscreen || !containerRef.current) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Don't trigger swipe-down if panel is open (user is interacting with chat/Q&A)
      if (isPanelOpen) return;
      
      // Don't trigger if touch starts inside the side panel area (right 320px)
      const touchX = e.touches[0].clientX;
      if (touchX > window.innerWidth - 320) return;
      
      // Only trigger from top 100px of screen (video area)
      if (e.touches[0].clientY < 100) {
        startY = e.touches[0].clientY;
        isDragging = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      currentY = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      const deltaY = currentY - startY;
      // If swiped down more than 80px, exit fullscreen
      if (deltaY > 80) {
        toggleFullscreen();
      }
      isDragging = false;
    };

    const container = containerRef.current;
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen, isPanelOpen]);

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
        setShowIOSHint(true); // Show hint when entering fullscreen
        onFullscreenChange?.(true);
        
        // Lock body to prevent scrolling and add iOS-specific styles
        const body = document.body;
        body.style.position = 'fixed';
        body.style.width = '100%';
        body.style.height = '100%';
        body.style.overflow = 'hidden';
        body.style.top = '0';
        body.style.left = '0';
      } else {
        // Exit pseudo-fullscreen
        setIsFullscreen(false);
        setIsPanelOpen(false);
        setShowIOSHint(false);
        onFullscreenChange?.(false);
        
        // Restore body styles
        const body = document.body;
        body.style.position = '';
        body.style.width = '';
        body.style.height = '';
        body.style.overflow = '';
        body.style.top = '';
        body.style.left = '';
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
      const newValue = !prev;
      onPanelOpenChange?.(newValue);
      return newValue;
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
        const body = document.body;
        body.style.position = '';
        body.style.width = '';
        body.style.height = '';
        body.style.overflow = '';
        body.style.top = '';
        body.style.left = '';
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
  const isSafariDevice = isSafari();
  const iosPseudoFullscreenStyles = isIOSDevice && isFullscreen
    ? 'fixed inset-0 z-[9999] w-screen bg-black'
    : '';
  
  // Debug state for Safari iOS (triple tap top-left corner to toggle)
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);
  const debugTapCountRef = useRef(0);
  const debugTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black rounded-lg overflow-hidden',
        className,
        // Fullscreen: use flex layout for proper panel spacing
        isFullscreen && 'rounded-none flex',
        isFullscreen && !isIOSDevice && 'h-screen',
        iosPseudoFullscreenStyles
      )}
      style={
        isIOSDevice && isFullscreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              // Safari: Use 100svh (small viewport) which accounts for Safari's UI bars
              // This gives us the actual visible area without the URL bar space
              height: isSafariDevice ? '100svh' : '100vh',
              minHeight: isSafariDevice ? '100svh' : '100vh',
              maxHeight: isSafariDevice ? '100svh' : '100vh',
              zIndex: 9999,
              // NO padding - we want to use all available space, controls will overlap
              padding: 0,
            }
          : undefined
      }
      onClick={(e) => {
        // Debug toggle: triple-tap top-left corner to show viewport measurements
        if (isFullscreen && isIOSDevice && isSafariDevice) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect && e.clientX < 100 && e.clientY < 100) {
            debugTapCountRef.current += 1;
            if (debugTapTimeoutRef.current) clearTimeout(debugTapTimeoutRef.current);
            
            if (debugTapCountRef.current === 3) {
              setShowDebugOverlay(!showDebugOverlay);
              debugTapCountRef.current = 0;
            } else {
              debugTapTimeoutRef.current = setTimeout(() => {
                debugTapCountRef.current = 0;
              }, 500);
            }
          }
        }
      }}
    >
      {/* Main Video Area */}
      <div className={cn(
        // Base state - normal aspect ratio
        !isFullscreen && 'aspect-video',
        // Fullscreen: flex-1 to fill available space and shrink when panel opens
        isFullscreen && 'flex-1 aspect-auto flex items-center justify-center transition-all duration-300',
        // iOS specific height
        isFullscreen && isIOSDevice && (isSafariDevice ? 'h-[100svh]' : 'h-screen'),
        isFullscreen && !isIOSDevice && 'h-screen',
        // Responsive: make space for chat panel when open (320px = w-80)
        isFullscreen && isPanelOpen && 'mr-80'
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

      {/* iOS Fullscreen Hint - shows how to exit (swipe down or tap button) */}
      {isFullscreen && isIOSDevice && showIOSHint && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm z-[60] animate-pulse">
          Swipe down or tap ⊡ to exit
        </div>
      )}

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
          pollComponent ? 'left-4' : 'left-1/2 -translate-x-1/2',
        )}>
          {winnerBannerComponent}
        </div>
      )}

      {/* Toggle bar - Always visible on right edge */}
      {isFullscreen && hasOverlayContent && (
        <WebinarToggleBar
          isPanelOpen={isPanelOpen}
          onTogglePanel={togglePanel}
          className={cn(
            isIOSDevice && isSafariDevice && '!absolute h-[100svh]',
            !isIOSDevice && 'h-full'
          )}
        />
      )}

      {/* Fullscreen side panel (Chat, Q&A, Poll) */}
      {isFullscreen && hasOverlayContent && (
        <WebinarChatPanel
          isPanelOpen={isPanelOpen}
          onTogglePanel={togglePanel}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          chatComponent={chatComponent}
          qaComponent={qaComponent}
          className={cn(
            isIOSDevice && isSafariDevice && '!absolute h-[100svh]',
            isIOSDevice && !isSafariDevice && 'h-full',
            !isIOSDevice && 'h-full'
          )}
          contentClassName={
            isIOSDevice && isSafariDevice
              ? 'h-[calc(100svh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-44px-0.5rem)]'
              : isIOSDevice
              ? 'h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-44px-0.5rem)]'
              : 'h-[calc(100%-44px-0.5rem)]'
          }
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
          style={
            isFullscreen && isIOSDevice
              ? {
                  paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
                }
              : undefined
          }
        />
      )}

      {/* Debug Overlay for Safari iOS - Triple tap top-left corner to toggle */}
      {showDebugOverlay && isFullscreen && isIOSDevice && isSafariDevice && (
        <div className="fixed top-0 left-0 bg-red-600/90 text-white p-3 z-[10000] text-xs font-mono space-y-1 max-w-[300px]">
          <div className="font-bold text-sm mb-2">Safari iOS Debug (100svh)</div>
          <div>Window: {window.innerWidth}x{window.innerHeight}px</div>
          <div>Visual VP: {window.visualViewport?.width}x{window.visualViewport?.height}px</div>
          <div>Container: {containerRef.current?.clientWidth}x{containerRef.current?.clientHeight}px</div>
          <div className="mt-1 pt-1 border-t border-white/30">
            <div>Safe Top: {getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0'}</div>
            <div>Safe Bottom: {getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0'}</div>
          </div>
          <div className="mt-1 pt-1 border-t border-white/30">
            <div>Using: 100svh (small viewport)</div>
            <div>Panel: {isPanelOpen ? 'Open' : 'Closed'}</div>
          </div>
          <div className="mt-2 text-[10px] opacity-75">Triple tap top-left to hide</div>
        </div>
      )}

      {/* Giveaway Winner Overlay - rendered inside player container for fullscreen support */}
      {winnerOverlayComponent}
    </div>
  );
}

export default WebinarPlayerSafariIOS;
