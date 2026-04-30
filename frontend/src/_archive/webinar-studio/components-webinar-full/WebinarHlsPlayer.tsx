/**
 * WebinarHlsPlayer Component
 *
 * Full-featured HLS video player for webinar viewers. Replaces the WebRTC-based
 * WebinarPlayerStandard when the HLS pipeline is active.
 *
 * The HLS stream is a pre-composed scene rendered by LiveKit egress
 * (same visual output as the recording template — overlays, backgrounds,
 * speaker names, etc.). No LiveKit dependency needed.
 *
 * Features:
 * - hls.js powered playback (with Safari native fallback)
 * - Volume controls (synced to <video> element)
 * - Fullscreen with iOS pseudo-fullscreen (CSS-based)
 * - Picture-in-Picture (direct via videoRef)
 * - Smartphone orientation lock (Android) / rotate prompt (iOS)
 * - Reaction overlay (floating emojis)
 * - Chat/Q&A side panel in fullscreen
 * - Floating poll overlay in fullscreen
 * - Winner banner/overlay in fullscreen
 * - Loading spinner / error state / retry
 */

import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, RefreshCw, BarChart3, RotateCcw, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { useHlsStream } from '@/hooks/webinar/useHlsStream';
import { ReactionOverlay, type ReactionType } from './ReactionOverlay';
import { WebinarControlBar } from './WebinarControlBar';
import { WebinarChatPanel } from './WebinarChatPanel';
import { WebinarToggleBar } from './WebinarToggleBar';
import { useSmartphoneOrientation } from '@/hooks/useSmartphoneOrientation';

// Detect iOS devices (Safari, Chrome, any browser on iOS uses WebKit)
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export interface WebinarHlsPlayerProps {
  /** HLS playlist URL (.m3u8) */
  hlsUrl: string | null;
  /** Additional CSS classes */
  className?: string;
  /** Fullscreen overlay content (chat, poll, Q&A) */
  chatComponent?: ReactNode;
  pollComponent?: ReactNode;
  qaComponent?: ReactNode;
  /** Giveaway winner banner (shown in fullscreen when user won) */
  winnerBannerComponent?: ReactNode;
  /** Giveaway winner overlay (full celebration, rendered inside player for fullscreen support) */
  winnerOverlayComponent?: ReactNode;
  /** Callback when fullscreen changes */
  onFullscreenChange?: (isFullscreen: boolean) => void;
  /** Reactions */
  reactionsEnabled?: boolean;
  onSendReaction?: (type: ReactionType) => void;
  /** Attendee count from WebSocket */
  attendeeCount?: number;
  /** Unread chat messages count (for badge) */
  unreadChatCount?: number;
  /** Callback when panel open state changes */
  onPanelOpenChange?: (isOpen: boolean) => void;
  /** Whether the stream is paused by host */
  isPaused?: boolean;
}

