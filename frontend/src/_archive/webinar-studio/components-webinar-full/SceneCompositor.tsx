/**
 * Scene Compositor
 *
 * Renders a webinar scene with:
 * - Configurable background (color, image, video)
 * - Multiple camera slots positioned according to template
 * - Custom camera border colors
 * - Overlays (banners, logos, GIFs) with visibility toggles
 * - Corner images (4 corners)
 * - Animated text banners
 *
 * Used in WebinarStudio for hosts and WebinarPlayer for viewers
 */

import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { VideoTrack, AudioTrack, useTracks, useParticipants } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { VideoOff, Loader2, Monitor, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import type {
  SceneTemplate,
  CameraSlot,
  SceneOverlay,
} from '@/domain/products/models/scene-template.model';
import type { CameraSlotStyle, CornerImage, TextBanner, BannerAnimation, SpeakerNameStyle } from './SceneControls';
import { DEFAULT_SPEAKER_NAME_STYLE } from './SceneControls';

// Corner position CSS classes
const CORNER_POSITIONS: Record<CornerImage['corner'], { className: string }> = {
  'top-left': { className: 'top-2 left-2' },
  'top-right': { className: 'top-2 right-2' },
  'bottom-left': { className: 'bottom-2 left-2' },
  'bottom-right': { className: 'bottom-2 right-2' },
};

// Banner position CSS
const BANNER_POSITIONS: Record<TextBanner['position'], string> = {
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'center-left': 'top-1/2 left-4 -translate-y-1/2',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  'center-right': 'top-1/2 right-4 -translate-y-1/2',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
};

// Animation CSS classes
const ANIMATION_CLASSES: Record<BannerAnimation, string> = {
  'none': '',
  'fade-in': 'animate-fade-in',
  'fade-out': 'animate-fade-out',
  'slide-up': 'animate-slide-in-bottom',
  'slide-down': 'animate-slide-in-top',
  'slide-left': 'animate-slide-in-right',
  'slide-right': 'animate-slide-in-left',
  'bounce': 'animate-bounce',
  'pulse': 'animate-pulse',
};

export interface SceneCompositorProps {
  /** Scene template configuration */
  template: SceneTemplate;
  /** Custom class name */
  className?: string;
  /** Whether to show placeholder for empty slots */
  showPlaceholders?: boolean;
  /** Map of slot IDs to participant IDs (for manual assignment) */
  slotAssignments?: Record<string, string>;
  /** Whether this is for preview (no actual video) */
  isPreview?: boolean;
  /** Callback when an overlay's visibility is toggled */
  onOverlayToggle?: (overlayId: string, isVisible: boolean) => void;
  /** Override overlay visibility (for host control) */
  overlayVisibility?: Record<string, boolean>;
  /** Whether the compositor is fullscreen */
  isFullscreen?: boolean;
  /** Local participant identity (to exclude from remote tracks) */
  localParticipantIdentity?: string;
  /** Include local participant video (for host view) */
  includeLocalVideo?: boolean;
  /** Camera scale factor (0.5 to 1.5) */
  cameraScale?: number;
  /** Custom camera slot styles (border colors) */
  cameraSlotStyles?: CameraSlotStyle[];
  /** Corner images */
  cornerImages?: CornerImage[];
  /** Active text banner to display */
  activeTextBanner?: TextBanner | null;
  /** Speaker name display style */
  speakerNameStyle?: SpeakerNameStyle;
  /** Custom display names for speakers (participantId -> displayName) */
  speakerDisplayNames?: Record<string, string>;
  /** IDs of participants who should be visible on scene (undefined = show all) */
  onSceneIds?: string[];
}

export function SceneCompositor({
  template,
  className,
  showPlaceholders = true,
  slotAssignments,
  isPreview = false,
  overlayVisibility,
  isFullscreen = false,
  localParticipantIdentity,
  includeLocalVideo = false,
  cameraScale = 1,
  cameraSlotStyles = [],
  cornerImages = [],
  activeTextBanner = null,
  speakerNameStyle = DEFAULT_SPEAKER_NAME_STYLE,
  speakerDisplayNames = {},
  onSceneIds,
}: SceneCompositorProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Get all video tracks from LiveKit
  const videoTracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: true }
  );

  // Debug logging for recording diagnostics
  console.log('[SceneCompositor] videoTracks:', videoTracks.length, 'onSceneIds:', onSceneIds, 'tracks:', videoTracks.map(t => ({
    identity: t.participant?.identity,
    source: t.source,
    isLocal: t.participant?.isLocal,
  })));

  // Get all audio tracks
  const audioTracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: false }],
    { onlySubscribed: true }
  );

  // Get all participants
  const participants = useParticipants();

  // Separate camera tracks from screen share tracks
  const { cameraTracks, screenShareTracks } = useMemo(() => {
    const camera: typeof videoTracks = [];
    const screenShare: typeof videoTracks = [];

    videoTracks.forEach(track => {
      if (!track.participant) return;

      // Filter based on context
      const isLocal = track.participant.isLocal;
      const isLocalIdentity = localParticipantIdentity && track.participant.identity === localParticipantIdentity;

      // For local tracks, only include if includeLocalVideo is true
      if (isLocal || isLocalIdentity) {
        if (!includeLocalVideo) return;
      }

      // Filter by onSceneIds if provided (only show participants who are on scene)
      // If onSceneIds is undefined, show all participants (default behavior - feature not active)
      // If onSceneIds is an empty array, show NO participants (everyone removed from scene)
      if (onSceneIds !== undefined) {
        const participantId = track.participant.identity;
        if (!onSceneIds.includes(participantId)) return;
      }

      // Separate by source type
      if (track.source === Track.Source.ScreenShare) {
        screenShare.push(track);
      } else {
        camera.push(track);
      }
    });

    // Sort by onSceneIds order for consistent ordering across devices
    if (onSceneIds !== undefined && onSceneIds.length > 0) {
      camera.sort((a, b) => {
        const aIdx = onSceneIds.indexOf(a.participant?.identity ?? '');
        const bIdx = onSceneIds.indexOf(b.participant?.identity ?? '');
        return aIdx - bIdx;
      });
    }

    return { cameraTracks: camera, screenShareTracks: screenShare };
  }, [videoTracks, localParticipantIdentity, includeLocalVideo, onSceneIds]);

  const remoteAudioTracks = useMemo(() => {
    return audioTracks.filter(track => {
      if (!track.participant) return false;
      if (localParticipantIdentity && track.participant.identity === localParticipantIdentity) {
        return false;
      }
      return !track.participant.isLocal;
    });
  }, [audioTracks, localParticipantIdentity]);

  // Separate slots by type
  const { cameraSlots, screenShareSlots } = useMemo(() => {
    const camera: typeof template.cameraSlots = [];
    const screenShare: typeof template.cameraSlots = [];

    template.cameraSlots.forEach(slot => {
      if (slot.type === 'screenshare') {
        screenShare.push(slot);
      } else {
        camera.push(slot);
      }
    });

    return { cameraSlots: camera, screenShareSlots: screenShare };
  }, [template.cameraSlots]);

  // Map slots to video tracks
  const slotTrackMap = useMemo(() => {
    const map: Record<string, typeof videoTracks[0] | undefined> = {};

    if (slotAssignments) {
      // Manual assignments
      template.cameraSlots.forEach(slot => {
        const participantId = slotAssignments[slot.id];
        if (participantId) {
          const trackList = slot.type === 'screenshare' ? screenShareTracks : cameraTracks;
          const track = trackList.find(t => t.participant?.identity === participantId);
          if (track) map[slot.id] = track;
        }
      });
    } else {
      // Auto-assign screen share tracks to screenshare slots
      screenShareSlots.forEach((slot, index) => {
        if (screenShareTracks[index]) {
          map[slot.id] = screenShareTracks[index];
        }
      });

      // Auto-assign camera tracks to camera slots
      cameraSlots.forEach((slot, index) => {
        if (cameraTracks[index]) {
          map[slot.id] = cameraTracks[index];
        }
      });
    }

    return map;
  }, [template.cameraSlots, cameraSlots, screenShareSlots, cameraTracks, screenShareTracks, slotAssignments]);

  // Helper to parse participant metadata and get role
  const getParticipantRole = (metadata: string | undefined): 'host' | 'speaker' | 'viewer' | null => {
    if (!metadata) return null;
    try {
      const parsed = JSON.parse(metadata);
      return parsed.role || null;
    } catch {
      return null;
    }
  };

  // Helper to extract avatar URL from participant metadata
  const getParticipantAvatar = (metadata: string | undefined): string | null => {
    if (!metadata) return null;
    try {
      const parsed = JSON.parse(metadata);
      return parsed.avatarUrl || null;
    } catch {
      return null;
    }
  };

  // Helper to get initials from a display name
  const getInitials = (name: string | undefined): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Map slots to participants (even those without video)
  // This allows showing names and indicators for participants with camera off
  const slotParticipantMap = useMemo(() => {
    const map: Record<string, typeof participants[0] | undefined> = {};

    // Get participants that can publish (speakers/hosts, not viewers)
    // Uses metadata.role from LiveKit token as primary source (most reliable)
    // Falls back to permissions check for backwards compatibility
    let publishers = participants.filter(p => {
      // PRIMARY: Check role from LiveKit token metadata
      // This is set when the token is generated and is the most reliable
      const role = getParticipantRole(p.metadata);
      if (role === 'host' || role === 'speaker') {
        return true;
      }
      if (role === 'viewer') {
        return false;
      }

      // FALLBACK: Check for explicit publish permission from LiveKit
      // Used for backwards compatibility with tokens that don't have metadata
      const hasPublishPermission = p.permissions?.canPublish === true;
      if (hasPublishPermission) {
        return true;
      }

      // LAST RESORT: Check if they're actually publishing camera/microphone tracks
      // This handles edge cases where metadata and permissions aren't available yet
      for (const [, pub] of p.videoTrackPublications) {
        if (pub.source === Track.Source.Camera && pub.track) {
          return true;
        }
      }
      for (const [, pub] of p.audioTrackPublications) {
        if (pub.source === Track.Source.Microphone && pub.track) {
          return true;
        }
      }

      return false;
    });

    // Filter by onSceneIds if provided (only show participants who are on scene)
    // If onSceneIds is undefined, show all participants (default behavior - feature not active)
    // If onSceneIds is an empty array, show NO participants (everyone removed from scene)
    if (onSceneIds !== undefined) {
      publishers = publishers.filter(p => onSceneIds.includes(p.identity));
      // Sort by onSceneIds order for consistent ordering across devices
      publishers.sort((a, b) => {
        const aIdx = onSceneIds.indexOf(a.identity);
        const bIdx = onSceneIds.indexOf(b.identity);
        return aIdx - bIdx;
      });
    }

    if (slotAssignments) {
      // Manual assignments
      template.cameraSlots.forEach(slot => {
        const participantId = slotAssignments[slot.id];
        if (participantId) {
          const participant = publishers.find(p => p.identity === participantId);
          if (participant) map[slot.id] = participant;
        }
      });
    } else {
      // Auto-assign participants to camera slots by connection order
      cameraSlots.forEach((slot, index) => {
        if (publishers[index]) {
          map[slot.id] = publishers[index];
        }
      });
    }

    return map;
  }, [template.cameraSlots, cameraSlots, participants, slotAssignments, onSceneIds]);

  // Get custom style for a slot
  const getSlotStyle = (slotId: string): CameraSlotStyle | undefined => {
    return cameraSlotStyles.find(s => s.slotId === slotId);
  };

  // Render background
  const renderBackground = () => {
    const { type, value } = template.background;
    switch (type) {
      case 'color':
        return <div className="absolute inset-0" style={{ backgroundColor: value }} />;
      case 'image':
        return <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${value})` }} />;
      case 'video':
        return <video className="absolute inset-0 w-full h-full object-cover" src={value} autoPlay loop muted playsInline />;
      default:
        return <div className={cn('absolute inset-0', isDark ? 'bg-gray-900' : 'bg-slate-100')} />;
    }
  };

  // Check if a participant has their mic muted
  const isParticipantMicMuted = (participantIdentity: string | undefined): boolean => {
    if (!participantIdentity) return false;
    const audioTrack = audioTracks.find(t => t.participant?.identity === participantIdentity);
    // If no audio track or track is muted
    return !audioTrack || audioTrack.publication?.isMuted === true;
  };

  // Check if a participant has their camera muted
  const isParticipantCameraMuted = (participantIdentity: string | undefined): boolean => {
    if (!participantIdentity) return false;
    const videoTrack = videoTracks.find(t =>
      t.participant?.identity === participantIdentity &&
      t.source === Track.Source.Camera
    );
    // If no video track or track is muted
    return !videoTrack || videoTrack.publication?.isMuted === true;
  };

  // Render a single camera slot
  const renderCameraSlot = (slot: CameraSlot) => {
    const track = slotTrackMap[slot.id];
    const participant = slotParticipantMap[slot.id];
    const hasParticipant = !!participant;
    const customStyle = getSlotStyle(slot.id);

    // Get participant info for status indicators - use participant from map if no video track
    const participantIdentity = track?.participant?.identity || participant?.identity;
    const isMicMuted = isParticipantMicMuted(participantIdentity);
    const isCameraMuted = isParticipantCameraMuted(participantIdentity);

    // Track exists AND camera is not muted — otherwise show avatar/initials placeholder
    const hasVideo = !!track && !isCameraMuted;

    const borderColor = customStyle?.borderColor || slot.borderColor || '#22d3ee';
    const borderWidth = customStyle?.borderWidth || slot.borderWidth || 3;

    const scaledWidth = slot.width * cameraScale;
    const scaledHeight = slot.height * cameraScale;
    const adjustedX = slot.x + (slot.width - scaledWidth) / 2;
    const adjustedY = slot.y + (slot.height - scaledHeight) / 2;

    const slotStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${adjustedX}%`,
      top: `${adjustedY}%`,
      width: `${scaledWidth}%`,
      height: `${scaledHeight}%`,
      zIndex: slot.zIndex,
      borderRadius: slot.borderRadius ? `${slot.borderRadius * cameraScale}px` : '8px',
      border: `${borderWidth}px solid ${borderColor}`,
      boxShadow: `0 0 20px ${borderColor}40`,
      overflow: 'hidden',
    };

    if (isPreview) {
      return (
        <div key={slot.id} style={slotStyle} className={cn('flex items-center justify-center', isDark ? 'bg-gray-800' : 'bg-slate-200')}>
          <div className={cn('text-center', isDark ? 'text-white' : 'text-slate-700')}>
            <VideoOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <span className="text-sm opacity-70">{slot.label || t('webinars.scenes.camera', 'Camera') + ` ${slot.id}`}</span>
          </div>
        </div>
      );
    }

    // Show slot if has video, has participant (even without video), or placeholders enabled
    if (!hasVideo && !hasParticipant && !showPlaceholders) return null;

    // Get display name: custom name > participant name > slot label
    const participantId = track?.participant?.identity || participant?.identity;
    const displayName = participantId && speakerDisplayNames[participantId]
      ? speakerDisplayNames[participantId]
      : track?.participant?.name || participant?.name || slot.label;

    // Position classes for the name label
    const namePositionClasses = {
      'top-left': 'top-2 left-2',
      'top-center': 'top-2 left-1/2 -translate-x-1/2',
      'top-right': 'top-2 right-2',
      'bottom-left': 'bottom-2 left-2',
      'bottom-center': 'bottom-2 left-1/2 -translate-x-1/2',
      'bottom-right': 'bottom-2 right-2',
    };

    // Determine if we should show participant info (when connected but camera off)
    const showParticipantInfo = hasParticipant && !hasVideo;

    // Get avatar and initials for camera-off placeholder
    const participantAvatar = showParticipantInfo ? getParticipantAvatar(participant?.metadata) : null;
    const participantInitials = showParticipantInfo ? getInitials(displayName) : '';

    return (
      <div key={slot.id} style={slotStyle} className={cn(isDark ? 'bg-gray-900' : 'bg-slate-100')}>
        {hasVideo ? (
          <VideoTrack trackRef={track} className="w-full h-full object-cover" />
        ) : showParticipantInfo ? (
          // Participant connected but camera is off — show avatar or initials
          <div className={cn('w-full h-full flex items-center justify-center', isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-slate-200 to-slate-300')}>
            {participantAvatar ? (
              <img
                src={participantAvatar}
                alt={displayName || ''}
                className="w-1/3 max-w-[120px] aspect-square rounded-full object-cover border-2"
                style={{ borderColor: borderColor }}
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div
              className={cn(
                'flex items-center justify-center rounded-full aspect-square text-white font-bold select-none',
                participantAvatar ? 'hidden' : '',
              )}
              style={{
                width: '33%',
                maxWidth: '120px',
                fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                backgroundColor: borderColor,
              }}
            >
              {participantInitials}
            </div>
          </div>
        ) : showPlaceholders ? (
          <div className={cn('w-full h-full flex items-center justify-center', isDark ? 'bg-gray-800' : 'bg-slate-200')}>
            <div className={cn('text-center', isDark ? 'text-white' : 'text-slate-700')}>
              <VideoOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
            </div>
          </div>
        ) : null}
        {/* Show name when there's video OR when participant is connected (camera off) */}
        {speakerNameStyle.showNames && displayName && (hasVideo || showParticipantInfo) && (
          <div
            className={cn('absolute', namePositionClasses[speakerNameStyle.position])}
            style={{
              fontSize: `${speakerNameStyle.fontSize}px`,
              color: speakerNameStyle.fontColor,
              backgroundColor: speakerNameStyle.backgroundColor,
              padding: `${speakerNameStyle.padding}px ${speakerNameStyle.padding * 2}px`,
              borderRadius: `${speakerNameStyle.borderRadius}px`,
            }}
          >
            {displayName}
          </div>
        )}
        {/* Mic/Camera mute indicators - show when participant is connected */}
        {(hasVideo || showParticipantInfo) && (isMicMuted || isCameraMuted) && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {isMicMuted && (
              <div className="bg-red-500/80 rounded-full p-1.5" title="Mic muted">
                <MicOff className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            {isCameraMuted && (
              <div className="bg-red-500/80 rounded-full p-1.5" title="Camera off">
                <VideoOff className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render template overlay
  const renderOverlay = (overlay: SceneOverlay) => {
    const isVisible = overlayVisibility
      ? overlayVisibility[overlay.id] ?? overlay.isVisible
      : overlay.isVisible;
    if (!isVisible) return null;

    const overlayStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${overlay.x}%`,
      top: `${overlay.y}%`,
      width: `${overlay.width}%`,
      height: `${overlay.height}%`,
      zIndex: overlay.zIndex,
    };

    const animationClass = overlay.animation === 'fade-in'
      ? 'animate-fade-in'
      : overlay.animation === 'slide-in'
        ? 'animate-slide-in-bottom'
        : overlay.animation === 'bounce'
          ? 'animate-bounce'
          : '';

    switch (overlay.type) {
      case 'image':
      case 'gif':
        return (
          <div key={overlay.id} style={overlayStyle} className={cn('overflow-hidden', animationClass)}>
            <img src={overlay.url} alt={overlay.name} className="w-full h-full object-contain" />
          </div>
        );
      case 'text':
        return (
          <div
            key={overlay.id}
            style={{
              ...overlayStyle,
              fontSize: overlay.fontSize ? `${overlay.fontSize}px` : undefined,
              color: overlay.fontColor || '#ffffff',
              fontFamily: overlay.fontFamily || 'inherit',
              backgroundColor: overlay.backgroundColor || 'transparent',
              padding: overlay.padding ? `${overlay.padding}px` : undefined,
            }}
            className={cn('flex items-center justify-center', animationClass)}
          >
            {overlay.text}
          </div>
        );
      default:
        return null;
    }
  };

  // Render corner image
  const renderCornerImage = (corner: CornerImage) => {
    if (!corner.isVisible || !corner.url) return null;

    const position = CORNER_POSITIONS[corner.corner];

    return (
      <div
        key={corner.id}
        className={cn('absolute z-50', position.className)}
        style={{
          width: `${corner.width}%`,
          height: `${corner.height}%`,
        }}
      >
        <img
          src={corner.url}
          alt={corner.name}
          className="w-full h-full object-contain drop-shadow-lg"
        />
      </div>
    );
  };

  // Render active text banner
  const renderTextBanner = () => {
    if (!activeTextBanner || !activeTextBanner.isVisible) return null;

    const positionClass = BANNER_POSITIONS[activeTextBanner.position];
    const animationClass = ANIMATION_CLASSES[activeTextBanner.animationIn];

    return (
      <div
        className={cn('absolute z-[60]', positionClass, animationClass)}
        style={{
          backgroundColor: activeTextBanner.backgroundColor,
          color: activeTextBanner.textColor,
          fontSize: `${activeTextBanner.fontSize}px`,
          fontWeight: activeTextBanner.fontWeight,
          padding: `${activeTextBanner.padding}px ${activeTextBanner.padding * 2}px`,
          borderRadius: `${activeTextBanner.borderRadius}px`,
          maxWidth: '90%',
          textAlign: 'center',
        }}
      >
        {activeTextBanner.text}
      </div>
    );
  };

  // Check if we have screen share tracks but no screenshare slots
  const hasUnmappedScreenShare = screenShareTracks.length > 0 && screenShareSlots.length === 0;

  // Render fallback screen share when there are no screenshare slots
  const renderFallbackScreenShare = () => {
    if (!hasUnmappedScreenShare || isPreview) return null;

    const screenShareTrack = screenShareTracks[0];
    if (!screenShareTrack) return null;

    // Render screen share as main content (70% width, centered) with cameras as small thumbnails
    return (
      <div
        className="absolute z-[25]"
        style={{
          left: '15%',
          top: '5%',
          width: '70%',
          height: '90%',
          borderRadius: '12px',
          border: '3px solid #6366f1',
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
          overflow: 'hidden',
        }}
      >
        <VideoTrack trackRef={screenShareTrack} className={cn('w-full h-full object-contain', isDark ? 'bg-black' : 'bg-slate-100')} />
        <div className={cn('absolute bottom-2 left-2 px-2 py-1 rounded text-sm flex items-center gap-1', isDark ? 'bg-black/60 text-white' : 'bg-slate-900/60 text-white')}>
          <Monitor className="w-3 h-3" />
          Screen Share
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        isDark ? 'bg-black' : 'bg-slate-50',
        isFullscreen ? 'w-screen h-screen' : 'aspect-video',
        className
      )}
    >
      {/* Background Layer */}
      {renderBackground()}

      {/* Fallback Screen Share Layer (when no screenshare slot in template) */}
      {renderFallbackScreenShare()}

      {/* Camera Slots Layer - adjusted when screen share is active */}
      {hasUnmappedScreenShare ? (
        // When screen sharing without dedicated slot, show cameras as small thumbnails on the side
        cameraSlots.slice(0, 3).map((slot, index) => {
          const track = slotTrackMap[slot.id];
          const hasVideo = !!track;
          const participantIdentity = track?.participant?.identity;
          const participant = participants.find(p => p.identity === participantIdentity);
          const isMicMuted = isParticipantMicMuted(participantIdentity);
          const isCameraMuted = isParticipantCameraMuted(participantIdentity);
          const hasParticipant = !!participant;

          // Resolve display name: custom > participant.name > slot label
          const thumbDisplayName = participantIdentity && speakerDisplayNames[participantIdentity]
            ? speakerDisplayNames[participantIdentity]
            : track?.participant?.name || participant?.name || slot.label;

          return (
            <div
              key={slot.id}
              className="absolute z-[30]"
              style={{
                right: '2%',
                top: `${5 + index * 32}%`,
                width: '12%',
                height: '20%',
                borderRadius: '8px',
                border: '2px solid #22d3ee',
                boxShadow: '0 0 15px rgba(34, 211, 238, 0.3)',
                overflow: 'hidden',
              }}
            >
              {hasVideo ? (
                <VideoTrack trackRef={track} className="w-full h-full object-cover" />
              ) : hasParticipant ? (
                <div className={cn('w-full h-full flex items-center justify-center', isDark ? 'bg-gray-800' : 'bg-slate-200')}>
                  <VideoOff className="w-4 h-4 text-red-400" />
                </div>
              ) : showPlaceholders ? (
                <div className={cn('w-full h-full flex items-center justify-center', isDark ? 'bg-gray-800' : 'bg-slate-200')}>
                  <VideoOff className={cn('w-4 h-4', isDark ? 'text-white/50' : 'text-slate-500')} />
                </div>
              ) : null}
              {/* Speaker name for thumbnail */}
              {speakerNameStyle.showNames && thumbDisplayName && (hasVideo || hasParticipant) && (
                <div
                  className="absolute bottom-0 left-0 right-0 text-center truncate"
                  style={{
                    fontSize: `${Math.max(speakerNameStyle.fontSize * 0.6, 9)}px`,
                    color: speakerNameStyle.fontColor,
                    backgroundColor: speakerNameStyle.backgroundColor,
                    padding: '1px 4px',
                  }}
                >
                  {thumbDisplayName}
                </div>
              )}
              {/* Mic/Camera mute indicators for thumbnail */}
              {(hasVideo || hasParticipant) && (isMicMuted || isCameraMuted) && (
                <div className="absolute top-1 right-1 flex items-center gap-0.5">
                  {isMicMuted && (
                    <div className="bg-red-500/80 rounded-full p-1" title="Mic muted">
                      <MicOff className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  {isCameraMuted && (
                    <div className="bg-red-500/80 rounded-full p-1" title="Camera off">
                      <VideoOff className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      ) : (
        // Normal rendering when no screen share or template has screenshare slot
        template.cameraSlots.map(renderCameraSlot)
      )}

      {/* Template Overlays Layer */}
      {template.overlays.map(renderOverlay)}

      {/* Corner Images Layer */}
      {cornerImages.map(renderCornerImage)}

      {/* Active Text Banner */}
      {renderTextBanner()}

      {/* Remote Audio Tracks (hidden) */}
      {!isPreview && remoteAudioTracks.map((trackRef) => (
        <AudioTrack
          key={trackRef.publication?.trackSid || trackRef.participant?.identity}
          trackRef={trackRef}
          volume={1}
        />
      ))}
    </div>
  );
}

/**
 * Scene Compositor with loading state
 */
export function SceneCompositorWithLoading({
  template,
  isLoading,
  loadingMessage,
  ...props
}: SceneCompositorProps & {
  isLoading?: boolean;
  loadingMessage?: string;
}) {
  const { isDark: isDarkLoading } = useTheme();

  if (isLoading) {
    return (
      <div className={cn('relative overflow-hidden aspect-video flex items-center justify-center', isDarkLoading ? 'bg-black' : 'bg-slate-50', props.className)}>
        <div className={cn('text-center', isDarkLoading ? 'text-white' : 'text-slate-900')}>
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" />
          <span>{loadingMessage || 'Loading...'}</span>
        </div>
      </div>
    );
  }

  return <SceneCompositor template={template} {...props} />;
}

export default SceneCompositor;
