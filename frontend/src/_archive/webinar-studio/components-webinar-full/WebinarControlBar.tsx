/**
 * WebinarControlBar - Reusable control bar component
 * 
 * Contains all player controls (volume, reactions, host controls, fullscreen, attendee count)
 * Design and functionality is shared across all platforms.
 */

import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX, Maximize, Minimize, MessageSquare, Mic, MicOff, Monitor, Users, VideoOff as VideoOffIcon, PictureInPicture2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { ReactionButtons } from './ReactionButtons';
import type { ReactionType } from './ReactionOverlay';

export interface WebinarControlBarProps {
  // Volume controls
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number[]) => void;
  onToggleMute: () => void;
  
  // Fullscreen
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  
  // Panel
  isPanelOpen: boolean;
  onTogglePanel: () => void;
  hasOverlayContent: boolean;
  unreadChatCount?: number;
  
  // Host controls (optional)
  isHost?: boolean;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  isScreenShareEnabled?: boolean;
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare?: () => void;
  
  // Reactions
  reactionsEnabled?: boolean;
  onSendReaction?: (type: ReactionType) => void;
  
  // Attendee count
  attendeeCount?: number;
  participantCount: number;

  // Picture-in-Picture
  isPiPSupported?: boolean;
  isPiPActive?: boolean;
  onTogglePiP?: () => void;

  // Styling
  className?: string;
  style?: React.CSSProperties;
}

export function WebinarControlBar({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  isPanelOpen,
  onTogglePanel,
  hasOverlayContent,
  unreadChatCount,
  isHost = false,
  isAudioEnabled,
  isVideoEnabled,
  isScreenShareEnabled,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  reactionsEnabled = true,
  onSendReaction,
  attendeeCount,
  participantCount,
  isPiPSupported,
  isPiPActive,
  onTogglePiP,
  className,
  style,
}: WebinarControlBarProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  return (
    <div className={cn(
      'p-4 z-50 transition-all duration-300',
      isDark ? 'bg-gradient-to-t from-black/80 to-transparent' : 'bg-gradient-to-t from-slate-900/60 to-transparent',
      className
    )} style={style}>
      <div className="flex items-center justify-between gap-2 min-h-[40px]">
        {/* Volume control */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMute}
            className={cn('h-8 w-8', isDark ? 'text-white hover:bg-white/20' : 'text-white hover:bg-white/30')}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Slider
            value={[volume]}
            onValueChange={onVolumeChange}
            max={100}
            step={1}
            className="w-16 sm:w-24"
          />
        </div>

        {/* Center: Reactions + Host Controls */}
        <div className="flex items-center gap-2 overflow-hidden">
          {/* Reactions (for attendees and non-fullscreen host) */}
          {reactionsEnabled && onSendReaction && (!isHost || !isFullscreen) && (
            <ReactionButtons 
              onReaction={onSendReaction}
              enabled={reactionsEnabled}
              mode="auto"
              isFullscreen={isFullscreen}
              isPanelOpen={isPanelOpen}
            />
          )}

          {/* Host controls (only in fullscreen) */}
          {isHost && isFullscreen && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleAudio}
                className={cn(
                  'h-7 px-2 text-xs',
                  isDark ? 'text-white hover:bg-white/20' : 'text-white hover:bg-white/30',
                  !isAudioEnabled && 'bg-red-500/20 hover:bg-red-500/30'
                )}
              >
                {isAudioEnabled ? <Mic className="w-3 h-3 mr-1" /> : <MicOff className="w-3 h-3 mr-1" />}
                {isAudioEnabled ? t('webinars.muteAudio', 'Mute') : t('webinars.unmuteAudio', 'Unmute')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleVideo}
                className={cn(
                  'h-7 px-2 text-xs',
                  isDark ? 'text-white hover:bg-white/20' : 'text-white hover:bg-white/30',
                  !isVideoEnabled && 'bg-red-500/20 hover:bg-red-500/30'
                )}
              >
                {isVideoEnabled ? <VideoOffIcon className="w-3 h-3 mr-1" /> : <VideoOffIcon className="w-3 h-3 mr-1" />}
                {isVideoEnabled ? t('webinars.stopVideo', 'Stop Video') : t('webinars.startVideo', 'Start Video')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleScreenShare}
                className={cn(
                  'h-7 px-2 text-xs',
                  isDark ? 'text-white hover:bg-white/20' : 'text-white hover:bg-white/30',
                  isScreenShareEnabled && (isDark ? 'bg-[#5eb8a8]/20 hover:bg-[#5eb8a8]/30' : 'bg-[#285f59]/20 hover:bg-[#285f59]/30')
                )}
              >
                <Monitor className="w-3 h-3 mr-1" />
                {isScreenShareEnabled
                  ? t('webinars.stopShare', 'Stop Share')
                  : t('webinars.shareScreen', 'Share Screen')}
              </Button>
            </div>
          )}
        </div>

        {/* Right: Fullscreen + Attendee count */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Panel toggle button (for fullscreen) */}
          {isFullscreen && hasOverlayContent && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onTogglePanel}
              className={cn('transition-all duration-200 relative h-8 w-8', isDark ? 'text-white hover:bg-white/20' : 'text-white hover:bg-white/30')}
              title={isPanelOpen ? t('webinars.hideChat', 'Hide Chat') : t('webinars.showChat', 'Show Chat')}
            >
              <MessageSquare className="w-4 h-4" />
              {!isPanelOpen && unreadChatCount && unreadChatCount > 0 && (
                <span className={cn(
                  'absolute -top-1 -right-1 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg',
                  isDark ? 'bg-gradient-to-r from-[#285f59] to-[#5eb8a8]' : 'bg-gradient-to-r from-[#285f59] to-[#3a8a7c]'
                )}>
                  {unreadChatCount > 99 ? '99+' : unreadChatCount}
                </span>
              )}
            </Button>
          )}

          {/* Picture-in-Picture button */}
          {isPiPSupported && onTogglePiP && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onTogglePiP}
              className={cn(
                'h-8 w-8',
                isDark ? 'text-white hover:bg-white/20' : 'text-white hover:bg-white/30',
                isPiPActive && (isDark ? 'bg-[#5eb8a8]/30 hover:bg-[#5eb8a8]/40' : 'bg-[#285f59]/30 hover:bg-[#285f59]/40')
              )}
              title={isPiPActive ? t('webinars.exitPiP', 'Exit Picture-in-Picture') : t('webinars.enterPiP', 'Picture-in-Picture')}
            >
              <PictureInPicture2 className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            className={cn('h-8 w-8', isDark ? 'text-white hover:bg-white/20' : 'text-white hover:bg-white/30')}
            title={isFullscreen ? t('common.exitFullscreen', 'Exit fullscreen') : t('common.fullscreen', 'Fullscreen')}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>

          {/* Viewer count hidden temporarily
          <div className="flex items-center gap-1 text-white text-xs sm:text-sm font-medium">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{attendeeCount ?? participantCount}</span>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}

export default WebinarControlBar;