export function WebinarHlsPlayer({
  hlsUrl,
  className = '',
  chatComponent,
  pollComponent,
  qaComponent,
  winnerBannerComponent,
  winnerOverlayComponent,
  onFullscreenChange,
  reactionsEnabled = true,
  onSendReaction,
  attendeeCount,
  unreadChatCount,
  onPanelOpenChange,
  isPaused,
}: WebinarHlsPlayerProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Player state
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'qa' | 'poll'>('chat');

  // PiP state
  const [isPiPActive, setIsPiPActive] = useState(false);
  const isPiPSupported = typeof document !== 'undefined' && 'pictureInPictureEnabled' in document;

  // HLS stream hook
  const { isLoading, error, isSupported, startedMuted, retry } = useHlsStream({
    hlsUrl,
    videoRef,
    autoPlay: true,
  });

  // Sync muted state when browser forces muted playback (mobile autoplay policy)
  useEffect(() => {
    if (startedMuted && !isMuted) {
      setIsMuted(true);
      setVolume(0);
    }
  }, [startedMuted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle tap-to-unmute: user taps overlay to enable audio
  const handleTapToUnmute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
    }
    setIsMuted(false);
    setVolume(100);
  }, []);

  // Smartphone orientation handling for fullscreen
  const {
    isSmartphone,
    isPortrait,
    isOrientationLocked,
    lockLandscape,
    unlockOrientation,
    supportsOrientationLock,
  } = useSmartphoneOrientation();

  // Sync volume to <video> element
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  // Reaction overlay helpers
  const addReactionToOverlay = useCallback((type: ReactionType) => {
    const overlay = (window as any).__webinarReactionOverlay;
    if (overlay?.addReaction) {
      overlay.addReaction(type);
    }
  }, []);

  const handleSendReaction = useCallback((type: ReactionType) => {
    addReactionToOverlay(type);
    onSendReaction?.(type);
  }, [addReactionToOverlay, onSendReaction]);

  // Check if any overlay content is provided
  const hasOverlayContent = !!(chatComponent || pollComponent || qaComponent);

  // Volume handlers
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

  // Fullscreen toggle with iOS pseudo-fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (isIOS()) {
      if (!isFullscreen) {
        setIsFullscreen(true);
        onFullscreenChange?.(true);
        document.body.style.overflow = 'hidden';
      } else {
        setIsFullscreen(false);
        setIsPanelOpen(false);
        onFullscreenChange?.(false);
        document.body.style.overflow = '';
      }
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        onFullscreenChange?.(true);

        if (isSmartphone && supportsOrientationLock) {
          await lockLandscape();
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        setIsPanelOpen(false);
        onFullscreenChange?.(false);

        if (isOrientationLocked) {
          unlockOrientation();
        }
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  }, [isFullscreen, onFullscreenChange, isSmartphone, supportsOrientationLock, lockLandscape, isOrientationLocked, unlockOrientation]);

  // Toggle side panel in fullscreen
  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => {
      const newState = !prev;
      onPanelOpenChange?.(newState);
      return newState;
    });
  }, [onPanelOpenChange]);

  // Listen for fullscreen changes (e.g., when user presses ESC)
  useEffect(() => {
    if (isIOS()) return;

    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs) {
        setIsPanelOpen(false);
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

  // PiP toggle — direct via videoRef (no LiveKit track lookup needed)
  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (isPiPActive) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('Error toggling PiP:', err);
    }
  }, [isPiPActive]);

  // Track PiP state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnterPiP = () => setIsPiPActive(true);
    const handleLeavePiP = () => setIsPiPActive(false);

    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);
    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, []);

  // Not supported state
  if (!isSupported) {
    return (
      <div className={cn('relative bg-black flex items-center justify-center', className)}>
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white font-medium">
            {t('webinars.hls.notSupported', 'Your browser does not support HLS playback')}
          </p>
        </div>
      </div>
    );
  }

  // No URL yet — waiting for stream
  if (!hlsUrl) {
    return (
      <div className={cn('relative bg-black flex items-center justify-center', className)}>
        <div className="text-center">
          <Loader2 className={cn('w-10 h-10 animate-spin mx-auto mb-3', isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]')} />
          <p className={cn('text-sm', isDark ? 'text-[#e8f5f0]/70' : 'text-slate-500')}>
            {t('webinars.hls.waiting', 'Waiting for stream...')}
          </p>
        </div>
      </div>
    );
  }

  // Pseudo-fullscreen styles for iOS
  const isIOSDevice = isIOS();
  const iosPseudoFullscreenStyles = isIOSDevice && isFullscreen
    ? 'fixed inset-0 z-[9999] w-screen h-screen bg-black flex items-center justify-center'
    : '';

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black group overflow-hidden',
        className,
        isFullscreen && !isIOSDevice && 'rounded-none flex h-screen',
        iosPseudoFullscreenStyles
      )}
    >
      {/* Main Video Area */}
      <div className={cn(
        !isFullscreen && 'w-full h-full',
        isFullscreen && !isIOSDevice && 'flex-1 h-screen aspect-auto flex items-center justify-center transition-all duration-300',
        isFullscreen && isIOSDevice && 'w-full h-full',
        isFullscreen && isPanelOpen && !isIOSDevice && 'mr-80'
      )}>
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
        />
      </div>

      {/* Loading overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="text-center">
            <Loader2 className={cn('w-10 h-10 animate-spin mx-auto mb-3', isDark ? 'text-[#5eb8a8]' : 'text-[#285f59]')} />
            <p className={cn('text-sm', isDark ? 'text-[#e8f5f0]/70' : 'text-slate-500')}>
              {t('webinars.hls.buffering', 'Buffering...')}
            </p>
          </div>
        </div>
      )}

      {/* Tap to unmute overlay — shown when browser forced muted playback (mobile) */}
      {startedMuted && isMuted && !isLoading && !error && (
        <button
          onClick={handleTapToUnmute}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-all animate-pulse"
        >
          <Volume2 className="w-5 h-5" />
          <span className="text-sm font-medium">
            {t('webinars.hls.tapToUnmute', 'Tap to unmute')}
          </span>
        </button>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center p-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-4">{error}</p>
            <Button
              onClick={retry}
              variant="outline"
              className={cn(isDark ? 'bg-[#1a352f]/50 border-[#5eb8a8]/50 text-[#e8f5f0] hover:bg-[#5eb8a8]/20' : 'bg-white/50 border-slate-300 text-slate-900 hover:bg-slate-100')}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('webinars.hls.retry', 'Retry')}
            </Button>
          </div>
        </div>
      )}

      {/* Pause overlay — when host pauses the stream */}
      {isPaused && (
        <div className={cn('absolute inset-0 flex flex-col items-center justify-center z-20', isDark ? 'bg-[#0d1f1c]/90' : 'bg-white/90')}>
          <Pause className="w-16 h-16 text-yellow-400 mb-4" />
          <p className="text-yellow-400 font-medium text-xl">
            {t('webinars.streamPaused', 'Stream Paused')}
          </p>
          <p className={cn('text-sm mt-2', isDark ? 'text-[#e8f5f0]/70' : 'text-slate-500')}>
            {t('webinars.streamPausedDescription', 'The host has temporarily paused the stream. Please wait...')}
          </p>
        </div>
      )}

      {/* Reaction Overlay — floating emojis */}
      <div className={cn(
        'absolute inset-0 pointer-events-none transition-all duration-300',
        isFullscreen && isPanelOpen && 'right-80'
      )}>
        <ReactionOverlay enabled={reactionsEnabled} />
      </div>

      {/* Rotate device overlay — for smartphones in portrait fullscreen (orientation lock not supported) */}
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

      {/* Floating Poll overlay in fullscreen */}
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

      {/* Toggle bar — only in fullscreen */}
      {isFullscreen && hasOverlayContent && (
        <WebinarToggleBar
          isPanelOpen={isPanelOpen}
          onTogglePanel={togglePanel}
        />
      )}

      {/* Chat Panel — only in fullscreen */}
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
        isHost={false}
        reactionsEnabled={reactionsEnabled}
        onSendReaction={handleSendReaction}
        attendeeCount={attendeeCount}
        participantCount={attendeeCount || 0}
        isPiPSupported={isPiPSupported}
        isPiPActive={isPiPActive}
        onTogglePiP={togglePiP}
        className={cn(
          'absolute bottom-0 left-0 transition-all duration-300',
          isFullscreen && isPanelOpen ? 'right-80' : 'right-0'
        )}
      />

      {/* Giveaway Winner Overlay — rendered inside player container for fullscreen support */}
      {winnerOverlayComponent}
    </div>
  );
}
